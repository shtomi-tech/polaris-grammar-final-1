# -*- coding: utf-8 -*-
"""
questions.json（静的な問題データ）の読み込みと、ランク（称号はしご）の定義。

- 問題は確定済み・500問。LLM生成は一切しない。
- XP = 克服した問題の weight（文法レベル加重）の総和。全500問克服で最大 1500。
"""
from __future__ import annotations

import json
from pathlib import Path

_PATH = Path(__file__).parent / "questions.json"

# id -> 問題dict / level -> [問題] / (level)順
QUESTIONS: dict[str, dict] = {}
BY_LEVEL: dict[str, list[dict]] = {}
LEVEL_ORDER: list[str] = []
LEVEL_LABELS: dict[str, str] = {}
LEVEL_MAX_XP: dict[str, int] = {}
UNITS_BY_LEVEL: dict[str, list[str]] = {}

for _q in json.loads(_PATH.read_text(encoding="utf-8")):
    QUESTIONS[_q["id"]] = _q
    BY_LEVEL.setdefault(_q["level"], []).append(_q)
    if _q["level"] not in LEVEL_ORDER:
        LEVEL_ORDER.append(_q["level"])
    LEVEL_LABELS[_q["level"]] = _q["level_label"]

for _lv, _qs in BY_LEVEL.items():
    _qs.sort(key=lambda x: x["number"])
    LEVEL_MAX_XP[_lv] = sum(x["weight"] for x in _qs)
    seen: list[str] = []
    for x in _qs:
        if x["unit"] not in seen:
            seen.append(x["unit"])
    UNITS_BY_LEVEL[_lv] = seen

TOTAL_MAX_XP = sum(LEVEL_MAX_XP.values())  # 1500

# 称号はしご（約数段）。threshold = 累計XP。最上位は全問克服(=TOTAL_MAX_XP)で到達。
RANKS = [
    (0, "駆け出し"),
    (75, "初学者"),
    (225, "文法見習い"),
    (450, "文法の使い手"),
    (750, "文法上手"),
    (1050, "文法巧者"),
    (1350, "文法達人"),
    (TOTAL_MAX_XP, "文法マスター"),
]


def rank_for(xp: int) -> dict:
    """XPから現在ランクと次ランクまでの進捗を返す。"""
    idx = 0
    for i, (th, _name) in enumerate(RANKS):
        if xp >= th:
            idx = i
    cur_th, cur_name = RANKS[idx]
    if idx + 1 < len(RANKS):
        next_th, next_name = RANKS[idx + 1]
        span = next_th - cur_th
        into = xp - cur_th
        pct = round(100 * into / span) if span else 100
    else:
        next_th, next_name, pct = cur_th, None, 100
    return {
        "index": idx,
        "name": cur_name,
        "xp": xp,
        "max_xp": TOTAL_MAX_XP,
        "next_name": next_name,
        "next_threshold": next_th,
        "to_next": max(0, next_th - xp) if next_name else 0,
        "progress_pct": pct,           # 現ランク帯の中での進捗
        "overall_pct": round(100 * xp / TOTAL_MAX_XP),
        "is_max": next_name is None,
    }


def levels_meta() -> list[dict]:
    return [
        {
            "key": lv,
            "label": LEVEL_LABELS[lv],
            "count": len(BY_LEVEL[lv]),
            "max_xp": LEVEL_MAX_XP[lv],
            "units": UNITS_BY_LEVEL[lv],
            "weight": BY_LEVEL[lv][0]["weight"],
        }
        for lv in LEVEL_ORDER
    ]
