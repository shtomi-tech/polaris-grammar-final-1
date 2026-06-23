# -*- coding: utf-8 -*-
"""
生徒ごとの学習進捗（SQLite）。

progress 1行 = 生徒×問題 の状態:
  served   : 出題済み（重複防止。一周判定にも使う）
  mastered : 一度でも正解した（XP・カバレッジは単調増加＝一度立ったら下げない）
  review   : 復習リストにいる（誤答で1、正解で0）
  source   : 最後に更新した出所 'app' / 'paper'
ゲスト（生徒名空）はDBに保存しない（呼び出し側でスキップ）。
"""
from __future__ import annotations

import sqlite3
import time
from datetime import datetime, timedelta
from pathlib import Path

import data

DB = Path(__file__).parent / "history.db"
SRS_SCHEDULE_DAYS = [1, 3, 7, 14, 30]


def _conn() -> sqlite3.Connection:
    c = sqlite3.connect(DB)
    c.row_factory = sqlite3.Row
    return c


def init_db() -> None:
    with _conn() as c:
        c.execute(
            """CREATE TABLE IF NOT EXISTS students(
                 name TEXT PRIMARY KEY,
                 created_at TEXT)"""
        )
        c.execute(
            """CREATE TABLE IF NOT EXISTS progress(
                 student TEXT, qid TEXT, level TEXT, number INTEGER,
                 weight INTEGER, unit TEXT,
                 served INTEGER DEFAULT 0, mastered INTEGER DEFAULT 0,
                 review INTEGER DEFAULT 0,
                 seen INTEGER DEFAULT 0, correct INTEGER DEFAULT 0, wrong INTEGER DEFAULT 0,
                 source TEXT, updated_at TEXT,
                 PRIMARY KEY(student, qid))"""
        )
        # 誤答時に選んだ選択肢を集計（よくある間違え方の分析用）。
        c.execute(
            """CREATE TABLE IF NOT EXISTS miss(
                 student TEXT, qid TEXT, choice TEXT, count INTEGER DEFAULT 0,
                 PRIMARY KEY(student, qid, choice))"""
        )


def add_student(name: str) -> None:
    if not name:
        return
    with _conn() as c:
        c.execute(
            "INSERT OR IGNORE INTO students(name, created_at) VALUES(?,?)",
            (name, time.strftime("%Y-%m-%d %H:%M:%S")),
        )


def list_students() -> list[str]:
    with _conn() as c:
        rows = c.execute("SELECT name FROM students ORDER BY created_at").fetchall()
    return [r["name"] for r in rows]


def rename_student(old: str, new: str) -> None:
    """生徒を改名する。進捗(progress)・誤答(miss)も新名へ移す。新名が既にあれば統合する。"""
    old = (old or "").strip()
    new = (new or "").strip()
    if not old or not new or old == new:
        return
    with _conn() as c:
        exists = c.execute("SELECT 1 FROM students WHERE name=?", (new,)).fetchone()
        if exists:
            # 新名が存在＝統合（衝突する行は新名側を残して置換）
            c.execute("UPDATE OR REPLACE progress SET student=? WHERE student=?", (new, old))
            c.execute("UPDATE OR REPLACE miss SET student=? WHERE student=?", (new, old))
            c.execute("DELETE FROM students WHERE name=?", (old,))
        else:
            c.execute("UPDATE students SET name=? WHERE name=?", (new, old))
            c.execute("UPDATE progress SET student=? WHERE student=?", (new, old))
            c.execute("UPDATE miss SET student=? WHERE student=?", (new, old))


def delete_student(name: str) -> None:
    """生徒を名簿から削除し、その生徒の進捗(progress)・誤答(miss)も完全に消す。"""
    name = (name or "").strip()
    if not name:
        return
    with _conn() as c:
        c.execute("DELETE FROM students WHERE name=?", (name,))
        c.execute("DELETE FROM progress WHERE student=?", (name,))
        c.execute("DELETE FROM miss WHERE student=?", (name,))


def _row(c: sqlite3.Connection, student: str, qid: str) -> sqlite3.Row | None:
    return c.execute(
        "SELECT * FROM progress WHERE student=? AND qid=?", (student, qid)
    ).fetchone()


