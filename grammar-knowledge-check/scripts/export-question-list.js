"use strict";

const fs = require("fs");
const path = require("path");

global.window = {};
require("../data/questions.js");

const data = global.window.GRAMMAR_CHECK_DATA;
const skillLabels = { knowledge: "知識", distinction: "識別", application: "適用" };
const priorityLabels = { core: "中核", support: "補助" };
const domainById = new Map(data.domains.map(domain => [domain.id, domain]));

function markdown(value) {
  return String(value).replaceAll("|", "\\|").replaceAll("\n", " ");
}

function questionMarkdown(question) {
  const choices = question.choices.map((choice, index) => {
    const mark = choice === question.answer ? "正答" : "";
    return `| ${index + 1} | ${markdown(choice)} | ${mark} |`;
  }).join("\n");
  const misconceptions = question.choices
    .filter(choice => choice !== question.answer)
    .map(choice => `- ${markdown(choice)}：${markdown(question.misconceptions[choice])}`)
    .join("\n");
  const reason = question.reason
    ? `\n**根拠選択**：${markdown(question.reason.prompt)}\n\n${question.reason.choices.map((choice, index) => `- ${String.fromCharCode(65 + index)}. ${markdown(choice)}${choice === question.reason.answer ? "（正答）" : ""}`).join("\n")}\n`
    : "";
  return `### ${question.id.toUpperCase()}｜${skillLabels[question.skill]}｜${priorityLabels[question.priority]}\n\n**測定対象**：${markdown(question.target)}\n\n**設問**：${markdown(question.stem)}\n\n| 選択肢 | 内容 | 判定 |\n| --- | --- | --- |\n${choices}\n\n**解説**：${markdown(question.explanation)}\n\n**誤答時に確認する混同**\n\n${misconceptions}${reason}`;
}

const summary = Object.entries(skillLabels)
  .map(([skill, label]) => `${label} ${data.questions.filter(question => question.skill === skill).length}問`)
  .join("／");
const reasonCount = data.questions.filter(question => question.reason).length;
const sections = data.domains.map(domain => {
  const questions = data.questions.filter(question => question.domain === domain.id);
  return `## ${String(domain.order).padStart(2, "0")}｜${domain.label}\n\n${questions.map(questionMarkdown).join("\n\n")}`;
});
const output = `# 英文法 基礎知識チェック｜問題一覧\n\n> 自動生成元：\`data/questions.js\`\n>\n> 全${data.questions.length}問・${data.domains.length}分野／${summary}／根拠選択 ${reasonCount}問\n\n${sections.join("\n\n")}`;

fs.writeFileSync(path.join(__dirname, "..", "問題一覧.md"), `${output}\n`, "utf8");
console.log(`作成: 問題一覧.md (${data.questions.length}問 / 根拠選択 ${reasonCount}問)`);
