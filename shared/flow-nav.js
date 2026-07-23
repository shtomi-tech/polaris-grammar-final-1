/*
 * 学習フロー・現在地インジケータ（共通コンポーネント）
 *
 * 3モジュール（基礎チェック → ポラリス英文法演習 → 英文解釈）の各ページ上部に、
 * 現在地・完了・未解放を示すステッパーを表示する。
 *
 * 設計方針:
 *   - 既存の localStorage 進捗を「読み取って可視化するだけ」。出題・採点・ゲート判定・
 *     データは一切変更しない。
 *   - 生徒識別が3モジュールで不一致という制約のため、v1 は「選択中の生徒基準で近似」する。
 *   - リンクのローカル入れ子 / 公開ルートの差は、既存 app.js の href ヘルパーと同じ規約で解決する。
 *
 * 状態判定の根拠（既存実装に合わせる）:
 *   - 基礎チェック: key "grammar-knowledge-check-v2" の stageResults で total===30 の段階数 /5。
 *     （ポラリス app.js foundationStatus() と同一判定）
 *   - ポラリス:   key "polarisFinalGrammar1.progress.<studentId>" の __meta
 *     （mastered / step2CompletedAt / step1CompletedAt / bestStreak）。
 *   - 英文解釈:   key "polaris_reading_mvp_v1::<dataset>::<student>" の completedIds。
 */