def record(student: str, qid: str, correct: bool, source: str = "app",
           choice: str | None = None) -> dict:
    """1問の結果を反映。返り値に mastered_now（今回新規克服か）と xp_delta。

    - 出題された時点で served=1。
    - 正解：mastered=1（既に1なら据え置き＝単調増加）、review=0。今回初めてmasteredなら xp_delta=weight。
    - 誤答：review=1。mastered は下げない（既に克服済みなら据え置き）。
      choice が渡されていれば、選んだ誤答を miss に集計する（紙入力は choice=None で集計しない）。
    """
    q = data.QUESTIONS[qid]
    add_student(student)
    now = time.strftime("%Y-%m-%d %H:%M:%S")
    with _conn() as c:
        r = _row(c, student, qid)
        if r is None:
            served = mastered = review = seen = corr = wrong = 0
        else:
            served, mastered, review = r["served"], r["mastered"], r["review"]
            seen, corr, wrong = r["seen"], r["correct"], r["wrong"]
        served = 1
        seen += 1
        mastered_now = False
        if correct:
            corr += 1
            if not mastered:
                mastered = 1
                mastered_now = True
            review = 0
        else:
            wrong += 1
            review = 1
        c.execute(
            """INSERT INTO progress(student,qid,level,number,weight,unit,
                 served,mastered,review,seen,correct,wrong,source,updated_at)
               VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)
               ON CONFLICT(student,qid) DO UPDATE SET
                 served=excluded.served, mastered=excluded.mastered, review=excluded.review,
                 seen=excluded.seen, correct=excluded.correct, wrong=excluded.wrong,
                 source=excluded.source, updated_at=excluded.updated_at""",
            (student, qid, q["level"], q["number"], q["weight"], q["unit"],
             served, mastered, review, seen, corr, wrong, source, now),
        )
        if not correct and choice:
            c.execute(
                """INSERT INTO miss(student, qid, choice, count) VALUES(?,?,?,1)
                   ON CONFLICT(student, qid, choice) DO UPDATE SET count=count+1""",
                (student, qid, choice),
            )
    return {"mastered_now": mastered_now, "xp_delta": q["weight"] if mastered_now else 0}


def state_for_level(student: str, level: str) -> dict[str, sqlite3.Row]:
    with _conn() as c:
        rows = c.execute(
            "SELECT * FROM progress WHERE student=? AND level=?", (student, level)
        ).fetchall()
    return {r["qid"]: r for r in rows}


def review_qids(student: str, level: str | None = None) -> list[str]:
    """未克服（復習リスト）の qid を レベル順→番号順 で返す。"""
    sql = "SELECT qid, level, number FROM progress WHERE student=? AND review=1"
    args: list = [student]
    if level:
        sql += " AND level=?"
        args.append(level)
    with _conn() as c:
        rows = c.execute(sql, args).fetchall()
    order = {lv: i for i, lv in enumerate(data.LEVEL_ORDER)}
    rows = sorted(rows, key=lambda r: (order.get(r["level"], 99), r["number"]))
    return [r["qid"] for r in rows]


def due_review(student: str, limit: int = 30) -> dict:
    """今日の復習候補。

    未克服(review=1)を最優先し、克服済みでも最終更新から一定日数が経った問題を
    復習候補にする。間隔は正解回数が増えるほど伸ばす簡易SRS。
    """
    name = (student or "").strip()
    if not name:
        return {"student": "", "count": 0, "due": []}
    now = datetime.now()
    with _conn() as c:
        rows = c.execute(
            """SELECT qid, level, number, unit, mastered, review, correct, wrong, updated_at
               FROM progress WHERE student=? AND (review=1 OR mastered=1)""",
            (name,),
        ).fetchall()
    out = []
    order = {lv: i for i, lv in enumerate(data.LEVEL_ORDER)}
    for r in rows:
        q = data.QUESTIONS.get(r["qid"])
        if not q:
            continue
        if int(r["review"]):
            reason = "前回誤答"
            overdue_days = 0
            priority = 0
        else:
            try:
                last = datetime.strptime(r["updated_at"], "%Y-%m-%d %H:%M:%S")
            except Exception:
                continue
            correct_count = max(1, int(r["correct"] or 0))
            days = SRS_SCHEDULE_DAYS[min(correct_count, len(SRS_SCHEDULE_DAYS)) - 1]
            due_at = last + timedelta(days=days)
            if due_at > now:
                continue
            overdue_days = max(0, (now - due_at).days)
            reason = f"{days}日復習"
            priority = 1
        out.append({
            "qid": r["qid"], "level": r["level"],
            "level_label": data.LEVEL_LABELS[r["level"]],
            "number": int(r["number"]), "unit": r["unit"],
            "stem": q["stem"], "answer": q["answer_text"],
            "reason": reason, "overdue_days": overdue_days,
            "correct": int(r["correct"] or 0), "wrong": int(r["wrong"] or 0),
            "_sort": (priority, -overdue_days, order.get(r["level"], 99), int(r["number"])),
        })
    out.sort(key=lambda x: x["_sort"])
    for x in out:
        x.pop("_sort", None)
    return {"student": name, "count": len(out), "due": out[:limit]}


def due_review_qids(student: str, limit: int = 10) -> list[str]:
    """今日の復習候補qidを出題順に返す。"""
    return [x["qid"] for x in due_review(student, limit=limit)["due"]]


