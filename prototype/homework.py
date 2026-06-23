# -*- coding: utf-8 -*-
"""
弱点（未克服＝復習リスト）の問題を、A4モノクロ印刷向けの宿題プリントHTMLに組む。

「アプリで弱点把握 → 紙で復習 → 紙の結果を入力」のループを閉じるための出力。
- 問題編：文法レベル→単元でグループ化し、各問を [レベル #印刷番号] 付きで出題（選択肢は元の順）。
- 解答編：レベルごとに 番号/正解/解説 の表。
- 印刷番号を載せるので、紙で解かせたあと先生メニューの「紙の結果入力」にそのまま戻せる。
デザインは claude（アイボリー地＋ニアブラックのインク・無彩色・影ゼロ・角丸0px）。
"""
from __future__ import annotations

import html
import time

import data


def _esc(s: str) -> str:
    return html.escape(str(s))


_LABELS = "アイウエ"


def build_homework_html(student: str, qids: list[str]) -> str:
    questions = [data.QUESTIONS[q] for q in qids if q in data.QUESTIONS]

    # レベル順 → 単元順 → 番号順 にグループ化
    by_level: dict[str, list[dict]] = {}
    for q in questions:
        by_level.setdefault(q["level"], []).append(q)

    today = time.strftime("%Y-%m-%d")
    total = len(questions)

    body_blocks: list[str] = []
    ans_blocks: list[str] = []

    for lv in data.LEVEL_ORDER:
        if lv not in by_level:
            continue
        label = data.LEVEL_LABELS[lv]
        qs = sorted(by_level[lv], key=lambda x: (x["unit"], x["number"]))
        # 問題編
        rows = [f'<h3 class="lvhead">{_esc(label)}</h3>']
        cur_unit = None
        for q in qs:
            if q["unit"] != cur_unit:
                cur_unit = q["unit"]
                rows.append(f'<div class="unit">◆ {_esc(cur_unit)}</div>')
            stem = _esc(q["stem"]).replace("___", '<span class="blank">　　　</span>')
            chs = "　".join(f"{_LABELS[i]}. {_esc(c)}" for i, c in enumerate(q["choices"]))
            rows.append(
                f'<div class="q"><span class="qn">#{q["number"]}</span>'
                f'<span class="stem">{stem}</span>'
                f'<div class="choices">{chs}</div></div>'
            )
        body_blocks.append('<section class="lvsec">' + "".join(rows) + "</section>")
        # 解答編
        arows = "".join(
            f'<tr><td class="n">#{q["number"]}</td>'
            f'<td class="a">{_LABELS[q["answer_index"]]}. {_esc(q["answer_text"])}</td>'
            f'<td>{_esc(q["explanation"])}</td></tr>'
            for q in qs
        )
        ans_blocks.append(
            f'<h3 class="lvhead">{_esc(label)}</h3>'
            f'<table class="ans"><tr><th>No</th><th>正解</th><th>解説</th></tr>{arows}</table>'
        )

    if total == 0:
        body_inner = '<p class="empty">未克服の問題はありません。よく頑張りました。</p>'
        ans_inner = ""
    else:
        body_inner = "".join(body_blocks)
        ans_inner = '<h2 class="block">解答・解説</h2>' + "".join(ans_blocks)

    return f"""<!DOCTYPE html>
<html lang="ja"><head><meta charset="utf-8" />
<title>弱点復習プリント — {_esc(student)}</title>
<style>
  :root {{ --ink:#141413; --parchment:#faf9f6; --paper:#fff; --line:#bdb8ac; --muted:#6f6a5f;
           --sans:"Hiragino Kaku Gothic ProN","Meiryo",sans-serif; --serif:Georgia,"Yu Mincho",serif;
           --mono:"Consolas",monospace; }}
  * {{ box-sizing:border-box; }}
  body {{ margin:0; font-family:var(--sans); color:var(--ink); background:#e9e7e1; }}
  .sheet {{ max-width:760px; margin:16px auto; background:var(--parchment); padding:28px 32px; }}
  .toolbar {{ max-width:760px; margin:12px auto 0; display:flex; gap:10px; justify-content:flex-end; }}
  .toolbar button {{ font-family:var(--sans); font-size:13px; padding:8px 16px; border:1px solid var(--ink);
                     background:var(--ink); color:var(--parchment); cursor:pointer; border-radius:0; }}
  h1 {{ font-family:var(--serif); font-size:18px; font-weight:500; margin:0; background:var(--ink);
        color:var(--parchment); padding:6px 12px; display:inline-block; }}
  .meta {{ font-family:var(--mono); font-size:11px; letter-spacing:.08em; color:var(--muted); margin-top:8px;
           display:flex; justify-content:space-between; border-bottom:2px solid var(--ink); padding-bottom:8px; }}
  .name {{ font-family:var(--mono); font-size:12px; }}
  .lvhead {{ font-family:var(--mono); font-size:12px; letter-spacing:.12em; text-transform:uppercase;
             color:var(--ink); border-bottom:1px solid var(--ink); padding-bottom:3px; margin:18px 0 8px; }}
  .unit {{ font-family:var(--mono); font-size:11px; color:var(--muted); margin:10px 0 4px; }}
  .q {{ margin:0 0 9px; padding-left:2px; page-break-inside:avoid; }}
  .qn {{ font-family:var(--mono); font-size:11px; color:var(--muted); margin-right:8px; }}
  .stem {{ font-size:14px; line-height:1.7; }}
  .stem .blank {{ border-bottom:1px solid var(--ink); }}
  .choices {{ font-size:13px; color:#2c2a26; margin:2px 0 0 22px; }}
  h2.block {{ font-family:var(--serif); font-size:15px; background:var(--ink); color:var(--parchment);
              padding:4px 10px; display:inline-block; margin:28px 0 8px; }}
  table.ans {{ width:100%; border-collapse:collapse; font-size:12px; margin-bottom:10px; }}
  table.ans th {{ font-family:var(--mono); font-size:10px; text-transform:uppercase; letter-spacing:.06em;
                  color:var(--muted); text-align:left; border-bottom:1.5px solid var(--ink); padding:4px 6px; }}
  table.ans td {{ border-bottom:1px solid var(--line); padding:4px 6px; vertical-align:top; }}
  table.ans td.n {{ font-family:var(--mono); white-space:nowrap; }}
  table.ans td.a {{ font-weight:600; white-space:nowrap; }}
  .empty {{ font-size:14px; }}
  .foot {{ font-family:var(--mono); font-size:10px; color:var(--muted); text-align:center; margin-top:18px;
           border-top:1px solid var(--line); padding-top:6px; }}
  @media print {{
    body {{ background:#fff; }}
    .toolbar {{ display:none; }}
    .sheet {{ margin:0; max-width:none; background:#fff; padding:0; }}
    @page {{ size:A4; margin:14mm; }}
    .pagebreak {{ break-before:page; }}
  }}
</style></head>
<body>
<div class="toolbar"><button onclick="window.print()">印刷する</button></div>
<div class="sheet">
  <h1>弱点復習プリント</h1>
  <div class="meta"><span class="name">生徒：{_esc(student)}</span><span>未克服 {total} 問 ／ {today}</span></div>
  {body_inner}
  <div class="pagebreak"></div>
  {ans_inner}
  <div class="foot">英文法 4択演習 — 弱点復習プリント（解き終えたら「紙の結果入力」へ）</div>
</div>
</body></html>"""