(function () {
  "use strict";

  var FOUNDATION_KEY = "grammar-knowledge-check-v2";
  var FOUNDATION_STAGES = 5;
  var FOUNDATION_STAGE_TOTAL = 30; // ポラリス側の判定 total===30 と一致させる
  var POLARIS_PREFIX = "polarisFinalGrammar1.progress.";
  var POLARIS_ACTIVE_STUDENT_KEY = "polarisFinalGrammar1.activeStudent";
  var POLARIS_DEFAULT_STUDENT = "default";
  var READING_PREFIX = "polaris_reading_mvp_v1::";

  var MODULES = [
    { id: "foundation", num: "01", name: "基礎チェック" },
    { id: "polaris", num: "02", name: "英文法演習" },
    { id: "reading", num: "03", name: "英文解釈" }
  ];

  // ---- localStorage 安全読み取り ----------------------------------------
  function readJSON(key) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  // ---- 現在のモジュール・レイアウト判定 ---------------------------------
  function detectCurrent() {
    var path = "";
    try { path = decodeURI(location.pathname); } catch (e) { path = location.pathname; }
    if (path.indexOf("/grammar-knowledge-check/") >= 0) return "foundation";
    if (path.indexOf("/reading/") >= 0) return "reading";
    // ポラリスはローカルでは入れ子、公開ではルート。どちらも polaris 扱い。
    return "polaris";
  }

  function isLocalLayout() {
    return ["", "localhost", "127.0.0.1"].indexOf(location.hostname) >= 0;
  }

  // ---- 各モジュールから他モジュールへの href（既存ヘルパーと同規約）------
  function hrefs(current, local) {
    var polarisFromSibling = local ? "../ポラリス英文法ファイナル演習1/index.html" : "../";
    if (current === "foundation") {
      return { foundation: "./", polaris: polarisFromSibling, reading: "../reading/" };
    }
    if (current === "reading") {
      return { foundation: "../grammar-knowledge-check/", polaris: polarisFromSibling, reading: "./" };
    }
    // current === polaris
    return {
      foundation: local ? "../grammar-knowledge-check/index.html" : "grammar-knowledge-check/index.html",
      polaris: "./",
      reading: local ? "../reading/" : "reading/"
    };
  }

  // ---- 状態計算 ---------------------------------------------------------
  function foundationState() {
    var history = readJSON(FOUNDATION_KEY);
    var results = (history && history.stageResults) || {};
    var done = 0;
    for (var i = 1; i <= FOUNDATION_STAGES; i++) {
      var r = results["stage" + i];
      if (r && r.total === FOUNDATION_STAGE_TOTAL) done++;
    }
    var complete = done === FOUNDATION_STAGES;
    return {
      complete: complete,
      status: complete ? "done" : (done > 0 ? "progress" : "todo"),
      detail: complete ? "完了" : done + "/" + FOUNDATION_STAGES + " 段階"
    };
  }

  function polarisState(foundationComplete) {
    if (!foundationComplete) {
      return { status: "locked", detail: "基礎チェック完了で解放", mastered: false };
    }
    var studentId = null;
    try { studentId = localStorage.getItem(POLARIS_ACTIVE_STUDENT_KEY); } catch (e) {}
    studentId = studentId || POLARIS_DEFAULT_STUDENT;
    var progress = readJSON(POLARIS_PREFIX + studentId) || {};
    var meta = progress.__meta || {};
    if (meta.mastered) return { status: "done", detail: "MASTER 達成", mastered: true };
    var started = !!(meta.step1CompletedAt || (typeof meta.bestStreak === "number" && meta.bestStreak > 0));
    var stepLabel;
    if (meta.step2CompletedAt) stepLabel = "Step 3 最終確認";
    else if (meta.step1CompletedAt) stepLabel = "Step 2 ランダム制覇";
    else stepLabel = "Step 1 UNIT演習";
    return { status: started ? "progress" : "todo", detail: stepLabel, mastered: false };
  }

  function readingState() {
    var completed = 0;
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var key = localStorage.key(i);
        if (key && key.indexOf(READING_PREFIX) === 0) {
          var p = readJSON(key);
          var n = p && Array.isArray(p.completedIds) ? p.completedIds.length : 0;
          if (n > completed) completed = n; // 生徒別に近似（最大件数の進捗を採用）
        }
      }
    } catch (e) {}
    // 全問数が不明なため「完了」は断定せず、進行中/未着手のみ表す。
    return {
      status: completed > 0 ? "progress" : "todo",
      detail: completed > 0 ? completed + "問 完了" : "未着手"
    };
  }

  // 推奨導線上の「現在地」を1つ決める
  function currentPointer(fnd, pol) {
    if (!fnd.complete) return "foundation";
    if (!pol.mastered) return "polaris";
    return "reading";
  }

  // ---- 描画 -------------------------------------------------------------
  var STATE_META = {
    done: { icon: "✓", label: "完了" },
    progress: { icon: "●", label: "進行中" },
    todo: { icon: "", label: "これから" },
    locked: { icon: "🔒", label: "未解放" }
  };

  function buildNode(mod, st, opts) {
    var isPointer = opts.pointer === mod.id;
    var isViewing = opts.current === mod.id;
    var sm = STATE_META[st.status];
    var li = document.createElement("li");
    li.className = "flowNav__item flowNav__item--" + st.status +
      (isPointer ? " flowNav__item--current" : "") +
      (isViewing ? " flowNav__item--viewing" : "");

    var inner =
      '<span class="flowNav__badge" aria-hidden="true">' +
        (st.status === "done" ? "✓" : (st.status === "locked" ? "🔒" : mod.num)) +
      '</span>' +
      '<span class="flowNav__body">' +
        '<span class="flowNav__name">' +
          '<span class="flowNav__mod">' + mod.name + '</span>' +
          (isPointer ? '<span class="flowNav__you">現在地</span>' : '') +
        '</span>' +
        '<span class="flowNav__status">' +
          '<span class="flowNav__stateLabel">' + sm.label + '</span>' +
          '<span class="flowNav__detail">' + st.detail + '</span>' +
        '</span>' +
      '</span>';

    if (st.status === "locked") {
      var span = document.createElement("span");
      span.className = "flowNav__link";
      span.setAttribute("aria-disabled", "true");
      span.setAttribute("title", "5段階の基礎チェックを完了すると解放されます");
      span.innerHTML = inner;
      li.appendChild(span);
    } else {
      var a = document.createElement("a");
      a.className = "flowNav__link";
      a.href = opts.hrefs[mod.id];
      if (isViewing) a.setAttribute("aria-current", "page");
      var aria = mod.name + "：" + sm.label + "、" + st.detail + (isPointer ? "（現在地）" : "");
      a.setAttribute("aria-label", aria);
      a.innerHTML = inner;
      li.appendChild(a);
    }
    return li;
  }

  function render() {
    if (document.getElementById("flowNav")) return; // 二重描画防止
    var current = detectCurrent();
    var local = isLocalLayout();
    var linkMap = hrefs(current, local);

    var fnd = foundationState();
    var pol = polarisState(fnd.complete);
    var rdg = readingState();
    var stateById = { foundation: fnd, polaris: pol, reading: rdg };
    var pointer = currentPointer(fnd, pol);

    var opts = { current: current, pointer: pointer, hrefs: linkMap };

    var nav = document.createElement("nav");
    nav.id = "flowNav";
    nav.className = "flowNav";
    nav.setAttribute("aria-label", "学習フローの現在地");

    var ol = document.createElement("ol");
    ol.className = "flowNav__list";
    MODULES.forEach(function (mod, idx) {
      if (idx > 0) {
        var sep = document.createElement("li");
        sep.className = "flowNav__sep";
        sep.setAttribute("aria-hidden", "true");
        sep.textContent = "›";
        ol.appendChild(sep);
      }
      ol.appendChild(buildNode(mod, stateById[mod.id], opts));
    });
    nav.appendChild(ol);

    var header = document.querySelector("header");
    if (header && header.insertAdjacentElement) {
      header.insertAdjacentElement("afterend", nav);
    } else {
      var main = document.querySelector("main") || document.body;
      main.insertBefore(nav, main.firstChild);
    }
  }

  function injectStyles() {
    if (document.getElementById("flowNavStyles")) return;
    var css =
      ".flowNav{--fnInk:#141413;--fnPaper:#FAF9F6;--fnLine:#d9d6cf;--fnMuted:#6b675f;" +
        "--fnOk:#166534;--fnOkBg:#dcfce7;--fnWarn:#92400e;--fnWarnBg:#fffbeb;--fnAccent:#141413;" +
        "margin:14px auto;max-width:1040px;padding:0 4px;box-sizing:border-box}" +
      ".flowNav *{box-sizing:border-box}" +
      ".flowNav__list{list-style:none;display:flex;align-items:stretch;gap:8px;margin:0;padding:0;flex-wrap:wrap}" +
      ".flowNav__sep{display:flex;align-items:center;color:var(--fnMuted);font-size:1.1rem;flex:0 0 auto}" +
      ".flowNav__item{flex:1 1 200px;min-width:0;display:flex}" +
      ".flowNav__link{display:flex;align-items:center;gap:10px;width:100%;min-height:56px;" +
        "padding:10px 12px;border:1px solid var(--fnLine);border-radius:12px;background:#fff;" +
        "color:var(--fnInk);text-decoration:none;transition:border-color .15s,box-shadow .15s,background .15s}" +
      "a.flowNav__link:hover{border-color:var(--fnAccent);box-shadow:0 1px 4px rgba(20,20,19,.12)}" +
      "a.flowNav__link:focus-visible{outline:3px solid var(--fnAccent);outline-offset:2px}" +
      ".flowNav__badge{flex:0 0 auto;width:30px;height:30px;border-radius:8px;display:flex;" +
        "align-items:center;justify-content:center;font-family:'JetBrains Mono',ui-monospace,monospace;" +
        "font-size:.82rem;font-weight:700;border:1px solid var(--fnLine);background:var(--fnPaper);color:var(--fnInk)}" +
      ".flowNav__body{display:flex;flex-direction:column;gap:2px;min-width:0}" +
      ".flowNav__name{display:flex;align-items:center;gap:8px}" +
      ".flowNav__mod{font-weight:700;font-size:.95rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}" +
      ".flowNav__you{flex:0 0 auto;font-size:.66rem;font-weight:700;color:#fff;background:var(--fnAccent);" +
        "border-radius:999px;padding:2px 8px;letter-spacing:.02em}" +
      ".flowNav__status{display:flex;align-items:baseline;gap:8px;font-size:.78rem;color:var(--fnMuted);flex-wrap:wrap}" +
      ".flowNav__stateLabel{font-weight:600}" +
      ".flowNav__detail{color:var(--fnMuted)}" +
      // 状態別の見た目（色だけに依存しないよう、バッジ記号・ラベル文言も併用）
      ".flowNav__item--done .flowNav__badge{background:var(--fnOkBg);border-color:#bbf7d0;color:var(--fnOk)}" +
      ".flowNav__item--done .flowNav__stateLabel{color:var(--fnOk)}" +
      ".flowNav__item--current .flowNav__link{border-color:var(--fnAccent);border-width:2px;padding:9px 11px;" +
        "background:var(--fnPaper);box-shadow:0 0 0 3px rgba(20,20,19,.06)}" +
      ".flowNav__item--current .flowNav__badge{background:var(--fnAccent);color:#fff;border-color:var(--fnAccent)}" +
      ".flowNav__item--locked .flowNav__link{background:#f4f2ee;color:var(--fnMuted);cursor:not-allowed}" +
      ".flowNav__item--locked .flowNav__badge{background:#efece7;color:var(--fnMuted)}" +
      ".flowNav__item--locked .flowNav__mod{color:var(--fnMuted)}" +
      ".flowNav__item--viewing .flowNav__link{outline:2px dashed var(--fnLine);outline-offset:2px}" +
      "@media (max-width:640px){" +
        ".flowNav__list{flex-direction:column;align-items:stretch;gap:6px}" +
        ".flowNav__sep{display:none}" +
        ".flowNav__item{flex:1 1 auto}" +
      "}" +
      "@media (prefers-reduced-motion:reduce){.flowNav__link{transition:none}}";
    var style = document.createElement("style");
    style.id = "flowNavStyles";
    style.textContent = css;
    document.head.appendChild(style);
  }

  function init() {
    injectStyles();
    render();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
