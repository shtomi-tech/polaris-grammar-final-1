"use strict";
/* ============================================================
   shared/router.js — モジュールの切り替え

   モジュールのCSSは同時に1つだけ読み込む。
   統合前の3アプリは .panel / .card など同名クラスを別々の意味で使っており、
   全部を同時に読み込むと衝突する。切り替え式にすることで、
   3つのCSSを書き換えずに1アプリへ載せられる。
   ============================================================ */

import { MODULES, DEFAULT_MODULE, findModule } from "./flow.js";

export function createRouter({ mountPoint, styleLink, buildContext, onChange = () => {} }) {
  let currentId = null;
  let currentInstance = null;
  let loadToken = 0;

  /* ハッシュは #/<module>?<params> 形式。
     params はモジュール間の受け渡しに使う。 */
  function routeFromHash() {
    const raw = String(location.hash || "").replace(/^#\/?/, "").trim();
    const [id, query = ""] = raw.split("?");
    return {
      id: findModule(id) ? id : DEFAULT_MODULE,
      params: new URLSearchParams(query),
    };
  }

  async function activate(id, params = new URLSearchParams()) {
    const mod = findModule(id);
    if (!mod) return;

    const token = ++loadToken;

    if (currentInstance && typeof currentInstance.unmount === "function") {
      try { currentInstance.unmount(); } catch (e) { console.error(e); }
    }
    currentInstance = null;
    mountPoint.replaceChildren();

    styleLink.href = `modules/${mod.id}/styles.css`;

    let impl;
    try {
      impl = await mod.load();
    } catch (e) {
      console.error(e);
      if (token !== loadToken) return;
      mountPoint.replaceChildren();
      const p = document.createElement("p");
      p.className = "muted";
      p.textContent = `${mod.name}の読み込みに失敗しました。ページを再読み込みしてください。`;
      mountPoint.appendChild(p);
      return;
    }
    // 読み込み中に別のモジュールへ移動していたら破棄する
    if (token !== loadToken) return;

    currentId = id;
    document.documentElement.dataset.module = id;
    currentInstance = (await impl.mount(mountPoint, buildContext(mod, params))) || null;
    onChange(id);
  }

  return {
    start() {
      window.addEventListener("hashchange", () => {
        const next = routeFromHash();
        activate(next.id, next.params);
      });
      const initial = routeFromHash();
      if (!location.hash) location.hash = `#/${initial.id}`;
      return activate(initial.id, initial.params);
    },
    navigate(id, params) {
      if (!findModule(id)) return;
      const query = params ? String(new URLSearchParams(params)) : "";
      const next = `#/${id}${query ? `?${query}` : ""}`;
      if (location.hash === next) {
        activate(id, new URLSearchParams(query));
        return;
      }
      location.hash = next;
    },
    currentId() {
      return currentId;
    },
    /** 現在のモジュールを、同じ状態で描き直す（生徒切替時に使う）。 */
    reload() {
      if (!currentId) return Promise.resolve();
      return activate(currentId, routeFromHash().params);
    },
    moduleIds() {
      return MODULES.map((m) => m.id);
    },
  };
}
