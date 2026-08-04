# modules

各モジュールは `shared/flow.js` に登録され、`index.html` からハッシュルートで切り替えられます。モジュールは `mount(root, ctx)` を公開します。

| モジュール | ルート | 内容 | README |
| --- | --- | --- | --- |
| `foundation` | `#/foundation` | `grammar-200q` 統合セットの基礎チェック（540問・43セクション） | [foundation/README.md](foundation/README.md) |
| `grammar` | `#/grammar` | ポラリス英文法演習 | [grammar/README.md](grammar/README.md) |
| `reading` | `#/reading` | 英文解釈教材 | [reading/README.md](reading/README.md) |

各モジュールの一般的な構成は、`app.js`（ランタイム）、`status.js`（進捗表示用の要約）、`styles.css`（モジュールCSS）、`data/`（教材データ）、`scripts/`（モジュール固有の検査・補助）です。実際に存在するファイルを優先して確認してください。

問題・予習資料の作成ルールは [`../docs/QUESTION_AUTHORING_PRINCIPLES.md`](../docs/QUESTION_AUTHORING_PRINCIPLES.md)、スクリプトの一覧は [`../scripts/README.md`](../scripts/README.md) にあります。
