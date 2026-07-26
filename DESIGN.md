---
name: Claude
colors:
  primary: "#141413"
  secondary: "#FAF9F6"
  success: "#16A34A"
  warning: "#D97706"
  danger: "#DC2626"
  surface: "#FFFFFF"
  text: "#111827"
  neutral: "#FFFFFF"
typography:
  h1:
    fontFamily: "Anthropic Sans"
    fontSize: 2rem
  body-md:
    fontFamily: "Anthropic Sans"
    fontSize: 1rem
  label-caps:
    fontFamily: "JetBrains Mono"
    fontSize: 0.75rem
  sourceScale: "12/14/16/20/24/32"
  weights: "100, 200, 300, 400, 500, 600, 700, 800, 900"
rounded:
  sm: 4px
  md: 8px
spacing:
  sm: 4px
  md: 8px
  sourceScale: "4/8/12/16/24/32"
---

## Overview

Research-journal aesthetic on warm stone with near-black ink, restrained earthy accents, and editorially strict contrast.

## Style Foundations

- **Visual style:** modern, minimal, clean
- **Typography scale:** 12/14/16/20/24/32
- **Typography fonts:** primary=Anthropic Sans, display=Anthropic Sans, mono=JetBrains Mono
- **Typography weights:** 100, 200, 300, 400, 500, 600, 700, 800, 900
- **Color palette:** primary, secondary, neutral, success, warning, danger
- **Spacing scale:** 4/8/12/16/24/32

## Colors

- **Primary (#141413):** Token from style foundations.
- **Secondary (#FAF9F6):** Token from style foundations.
- **Success (#16A34A):** Token from style foundations.
- **Warning (#D97706):** Token from style foundations.
- **Danger (#DC2626):** Token from style foundations.
- **Surface (#FFFFFF):** Token from style foundations.
- **Text (#111827):** Token from style foundations.
- **Neutral (#FFFFFF):** Derived from the surface token for official format compatibility.

---

## 実装トークン（正本）

上の Style Foundations はテーマ書き出しの汎用名です。**実装で使う名前と値はこちら**で、
定義箇所は `shared/styles.css` の `:root` の1箇所だけです。モジュール側では再定義しません。

### 色

| トークン | 値 | 用途 |
|---|---|---|
| `--ink` | `#141413` | 文字・罫線・主要ボタン地 |
| `--parchment` | `#faf9f6` | ページ地 |
| `--paper` | `#fffefa` | カード地 |
| `--line` | `#d8d2c4` | 補助罫線 |
| `--muted` | `#6d685e` | 補助文字（地色に対し 5.26:1 以上） |
| `--clay` | `#b5532e` | フォーカスリング・強調ラベル |
| `--ok` | `#16733a` | 正解・完了 |
| `--ng` | `#a5271c` | 誤答・破壊的操作 |
| `--warn` | `#8a5d00` | 要確認 |

状態色は汎用名（success / warning / danger）ではなく `--ok` / `--ng` / `--warn` を使います。
統合前は3アプリが `green`/`ok`、`red`/`ng`/`danger`、`amber`/`warn` と別名で持っていたため一本化しました。
値は地色 `--parchment` に対してコントラスト比 4.5:1 を満たすよう、汎用テーマ値より暗くしています。

### 余白

役割で固定し、全モジュールで再利用します。**スケールは 4/8/16/32/64**（宣言スケール 4/8/12/16/24/32 に 48/64 を追加し、12/24 は使いません）。

| トークン | 値 | 用途 |
|---|---|---|
| `--gap-inline` | 4px | ラベルと値 |
| `--gap-tight` | 8px | 同じグループ内の行間 |
| `--gap-group` | 16px | グループ内のブロック間 |
| `--gap-section` | 32px | グループ間・カード間・カード内padding |
| `--gap-band` | 64px | 画面の大区画間・破壊的操作の隔離 |

**原則：グループ内の最大余白（16）＜ グループ間の最小余白（32）。** これを崩すと近接の意味が反転します。

### レイアウト

| トークン | 値 |
|---|---|
| `--content-max` | 1040px |
| `--tap-min` | 44px |

余白に `clamp()` を使いません。画面幅で位置が動く余白は整列線にならないためです。
