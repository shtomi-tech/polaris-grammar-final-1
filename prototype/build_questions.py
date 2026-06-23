# -*- coding: utf-8 -*-
"""
5つの文法レベルMD（正本）→ questions.json を生成する変換器。

各問を {id, number, level, level_label, weight, unit, stem, choices[4], answer_text,
answer_index, explanation} に構造化する。

設計上の要点:
- 選択肢はアプリ側で毎回シャッフルするので、正誤判定は記号(ア〜エ)でなく「正解の語」(answer_text)が真。
- 紙ベース入力のため number（印刷番号 1〜100）を保持。id は "level-番号" で一意。
"""
from __future__ import annotations

import json
import re
from pathlib import Path

VAULT = Path(__file__).resolve().parents[2]
ENG = VAULT / "英語"
OUT = Path(__file__).parent / "questions.json"
# 詳しい解説の別レイヤー（qid -> {why_correct, why_wrong{選択肢:理由}, point, example, example_ja}）。
# 問題の正本はMD、解説はここで上書き・追記できる。Claude Code が手で執筆する（API不要）。
EXPL = Path(__file__).parent / "explanations.json"

# 文法レベル（やさしい→難しい）。weight = XP加重（克服したときの経験値）。
LEVELS = [
    ("超初級", "chokyu_super", 1),
    ("初級", "shokyu", 2),
    ("中級", "chukyu", 3),
    ("上級", "jokyu", 4),
    ("最上級", "saijokyu", 5),
]

IDEO_SPACE = "　"  # 全角スペース（選択肢区切り）

SEC_RE = re.compile(r"^###\s*◆\s*(.+?)（\d+〜\d+）\s*$")
Q_RE = re.compile(r"^\*\*(\d+)\.\*\*\s*(.+?)\s*$")
ANS_ROW_RE = re.compile(r"^\|\s*(\d+)\s*\|\s*(.+?)\s*\|\s*(.*?)\s*\|\s*$")


def parse_choices(line: str) -> list[dict]:
    """'ア. go　イ. goes　ウ. went　エ. gone' → [{label,text}, ...]"""
    out = []
    for part in line.split(IDEO_SPACE):
        part = part.strip()
        if not part:
            continue
        m = re.match(r"^([ア-ン])[\.．]\s*(.+)$", part)
        if not m:
            raise ValueError(f"選択肢の形式が不正: {part!r} ／ 行: {line!r}")
        out.append({"label": m.group(1), "text": m.group(2).strip()})
    return out


def parse_level(label: str, key: str, weight: int) -> list[dict]:
    path = ENG / f"英文法4択問題_{label}100問.md"
    lines = path.read_text(encoding="utf-8").splitlines()

    # --- 問題編 / 解答編 で分割 ---
    body, ans = [], []
    mode = None
    for ln in lines:
        if ln.strip() == "## 問題編":
            mode = "body"
            continue
        if ln.strip() == "## 解答編":
            mode = "ans"
            continue
        if mode == "body":
            body.append(ln)
        elif mode == "ans":
            ans.append(ln)

    # --- 問題本体 ---
    units: dict[int, str] = {}
    stems: dict[int, str] = {}
    choices: dict[int, list[dict]] = {}
    cur_unit = ""
    i = 0
    while i < len(body):
        ln = body[i]
        sm = SEC_RE.match(ln.strip())
        if sm:
            cur_unit = sm.group(1).strip()
            i += 1
            continue
        qm = Q_RE.match(ln.strip())
        if qm:
            n = int(qm.group(1))
            stem = qm.group(2).strip()
            # 次の非空行が選択肢
            j = i + 1
            while j < len(body) and not body[j].strip():
                j += 1
            choices[n] = parse_choices(body[j].strip())
            stems[n] = stem
            units[n] = cur_unit
            i = j + 1
            continue
        i += 1

    # --- 解答編 ---
    answers: dict[int, str] = {}
    expls: dict[int, str] = {}
    for ln in ans:
        m = ANS_ROW_RE.match(ln)
        if not m:
            continue
        if m.group(1) in ("問", "---") or not m.group(1).isdigit():
            continue
        n = int(m.group(1))
        cell = m.group(2).strip()
        # "ア go" → 記号 + 語。記号を落として語を得る
        parts = cell.split(None, 1)
        answer_text = parts[1].strip() if len(parts) == 2 else cell
        answers[n] = answer_text
        expls[n] = m.group(3).strip()

    nums = sorted(stems)
    assert nums == list(range(1, 101)), f"[{label}] 問題数が想定外: {len(nums)}問 {nums[:5]}..."

    out: list[dict] = []
    for n in nums:
        chs = choices[n]
        assert len(chs) == 4, f"[{label}] 問{n} の選択肢が4つでない: {chs}"
        atext = answers.get(n)
        assert atext is not None, f"[{label}] 問{n} の解答が無い"
        # 正解の語が選択肢のどれと一致するか（シャッフル後の判定はこのテキストで行う）
        idx = next((k for k, c in enumerate(chs) if c["text"] == atext), None)
        if idx is None:
            raise ValueError(
                f"[{label}] 問{n}: 解答『{atext}』が選択肢 {[c['text'] for c in chs]} に一致しない"
            )
        out.append({
            "id": f"{key}-{n:03d}",
            "number": n,
            "level": key,
            "level_label": label,
            "weight": weight,
            "unit": units[n],
            "stem": stems[n],
            "choices": [c["text"] for c in chs],
            "answer_text": atext,
            "answer_index": idx,
            "explanation": expls.get(n, ""),
        })
    return out


def main() -> None:
    expl = {}
    if EXPL.exists():
        expl = json.loads(EXPL.read_text(encoding="utf-8"))

    all_q: list[dict] = []
    summary = []
    rich_total = 0
    for label, key, weight in LEVELS:
        qs = parse_level(label, key, weight)
        for q in qs:
            r = expl.get(q["id"])
            if r:
                q["rich"] = r
                rich_total += 1
        all_q.extend(qs)
        unit_count = len({q["unit"] for q in qs})
        summary.append(f"  {label}: {len(qs)}問 / 単元{unit_count}")
    OUT.write_text(json.dumps(all_q, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"OK: {OUT.name} に {len(all_q)}問を書き出し（詳しい解説 {rich_total}/{len(all_q)} 問）")
    print("\n".join(summary))


if __name__ == "__main__":
    main()
