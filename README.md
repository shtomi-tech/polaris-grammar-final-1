# 英文法トレーナー

基礎知識チェックから入試演習・英文解釈までを **1つのアプリ** として提供する静的Webアプリです。

以前は3つの独立したアプリを同じサイトに並べていましたが、生徒識別・進捗保存・デザインを統合し、単一のアプリにまとめました。

## 構成

```
index.html            唯一の入口
shared/               アプリ共通の土台
  identity.js         生徒識別（唯一の正）
  store.js            学習進捗（生徒1人＝1レコード）
  flow.js             モジュール登録と横断導線（現在地・次にやること）
  shell.js            ヘッダー・ステッパー・生徒切替・フッター
  router.js           #/foundation, #/grammar, #/reading の切り替え
  styles.css          デザイントークンの唯一の定義
  vendor/harness/     生徒別クラウド同期（他プロジェクトと共有。編集しない）
modules/
  foundation/         基礎チェック（grammar-200q統合セット566問・8章43セクション）
  grammar/            英文法演習（ポラリス）
  reading/            英文解釈
docs/                 設計・作問資料（[索引](docs/README.md)）
modules/README.md     モジュール一覧
scripts/              補助スクリプト（[索引](scripts/README.md)）
scripts/write-config.mjs  デプロイ時に config.json を生成
supabase/schema.sql       共通スキーマ（app_students / app_progress）
```

各モジュールは `mount(root, ctx)` を公開し、シェルが差し込みます。モジュールのCSSは表示中の1つだけを読み込みます（統合前の3アプリが同名クラスを別の意味で使っていたため）。

## 学習の流れ

推奨順は **基礎チェック → 英文法演習 → 英文解釈** です。
推奨順は保ちますが、英文法演習のStep 1 UNITセクションは基礎チェック完了前でも選択・開始できます。Step 2・Step 3は英文法演習内の達成条件で順に開きます。英文解釈も先に着手してかまいません。

推奨導線と「次にやること」の判断は `shared/flow.js` の1箇所にあります。

## 起動・確認

リポジトリ直下を配信します（本番と同じ配置になります）。

```bash
npx --yes serve -l 5908 .
```

`http://localhost:5908/` を開きます。

## 進捗の保存

- ローカル: `localStorage` の `egt.progress.<生徒ID>` に、3モジュール分をまとめて保存します。
- クラウド: 共有URL（`?s=<生徒ID>&t=<トークン>`）でアクセスしたときだけ有効です。
  Supabaseの共通スキーマ `app_progress` に `app = "english-grammar-trainer"` の1行として保存します。

生徒の登録とQR発行は講師用ポータル（ローカル）で行います。

## 問題作成

問題を追加・修正するときは、[英文法トレーナーの問題作成原則](docs/QUESTION_AUTHORING_PRINCIPLES.md) と、対象分野の active 原則カードを参照します。

モジュールと検証スクリプトの入口は、[modules/README.md](modules/README.md) と [scripts/README.md](scripts/README.md) を参照してください。