def xp(student: str) -> int:
    with _conn() as c:
        r = c.execute(
            "SELECT COALESCE(SUM(weight),0) AS x FROM progress WHERE student=? AND mastered=1",
            (student,),
        ).fetchone()
    return int(r["x"])


def profile(student: str) -> dict:
    """XP・ランク・レベル別カバレッジ・復習リスト件数。"""
    rank = data.rank_for(xp(student))
    per_level = []
    with _conn() as c:
        for lv in data.LEVEL_ORDER:
            r = c.execute(
                """SELECT
                     COALESCE(SUM(mastered),0) AS mastered,
                     COALESCE(SUM(CASE WHEN review=1 THEN 1 ELSE 0 END),0) AS review,
                     COALESCE(SUM(served),0) AS served
                   FROM progress WHERE student=? AND level=?""",
                (student, lv),
            ).fetchone()
            total = len(data.BY_LEVEL[lv])
            per_level.append({
                "key": lv, "label": data.LEVEL_LABELS[lv], "total": total,
                "mastered": int(r["mastered"]), "review": int(r["review"]),
                "served": int(r["served"]),
                "complete": int(r["mastered"]) >= total,
            })
    return {"student": student, "rank": rank, "levels": per_level}


def unit_progress(student: str) -> list[dict]:
    """レベル×単元ごとの 総数/克服/復習。クリアチェッカー・先生ヒートマップ用。

    生徒が空（ゲスト）のときは記録ゼロ＝すべて未克服として返す。
    """
    counts: dict[tuple[str, str], tuple[int, int]] = {}
    student = (student or "").strip()
    if student:
        with _conn() as c:
            rows = c.execute(
                """SELECT level, unit,
                     COALESCE(SUM(mastered),0) AS mastered,
                     COALESCE(SUM(CASE WHEN review=1 THEN 1 ELSE 0 END),0) AS review
                   FROM progress WHERE student=? GROUP BY level, unit""",
                (student,),
            ).fetchall()
        counts = {(r["level"], r["unit"]): (int(r["mastered"]), int(r["review"]))
                  for r in rows}
    out = []
    for lv in data.LEVEL_ORDER:
        totals: dict[str, int] = {}
        for q in data.BY_LEVEL[lv]:
            totals[q["unit"]] = totals.get(q["unit"], 0) + 1
        units = []
        for u in data.UNITS_BY_LEVEL[lv]:
            m, rv = counts.get((lv, u), (0, 0))
            t = totals[u]
            units.append({"unit": u, "total": t, "mastered": m, "review": rv,
                          "complete": m >= t})
        out.append({"key": lv, "label": data.LEVEL_LABELS[lv], "units": units})
    return out


def weakness(student: str) -> dict:
    """先生用：レベル×単元の正答率と、未克服問の一覧。"""
    with _conn() as c:
        rows = c.execute(
            """SELECT level, unit,
                      SUM(correct) AS correct, SUM(wrong) AS wrong,
                      SUM(mastered) AS mastered, COUNT(*) AS touched
               FROM progress WHERE student=? GROUP BY level, unit""",
            (student,),
        ).fetchall()
        review_rows = c.execute(
            """SELECT qid, level, number, unit FROM progress
               WHERE student=? AND review=1 ORDER BY level, number""",
            (student,),
        ).fetchall()
        miss_rows = c.execute(
            "SELECT qid, choice, count FROM miss WHERE student=? ORDER BY count DESC",
            (student,),
        ).fetchall()
    units = []
    for r in rows:
        attempts = int(r["correct"]) + int(r["wrong"])
        units.append({
            "level": r["level"], "level_label": data.LEVEL_LABELS[r["level"]],
            "unit": r["unit"], "correct": int(r["correct"]), "wrong": int(r["wrong"]),
            "mastered": int(r["mastered"]), "touched": int(r["touched"]),
            "accuracy": round(100 * int(r["correct"]) / attempts) if attempts else None,
        })
    units.sort(key=lambda u: (u["accuracy"] if u["accuracy"] is not None else 999, -u["wrong"]))

    # qid -> [{choice, count}, ...]（多い順）
    miss_by_qid: dict[str, list[dict]] = {}
    for m in miss_rows:
        miss_by_qid.setdefault(m["qid"], []).append(
            {"choice": m["choice"], "count": int(m["count"])})

    review_list = [
        {"qid": r["qid"], "level_label": data.LEVEL_LABELS[r["level"]],
         "number": r["number"], "unit": r["unit"],
         "stem": data.QUESTIONS[r["qid"]]["stem"],
         "answer": data.QUESTIONS[r["qid"]]["answer_text"],
         "misses": miss_by_qid.get(r["qid"], [])}
        for r in review_rows
    ]

    # よくある間違え方（正解←選んだ誤答）を回数の多い順に
    confusions = []
    for m in miss_rows:
        q = data.QUESTIONS.get(m["qid"])
        if not q:
            continue
        confusions.append({
            "level_label": q["level_label"], "unit": q["unit"], "number": q["number"],
            "stem": q["stem"], "correct": q["answer_text"],
            "chosen": m["choice"], "count": int(m["count"]),
        })
    confusions.sort(key=lambda x: -x["count"])

    return {"student": student, "units": units, "review": review_list,
            "confusions": confusions[:20], "profile": profile(student)}


