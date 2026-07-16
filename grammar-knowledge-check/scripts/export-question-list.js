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
  return `#### ${question.id.toUpperCase()}｜${skillLabels[question.skill]}｜${priorityLabels[question.priority]}\n\n**測定対象**：${markdown(question.target)}\n\n**設問**：${markdown(question.stem)}\n\n| 選択肢 | 内容 | 判定 |\n| --- | --- | --- |\n${choices}\n\n**解説**：${markdown(question.explanation)}\n\n**誤答時に確認する混同**\n\n${misconceptions}`;
}

const summary = Object.entries(skillLabels)
  .map(([skill, label]) => `${label} ${data.questions.filter(question => question.skill === skill).length}問`)
  .join("／");
const questionById = new Map(data.questions.map(question => [question.id, question]));
const sections = data.learningStages.map((stage, stageIndex) => {
  const groups = [];
  stage.questionIds.map(id => questionById.get(id)).forEach(question => {
    const current = groups.at(-1);
    if (!current || current.domainId !== question.domain) groups.push({ domainId: question.domain, questions: [] });
    groups.at(-1).questions.push(question);
  });
  const domains = groups.map(group => {
    const domain = domainById.get(group.domainId);
    return `### ${String(domain.order).padStart(2, "0")}｜${domain.label}\n\n${group.questions.map(questionMarkdown).join("\n\n")}`;
  }).join("\n\n");
  return `## STAGE ${stageIndex + 1}｜${stage.label}\n\n${domains}`;
});
const output = `# 英文法 基礎知識チェック｜問題一覧\n\n> 自動生成元：\`data/questions.js\`\n>\n> 全${data.questions.length}問・${data.domains.length}分野／${summary}\n\n${sections.join("\n\n")}`;

fs.writeFileSync(path.join(__dirname, "..", "問題一覧.md"), `${output}\n`, "utf8");
console.log(`作成: 問題一覧.md (${data.questions.length}問)`);
