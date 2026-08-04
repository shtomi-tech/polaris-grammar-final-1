const STEP_IDS = ["first", "compare", "input"];

export function defaultProgress() {
  return {
    answers: {},
    completedIds: [],
    reviewIds: [],
    lastItemId: "",
  };
}

export function emptyAttempt() {
  return {
    slashText: "",
    pattern: "",
    chunks: [],
    note: "",
  };
}

export function blankAnswer() {
  return {
    first: emptyAttempt(),
    checkpoints: {},
    lastStep: "first",
    updatedAt: "",
  };
}

export function normalizeStep(step) {
  return STEP_IDS.includes(step) ? step : "first";
}

function isObject(value) {
  return Boolean(value) && typeof value === "object";
}

function cloneChunks(chunks) {
  if (!Array.isArray(chunks)) return chunks;
  return chunks.map((chunk) => (isObject(chunk) ? { ...chunk } : chunk));
}

function cloneAttempt(attempt) {
  const cloned = { ...attempt };
  if (Array.isArray(attempt?.chunks)) cloned.chunks = cloneChunks(attempt.chunks);
  return cloned;
}

function cloneAnswerRecord(answer) {
  if (!isObject(answer)) return answer;
  const cloned = { ...answer };
  if (isObject(answer.first)) cloned.first = cloneAttempt(answer.first);
  if (isObject(answer.checkpoints)) cloned.checkpoints = { ...answer.checkpoints };
  return cloned;
}

function cloneAnswers(answers) {
  if (Array.isArray(answers)) return answers.map(cloneAnswerRecord);
  return Object.fromEntries(Object.entries(answers).map(([itemId, answer]) => [itemId, cloneAnswerRecord(answer)]));
}

export function normalizeProgress(progress) {
  if (!progress) return defaultProgress();
  return {
    ...defaultProgress(),
    ...progress,
    answers: progress.answers && typeof progress.answers === "object" ? cloneAnswers(progress.answers) : {},
    completedIds: Array.isArray(progress.completedIds) ? [...progress.completedIds] : [],
    reviewIds: Array.isArray(progress.reviewIds) ? [...progress.reviewIds] : [],
  };
}

function normalizeAnswer(answer) {
  const source = isObject(answer) ? answer : blankAnswer();
  const first = { ...emptyAttempt(), ...(source.first || {}) };
  return {
    ...source,
    first: { ...first, chunks: cloneChunks(first.chunks) },
    checkpoints: isObject(source.checkpoints) ? { ...source.checkpoints } : {},
    lastStep: normalizeStep(source.lastStep),
  };
}

export function materializeAnswer(progress, itemId) {
  const normalized = normalizeProgress(progress);
  const answers = { ...normalized.answers };
  const answer = normalizeAnswer(answers[itemId]);
  answers[itemId] = answer;
  return {
    progress: { ...normalized, answers },
    answer,
  };
}

export function splitSlash(value) {
  return String(value || "")
    .split("/")
    .map((part) => part.trim())
    .filter(Boolean);
}

export function seedSlashText(item, attempt) {
  const cloned = cloneAttempt(attempt);
  if (attempt.slashText || attempt.chunks?.length || attempt.note) return cloned;
  return { ...cloned, slashText: item?.sentence || "" };
}

export function attemptFromSlash(attempt) {
  const parts = splitSlash(attempt.slashText);
  const old = attempt.chunks || [];
  return {
    ...cloneAttempt(attempt),
    chunks: parts.map((text, index) => ({
      text,
      role: old[index]?.role || "",
      translation: old[index]?.translation || "",
    })),
  };
}

export function isAttemptReady(attempt) {
  return Boolean(
    attempt.pattern &&
    attempt.chunks?.length &&
    attempt.chunks.every((chunk) => chunk.text?.trim() && chunk.role)
  );
}

export function checkpointsReady(item, answer) {
  const checkpoints = item.explanation?.checkpoints || [];
  if (!checkpoints.length) return true;
  return checkpoints.every((_, index) => answer.checkpoints?.[index]);
}

export function recommendedTarget(items, progress) {
  if (!items.length) return null;
  const normalized = normalizeProgress(progress);
  const lastId = normalized.lastItemId;
  if (lastId && !normalized.completedIds.includes(lastId)) {
    const lastItem = items.find((item) => item.id === lastId);
    if (lastItem) {
      return { item: lastItem, step: normalizeStep(normalized.answers[lastId]?.lastStep), kind: "resume" };
    }
  }
  const next = items.find((item) => !normalized.completedIds.includes(item.id));
  if (next) {
    return { item: next, step: normalizeStep(normalized.answers[next.id]?.lastStep), kind: "next" };
  }
  const reviewId = normalized.reviewIds[0];
  const reviewItem = reviewId ? items.find((item) => item.id === reviewId) : null;
  if (reviewItem) return { item: reviewItem, step: "first", kind: "review" };
  return { item: items[0], step: "first", kind: "done" };
}

export function completeItem(progress, itemId) {
  const normalized = normalizeProgress(progress);
  return {
    ...normalized,
    completedIds: normalized.completedIds.includes(itemId)
      ? [...normalized.completedIds]
      : [...normalized.completedIds, itemId],
    reviewIds: normalized.reviewIds.filter((id) => id !== itemId),
  };
}

export function markForReview(progress, itemId) {
  const normalized = normalizeProgress(progress);
  return {
    ...normalized,
    completedIds: [...normalized.completedIds],
    reviewIds: normalized.reviewIds.includes(itemId)
      ? [...normalized.reviewIds]
      : [...normalized.reviewIds, itemId],
  };
}

export function updateAttempt(progress, itemId, phase, patch, step, updatedAt) {
  const materialized = materializeAnswer(progress, itemId);
  const currentAttempt = materialized.answer[phase] || {};
  const answer = {
    ...materialized.answer,
    [phase]: cloneAttempt({ ...currentAttempt, ...patch }),
    lastStep: normalizeStep(step),
    updatedAt,
  };
  return {
    progress: {
      ...materialized.progress,
      answers: { ...materialized.progress.answers, [itemId]: answer },
      lastItemId: itemId,
    },
    answer,
  };
}
