# AGENTS.md

このリポジトリは、基礎チェック・英文法演習・英文解釈を `index.html` から提供する静的Webアプリです。ここでは、実際の配置と変更境界だけを記します。

親ディレクトリの `C:\Users\shtom\dev\AGENTS.md` にある共通規則も適用します。ここでは重複して再掲しません。

## 作業前に読む順番

1. 親の `C:\Users\shtom\dev\AGENTS.md`
2. この `AGENTS.md`
3. `README.md`
4. UIやレイアウトに触れる場合は `DESIGN.md`
5. 対象モジュールの `modules/<module>/README.md`
6. 問題・予習資料に触れる場合は `docs/README.md` → `docs/QUESTION_AUTHORING_PRINCIPLES.md`
7. 対象の実装・データ・スクリプトと、必要に応じて `modules/README.md` / `scripts/README.md`

参照先の役割が曖昧なときは、READMEだけで決めず、`rg` と実装の参照箇所を確認します。

## 構成

| 場所 | 役割 |
| --- | --- |
| `index.html` | 唯一のランタイム入口 |
| `shared/` | 生徒識別、進捗ストア、モジュール登録・ルーティング、シェル、共通CSS |
| `modules/foundation/` | `grammar-200q` 統合セットの基礎チェック。`modules/foundation/data/questions.json` と予習Markdownを使う |
| `modules/grammar/` | ポラリス英文法演習。`data/polaris_questions.json` を使う |
| `modules/reading/` | 英文解釈。`data/manifest.json` から教材JSONを選ぶ |
| `docs/` | 作問原則、設計・画面資料の索引 |
| `scripts/` | リポジトリ全体の補助スクリプト。モジュール固有スクリプトは各モジュール内に置く |
| `supabase/` | 共通スキーマ |
| `.github/` | GitHub Actionsによる公開設定 |

## 正本・生成物・保護対象

| 分類 | 場所 | 扱い |
| --- | --- | --- |
| 正本 | `shared/flow.js`、`shared/identity.js`、`shared/store.js` | モジュール導線・生徒識別・進捗契約の実装正本 |
| 外部正本 | `C:\Users\shtom\dev\grammar-200q` | 基礎チェックの問題・予習コーパス。編集時は同リポジトリ固有の作成ルールに従う |
| ローカルランタイムコピー | `modules/foundation/data/questions.json`、`modules/foundation/data/preparation-*.md` | このアプリが読み込むコピー。上流変更後に外部正本から再取り込みする。`questions.json` は `modules/foundation/app.js` がランタイムで読み込む。`modules/foundation/data/questions.js` は現在のランタイムでは選択されない |
| 正本 | `modules/grammar/data/polaris_questions.json` | ポラリス問題データ |
| 正本 | `modules/reading/data/manifest.json`、`modules/reading/data/*.json` | 英文解釈の教材選択と教材データ |
| 仕様 | `DESIGN.md`、`supabase/schema.sql` | UIトークン・レイアウト方針、Supabaseスキーマ |
| 生成物 | `modules/foundation/問題一覧.md` | `modules/foundation/scripts/export-question-list.js` が `modules/foundation/data/questions.json` から生成。直接編集しない |
| 生成物 | `config.json` | `scripts/write-config.mjs` が環境変数から生成。`.gitignore` 対象で、Supabaseキーを含み得るため読まない・出力しない |
| 保護 | `shared/vendor/harness/cloud.js` | 共有ハーネスからの自動生成ファイル。編集しない |
| 保護 | `index.html`、`shared/**`、`modules/**` の実装・データ、`DESIGN.md`、`supabase/**`、`.github/**` | 文書整理だけの作業では変更しない。変更時は対象タスクの明示的な所有範囲を確認する |

`scripts/write-config.mjs` はリポジトリ直下に残します。`config.json` の内容を確認したい場合も、実ファイルは開かず、`config.example.json` と生成スクリプトを参照します。

## 作業境界

- 作業開始時と終了時に `git status --short --branch` を確認し、既存の変更・未追跡ファイルを保存したままにします。
- `reset --hard`、`clean`、無関係なユーザー作業の破棄・stash、無関係なファイルの広域整形は行いません。変更は現在の依頼の範囲に限定します。
- コミット・pushは、現在のユーザー依頼または継承したアプリ変更の公開手順が必要とする場合だけ行います。その場合も対象作業のファイルだけを選択し、親 `C:\Users\shtom\dev\AGENTS.md` の `verify-ui` / `verify-deploy` 規則に従います。
- 問題・解説・予習資料を作成または変更する前に、リポジトリ内の `docs/QUESTION_AUTHORING_PRINCIPLES.md` と、共通原則コーパス `C:\Users\shtom\dev\docs\english-grammar-principles` の `INDEX.md`・`AUTHORING_STANDARD.md`・対象分野の `status: active` カードを読みます。根拠のない語義・訳・解釈は確定せず、要確認として残します。
- 生成物を直接編集せず、生成元と生成スクリプトの関係を確認します。特に `generate_preparation_checks.py`、`export-question-list.js`、ポラリスの `refine_*.mjs` / `tag_*.mjs` は、明示的な作問作業以外では実行しません。
- ランタイム入口、`#/foundation`・`#/grammar`・`#/reading`、アプリID、localStorageキー、Supabaseスキーマ、公開配置、`scripts/write-config.mjs` の場所は互換性面として扱います。明示的に依頼範囲へ含まれる場合だけ変更し、全利用箇所・関連文書を更新したうえで、親 `C:\Users\shtom\dev\AGENTS.md` の規則に従って検証・デプロイします。
- UI・ランタイム・問題データを変更する場合は、親 `C:\Users\shtom\dev\AGENTS.md` の該当する `verify-ui` / `verify-deploy` と作問・データルールを適用します。文書整理だけの依頼では、それらの変更を推測して行いません。

## 標準検証

すべてリポジトリ直下で実行します。監査・チェックは読み取り専用です。

```powershell
py -3 -m py_compile modules/foundation/scripts/audit_preparation_checks.py modules/foundation/scripts/generate_preparation_checks.py
py -3 modules/foundation/scripts/audit_preparation_checks.py
node modules/foundation/scripts/check-data.js
node modules/grammar/scripts/check_polaris_domain_tags.mjs
node --check modules/grammar/scripts/check_polaris_domain_tags.mjs
node --check modules/grammar/scripts/refine_polaris_domain_tags.mjs
node --check modules/grammar/scripts/tag_polaris_domains.mjs
node --check scripts/write-config.mjs
git diff --check
```

期待値は、監査が `LESSON_FILES=43`、`INSTRUCTION_HEADINGS=302`、`CHECK_BLOCKS=302`、`ERRORS=0`、基礎データ検査が `566問・43セクション`、ポラリス検査が `100問 / 複数タグ 47問` です。
