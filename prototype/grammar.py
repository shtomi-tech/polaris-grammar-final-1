# -*- coding: utf-8 -*-
"""単元別の文法確認ページ。

questions.json の細かい単元名を、学習用の親カテゴリに寄せて扱う。
"""
from __future__ import annotations

import json
from pathlib import Path

_PATH = Path(__file__).parent / "grammar_pages.json"

PAGES: dict[str, dict] = json.loads(_PATH.read_text(encoding="utf-8"))
ORDER: list[str] = list(PAGES.keys())


def key_for_unit(unit: str | None) -> str | None:
    """問題単元名から、対応する文法ページキーを返す。未対応なら None。"""
    u = unit or ""
    if "be動詞" in u:
        return "be動詞"
    if "There is" in u or "There are" in u:
        return "There構文"
    if "冠詞" in u:
        return "冠詞"
    if "疑問詞" in u or "間接疑問" in u:
        return "疑問詞・間接疑問"
    if "付加疑問" in u or "命令文" in u or "命令" in u:
        return "命令文・付加疑問"
    if any(x in u for x in ["some", "any", "many", "much", "数量"]):
        return "数量表現"
    if "接続・前置詞" in u:
        return "接続詞・前置詞"
    if "前置詞" in u or "連語" in u:
        return "前置詞"
    if "接続詞" in u:
        return "接続詞"
    if "比較" in u:
        return "比較"
    if "助動詞" in u:
        return "助動詞"
    if "分詞構文" in u:
        return "分詞構文"
    if "分詞" in u:
        return "分詞"
    if "仮定" in u or "wish" in u or "婉曲" in u:
        return "仮定法"
    if "無生物主語・同格" in u:
        return "無生物主語・同格"
    if "形式主語" in u or "形式目的語" in u or "SVOC" in u:
        return "形式主語・形式目的語・SVOC"
    if "使役" in u or "知覚" in u:
        return "使役・知覚動詞"
    if "強調" in u or "倒置" in u:
        return "強調構文・倒置"
    if "否定" in u:
        return "否定"
    if "話法" in u or "名詞節" in u:
        return "話法・名詞節"
    if "無生物主語" in u or "同格" in u:
        return "無生物主語・同格"
    if "主述の一致" in u or "語法" in u:
        return "主述の一致・語法"
    if "副詞節" in u:
        return "副詞節"
    if "特殊構文" in u:
        return "特殊構文"
    if "一般動詞" in u or "三単現" in u:
        return "一般動詞"
    if "名詞の複数形" in u:
        return "名詞の複数形"
    if "関係" in u:
        return "関係詞"
    if "代名詞" in u:
        return "代名詞"
    if any(x in u for x in ["時制", "進行形", "過去形", "未来", "現在完了", "過去完了", "完了形"]):
        return "時制"
    if "不定詞" in u:
        return "不定詞"
    if "動名詞" in u:
        return "動名詞"
    if "受動態" in u:
        return "受動態"
    return None


def page_for_unit(unit: str | None) -> dict | None:
    key = key_for_unit(unit)
    if not key:
        return None
    page = PAGES.get(key)
    if not page:
        return None
    return {"key": key, **page}
