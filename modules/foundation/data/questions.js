"use strict";

const DOMAIN_TARGETS = {
  foundation: "品詞・句・節・文の要素を、英文の骨組みから判断する力",
  pattern: "動詞の後ろの要素から文型と自他を判断する力",
  verb_form: "主語・時制・助動詞から動詞の形を決める力",
  tense: "出来事を基準時との関係に置く力",
  modal: "助動詞の形と話し手の判断を区別する力",
  passive: "受け手を主語にした文の形を組み立てる力",
  infinitive: "不定詞の形と文中での働きを判断する力",
  gerund: "動名詞の形と名詞としての働きを判断する力",
  participle: "分詞の能動・受動と修飾関係を判断する力",
  comparison: "比較の対象と程度に合う形を判断する力",
  relative: "先行詞と関係詞節の欠けた要素を判断する力",
  conjunction: "語・句・節のつながり方を判断する力",
  subjunctive: "現実との距離と時点に合う条件表現を判断する力",
  nouns: "名詞の数・可算性・限定を判断する力",
  adverb: "修飾先に合う形と位置を判断する力",
  negation: "否定文・疑問文の助動詞と語順を組み立てる力"
};

const DOMAIN_REVIEW_HINTS = {
  foundation: "まず、語の品詞と文の骨格を分けて確認する。",
  pattern: "動詞の後ろの名詞が目的語か補語かを、説明関係とともに確認する。",
  verb_form: "主語の人称・数、時制、助動詞の有無を順に確認する。",
  tense: "時を表す語と、基準時より前・同時・後のどこかを確認する。",
  modal: "助動詞の後ろは原形にし、文脈から判断の強さを確認する。",
  passive: "動作を受ける名詞を主語にし、be助動詞と過去分詞を確認する。",
  infinitive: "toの後ろの形と、不定詞句が文中で果たす働きを確認する。",
  gerund: "動名詞が名詞の位置にあるか、意味上の主語が示されているかを確認する。",
  participle: "修飾される名詞が動作をする側か、受ける側かを確認する。",
  comparison: "比較する対象と、原級・比較級・最上級のどれが必要かを確認する。",
  relative: "先行詞と、関係詞節の中で主語・目的語など何が欠けているかを確認する。",
  conjunction: "接続詞の前後が語・句・節のどの単位で、対等か従属かを確認する。",
  subjunctive: "現実の事実か反実仮想か、いつの事実かを確認する。",
  nouns: "名詞の数え方と、a・the・所有格などの限定を確認する。",
  adverb: "空所が何を修飾するかを先に確認する。",
  negation: "be動詞・一般動詞・助動詞のどれが述語を作っているかを確認する。"
};

// 原則集に直接対応しない標準的な基礎事項は、ruleRefsを無理に付けずに扱う。
const QUESTION_RULE_REFS = {
  q1: ["egp.sentence-structure.noun"],
  q2: ["egp.verbs.verb", "egp.verbs.intransitive"],
  q3: ["egp.modifiers.adjective", "egp.modifiers.adjective-uses"],
  q4: ["egp.modifiers.adverb-functions", "egp.modifiers.adverb-non-noun-modification", "egp.modifiers.ly-suffix"],
  q5: ["egp.sentence-structure.preposition"],
  q6: ["egp.sentence-structure.preposition-object"],
  q7: ["egp.sentence-structure.sentence-definition"],
  q8: ["egp.sentence-structure.sentence-structure"],
  q9: ["egp.sentence-structure.predicate-verb", "egp.verbs.verb"],
  q10: ["egp.sentence-structure.structural-subject"],
  q11: ["egp.sentence-structure.complement", "egp.modifiers.adjective-uses", "egp.sentence-structure.sentence-pattern-2", "egp.sentence-structure.svc-judgement"],
  q12: ["egp.sentence-structure.verb-object", "egp.verbs.transitive"],
  q13: ["egp.sentence-structure.sentence-structure", "egp.sentence-structure.predicate-verb"],
  q14: ["egp.sentence-structure.noun"],
  q15: ["egp.sentence-structure.dummy-it", "egp.nonfinite.infinitive-form"],
  q16: ["egp.clauses-relatives.coordinating-conjunctions"],
  q17: ["egp.clauses-relatives.subordinating-conjunctions"],
  q18: ["egp.sentence-structure.person"],
  q19: ["egp.nonfinite.nonfinite-verbs"],
  q20: ["egp.nonfinite.infinitive-form"],
  q21: ["egp.nonfinite.nonfinite-verbs"],
  q22: ["egp.sentence-structure.complement"],
  q23: ["egp.sentence-structure.verb-object", "egp.sentence-structure.sentence-pattern-4"],
  q24: ["egp.verbs.transitive", "egp.verbs.transitive-heuristic"],
  q25: ["egp.verbs.intransitive", "egp.verbs.intransitive-heuristic", "egp.sentence-structure.sentence-pattern-1"],
  q26: ["egp.verbs.be-verb-functions", "egp.sentence-structure.sentence-pattern-1"],
  q27: ["egp.verbs.be-verb-functions", "egp.sentence-structure.complement"],
  q28: ["egp.sentence-structure.there-introductory"],
  q29: ["egp.sentence-structure.there-introductory"],
  q30: ["egp.sentence-structure.complement", "egp.modifiers.adjective-uses", "egp.sentence-structure.sentence-pattern-2", "egp.sentence-structure.svc-judgement"],
  q31: ["egp.agreement.third-person-singular-present-s"],
  q32: ["egp.agreement.third-person-singular-present-s"],
  q33: ["egp.sentence-structure.person", "egp.agreement.be-present-past"],
  q34: ["egp.agreement.subject-head"],
  q35: ["egp.agreement.be-present-past"],
  q36: ["egp.verbs.auxiliaries"],
  q37: ["egp.verbs.be-auxiliary-functions"],
  q38: ["egp.verbs.be-auxiliary-functions"],
  q39: ["egp.negation-questions.not-negation"],
  q40: ["egp.negation-questions.yes-no-questions"],
  q41: ["egp.negation-questions.yes-no-questions", "egp.agreement.third-person-singular-present-s"],
  q42: ["egp.negation-questions.yes-no-questions", "egp.modality.could"],
  q43: ["egp.negation-questions.wh-questions"],
  q44: ["egp.negation-questions.wh-questions"],
  q45: ["egp.tense-aspect.progressive-meanings"],
  q46: ["egp.tense-aspect.progressive-meanings", "egp.modifiers.frequency-adverbs"],
  q47: ["egp.tense-aspect.progressive-meanings"],
  q48: ["egp.tense-aspect.progressive-meanings"],
  q49: ["egp.modality.may"],
  q50: ["egp.tense-aspect.progressive-meanings"],
  q51: ["egp.tense-aspect.present-perfect-current-state"],
  q52: ["egp.modality.shall"],
  q53: ["egp.tense-aspect.sequence-of-tenses"],
  q54: ["egp.tense-aspect.sequence-of-tenses"],
  q55: ["egp.modality.have-to"],
  q56: ["egp.modality.will"],
  q57: ["egp.modality.can"],
  q58: ["egp.modality.must"],
  q59: ["egp.modality.should"],
  q60: ["egp.modality.must"],
  q61: ["egp.verbs.auxiliaries"],
  q62: ["egp.modality.have-to"],
  q63: ["egp.verbs.auxiliaries", "egp.modality.can"],
  q64: ["egp.verbs.be-auxiliary-functions"],
  q65: ["egp.voice.passive-formation"],
  q66: ["egp.voice.passive-formation"],
  q67: ["egp.voice.passive-formation", "egp.verbs.be-auxiliary-functions"],
  q68: ["egp.voice.passive-formation"],
  q69: ["egp.voice.passive-formation"],
  q70: ["egp.voice.passive-extended", "egp.verbs.transitive"],
  q71: ["egp.nonfinite.infinitive-form"],
  q72: ["egp.nonfinite.bare-infinitive", "egp.nonfinite.nonfinite-verbs"],
  q73: ["egp.nonfinite.infinitive-semantic-subject"],
  q74: ["egp.nonfinite.initial-to-infinitive-use", "egp.nonfinite.infinitive-form"],
  q75: ["egp.nonfinite.to-infinitive-or-preposition", "egp.nonfinite.infinitive-adjectival-use"],
  q76: ["egp.nonfinite.to-infinitive-or-preposition"],
  q77: ["egp.nonfinite.participial-construction-tense"],
  q78: ["egp.nonfinite.gerund-subject"],
  q79: ["egp.nonfinite.gerund-subject"],
  q80: ["egp.nonfinite.be-to-infinitive"],
  q81: ["egp.nonfinite.participial-construction-formation"],
  q82: ["egp.nonfinite.participial-construction-meaning"],
  q83: ["egp.nonfinite.participial-construction-negation"],
  q84: ["egp.modality.might"],
  q85: ["egp.modality.might", "egp.modality.might-have-pp"],
  q86: ["egp.nonfinite.infinitive-form", "egp.nonfinite.infinitive-semantic-subject"],
  q87: ["egp.modality.could", "egp.modality.could-have-pp"],
  q88: ["egp.nonfinite.infinitive-negation"],
  q89: ["egp.verbs.imperatives", "egp.nonfinite.bare-infinitive"],
  q90: ["egp.verbs.imperatives", "egp.sentence-structure.structural-subject"],
  q91: ["egp.clauses-relatives.as-long-as-as-far-as"],
  q92: ["egp.clauses-relatives.coordinating-conjunctions"],
  q93: ["egp.clauses-relatives.in-case"],
  q94: ["egp.clauses-relatives.appositive-that"],
  q95: ["egp.clauses-relatives.subordinating-conjunctions", "egp.clauses-relatives.if-clause-functions"],
  q96: ["egp.clauses-relatives.subordinating-conjunctions"],
  q97: ["egp.clauses-relatives.relative-pronouns"],
  q98: ["egp.clauses-relatives.relative-pronouns"],
  q99: ["egp.clauses-relatives.relative-pronouns"],
  q100: ["egp.clauses-relatives.relative-pronouns"],
  q101: ["egp.clauses-relatives.relative-clause-uses"],
  q102: ["egp.clauses-relatives.relative-pronoun-omission"],
  q103: ["egp.clauses-relatives.relative-pronoun-omission"],
  q104: ["egp.clauses-relatives.whether-clause-functions"],
  q105: ["egp.negation-questions.indirect-question"],
  q106: ["egp.negation-questions.indirect-question", "egp.negation-questions.wh-questions"],
  q107: ["egp.negation-questions.scope"],
  q108: ["egp.negation-questions.not-negation"],
  q109: ["egp.negation-questions.not-negation"],
  q110: ["egp.negation-questions.yes-no-questions"],
  q114: ["egp.sentence-structure.noun"],
  q111: ["egp.nouns-determiners-pronouns.the-plural-group"],
  q112: ["egp.nouns-determiners-pronouns.indefinite-article"],
  q113: ["egp.nouns-determiners-pronouns.definite-article-the"],
  q115: ["egp.conditionals-subjunctive.if-omission-inversion"],
  q116: ["egp.modifiers.adverb-functions", "egp.modifiers.adverb-non-noun-modification"],
  q117: ["egp.clauses-relatives.adverb-clause-subject-be-omission"],
  q118: ["egp.sentence-structure.preposition"],
  q119: ["egp.sentence-structure.noun"],
  q120: ["egp.sentence-structure.there-introductory"],
  q121: ["egp.comparison.forms-and-targets"],
  q122: ["egp.comparison.forms-and-targets"],
  q123: ["egp.comparison.forms-and-targets"],
  q124: ["egp.comparison.forms-and-targets"],
  q125: ["egp.comparison.forms-and-targets"],
  q129: ["egp.clauses-relatives.so-that-meanings"],
  q130: ["egp.tense-aspect.adverb-clause-present-for-future", "egp.clauses-relatives.if-clause-functions"],
  q131: ["egp.conditionals-subjunctive.past-subjunctive"],
  q132: ["egp.conditionals-subjunctive.past-perfect-subjunctive", "egp.modality.would", "egp.modality.would-have-pp"],
  q133: ["egp.conditionals-subjunctive.mixed-subjunctive"],
  q134: ["egp.conditionals-subjunctive.past-subjunctive"],
  q136: ["egp.conditionals-subjunctive.future-subjunctive"],
  q137: ["egp.tense-aspect.sequence-of-tenses", "egp.modality.will", "egp.modality.would"],
  q138: ["egp.voice.passive-formation"],
  q139: ["egp.nonfinite.nonfinite-verbs"],
  q140: ["egp.clauses-relatives.relative-pronouns", "egp.clauses-relatives.relative-clause-uses"],
  q141: ["egp.sentence-structure.sentence-structure", "egp.sentence-structure.predicate-verb", "egp.sentence-structure.structural-subject", "egp.clauses-relatives.relative-pronouns"],
  q142: ["egp.negation-questions.not-negation"],
  q143: ["egp.nonfinite.perfect-infinitive"],
  q128: ["egp.modality.ought-to", "egp.modality.should"],
  q135: ["egp.modality.should", "egp.modality.should-have-pp"],
  q144: ["egp.modifiers.adverb-functions", "egp.modifiers.adverb-non-noun-modification", "egp.modifiers.ly-suffix"],
  q145: ["egp.sentence-structure.verb-object", "egp.sentence-structure.sentence-pattern-4"],
  q146: ["egp.sentence-structure.noun", "egp.nouns-determiners-pronouns.uncountable-noun"],
  q147: ["egp.modifiers.adverb-functions", "egp.modifiers.adverb-non-noun-modification"],
  q148: ["egp.sentence-structure.complement", "egp.sentence-structure.verb-object"],
  q149: ["egp.clauses-relatives.relative-pronouns"],
  q150: ["egp.negation-questions.yes-no-questions"],
  q151: ["egp.sentence-structure.sentence-pattern-4", "egp.sentence-structure.verb-object"],
  q152: ["egp.sentence-structure.complement", "egp.sentence-structure.verb-object"],
  q153: ["egp.agreement.subject-head"],
  q154: ["egp.agreement.subject-head"],
  q155: ["egp.agreement.subject-head"],
  q156: ["egp.agreement.subject-head"],
  q157: ["egp.tense-aspect.simple-present"],
  q158: ["egp.tense-aspect.perfect-reference-time"],
  q159: ["egp.tense-aspect.perfect-reference-time", "egp.tense-aspect.present-perfect-current-state"],
  q160: ["egp.tense-aspect.perfect-reference-time"],
  q161: ["egp.tense-aspect.perfect-reference-time"],
  q162: ["egp.voice.passive-formation", "egp.modality.must"],
  q163: ["egp.voice.passive-extended", "egp.sentence-structure.sentence-pattern-4"],
  q164: ["egp.voice.passive-extended", "egp.nonfinite.bare-infinitive"],
  q165: ["egp.nonfinite.infinitive-purpose", "egp.nonfinite.infinitive-form"],
  q166: ["egp.nonfinite.infinitive-adjectival-use"],
  q167: ["egp.nonfinite.verb-complement-ing-or-infinitive"],
  q168: ["egp.nonfinite.verb-complement-ing-or-infinitive"],
  q169: ["egp.nonfinite.verb-complement-ing-or-infinitive"],
  q170: ["egp.nonfinite.verb-complement-ing-or-infinitive", "egp.nonfinite.infinitive-purpose"],
  q171: ["egp.nonfinite.verb-complement-ing-or-infinitive", "egp.nonfinite.to-infinitive-or-preposition"],
  q172: ["egp.nonfinite.participles-as-adjectives", "egp.modifiers.adjective-uses"],
  q173: ["egp.nonfinite.participles-as-adjectives", "egp.modifiers.adjective"],
  q174: ["egp.nonfinite.participles-as-adjectives", "egp.nonfinite.participial-construction-formation"],
  q175: ["egp.nonfinite.participles-as-adjectives", "egp.sentence-structure.complement"],
  q176: ["egp.comparison.forms-and-targets", "egp.nouns-determiners-pronouns.quantifiers"],
  q177: ["egp.comparison.extended-patterns"],
  q178: ["egp.comparison.extended-patterns"],
  q179: ["egp.comparison.forms-and-targets", "egp.comparison.extended-patterns"],
  q180: ["egp.comparison.extended-patterns"],
  q181: ["egp.clauses-relatives.relative-adverbs"],
  q182: ["egp.clauses-relatives.relative-adverbs"],
  q183: ["egp.clauses-relatives.what-nominal-clause"],
  q184: ["egp.clauses-relatives.relative-pronouns"],
  q185: ["egp.clauses-relatives.so-that-purpose"],
  q186: ["egp.clauses-relatives.subordinating-conjunctions", "egp.sentence-structure.preposition"],
  q187: ["egp.nonfinite.suggest-complements"],
  q188: ["egp.conditionals-subjunctive.wish"],
  q189: ["egp.conditionals-subjunctive.past-perfect-subjunctive", "egp.conditionals-subjunctive.without-implied-condition"],
  q190: ["egp.nouns-determiners-pronouns.quantifiers"],
  q191: ["egp.nouns-determiners-pronouns.quantifiers", "egp.nouns-determiners-pronouns.uncountable-noun"],
  q192: ["egp.nouns-determiners-pronouns.quantifiers"],
  q193: ["egp.nouns-determiners-pronouns.quantifiers"],
  q194: ["egp.nouns-determiners-pronouns.other-another"],
  q195: ["egp.nouns-determiners-pronouns.other-another"],
  q196: ["egp.modifiers.confusable-adverbs", "egp.modifiers.adverb-functions"],
  q197: ["egp.modifiers.confusable-adverbs", "egp.tense-aspect.perfect-reference-time"],
  q198: ["egp.modifiers.enough-position"],
  q199: ["egp.modifiers.so-such"],
  q200: ["egp.negation-questions.restrictive-adverb-inversion"]
};

