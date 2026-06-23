# -*- coding: utf-8 -*-
"""起動：py run.py → http://127.0.0.1:8010 （API課金なし・オフライン可）

数学演習サイト(8000)と同時に動かせるよう、英語はポート 8010 を使う。
どのカレントディレクトリから起動しても動くよう、自分の場所を sys.path に入れる。
"""
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
os.chdir(HERE)

import uvicorn  # noqa: E402

if __name__ == "__main__":
    uvicorn.run("server:app", host="127.0.0.1", port=8010)
