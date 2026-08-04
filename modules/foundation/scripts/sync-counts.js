"use strict";
/*
 * questions.json のカウントを questions[] から導出して書き戻す。
 *
 * 手で同期していた値をすべてここに集約する。問題を追加・削除したら必ず実行する。
 * 対象:
 *   - sets[].questionCount        画面の「全◯◯問」に出る
 *   - learningPath.chapterCount   同上「◯章」
 *   - learningPath.lessonCount    同上「◯セクション」
 *   - learningPath...lessons[].count  セクション一覧の「全◯問」
 *
 * 実行後は check-data.js が「保存された値 == 実データから数えた値」を検証する。
 */

const fs = require("node:fs");
const path = require("node:path");

const dataPath = path.join(__dirname, "..", "data", "questions.json");
const data = JSON.parse(fs.readFileSync(dataPath, "utf8"));
const setId = data.sets[0].id;

const questions = data.questions.filter((question) => question.setId === setId);
const byLesson = new Map();
for (const question of questions) {
  byLesson.set(question.lessonId, (byLesson.get(question.lessonId) || 0) + 1);
}

const changes = [];
const record = (label, before, after) => {
  if (before !== after) changes.push(`${label}: ${before} -> ${after}`);
};

record("sets[0].questionCount", data.sets[0].questionCount, questions.length);
data.sets[0].questionCount = questions.length;

const chapters = data.learningPath.chapters;
const lessons = chapters.flatMap((chapter) => chapter.lessons);

record("learningPath.chapterCount", data.learningPath.chapterCount, chapters.length);
data.learningPath.chapterCount = chapters.length;
record("learningPath.lessonCount", data.learningPath.lessonCount, lessons.length);
data.learningPath.lessonCount = lessons.length;

for (const lesson of lessons) {
  const actual = byLesson.get(lesson.id) || 0;
  record(`lesson ${lesson.id}.count`, lesson.count, actual);
  lesson.count = actual;
}

const orphan = [...byLesson.keys()].filter((id) => !lessons.some((lesson) => lesson.id === id));
if (orphan.length) {
  console.error(`[ERROR] 未定義セクションを指す問題があります: ${orphan.join(", ")}`);
  process.exitCode = 1;
}

fs.writeFileSync(dataPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");

if (changes.length) {
  console.log(`同期: ${changes.length}件`);
  for (const change of changes) console.log(`  ${change}`);
} else {
  console.log("同期: 変更なし（すべて一致）");
}
console.log(`合計 ${questions.length}問・${chapters.length}章${lessons.length}セクション`);