// id -> { 誤答choice文字列: 誤概念タグ, ... } 各問題の誤答ごとに差別化された理由。
const QUESTION_MISCONCEPTIONS = {
  q1: {
    "動詞": "study(勉強する)と語形が似ていることに引きずられている。studentは動作ではなく人を表す語。",
    "形容詞": "studentが名詞を修飾する語だと誤解している。studentはそれ自体が人を指す名詞。",
    "副詞": "studentが動詞・形容詞を説明する語だと誤解している。studentは人という「もの」を表す名詞。"
  },
  q14: {
    "考える動作を表す副詞": "名詞を「目に見える物だけを表す語」と限定し、考え・事柄を表す名詞を動作語と誤解している。",
    "考えを説明する形容詞": "ideaがそれ自体で名詞であることを見落とし、修飾する側の語だと誤解している。",
    "場所を表す前置詞": "ideaの品詞を、働きが全く異なる前置詞と混同している。"
  },
  q18: {
    "1人称": "youを話し手側の語と誤解している。youは聞き手を指す2人称。",
    "3人称": "youを聞き手以外の第三者と混同している。3人称は話し手・聞き手のどちらでもない対象。",
    "人称を持たない": "単数・複数で語形が変わらないことを、人称そのものがないことと誤解している。"
  },
  q3: {
    "bookの動作を説明する副詞": "-ful語尾の語を動詞的な働きと誤解し、形容詞と副詞の働きを混同している。",
    "文の主語": "名詞の前にある修飾語を、構造上の主語だと誤解している。主語はa useful book全体。",
    "前置詞の目的語": "文中に前置詞がないのに、前置詞句の例と混同して前置詞の目的語だと誤解している。"
  },
  q4: {
    "Sheの性質": "-lyの副詞を、主語を説明する形容詞だと誤解している。形容詞と副詞を語尾だけで判定しない。",
    "文の主語": "修飾語であるbeautifullyを、構造上の主語と誤解している。",
    "beautifullyの名詞": "「何を修飾するか」ではなく「beautifullyの語形変化」を答える問題だと取り違えている。"
  },
  q5: {
    "形容詞": "inが名詞the roomを直接説明する語だと誤解し、前置詞句全体の働きと前置詞自体の品詞を混同している。",
    "述語動詞": "inを文の骨格を作る語だと誤解している。",
    "接続詞": "inを2つの単位をつなぐ語だと誤解し、前置詞と接続詞の働きを混同している。"
  },
  q6: {
    "the": "冠詞theを名詞そのものと取り違えている。",
    "in": "前置詞in the room全体、または前置詞自身を、前置詞の目的語と取り違えている。",
    "table": "文中に存在しない語を選んでおり、the roomの構成要素を確認できていない。"
  },
  q7: {
    "小文字で始まり、疑問符で終わる": "平叙文と疑問文の書き出し・文末記号を混同している。",
    "動詞だけでできている": "文の成立に構造上の主語が不要だと誤解している。",
    "必ず一語だけでできている": "語群としてのまとまりを、単語数の制約だと誤解している。"
  },
  q8: {
    "前置詞とその目的語": "修飾要素である前置詞句を、文の骨格そのものと誤解している。",
    "形容詞と副詞": "修飾語(あってもなくてもよい要素)を、文の中心的な骨格と誤解している。",
    "接続詞とピリオド": "文をつなぐ語・記号を、文の骨格の定義だと誤解している。"
  },
  q9: {
    "Tom": "主語を述語動詞と取り違えている。",
    "Tom runs全体": "文全体と、その中の一語である述語動詞を区別できていない。",
    "該当なし": "runsを動詞と認識できず、述語動詞が存在しないと誤解している。"
  },
  q10: {
    "the small": "冠詞the・修飾語smallだけを主語とし、中心語dogを含めていない。",
    "barked": "述語動詞を構造上の主語と取り違えている。",
    "small dog": "冠詞Theを含めずに名詞句を不完全に切り取っている。"
  },
  q13: {
    "fly と in": "述語動詞と前置詞の組み合わせを、主語と述語動詞の組み合わせと誤解している。",
    "the sky と fly": "前置詞の目的語であるthe skyを、構造上の主語と取り違えている。",
    "Birds と sky": "修飾語句の中の名詞skyを主語の相手役に選び、述語動詞flyを見落としている。"
  },
  q16: {
    "文と文": "andが常に文と文をつなぐと一般化し、この文でつないでいる単位(語と語)を確認していない。",
    "主語と述語動詞": "andの前後を、文の要素の種類の違いとして誤解している。",
    "前置詞と目的語": "andの前後を、存在しない前置詞関係と誤解している。"
  },
  q17: {
    "名詞だけ": "従属接続詞の後ろを名詞句と誤解し、完全な文が続くという性質を見落としている。",
    "前置詞だけ": "becauseを前置詞(because ofなど)と混同している。",
    "動詞の目的語だけ": "従属接続詞の後ろの節全体を、単なる目的語の並びと誤解している。"
  },
  q2: {
    "主語": "flyを主語と取り違えている。The birdsが主語で、flyは述語動詞。",
    "目的語": "自動詞flyの後ろに目的語があると誤解している。flyはここで目的語を取っていない。",
    "前置詞": "flyを動詞ではなく前置詞と誤認している。"
  },
  q11: {
    "動詞isの目的語": "be動詞の後ろにある語をすべて目的語だと誤解している。kindは主語とイコールになる補語。",
    "前置詞の目的語": "文中に前置詞がないのに、前置詞の目的語と誤解している。",
    "主語を修飾する副詞": "形容詞kindを、語尾だけで副詞と誤認している。"
  },
  q12: {
    "主語の補語": "動詞readの目的語を、主語を説明する補語と取り違えている。readは第2文型ではなく第3文型。",
    "前置詞の目的語": "前置詞なしで動詞に直接続く目的語を、前置詞の目的語と誤解している。",
    "副詞": "a bookという名詞句を、修飾語である副詞と取り違えている。"
  },
  q23: {
    "動詞gaveの直接目的語": "与えられるものa pen(直接目的語)と、受け手me(間接目的語)を取り違えている。",
    "主語の補語": "第4文型の目的語を、主語を説明する補語と誤解している。",
    "前置詞の目的語": "前置詞なしで動詞に直接続く名詞を、前置詞の目的語と誤解している。"
  },
  q22: {
    "動詞madeの目的語": "目的格補語happyを、動詞の目的語(この文ではhim)と取り違えている。",
    "主語Theyを説明する補語": "目的語himを説明する補語(SVOC)を、主語を説明する補語(SVC)と混同している。",
    "前置詞の目的語": "文中に前置詞がないのに、前置詞の目的語と誤解している。"
  },
  q24: {
    "後ろに前置詞があるから": "他動詞・自動詞の判断基準を、前置詞の有無だと誤解している。前置詞なしで目的語を取るかどうかが基準。",
    "主語がIだから": "他動詞・自動詞の判断と、主語の人称を無関係に結びつけている。",
    "過去形だから": "他動詞・自動詞の判断と、時制(過去形)を無関係に結びつけている。"
  },
  q25: {
    "stationが目的語": "前置詞atの目的語であるstationを、動詞arrivedの直接目的語と取り違えている。",
    "過去形だから": "自動詞・他動詞の判断と、時制(過去形)を無関係に結びつけている。",
    "主語がHe": "自動詞・他動詞の判断と、主語の人称を無関係に結びつけている。"
  },
  q26: {
    "〜をする": "be動詞isを、動作を表す一般動詞と誤解している。",
    "〜であるという性質を説明する": "第1文型(存在)のisを、第2文型(性質の説明)の意味と混同している。ここでは場所を示す前置詞句が続く第1文型。",
    "〜される": "isを受動態のbe助動詞と誤解している。ここでは単独のbe動詞。"
  },
  q27: {
    "動詞isの目的語": "be動詞の後ろの語をすべて目的語だと誤解している。a teacherは主語とイコールになる名詞補語。",
    "前置詞の目的語": "文中に前置詞がないのに、前置詞の目的語と誤解している。",
    "場所を表す副詞": "名詞句a teacherを、修飾語である副詞と取り違えている。"
  },
  q28: {
    "場所の名詞": "there構文のthereを、具体的な場所を指す語と誤解している。",
    "主語の代名詞": "誘導副詞thereを、構造上の主語だと誤解している。構造上の主語はa cat。",
    "前置詞": "thereを前置詞と混同している。"
  },
  q29: {
    "is": "there構文のbe動詞を、直後のtwo booksではなく単数だと思い込んで選んでいる。there構文でもbe動詞は後ろの名詞の数に一致させる。",
    "was": "There構文の時制を、現在の文脈なのに過去形にしている。",
    "be": "定形が必要な位置に原形を置いている。助動詞や不定詞のtoがない単独の位置。"
  },
  q30: {
    "動詞becameの目的語": "become(自動詞的なSVC動詞)の補語を、目的語と誤解している。becameは目的語を取らない。",
    "前置詞の目的語": "文中に前置詞がないのに、前置詞の目的語と誤解している。",
    "動詞becameを修飾する副詞": "形容詞coldを、語尾だけで副詞と誤認している。"
  },
  q120: {
    "were": "There構文の主語a problem(単数)ではなく、his感覚で複数のbe動詞を選んでいる。",
    "is": "yesterdayという過去を示す語を見落とし、現在形を選んでいる。",
    "are": "主語a problemが単数であることを見落とし、複数のbe動詞を選んでいる。"
  },
  q145: {
    "動詞gaveの間接目的語": "受け手her brother(間接目的語)と、与えられるものa gift(直接目的語)を取り違えている。",
    "brotherを修飾する形容詞": "第4文型の2つ目の名詞(直接目的語)を、1つ目の名詞を修飾する形容詞と誤解している。",
    "前置詞の目的語": "前置詞なしで動詞に直接続く名詞を、前置詞の目的語と誤解している。"
  },
  q148: {
    "動詞electedの目的語": "目的格補語presidentを、動詞の目的語(him)と取り違えている。",
    "主語Theyの補語": "目的語himを説明する補語(SVOC)を、主語を説明する補語(SVC)と混同している。",
    "前置詞の目的語": "文中に前置詞がないのに、前置詞の目的語と誤解している。"
  },
  q151: {
    "The teacher showed the answer for us.": "第4文型を書き換える前置詞を、toではなくforと誤解している。showはtoを使う動詞。",
    "The teacher showed us to the answer.": "間接目的語と直接目的語の並べ替え方を誤り、toを誤った位置に置いている。",
    "The teacher was shown the answer by us.": "能動文を、受動態の文と取り違えている。"
  },
  q152: {
    "動詞foundの目的語": "目的格補語emptyを、動詞の目的語(the room)と取り違えている。",
    "主語Weを説明する補語": "目的語the roomを説明する補語(SVOC)を、主語を説明する補語(SVC)と混同している。",
    "動詞foundを修飾する副詞": "形容詞emptyを、語尾だけで副詞と誤認している。"
  },
  q15: {
    "天候だけを表す形式上の主語": "形式主語のItを、It rains.のような天候・時刻専用の用法に限定している。",
    "動詞checkが直接取る目的語": "Itを文末のto check the answerの目的語と誤解している。Itはcheckの目的語ではなく形式上の主語。",
    "前置詞toが取る目的語": "Itをto不定詞のtoと結びつけて誤解している。Itは不定詞句の外にある文の主語。"
  },
  q19: {
    "限定詞": "動詞の性質を残しながら別品詞として働くrunningを、名詞の数量・特定を示す限定詞と誤解している。",
    "前置詞": "runningの働きを前置詞と混同している。",
    "関係副詞": "runningを、節を導く関係副詞と誤解している。runningは節を作らない準動詞。"
  },
  q20: {
    "to + 過去形": "不定詞のtoの後ろを、原形ではなく過去形にできると誤解している。",
    "動詞の三単現 + to": "toの前に動詞の三単現を置けると誤解している。不定詞はtoが先。",
    "前置詞 + 過去分詞": "不定詞の形を、前置詞+過去分詞という別の構造と混同している。"
  },
  q111: {
    "A": "The tall treeのように単数可算名詞と誤解し、複数形studentsにaを付けている。",
    "An": "母音で始まる語に付くanを、studentsという複数形に付けている。",
    "Much": "可算名詞studentsに、不可算名詞用の数量詞muchを使っている。"
  },
  q112: {
    "the": "話し手と聞き手がまだ共有していない、初めて話題に出す犬にtheを使っている。theは共有認識が必要。",
    "an": "母音で始まらない子音のdogに、母音の前で使うanを使っている。",
    "some": "1匹と数えられる単数可算名詞に、不可算名詞・複数名詞用のsomeを使っている。"
  },
  q113: {
    "a": "話し手と聞き手が特定の1冊を共有認識している文脈なのに、不特定の1冊を導入するaを使っている。",
    "an": "母音で始まらない子音のbookに、母音の前で使うanを使っている。",
    "many": "単数の1冊を指す文脈に、複数名詞用のmanyを使っている。"
  },
  q114: {
    "不可算名詞を複数にする働き": "oneの働きを、可算・不可算の区別に関する働きと誤解している。oneは前に出た単数可算名詞の代わり。",
    "動詞の時制を表す働き": "oneを時制標識と誤解している。oneは代名詞。",
    "前置詞の代わり": "oneの品詞を前置詞と混同している。"
  },
  q190: {
    "much": "可算名詞booksに、不可算名詞用のmuchを使っている。",
    "little": "数えられるbooksの数量に、不可算名詞の少なさを表すlittleを使っている。",
    "less": "可算名詞の数を尋ねる疑問文に、不可算名詞の比較級lessを使っている。"
  },
  q191: {
    "many": "不可算名詞informationに、可算名詞用のmanyを使っている。",
    "few": "不可算名詞informationの量を尋ねる疑問文に、可算名詞の少なさを表すfewを使っている。",
    "fewer": "不可算名詞に、可算名詞の比較級fewerを使っている。"
  },
  q31: {
    "play": "主語My brother(3人称単数)なのに、sなしの原形にしている。",
    "played": "現在の習慣を表す現在形の文脈で、過去形にしている。",
    "playing": "助動詞や進行形のbeがないのに、-ing形にしている。"
  },
  q32: {
    "studies": "疑問文Does sheの後ろにdoesのsと重ねて、さらに三単現のsを付けている。doesの後ろは原形。",
    "studied": "Doesがある疑問文なのに、過去形にしている。",
    "studying": "Doesがある疑問文なのに、-ing形にしている。"
  },
  q33: {
    "is": "youを3人称扱いし、is(3人称単数)を選んでいる。youは2人称でareを使う。",
    "am": "youを1人称扱いし、amを選んでいる。",
    "be": "定形が必要な位置に原形beを置いている。助動詞がない位置。"
  },
  q34: {
    "are": "動詞の直前にあるthe answers(複数)だけを見て、機械的に複数動詞areを選んでいる。主語句の中心語はEach。",
    "be": "定形が必要な位置に原形beを置いている。",
    "being": "定形が必要な位置に-ing形を置いている。"
  },
  q35: {
    "was": "主語They(複数)なのに、単数用の過去形wasを選んでいる。",
    "are": "yesterdayという過去を示す語を見落とし、現在形areを選んでいる。",
    "is": "yesterdayという過去を示す語を見落とし、現在形・単数のisを選んでいる。"
  },
  q119: {
    "tall": "主語句の中心語treeではなく、修飾語tallを動詞が合わせる相手と誤解している。",
    "The": "冠詞Theを、動詞が一致すべき名詞そのものと取り違えている。",
    "fallen": "過去分詞fallenを、動詞が一致すべき主語の名詞と取り違えている。"
  },
  q153: {
    "have": "主語Every student(単数扱い)なのに、複数用のhaveを選んでいる。everyは単数として扱う。",
    "having": "定形が必要な位置に-ing形を置いている。",
    "to have": "定形が必要な位置に不定詞を置いている。"
  },
  q154: {
    "are": "Either A or Bの一致は近い方(my brother、単数)に合わせるという規則を見落とし、複数のareを選んでいる。",
    "be": "定形が必要な位置に原形beを置いている。",
    "were": "現在の文脈なのに過去形を選んでいる。"
  },
  q155: {
    "are": "The number of ~(単数扱い)を、ofの後ろの複数名詞applicantsに引かれて複数のareにしている。",
    "have": "be動詞が必要な位置にhaveを置いている。",
    "be": "定形が必要な位置に原形beを置いている。"
  },
  q156: {
    "is": "A number of ~(複数扱い、「多くの~」)を、単数のThe number ofと混同してisにしている。",
    "was": "現在の文脈なのに過去形を選んでいる。",
    "be": "定形が必要な位置に原形beを置いている。"
  },
  q36: {
    "be助動詞": "hasを、受動態・進行形を作るbe助動詞と混同している。",
    "do助動詞": "hasを、疑問文・否定文を作るdo助動詞と混同している。",
    "一般助動詞": "hasを、can/willなどの一般助動詞と混同している。hasはhave助動詞で現在完了を作る。"
  },
  q37: {
    "単独のbe動詞": "isを、「〜である」「いる」を表す単独のbe動詞と誤解している。ここは進行形を作るbe助動詞。",
    "do助動詞": "isをdo助動詞と混同している。",
    "一般助動詞": "isをcan/willなどの一般助動詞と混同している。"
  },
  q61: {
    "is": "現在完了を作るhave助動詞の位置に、be助動詞を置いている。",
    "does": "現在完了を作るhave助動詞の位置に、do助動詞を置いている。",
    "can": "現在完了を作るhave助動詞の位置に、一般助動詞canを置いている。"
  },
  q64: {
    "受動態": "be + -ing形(進行形)を、be + 過去分詞(受動態)と混同している。",
    "現在完了": "are playingを、have + 過去分詞で作る現在完了と混同している。",
    "第2文型": "are playingの構造を、be動詞+補語の第2文型と誤解している。ここはbe助動詞+-ing形の進行形。"
  },
  q157: {
    "is boiling": "一般的事実(いつでも成り立つ性質)を、今進行中の動作を表す進行形にしている。",
    "boiled": "一般的事実を表す現在形の文脈を、過去の1回の出来事と誤解している。",
    "has boiled": "一般的事実を、現在完了(過去から現在への結果)と誤解している。"
  },
  q45: {
    "過去の習慣": "現在進行形を、過去の習慣(used toなど)と混同している。",
    "一般的な事実": "今この瞬間の動作を表す進行形を、いつでも成り立つ事実と混同している。",
    "完了した結果": "進行中の動作を、すでに完了した結果と誤解している。"
  },
  q46: {
    "一度だけの過去": "alwaysを伴う進行形(繰り返しへの話者の評価)を、過去の1回の出来事と誤解している。",
    "完了した結果": "進行形を、完了形が表す結果と混同している。",
    "受動態": "isを、進行形ではなく受動態のbe助動詞と誤解している。"
  },
  q47: {
    "永続的な性質": "一時的な状態を表す進行形を、変わらない永続的性質と誤解している。",
    "過去の完了": "現在進行形を、過去に完了した内容と誤解している。",
    "命令": "平叙文の進行形を命令文と誤解している。"
  },
  q48: {
    "過去の反復": "未来の予定を表す進行形を、過去の繰り返しと誤解している。",
    "現在の否定": "肯定文の進行形を否定の意味と誤解している。",
    "受動態": "are leavingを、進行形ではなく受動態のbe助動詞と誤解している。"
  },
  q50: {
    "cooks": "過去のある時点の動作を表す文脈で、一般的事実の現在形を選んでいる。",
    "has cooked": "過去の一時点での進行中の動作を、現在完了と誤解している。",
    "will cook": "過去の文脈(When I called)なのに未来形を選んでいる。"
  },
  q51: {
    "昨日だけ鍵がなかった": "現在完了が示す「現在も続く結果」を見落とし、過去の一時点だけの出来事と誤解している。",
    "これから鍵をなくす": "すでに起きた出来事(現在完了)を、これから起こる未来の出来事と誤解している。",
    "鍵を見つけた": "lostの意味を逆に捉え、鍵が見つかった結果だと誤解している。"
  },
  q158: {
    "ate": "現在までの経験を表す現在完了の文脈で、単純な過去形にしている。基準時とのつながりを見落としている。",
    "am eating": "経験を表す現在完了を、今まさに進行中の動作と誤解している。",
    "had eaten": "基準時が現在なのに、過去完了(より前の過去を基準)にしている。"
  },
  q159: {
    "lived": "still lives thereという現在への継続を見落とし、単純な過去形にしている。",
    "lives": "五年間の継続という幅を見落とし、現在の一時点の事実にしている。",
    "had lived": "基準時が現在なのに、過去完了(より前の過去を基準)にしている。"
  },
  q160: {
    "left": "By the time we arrivedという過去の基準時より前の出来事を、単純な過去形(基準時と同時)にしている。",
    "has left": "基準時が過去(we arrived)なのに、現在完了(基準時が現在)にしている。",
    "will leave": "過去の基準時より前の出来事を、未来の出来事と誤解している。"
  },
  q161: {
    "have worked": "By next Marchという未来の基準時を見落とし、現在完了(基準時が現在)にしている。",
    "had worked": "未来の基準時なのに、過去完了(基準時が過去)にしている。",
    "will work": "十年間の継続という幅を見落とし、単純な未来の1回の動作にしている。"
  },
  q53: {
    "is": "主節の述語動詞said(過去形)を見落とし、that節を現在形にしている。時制の一致を適用していない。",
    "will be": "過去の時点を述べる文脈で、未来形にしている。",
    "has been": "過去の1点(then)を述べる文脈で、現在完了にしている。"
  },
  q54: {
    "has": "主節had said(過去完了)を見落とし、that節を現在完了にしている。",
    "will": "過去の文脈で、未来を表すwillにしている。",
    "is": "過去の文脈で、現在形にしている。"
  },
  q137: {
    "is": "主節said(過去形)を見落とし、that節を現在形にしている。",
    "has been": "過去の文脈で、現在完了にしている。",
    "will be": "時制の一致で、willはwouldに変える必要があるのに、willのままにしている。"
  },
  q42: {
    "Did": "依頼の疑問文Could you ...?を、過去の事実を尋ねるDid you ...?と混同している。",
    "Are": "一般動詞openを含む疑問文に、be動詞用の疑問文の形を使っている。",
    "Have": "依頼の疑問文を、現在完了の疑問文と混同している。"
  },
  q49: {
    "許可": "mayの可能性の意味を、許可の意味(May I ...?)と混同している。",
    "義務": "mayを、義務を表すmustと混同している。",
    "過去の可能": "mayを、過去の意味を持つ語と誤解している。mayに過去の意味はない。"
  },
  q52: {
    "Would": "話し手の申し出Shall I ...?を、依頼・意向のWould you ...?と混同している。",
    "Must": "申し出の疑問文を、義務を尋ねる形と混同している。",
    "Have": "申し出の疑問文を、現在完了の疑問文と混同している。"
  },
  q55: {
    "is": "There has to be(hasが助動詞的にhave toの一部として働く形)を見落とし、be動詞単独にしている。",
    "must": "have toと同じ意味領域のmustに置き換えられるが、この空所はThere ___ to beの構造上hasが入る。mustではtoの形が続かない。",
    "can": "この空所は義務・推定を表すhave toの一部で、canでは意味と語形が合わない。"
  },
  q56: {
    "過去形を作る助動詞": "willの働きを、過去形を作る助動詞と誤解している。willは未来・意志を表す助動詞。",
    "受動態を作るbe助動詞": "willを、受動態を作るbe助動詞と混同している。",
    "名詞を修飾する形容詞": "willの品詞を助動詞ではなく形容詞と誤解している。"
  },
  q57: {
    "ここで泳いだ": "許可を表すcanを、過去の出来事と誤解している。canに過去の意味はない。",
    "ここで泳ぐ必要がある": "許可のcanを、義務を表すmust/have toと混同している。",
    "ここで泳いでいた": "許可のcanを、過去進行形の意味と誤解している。"
  },
  q58: {
    "may": "規則上の義務を表す語に、許可・可能性のmayを選んでいる。",
    "could": "義務を表す語に、過去の可能・丁寧表現のcouldを選んでいる。",
    "would": "義務を表す語に、意志・仮定のwouldを選んでいる。"
  },
  q59: {
    "must have": "助言を表す語に、過去への推量must haveを選んでいる。時制・形が合わない。",
    "can to": "canの後ろにtoを続けるという、存在しない語順にしている。",
    "did": "助言を表す語に、過去形didを選んでいる。"
  },
  q60: {
    "相手に「～しなさい」と求める": "根拠からの推定を表すmustを、命令の意味と誤解している。",
    "相手に「～してよい」と認める": "推定のmustを、許可のmayと混同している。",
    "過去に「～できた」と述べる": "mustを、過去の能力を表す語と誤解している。mustに過去の意味はない。"
  },
  q62: {
    "has to": "主語I(1人称)なのに、3人称単数用のhas toを選んでいる。",
    "must to": "mustの後ろにtoを続けるという、存在しない語順にしている。",
    "having to": "定形が必要な位置に-ing形を置いている。"
  },
  q63: {
    "solves": "助動詞canの後ろに、三単現のsが付いた形を置いている。助動詞の後ろは原形。",
    "solved": "助動詞canの後ろに過去形を置いている。",
    "solving": "助動詞canの後ろに-ing形を置いている。"
  },
  q128: {
    "ought": "ought toのtoを省略している。",
    "ought have": "ought toの構造を、ought have(現在分詞的な形)と誤解している。",
    "oughting to": "oughtに-ingを付けるという、助動詞にない活用をしている。"
  },
  q38: {
    "現在完了": "be + 過去分詞(受動態)を、have + 過去分詞で作る現在完了と混同している。",
    "疑問文": "was brokenの語順を、主語と動詞が入れ替わる疑問文と誤解している。",
    "比較級": "brokenの形を、比較級を作る変化と誤解している。"
  },
  q65: {
    "受動態の主語": "by Kenを、受動態の文の主語(The letter)と取り違えている。",
    "過去分詞の目的語": "by Kenを、writtenが取る目的語だと誤解している。過去分詞は他動詞の目的語を主語に移した後の形で、目的語を取らない。",
    "時を表す副詞": "by Kenの働きを、時を表す副詞句と誤解している。by+動作主は行為者を示す。"
  },
  q66: {
    "the boy": "能動態の主語をそのまま受動態の主語にしている。目的語the windowを主語にする。",
    "the verb": "動詞brokeを主語にできると誤解している。",
    "the subject": "「主語」という語そのものを選んでおり、具体的な語を特定できていない。"
  },
  q67: {
    "did": "受動態のbe助動詞の位置に、do助動詞を置いている。",
    "has": "過去の受動態(be助動詞was)の位置に、現在完了のhaveを置いている。",
    "is being": "yesterdayという過去を示す語を見落とし、現在進行形の受動態にしている。"
  },
  q68: {
    "to": "受動態で動作主を示す前置詞をtoと誤解している。正しくはby。",
    "at": "受動態で動作主を示す前置詞をatと誤解している。",
    "with": "受動態で動作主を示す前置詞をwithと誤解している。withは道具・手段を表す。"
  },
  q69: {
    "have助動詞 + 原形": "受動態の形を、have助動詞+原形(存在しない組み合わせ)と誤解している。",
    "do助動詞 + -ing形": "受動態の形を、do助動詞+-ing形と誤解している。",
    "前置詞 + 過去形": "受動態のbe助動詞を、前置詞と取り違えている。"
  },
  q70: {
    "The child was looked by everyone after.": "句動詞look afterの前置詞afterを、過去分詞の直後から切り離して後ろに置いている。afterはlookedの直後に残す。",
    "Everyone was looked after the child.": "能動態の主語Everyoneをそのまま受動態の主語にしている。目的語the childを主語にする。",
    "The child looked after everyone.": "受動態にする代わりに、能動態のまま主語と目的語を入れ替えている。"
  },
  q138: {
    "The chef was cooked by the meal.": "能動態の主語(the chef)と目的語(the meal)を逆にしたまま受動態にしている。目的語the mealを主語にする。",
    "The meal cooked the chef.": "受動態にする代わりに、能動態のまま主語と目的語を入れ替えている。",
    "The meal did cooked by the chef.": "受動態にdo助動詞を重ね、かつ過去分詞の前にdidを置くという誤った形にしている。"
  },
  q162: {
    "submit": "must(助動詞)の後ろなのに、受動態を作らず能動の原形にしている。目的語がない文脈で受動態が必要。",
    "be submitting": "受動態(be+過去分詞)を、進行形(be+-ing)と混同している。",
    "submitted": "助動詞mustの後ろにbeを置かず、過去分詞だけを置いている。"
  },
  q163: {
    "This watch was given me by I.": "by句の代名詞を、目的格Iではなく主格のまま使っている。",
    "I gave this watch by my aunt.": "受動態にする代わりに能動態のままにし、by my auntを付け足している。",
    "My aunt was given me this watch.": "能動態の主語My auntをそのまま受動態の主語にしている。焦点を当てたいme(受け手)を主語にする。"
  },
  q164: {
    "He was seen enter the room.": "知覚動詞の受動態でtoを落としている。能動態の原形不定詞は、受動態ではto不定詞に戻す。",
    "He saw to enter the room.": "主語と動作主を逆にしたまま受動態の形(to不定詞)だけ加えている。",
    "The room was seen him enter.": "受動態の主語を、動作の対象(him)ではなく場所(the room)にしている。"
  },
  q71: {
    "toの後ろは必ず過去形だから": "不定詞のtoの後ろの形を、過去形だと誤解している。原形が入る。",
    "studyが名詞だから": "studyの品詞を動詞ではなく名詞と誤解している。",
    "toが前置詞だから": "不定詞のtoを、前置詞のtoと混同している。"
  },
  q72: {
    "to run": "使役動詞makeの目的格補語に、to不定詞を置いている。makeは原形不定詞(to無し)を取る。",
    "runs": "原形不定詞の位置に、三単現の形を置いている。",
    "running": "原形不定詞の位置に、-ing形を置いている。"
  },
  q73: {
    "him": "意味上の主語を示すfor+人の形から、forを落として目的格だけにしている。",
    "he": "意味上の主語の位置に、目的格ではなく主格を置いている。for the後ろは目的格。",
    "to him": "意味上の主語を示す前置詞を、forではなくtoにしている。"
  },
  q74: {
    "動詞isの目的語": "文頭のTo read booksを、be動詞isの目的語と誤解している。To read booksは文の主語。",
    "名詞booksを修飾する形容詞": "To read booksを、直前の名詞を修飾する形容詞的用法と誤解している。文頭で主語になる名詞的用法。",
    "前置詞句": "To read booksの品詞を、前置詞句と誤解している。"
  },
  q75: {
    "文の主語になる語": "a book to readのto readを、文の主語になる名詞的用法と誤解している。ここは名詞bookを修飾する形容詞的用法。",
    "needの目的語": "to readを、動詞needの目的語と誤解している。needの目的語はa book。",
    "前置詞の目的語": "to readの働きを前置詞の目的語と誤解している。"
  },
  q76: {
    "to the libraryは不定詞、to studyは前置詞": "2つのtoの働きを逆に判定している。to the libraryのtoは前置詞、to studyのtoは不定詞。",
    "to the libraryは前置詞、to studyも前置詞": "後ろのto studyについて、原形動詞studyが続いていることを見落とし、前置詞と誤解している。",
    "to the libraryは不定詞、to studyも不定詞": "前のto the libraryについて、後ろに名詞the libraryが続いていることを見落とし、不定詞と誤解している。"
  },
  q80: {
    "have": "be to不定詞の助動詞的なbeを、haveと誤解している。",
    "do": "be to不定詞のbeを、doと誤解している。",
    "can": "be to不定詞のbeを、canと誤解している。"
  },
  q86: {
    "understanding": "It is 形容詞 for 人 to ~の構文で、to不定詞の位置に動名詞を置いている。",
    "understand": "to不定詞のtoを落とし、原形だけにしている。",
    "understood": "to不定詞の後ろを過去分詞にしている。原形が入る。"
  },
  q88: {
    "to not to": "not to ~の否定を、toを2回使う誤った形にしている。",
    "not going": "不定詞の否定をnot + -ing形と誤解している。",
    "do not to": "不定詞の否定にdo notを使い、さらにtoを重ねている。"
  },
  q143: {
    "to": "完了不定詞to have p.p.のhaveを落とし、toだけにしている。",
    "having": "完了不定詞を、動名詞的な形having p.p.と誤解している。",
    "to had": "完了不定詞のhaveを、過去形hadと誤解している。haveの後ろは過去分詞。"
  },
  q165: {
    "studying": "目的を表す不定詞的用法を、動名詞(-ing形)と誤解している。",
    "for study": "目的を表す不定詞を、for+名詞の形と誤解している。",
    "studied": "目的を表す不定詞の位置に、過去形を置いている。"
  },
  q166: {
    "finding": "the first studentを修飾する形容詞的用法のto不定詞を、動名詞(-ing形)と誤解している。",
    "found": "形容詞的用法のto不定詞の位置に、過去分詞を置いている。",
    "finds": "形容詞的用法のto不定詞の位置に、三単現の形を置いている。"
  },
  q21: {
    "述語動詞": "動名詞Swimmingを、文の述語動詞と誤解している。述語動詞はis。",
    "形容詞": "Swimmingの品詞を、動名詞ではなく形容詞と誤解している。",
    "前置詞": "Swimmingの品詞を前置詞と混同している。"
  },
  q78: {
    "Him": "動名詞の意味上の主語(所有格が必要な位置)に、目的格を置いている。",
    "He": "動名詞の意味上の主語の位置に、主格を置いている。",
    "Himself": "動名詞の意味上の主語の位置に、再帰代名詞を置いている。"
  },
  q79: {
    "his": "動名詞の意味上の主語(目的格でよい口語的な位置)に、所有格を置いている。",
    "he": "動名詞の意味上の主語の位置に、主格を置いている。",
    "to him": "動名詞の意味上の主語を、前置詞to+目的格の形と誤解している。"
  },
  q167: {
    "to read": "enjoyが動名詞だけを目的語に取る動詞であることを見落とし、to不定詞にしている。",
    "read": "動詞enjoyの目的語の位置に、原形を置いている。",
    "to reading": "動名詞の前に不要なtoを付けている。"
  },
  q168: {
    "to make": "avoidが動名詞だけを目的語に取る動詞であることを見落とし、to不定詞にしている。",
    "make": "動詞avoidの目的語の位置に、原形を置いている。",
    "made": "動詞avoidの目的語の位置に、過去形を置いている。"
  },
  q169: {
    "to lock": "「鍵をかけた記憶がある」という過去の行為の記憶(remember + doing)を、これからする行為(remember + to do)と取り違えている。",
    "lock": "動詞rememberの目的語の位置に、原形を置いている。",
    "locked": "動詞rememberの目的語の位置に、過去形(動詞の定形)を置いている。"
  },
  q170: {
    "resting": "「休むために立ち止まった」という目的(stop + to不定詞)を、stop + -ing(〜するのをやめる)と取り違えている。",
    "rest": "目的を表す不定詞のtoを落とし、原形だけにしている。",
    "rested": "目的を表す不定詞の位置に、過去形を置いている。"
  },
  q171: {
    "meet": "look forward toのtoが前置詞であることを見落とし、原形を続けている。",
    "to meet": "look forward toのtoの後ろに、不定詞用のtoをもう一つ続けている。",
    "met": "前置詞toの後ろに、過去形を置いている。前置詞の後ろは動名詞。"
  },
  q139: {
    "to work": "「疲れたので作業をやめた」という意味(stop + -ing)を、stop + to不定詞(〜するために立ち止まる)と取り違えている。",
    "work": "動名詞の位置に原形を置いている。",
    "worked": "動名詞の位置に過去形を置いている。"
  },
  q77: {
    "Finishing": "分詞構文の動作(宿題を終える)が主節(went out)より前であることを見落とし、単純な-ing形にしている。先行する動作にはhaving+過去分詞を使う。",
    "To have": "分詞構文を、不定詞的な形と誤解している。",
    "Being": "分詞構文の時制(先行する動作)を見落とし、be動詞由来のBeingにしている。"
  },
  q81: {
    "Being fine, we went out.": "分詞構文の主語(The weather)が主節の主語(we)と異なるのに、主語を省略している。主語が異なる場合は残す。",
    "The weather was fine, going out.": "従属節側を分詞構文にせず、主節側を誤って-ing形にしている。",
    "When being fine, we went out.": "分詞構文なのに接続詞Whenを残している。"
  },
  q82: {
    "歌われたので": "文末の付帯状況の分詞構文(〜しながら)を、受け身の意味と誤解している。singingは能動(Sheが歌う)。",
    "歌うために": "付帯状況の分詞構文を、目的を表す不定詞的な意味と誤解している。",
    "歌うべきだったので": "分詞構文を、義務・後悔の意味と誤解している。"
  },
  q83: {
    "No": "分詞構文の否定語notを、noと誤解している。",
    "Did not": "分詞構文の否定に、定形の助動詞didを使っている。分詞の前にnotを置くだけでよい。",
    "Don't": "分詞構文の否定に、定形の助動詞doを使っている。"
  },
  q172: {
    "interesting": "主語The studentsが「興味を持たされる」受け身の関係なのに、能動(興味を起こさせる)のinterestingにしている。",
    "interest": "分詞ではなく原形動詞をbe動詞の後ろに置いている。",
    "interestingly": "形容詞的に働く分詞の位置に、副詞を置いている。"
  },
  q173: {
    "breaking": "the windowが「壊される」受け身の関係なのに、能動(壊す側)のbreakingにしている。",
    "broke": "分詞の位置に過去形を置いている。過去分詞brokenが必要。",
    "breaks": "分詞の位置に三単現の形を置いている。"
  },
  q174: {
    "Seeing": "分詞構文の主語(一般の観察者)とthe townの関係が受け身(見られる)なのに、能動のSeeingにしている。",
    "To see": "分詞構文を不定詞的な形と誤解している。",
    "Saw": "分詞構文の位置に定形の過去形を置いている。"
  },
  q175: {
    "closing": "her eyesが「閉じられる」受け身の関係(付帯状況のwith+名詞+分詞)なのに、能動のclosingにしている。",
    "close": "分詞の位置に原形を置いている。",
    "to close": "分詞の位置に不定詞を置いている。"
  },
  q91: {
    "as far as / as long as": "「時間内では」のas long asと「範囲では」のas far asの意味を逆に入れ替えている。",
    "in case / as long as": "1つ目の空所(時間の範囲)を、備えを表すin caseと誤解している。",
    "as long as / in case": "2つ目の空所(知識・認識の範囲)を、備えを表すin caseと誤解している。"
  },
  q92: {
    "名詞と形容詞": "soがつなぐ単位を、名詞と形容詞という異なる種類の要素と誤解している。soは独立した文どうしを対等につなぐ。",
    "前置詞と目的語": "soの前後関係を、前置詞とその目的語の関係と誤解している。",
    "一つの名詞とその関係詞節": "soを、名詞を説明する関係詞節を導く語と誤解している。"
  },
  q93: {
    "as long as": "「備えて先に行動する」in caseの意味を、「〜する時間内では」のas long asと誤解している。",
    "as far as": "in caseの意味を、「〜する範囲では」のas far asと誤解している。",
    "whether": "in caseの意味を、「〜かどうか」のwhetherと誤解している。"
  },
  q94: {
    "factを選ぶ関係代名詞節": "同格のthat(内容を示す名詞節)を、先行詞の範囲を狭める関係代名詞節と誤解している。that she wonはthat節内が完全な文で、関係代名詞のように名詞が欠けていない。",
    "主節の条件を示す副詞節": "同格のthatを、条件を表す副詞節と誤解している。",
    "前置詞句": "that she wonが主語+動詞を備えた節であることを見落とし、前置詞句と誤解している。"
  },
  q95: {
    "「もし彼が来れば」を表す条件の副詞節": "know の目的語になる名詞節のifを、条件を表す副詞節のifと混同している。",
    "名詞を修飾する形容詞節": "if he will come全体を、直前の名詞を修飾する形容詞節と誤解している。",
    "理由を表す副詞節": "ifの節を、理由を表す節と誤解している。"
  },
  q96: {
    "動詞の目的語": "理由を表す副詞節becauseを、動詞stayedの目的語(名詞節)と誤解している。",
    "主語の補語": "because節を、主語を説明する補語と誤解している。",
    "名詞を修飾する形容詞節": "because節を、直前の名詞を修飾する形容詞節と誤解している。"
  },
  q104: {
    "so that": "「彼が来るかどうか」という名詞節の意味を、目的を表すso thatと誤解している。",
    "in case": "「〜かどうか」の意味を、備えを表すin caseと誤解している。",
    "as far as": "「〜かどうか」の意味を、範囲を表すas far asと誤解している。"
  },
  q117: {
    "副詞節が名詞節で、一般動詞": "省略の条件を、副詞節ではなく名詞節の場合と誤解し、動詞の種類もbe動詞以外にしている。",
    "主節と副詞節の主語が異なり、be動詞": "省略には主語が主節と同じであることが必要なのに、主語が異なる場合を条件にしている。",
    "どの副詞節でも主語だけ省略": "動詞がbe動詞であるという条件を見落とし、省略をすべての副詞節に一般化している。"
  },
  q129: {
    "as": "「非常に〜なので」を表すso ... thatの形を、as ... thatと誤解している。",
    "too": "so ... thatの構文を、too ... to構文と混同している。",
    "very": "後ろにthat節が続く強調の語を、程度だけを表すveryと誤解している。veryの後ろにthat節は続かない。"
  },
  q185: {
    "so ... that": "「〜するように」という目的を表すso thatを、「非常に〜なので」の結果を表すso ... thatと混同している。",
    "because of": "目的を表すso thatを、理由を表す前置詞句because ofと誤解している。",
    "in spite of": "目的を表すso thatを、譲歩を表すin spite ofと誤解している。"
  },
  q186: {
    "Despite": "従属接続詞Althoughの位置に、前置詞Despiteを置いている。Despiteの後ろは名詞(句)。",
    "Because of": "譲歩の接続詞の位置に、理由を表す前置詞句Because ofを置いている。",
    "In spite": "In spite ofのofを落とした形を、接続詞の位置に置いている。"
  },
  q97: {
    "who": "who runsという関係詞節自体を、説明される名詞と取り違えている。",
    "runs": "説明される名詞を、関係詞節内の動詞runsと取り違えている。",
    "説明する名詞はない": "関係詞節が名詞the boyを説明していることを見落としている。"
  },
  q98: {
    "目的語": "who runsの中でwhoが果たす働きを、目的語と誤解している。runsの前に主語がないため、whoは主語。",
    "前置詞": "whoの働きを前置詞と誤解している。",
    "補語": "whoの働きを補語と誤解している。"
  },
  q99: {
    "主語": "the book that I readのthatの働きを主語と誤解している。readの主語はIで、thatはreadの目的語。",
    "副詞": "thatの働きを副詞と誤解している。",
    "接続詞だけ": "関係代名詞thatが、節内で目的語の働きも兼ねていることを見落とし、単なる接続詞だと誤解している。"
  },
  q100: {
    "who": "father(先行詞a studentの所有物)を示す所有格の関係詞をwho(主格)と誤解している。",
    "whom": "所有格が必要な位置に目的格whomを置いている。",
    "which": "先行詞が人(a student)なのに、ものに使うwhichを選んでいる。"
  },
  q101: {
    "非制限用法": "先行詞の範囲を狭めている(studiedした学生だけに限定)のに、単なる補足情報を加える非制限用法と誤解している。",
    "比較用法": "関係詞節の用法を、比較の用法と混同している。",
    "仮定法": "関係詞節の用法を、仮定法と混同している。"
  },
  q102: {
    "非制限用法で、節内の主語だから": "省略の条件(制限用法・節内で目的語などが欠けている)を取り違え、非制限用法かつ主語の場合だと誤解している。",
    "thatが前置詞だから": "thatの品詞を関係代名詞ではなく前置詞と誤解している。",
    "必ず関係代名詞は省略できるから": "省略には条件があることを見落とし、常に省略できると一般化している。"
  },
  q103: {
    "制限用法ではないから": "who runsが制限用法であることを見落とし、非制限用法だから省略できないと誤解している。",
    "whoが前置詞の目的語だから": "whoの働きを前置詞の目的語と誤解している。whoは節内の主語。",
    "節の先頭にないから": "whoが関係詞節の先頭にあることを見落としている。"
  },
  q140: {
    "the writer": "that I boughtが説明している名詞を、文中にないthe writerと誤解している。",
    "the purchase": "説明される名詞を、動作を表す語the purchaseと取り違えている。",
    "the price": "説明される名詞を、文中にないthe priceと誤解している。"
  },
  q141: {
    "who と lives": "関係詞節内の主語・動詞を、文全体の構造上の主語・述語動詞と取り違えている。",
    "the door と opened": "目的語the doorと述語動詞openedを、主語と述語動詞の組み合わせと誤解している。",
    "boy と door": "修飾語を除いた中心語だけを機械的に組み合わせ、関係詞節を含む名詞句全体を見落としている。"
  },
  q149: {
    "who": "all of の後ろ、前置詞ofの目的語となる位置に、主格whoを置いている。前置詞の後ろは目的格whom。",
    "them": "関係詞節を作る必要がある位置に、代名詞themを置き、2つの独立した文にしている。",
    "which": "先行詞が人(cousins)なのに、ものに使うwhichを選んでいる。"
  },
  q181: {
    "which": "先行詞the town(場所)を説明する節内で欠けているのが副詞(場所)であることを見落とし、名詞が欠ける場合に使うwhichを選んでいる。",
    "what": "先行詞the townがあるのに、先行詞を含む関係代名詞whatを使っている。",
    "who": "先行詞the town(場所)なのに、人に使うwhoを選んでいる。"
  },
  q182: {
    "where": "先行詞the day(時)を説明する節内で欠けているのが副詞(時)であることを見落とし、場所に使うwhereを選んでいる。",
    "which": "節内で欠けているのが副詞(時)であることを見落とし、名詞が欠ける場合に使うwhichを選んでいる。",
    "what": "先行詞the dayがあるのに、先行詞を含む関係代名詞whatを使っている。"
  },
  q183: {
    "Which": "先行詞なしに使う関係代名詞whatの位置に、先行詞が必要なwhichを置いている。",
    "That": "先行詞なしに文の主語になれるwhatの位置に、先行詞が必要なthatを置いている。",
    "Who": "whatの位置に、人を先行詞に取るwhoを置いている。"
  },
  q184: {
    "who": "前置詞toの目的語となる位置に、主格whoを置いている。前置詞の後ろは目的格whom。",
    "whose": "前置詞の目的語の位置に、所有格whoseを置いている。",
    "which": "先行詞が人(The person)なのに、ものに使うwhichを選んでいる。"
  },
  q116: {
    "He": "副詞quicklyが説明する相手を、主語Heと誤解している。quicklyは動詞runsを修飾する。",
    "runの目的語": "quicklyの働きを、動詞の目的語と誤解している。",
    "前置詞": "quicklyの品詞を前置詞と誤解している。"
  },
  q118: {
    "動詞を説明する副詞の役割": "the bookを修飾する形容詞句の働きを、動詞を説明する副詞の役割と誤解している。",
    "名詞の目的語になる役割": "on the desk全体の働きを、名詞の目的語という働きと誤解している。",
    "語を対等につなぐ接続詞": "前置詞句を接続詞の働きと混同している。"
  },
  q144: {
    "名詞": "quicklyの品詞を、-lyの語形を見落として名詞と誤解している。",
    "前置詞": "quicklyの品詞を前置詞と誤解している。",
    "冠詞": "quicklyの品詞を冠詞と誤解している。"
  },
  q147: {
    "名詞test": "extremelyが説明する相手を、名詞testと誤解している。extremelyは形容詞difficultを修飾する。",
    "動詞wasだけ": "extremelyの修飾先を、be動詞wasだけと誤解している。",
    "冠詞The": "extremelyの修飾先を冠詞Theと誤解している。"
  },
  q196: {
    "hardly": "「熱心に」の意味の副詞hardを、意味の異なるhardly(ほとんど〜ない)と誤解している。",
    "harderly": "hardの比較級を作る誤った語形(-erと-lyを重ねる)にしている。",
    "hardness": "副詞が必要な位置に、名詞hardnessを置いている。"
  },
  q197: {
    "late": "「最近」の意味の副詞latelyを、「遅く」を意味するlateと誤解している。",
    "later": "latelyの意味を、比較級laterと誤解している。",
    "latest": "latelyの意味を、最上級latestと誤解している。"
  },
  q198: {
    "very": "名詞の量ではなく形容詞warmの程度を示すenoughの位置に、程度を強めるveryを置いている。veryは名詞の前で使い、語順も異なる。",
    "so": "enoughの位置に、後ろにthat節を伴うsoを置いている。",
    "such": "enoughの位置に、名詞句を強めるsuchを置いている。"
  },
  q39: {
    "is": "一般動詞playを含む否定文に、be動詞用のisを使っている。",
    "has": "一般動詞の否定にhaveを使っている。",
    "can": "一般動詞の否定に、意味の異なる助動詞canを使っている。"
  },
  q40: {
    "Does": "be動詞she is a studentの疑問文に、一般動詞用のDoesを使っている。",
    "Do": "be動詞の疑問文に、一般動詞用のDoを使っている。",
    "Has": "be動詞の疑問文に、現在完了用のHasを使っている。"
  },
  q41: {
    "Is": "一般動詞likeを含む疑問文に、be動詞用のIsを使っている。",
    "Has": "一般動詞の疑問文に、現在完了用のHasを使っている。",
    "Can": "一般動詞の疑問文に、意味の異なる助動詞Canを使っている。"
  },
  q43: {
    "主語": "whatが尋ねている要素を、目的語ではなく主語と誤解している。didの後ろにyouという主語があるため、whatは目的語。",
    "述語動詞": "whatが尋ねている要素を述語動詞と誤解している。",
    "前置詞": "whatが尋ねている要素を前置詞と誤解している。"
  },
  q44: {
    "Whom did": "主語を尋ねる疑問文に、目的語を尋ねる形(倒置あり)を使っている。主語を尋ねる疑問詞の後ろは倒置しない。",
    "What did": "人を尋ねる疑問文に、ものを尋ねるWhatを使っている。",
    "Where did": "誰が来たかを尋ねる疑問文に、場所を尋ねるWhereを使っている。"
  },
  q89: {
    "Don't + 三単現で現在形を作る": "否定命令文の動詞の形を、三単現(三人称単数現在)と誤解している。命令文の動詞は原形。",
    "be動詞の後ろにnotを置く": "一般動詞openの否定命令文を、be動詞の否定文の形と混同している。",
    "過去形の前にDon'tを置く": "命令文の動詞の形を過去形と誤解している。"
  },
  q90: {
    "主語がなく、openは過去形": "命令文にも構造上の主語(You)があることを見落とし、動詞の形も過去形と誤解している。",
    "the doorが主語で、openは三単現": "目的語the doorを構造上の主語と取り違えている。",
    "Youが必ず表面上文頭にある": "命令文では通常Youが表面上省略されることを見落としている。"
  },
  q108: {
    "are": "一般動詞playを含む否定文に、be動詞用のareを使っている。",
    "does": "主語They(複数)なのに、3人称単数用のdoesを使っている。",
    "is": "一般動詞の否定に、be動詞用のisを使っている。"
  },
  q121: {
    "tallest": "1対1の比較(比較級)を、3つ以上の中の順位を表す最上級と誤解している。",
    "more tall": "1音節の短い語tallに、more型の比較級を使っている。tallerのように-erを付ける。",
    "most tall": "短い語の最上級に、more型(most tall)を使っている。tallestが正しい。"
  },
  q122: {
    "beautifuler": "長い語beautifulに、-erを付ける短い語用の比較級を作っている。",
    "most beautiful": "比較級が必要な文脈で、最上級の形にしている。",
    "more beautifully": "形容詞beautifulの比較級ではなく、副詞beautifullyの比較級にしている。"
  },
  q123: {
    "than": "同程度を表すas ... as構文に、差を表すthanを使っている。",
    "to": "as ... as構文の2つ目のasの位置に、前置詞toを使っている。",
    "from": "as ... as構文の位置に、前置詞fromを使っている。"
  },
  q124: {
    "as": "差を表す比較級tallerの後ろに、同程度を表すasを使っている。比較級の後ろはthan。",
    "to": "比較級の後ろに前置詞toを使っている。",
    "from": "比較級の後ろに前置詞fromを使っている。"
  },
  q125: {
    "higher": "3つ以上(日本中の山)の中での順位を表す文脈で、比較級を使っている。",
    "high": "最上級が必要な文脈で、原級のままにしている。",
    "most high": "1音節の短い語highに、more型の最上級(most high)を使っている。highestが正しい。"
  },
  q126: {
    "読むほど学ばなくなる": "The 比較級, the 比較級の構文を、反比例の意味と誤解している。この構文は2つの量が同じ方向に変化することを表す。",
    "最も読んだ人だけが学ぶ": "比較級の構文を、最上級的な「一番〜な人だけ」という意味と誤解している。",
    "読む前に学ぶ": "2つの動作の同時進行の変化を、時間的な前後関係と誤解している。"
  },
  q127: {
    "運べるほど軽い": "too 形容詞 for 人 to ~の意味を逆に捉え、「〜できるほど」の意味と誤解している。tooは否定的な結果(できない)を表す。",
    "最も重い": "tooの程度表現を、最上級の意味と誤解している。",
    "重さがない": "too heavyの意味を、重さの否定(軽い)と誤解している。"
  },
  q176: {
    "less": "可算名詞cars(複数)の減少に、不可算名詞用の比較級lessを使っている。",
    "few": "比較級が必要な文脈で、原級fewのままにしている。",
    "little": "可算名詞carsに、不可算名詞用のlittleを使っている。"
  },
  q177: {
    "very": "比較級more difficultを強める語に、原級を強めるveryを使っている。比較級はmuchなどで強める。",
    "most": "比較級を強める語に、最上級を作るmostを使っている。",
    "many": "比較級を強める語に、数量を表すmanyを使っている。"
  },
  q178: {
    "any": "比較対象から本人(Tokyo自身)を除く必要があるのに、any(other抜き)にしている。Tokyoも他の都市に含まれてしまう。",
    "all other": "「どの都市よりも」という比較級の文脈に、最上級的なall otherを使っている。",
    "the other": "比較対象を「残りの他の都市全部」という特定の集団the otherと誤解している。"
  },
  q179: {
    "more useful": "one of the 最上級 + 複数名詞の構文で、比較級を使っている。",
    "useful": "one of the ~という最上級の文脈で、原級のままにしている。",
    "most usefully": "形容詞toolsを修飾する形容詞useful(最上級)の位置に、副詞usefullyを使っている。"
  },
  q180: {
    "longer than": "倍数表現twice as ~ asの構文を、単純な比較級than構文と誤解している。倍数はas ... asの形を使う。",
    "as longer as": "as ... as構文の中に、比較級longerを混ぜている。as ... asの間は原級。",
    "the longest of": "倍数表現を、最上級の構文と誤解している。"
  },
  q115: {
    "Did": "仮定法のif省略・倒置(Had+S+p.p.)を、疑問文の倒置(Did+S)と混同している。",
    "Was": "仮定法過去完了の倒置に必要なHadの位置に、Wasを置いている。",
    "If had": "ifを省略した倒置の形に、ifを残したまま倒置しない形を混ぜている。"
  },
  q130: {
    "現在に反する仮定": "現実に起こり得る未来の条件(直接法)を、現在の反実仮想(仮定法過去)と誤解している。ifの後ろが現在形であることを見落としている。",
    "過去の出来事への後悔": "未来の条件を、過去の反実仮想(仮定法過去完了)と誤解している。",
    "命令を表す文": "条件文の構造を命令文と誤解している。"
  },
  q131: {
    "am": "仮定法過去(現在の反実仮想)のif節に、直接法の現在形amを使っている。",
    "was": "仮定法過去のbe動詞を、人称に関わらずwereではなくwasにしている。",
    "will be": "if節に、未来を表すwill beを使っている。仮定法過去のif節は過去形。"
  },
  q132: {
    "would pass": "仮定法過去完了のif節(had studied)に対応する主節を、would haveのない現在の仮定法過去の形にしている。",
    "will pass": "仮定法の文脈で、直接法の未来形を使っている。",
    "had pass": "主節の動詞の形を、would+原形ではなくhad+原形という誤った形にしている。"
  },
  q133: {
    "would have lived": "過去の条件(if I had taken)と現在の結果(now)からなる混合仮定法で、結果を過去の形would have livedにしている。nowという語から現在の結果と分かる。",
    "will live": "仮定法の文脈で、直接法の未来形を使っている。",
    "had lived": "主節の動詞の形を、would+原形ではなく過去完了had livedにしている。"
  },
  q134: {
    "am": "wishに続く仮定法過去(現在の願望)に、直接法の現在形amを使っている。",
    "will be": "wish節に、未来を表すwill beを使っている。",
    "had been": "現在の願望(wish節)に、過去の願望を表すhad beenを使っている。"
  },
  q136: {
    "was": "未来の仮定法(should/were to)のwere to型で、人称に関わらずwereではなくwasにしている。",
    "had": "未来の仮定法の形に、仮定法過去完了のhadを使っている。",
    "would be": "if節の位置に、主節で使うwould beを置いている。"
  },
  q187: {
    "to take": "提案・要求のsuggestに続く節を、to不定詞と誤解している。suggestはthat節+should、または動名詞を取り、to不定詞は取らない。",
    "taking": "suggestの後ろの構造を、動名詞take(直接目的語化した形)にしている。",
    "takes to": "that節内の動詞に、三単現+toという誤った形を使っている。"
  },
  q188: {
    "studied": "過去への後悔を表すwish(仮定法過去完了)に、単純な過去形を使っている。had studiedのように過去完了にする。",
    "would study": "過去への後悔に、意志・仮定を表すwould studyを使っている。",
    "have studied": "過去完了が必要な位置に、hadを付けない現在完了を使っている。"
  },
  q189: {
    "Because of": "「もし〜がなかったなら」という仮定法の意味を持つWithoutを、単なる理由を表すBecause ofと誤解している。",
    "During": "Withoutの仮定法的な意味を、期間を表すDuringと誤解している。",
    "Besides": "Withoutの意味を、追加を表すBesidesと誤解している。"
  },
  q84: {
    "可能性を表す推量": "控えめな許可を求めるmightを、可能性の推量と誤解している。Might I ...?は許可を求める疑問文。",
    "義務を表す": "mightの意味を、義務のmustと混同している。",
    "過去の能力を表す": "mightを、過去の能力を表す語と誤解している。"
  },
  q85: {
    "might": "過去への推量(might have + p.p.)に、過去分詞のないmightだけを使っている。",
    "must have to": "推量の強さを、mustとhave toを重ねた誤った形にしている。",
    "has might": "have/hasとmightの語順を逆にしている。"
  },
  q87: {
    "could": "仮定法過去完了の主節(過去への推量、could have p.p.)に、過去分詞のないcouldだけを使っている。",
    "can have": "過去の仮定に、現在形canを使っている。",
    "could to have": "could haveの間に不要なtoを入れている。"
  },
  q135: {
    "should": "過去への非難(should have p.p.、〜すべきだったのに)に、過去分詞のないshouldだけを使っている。",
    "should to": "shouldの後ろにtoを入れる、存在しない形にしている。",
    "should had": "should haveのhaveを、過去形hadと誤解している。"
  },
  q105: {
    "疑問文を形容詞にしたもの": "間接疑問文の定義を、疑問文を形容詞にしたものと誤解している。名詞節にしたものが正しい。",
    "否定文を命令文にしたもの": "間接疑問文を、否定文・命令文に関する変形と誤解している。",
    "関係詞節を比較級にしたもの": "間接疑問文を、関係詞節・比較級に関する変形と誤解している。"
  },
  q106: {
    "is it": "間接疑問文の中を、直接疑問文の語順(主語と動詞が入れ替わる)のままにしている。名詞節の中は平叙文の語順。",
    "does": "be動詞の文なのに、一般動詞用のdoesを使っている。",
    "be": "間接疑問文の中に、定形が必要な位置に原形beを置いている。"
  },
  q107: {
    "誰一人賛成しなかった": "部分否定Not every(全員が〜というわけではない)を、全否定(誰も〜ない)と誤解している。",
    "全員が必ず賛成した": "notによる否定を見落とし、肯定の意味と誤解している。",
    "賛成した学生は一人だけだった": "部分否定の意味を、人数を1人に限定する意味と誤解している。"
  },
  q109: {
    "does not": "助動詞willがすでにある文に、do助動詞をさらに重ねている。",
    "no": "notの位置に、形容詞・名詞を否定するnoを使っている。動詞を否定するのはnot。",
    "is not": "一般動詞的な文脈で、be動詞用のis notを使っている。willの後ろは動詞の原形+not。"
  },
  q110: {
    "Are": "一般動詞playを含む疑問文に、be動詞用のAreを使っている。",
    "Does": "主語they(複数)なのに、3人称単数用のDoesを使っている。",
    "Is": "一般動詞の疑問文に、be動詞用のIsを使っている。"
  },
  q142: {
    "doesとlikesを両方使う": "助動詞doesと一般動詞likeの三単現を重ねている。does+原形が正しい。",
    "be動詞の後ろにnotを置く": "一般動詞likeの否定文を、be動詞の否定文の形と混同している。",
    "notを主語の前に置く": "notの位置を、主語の前という誤った位置にしている。"
  },
  q150: {
    "did you": "肯定文You finishedに対する付加疑問を、否定形にせず肯定のままにしている。肯定文には否定の付加疑問を付ける。",
    "weren't you": "一般動詞finishedの文に、be動詞用の付加疑問weren't youを使っている。",
    "don't you": "過去形finishedの文に、現在形用の付加疑問don't youを使っている。"
  },
  q200: {
    "I had arrived": "否定的な語Hardlyが文頭に出た倒置の語順(had+I)を、通常の語順(I had)のままにしている。",
    "did I arrive": "過去完了had arrivedが必要な文脈で、did+原形の形にしている。",
    "I arrived": "倒置も過去完了も反映せず、通常の過去形の語順にしている。"
  },
  q146: {
    "an": "不可算名詞informationに、可算名詞単数用の冠詞anを使っている。",
    "many": "不可算名詞informationに、可算名詞複数用のmanyを使っている。",
    "a few": "不可算名詞informationに、可算名詞複数用のa fewを使っている。"
  },
  q192: {
    "few": "「少しはいるので寂しくない」という肯定的な量(a few)を、否定的な少なさを表すfewと誤解している。",
    "a little": "可算名詞friendsに、不可算名詞用のa littleを使っている。",
    "little": "可算名詞friendsに、不可算名詞用のlittleを使い、さらに否定的な意味にしている。"
  },
  q193: {
    "a few": "「ほとんど残っていなかった」という否定的な少なさ(few)を、肯定的な「少しはある」a fewと誤解している。",
    "little": "可算名詞seatsに、不可算名詞用のlittleを使っている。",
    "a little": "可算名詞seatsに、不可算名詞用のa littleを使い、さらに肯定的な意味にしている。"
  },
  q194: {
    "other": "不特定の追加を表すanotherを、後ろに名詞を伴わない代名詞othersの単数形otherと誤解している。otherは単独では名詞の前に置けない。",
    "the others": "不特定の1つを求める文脈で、特定された残り全部を表すthe othersを使っている。",
    "others": "1杯を求める文脈で、複数を表すothersを使っている。"
  },
  q195: {
    "another": "2つのうち残りの特定の1つ(the other)を、不特定の追加another(3つ以上のうちの1つ)と誤解している。",
    "others": "残りの1つ(単数)を、複数を表すothersと誤解している。",
    "the others": "2つのうちの残り1つを、3つ以上の残り全部を表すthe othersと誤解している。"
  },
  q199: {
    "so a": "such a 形容詞 名詞の語順を、so a 形容詞 名詞という誤った順序にしている。soの後ろに冠詞は続かない。",
    "such": "such a difficult questionの冠詞aを落としている。",
    "so": "such a difficult questionの構文を、後ろに名詞句を伴わないsoにしている。soの後ろは形容詞・副詞。"
  }
};

