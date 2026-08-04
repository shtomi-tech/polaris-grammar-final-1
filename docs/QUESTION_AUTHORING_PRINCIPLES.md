# 英文法トレーナーの問題作成原則

共通の作問原則は、次の文書を正本とします。

- [共通の学習用4択問題 作問原則](../../docs/QUESTION_AUTHORING_PRINCIPLES.md)
- [英文法原則カードの作成基準](../../docs/english-grammar-principles/AUTHORING_STANDARD.md)

## このリポジトリで特に守ること

- `modules/foundation/data/questions.js` の基礎知識問題は、原則として一問一判断にする。
- `ruleRefs` は正答判定に使った `status: active` の原則カードだけを参照する。
- `basis` は `active-principle` と `standard-foundation` を区別する。
- 誤答ごとに `misconceptions` を付け、何の混同を疑う選択肢かを残す。
- 問題・選択肢・正答・解説・誤概念タグをまとめて確認する。
- 単語単独の品詞問題は入口用とし、文中の働きや修飾先を問う問題とは分ける。

## 作成後の確認

```powershell
node --check modules/foundation/data/questions.js
node --check modules/foundation/app.js
node modules/foundation/scripts/check-data.js
node modules/foundation/scripts/export-question-list.js
```

`modules/foundation/README.md`、共通原則、対象分野の active 原則カードを順に参照します。
