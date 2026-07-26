"use strict";
/* ============================================================
   shared/flow.js — モジュール登録と横断ルール

   「基礎チェックを終えると英文法演習が解放される」といった
   モジュールをまたぐ判断は、どれか1つのモジュールの持ち物ではない。
   統合前はポラリスの中と flow-nav.js の中に二重に書かれ、
   しかも読むキーが食い違って解放されない状態になっていた。
   横断ルールはここ1箇所に置く。
   ============================================================ */

import * as foundationStatus from "../modules/foundation/status.js";
import * as grammarStatus from "../modules/grammar/status.js";
import * as readingStatus from "../modules/reading/status.js";

export const MODULES = [
  {
    id: "foundation",
    num: "01",
    name: "基礎チェック",
    summarize: foundationStatus.summarize,
    load: () => import("../modules/foundation/app.js"),
  },
  {
    id: "grammar",
    num: "02",
    name: "英文法演習",
    summarize: grammarStatus.summarize,
    load: () => import("../modules/grammar/app.js"),
  },
  {
    id: "reading",
    num: "03",
    name: "英文解釈",
    summarize: readingStatus.summarize,
    load: () => import("../modules/reading/app.js"),
  },
];

export const DEFAULT_MODULE = "foundation";

export function findModule(id) {
  return MODULES.find((m) => m.id === id) || null;
}

/**
 * 全モジュールの状態と、次にやるべき1手を求める。
 * 統合ストアが単一の情報源なので、ここでの判定は近似ではなく実測。
 */
export function computeFlow(store) {
  const states = {};
  MODULES.forEach((mod) => {
    states[mod.id] = mod.summarize(store.scope(mod.id).get());
  });

  // 横断ルール: 英文法演習は基礎チェック完了まで解放しない。
  // 英文解釈は推奨順では最後だが、先に着手してもよい（既存方針を踏襲）。
  if (!states.foundation.complete) {
    states.grammar = {
      ...states.grammar,
      status: "locked",
      detail: "基礎チェック完了で解放",
      nextLabel: null,
    };
  }

  // 推奨導線上の現在地
  let pointer = "reading";
  if (!states.foundation.complete) pointer = "foundation";
  else if (!states.grammar.complete) pointer = "grammar";

  const pointerState = states[pointer];
  return {
    states,
    pointer,
    next: {
      moduleId: pointer,
      label: pointerState.nextLabel || `${findModule(pointer).name}へ進む`,
      detail: pointerState.detail,
    },
  };
}