function q(domain, stem, choices, answer, explanation, misconceptions = {}) {
  return { domain, stem, choices, answer, explanation, misconceptions };
}

const QUESTIONS = [
  // Stage 1: 品詞と文の骨組み
  q("foundation", "student の品詞として正しいものは？", ["名詞", "動詞", "形容詞", "副詞"], "名詞", "studentは人を表す名詞。名詞は人・物体・事柄の名称を表す。"),
  q("foundation", "The birds fly. の fly の働きとして正しいものは？", ["述語動詞", "主語", "目的語", "前置詞"], "述語動詞", "flyは鳥の動きを表し、文の述語動詞として働いている。"),
  q("foundation", "a useful book の useful の働きは？", ["bookを説明する形容詞", "bookの動作を説明する副詞", "文の主語", "前置詞の目的語"], "bookを説明する形容詞", "usefulは名詞bookを直接説明する限定用法の形容詞。動詞の助けを借りて主語や目的語を説明する叙述用法とは働きが異なる。"),
  q("foundation", "She sings beautifully. の beautifully が説明しているものは？", ["singsの方法", "Sheの性質", "文の主語", "beautifullyの名詞"], "singsの方法", "beautifullyはbeautifulに-lyが付いた代表的な副詞で、歌う方法を説明して動詞singsを修飾している。語尾だけでなく修飾先も確認する。"),
  q("foundation", "in the room の in の品詞は？", ["前置詞", "形容詞", "述語動詞", "接続詞"], "前置詞", "inは名詞the roomと結びつき、前置詞句を作る前置詞。"),
  q("foundation", "in the room の中で、前置詞 in の目的語は？", ["room", "the", "in", "table"], "room", "前置詞の目的語は前置詞と結びつく名詞room。in the room全体は前置詞句。"),
  q("foundation", "基本的な平叙文の定義として正しいものは？", ["大文字で始まり、語群としてまとまり、ピリオドで終わる", "小文字で始まり、疑問符で終わる", "動詞だけでできている", "必ず一語だけでできている"], "大文字で始まり、語群としてまとまり、ピリオドで終わる", "基本的な平叙文は大文字で始まり、意味のまとまりを作り、ピリオドで終わる。疑問文や感嘆文には別の文末記号もある。"),
  q("foundation", "文の骨格として最初に確認する組み合わせは？", ["構造上の主語と述語動詞", "前置詞とその目的語", "形容詞と副詞", "接続詞とピリオド"], "構造上の主語と述語動詞", "文は構造上の主語と述語動詞を中心に骨格を作る。目的語や修飾語はその後に確認する。"),
  q("foundation", "Tom runs. の述語動詞は？", ["runs", "Tom", "Tom runs全体", "該当なし"], "runs", "runsは動詞の働きだけをして、文の述語動詞になっている。"),
  q("foundation", "The small dog barked. の構造上の主語は？", ["The small dog", "the small", "barked", "small dog"], "The small dog", "barkedの主体はThe small dog全体。形容詞smallを含む名詞句が構造上の主語。"),
  q("foundation", "She is kind. の kind の文中での働きは？", ["主語Sheを説明する補語", "動詞isの目的語", "前置詞の目的語", "主語を修飾する副詞"], "主語Sheを説明する補語", "kindはSheがどのような人かを説明し、主語とイコールになる形容詞補語。"),
  q("foundation", "I read a book. の a book の働きは？", ["動詞の目的語", "主語の補語", "前置詞の目的語", "副詞"], "動詞の目的語", "a bookはreadの動作の対象で、前置詞なしに動詞へ直接結びつく目的語。"),
  q("foundation", "Birds fly in the sky. の主語と述語動詞の組み合わせは？", ["Birds と fly", "fly と in", "the sky と fly", "Birds と sky"], "Birds と fly", "Birdsが構造上の主語、flyが述語動詞。in the skyは場所を加える修飾語。"),
  q("foundation", "idea の意味と品詞の組み合わせとして正しいものは？", ["考えを表す名詞", "考える動作を表す副詞", "考えを説明する形容詞", "場所を表す前置詞"], "考えを表す名詞", "ideaは目に見えない考え・事柄を表す名詞。名詞は物体だけに限られない。"),
  q("foundation", "It is important to check the answer. の It の働きは？", ["内容上の主語を後ろへ送る形式主語", "天候だけを表す形式上の主語", "動詞checkが直接取る目的語", "前置詞toが取る目的語"], "内容上の主語を後ろへ送る形式主語", "It is important to check the answer. ではItが形式上の主語となり、内容を担うto check the answerを後ろに置く。完成文の訳は「答えを確認することは重要だ」。"),
  q("conjunction", "Tom and Mary の and がつないでいる単位は？", ["語と語", "文と文", "主語と述語動詞", "前置詞と目的語"], "語と語", "andはTomとMaryという同じ働きの語を対等につないでいる。"),
  q("conjunction", "because he was tired の because の後ろにあるものは？", ["主語と述語動詞を備えた完全な文", "名詞だけ", "前置詞だけ", "動詞の目的語だけ"], "主語と述語動詞を備えた完全な文", "becauseの後ろのhe was tiredは主語と述語動詞を備えた文で、それ全体が副詞節になる。"),
  q("foundation", "you は何人称？", ["2人称", "1人称", "3人称", "人称を持たない"], "2人称", "youは聞き手を指す2人称。単数でも複数でも2人称である。"),
  q("foundation", "running が動詞の性質をもちながら名詞の働きをしているとき、何と呼ぶ？", ["準動詞", "限定詞", "前置詞", "関係副詞"], "準動詞", "準動詞は動詞の性質をもちながら、動詞以外の品詞の働きもする。"),
  q("infinitive", "不定詞の基本的な形は？", ["to + 動詞の原形", "to + 過去形", "動詞の三単現 + to", "前置詞 + 過去分詞"], "to + 動詞の原形", "不定詞は原形動詞の前にtoを付けた形。toの後ろを過去形や三単現にはしない。"),
  q("gerund", "Swimming is good exercise. の Swimming の働きは？", ["動名詞句として主語", "述語動詞", "形容詞", "前置詞"], "動名詞句として主語", "Swimmingは動詞の性質をもちながら、名詞のように文の主語になっている。"),
  q("pattern", "They made him happy. の happy の働きは？", ["目的語himを説明する補語", "動詞madeの目的語", "主語Theyを説明する補語", "前置詞の目的語"], "目的語himを説明する補語", "happyは目的語himがどのような状態かを説明するSVOCの補語。"),
  q("pattern", "She gave me a pen. の me の働きは？", ["動詞gaveの間接目的語", "動詞gaveの直接目的語", "主語の補語", "前置詞の目的語"], "動詞gaveの間接目的語", "meはgaveの動作の受け手で、動詞gaveに結びつく間接目的語。a penは与えられるものを表す直接目的語。"),
  q("pattern", "I opened the window. の opened は他動詞として使われている。理由は？", ["目的語the windowが直接続くから", "後ろに前置詞があるから", "主語がIだから", "過去形だから"], "目的語the windowが直接続くから", "「何を開けたの？」にthe windowと答えられ、openedが前置詞なしで目的語を取っているため他動詞。何を？という問いは定義を補う判断の目安として使う。"),
  q("pattern", "He arrived at the station. の arrived を自動詞と判断する根拠は？", ["直接の目的語がない", "stationが目的語", "過去形だから", "主語がHe"], "直接の目的語がない", "「何を到着したの？」と対象を尋ねる形にならず、stationは前置詞atの目的語でarrivedの直接の目的語ではない。正式には目的語を取らないので自動詞。"),
  q("pattern", "A book is on the desk. の be動詞isの意味は？", ["存在する・ある", "〜をする", "〜であるという性質を説明する", "〜される"], "存在する・ある", "on the deskは場所を表す前置詞句で、isは第1文型で本が存在する場所を示す。"),
  q("pattern", "She is a teacher. の a teacher は何を表す？", ["主語Sheとイコールになる名詞補語", "動詞isの目的語", "前置詞の目的語", "場所を表す副詞"], "主語Sheとイコールになる名詞補語", "a teacherはSheとイコールになる名詞補語。be動詞の後ろが常に目的語とは限らない。"),
  q("pattern", "There is a cat under the table. の there の働きは？", ["誘導副詞", "場所の名詞", "主語の代名詞", "前置詞"], "誘導副詞", "このthereは具体的な場所ではなく、be動詞と名詞句を導く誘導副詞。"),
  q("pattern", "There ___ two books on the desk. に入るbe動詞は？", ["are", "is", "was", "be"], "are", "there構文では、後ろの名詞句two booksが複数なので、基本的にareを使う。"),
  q("pattern", "The soup became cold. の cold の働きは？", ["主語The soupを説明する補語", "動詞becameの目的語", "前置詞の目的語", "動詞becameを修飾する副詞"], "主語The soupを説明する補語", "coldはThe soupがどのような状態になったかを説明する主格補語。"),
  // Stage 2: 動詞の形と時制
  q("verb_form", "My brother ___ tennis every Sunday. に入る形は？", ["plays", "play", "played", "playing"], "plays", "主語My brotherは3人称単数で、every Sundayは現在の習慣。一般動詞playにsを付ける。"),
  q("verb_form", "Does she ___ English? に入る形は？", ["study", "studies", "studied", "studying"], "study", "doesが三単現の形を担うため、後ろの一般動詞は原形studyにする。"),
  q("verb_form", "You ___ very kind. に入る現在形のbe動詞は？", ["are", "is", "am", "be"], "are", "youは2人称で、現在形のbe動詞は単数・複数にかかわらずare。"),
  q("verb_form", "Each of the answers ___ useful. に入る形は？", ["is", "are", "be", "being"], "is", "Each of + 複数名詞が主語でも、中心語eachは一つ一つを指すため、標準的な書き言葉では単数動詞isを使う。完成文の訳は「それぞれの答えが役に立つ」。"),
  q("verb_form", "They ___ at home yesterday. に入るbe動詞は？", ["were", "was", "are", "is"], "were", "yesterdayは過去を示し、主語Theyは複数なので過去形were。"),
  q("verb_form", "has finished の has は、どの種類の助動詞？", ["have助動詞", "be助動詞", "do助動詞", "一般助動詞"], "have助動詞", "have助動詞は過去分詞と結びついて完了形を作る。finishedは過去分詞。"),
  q("verb_form", "She is reading now. の is の働きは？", ["be助動詞", "単独のbe動詞", "do助動詞", "一般助動詞"], "be助動詞", "isは-ing形readingと結びつき、進行形を作るbe助動詞。"),
  q("verb_form", "The window was broken by the boy. の was と broken の組み合わせが表すものは？", ["受動態", "現在完了", "疑問文", "比較級"], "受動態", "wasというbe助動詞と過去分詞brokenの組み合わせが受動態を作る。by the boyが動作主を示している。"),
  q("negation", "He ___ not play soccer. に入る形は？", ["does", "is", "has", "can"], "does", "助動詞のない一般動詞の否定はdoes not play。doesの後ろは原形。"),
  q("negation", "___ she a student? に入る語は？", ["Is", "Does", "Do", "Has"], "Is", "be動詞の文の疑問文では、be動詞を主語の前に出す。"),
  q("negation", "___ he like music? に入る語は？", ["Does", "Is", "Has", "Can"], "Does", "助動詞のない一般動詞likeの疑問文ではdoesを主語の前に置き、likeは原形にする。"),
  q("modal", "___ you open the window, please? に入る語は？", ["Could", "Did", "Are", "Have"], "Could", "Could you ...? は、相手に依頼するときの遠回しな丁寧表現。couldはcanの単純な過去だけではない。"),
  q("negation", "What did you buy? で、疑問詞whatが尋ねているものは？", ["目的語", "主語", "述語動詞", "前置詞"], "目的語", "buyの対象を尋ねているのでwhatは目的語。疑問詞の後ろはdid you buyの疑問文語順。"),
  q("negation", "___ came to the meeting? に入る疑問詞は？", ["Who", "Whom did", "What did", "Where did"], "Who", "who自体が主語を尋ねるため、主語と助動詞の倒置をせずWho came?とする。"),
  q("tense", "She is reading now. が表す進行形の意味は？", ["今進行中の動作", "過去の習慣", "一般的な事実", "完了した結果"], "今進行中の動作", "nowが基準時を示し、is readingはその時点で進行中の動作を表す。"),
  q("tense", "He is always losing his keys. の進行形が表す意味は？", ["繰り返し起こる動作", "一度だけの過去", "完了した結果", "受動態"], "繰り返し起こる動作", "alwaysと進行形の組み合わせで、鍵を何度もなくすという反復的な動作を表す。"),
  q("tense", "I am staying at a hotel this week. の進行形が表す意味は？", ["一時的な状態", "永続的な性質", "過去の完了", "命令"], "一時的な状態", "this weekという期間内の一時的な滞在なので、進行形で表している。"),
  q("tense", "We are leaving tomorrow. の進行形が表す意味は？", ["近い未来の予定", "過去の反復", "現在の否定", "受動態"], "近い未来の予定", "tomorrowと取り決められた予定があり、現在進行形で近い未来を表している。"),
  q("modal", "It may rain tonight. の may の意味は？", ["可能性", "許可", "義務", "過去の可能"], "可能性", "mayは、これから雨が降る可能性を表す。ここでは許可ではなく推量で、数値の目安を厳密な確率として扱わない。"),
  q("tense", "When I called, she ___ dinner. に入る形は？", ["was cooking", "cooks", "has cooked", "will cook"], "was cooking", "過去のある時点で進行中だった動作なので、過去進行形was cooking。"),
  q("tense", "I have lost my key. が伝える現在の状態は？", ["今も鍵がない", "昨日だけ鍵がなかった", "これから鍵をなくす", "鍵を見つけた"], "今も鍵がない", "過去に鍵をなくしたことが原因となり、現在も鍵がないという結果に焦点がある。"),
  q("modal", "___ I open the window? に入る語は？", ["Shall", "Would", "Must", "Have"], "Shall", "Shall I ...? は、話し手が自分で窓を開けることを申し出る表現。単なる未来の予測ではない。"),
  q("tense", "He said yesterday that she ___ tired then. に入る形は？", ["was", "is", "will be", "has been"], "was", "yesterdayとthenが示す過去の時点について述べているため、that節は過去形wasにする。"),
  q("tense", "He had said that she ___ left before we arrived. に入る形は？", ["had", "has", "will", "is"], "had", "we arrivedより前に彼女が出発していたため、that節は過去完了had leftにする。"),
  q("modal", "There ___ to be a reason. に入る形は？", ["has", "is", "must", "can"], "has", "There has to be a reason. のhave toは、根拠から「理由があるに違いない」と推定する表現。義務だけに限られない。"),
  q("modal", "I will call you tonight. の will の働きとして正しいものは？", ["未来の予定・予測を表す助動詞", "過去形を作る助動詞", "受動態を作るbe助動詞", "名詞を修飾する形容詞"], "未来の予定・予測を表す助動詞", "willは一般助動詞で、後ろに原形callを置き、未来についての意思や予測を表す。数値の目安を厳密な確率として扱わない。"),
  q("modal", "The sign says, You can swim here. のcanが表す意味は？", ["ここで泳いでもよい", "ここで泳いだ", "ここで泳ぐ必要がある", "ここで泳いでいた"], "ここで泳いでもよい", "標識が許可を示しているため、canは許可を表す。canの後ろは原形swim。"),
  q("modal", "You ___ wear a seat belt. に、規則上の義務を表す語を入れると？", ["must", "may", "could", "would"], "must", "mustは話し手が強い義務を示す助動詞。後ろには原形wearを置く。"),
  q("modal", "You ___ see a doctor if you feel worse. に助言を表す語を入れると？", ["should", "must have", "can to", "did"], "should", "shouldは相手への助言を表し、後ろには原形seeを置く。"),
  q("modal", "The lights are on. Someone must be home. の must の意味は？", ["根拠から「～に違いない」と判断", "相手に「～しなさい」と求める", "相手に「～してよい」と認める", "過去に「～できた」と述べる"], "根拠から「～に違いない」と判断", "明かりがついているという根拠から、must be homeは「家にいるに違いない」という強い推定を表す。義務のmustではない。"),
  // Stage 3: 助動詞・受動態・準動詞
  q("verb_form", "She ___ finished her homework. に入る形は？", ["has", "is", "does", "can"], "has", "have助動詞hasの後ろに過去分詞finishedを置き、現在完了を作る。"),
  q("modal", "I ___ leave now because my shift is over. に入る形は？", ["have to", "has to", "must to", "having to"], "have to", "have toは、勤務が終わったという外的事情による義務を表す。主語Iなのでhave toとなる。"),
  q("modal", "They can ___ the problem. に入る形は？", ["solve", "solves", "solved", "solving"], "solve", "一般助動詞canの後ろには動詞の原形solveを置く。"),
  q("verb_form", "The children are playing outside. の are playing は？", ["進行形", "受動態", "現在完了", "第2文型"], "進行形", "be助動詞areと-ing形playingの組み合わせが進行形を作る。"),
  q("passive", "The letter was written by Ken. の by Ken が示すものは？", ["元の能動態の主語（動作主）", "受動態の主語", "過去分詞の目的語", "時を表す副詞"], "元の能動態の主語（動作主）", "by Kenは、能動態で主語だったKenを示す副詞句。受動態の主語はThe letter。"),
  q("passive", "The boy broke the window. を受動態にすると、主語になるのは？", ["the window", "the boy", "the verb", "the subject"], "the window", "能動態の動詞の目的語the windowを、受動態の主語に移す。"),
  q("passive", "The window ___ broken by the boy yesterday. に入る形は？", ["was", "did", "has", "is being"], "was", "yesterdayが過去を示すため、be助動詞は過去形was。brokenは過去分詞。"),
  q("passive", "The window was broken ___ the boy. に入る前置詞は？", ["by", "to", "at", "with"], "by", "by the boyは、能動態の主語the boyを受動態で示す副詞句。"),
  q("passive", "受動態の基本形として正しいものは？", ["be助動詞 + 過去分詞", "have助動詞 + 原形", "do助動詞 + -ing形", "前置詞 + 過去形"], "be助動詞 + 過去分詞", "受動態はbe助動詞と過去分詞の組み合わせで作る。時制は主にbe助動詞に表す。"),
  q("passive", "Everyone looked after the child. を受動態にすると？", ["The child was looked after by everyone.", "The child was looked by everyone after.", "Everyone was looked after the child.", "The child looked after everyone."], "The child was looked after by everyone.", "look afterは句動詞としてまとまって目的語the childを取る。受動態でも前置詞afterを残し、The child was looked after by everyone. とする。訳は「その子は皆に世話をされた」。"),
  q("infinitive", "to study の to の後ろの study が原形である理由は？", ["不定詞はto + 原形の形だから", "toの後ろは必ず過去形だから", "studyが名詞だから", "toが前置詞だから"], "不定詞はto + 原形の形だから", "不定詞はtoと原形動詞の組み合わせ。studiedやstudiesにはしない。"),
  q("infinitive", "make him ___ の空所に入る形は？", ["run", "to run", "runs", "running"], "run", "makeのように目的語の後ろに原形不定詞を置く構文では、toを付けず原形runにする。"),
  q("infinitive", "It is important ___ to study. に入る形は？", ["for him", "him", "he", "to him"], "for him", "for him to studyで、himがto studyの意味上の主語になり、「彼が勉強すること」が重要だという意味になる。"),
  q("infinitive", "To read books is useful. の To read books の働きは？", ["名詞句として主語", "動詞isの目的語", "名詞booksを修飾する形容詞", "前置詞句"], "名詞句として主語", "文頭のto read books全体が文の主語になっているため、名詞的用法。"),
  q("infinitive", "I need a book to read. の to read の働きは？", ["名詞を説明する不定詞", "文の主語になる語", "needの目的語", "前置詞の目的語"], "名詞を説明する不定詞", "to readはbookを後ろから説明する形容詞的用法で、bookがreadの目的語になるVOの関係。toの後ろが原形readなので不定詞でもある。"),
  q("infinitive", "He went to the library to study. の2つのtoの説明は？", ["to the libraryは前置詞、to studyは不定詞", "to the libraryは不定詞、to studyは前置詞", "to the libraryは前置詞、to studyも前置詞", "to the libraryは不定詞、to studyも不定詞"], "to the libraryは前置詞、to studyは不定詞", "to the libraryは名詞libraryの前にある前置詞、to studyは原形studyの前にある不定詞。toの直後の形で判別する。"),
  q("participle", "___ finished my homework, I went out. に入る形は？", ["Having", "Finishing", "To have", "Being"], "Having", "主節のwent outより先に宿題を終えたので、分詞構文はhaving + 過去分詞のHaving finishedにする。"),
  q("gerund", "___ singing surprised everyone. に、意味上の主語を所有格で置く形は？", ["His", "Him", "He", "Himself"], "His", "動名詞singingの意味上の主語を所有格で示すため、His singingとする。"),
  q("gerund", "I remember ___ singing in the hall. に、意味上の主語を目的格で置く形は？", ["him", "his", "he", "to him"], "him", "動名詞singingの意味上の主語を目的格で示すため、I remember him singing ... とする。"),
  q("infinitive", "According to the schedule, the students ___ to meet at nine. に入る形は？", ["are", "have", "do", "can"], "are", "be to不定詞はbe + to + 原形の形で、予定や取り決めを表す。ここでは生徒たちが9時に集まることになっている。"),
  q("participle", "When the weather was fine, we went out. を分詞構文にすると？", ["The weather being fine, we went out.", "Being fine, we went out.", "The weather was fine, going out.", "When being fine, we went out."], "The weather being fine, we went out.", "従属節と主節の主語が異なるため、the weatherを残し、be動詞をbeingに変える。接続詞whenは省略する。"),
  q("participle", "She walked home, singing. の singing の意味は？", ["歌いながら", "歌われたので", "歌うために", "歌うべきだったので"], "歌いながら", "分詞構文が文末に置かれ、主節のwalkedと同時の付帯状況を表すため、「歌いながら」と読む。"),
  q("participle", "___ knowing the answer, I stayed silent. に入る語は？", ["Not", "No", "Did not", "Don't"], "Not", "分詞構文を否定するときは、分詞knowingの前にnotを置いてNot knowingとする。"),
  q("modal", "Might I come in? の might が表す意味は？", ["控えめに許可を求める", "可能性を表す推量", "義務を表す", "過去の能力を表す"], "控えめに許可を求める", "Might I come in? のmightは、控えめに許可を求める表現。可能性のmightとは働きが異なる。"),
  q("modal", "She ___ missed the bus. に入る、過去への控えめな推量は？", ["might", "might have", "must have to", "has might"], "might have", "might have + 過去分詞は、過去の出来事について「～したかもしれない」と推量する形。"),
  q("infinitive", "It is difficult for children ___ the rule. に入る形は？", ["to understand", "understanding", "understand", "understood"], "to understand", "It is 形容詞 for + 名詞 + to不定詞で、for childrenは不定詞の意味上の主語。"),
  q("modal", "I ___ won if I had practiced. に入る形は？", ["could", "could have", "can have", "could to have"], "could have", "could have + 過去分詞は、条件が満たされていれば「勝てただろうに」という仮定法を表す。"),
  q("infinitive", "I decided ___ go. の否定形として正しいものは？", ["not to", "to not to", "not going", "do not to"], "not to", "不定詞の否定はnot to + 原形。decided not to goとする。"),
  q("negation", "Don't open the door. の形として正しい説明は？", ["Don't + 動詞の原形で否定命令文を作る", "Don't + 三単現で現在形を作る", "be動詞の後ろにnotを置く", "過去形の前にDon'tを置く"], "Don't + 動詞の原形で否定命令文を作る", "否定命令文はDon't + 原形。表面上の主語Youを省略し、openを原形にする。"),
  q("negation", "Open the door. の構造上の説明として正しいものは？", ["Youが構造上の主語だが表面上省略され、openは原形", "主語がなく、openは過去形", "the doorが主語で、openは三単現", "Youが必ず表面上文頭にある"], "Youが構造上の主語だが表面上省略され、openは原形", "命令文ではYouを表面上省略し、動詞を原形にする。構造上の主語がないわけではない。"),
  // Stage 4: 文のつながりと周辺の基礎
  q("conjunction", "「必要な時間内はここにいてよい」と「私の知る範囲では店は閉まっている」に入る組合せは？", ["as long as / as far as", "as far as / as long as", "in case / as long as", "as long as / in case"], "as long as / as far as", "時間を表す「必要な時間内は」はas long as、知識の範囲を表す「私の知る範囲では」はas far asを使う。"),
  q("conjunction", "He was tired, so he went home. の so がつなぐ関係は？", ["独立して成立する文どうしの対等な関係", "名詞と形容詞", "前置詞と目的語", "一つの名詞とその関係詞節"], "独立して成立する文どうしの対等な関係", "He was tiredとhe went homeはそれぞれ文として成立し、soが対等につなぐ。"),
  q("conjunction", "Take an umbrella ___ it rains. に入る表現は？", ["in case", "as long as", "as far as", "whether"], "in case", "in caseは雨が降る場合に備えて、という意味。雨が降ってからではなく、降るといけないので先に傘を持つ。"),
  q("conjunction", "the fact that she won の that節の働きは？", ["factの内容を示す同格の名詞節", "factを選ぶ関係代名詞節", "主節の条件を示す副詞節", "前置詞句"], "factの内容を示す同格の名詞節", "that she wonはfactの内容を示す名詞節。名詞を選別する関係代名詞のthatとは異なる。"),
  q("conjunction", "I don't know if he will come. の if he will come 全体の働きは？", ["「彼が来るかどうか」を表す名詞節", "「もし彼が来れば」を表す条件の副詞節", "名詞を修飾する形容詞節", "理由を表す副詞節"], "「彼が来るかどうか」を表す名詞節", "if he will comeはknowの内容になる名詞節で、「彼が来るかどうか」を表す。主節に条件を加える副詞節ではない。"),
  q("conjunction", "We stayed home because it was raining. の because節の働きは？", ["理由を表す副詞節", "動詞の目的語", "主語の補語", "名詞を修飾する形容詞節"], "理由を表す副詞節", "because it was rainingは、家にいた理由を説明する副詞節。"),
  q("relative", "the boy who runs の who runs が説明している名詞は？", ["the boy", "who", "runs", "説明する名詞はない"], "the boy", "who runsは走る少年という意味で、先行詞the boyを説明する形容詞節。"),
  q("relative", "the boy who runs の who は関係詞節の中で何に当たる？", ["主語", "目的語", "前置詞", "補語"], "主語", "whoはrunsの主体であるboyを受け、関係詞節の主語として働く。"),
  q("relative", "the book that I read の that は関係詞節の中で何に当たる？", ["目的語", "主語", "副詞", "接続詞だけ"], "目的語", "I readの対象がbookなので、thatは関係詞節内の動詞readの目的語。"),
  q("relative", "I met a student ___ father teaches English. に入る関係詞は？", ["whose", "who", "whom", "which"], "whose", "空所はa studentを受け、fatherとの所有関係を示す。whose fatherで「その生徒の父」を表す。完成文の訳は「私は、父親が英語を教えている生徒に会った」。"),
  q("relative", "the students who studied の who studied が学生の範囲を狭める用法は？", ["制限用法", "非制限用法", "比較用法", "仮定法"], "制限用法", "studied人に限定して学生の範囲を狭めているため、制限用法。"),
  q("relative", "the book (that) I read で that を省略できる理由は？", ["制限用法で、節内の動詞の目的語だから", "非制限用法で、節内の主語だから", "thatが前置詞だから", "必ず関係代名詞は省略できるから"], "制限用法で、節内の動詞の目的語だから", "制限用法・節の先頭・節内で目的語という条件がそろうため省略できる。"),
  q("relative", "the boy who runs で who を省略できない理由は？", ["whoが関係詞節内の主語だから", "制限用法ではないから", "whoが前置詞の目的語だから", "節の先頭にないから"], "whoが関係詞節内の主語だから", "関係代名詞が節内の主語の場合、3条件による省略の対象にならない。"),
  q("conjunction", "「彼が来るかどうか」を表す語を入れると、I don't know ___ he will come.", ["whether", "so that", "in case", "as far as"], "whether", "whether he will comeは「彼が来るかどうか」という名詞節。二つの可能性を比べる内容を文の要素として組み込んでいる。"),
  q("negation", "間接疑問文の定義として正しいものは？", ["疑問文を名詞節にしたもの", "疑問文を形容詞にしたもの", "否定文を命令文にしたもの", "関係詞節を比較級にしたもの"], "疑問文を名詞節にしたもの", "間接疑問文は疑問の内容を名詞節として文に組み込んだもの。"),
  q("negation", "Do you know where the station ___? に入る形は？", ["is", "is it", "does", "be"], "is", "間接疑問文ではwhere the station isの平叙文語順にし、直接疑問文のwhere is the stationにしない。"),
  q("negation", "Not every student agreed. の意味として正しいものは？", ["全員が賛成したわけではない", "誰一人賛成しなかった", "全員が必ず賛成した", "賛成した学生は一人だけだった"], "全員が賛成したわけではない", "notがeveryを否定する部分否定で、「全員が賛成した」ことを否定する。Nobody agreed. のような全否定ではない。"),
  q("negation", "They ___ not play tennis. に入る形は？", ["do", "are", "does", "is"], "do", "助動詞のない一般動詞の否定はdo not play。主語Theyなのでdoを使う。"),
  q("negation", "She will ___ be late. に入る形は？", ["not", "does not", "no", "is not"], "not", "すでに助動詞willがあるため、willの後ろにnotを置く。doは重ねない。"),
  q("negation", "___ they play tennis? の空所に入る語は？", ["Do", "Are", "Does", "Is"], "Do", "助動詞のない一般動詞playの疑問文で、主語Theyに合わせてDoを置く。"),
  q("nouns", "___ students in this class are practicing. に入る語は？", ["The", "A", "An", "Much"], "The", "the＋複数形は、文脈上特定できる集団を表す。ここではin this classによって対象の生徒たちが限定されている。"),
  q("nouns", "初めて話題に出す犬を1匹見たとき、I saw ___ dog in the park. に入る語は？", ["a", "the", "an", "some"], "a", "初めて話題に出すdogを、同種のものの中の1匹として表すためaを使う。すでに共有認識されている特定の犬ならtheになる。"),
  q("nouns", "話し手と聞き手が特定の1冊を知っているとき、I read ___ book. に入る語は？", ["the", "a", "an", "many"], "the", "話し手と聞き手がどの本か共通して認識できるため、定冠詞theを使う。単数だから自動的にtheになるわけではない。"),
  q("nouns", "one の基本的な働きは？", ["前に出た単数可算名詞の代わり", "不可算名詞を複数にする働き", "動詞の時制を表す働き", "前置詞の代わり"], "前に出た単数可算名詞の代わり", "oneは同じ単数可算名詞の繰り返しを避ける代名詞。"),
  q("subjunctive", "___ I known, I would have helped. に入る語は？", ["Had", "Did", "Was", "If had"], "Had", "Had I knownはIf I had knownのif省略による倒置。仮定法ではHadを主語の前に出せる。"),
  q("adverb", "He runs quickly. の quickly が修飾するものは？", ["runs", "He", "runの目的語", "前置詞"], "runs", "quicklyは走る方法を説明する副詞で、動詞runsを修飾する。"),
  q("conjunction", "When (she was) young, she lived in Kyoto. の括弧内を省略できる条件は？", ["副詞節内の主語が主節と同じで、動詞がbe動詞", "副詞節が名詞節で、一般動詞", "主節と副詞節の主語が異なり、be動詞", "どの副詞節でも主語だけ省略"], "副詞節内の主語が主節と同じで、動詞がbe動詞", "副詞節内のsheは主節のsheと同じ主語で、動詞がbe動詞wasなので、主語とbe動詞をまとめて省略できる。"),
  q("adverb", "the book on the desk の on the desk の働きは？", ["名詞を説明する形容詞の役割", "動詞を説明する副詞の役割", "名詞の目的語になる役割", "語を対等につなぐ接続詞"], "名詞を説明する形容詞の役割", "on the deskはどの本かを示し、名詞bookを後ろから説明する前置詞句。"),
  q("nouns", "The tall tree has fallen. の動詞hasが合わせる名詞は？", ["tree", "tall", "The", "fallen"], "tree", "長い名詞句でも、主語の中心となる名詞treeが単数なのでhasを使う。"),
  q("pattern", "There ___ a problem with the plan yesterday. に入る形は？", ["was", "were", "is", "are"], "was", "yesterdayが過去を示し、後ろの名詞句a problemが単数なのでwasを使う。"),
  // Stage 5: 比較・仮定法・総合
  q("comparison", "tall の比較級は？", ["taller", "tallest", "more tall", "most tall"], "taller", "短い形容詞tallは比較級で-erを付けてtallerにする。"),
  q("comparison", "beautiful の比較級として基本的な形は？", ["more beautiful", "beautifuler", "most beautiful", "more beautifully"], "more beautiful", "長い形容詞beautifulは比較級でmore beautifulとする。"),
  q("comparison", "Tom is as tall ___ Ken. に入る語は？", ["as", "than", "to", "from"], "as", "同程度を表すas + 原級 + asの形にする。"),
  q("comparison", "Mary is taller ___ her sister. に入る語は？", ["than", "as", "to", "from"], "than", "比較級tallerの比較対象はthan以下で示す。"),
  q("comparison", "Mount Fuji is ___ mountain in Japan. に入る形は？", ["the highest", "higher", "high", "most high"], "the highest", "3つ以上の中で最も高いものなので、the + 最上級the highestを使う。"),
  q("comparison", "The more you read, the more you learn. の意味は？", ["読めば読むほど、より多く学ぶ", "読むほど学ばなくなる", "最も読んだ人だけが学ぶ", "読む前に学ぶ"], "読めば読むほど、より多く学ぶ", "the + 比較級 ..., the + 比較級 ... は、ある変化に応じて別の変化が進む関係を表す。"),
  q("comparison", "This box is too heavy for me to carry. の too heavy の意味は？", ["重すぎて運べない程度", "運べるほど軽い", "最も重い", "重さがない"], "重すぎて運べない程度", "too + 形容詞 + to不定詞は、〜するには過度であるという意味を表す。"),
  q("modal", "You ___ apologize to her. に、shouldと同じ意味の表現を入れると？", ["ought to", "ought", "ought have", "oughting to"], "ought to", "ought toはshouldと同じ意味領域で、「～すべきだ」という義務・忠告を表す。toを省略しない。"),
  q("conjunction", "It was ___ cold that the lake froze. に入る語は？", ["so", "as", "too", "very"], "so", "so + 形容詞 + that ... は、結果に焦点を置けば「とても寒かったので、その結果、湖が凍った」、程度に焦点を置けば「湖が凍るくらい寒かった」と読める。"),
  q("subjunctive", "If it rains tomorrow, we will stay home. の条件節が表すものは？", ["未来の可能性を示す条件", "現在に反する仮定", "過去の出来事への後悔", "命令を表す文"], "未来の可能性を示す条件", "現実に起こり得る条件を表す文で、if節は現在形、主節はwillを使っている。"),
  q("subjunctive", "If I ___ rich, I would travel. に入るbe動詞は？", ["were", "am", "was", "will be"], "were", "現在の事実に反する仮定法過去では、主語Iでも基本的にwereを使う。"),
  q("subjunctive", "If I had studied harder, I ___ the exam. に入る形は？", ["would have passed", "would pass", "will pass", "had pass"], "would have passed", "過去の事実に反する仮定法過去完了では、主節をwould have + 過去分詞にする。"),
  q("subjunctive", "If I had taken the job, I ___ in Tokyo now. に入る形は？", ["would live", "would have lived", "will live", "had lived"], "would live", "条件は過去のhad taken、結果は現在の状態in Tokyo nowなので、ミックス仮定法の主節はwould + 原形にする。"),
  q("subjunctive", "I wish I ___ taller. に入る形は？", ["were", "am", "will be", "had been"], "were", "現在の実現しにくい願望なので、wishの後ろに過去形wereを置く。"),
  q("modal", "You ___ have told me earlier, but you did not. に入る形は？", ["should", "should have", "should to", "should had"], "should have", "should have + 過去分詞は、ここでは「もっと早く言うべきだったのに」という非難・不満を表す。"),
  q("subjunctive", "If the plan ___ to fail, we would need a new one. に入る形は？", ["were", "was", "had", "would be"], "were", "If S were to + 原形は、未来についてあくまで仮の話をする公式。ここではwere to failとなる。"),
  q("tense", "He said that he ___ busy the next day. に入る形は？", ["would be", "is", "has been", "will be"], "would be", "過去のsaidから見た未来なので、willの過去形wouldを使う。"),
  q("passive", "The chef cooked the meal. と同じ内容の受動態は？", ["The meal was cooked by the chef.", "The chef was cooked by the meal.", "The meal cooked the chef.", "The meal did cooked by the chef."], "The meal was cooked by the chef.", "能動態の目的語the mealを主語にし、was cookedとby the chefを使う。"),
  q("infinitive", "I stopped ___ because I was tired. に、行為をやめた意味で入る形は？", ["working", "to work", "work", "worked"], "working", "stop + 動名詞は、その行為をやめるという意味。stop to workなら働くために立ち止まる別の意味になる。"),
  q("relative", "The book that I bought was expensive. の that I bought は何を説明する？", ["The book", "the writer", "the purchase", "the price"], "The book", "that I boughtは私が買った本という意味で、先行詞The bookを説明する。"),
  q("foundation", "The boy who lives next door opened the door. の構造上の主語と述語動詞は？", ["The boy who lives next door と opened", "who と lives", "the door と opened", "boy と door"], "The boy who lives next door と opened", "主節の構造上の主語はThe boy who lives next door全体、述語動詞はopened。who lives next doorはboyを説明する関係詞節。"),
  q("negation", "He does not like coffee. の形として正しい説明は？", ["doesが助動詞で、likeは原形", "doesとlikesを両方使う", "be動詞の後ろにnotを置く", "notを主語の前に置く"], "doesが助動詞で、likeは原形", "一般動詞の否定ではdoes notを使い、三単現のsはdoesに移る。"),
  q("infinitive", "He seems ___ left. に入る形は？", ["to have", "to", "having", "to had"], "to have", "to have + 過去分詞の完了不定詞は、主節のseemsより前に起きたことを表す。He seems to have left. で「彼は出発したようだ」。"),
  q("foundation", "quickly の品詞として最も適切なものは？", ["副詞", "名詞", "前置詞", "冠詞"], "副詞", "quicklyはquickに-lyが付いた代表的な副詞で、動作の方法などを説明する。語尾だけでなく文中の働きも確認する。"),
  q("pattern", "She gave her brother a gift. の a gift の働きは？", ["動詞gaveの直接目的語", "動詞gaveの間接目的語", "brotherを修飾する形容詞", "前置詞の目的語"], "動詞gaveの直接目的語", "a giftは与えた物を表す直接目的語。her brotherは受け手の間接目的語。"),
  q("nouns", "I need ___ information. に入る語として正しいものは？", ["some", "an", "many", "a few"], "some", "informationは通常不可算名詞なので、単数可算名詞用のanやa fewではなくsomeを使う。"),
  q("adverb", "The test was extremely difficult. の extremely が修飾するものは？", ["形容詞difficult", "名詞test", "動詞wasだけ", "冠詞The"], "形容詞difficult", "extremelyはdifficultの程度を強める副詞。"),
  q("pattern", "They elected him president. の president の働きは？", ["目的語himとイコールになる補語", "動詞electedの目的語", "主語Theyの補語", "前置詞の目的語"], "目的語himとイコールになる補語", "presidentはhimが何に選ばれたかを説明する目的格補語。"),
  q("relative", "Maya has three cousins, all of ___ live abroad. に入る語は？", ["whom", "who", "them", "which"], "whom", "前置詞ofの後ろで人を表す関係代名詞の目的格なのでwhom。"),
  q("negation", "You finished the report, ___? に入る付加疑問は？", ["didn't you", "did you", "weren't you", "don't you"], "didn't you", "本文が過去形の肯定文なので、反対の否定形didn't youを付ける。"),

  // 受験英文法の不足領域を補う50問
  q("pattern", "The teacher showed us the answer. とほぼ同じ内容になる文は？", ["The teacher showed the answer to us.", "The teacher showed the answer for us.", "The teacher showed us to the answer.", "The teacher was shown the answer by us."], "The teacher showed the answer to us.", "show + 人 + 物の第4文型は、物を目的語にしてshow + 物 + to + 人へ書き換えられる。for usは「私たちのために」という意味になり、受け手を示す書き換えではない。訳は「先生は私たちに答えを示した」。"),
  q("pattern", "We found the room empty. の empty の働きは？", ["目的語the roomを説明する補語", "動詞foundの目的語", "主語Weを説明する補語", "動詞foundを修飾する副詞"], "目的語the roomを説明する補語", "the roomが目的語、emptyがその状態を説明する目的格補語で、the room = emptyの関係になる。emptyはfoundの対象ではなく、部屋の状態を示す。訳は「私たちはその部屋が空だと分かった」。"),
  q("verb_form", "Every student ___ a dictionary. に入る形は？", ["has", "have", "having", "to have"], "has", "every + 単数名詞が主語なので、動詞も単数形hasにする。studentsと複数にしたりhaveを選んだりしない。訳は「どの生徒も辞書を持っている」。"),
  q("verb_form", "Either my parents or my brother ___ coming. に入る形は？", ["is", "are", "be", "were"], "is", "either A or Bで主語を結ぶ場合、ここでは動詞に近いmy brotherが単数なのでisを使う。parentsだけを見てareにしない。訳は「両親か弟のどちらかが来る」。"),
  q("verb_form", "The number of applicants ___ increasing. に入る形は？", ["is", "are", "have", "be"], "is", "主語の中心はThe number「数」で単数なのでis increasingとなる。applicantsが複数でも、それ自体が主語の中心ではない。訳は「応募者数が増えている」。"),
  q("verb_form", "A number of students ___ absent today. に入る形は？", ["are", "is", "was", "be"], "are", "a number of + 複数名詞は「多数の～」を表し、複数扱いでareを使う。The number ofとは一致が異なる。訳は「今日は多くの生徒が欠席している」。"),
  q("tense", "Water ___ at 100 degrees Celsius. に入る形は？", ["boils", "is boiling", "boiled", "has boiled"], "boils", "一般的な事実は現在形で表すためWater boils ...となる。今この瞬間の進行中の動作ではないのでis boilingを選ばない。訳は「水は摂氏100度で沸騰する」。"),
  q("tense", "This is the first time I ___ sushi. に入る形は？", ["have eaten", "ate", "am eating", "had eaten"], "have eaten", "the first timeが現在の経験を振り返る形なので、現在までの経験を表す現在完了have eatenを使う。過去の特定時を示していないためateではない。訳は「寿司を食べるのはこれが初めてだ」。"),
  q("tense", "She ___ in Kyoto for five years, and she still lives there. に入る形は？", ["has lived", "lived", "lives", "had lived"], "has lived", "過去から現在まで続く状態をfor five yearsと述べるため現在完了has livedを使う。still lives thereが継続中であることを示す。訳は「彼女は京都に5年間住んでいて、今もそこに住んでいる」。"),
  q("tense", "By the time we arrived, the train ___. に入る形は？", ["had left", "left", "has left", "will leave"], "had left", "列車の出発は過去のarrivedより前なので、過去の基準時よりさらに前を表す過去完了had leftを使う。単なる出来事の順番ではなく前後関係を明示する。訳は「私たちが着くまでに列車は出発していた」。"),
  q("tense", "By next March, I ___ here for ten years. に入る形は？", ["will have worked", "have worked", "had worked", "will work"], "will have worked", "by next Marchが未来の基準時を示し、その時までの継続期間を述べるので未来完了will have workedを使う。訳は「来年3月までで、私はここに10年間勤務したことになる」。"),
  q("passive", "All applications must ___ by Friday. に入る形は？", ["be submitted", "submit", "be submitting", "submitted"], "be submitted", "applicationsは提出される側なので、助動詞mustの後ろにbe + 過去分詞submittedを置く。must submittedではbeが不足する。訳は「すべての申請書は金曜日までに提出されなければならない」。"),
  q("passive", "My aunt gave me this watch. を、meに焦点を当てた受動態にすると？", ["I was given this watch by my aunt.", "This watch was given me by I.", "I gave this watch by my aunt.", "My aunt was given me this watch."], "I was given this watch by my aunt.", "giveの2つの目的語のうち受け手meを主語Iにし、was given this watchとする。I was given ... は「私は～を与えられた」。訳は「私は叔母からこの時計をもらった」。"),
  q("passive", "They saw him enter the room. を受動態にすると？", ["He was seen to enter the room.", "He was seen enter the room.", "He saw to enter the room.", "The room was seen him enter."], "He was seen to enter the room.", "能動態のsee + 目的語 + 原形不定詞は、受動態では目的語を主語にし、原形不定詞の前にtoを戻してwas seen to enterとする。訳は「彼がその部屋に入るのを見られた」。"),
  q("infinitive", "I went to the library ___ for the exam. に、「試験勉強をするために」の意味で入る形は？", ["to study", "studying", "for study", "studied"], "to study", "図書館へ行った目的を表すため、to + 原形の不定詞to studyを使う。studyingだけではwentの目的をこの形で示せない。訳は「私は試験勉強をするために図書館へ行った」。"),
  q("infinitive", "Mina was the first student ___ the answer. に入る形は？", ["to find", "finding", "found", "finds"], "to find", "the first studentとto findの間に「その生徒が見つける」というSV関係があり、to findがstudentを説明する。訳は「ミナは最初に答えを見つけた生徒だった」。"),
  q("gerund", "I enjoy ___ English novels. に入る形は？", ["reading", "to read", "read", "to reading"], "reading", "enjoyは後ろに動名詞を取るためenjoy readingとする。enjoy to readは標準的な語法ではない。訳は「私は英語の小説を読むことを楽しんでいる」。"),
  q("gerund", "Please avoid ___ the same mistake. に入る形は？", ["making", "to make", "make", "made"], "making", "avoidは後ろに動名詞を取るためavoid makingとする。to makeではない。訳は「同じ間違いをするのを避けてください」。"),
  q("gerund", "I remember ___ the door before I left. に、「鍵をかけた記憶がある」の意味で入る形は？", ["locking", "to lock", "lock", "locked"], "locking", "remember + 動名詞は、すでにした行為を覚えていることを表す。remember to lockなら、これからすべきことを忘れずに行う意味になる。訳は「出発前にドアに鍵をかけたのを覚えている」。"),
  q("gerund", "We stopped ___ because we were tired. に、「休むために立ち止まった」の意味で入る形は？", ["to rest", "resting", "rest", "rested"], "to rest", "stop to restでは、別の動作を止めた目的がto restで示される。stop restingなら「休むことをやめる」と意味が変わる。訳は「疲れていたので、私たちは休むために立ち止まった」。"),
  q("gerund", "I look forward to ___ you again. に入る形は？", ["meeting", "meet", "to meet", "met"], "meeting", "look forward toのtoは前置詞なので、後ろには名詞相当の動名詞meetingを置く。to meetという不定詞にはしない。訳は「またお会いするのを楽しみにしています」。"),
  q("participle", "The students were ___ in the experiment. に入る形は？", ["interested", "interesting", "interest", "interestingly"], "interested", "学生は興味を引き起こす側ではなく、興味を感じる側なので過去分詞由来のinterestedを使う。interestingなら「興味を起こさせる」となる。訳は「生徒たちはその実験に興味を持った」。"),
  q("participle", "the window ___ by the storm に入る形は？", ["broken", "breaking", "broke", "breaks"], "broken", "windowは壊す側ではなく壊される側なので、受動関係を表す過去分詞brokenで修飾する。訳は「嵐で壊された窓」。"),
  q("participle", "___ from the hill, the town looks small. に入る形は？", ["Seen", "Seeing", "To see", "Saw"], "Seen", "町は丘から見る側ではなく見られる側なので、受動関係の過去分詞Seenを使う。Seeingなら主節の主語the townが見る側になってしまう。訳は「丘から見ると、その町は小さく見える」。"),
  q("participle", "She stood with her eyes ___. に入る形は？", ["closed", "closing", "close", "to close"], "closed", "with + 目的語 + 補語で、eyesが閉じられた状態を表すため過去分詞closedを使う。closingでは目が何かを閉じる側になる。訳は「彼女は目を閉じて立っていた」。"),
  q("comparison", "There are ___ cars on the road than last year. に入る形は？", ["fewer", "less", "few", "little"], "fewer", "carsは複数可算名詞なので、その数がより少ないことはfewer carsで表す。lessは基本的に不可算名詞の量に使う。訳は「道路を走る車は昨年より少ない」。"),
  q("comparison", "This problem is ___ more difficult than that one. に入る語は？", ["much", "very", "most", "many"], "much", "比較級more difficultを強めるときはmuchを使う。veryは原級を強める語で、very more difficultとはしない。訳は「この問題はあの問題よりずっと難しい」。"),
  q("comparison", "Tokyo is larger than ___ city in Japan. に入る形は？", ["any other", "any", "all other", "the other"], "any other", "Tokyo自身を比較対象から外し、日本の他のどの都市よりも大きいと表すためany other cityを使う。any cityではTokyo自身も範囲に含み得る。訳は「東京は日本の他のどの都市よりも大きい」。"),
  q("comparison", "This is one of the ___ tools in the lab. に入る形は？", ["most useful", "more useful", "useful", "most usefully"], "most useful", "one of the + 最上級 + 複数名詞で「最も～なものの一つ」を表す。toolsが比較する集団で、usefullyは副詞なので名詞を説明できない。訳は「これは研究室で最も役立つ道具の一つだ」。"),
  q("comparison", "This bridge is twice ___ that one. に入る形は？", ["as long as", "longer than", "as longer as", "the longest of"], "as long as", "倍数はtwice as + 原級 + asで表す。twice longer thanではなくtwice as long asを用いる。訳は「この橋はあの橋の2倍の長さだ」。"),
  q("relative", "This is the town ___ I was born. に入る関係詞は？", ["where", "which", "what", "who"], "where", "先行詞townが場所で、関係詞節I was bornは文の要素がそろっており、場所を表す副詞が必要なのでwhereを使う。訳は「ここが私の生まれた町だ」。"),
  q("relative", "I remember the day ___ we first met. に入る関係詞は？", ["when", "where", "which", "what"], "when", "先行詞the dayが時を表し、関係詞節we first metは文の要素がそろっているため、時を表す関係副詞whenを使う。訳は「私たちが初めて会った日を覚えている」。"),
  q("relative", "___ you need is more practice. に入る語は？", ["What", "Which", "That", "Who"], "What", "Whatは先行詞を含んで「あなたが必要とするもの」という名詞節を作る。Whichやthatにはこの文中で受ける先行詞がない。訳は「あなたに必要なのは、もっと練習することだ」。"),
  q("relative", "The person to ___ I spoke was very helpful. に入る語は？", ["whom", "who", "whose", "which"], "whom", "前置詞toの直後で人を表す目的格が必要なので、書き言葉ではwhomを使う。whoを使うならthe person who I spoke toのように前置詞を後ろへ置く。訳は「私が話した人はとても親切だった」。"),
  q("conjunction", "I wrote the date down ___ I would not forget it. に入る形は？", ["so that", "so ... that", "because of", "in spite of"], "so that", "「忘れないように」という目的を表すのでso that + 主語 + 助動詞を使う。so + 形容詞 + thatの結果・程度構文とは形が異なる。訳は「忘れないように日付を書き留めた」。"),
  q("conjunction", "___ it was raining, we went out. に入る語は？", ["Although", "Despite", "Because of", "In spite"], "Although", "空所の後ろはit was rainingという節なので、従属接続詞Althoughを使う。Despiteやbecause ofは前置詞で、後ろに名詞相当語を取る。訳は「雨が降っていたが、私たちは外出した」。"),
  q("subjunctive", "The doctor suggested that he ___ a few days off. に入る形は？", ["should take", "to take", "taking", "takes to"], "should take", "suggest that S should + 原形で、提案する内容を表す。suggest + 人 + to不定詞とはしない。訳は「医師は彼が数日休むよう提案した」。"),
  q("subjunctive", "I wish I ___ harder for the exam. に、過去への後悔を表す形を入れると？", ["had studied", "studied", "would study", "have studied"], "had studied", "過去の事実と異なる願望・後悔はwish + 過去完了で表す。studiedだけでは現在についての反実に読まれやすい。訳は「試験に向けてもっと勉強しておけばよかった」。"),
  q("subjunctive", "___ your help, I could not have finished the work. に、「もし助けがなかったなら」の意味で入る語は？", ["Without", "Because of", "During", "Besides"], "Without", "Without your helpは過去の事実に反する条件を表し、If it had not been for your helpに相当する。Because ofなら「助けが原因で終えられなかった」という逆の意味になる。訳は「あなたの助けがなかったなら、私は仕事を終えられなかっただろう」。"),
  q("nouns", "How ___ books did you borrow? に入る語は？", ["many", "much", "little", "less"], "many", "booksは複数可算名詞なので数を尋ねるmanyを使う。muchは不可算名詞の量に使う。訳は「あなたは本を何冊借りましたか」。"),
  q("nouns", "How ___ information do we need? に入る語は？", ["much", "many", "few", "fewer"], "much", "informationは通常不可算名詞なので量を尋ねるmuchを使う。many informationとはしない。訳は「私たちにはどれくらいの情報が必要ですか」。"),
  q("nouns", "I have ___ friends in this town, so I am not lonely. に入る形は？", ["a few", "few", "a little", "little"], "a few", "friendsは複数可算名詞で、a fewは「少しはいる」という肯定的な意味を表す。fewなら「ほとんどいない」という否定的な含みになる。訳は「この町には友人が数人いるので、寂しくない」。"),
  q("nouns", "There were ___ seats left. に、「ほとんど席が残っていなかった」の意味で入る形は？", ["few", "a few", "little", "a little"], "few", "seatsは複数可算名詞で、fewは「ほとんど残っていない」という不足を表す。a fewなら「少しは残っている」という肯定的な見方になる。訳は「席はほとんど残っていなかった」。"),
  q("nouns", "Would you like ___ cup of tea? に入る語は？", ["another", "other", "the others", "others"], "another", "単数可算名詞cupの前で「もう一杯」を表すためanotherを使う。otherだけでは単数可算名詞を限定できない。訳は「紅茶をもう一杯いかがですか」。"),
  q("nouns", "I have two pens. One is blue, and ___ is black. に入る形は？", ["the other", "another", "others", "the others"], "the other", "二つのうち一方をoneで示した後、残るもう一方はthe otherで表す。anotherは不特定のもう一つを加える語。訳は「ペンを2本持っていて、一本は青、もう一本は黒だ」。"),
  q("adverb", "You must work ___ to improve. に入る語は？", ["hard", "hardly", "harderly", "hardness"], "hard", "「一生懸命に」は副詞hardで表す。hardlyは「ほとんど～ない」という否定的な意味で、hardの単なる副詞形ではない。訳は「上達するには一生懸命取り組まなければならない」。"),
  q("adverb", "She has been very busy ___. に入る語は？", ["lately", "late", "later", "latest"], "lately", "現在までの最近の期間を表す副詞latelyを現在完了とともに使う。lateは「遅く」で意味が異なる。訳は「彼女は最近とても忙しい」。"),
  q("adverb", "The room is warm ___ for the baby. に入る語は？", ["enough", "very", "so", "such"], "enough", "程度が必要量に達していることを表す副詞enoughは、形容詞warmの後ろに置く。enough warmとはしない。訳は「その部屋は赤ちゃんにとって十分暖かい」。"),
  q("adverb", "It was ___ difficult question that nobody could answer it. に入る形は？", ["such a", "so a", "such", "so"], "such a", "名詞句a difficult questionを強めるためsuch aを使う。soはso difficult a questionの語順なら可能だが、so a difficult questionとはしない。訳は「それはとても難しい問題だったので、誰も答えられなかった」。"),
  q("negation", "Hardly ___ at the station when the train left. に入る形は？", ["had I arrived", "I had arrived", "did I arrive", "I arrived"], "had I arrived", "否定的なhardlyを文頭に置くと、助動詞と主語を倒置してHardly had I arrived ...とする。I had arrivedの平叙文語順にはしない。訳は「私が駅に着くやいなや、列車が出た」。")
];

