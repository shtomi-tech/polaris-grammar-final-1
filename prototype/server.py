# -*- coding: utf-8 -*-
"""
英語4択演習サイト — FastAPI サーバ。

LLM・API課金なし。確定済み500問を、生徒ごとの進捗にもとづいて適応的に出題する。

出題ロジック（セッション = メモリ上のキュー）:
  begin → ①前回までの未克服問（復習）があれば最初の1セットとして出題、無ければ
          ②未出題からランダム10問。
  answer → 1問採点し、結果＋次問を返す。1セット出し切ったら、そのセットで間違えた問を
          シャッフルして全正解まで再出題（セット末の間違い直し）。
  next_set → 次の未出題10問（無ければ未克服問のみ）。全克服でレベル完了。
克服＝1回正解。XPは克服問の weight 総和（単調増加）。選択肢は毎回シャッフルし、採点は正解の語で行う。

起動: py run.py → http://127.0.0.1:8000
"""
from __future__ import annotations

import random
import uuid
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

import data
import grammar
import history
import homework

app = FastAPI(title="英語4択演習サイト")
STATIC = Path(__file__).parent / "static"
app.mount("/static", StaticFiles(directory=STATIC), name="static")
history.init_db()

SET_SIZE = 10
_SESSIONS: dict[str, dict] = {}


# ---------- 進捗アクセス（本登録 / ゲスト を吸収） ----------
def _served_qids(s: dict) -> set[str]:
    if s["guest"]:
        return set(s["gstate"]["served"])
    return {qid for qid, r in history.state_for_level(s["student"], s["level"]).items()
            if r["served"]}


def _review_qids(s: dict) -> list[str]:
    unit = s["unit"]

    def in_unit(qid: str) -> bool:
        return not unit or data.QUESTIONS[qid]["unit"] == unit

    if not s.get("level"):
        return []
    if s["guest"]:
        return [q for q in s["gstate"]["review"]
                if data.QUESTIONS[q]["level"] == s["level"] and in_unit(q)]
    return [qid for qid, r in history.state_for_level(s["student"], s["level"]).items()
            if r["review"] and in_unit(qid)]


def _record(s: dict, qid: str, correct: bool, source: str = "app",
            choice: str | None = None) -> dict:
    if s["guest"]:
        g = s["gstate"]
        g["served"].add(qid)
        mastered_now = False
        if correct:
            if qid not in g["mastered"]:
                g["mastered"].add(qid)
                mastered_now = True
            g["review"].discard(qid)
        else:
            g["review"].add(qid)
        return {"mastered_now": mastered_now,
                "xp_delta": data.QUESTIONS[qid]["weight"] if mastered_now else 0}
    return history.record(s["student"], qid, correct, source, choice=choice)


def _xp(s: dict) -> int:
    if s["guest"]:
        return sum(data.QUESTIONS[q]["weight"] for q in s["gstate"]["mastered"])
    return history.xp(s["student"])


def _profile(s: dict) -> dict:
    if s["guest"]:
        rank = data.rank_for(_xp(s))
        per = []
        g = s["gstate"]
        for lv in data.LEVEL_ORDER:
            qs = {q["id"] for q in data.BY_LEVEL[lv]}
            mastered = len(g["mastered"] & qs)
            per.append({"key": lv, "label": data.LEVEL_LABELS[lv],
                        "total": len(qs), "mastered": mastered,
                        "review": len(set(g["review"]) & qs),
                        "served": len(g["served"] & qs),
                        "complete": mastered >= len(qs)})
        return {"student": "(ゲスト)", "rank": rank, "levels": per}
    return history.profile(s["student"])


# ---------- セッション / 出題 ----------
def _new_guest_state() -> dict:
    return {"served": set(), "mastered": set(), "review": set()}


