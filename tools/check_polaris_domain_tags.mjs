import fs from "node:fs";

const path = new URL("../ポラリス英文法ファイナル演習1/data/polaris_questions.json", import.meta.url);
const data = JSON.parse(fs.readFileSync(path, "utf8"));
const domains = new Set([
  "foundation", "pattern", "verb_form", "tense", "modal", "passive", "infinitive", "gerund", "participle",
  "comparison", "relative", "conjunction", "subjunctive", "nouns", "adverb", "preposition", "negation"
]);

if (data.questions.length !== 100) throw new Error(`問題数が100ではありません: ${data.questions.length}`);
const invalid = data.questions.filter(question => !Array.isArray(question.domains)
  || question.domains.length < 1
  || question.domains.some(domain => !domains.has(domain)));
if (invalid.length) throw new Error(`タグ不正: ${invalid.map(question => question.id).join(", ")}`);

const counts = {};
for (const question of data.questions) for (const domain of question.domains) counts[domain] = (counts[domain] || 0) + 1;
console.log(`OK: ${data.questions.length}問 / 複数タグ ${data.questions.filter(question => question.domains.length > 1).length}問`);
console.log(JSON.stringify(counts));
