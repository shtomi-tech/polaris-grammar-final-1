"use strict";

global.window = {};
require("../data/questions.js");

const data = global.window.GRAMMAR_CHECK_DATA;
const errors = [];
const ids = new Set();
const stems = new Map();
const domains = new Set(data.domains.map(domain => domain.id));
const skillCounts = { knowledge: 0 };
let knowledgeSupportCount = 0;
const warnings = [];

if (data.domains.length !== 16) errors.push(`分野数: ${data.domains.length}（16が必要）`);
if (data.questions.length !== 150) errors.push(`問題数: ${data.questions.length}（150が必要）`);

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
      if (question.misconceptions[choice]?.includes("判断根拠を取り違えている")) errors.push(`誤概念タグが抽象的: ${question.id} / ${choice}`);
    });
  }
  if (question.reason) errors.push(`一問一判断に反する根拠選択あり: ${question.id}`);
  if (/適切でない|誤っている|間違っている/.test(question.stem)) warnings.push(`否定表現を含む設問: ${question.id}`);
  const lengths = question.choices.map(choice => choice.length).filter(Boolean);
  if (Math.max(...lengths) / Math.min(...lengths) > 4) warnings.push(`選択肢長の差が大きい: ${question.id}`);
}

for (const domain of data.domains) {
  for (const key of ["rule", "points", "examples", "traps"]) {
    if (!domain[key] || !domain[key].length) errors.push(`分野解説不足: ${domain.id} / ${key}`);
  }
}

if (skillCounts.knowledge !== 150) errors.push(`知識問題数: ${skillCounts.knowledge}（150が必要）`);
if (knowledgeSupportCount !== 150) errors.push(`知識・補助の問題数: ${knowledgeSupportCount}（150が必要）`);

if (!Array.isArray(data.learningStages) || data.learningStages.length !== 5) errors.push("学習段階: 5段階が必要");
data.learningStages?.forEach((stage, index) => {
  if (stage.questionIds?.length !== 30) errors.push(`第${index + 1}段階: ${stage.questionIds?.length || 0}問（30が必要）`);
});
const stageOrder = Array.isArray(data.learningStages) ? data.learningStages.flatMap(stage => stage.questionIds || []) : [];
if (!Array.isArray(data.questionOrder)) errors.push("固定出題順なし");
else {
  if (data.questionOrder.length !== data.questions.length) errors.push(`固定出題順の件数: ${data.questionOrder.length}`);
  if (new Set(data.questionOrder).size !== data.questionOrder.length) errors.push("固定出題順に重複あり");
  data.questionOrder.forEach(id => {
    if (!ids.has(id)) errors.push(`固定出題順に未定義ID: ${id}`);
  });
  ids.forEach(id => {
    if (!data.questionOrder.includes(id)) errors.push(`固定出題順から欠落: ${id}`);
  });
  if (JSON.stringify(stageOrder) !== JSON.stringify(data.questionOrder)) errors.push("学習段階と固定出題順が不一致");
}

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
console.log(`固定出題順: ${data.learningStages.map(stage => `${stage.label} ${stage.questionIds.length}問`).join(" / ")}`);
if (warnings.length) {
  console.log(`WARN: ${warnings.length}件`);
  warnings.forEach(warning => console.log(`- ${warning}`));
}