def _serve(s: dict, qid: str) -> dict:
    q = data.QUESTIONS[qid]
    choices = q["choices"][:]
    random.shuffle(choices)
    s["current"] = qid
    fixing = s["phase"] == "fix"
    if fixing:
        pos, total = None, None
    else:
        pos = s["idx"] + 1
        total = len(s["main_queue"])
    return {
        "qid": qid, "number": q["number"], "level_label": q["level_label"],
        "level": q["level"], "unit": q["unit"], "stem": q["stem"], "choices": choices,
        "grammar_key": grammar.key_for_unit(q["unit"]),
        "set_kind": s["set_kind"], "fixing": fixing, "pos": pos, "total": total,
        # 解答中に確認できる単元の文法ポイント（答えそのものではなく原則。数学の公式表示と同趣旨）
        "point": (q.get("rich") or {}).get("point"),
    }


def _build_fresh(s: dict) -> list[str]:
    if s.get("review_only") or not s.get("level"):
        return []
    served = _served_qids(s)
    pool = [q["id"] for q in data.BY_LEVEL[s["level"]]
            if q["id"] not in served
            and (not s["unit"] or q["unit"] == s["unit"])]
    random.shuffle(pool)
    return pool[:SET_SIZE]


def _start_set(s: dict, qids: list[str], kind: str) -> dict:
    s["main_queue"] = qids
    s["idx"] = 0
    s["set_wrong"] = []
    s["fix_queue"] = []
    s["phase"] = "main"
    s["set_kind"] = kind
    return _serve(s, qids[0])


class BeginReq(BaseModel):
    student: str = ""
    level: str
    unit: str | None = None


@app.post("/api/begin")
def begin(req: BeginReq):
    if req.level not in data.BY_LEVEL:
        raise HTTPException(400, "未知のレベル")
    guest = not req.student.strip()
    sid = uuid.uuid4().hex
    s = {"student": req.student.strip(), "guest": guest, "level": req.level,
         "unit": (req.unit or None), "gstate": _new_guest_state() if guest else None,
         "current": None}
    _SESSIONS[sid] = s
    if not guest:
        history.add_student(s["student"])

    review = _review_qids(s)
    if review:
        random.shuffle(review)
        q = _start_set(s, review[:SET_SIZE], "review")
    else:
        fresh = _build_fresh(s)
        if not fresh:
            return {"session": sid, "profile": _profile(s),
                    "level_done": True, "question": None}
        q = _start_set(s, fresh, "fresh")
    return {"session": sid, "profile": _profile(s), "level_done": False, "question": q}


class AnswerReq(BaseModel):
    session: str
    choice: str


@app.post("/api/answer")
def answer(req: AnswerReq):
    s = _SESSIONS.get(req.session)
    if not s or not s.get("current"):
        raise HTTPException(400, "セッションが無効です")
    qid = s["current"]
    q = data.QUESTIONS[qid]
    correct = req.choice == q["answer_text"]

    before = _xp(s)
    rec = _record(s, qid, correct, source="app", choice=(None if correct else req.choice))
    after = _xp(s)
    rank_before = data.rank_for(before)
    rank_after = data.rank_for(after)
    rank_up = rank_after["index"] > rank_before["index"]

    # --- 次問を決める ---
    nxt = None
    set_complete = False
    if s["phase"] == "main":
        if not correct:
            s["set_wrong"].append(qid)
        s["idx"] += 1
        if s["idx"] < len(s["main_queue"]):
            nxt = s["main_queue"][s["idx"]]
        elif s["set_wrong"]:
            s["phase"] = "fix"
            s["fix_queue"] = s["set_wrong"][:]
            random.shuffle(s["fix_queue"])
            s["set_wrong"] = []
            nxt = s["fix_queue"].pop(0)
        else:
            set_complete = True
    else:  # fix：正解するまで巡回
        if not correct:
            s["fix_queue"].append(qid)
        if s["fix_queue"]:
            nxt = s["fix_queue"].pop(0)
        else:
            set_complete = True

    out = {
        "correct": correct,
        "answer_text": q["answer_text"],
        "explanation": q["explanation"],
        "rich": q.get("rich"),
        "chosen": req.choice,
        "xp_delta": rec["xp_delta"],
        "mastered_now": rec["mastered_now"],
        "rank": rank_after,
        "rank_up": rank_up,
        "profile": _profile(s),
        "set_complete": set_complete,
    }
    if set_complete:
        # 次セットに素材があるか（未出題 or 未克服）を知らせる
        out["has_more"] = False if s.get("review_only") else (bool(_build_fresh(s)) or bool(_review_qids(s)))
        out["question"] = None
    else:
        out["question"] = _serve(s, nxt)
    return out


