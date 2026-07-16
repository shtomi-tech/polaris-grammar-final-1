"use strict";

global.window = {};
require("../data/questions.js");

const data = global.window.GRAMMAR_CHECK_DATA;
const errors = [];
const ids = new Set();
const domains = new Set(data.domains.map(domain => domain.id));

if (data.domains.length !== 17) errors.push(`分野数: ${data.domains.length}（17が必要）`);
if (data.questions.length !== 60) errors.push(`問題数: ${data.questions.length}（60が必要）`);

for (const question of data.questions) {
  if (ids.has(question.id)) errors.push(`問題ID重複: ${question.id}`);
  ids.add(question.id);
  if (!domains.has(question.domain)) errors.push(`未定義分野: ${question.id} / ${question.domain}`);
  if (!Array.isArray(question.choices) || question.choices.length !== 4) errors.push(`選択肢数不正: ${question.id}`);
  if (!question.choices.includes(question.answer)) errors.push(`正解が選択肢にない: ${question.id}`);
  if (!question.explanation) errors.push(`問題別解説なし: ${question.id}`);
}

for (const domain of data.domains) {
  for (const key of ["rule", "points", "examples", "traps"]) {
    if (!domain[key] || !domain[key].length) errors.push(`分野解説不足: ${domain.id} / ${key}`);
  }
}

if (errors.length) {
  console.error("NG");
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

const counts = Object.fromEntries(data.domains.map(domain => [domain.label, data.questions.filter(question => question.domain === domain.id).length]));
console.log(`OK: ${data.questions.length}問 / ${data.domains.length}分野`);
console.log(JSON.stringify(counts));
