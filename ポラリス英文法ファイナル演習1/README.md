# ポラリス英文法ファイナル演習1 4択ミニアプリ

既存の `英語演習サイト/v2` をベースにした、4択問題専用の静的アプリです。

## 起動

```powershell
cd "C:\Users\shtom\OneDrive\ドキュメント\Obsidian Vault\英語演習サイト\ポラリス英文法ファイナル演習1"
py -3 -m http.server 8096
```

ブラウザで開きます。

```text
http://127.0.0.1:8096/
```

## 問題データ

問題は `data/polaris_questions.json` に追加します。

```json
{
  "id": "u01_001",
  "unitId": "u01",
  "setId": "u01_set_01",
  "no": 1,
  "sourcePage": "12",
  "stem": "問題文",
  "choices": ["アの選択肢", "イの選択肢", "ウの選択肢", "エの選択肢"],
  "answerIndex": 0,
  "note": "解説",
  "translation": "必要なら訳"
}
```

- `answerIndex` は 0 始まりです。ア=0、イ=1、ウ=2、エ=3。
- スクショ提供後、OCR結果を確認してこのJSONへ追加します。
- 進捗はブラウザの `localStorage` に保存されます。
