"use strict";
/* 基礎チェックの進捗要約。
   統合前は段階完了を「total === 30」というマジックナンバーで外部から判定しており、
   保存キーの版ずれ（v3に書いてv2を読む）と併せて完了が伝わらない不具合を生んでいた。
   ここでは現行教材版の記録だけを対象に、保存側が立てる completed フラグを見る。 */

export const STAGE_COUNT = 5;
export const CONTENT_VERSION = 10;

export function summarize(data) {
  const currentData = data?.contentVersion === CONTENT_VERSION ? data : null;
  const results = currentData?.stageResults || {};
  let done = 0;
  for (let i = 1; i <= STAGE_COUNT; i += 1) {
    if (results[`stage${i}`] && results[`stage${i}`].completed === true) done += 1;
  }
  const complete = done === STAGE_COUNT;
  const resumable = Boolean(currentData?.inProgress);
  return {
    complete,
    completedStages: done,
    status: complete ? "done" : (done > 0 || resumable ? "progress" : "todo"),
    detail: complete ? "完了" : `${done}/${STAGE_COUNT} 段階`,
    nextLabel: complete
      ? "基礎チェックを復習する"
      : (resumable ? "基礎チェックを再開する" : `基礎チェック 第${done + 1}段階を始める`),
  };
}
