"use strict";
/* ============================================================
   shared/store.js — 学習進捗の唯一の正（統合ストア）

   統合前は3モジュールが別々のlocalStorageキーに書いており、
   「同じ生徒の学習全体」を1つの情報源として扱えなかった。
   ここで生徒1人＝1レコードに集約する。

     localStorage : egt.progress.<studentId>
     Supabase     : app_progress(app='english-grammar-trainer', student_id)

   各モジュールは scope("foundation") 等で自分の名前空間だけを触る。
   ============================================================ */

const KEY_PREFIX = "egt.progress.";
const VERSION = 1;
export const MODULE_IDS = ["foundation", "grammar", "reading"];

function emptyState() {
  const state = { version: VERSION };
  MODULE_IDS.forEach((id) => { state[id] = {}; });
  return state;
}

function normalize(raw) {
  const state = emptyState();
  if (!raw || typeof raw !== "object") return state;
  MODULE_IDS.forEach((id) => {
    if (raw[id] && typeof raw[id] === "object") state[id] = raw[id];
  });
  return state;
}

function storageKey(studentId) {
  return `${KEY_PREFIX}${studentId}`;
}

export function createStore() {
  let studentId = null;
  let state = emptyState();
  const listeners = new Set();
  let persist = () => {};

  function notify(moduleId) {
    listeners.forEach((fn) => {
      try { fn(moduleId); } catch (e) { console.error(e); }
    });
  }

  function readLocal() {
    if (!studentId) return emptyState();
    try {
      return normalize(JSON.parse(localStorage.getItem(storageKey(studentId))));
    } catch {
      return emptyState();
    }
  }

  function writeLocal() {
    if (!studentId) return;
    localStorage.setItem(storageKey(studentId), JSON.stringify(state));
  }

  return {
    /** 生徒を切り替える。その生徒のレコードを読み直し、購読者へ通知する。 */
    useStudent(nextStudentId) {
      if (studentId === nextStudentId) return;
      studentId = nextStudentId;
      state = readLocal();
      notify(null);
    },

    /** クラウド保存のトリガーを登録する（cloud.queueSave を渡す）。 */
    setPersist(fn) {
      persist = typeof fn === "function" ? fn : () => {};
    },

    /** クラウドから来た進捗で丸ごと置き換える（ローカルには書くが再保存はしない）。 */
    replace(raw) {
      state = normalize(raw);
      writeLocal();
      notify(null);
    },

    /** クラウドへ送る全体スナップショット。 */
    snapshot() {
      return JSON.parse(JSON.stringify(state));
    },

    /** モジュール単位の読み書き口。モジュールは自分の名前空間だけを触る。 */
    scope(moduleId) {
      if (!MODULE_IDS.includes(moduleId)) throw new Error(`unknown module: ${moduleId}`);
      return {
        get() {
          return state[moduleId];
        },
        set(value) {
          state[moduleId] = value && typeof value === "object" ? value : {};
          writeLocal();
          persist();
          notify(moduleId);
        },
        update(fn) {
          const next = fn(JSON.parse(JSON.stringify(state[moduleId])));
          this.set(next);
        },
        clear() {
          this.set({});
        },
      };
    },

    /** 進捗の変化を購読する（ステッパー・横断CTAの再描画用）。 */
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },

    /** この生徒の学習記録をすべて消す。 */
    clearAll() {
      state = emptyState();
      writeLocal();
      persist();
      notify(null);
    },

    currentStudentId() {
      return studentId;
    },
  };
}