def stats(student: str) -> dict:
    """生徒向けの学習記録。単元別・レベル別の正答率と最近触った問題を返す。"""
    name = (student or "").strip()
    if not name:
        return {"student": "", "total_seen": 0, "correct": 0, "wrong": 0,
                "accuracy": None, "by_level": [], "by_unit": [],
                "recent": [], "due_count": 0}
    with _conn() as c:
        total = c.execute(
            """SELECT COALESCE(SUM(seen),0) AS seen,
                      COALESCE(SUM(correct),0) AS correct,
                      COALESCE(SUM(wrong),0) AS wrong
               FROM progress WHERE student=?""",
            (name,),
        ).fetchone()
        by_level_rows = c.execute(
            """SELECT level, COALESCE(SUM(seen),0) AS seen,
                      COALESCE(SUM(correct),0) AS correct,
                      COALESCE(SUM(wrong),0) AS wrong,
                      COALESCE(SUM(mastered),0) AS mastered,
                      COALESCE(SUM(CASE WHEN review=1 THEN 1 ELSE 0 END),0) AS review
               FROM progress WHERE student=? GROUP BY level""",
            (name,),
        ).fetchall()
        by_unit_rows = c.execute(
            """SELECT level, unit, COALESCE(SUM(seen),0) AS seen,
                      COALESCE(SUM(correct),0) AS correct,
                      COALESCE(SUM(wrong),0) AS wrong,
                      COALESCE(SUM(mastered),0) AS mastered,
                      COALESCE(SUM(CASE WHEN review=1 THEN 1 ELSE 0 END),0) AS review
               FROM progress WHERE student=? GROUP BY level, unit""",
            (name,),
        ).fetchall()
        recent_rows = c.execute(
            """SELECT qid, level, number, unit, correct, wrong, mastered, review, source, updated_at
               FROM progress WHERE student=? ORDER BY updated_at DESC LIMIT 12""",
            (name,),
        ).fetchall()

    seen = int(total["seen"] or 0)
    corr = int(total["correct"] or 0)
    wrong = int(total["wrong"] or 0)
    accuracy = round(100 * corr / seen) if seen else None
    order = {lv: i for i, lv in enumerate(data.LEVEL_ORDER)}

    by_level = []
    for r in by_level_rows:
        attempts = int(r["seen"] or 0)
        by_level.append({
            "level": r["level"], "level_label": data.LEVEL_LABELS[r["level"]],
            "seen": attempts, "correct": int(r["correct"] or 0),
            "wrong": int(r["wrong"] or 0), "mastered": int(r["mastered"] or 0),
            "review": int(r["review"] or 0),
            "accuracy": round(100 * int(r["correct"] or 0) / attempts) if attempts else None,
        })
    by_level.sort(key=lambda x: order.get(x["level"], 99))

    by_unit = []
    for r in by_unit_rows:
        attempts = int(r["seen"] or 0)
        by_unit.append({
            "level": r["level"], "level_label": data.LEVEL_LABELS[r["level"]],
            "unit": r["unit"], "seen": attempts,
            "correct": int(r["correct"] or 0), "wrong": int(r["wrong"] or 0),
            "mastered": int(r["mastered"] or 0), "review": int(r["review"] or 0),
            "accuracy": round(100 * int(r["correct"] or 0) / attempts) if attempts else None,
        })
    by_unit.sort(key=lambda x: (x["accuracy"] if x["accuracy"] is not None else 999,
                                -x["wrong"], order.get(x["level"], 99)))

    recent = []
    for r in recent_rows:
        q = data.QUESTIONS.get(r["qid"])
        recent.append({
            "qid": r["qid"], "level_label": data.LEVEL_LABELS[r["level"]],
            "number": int(r["number"]), "unit": r["unit"],
            "stem": q["stem"] if q else "",
            "answer": q["answer_text"] if q else "",
            "correct": int(r["correct"] or 0), "wrong": int(r["wrong"] or 0),
            "mastered": bool(r["mastered"]), "review": bool(r["review"]),
            "source": r["source"] or "", "updated_at": r["updated_at"] or "",
        })

    return {
        "student": name, "total_seen": seen, "correct": corr, "wrong": wrong,
        "accuracy": accuracy, "by_level": by_level, "by_unit": by_unit[:20],
        "recent": recent, "due_count": due_review(name, limit=1)["count"],
        "profile": profile(name),
    }
