# 英文法 基礎知識チェック

英文法の用語・形・働き・区別を直接確認する、60問・4択の静的アプリです。

## ねらい

- 英文の空所補充では測りにくい、基礎知識の整理度を短時間で確認する
- 誤答・保留の問題を、分野別の詳しい解説につなげる
- 通常利用ではブラウザの localStorage に保存し、生徒別共有URLでは共通Supabaseへ結果を同期する

## 起動

```powershell
cd "C:\Users\shtom\dev\polaris-grammar-final-1\grammar-knowledge-check"
py -3 -m http.server 8097
```

`http://127.0.0.1:8097/` を開く。

## 構成

- `data/questions.js`: 17分野・60問と分野別解説
- `static/app.js`: 出題、採点、結果、解説、ローカル保存・生徒別クラウド同期
- `static/styles.css`: アイボリー地・影なし・キーボード操作前提の画面

## 検証

```powershell
node --check data/questions.js
node --check static/app.js
node scripts/check-data.js
```
