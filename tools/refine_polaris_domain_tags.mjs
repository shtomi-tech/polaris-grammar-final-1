import fs from "node:fs";

const path = new URL("../ポラリス英文法ファイナル演習1/data/polaris_questions.json", import.meta.url);
const data = JSON.parse(fs.readFileSync(path, "utf8"));

// 主分野は維持し、問題文・解説から直接確認できる副分野だけを追加する。
const secondary = {
  unit01_003: "infinitive", unit01_006: "foundation", unit01_009: "conjunction", unit01_010: "nouns",
  unit02_002: "foundation", unit02_007: "passive", unit02_009: "foundation", unit02_010: "foundation",
  unit03_001: "foundation", unit03_002: "passive", unit03_005: "conjunction", unit03_008: "tense",
  unit04_003: "tense", unit04_004: "conjunction", unit04_005: "verb_form", unit04_006: "passive",
  unit04_008: "tense", unit05_002: "tense", unit05_004: "negation", unit05_006: "tense",
  unit05_008: "participle", unit05_010: "negation", unit06_003: "infinitive", unit06_005: "pattern",
  unit06_006: "conjunction", unit06_008: "pattern", unit06_010: "preposition", unit07_001: "preposition",
  unit07_005: "foundation", unit07_007: "pattern", unit07_009: "nouns", unit08_003: "conjunction",
  unit08_006: "modal", unit08_008: "infinitive", unit08_009: "nouns", unit08_010: "adverb",
  unit09_002: "nouns", unit09_003: "preposition", unit09_004: "adverb", unit09_005: "foundation",
  unit09_007: "foundation", unit09_009: "tense", unit09_010: "foundation", unit10_001: "preposition",
  unit10_004: "foundation", unit10_007: "conjunction", unit10_008: "conjunction", unit10_010: "conjunction"
};

for (const question of data.questions) {
  if (secondary[question.id]) question.domains = [...new Set([...question.domains, secondary[question.id]])];
}

let text = fs.readFileSync(path, "utf8");
for (const question of data.questions) {
  const idMarker = `      "id": "${question.id}",\n`;
  const idIndex = text.indexOf(idMarker);
  const domainIndex = text.indexOf("      \"domains\":", idIndex);
  if (idIndex < 0 || domainIndex < idIndex) throw new Error(`Missing domain line: ${question.id}`);
  const lineEnd = text.indexOf("\n", domainIndex) + 1;
  text = text.slice(0, domainIndex) + `      "domains": ${JSON.stringify(question.domains)},\n` + text.slice(lineEnd);
}
fs.writeFileSync(path, text, "utf8");
console.log(`Added secondary tags to ${Object.keys(secondary).length} questions.`);
