"use strict";
/* 英文法演習（ポラリス）の進捗要約。
   推奨順とは切り離し、ここは自分の進捗だけを見る。 */

export function summarize(data) {
  const meta = (data && data.__meta) || {};
  if (meta.mastered) {
    return { complete: true, status: "done", detail: "MASTER 達成", nextLabel: "英文法演習を続ける" };
  }
  const started = Boolean(meta.step1CompletedAt || (typeof meta.bestStreak === "number" && meta.bestStreak > 0));
  let step;
  if (meta.step2CompletedAt) step = "Step 3 最終確認";
  else if (meta.step1CompletedAt) step = "Step 2 ランダム制覇";
  else step = "Step 1 UNIT演習";
  return {
    complete: false,
    status: started ? "progress" : "todo",
    detail: step,
    nextLabel: started ? `英文法演習 ${step}を続ける` : "英文法演習を始める",
  };
}
