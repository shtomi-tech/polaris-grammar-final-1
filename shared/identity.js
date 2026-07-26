"use strict";
/* ============================================================
   shared/identity.js — 生徒識別の唯一の正

   統合前は3方式が併存していた（ポラリス=生徒ID／基礎チェック=生徒の概念なし／
   英文解釈=生徒名の文字列キー）。そのため flow-nav は他モジュールの状態を
   「近似」でしか出せなかった。ここで1つに束ねる。

   裏側の生徒テーブルは既存の app_students（全アプリ共用）をそのまま使う。
   サーバー側の変更は不要。

   モードは2つ:
     - 共有URLモード（?s=<id>&t=<token>）: 生徒はURLで確定。切替不可。
     - ローカルモード: 端末内の名簿から選ぶ。進捗は端末内のみ。
   ============================================================ */

const ROSTER_KEY = "egt.students";
const ACTIVE_KEY = "egt.activeStudent";

export const DEFAULT_STUDENT = { id: "default", name: "共通" };

export function slugify(name) {
  const ascii = String(name || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return ascii || `student-${Date.now().toString(36)}`;
}

export function createIdentity() {
  let students = [];
  let activeId = DEFAULT_STUDENT.id;
  let locked = false;
  const listeners = new Set();

  function notify() {
    listeners.forEach((fn) => {
      try { fn(active()); } catch (e) { console.error(e); }
    });
  }

  function saveRoster() {
    localStorage.setItem(ROSTER_KEY, JSON.stringify(students));
  }

  function active() {
    return students.find((s) => s.id === activeId) || DEFAULT_STUDENT;
  }

  function ensure(student) {
    if (!students.some((s) => s.id === student.id)) {
      students.push(student);
      saveRoster();
    }
  }

  return {
    /** 端末内の名簿とアクティブ生徒を読み込む。 */
    load() {
      try {
        students = JSON.parse(localStorage.getItem(ROSTER_KEY) || "[]");
      } catch {
        students = [];
      }
      if (!Array.isArray(students)) students = [];
      students = students
        .filter((s) => s && s.id && s.name)
        .map((s) => ({ id: String(s.id), name: String(s.name) }));
      if (!students.some((s) => s.id === DEFAULT_STUDENT.id)) {
        students.unshift(DEFAULT_STUDENT);
      }
      saveRoster();

      activeId = localStorage.getItem(ACTIVE_KEY) || DEFAULT_STUDENT.id;
      if (!students.some((s) => s.id === activeId)) {
        activeId = DEFAULT_STUDENT.id;
        localStorage.setItem(ACTIVE_KEY, activeId);
      }
      return active();
    },

    /** 共有URLで認証された生徒に固定する。以後この端末では切り替えさせない。 */
    lockTo(student) {
      const entry = { id: String(student.id), name: String(student.name || student.id) };
      ensure(entry);
      activeId = entry.id;
      locked = true;
      localStorage.setItem(ACTIVE_KEY, activeId);
      notify();
      return entry;
    },

    isLocked() {
      return locked;
    },

    list() {
      return students.slice();
    },

    active,

    activeId() {
      return activeId;
    },

    setActive(id) {
      if (locked) return active();
      if (!students.some((s) => s.id === id)) return active();
      activeId = id;
      localStorage.setItem(ACTIVE_KEY, activeId);
      notify();
      return active();
    },

    add(name) {
      const trimmed = String(name || "").trim();
      if (!trimmed) return null;
      const id = slugify(trimmed);
      const existing = students.find((s) => s.id === id);
      if (existing) return existing;
      const student = { id, name: trimmed };
      students.push(student);
      saveRoster();
      notify();
      return student;
    },

    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
}