class SessionReq(BaseModel):
    session: str


@app.post("/api/next_set")
def next_set(req: SessionReq):
    s = _SESSIONS.get(req.session)
    if not s:
        raise HTTPException(400, "セッションが無効です")
    if s.get("review_only"):
        return {"profile": _profile(s), "level_done": True, "question": None}
    fresh = _build_fresh(s)
    if fresh:
        return {"profile": _profile(s), "level_done": False,
                "question": _start_set(s, fresh, "fresh")}
    review = _review_qids(s)
    if review:
        random.shuffle(review)
        return {"profile": _profile(s), "level_done": False,
                "question": _start_set(s, review[:SET_SIZE], "review")}
    return {"profile": _profile(s), "level_done": True, "question": None}


# ---------- 生徒・プロフィール ----------
@app.get("/api/meta")
def meta():
    return {"levels": data.levels_meta(),
            "ranks": [{"threshold": t, "name": n} for t, n in data.RANKS],
            "total_max_xp": data.TOTAL_MAX_XP}


@app.get("/api/students")
def students():
    return {"students": history.list_students()}


class StudentReq(BaseModel):
    student: str


@app.post("/api/register")
def register(req: StudentReq):
    name = req.student.strip()
    if not name:
        raise HTTPException(400, "生徒名が必要です")
    history.add_student(name)
    return {"students": history.list_students()}


class RenameReq(BaseModel):
    old: str
    new: str


@app.post("/api/student/rename")
def student_rename(req: RenameReq):
    """生徒を改名する（進捗・誤答も新名へ移す）。"""
    old, new = req.old.strip(), req.new.strip()
    if not old or not new:
        raise HTTPException(400, "新旧の生徒名が必要です")
    history.rename_student(old, new)
    return {"students": history.list_students()}


@app.post("/api/student/delete")
def student_delete(req: StudentReq):
    """生徒を削除する（進捗・誤答もすべて消す）。"""
    name = req.student.strip()
    if not name:
        raise HTTPException(400, "生徒名が必要です")
    history.delete_student(name)
    return {"students": history.list_students()}


@app.post("/api/profile")
def profile(req: StudentReq):
    if not req.student.strip():
        raise HTTPException(400, "生徒名が必要です")
    return history.profile(req.student.strip())


@app.post("/api/weakness")
def weakness(req: StudentReq):
    if not req.student.strip():
        raise HTTPException(400, "生徒名が必要です")
    return history.weakness(req.student.strip())


@app.post("/api/unit_progress")
def unit_progress(req: StudentReq):
    """レベル×単元の克服状況（クリアチェッカー／先生ヒートマップ用）。ゲストは全未克服。"""
    return {"levels": history.unit_progress(req.student.strip())}


def _grammar_origins(student: str) -> dict[str, list[dict]]:
    """文法ページキーごとに、対応するレベル×単元の進捗をまとめる。"""
    grouped: dict[str, list[dict]] = {key: [] for key in grammar.ORDER}
    for lv in history.unit_progress(student.strip()):
        for u in lv["units"]:
            key = grammar.key_for_unit(u["unit"])
            if not key or key not in grouped:
                continue
            grouped[key].append({
                "level": lv["key"], "level_label": lv["label"],
                "unit": u["unit"], "total": u["total"],
                "mastered": u["mastered"], "review": u["review"],
                "complete": u["complete"],
            })
    return grouped


