"use strict";
/*
 * 基礎チェックの問題データを検査する。
 *
 * 総数のハードコードは持たない。カウントは questions[] から導出し、
 * questions.json に保存された値と一致するかを見る（同期は sync-counts.js の役目）。
 * 問題を追加してもこのファイルを編集する必要はない。
 */

const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const data = JSON.parse(fs.readFileSync(path.join(root, "data", "questions.json"), "utf8"));
const errors = [];
const expectedContentVersion = "grammar-200q-merged-v1";
const statusSource = fs.readFileSync(path.join(root, "status.js"), "utf8");

const fatal = [];
if (!Array.isArray(data.questions)) fatal.push("questions.jsonにquestions配列がありません");
if (!Array.isArray(data.sets) || data.sets.length !== 1) fatal.push("sets[]は出題する1セットだけにしてください");
if (!data.learningPath || !Array.isArray(data.learningPath.chapters)) fatal.push("learningPathがありません");

if (fatal.length) {
  console.error(fatal.map((error) => `[ERROR] ${error}`).join("\n"));
  process.exitCode = 1;
} else {
  const setId = data.sets[0].id;
  const questions = data.questions.filter((question) => question.setId === setId);
  const chapters = data.learningPath.chapters;
  const lessons = chapters.flatMap((chapter) => chapter.lessons || []);
  const lessonIds = new Set(lessons.map((lesson) => lesson.id));
  const unitIds = new Set((data.units || []).map((unit) => unit.id));

  // 出題対象外のレコードが混ざっていないか（旧セットの残骸を持ち込まない）
  const foreign = data.questions.length - questions.length;
  if (foreign > 0) errors.push(`出題されないsetIdの問題が${foreign}件あります`);

  // 進捗の保存キー。変えると全生徒の記録が消えるので固定であることを検査する
  if (!statusSource.includes(`export const CONTENT_VERSION = "${expectedContentVersion}";`)) {
    errors.push("status.jsの教材版がgrammar-200q-merged-v1ではありません");
  }
  if (!statusSource.includes(`export const SET_ID = "${setId}";`)) {
    errors.push(`status.jsのSET_IDがquestions.jsonのセットid(${setId})と一致しません`);
  }
  if (!statusSource.includes(`export const SECTION_COUNT = ${lessons.length};`)) {
    errors.push(`status.jsのSECTION_COUNTが学習セクション数(${lessons.length})と一致しません`);
  }

  // 導出値との照合。ズレていたら sync-counts.js を実行すれば直る
  const countByLesson = new Map();
  for (const question of questions) {
    countByLesson.set(question.lessonId, (countByLesson.get(question.lessonId) || 0) + 1);
  }
  if (data.sets[0].questionCount !== questions.length) {
    errors.push(`sets[0].questionCount: ${data.sets[0].questionCount}（実データは${questions.length}。sync-counts.jsを実行してください）`);
  }
  if (data.learningPath.chapterCount !== chapters.length) {
    errors.push(`learningPath.chapterCount: ${data.learningPath.chapterCount}（実データは${chapters.length}）`);
  }
  if (data.learningPath.lessonCount !== lessons.length) {
    errors.push(`learningPath.lessonCount: ${data.learningPath.lessonCount}（実データは${lessons.length}）`);
  }
  for (const lesson of lessons) {
    const actual = countByLesson.get(lesson.id) || 0;
    if (lesson.count !== actual) {
      errors.push(`セクション問題数不一致: ${lesson.id} / 保存値${lesson.count}・実データ${actual}`);
    }
  }

  // 予習資料のパスは lessonId から決まる（app.js の prepPath と同じ規則）
  for (const lesson of lessons) {
    if (!fs.existsSync(path.join(root, "data", `prep-${lesson.id}.md`))) {
      errors.push(`予習資料のファイルがありません: data/prep-${lesson.id}.md`);
    }
  }

  const ids = new Set();
  for (const question of questions) {
    if (ids.has(question.id)) errors.push(`問題ID重複: ${question.id}`);
    ids.add(question.id);
    if (!lessonIds.has(question.lessonId)) errors.push(`未定義セクション: ${question.id} / ${question.lessonId}`);
    if (question.unit && !unitIds.has(question.unit)) errors.push(`未定義unit: ${question.id} / ${question.unit}`);
    if (!Array.isArray(question.choices) || question.choices.length !== 4) {
      errors.push(`選択肢数不正: ${question.id}`);
    } else if (new Set(question.choices).size !== question.choices.length) {
      errors.push(`選択肢が重複: ${question.id}`);
    }
    if (!Number.isInteger(question.answerIndex) || question.answerIndex < 0 || question.answerIndex > 3) {
      errors.push(`正答位置不正: ${question.id}`);
    }
    if (!question.prompt && !question.sentence) errors.push(`設問または英文なし: ${question.id}`);
    if (!Array.isArray(question.explanation) || !question.explanation.length) {
      errors.push(`解説なし: ${question.id}`);
    }
    if (!question.misconceptions) errors.push(`誤答の焦点なし: ${question.id}`);
    if (!question.ruleRefs) errors.push(`ruleRefsなし: ${question.id}`);
  }

  if (errors.length) {
    console.error(errors.map((error) => `[ERROR] ${error}`).join("\n"));
    process.exitCode = 1;
  } else {
    console.log(`[OK] 基礎チェック: ${questions.length}問・${chapters.length}章${lessons.length}セクション`);
  }
}
