# 基礎チェック

`C:\Users\shtom\dev\grammar-200q` の統合セットを組み込んだ、英文法の学習ルートです。

- 統合セット: 566問・4択
- 学習ルート: 8章・43セクション
- セクションごとに、予習資料 → 問題 → 結果を表示
- 問題データ: `data/questions.json`（`english-grammar-200-merged` のみを出題）
- 進捗: v2の生徒別ストアへ保存。教材版は `grammar-200q-merged-v1`

`data/questions.json` と予習Markdownは、`C:\Users\shtom\dev\grammar-200q` から取り込んだローカルコピーです。元アプリの問題データを変更した場合は、対象ファイルを再コピーしてから検証します。

## 検証

```powershell
node modules/foundation/scripts/check-data.js
node modules/foundation/scripts/export-question-list.js
py -3 modules/foundation/scripts/audit_preparation_checks.py
```

実行時はリポジトリ直下を配信します。

```powershell
py -3 -m http.server 5908
```

`http://127.0.0.1:5908/#/foundation` を開きます。

スクリプトの役割と、生成系スクリプトを実行する条件は、リポジトリ直下の [`scripts/README.md`](../../scripts/README.md) を参照してください。
