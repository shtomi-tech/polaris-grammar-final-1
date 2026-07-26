"use strict";
/* 英文解釈の進捗要約。
   統合前は全問数が分からず「完了」を判定できなかった（flow-nav のコメント参照）。
   統合後はモジュールが教材読込時に totalItems を進捗へ書くため、完了まで判定できる。 */

export function summarize(data) {
  const done = Array.isArray(data && data.completedIds) ? data.completedIds.length : 0;
  const total = Number(data && data.totalItems) || 0;
  const complete = total > 0 && done >= total;
  return {
    complete,
    status: complete ? "done" : (done > 0 ? "progress" : "todo"),
    detail: total ? `${done}/${total}問` : (done ? `${done}問 完了` : "未着手"),
    nextLabel: done > 0 ? "英文解釈を続ける" : "英文解釈を始める",
  };
}
