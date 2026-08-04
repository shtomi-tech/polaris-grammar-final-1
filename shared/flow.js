"use strict";
/* ============================================================
   shared/flow.js — モジュール登録と推奨導線

   推奨順やモジュール間の現在地は、どれか1つのモジュールの持ち物ではない。
   ここでは推奨導線を示すが、各モジュールの入口を不要に閉じない。
   横断ルールはここ1箇所に置く。
   ============================================================ */

import * as foundationStatus from "../modules/foundation/status.js?v=20260804-grammar200q-v10";
import * as grammarStatus from "../modules/grammar/status.js?v=20260804-grammar200q-v10";
import * as readingStatus from "../modules/reading/status.js?v=20260804-grammar200q-v10";

export const MODULES = [
  {
    id: "foundation",
    num: "01",
    name: "基礎チェック",
    summarize: foundationStatus.summarize,
    load: () => import("../modules/foundation/app.js?v=20260804-grammar200q-v10"),
  },
  {
    id: "grammar",
    num: "02",
    name: "英文法演習",
    summarize: grammarStatus.summarize,
    load: () => import("../modules/grammar/app.js?v=20260804-grammar200q-v10"),
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
