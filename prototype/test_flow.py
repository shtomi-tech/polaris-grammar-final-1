# -*- coding: utf-8 -*-
"""バックエンドの主要フローをUIなしで検証（fastapi TestClient）。

確認：begin→answer の出題ループ、克服=1回正解、セット末の間違い直し、XP単調増加、
ランク、紙ベース取り込み、復習の次回冒頭出題、弱点ビュー。
"""
import os
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

# テスト用に隔離したDBを使う
os.environ.setdefault("DBNAME", "test_history.db")
from pathlib import Path
import history
history.DB = Path(__file__).parent / "test_history.db"
if history.DB.exists():
    history.DB.unlink()

from fastapi.testclient import TestClient
import server
server.history.init_db()
import data

c = TestClient(server.app)


def begin(student, level, unit=None):
    r = c.post("/api/begin", json={"student": student, "level": level, "unit": unit})
    assert r.status_code == 200, r.text
    return r.json()


def answer(sid, choice):
    r = c.post("/api/answer", json={"session": sid, "choice": choice})
    assert r.status_code == 200, r.text
    return r.json()


def correct_choice(q):
    qid = next(x["id"] for x in data.BY_LEVEL_seq if x["number"] == q["number"]
               and x["level_label"] == q["level_label"])
    return data.QUESTIONS[qid]["answer_text"]


# data に番号→正解を引くヘルパが無いので作る
data.BY_LEVEL_seq = [q for qs in data.BY_LEVEL.values() for q in qs]


def ans_text(level_label, number):
    return next(q["answer_text"] for q in data.BY_LEVEL_seq
                if q["level_label"] == level_label and q["number"] == number)


print("=== 1. ゲスト：全問正解で1セット完了 ===")
b = begin("", "chokyu_super")
sid = b["session"]
q = b["question"]
assert q and b["profile"]["rank"]["name"] == "駆け出し"
steps = 0
seen_numbers = []
while q:
    seen_numbers.append(q["number"])
    a = answer(sid, ans_text(q["level_label"], q["number"]))
    steps += 1
    if a["set_complete"]:
        print(f"  セット完了 steps={steps} XP={a['profile']['rank']['xp']} 克服={a['profile']['levels'][0]['mastered']}")
        assert a["profile"]["levels"][0]["mastered"] == 10
        break
    q = a["question"]
assert steps == 10, steps
assert len(set(seen_numbers)) == 10  # 重複なし

print("=== 2. 本登録：1問わざと誤答→セット末の間違い直しが回る ===")
b = begin("テスト太郎", "shokyu")
sid = b["session"]
q = b["question"]
wrong_done = False
fixing_seen = False
guard = 0
first_wrong_num = q["number"]
while q:
    guard += 1
    assert guard < 60
    if not wrong_done:
        # 最初の1問だけ誤答（正解でない選択肢を選ぶ）
        wrong = next(ch for ch in q["choices"] if ch != ans_text(q["level_label"], q["number"]))
        a = answer(sid, wrong)
        wrong_done = True
        assert a["correct"] is False
    else:
        a = answer(sid, ans_text(q["level_label"], q["number"]))
        if a.get("question") and a["question"]["fixing"]:
            fixing_seen = True
    if a["set_complete"]:
        prof = a["profile"]["levels"][1]
        print(f"  完了 guard={guard} fixing_seen={fixing_seen} mastered={prof['mastered']} review={prof['review']}")
        assert fixing_seen, "間違い直し(fix)フェーズが出ていない"
        # 最終的に全部正解→克服10、復習0
        assert prof["mastered"] == 10 and prof["review"] == 0
        break
    q = a["question"]

print("=== 3. XP単調増加：同じ問を後で誤答してもXPは減らない ===")
xp_before = history.xp("テスト太郎")
# shokyu 既出を再度 begin → 復習が無ければ fresh。ここでは直接 record で誤答を当てる
qid = data.BY_LEVEL["shokyu"][0]["id"]
history.record("テスト太郎", qid, correct=False, source="app")
xp_after = history.xp("テスト太郎")
print(f"  XP {xp_before}→{xp_after}（減らない）, その問は復習復帰")
assert xp_after == xp_before
w = c.post("/api/weakness", json={"student": "テスト太郎"}).json()
assert any(r["qid"] == qid for r in w["review"]), "誤答が復習リストに無い"

print("=== 4. 次回冒頭：復習問が最初のセットに出る ===")
b = begin("テスト太郎", "shokyu")
assert b["question"]["set_kind"] == "review", b["question"]["set_kind"]
print(f"  begin の set_kind={b['question']['set_kind']} ✓")

print("=== 5. 紙ベース取り込み：上級 1〜20、#3,#7 を誤答 ===")
r = c.post("/api/paper", json={"student": "テスト太郎", "level": "jokyu",
                               "from_no": 1, "to_no": 20, "wrong": [3, 7]})