const ACTIVE_RULE_IDS = [
  "egp.sentence-structure.noun",
  "egp.verbs.verb",
  "egp.modifiers.adjective",
  "egp.modifiers.adverb-functions",
  "egp.sentence-structure.complement",
  "egp.sentence-structure.dummy-it",
  "egp.sentence-structure.preposition",
  "egp.sentence-structure.preposition-object",
  "egp.sentence-structure.verb-object",
  "egp.clauses-relatives.coordinating-conjunctions",
  "egp.clauses-relatives.subordinating-conjunctions",
  "egp.clauses-relatives.adverb-clause-subject-be-omission",
  "egp.clauses-relatives.appositive-that",
  "egp.clauses-relatives.as-long-as-as-far-as",
  "egp.clauses-relatives.if-clause-functions",
  "egp.clauses-relatives.in-case",
  "egp.clauses-relatives.relative-pronouns",
  "egp.clauses-relatives.relative-clause-uses",
  "egp.clauses-relatives.relative-pronoun-omission",
  "egp.clauses-relatives.relative-adverbs",
  "egp.clauses-relatives.what-nominal-clause",
  "egp.clauses-relatives.so-that-meanings",
  "egp.clauses-relatives.so-that-purpose",
  "egp.clauses-relatives.whether-clause-functions",
  "egp.conditionals-subjunctive.future-subjunctive",
  "egp.conditionals-subjunctive.if-omission-inversion",
  "egp.conditionals-subjunctive.mixed-subjunctive",
  "egp.conditionals-subjunctive.past-perfect-subjunctive",
  "egp.conditionals-subjunctive.past-subjunctive",
  "egp.conditionals-subjunctive.without-implied-condition",
  "egp.conditionals-subjunctive.wish",
  "egp.verbs.intransitive",
  "egp.verbs.transitive",
  "egp.verbs.auxiliaries",
  "egp.verbs.be-verb-functions",
  "egp.verbs.be-auxiliary-functions",
  "egp.verbs.imperatives",
  "egp.negation-questions.not-negation",
  "egp.negation-questions.scope",
  "egp.negation-questions.restrictive-adverb-inversion",
  "egp.negation-questions.yes-no-questions",
  "egp.negation-questions.wh-questions",
  "egp.negation-questions.indirect-question",
  "egp.sentence-structure.there-introductory",
  "egp.sentence-structure.person",
  "egp.agreement.third-person-singular-present-s",
  "egp.agreement.be-present-past",
  "egp.agreement.subject-head",
  "egp.tense-aspect.simple-present",
  "egp.tense-aspect.progressive-meanings",
  "egp.tense-aspect.present-perfect-current-state",
  "egp.tense-aspect.perfect-reference-time",
  "egp.tense-aspect.adverb-clause-present-for-future",
  "egp.tense-aspect.sequence-of-tenses",
  "egp.sentence-structure.sentence-definition",
  "egp.sentence-structure.sentence-structure",
  "egp.sentence-structure.predicate-verb",
  "egp.sentence-structure.structural-subject",
  "egp.nonfinite.nonfinite-verbs",
  "egp.nonfinite.infinitive-form",
  "egp.nonfinite.infinitive-purpose",
  "egp.nonfinite.be-to-infinitive",
  "egp.nonfinite.infinitive-adjectival-use",
  "egp.nonfinite.infinitive-negation",
  "egp.nonfinite.infinitive-semantic-subject",
  "egp.nonfinite.initial-to-infinitive-use",
  "egp.nonfinite.participial-construction-formation",
  "egp.nonfinite.participial-construction-meaning",
  "egp.nonfinite.participial-construction-negation",
  "egp.nonfinite.participial-construction-tense",
  "egp.nonfinite.participles-as-adjectives",
  "egp.nonfinite.perfect-infinitive",
  "egp.nonfinite.to-infinitive-or-preposition",
  "egp.nonfinite.gerund-subject",
  "egp.nonfinite.verb-complement-ing-or-infinitive",
  "egp.nonfinite.suggest-complements",
  "egp.nonfinite.bare-infinitive",
  "egp.voice.passive-formation",
  "egp.voice.passive-extended",
  "egp.modality.can",
  "egp.modality.could",
  "egp.modality.could-have-pp",
  "egp.modality.have-to",
  "egp.modality.may",
  "egp.modality.might",
  "egp.modality.might-have-pp",
  "egp.modality.must",
  "egp.modality.ought-to",
  "egp.modality.shall",
  "egp.modality.should",
  "egp.modality.should-have-pp",
  "egp.modality.will",
  "egp.modality.would",
  "egp.modality.would-have-pp",
  "egp.modifiers.adjective-uses",
  "egp.modifiers.adverb-non-noun-modification",
  "egp.modifiers.confusable-adverbs",
  "egp.modifiers.enough-position",
  "egp.modifiers.frequency-adverbs",
  "egp.modifiers.ly-suffix",
  "egp.modifiers.so-such",
  "egp.nouns-determiners-pronouns.definite-article-the",
  "egp.nouns-determiners-pronouns.indefinite-article",
  "egp.nouns-determiners-pronouns.the-plural-group",
  "egp.nouns-determiners-pronouns.uncountable-noun",
  "egp.nouns-determiners-pronouns.quantifiers",
  "egp.nouns-determiners-pronouns.other-another",
  "egp.comparison.forms-and-targets",
  "egp.comparison.extended-patterns",
  "egp.sentence-structure.sentence-pattern-1",
  "egp.sentence-structure.sentence-pattern-2",
  "egp.sentence-structure.sentence-pattern-4",
  "egp.sentence-structure.svc-judgement",
  "egp.verbs.intransitive-heuristic",
  "egp.verbs.transitive-heuristic"
];

