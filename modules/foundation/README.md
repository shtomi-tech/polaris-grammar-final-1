# 基礎チェック

英文法の学習ルートです。8章43セクションで、セクションごとに 予習資料 → 問題 → 結果 を表示します。

- 問題データ: `data/questions.json`（**ここが正本**。取り込み元だった `grammar-200q` は削除済み）
- 予習資料: `data/prep-<lessonId>.md`（**セクションIDがそのままファイル名**。対応表は無い）
- 進捗: v2の生徒別ストアへ保存。教材版は `grammar-200q-merged-v1`

**問題数はこのREADMEに書きません。** 実データから導出され、`check-data.js` が表示します。

## 問題を追加する手順

1. `data/questions.json` の `questions[]` に追記する。`lessonId` で所属セクションが決まる。
2. `node modules/foundation/scripts/sync-counts.js` を実行する。**カウントを手で書き換えない。**
3. `data/prep-<lessonId>.md` を開き、追加した問題が「予習資料だけで解ける」状態か確認する。足りない論点は見出しを追加する（`##` 見出し1つにつき `:::check` を1つ）。
4. 下の検証を実行する。

問題オブジェクトに必要なキーは `id` / `setId` / `lessonId` / `unit` / `target` / `prompt` / `sentence` / `choices` / `answerIndex` / `stage` / `difficulty` / `ruleRefs` / `explanation` / `misconceptions` です。`ruleRefs` は `C:\Users\shtom\dev\docs\english-grammar-principles` に実在する `status: active` のカードIDを書きます（実在確認は自動化されていないので目視で確認する）。

## 検証

```powershell
node modules/foundation/scripts/sync-counts.js
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