p = r.json()
print(f"  applied={p['applied']} newly_mastered={p['newly_mastered']} wrong={p['wrong']} xp_gained={p['xp_gained']}")
assert p["applied"] == 20 and p["wrong"] == 2 and p["newly_mastered"] == 18
# 上級は weight=4 → 18問克服で +72
assert p["xp_gained"] == 18 * 4
jokyu = next(l for l in p["profile"]["levels"] if l["key"] == "jokyu")
assert jokyu["mastered"] == 18 and jokyu["review"] == 2

print("=== 6. ランク：全500問克服で最高ランク（紙で一括投入して確認）===")
for lv in data.LEVEL_ORDER:
    n = len(data.BY_LEVEL[lv])
    c.post("/api/paper", json={"student": "満点君", "level": lv,
                               "from_no": 1, "to_no": n, "wrong": []})
prof = history.profile("満点君")
print(f"  XP={prof['rank']['xp']} rank={prof['rank']['name']} is_max={prof['rank']['is_max']}")
assert prof["rank"]["xp"] == data.TOTAL_MAX_XP
assert prof["rank"]["name"] == "文法マスター" and prof["rank"]["is_max"]
assert all(l["complete"] for l in prof["levels"])

print("=== 7. 誤答した選択肢を記録し、よくある間違え方に出る ===")
b = begin("ミス太郎", "chukyu")
sid = b["session"]
q = b["question"]
# 最初の1問を、特定の誤答選択肢でわざと2回相当…ではなく1回誤答
target_qnum = q["number"]
target_label = q["level_label"]
wrong_choice = next(ch for ch in q["choices"] if ch != ans_text(q["level_label"], q["number"]))
answer(sid, wrong_choice)
w = c.post("/api/weakness", json={"student": "ミス太郎"}).json()
conf = [x for x in w["confusions"] if x["number"] == target_qnum]
print(f"  confusions={len(w['confusions'])} 先頭: {w['confusions'][0]['correct']} ← {w['confusions'][0]['chosen']} ×{w['confusions'][0]['count']}")
assert conf and conf[0]["chosen"] == wrong_choice and conf[0]["count"] == 1
rv = next(r for r in w["review"] if r["number"] == target_qnum)
assert rv["misses"] and rv["misses"][0]["choice"] == wrong_choice
# 紙入力の誤答は choice 不明なので miss には積まれない（confusions は増えない）
c.post("/api/paper", json={"student": "ミス太郎", "level": "jokyu",
                           "from_no": 1, "to_no": 5, "wrong": [2]})
w2 = c.post("/api/weakness", json={"student": "ミス太郎"}).json()
assert len(w2["confusions"]) == len(w["confusions"]), "紙の誤答が confusions に混入している"
print("  紙の誤答は confusions に積まれない ✓")

print("=== 8. 今日の復習・学習記録API ===")
st = c.post("/api/stats", json={"student": "テスト太郎"}).json()
print(f"  stats total_seen={st['total_seen']} accuracy={st['accuracy']} due={st['due_count']}")
assert st["total_seen"] > 0 and st["by_level"]
due = c.post("/api/review/due", json={"student": "テスト太郎"}).json()
print(f"  due_count={due['count']}")
assert due["count"] >= 1 and due["due"][0]["reason"] == "前回誤答"
rs = c.post("/api/review/start", json={"student": "テスト太郎",
                                       "qids": [due["due"][0]["qid"]]}).json()
assert rs["question"] and rs["question"]["set_kind"] == "review"
print("  review/start ✓")

print("=== 9. 文法確認API：一覧・詳細・出題中の対応キー ===")
g = c.post("/api/grammar", json={"student": "テスト太郎"}).json()
titles = [p["title"] for p in g["pages"]]
print(f"  grammar_pages={len(titles)} first={titles[0]}")
assert len(g["pages"]) >= 30 and "be動詞" in titles and "関係詞" in titles and "仮定法" in titles
be = next(p for p in g["pages"] if p["key"] == "be動詞")
assert be["origins"] and be["total"] > 0
gd = c.post("/api/grammar/detail", json={"student": "テスト太郎", "key": "be動詞"}).json()
assert gd["page"]["checkpoints"] and gd["origins"]
b = begin("", "chokyu_super", "be動詞（現在）")
assert b["question"]["grammar_key"] == "be動詞"
assert b["question"]["level"] == "chokyu_super"
all_units = []
for lv in data.LEVEL_ORDER:
    for q in data.BY_LEVEL[lv]:
        if q["unit"] not in all_units:
            all_units.append(q["unit"])
assert all(server.grammar.key_for_unit(u) for u in all_units)
print("  grammar/detail + question.grammar_key ✓")

print("\nALL OK ✅")