@app.post("/api/grammar")
def grammar_list(req: StudentReq):
    """文法確認ページ一覧。生徒があれば進捗と連動して返す。"""
    origins = _grammar_origins(req.student)
    pages = []
    for key in grammar.ORDER:
        page = grammar.PAGES[key]
        os = origins.get(key, [])
        total = sum(x["total"] for x in os)
        mastered = sum(x["mastered"] for x in os)
        review = sum(x["review"] for x in os)
        pages.append({
            "key": key, "title": page["title"], "summary": page["summary"],
            "total": total, "mastered": mastered, "review": review,
            "priority": review > 0 or (total > 0 and mastered < total),
            "origins": os,
        })
    return {"student": req.student.strip(), "pages": pages}


class GrammarDetailReq(BaseModel):
    student: str = ""
    key: str


@app.post("/api/grammar/detail")
def grammar_detail(req: GrammarDetailReq):
    key = req.key.strip()
    page = grammar.PAGES.get(key)
    if not page:
        raise HTTPException(404, "文法ページが見つかりません")
    origins = _grammar_origins(req.student).get(key, [])
    return {"student": req.student.strip(), "key": key, "page": page,
            "origins": origins}


@app.post("/api/stats")
def stats(req: StudentReq):
    if not req.student.strip():
        raise HTTPException(400, "生徒名が必要です")
    return history.stats(req.student.strip())


@app.post("/api/review/due")
def review_due(req: StudentReq):
    return history.due_review(req.student.strip())


class ReviewStartReq(BaseModel):
    student: str
    qids: list[str] = []


@app.post("/api/review/start")
def review_start(req: ReviewStartReq):
    student = req.student.strip()
    if not student:
        raise HTTPException(400, "生徒名が必要です")
    qids = [q for q in req.qids if q in data.QUESTIONS]
    if not qids:
        qids = history.due_review_qids(student, SET_SIZE)
    if not qids:
        return {"session": "", "profile": history.profile(student),
                "level_done": True, "question": None}
    sid = uuid.uuid4().hex
    s = {"student": student, "guest": False, "level": None, "unit": None,
         "gstate": None, "current": None, "review_only": True}
    _SESSIONS[sid] = s
    q = _start_set(s, qids[:SET_SIZE], "review")
    return {"session": sid, "profile": _profile(s), "level_done": False, "question": q}


# ---------- 紙ベース結果の取り込み（先生専用） ----------
class PaperReq(BaseModel):
    student: str
    level: str
    from_no: int
    to_no: int
    wrong: list[int] = []


@app.post("/api/paper")
def paper(req: PaperReq):
    student = req.student.strip()
    if not student:
        raise HTTPException(400, "生徒名が必要です")
    if req.level not in data.BY_LEVEL:
        raise HTTPException(400, "未知のレベル")
    lo, hi = sorted((req.from_no, req.to_no))
    by_no = {q["number"]: q for q in data.BY_LEVEL[req.level]}
    wrong = set(req.wrong)
    applied = mastered_gain = wrong_count = 0
    before = history.xp(student)
    for n in range(lo, hi + 1):
        q = by_no.get(n)
        if not q:
            continue
        is_correct = n not in wrong
        rec = history.record(student, q["id"], is_correct, source="paper")
        applied += 1
        if rec["mastered_now"]:
            mastered_gain += 1
        if not is_correct:
            wrong_count += 1
    after = history.xp(student)
    return {"applied": applied, "newly_mastered": mastered_gain,
            "wrong": wrong_count, "xp_gained": after - before,
            "profile": history.profile(student)}


@app.get("/api/homework")
def homework_print(student: str, level: str | None = None):
    """弱点（未克服）の宿題プリントHTMLを返す（新しいタブで開いて印刷する）。"""
    name = student.strip()
    if not name:
        raise HTTPException(400, "生徒名が必要です")
    qids = history.review_qids(name, level or None)
    return HTMLResponse(homework.build_homework_html(name, qids))


@app.get("/")
def index():
    return FileResponse(STATIC / "index.html")