const LEARNING_STAGES = [
  {
    label: "文の骨格・5文型・名詞句",
    description: "語の役割を確認し、SV・SVC・SVO・SVOO・SVOCの順に文の骨格を見抜きます。",
    units: [
      { id: "parts-of-speech", label: "品詞・句・文の要素", questionIds: ["q1", "q14", "q18", "q3", "q4", "q5", "q6", "q7", "q8", "q9", "q10", "q13", "q16", "q17"] },
      { id: "sentence-patterns-basic", label: "5文型の基本", questionIds: ["q2", "q11", "q12", "q23", "q22", "q24", "q25", "q26", "q27", "q28", "q29", "q30", "q120"] },
      { id: "sentence-patterns-application", label: "5文型の応用", questionIds: ["q145", "q148", "q151", "q152"] },
      { id: "sentence-structure-bridge", label: "形式主語と準動詞への入口", questionIds: ["q15", "q19", "q20"] },
      { id: "noun-phrases-intro", label: "名詞句・冠詞・数量の入口", questionIds: ["q111", "q112", "q113", "q114", "q190", "q191"] }
    ]
  },
  {
    label: "動詞・時制・助動詞",
    description: "主語と動詞の一致から始め、時制・相を整理し、最後に助動詞の意味へ進みます。",
    units: [
      { id: "agreement", label: "主語と動詞の一致", questionIds: ["q31", "q32", "q33", "q34", "q35", "q119", "q153", "q154", "q155", "q156"] },
      { id: "auxiliary-forms", label: "助動詞の種類と動詞の形", questionIds: ["q36", "q37", "q61", "q64"] },
      { id: "simple-present", label: "現在形・一般的事実", questionIds: ["q157"] },
      { id: "progressive", label: "進行形", questionIds: ["q45", "q46", "q47", "q48", "q50"] },
      { id: "perfect", label: "完了形", questionIds: ["q51", "q158", "q159", "q160", "q161"] },
      { id: "sequence-of-tenses", label: "時制の一致", questionIds: ["q53", "q54", "q137"] },
      { id: "modality-basic", label: "助動詞の基本意味", questionIds: ["q42", "q49", "q52", "q55", "q56", "q57", "q58", "q59", "q60", "q62", "q63", "q128"] }
    ]
  },
  {
    label: "受動態・準動詞",
    description: "受動態の骨格を固め、不定詞・動名詞・分詞を形と意味の順に整理します。",
    units: [
      { id: "passive", label: "受動態", questionIds: ["q38", "q65", "q66", "q67", "q68", "q69", "q70", "q138", "q162", "q163", "q164"] },
      { id: "infinitive", label: "不定詞", questionIds: ["q71", "q72", "q73", "q74", "q75", "q76", "q80", "q86", "q88", "q143", "q165", "q166"] },
      { id: "gerund", label: "動名詞", questionIds: ["q21", "q78", "q79", "q167", "q168", "q169", "q170", "q171", "q139"] },
      { id: "participle", label: "分詞・分詞構文", questionIds: ["q77", "q81", "q82", "q83", "q172", "q173", "q174", "q175"] }
    ]
  },
  {
    label: "節・関係詞・修飾・否定",
    description: "節の種類を見分け、関係詞で名詞を説明し、修飾語と基本的な否定・疑問を整理します。",
    units: [
      { id: "clauses", label: "接続詞・節", questionIds: ["q91", "q92", "q93", "q94", "q95", "q96", "q104", "q117", "q129", "q185", "q186"] },
      { id: "relatives", label: "関係詞", questionIds: ["q97", "q98", "q99", "q100", "q101", "q102", "q103", "q140", "q141", "q149", "q181", "q182", "q183", "q184"] },
      { id: "modifiers", label: "形容詞・副詞・修飾", questionIds: ["q116", "q118", "q144", "q147", "q196", "q197", "q198"] },
      { id: "negation-basic", label: "否定・疑問の基本", questionIds: ["q39", "q40", "q41", "q43", "q44", "q89", "q90", "q108"] }
    ]
  },
  {
    label: "比較・仮定法・総合",
    description: "比較表現、条件文・仮定法、否定疑問と名詞・程度表現を入試問題へつなげます。",
    units: [
      { id: "comparison", label: "比較", questionIds: ["q121", "q122", "q123", "q124", "q125", "q126", "q127", "q176", "q177", "q178", "q179", "q180"] },
      { id: "conditionals", label: "条件文・仮定法", questionIds: ["q115", "q130", "q131", "q132", "q133", "q134", "q136", "q187", "q188", "q189"] },
      { id: "modality-advanced", label: "助動詞の発展", questionIds: ["q84", "q85", "q87", "q135"] },
      { id: "negation-questions-advanced", label: "否定・疑問の発展", questionIds: ["q105", "q106", "q107", "q109", "q110", "q142", "q150", "q200"] },
      { id: "noun-phrases-application", label: "名詞・数量・代名詞の応用", questionIds: ["q146", "q192", "q193", "q194", "q195"] },
      { id: "degree-expression", label: "程度表現", questionIds: ["q199"] }
    ]
  }
];

