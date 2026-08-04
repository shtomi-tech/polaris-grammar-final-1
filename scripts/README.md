# scripts

リポジトリ全体に関わるスクリプトの索引です。モジュール固有のスクリプトは、対象モジュールの `scripts/` に置きます。

## リポジトリ直下

- [`write-config.mjs`](write-config.mjs)：デプロイ時の環境変数から、リポジトリ直下のGit無視対象 `config.json` を生成します。場所を変更しません。`config.json` 自体は開かないでください。

## foundation

- [`modules/foundation/scripts/check-data.js`](../modules/foundation/scripts/check-data.js)：`questions.json` の問題数・セクション・設問形状を検査します。読み取り専用です。
- [`modules/foundation/scripts/audit_preparation_checks.py`](../modules/foundation/scripts/audit_preparation_checks.py)：予習Markdownの見出しと確認ブロックを監査します。読み取り専用です。
- [`modules/foundation/scripts/export-question-list.js`](../modules/foundation/scripts/export-question-list.js)：`data/questions.json` から `問題一覧.md` を生成します。生成物を書き換えるため、明示的な作業時以外は実行しません。
- [`modules/foundation/scripts/generate_preparation_checks.py`](../modules/foundation/scripts/generate_preparation_checks.py)：予習Markdownへ確認ブロックを追加・削除する生成補助です。明示的な作業時以外は実行しません。

## grammar

- [`modules/grammar/scripts/check_polaris_domain_tags.mjs`](../modules/grammar/scripts/check_polaris_domain_tags.mjs)：ポラリス問題のドメインタグを検査します。読み取り専用です。
- [`modules/grammar/scripts/refine_polaris_domain_tags.mjs`](../modules/grammar/scripts/refine_polaris_domain_tags.mjs)：ドメインタグを更新する生成補助です。実行すると問題データを書き換えます。
- [`modules/grammar/scripts/tag_polaris_domains.mjs`](../modules/grammar/scripts/tag_polaris_domains.mjs)：初期ドメインタグを付ける生成補助です。実行すると問題データを書き換えます。

## reading

- [`modules/reading/scripts/check-domain.mjs`](../modules/reading/scripts/check-domain.mjs)：英文解釈ドメインの関数を検査します。

この整理の検証コマンドはリポジトリ直下の [`AGENTS.md`](../AGENTS.md) に固定しています。
