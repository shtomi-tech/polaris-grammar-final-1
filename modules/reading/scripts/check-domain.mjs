import assert from "node:assert/strict";
import {
  attemptFromSlash,
  blankAnswer,
  checkpointsReady,
  completeItem,
  defaultProgress,
  emptyAttempt,
  isAttemptReady,
  markForReview,
  materializeAnswer,
  normalizeProgress,
  normalizeStep,
  recommendedTarget,
  seedSlashText,
  splitSlash,
  updateAttempt,
} from "../domain.js";

function clone(value) {
  return structuredClone(value);
}

function frozen(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    Object.values(value).forEach(frozen);
  }
  return value;
}

function assertUnchanged(value, before, message) {
  assert.deepEqual(value, before, message);
}

assert.deepEqual(defaultProgress(), {
  answers: {}, completedIds: [], reviewIds: [], lastItemId: "",
});
assert.deepEqual(emptyAttempt(), {
  slashText: "", pattern: "", chunks: [], note: "",
});
assert.deepEqual(blankAnswer(), {
  first: emptyAttempt(), checkpoints: {}, lastStep: "first", updatedAt: "",
});

const malformed = { custom: "kept", answers: "bad", completedIds: {}, reviewIds: null, lastItemId: 17 };
const malformedBefore = clone(malformed);
assert.deepEqual(normalizeProgress(malformed), {
  ...defaultProgress(), custom: "kept", lastItemId: 17,
});
assertUnchanged(malformed, malformedBefore, "normalizeProgress must not mutate its input");
assert.deepEqual(normalizeProgress(null), defaultProgress());

assert.equal(normalizeStep("compare"), "compare");
assert.equal(normalizeStep("missing"), "first");
assert.equal(normalizeStep(null), "first");

const slashAttempt = {
  slashText: "  I / saw her /  yesterday / ",
  pattern: "SVO",
  chunks: [
    { text: "old 1", role: "S", translation: "私" },
    { text: "old 2", role: "V", translation: "見た" },
    { text: "old 3", role: "O", translation: "彼女を" },
  ],
  note: "keep",
};
const slashBefore = clone(slashAttempt);
assert.deepEqual(splitSlash(" / A /  / B / "), ["A", "B"]);
assert.deepEqual(splitSlash(0), []);
assert.deepEqual(attemptFromSlash(slashAttempt), {
  ...slashAttempt,
  chunks: [
    { text: "I", role: "S", translation: "私" },
    { text: "saw her", role: "V", translation: "見た" },
    { text: "yesterday", role: "O", translation: "彼女を" },
  ],
});
assertUnchanged(slashAttempt, slashBefore, "attemptFromSlash must not mutate its input");
const emptySeed = frozen({ ...emptyAttempt() });
const seeded = seedSlashText({ sentence: "A sentence." }, emptySeed);
assert.deepEqual(seeded, {
  ...emptyAttempt(), slashText: "A sentence.",
});
assert.notEqual(seeded, emptySeed, "seedSlashText must return a new attempt");
assert.notEqual(seeded.chunks, emptySeed.chunks, "seedSlashText must detach chunks");
seeded.chunks.push({ text: "new" });
assert.deepEqual(emptySeed.chunks, [], "mutating seeded chunks must not affect input");
assert.deepEqual(seedSlashText({ sentence: "ignored" }, slashAttempt), slashAttempt);
assertUnchanged(slashAttempt, slashBefore, "seedSlashText must not mutate its input");

assert.equal(isAttemptReady({ pattern: "SV", chunks: [{ text: "  She ", role: "S", translation: "彼女は" }] }), true);
assert.equal(isAttemptReady({ pattern: "SV", chunks: [{ text: " ", role: "S" }] }), false);
assert.equal(isAttemptReady({ pattern: "SV", chunks: [{ text: "She", role: "" }] }), false);
assert.equal(isAttemptReady({ pattern: "", chunks: [{ text: "She", role: "S" }] }), false);
assert.equal(checkpointsReady({ explanation: { checkpoints: [] } }, { checkpoints: {} }), true);
assert.equal(checkpointsReady({ explanation: { checkpoints: ["one", "two"] } }, { checkpoints: { 0: true, 1: true } }), true);
assert.equal(checkpointsReady({ explanation: { checkpoints: ["one"] } }, { checkpoints: { 0: false } }), false);

