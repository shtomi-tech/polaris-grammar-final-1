# ポラリス英文法ファイナル演習1 4択ミニアプリ

既存の `英語演習サイト/v2` をベースにした、4択問題専用の静的アプリです。

## 共有初期版

QRコードから生徒のスマホ・タブレットで開ける共有版に対応しています。

- アプリ本体はNetlifyなどの静的ホスティングに配置します。
- 生徒ごとの進捗はSupabaseに保存できます。
- URLに `?s=生徒ID&t=アクセストークン` を付けると、生徒専用の共有モードで開きます。
- Supabase設定がない場合は、従来どおりブラウザの `localStorage` で動きます。

## 起動

```powershell
cd "C:\Users\shtom\dev\polaris-grammar-final-1\ポラリス英文法ファイナル演習1"
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

## Supabase設定

1. SupabaseのSQL Editorで `supabase_schema.sql` を実行します。
2. `static/config.example.json` を `static/config.json` にコピーします。
3. `supabaseUrl` と `supabaseAnonKey` を自分のSupabaseプロジェクトの値に変更します。

```json
{
  "appBaseUrl": "https://shtomi-tech.github.io/polaris-grammar-final-1/",
  "supabaseUrl": "https://YOUR_PROJECT_ID.supabase.co",
  "supabaseAnonKey": "YOUR_SUPABASE_ANON_KEY"
}
```

`static/config.json` は公開サイトから読み込まれます。Supabase側はRPCだけを匿名実行許可し、テーブル本体はRLSで直接読めない構成です。

ローカルの `static/config.json` はGit管理しません。本番のGitHub Pagesでは、環境変数からデプロイ時に自動生成します。

## 生徒QRの作成

`admin.html` を開くと、生徒専用URL・QRコード・Supabase登録SQLを作れます。

1. 公開URLを入力します。
2. 生徒名を入力します。
3. トークンを生成します。
4. 表示されたSQLをSupabaseで実行します。
5. 表示されたQRコードを生徒に配布します。

作成した生徒専用URLは `admin.html` の「保存済み生徒URL」にブラウザ保存されます。保存済みの行からURLとQRコードを再表示できます。これは管理画面を開いたブラウザのlocalStorageに保存されるため、別端末や別ブラウザには同期されません。

共有URLの例:

```text
https://shtomi-tech.github.io/polaris-grammar-final-1/?s=tomita-shota&t=ランダムトークン
```

## GitHub Pages公開

GitHub Actionsで `ポラリス英文法ファイナル演習1` フォルダをGitHub Pagesへ公開します。

```text
公開URL: https://shtomi-tech.github.io/polaris-grammar-final-1/
```

GitHub Secretsに以下を設定します。

```text
APP_BASE_URL=https://shtomi-tech.github.io/polaris-grammar-final-1/
SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

デプロイ時に `.github/workflows/polaris-pages.yml` から `scripts/write-config.mjs` が `static/config.json` を生成します。

`robots.txt` と `X-Robots-Tag` により検索エンジンには出にくくしています。ただしURLを知っている人はアクセスできるため、生徒URLのトークンは推測しにくいものを使ってください。
