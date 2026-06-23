# -*- coding: utf-8 -*-
"""
最上級100問は MD が無く HTML だけ存在する。
正本を MD に統一するため、HTML をパースして他レベルと同形式の MD を一度だけ生成する。

入力 : ../../英語/英文法4択問題_最上級100問.html
出力 : ../../英語/英文法4択問題_最上級100問.md

冪等：何度実行しても同じ MD を吐く（HTML が正であり続ける限り）。
"""
from __future__ import annotations

import html
import re
from pathlib import Path

VAULT = Path(__file__).resolve().parents[2]
SRC = VAULT / "英語" / "英文法4択問題_最上級100問.html"
DST = VAULT / "英語" / "英文法4択問題_最上級100問.md"


def strip_tags(s: str) -> str:
    # <span class="blank">___</span> → ___ にしてからタグ除去
    s = re.sub(r'<span class="blank">(.*?)</span>', r"\1", s)
    s = re.sub(r"<[^>]+>", "", s)
    return html.unescape(s).strip()


def main() -> None:
    text = SRC.read_text(encoding="utf-8")

    # --- 問題本体：sec見出しで単元を追いながら q を集める ---
    # トークン列（出現順）で sec と q を拾う
    token_re = re.compile(
        r'<div class="sec">(?P<sec>.*?)</div>'
        r'|<div class="q"><span class="num">(?P<num>\d+)</span>'
        r'<div class="sent">(?P<sent>.*?)</div>'
        r'<div class="ch">(?P<ch>.*?)</div></div>',
        re.S,
    )
    units: dict[int, str] = {}   # 問番号 -> 単元
    stems: dict[int, str] = {}
    choices: dict[int, str] = {}
    cur_unit = ""
    for m in token_re.finditer(text):
        if m.group("sec") is not None:
            cur_unit = strip_tags(m.group("sec"))
        else:
            n = int(m.group("num"))
            units[n] = cur_unit
            stems[n] = strip_tags(m.group("sent"))
            choices[n] = strip_tags(m.group("ch"))

    # --- 解答編：<td class="n">N</td><td class="a">記号 語</td><td>解説</td> ---
    ans_re = re.compile(
        r'<td class="n">(\d+)</td><td class="a">(.*?)</td><td>(.*?)</td>', re.S
    )
    answers: dict[int, str] = {}
    expls: dict[int, str] = {}
    for m in ans_re.finditer(text):
        n = int(m.group(1))
        answers[n] = strip_tags(m.group(2))
        expls[n] = strip_tags(m.group(3))

    nums = sorted(stems)
    assert nums == list(range(1, 101)), f"問題数が想定外: {len(nums)}問"
    assert all(n in answers for n in nums), "解答が欠けている問がある"

    # --- MD を組み立て（他レベルと同形式）---
    out: list[str] = []
    out.append("# 英文法 4択問題（最上級）100問\n")
    out.append("> レベルコンセプト：**難関私大（MARCH〜）対策・構文／語法**")
    out.append("> 構成：倒置・強調構文・主述の一致・比較の慣用・否定・複合関係詞など、難関大の構文／語法を網羅")
    out.append("> 使い方：空所に入る最も適切なものを ア〜エ から1つ選ぶ")
    out.append("\n---\n")
    out.append("## 問題編\n")

    # 単元ごとに区切り見出しを出す（単元の連続範囲を計算）
    last_unit = None
    unit_start = None
    blocks: list[tuple[str, int, int]] = []  # (unit, start, end)
    for n in nums:
        u = units.get(n, "")
        if u != last_unit:
            if last_unit is not None:
                blocks.append((last_unit, unit_start, n - 1))
            last_unit = u
            unit_start = n
    blocks.append((last_unit, unit_start, nums[-1]))

    bi = 0
    printed_headers: set[int] = {b[1] for b in blocks}
    header_for: dict[int, tuple[str, int, int]] = {b[1]: b for b in blocks}
    for n in nums:
        if n in printed_headers:
            u, s, e = header_for[n]
            out.append(f"### ◆ {u}（{s}〜{e}）\n")
        out.append(f"**{n}.** {stems[n]}")
        out.append(f"{choices[n]}\n")

    out.append("---\n")
    out.append("## 解答編\n")
    out.append("| 問 | 答 | 簡単な解説 |")
    out.append("|---|---|---|")
    for n in nums:
        out.append(f"| {n} | {answers[n]} | {expls[n]} |")
    out.append("")

    DST.write_text("\n".join(out), encoding="utf-8")
    print(f"OK: {DST} を生成（{len(nums)}問・単元{len(blocks)}区分）")


if __name__ == "__main__":
    main()