const items = [{ id: "a" }, { id: "b" }, { id: "c" }];
const resumeProgress = {
  answers: { b: { lastStep: "compare" } },
  completedIds: ["a"], reviewIds: ["a"], lastItemId: "b",
};
const resumeBefore = clone(resumeProgress);
assert.deepEqual(recommendedTarget(items, resumeProgress), { item: items[1], step: "compare", kind: "resume" });
assertUnchanged(resumeProgress, resumeBefore, "recommendedTarget must not mutate progress");
assert.deepEqual(recommendedTarget(items, {
  answers: {}, completedIds: ["a"], reviewIds: ["a"], lastItemId: "missing",
}), { item: items[1], step: "first", kind: "next" });
assert.deepEqual(recommendedTarget(items, {
  answers: {}, completedIds: ["a", "b", "c"], reviewIds: ["missing", "b"], lastItemId: "missing",
}), { item: items[0], step: "first", kind: "done" });
assert.deepEqual(recommendedTarget(items, {
  answers: {}, completedIds: ["a", "b", "c"], reviewIds: ["b"], lastItemId: "a",
}), { item: items[1], step: "first", kind: "review" });
assert.equal(recommendedTarget([], defaultProgress()), null);

const progress = frozen({
  unknownProgress: { retain: true },
  answers: {
    a: { unknownAnswer: "retain", first: { pattern: "SV", customAttempt: 1 }, checkpoints: { 3: "yes" }, lastStep: "bad" },
    b: { first: { chunks: [{ text: "chunk", role: "S" }] }, checkpoints: { 1: true } },
  },
  completedIds: ["a"],
  reviewIds: ["a", "b"],
  lastItemId: "a",
});
const progressBefore = clone(progress);
const normalizedProgress = normalizeProgress(progress);
normalizedProgress.answers.b.first.chunks[0].text = "normalized";
normalizedProgress.answers.b.first.chunks.push({ text: "new" });
normalizedProgress.answers.b.checkpoints[1] = false;
normalizedProgress.answers.b.extra = "normalized";
normalizedProgress.completedIds.push("normalized");
normalizedProgress.reviewIds.push("normalized");
assertUnchanged(progress, progressBefore, "mutating normalized known containers must not affect input");
const materialized = materializeAnswer(progress, "a");
assert.deepEqual(materialized.answer, {
  unknownAnswer: "retain",
  first: { ...emptyAttempt(), pattern: "SV", customAttempt: 1 },
  checkpoints: { 3: "yes" },
  lastStep: "first",
});
assert.equal(materialized.progress.unknownProgress, progress.unknownProgress);
assertUnchanged(progress, progressBefore, "materializeAnswer must not mutate progress");
materialized.progress.answers.a.first.chunks.push({ text: "detached" });
materialized.progress.answers.a.first.pattern = "SVC";
materialized.progress.answers.a.checkpoints[3] = "changed";
materialized.progress.answers.a.unknownAnswer = "changed";
materialized.progress.completedIds.push("detached");
materialized.progress.reviewIds.push("detached");
assertUnchanged(progress, progressBefore, "mutating materialized known containers must not affect input");

const completed = completeItem(progress, "b");
assert.deepEqual(completed.completedIds, ["a", "b"]);
assert.deepEqual(completed.reviewIds, ["a"]);
assert.equal(completed.unknownProgress, progress.unknownProgress);
assertUnchanged(progress, progressBefore, "completeItem must not mutate progress");
const reviewed = markForReview(progress, "c");
assert.deepEqual(reviewed.completedIds, ["a"]);
assert.deepEqual(reviewed.reviewIds, ["a", "b", "c"]);
assertUnchanged(progress, progressBefore, "markForReview must not mutate progress");

const patch = { slashText: "A / B", chunks: [{ text: "A", role: "S", translation: "A" }] };
const patchBefore = clone(patch);
const updated = updateAttempt(progress, "a", "first", patch, "input", "2026-08-04T00:00:00.000Z");
assert.equal(updated.progress.answers.a.unknownAnswer, "retain");
assert.equal(updated.progress.answers.a.first.customAttempt, 1);
assert.equal(updated.progress.answers.a.first.slashText, "A / B");
assert.equal(updated.progress.answers.a.lastStep, "input");
assert.equal(updated.progress.answers.a.updatedAt, "2026-08-04T00:00:00.000Z");
assert.equal(updated.progress.lastItemId, "a");
assertUnchanged(progress, progressBefore, "updateAttempt must not mutate progress");
updated.progress.answers.a.first.chunks[0].text = "changed";
assertUnchanged(patch, patchBefore, "mutating updated chunks must not affect patch");
assertUnchanged(progress, progressBefore, "mutating updated chunks must not affect progress");

console.log("all focused domain assertions passed");