for (const stage of LEARNING_STAGES) {
  stage.questionIds = stage.units.flatMap(unit => unit.questionIds);
}
const UNIT_BY_QUESTION_ID = new Map();
for (const stage of LEARNING_STAGES) {
  for (const unit of stage.units) {
    for (const id of unit.questionIds) UNIT_BY_QUESTION_ID.set(id, unit);
  }
}

function defaultMisconceptions(question) {
  return Object.fromEntries(question.choices
    .filter(choice => choice !== question.answer)
    .map(choice => [choice, `「${choice}」を選ぶと、${DOMAIN_REVIEW_HINTS[question.domain]}`]));
}

const questions = QUESTIONS.map((question, index) => {
  const id = `q${index + 1}`;
  const ruleRefs = QUESTION_RULE_REFS[id] || [];
  const unit = UNIT_BY_QUESTION_ID.get(id);
  return {
    ...question,
    id,
    skill: "knowledge",
    target: DOMAIN_TARGETS[question.domain],
    unitId: unit?.id || null,
    unitLabel: unit?.label || null,
    priority: "support",
    basis: ruleRefs.length ? "active-principle" : "standard-foundation",
    ruleRefs,
    misconceptions: { ...defaultMisconceptions(question), ...question.misconceptions, ...(QUESTION_MISCONCEPTIONS[id] || {}) }
  };
});

