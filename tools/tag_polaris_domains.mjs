import fs from "node:fs";
import { execFileSync } from "node:child_process";

const path = new URL("../ポラリス英文法ファイナル演習1/data/polaris_questions.json", import.meta.url);
const data = JSON.parse(fs.readFileSync(path, "utf8"));

const tags = {
  unit01_001: "comparison", unit01_002: "nouns", unit01_003: "gerund", unit01_004: "preposition", unit01_005: "relative",
  unit01_006: "conjunction", unit01_007: "preposition", unit01_008: "verb_form", unit01_009: "tense", unit01_010: "pattern",
  unit02_001: "gerund", unit02_002: "relative", unit02_003: "tense", unit02_004: "nouns", unit02_005: "nouns",
  unit02_006: "infinitive", unit02_007: "pattern", unit02_008: "adverb", unit02_009: "infinitive", unit02_010: "negation",
  unit03_001: "conjunction", unit03_002: "participle", unit03_003: "preposition", unit03_004: "gerund", unit03_005: "tense",
  unit03_006: "tense", unit03_007: "modal", unit03_008: "subjunctive", unit03_009: "infinitive", unit03_010: "conjunction",
  unit04_001: "tense", unit04_002: "modal", unit04_003: "subjunctive", unit04_004: "negation", unit04_005: "infinitive",
  unit04_006: "relative", unit04_007: "adverb", unit04_008: "preposition", unit04_009: "preposition", unit04_010: "adverb",
  unit05_001: "preposition", unit05_002: "tense", unit05_003: "nouns", unit05_004: "conjunction", unit05_005: "comparison",
  unit05_006: "subjunctive", unit05_007: "relative", unit05_008: "pattern", unit05_009: "nouns", unit05_010: "modal",
  unit06_001: "tense", unit06_002: "verb_form", unit06_003: "passive", unit06_004: "subjunctive", unit06_005: "passive",
  unit06_006: "tense", unit06_007: "gerund", unit06_008: "infinitive", unit06_009: "participle", unit06_010: "relative",
  unit07_001: "conjunction", unit07_002: "nouns", unit07_003: "gerund", unit07_004: "subjunctive", unit07_005: "relative",
  unit07_006: "preposition", unit07_007: "passive", unit07_008: "foundation", unit07_009: "passive", unit07_010: "preposition",
  unit08_001: "negation", unit08_002: "gerund", unit08_003: "subjunctive", unit08_004: "preposition", unit08_005: "foundation",
  unit08_006: "gerund", unit08_007: "gerund", unit08_008: "verb_form", unit08_009: "infinitive", unit08_010: "negation",
  unit09_001: "tense", unit09_002: "relative", unit09_003: "gerund", unit09_004: "comparison", unit09_005: "gerund",
  unit09_006: "foundation", unit09_007: "adverb", unit09_008: "preposition", unit09_009: "subjunctive", unit09_010: "negation",
  unit10_001: "conjunction", unit10_002: "verb_form", unit10_003: "verb_form", unit10_004: "infinitive", unit10_005: "adverb",
  unit10_006: "modal", unit10_007: "negation", unit10_008: "subjunctive", unit10_009: "tense", unit10_010: "infinitive"
};

if (data.questions.length !== 100 || Object.keys(tags).length !== data.questions.length) {
  throw new Error(`Expected 100 tags for 100 questions; got ${Object.keys(tags).length}/${data.questions.length}`);
}

for (const question of data.questions) {
  const domain = tags[question.id];
  if (!domain) throw new Error(`Missing domain tag: ${question.id}`);
  question.domains = [domain];
}

const relativePath = "ポラリス英文法ファイナル演習1/data/polaris_questions.json";
let text = execFileSync("git", ["show", `HEAD:${relativePath}`], { encoding: "utf8" });
for (const question of data.questions) {
  const marker = `      "id": "${question.id}",\n`;
  if (!text.includes(marker)) throw new Error(`Missing ${question.id}`);
  if (text.includes(`${marker}      "domains":`)) continue;
  text = text.replace(marker, `${marker}      "domains": [${JSON.stringify(question.domains[0])}],\n`);
}
fs.writeFileSync(path, text, "utf8");
console.log(`Tagged ${data.questions.length} Polaris questions.`);
