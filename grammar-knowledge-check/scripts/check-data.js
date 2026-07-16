"use strict";

global.window = {};
require("../data/questions.js");

const data = global.window.GRAMMAR_CHECK_DATA;
const errors = [];
const ids = new Set();
const stems = new Map();
const domains = new Set(data.domains.map(domain => domain.id));
const skillCounts = { knowledge: 0, distinction: 0, application: 0 };
let knowledgeSupportCount = 0;
const warnings = [];

if (data.domains.length !== 17) errors.push(`分野数: ${data.domains.length}（17が必要）`);
if (data.questions.length !== 100) errors.push(`問題数: ${data.questions.length}（100が必要）`);

for (const question of data.questions) {
  if (ids.has(question.id)) errors.push(`問題ID重複: ${question.id}`);
  ids.add(question.id);
  if (stems.has(question.stem)) errors.push(`設問文重複: ${stems.get(question.stem)} / ${question.id}`);
  else stems.set(question.stem, question.id);
  if (!domains.has(question.domain)) errors.push(`未定義分野: ${question.id} / ${question.domain}`);
  if (!Array.isArray(question.choices) || question.choices.length !== 4) errors.push(`選択肢数不正: ${question.id}`);
  if (new Set(question.choices).size !== question.choices.length) errors.push(`選択肢重複: ${question.id}`);
  if (!question.choices.includes(question.answer)) errors.push(`正解が選択肢にない: ${question.id}`);
  if (!question.explanation) errors.push(`問題別解説なし: ${question.id}`);
  if (!Object.hasOwn(skillCounts, question.skill)) errors.push(`測定区分不正: ${question.id} / ${question.skill}`);
  else skillCounts[question.skill] += 1;
  if (!question.target) errors.push(`測定対象なし: ${question.id}`);
  if (!question.priority || !["core", "support"].includes(question.priority)) errors.push(`重要度不正: ${question.id}`);
  if (question.skill === "knowledge" && question.priority === "support") knowledgeSupportCount += 1;
  if (!question.misconceptions || typeof question.misconceptions !== "object") {
    errors.push(`誤概念タグなし: ${question.id}`);
  } else {
    question.choices.filter(choice => choice !== question.answer).forEach(choice => {
      if (!question.misconceptions[choice]) errors.push(`誤概念タグ不足: ${question.id} / ${choice}`);
    });
  }
  if (question.reason) {
    if (!question.reason.prompt || !Array.isArray(question.reason.choices) || question.reason.choices.length !== 4) errors.push(`根拠選択肢不正: ${question.id}`);
    else if (new Set(question.reason.choices).size !== 4) errors.push(`根拠選択肢重複: ${question.id}`);
    else if (!question.reason.choices.includes(question.reason.answer)) errors.push(`根拠の正解が選択肢にない: ${question.id}`);
  }
  if (/適切でない|誤っている|間違っている/.test(question.stem)) warnings.push(`否定表現を含む設問: ${question.id}`);
  const lengths = question.choices.map(choice => choice.length).filter(Boolean);
  if (Math.max(...lengths) / Math.min(...lengths) > 4) warnings.push(`選択肢長の差が大きい: ${question.id}`);
}

for (const domain of data.domains) {
  for (const key of ["rule", "points", "examples", "traps"]) {
    if (!domain[key] || !domain[key].length) errors.push(`分野解説不足: ${domain.id} / ${key}`);
  }
}

for (const [skill, count] of Object.entries(skillCounts)) {
  if (!count) errors.push(`測定区分なし: ${skill}`);
}
if (knowledgeSupportCount !== 50) errors.push(`知識・補助の問題数: ${knowledgeSupportCount}（50が必要）`);

if (errors.length) {
  console.error("NG");
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

const counts = Object.fromEntries(data.domains.map(domain => [domain.label, data.questions.filter(question => question.domain === domain.id).length]));
console.log(`OK: ${data.questions.length}問 / ${data.domains.length}分野`);
console.log(JSON.stringify(counts));
console.log(`測定区分: ${JSON.stringify(skillCounts)}`);
console.log(`知識・補助: ${knowledgeSupportCount}問`);
if (warnings.length) {
  console.log(`WARN: ${warnings.length}件`);
  warnings.forEach(warning => console.log(`- ${warning}`));
}