window.GRAMMAR_CHECK_DATA = {
  title: "英文法 基礎知識チェック",
  contentVersion: 12,
  activeRuleIds: ACTIVE_RULE_IDS,
  learningStages: LEARNING_STAGES,
  questionOrder: LEARNING_STAGES.flatMap(stage => stage.questionIds),
  domains: [
    { id: "foundation", label: "品詞・句・節・文の要素", order: 1, rule: "英文の骨格と、語・句・節の役割を分けます。", points: ["名詞・動詞・形容詞・副詞の基本的な働き", "構造上の主語と述語動詞", "目的語・補語・前置詞句の違い"], examples: ["The boy opened the door.", "in the room / because he was tired"], traps: ["語数だけで句と節を決めず、主語と述語動詞の有無を見る。"] },
    { id: "pattern", label: "文型・自他動詞", order: 2, rule: "動詞の後ろの要素と説明関係から文型を判断します。", points: ["SVCの補語は主語を説明する", "SVOCの補語は目的語を説明する", "自動詞・他動詞と前置詞の有無"], examples: ["She is kind.", "They made him happy."], traps: ["動詞の後ろに名詞があっても、すべて目的語とは限らない。"] },
    { id: "verb_form", label: "動詞の形・一致", order: 3, rule: "主語・時制・助動詞を順に見て動詞の形を決めます。", points: ["3人称単数現在のs", "be動詞の人称・数・時制", "助動詞の後ろの原形"], examples: ["She plays tennis.", "They were tired."], traps: ["doesや助動詞の後ろに三単現のsや過去形を重ねない。"] },
    { id: "tense", label: "時制・進行形・完了形", order: 4, rule: "時を表す語と基準時との関係から形と意味を決めます。", points: ["進行形の複数の意味", "現在完了と現在の状態", "時制の一致と過去完了"], examples: ["She is reading now.", "I have lost my key."], traps: ["形だけで進行形や現在完了の意味を一つに決めない。"] },
    { id: "modal", label: "助動詞", order: 5, rule: "助動詞の後ろの形と、文脈上の判断を確認します。", points: ["助動詞の後ろは原形", "許可・義務・助言・推量", "否定による意味の変化"], examples: ["You should study.", "That cannot be true."], traps: ["must notとdo not have toを同じ意味にしない。"] },
    { id: "passive", label: "受動態", order: 6, rule: "能動態の目的語を主語にし、be助動詞と過去分詞を使います。", points: ["目的語を受動態の主語に移す", "時制はbe助動詞に表す", "元の主語はby句で示せる"], examples: ["The window was broken by Ken."], traps: ["過去分詞だけで受動態にしない。"] },
    { id: "infinitive", label: "不定詞", order: 7, rule: "to + 原形の形と、名詞・形容詞・副詞の働きを確認します。", points: ["名詞的・形容詞的・副詞的用法", "意味上の主語", "完了不定詞と否定形"], examples: ["To read is useful.", "a book to read"], traps: ["toの後ろを過去形や-ing形にしない。"] },
    { id: "gerund", label: "動名詞", order: 8, rule: "動詞の性質を残した名詞として、形と意味上の主語を確認します。", points: ["動名詞句の名詞としての働き", "動名詞の意味上の主語", "動詞ごとの動名詞・不定詞の違い"], examples: ["Reading books is useful.", "his singing"], traps: ["動名詞を文の述語動詞として扱わない。"] },
    { id: "participle", label: "分詞・分詞構文", order: 9, rule: "修飾される名詞が動作をする側か受ける側かを確認します。", points: ["現在分詞の能動関係", "過去分詞の受動関係", "分詞句の修飾範囲"], examples: ["the girl running in the park", "the window broken by the ball"], traps: ["-ingなら必ず進行形とは限らない。"] },
    { id: "comparison", label: "比較", order: 10, rule: "比較する対象と程度に合う形を選びます。", points: ["比較級・最上級", "as ... as", "比較級を使う表現"], examples: ["taller than Ken", "the highest mountain"], traps: ["比較級と最上級、比較対象の数を混同しない。"] },
    { id: "relative", label: "関係詞", order: 11, rule: "先行詞と関係詞節内の欠けた要素から関係詞を判断します。", points: ["関係代名詞の先行詞と節内の働き", "制限用法・非制限用法", "関係代名詞の省略条件"], examples: ["the book that I read", "the town where she grew up"], traps: ["関係詞節の中で主語が欠けているか目的語が欠けているかを見る。"] },
    { id: "conjunction", label: "接続詞・節", order: 12, rule: "対等な接続か従属関係か、節全体の働きを確認します。", points: ["等位接続詞", "名詞節・副詞節", "従属接続詞自体は節内の要素ではない"], examples: ["and / so", "because he was tired"], traps: ["接続詞の後ろが完全な文か、名詞句かを確認する。"] },
    { id: "subjunctive", label: "条件文・仮定法", order: 13, rule: "現実の可能性か反実仮想か、いつの事実かを判断します。", points: ["現実に起こり得る条件", "現在の反実仮想", "過去の反実仮想とwish"], examples: ["If it rains, we will stay home.", "If I were you, ..."], traps: ["仮定法過去は、形が過去でも現在の反実仮想を表す。"] },
    { id: "nouns", label: "名詞・冠詞・代名詞", order: 14, rule: "名詞の数え方と、何を指すかを確認します。", points: ["可算名詞・不可算名詞", "a・an・the", "名詞句の中心と代名詞one"], examples: ["an apple", "some information"], traps: ["単数可算名詞を限定詞なしで置かない。"] },
    { id: "adverb", label: "形容詞・副詞・修飾", order: 15, rule: "何を修飾しているかから形と働きを判断します。", points: ["形容詞の名詞修飾", "副詞の動詞・形容詞修飾", "前置詞句の修飾関係"], examples: ["a useful book", "run quickly"], traps: ["語尾だけで形容詞と副詞を決めない。"] },
    { id: "negation", label: "否定文・疑問文", order: 16, rule: "be動詞・一般動詞・助動詞の有無で語順を組み立てます。", points: ["notの位置", "Yes/No疑問文", "疑問詞疑問文・間接疑問文"], examples: ["Does he play?", "where the station is"], traps: ["助動詞がある文にdoを重ねない。"] }
  ],
  questions
};
