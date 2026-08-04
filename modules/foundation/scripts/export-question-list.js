"use strict";

const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const data = JSON.parse(fs.readFileSync(path.join(root, "data", "questions.json"), "utf8"));
const setId = "english-grammar-200-merged";
const questions = data.questions.filter((question) => question.setId === setId);
const questionByLesson = new Map();
questions.forEach((question) => {
  const list = questionByLesson.get(question.lessonId) || [];
  list.push(question);
  questionByLesson.set(question.lessonId, list);
});

function markdown(value) {
  return String(value ?? "").replaceAll("|", "\\|").replaceAll("\n", " ");
}

function questionMarkdown(question) {
  const choices = question.choices.map((choice, index) => {
    const mark = index === question.answerIndex ? "正答" : "";
    return `| ${index + 1} | ${markdown(choice)} | ${mark} |`;
  }).join("\n");
  const explanation = question.explanation.map(markdown).join(" ");
  return `#### ${question.id}\n\n**段階**：${markdown(question.stage)} ／ **難易度**：${markdown(question.difficulty)}\n\n**設問**：${markdown(question.prompt)}\n\n**英文**：${markdown(question.sentence)}\n\n| 選択肢 | 内容 | 判定 |\n| --- | --- | --- |\n${choices}\n\n**解説**：${explanation}\n\n**誤答の焦点**：${markdown(question.misconceptions || "")}`;
}

const sections = [];
data.learningPath.chapters.forEach((chapter, chapterIndex) => {
  const lessons = chapter.lessons.map((lesson, lessonIndex) => {
    const lessonQuestions = questionByLesson.get(lesson.id) || [];
    return `### ${String(lessonIndex + 1).padStart(2, "0")}｜${lesson.title}\n\n${lessonQuestions.map(questionMarkdown).join("\n\n")}`;
  }).join("\n\n");
  sections.push(`## CHAPTER ${String(chapterIndex + 1).padStart(2, "0")}｜${chapter.title}\n\n${lessons}`);
});

const output = [
  "# 英文法 基礎チェック｜grammar-200q統合セット",
  "",
  "> 自動生成元：`data/questions.json` の `english-grammar-200-merged`",
  ">",
  `> 全${questions.length}問・8章43セクション`,
  "",
  sections.join("\n\n"),
  "",
].join("\n");

fs.writeFileSync(path.join(root, "問題一覧.md"), output, "utf8");
console.log(`作成: 問題一覧.md (${questions.length}問)`);
