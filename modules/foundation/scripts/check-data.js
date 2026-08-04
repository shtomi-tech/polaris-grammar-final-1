"use strict";

const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const data = JSON.parse(fs.readFileSync(path.join(root, "data", "questions.json"), "utf8"));
const errors = [];
const mergedSetId = "english-grammar-200-merged";
const expectedContentVersion = "grammar-200q-merged-v1";
const statusSource = fs.readFileSync(path.join(root, "status.js"), "utf8");

if (!Array.isArray(data.questions)) errors.push("questions.jsonにquestions配列がありません");
if (!data.learningPath || !Array.isArray(data.learningPath.chapters)) errors.push("learningPathがありません");

const mergedQuestions = (data.questions || []).filter((question) => question.setId === mergedSetId);
const lessons = (data.learningPath?.chapters || []).flatMap((chapter) => chapter.lessons || []);
const lessonById = new Map(lessons.map((lesson) => [lesson.id, lesson]));
const ids = new Set();

if (mergedQuestions.length !== 566) errors.push(`統合セットの問題数: ${mergedQuestions.length}（566が必要）`);
if (lessons.length !== 43) errors.push(`学習セクション数: ${lessons.length}（43が必要）`);
if (data.sets?.find((set) => set.id === mergedSetId)?.questionCount !== 566) {
  errors.push("統合セットのメタデータ問題数が566ではありません");
}
if (!statusSource.includes(`export const CONTENT_VERSION = "${expectedContentVersion}";`)) {
  errors.push("status.jsの教材版がgrammar-200q-merged-v1ではありません");
}

for (const question of mergedQuestions) {
  if (ids.has(question.id)) errors.push(`問題ID重複: ${question.id}`);
  ids.add(question.id);
  if (!lessonById.has(question.lessonId)) errors.push(`未定義セクション: ${question.id} / ${question.lessonId}`);
  if (!Array.isArray(question.choices) || question.choices.length !== 4) {
    errors.push(`選択肢数不正: ${question.id}`);
  }
  if (!Number.isInteger(question.answerIndex) || question.answerIndex < 0 || question.answerIndex > 3) {
    errors.push(`正答位置不正: ${question.id}`);
  }
  if (!question.prompt && !question.sentence) errors.push(`設問または英文なし: ${question.id}`);
  if (!Array.isArray(question.explanation) || !question.explanation.length) {
    errors.push(`解説なし: ${question.id}`);
  }
}

for (const lesson of lessons) {
  const actual = mergedQuestions.filter((question) => question.lessonId === lesson.id).length;
  const expected = lesson.countsBySet?.[mergedSetId] ?? lesson.count;
  if (actual !== expected) errors.push(`セクション問題数不一致: ${lesson.id} / ${actual}（${expected}が必要）`);
}

if (mergedQuestions.length !== lessons.reduce((sum, lesson) => {
  return sum + (lesson.countsBySet?.[mergedSetId] ?? lesson.count ?? 0);
}, 0)) {
  errors.push("セクション問題数の合計が統合セットと一致しません");
}

if (errors.length) {
  console.error(errors.map((error) => `[ERROR] ${error}`).join("\n"));
  process.exitCode = 1;
} else {
  console.log(`[OK] grammar-200q統合セット: ${mergedQuestions.length}問・${lessons.length}セクション`);
}
