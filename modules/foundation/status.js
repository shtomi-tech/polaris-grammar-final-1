"use strict";
/* grammar-200q統合セットの進捗要約。保存側と同じ教材版だけを読む。 */

export const SET_ID = "english-grammar-200-merged";
export const SECTION_COUNT = 43;
export const CONTENT_VERSION = "grammar-200q-merged-v1";
export const FOUNDATION_SESSION_VERSION = 1;

export function summarize(data) {
  const currentData = data?.contentVersion === CONTENT_VERSION ? data : null;
  const sectionScores = currentData?.scores?.[SET_ID] || {};
  const done = Object.values(sectionScores).filter((score) => score?.completed === true).length;
  const complete = done === SECTION_COUNT;
  const session = currentData?.session;
  const resumable = Boolean(
    session
      && session.version === FOUNDATION_SESSION_VERSION
      && session.lessonId
      && Array.isArray(session.questionIds)
      && session.questionIds.length > 0
  );
  const sessionPosition = resumable
    ? `${Math.min(Math.max(Number(session.index || 0) + 1, 1), session.questionIds.length)}/${session.questionIds.length}問`
    : "";
  return {
    complete,
    completedSections: done,
    status: complete ? "done" : (done > 0 || resumable ? "progress" : "todo"),
    detail: complete
      ? "完了"
      : resumable
        ? `${done}/${SECTION_COUNT} セクション・途中保存あり`
        : `${done}/${SECTION_COUNT} セクション`,
    nextLabel: complete
      ? "基礎チェックを復習する"
      : resumable
        ? `基礎チェックを途中から再開（${sessionPosition}）`
        : `基礎チェック ${Math.min(done + 1, SECTION_COUNT)}/${SECTION_COUNT}セクションを始める`,
  };
}
