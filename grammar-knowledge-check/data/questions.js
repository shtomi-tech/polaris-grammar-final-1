const DOMAIN_TARGETS = {
  foundation: "句・節・文の要素を、英文の中で役割ごとに分ける力",
  pattern: "動詞の後ろの要素から文型と自他を判断する力",
  verb_form: "主語・時制・助動詞から動詞の形を決める力",
  tense: "出来事を基準時との前後関係に置く力",
  modal: "助動詞・類似表現の形と意味を区別する力",
  passive: "受け手を主語にした形と必要な前置詞を判断する力",
  infinitive: "to 不定詞の働きと意味上の主語を見分ける力",
  gerund: "動名詞を必要とする位置と不定詞との意味差を見分ける力",
  participle: "分詞の能動・受動と時間関係を判断する力",
  comparison: "比較の形と話し手の含意を読み取る力",
  relative: "先行詞と節内で欠ける要素から関係詞を選ぶ力",
  conjunction: "節と名詞句、節どうしの関係を区別する力",
  subjunctive: "現実との距離と時間から仮定法の形を決める力",
  nouns: "名詞の可算性・限定詞・格を文中で判断する力",
  adverb: "修飾先から形容詞・副詞の形と意味を選ぶ力",
  preposition: "時間・場所・到達の関係を前置詞で区別する力",
  negation: "否定の範囲と語順から文意を判断する力"
};

const QUESTION_META = {
  q1: { skill: "application", misconceptions: { "句": "接続詞 because を見て句と誤認している。", "単語": "まとまりの中の主語・動詞を確認していない。", "文型": "まとまりの種類と文型を混同している。" } },
  q2: { skill: "distinction" }, q3: { skill: "knowledge" }, q4: { skill: "application" },
  q5: { skill: "distinction" }, q6: { skill: "application", priority: "core" }, q7: { skill: "distinction" }, q8: { skill: "application", priority: "core" },
  q9: { skill: "application" }, q10: { skill: "distinction" }, q11: { skill: "knowledge" },
  q12: { skill: "knowledge", priority: "support" }, q13: { skill: "distinction", priority: "core" }, q14: { skill: "application" }, q15: { skill: "distinction", priority: "core" }, q16: { skill: "distinction" },
  q17: { skill: "knowledge" }, q18: { skill: "distinction", priority: "core" }, q19: { skill: "distinction" },
  q20: { skill: "knowledge" }, q21: { skill: "application", priority: "core" }, q22: { skill: "distinction" },
  q23: { skill: "knowledge" }, q24: { skill: "application" }, q25: { skill: "application" }, q26: { skill: "distinction", priority: "core" },
  q27: { skill: "application" }, q28: { skill: "application" }, q29: { skill: "distinction", priority: "core" },
  q30: { skill: "application" }, q31: { skill: "distinction", priority: "core" }, q32: { skill: "application" }, q33: { skill: "distinction" },
  q34: { skill: "knowledge" }, q35: { skill: "application" }, q36: { skill: "distinction", priority: "core" }, q37: { skill: "knowledge" },
  q38: { skill: "application", priority: "core" }, q39: { skill: "distinction" }, q40: { skill: "application" }, q41: { skill: "distinction" },
  q42: { skill: "distinction", priority: "core" }, q43: { skill: "application", priority: "core" }, q44: { skill: "application" },
  q45: { skill: "application" }, q46: { skill: "application", priority: "core" }, q47: { skill: "distinction" },
  q48: { skill: "distinction" }, q49: { skill: "knowledge" }, q50: { skill: "application" }, q51: { skill: "distinction" },
  q52: { skill: "application" }, q53: { skill: "distinction" }, q54: { skill: "knowledge" },
  q55: { skill: "distinction", priority: "core" }, q56: { skill: "application", priority: "core" },
  q57: { skill: "application" }, q58: { skill: "distinction", priority: "core" }, q59: { skill: "application" }, q60: { skill: "application" },
  q61: { skill: "knowledge", priority: "support" }, q62: { skill: "knowledge", priority: "support" },
  q63: { skill: "knowledge", priority: "support" }, q64: { skill: "knowledge", priority: "support" },
  q65: { skill: "knowledge", priority: "support" }, q66: { skill: "knowledge", priority: "support" },
  q67: { skill: "knowledge", priority: "support" }, q68: { skill: "knowledge", priority: "support" },
  q69: { skill: "knowledge", priority: "support" }, q70: { skill: "knowledge", priority: "support" }
};

const LEARNING_STAGES = [
  {
    label: "文の骨組み",
    questionIds: ["q3", "q71", "q72", "q2", "q4", "q1", "q73", "q61", "q63", "q65", "q67", "q74", "q69", "q70", "q5", "q7", "q6", "q8", "q76", "q11", "q75", "q9", "q10"]
  },
  {
    label: "動詞の体系",
    questionIds: ["q12", "q62", "q77", "q78", "q16", "q13", "q14", "q15", "q79", "q80", "q64", "q17", "q19", "q18", "q20", "q81", "q82", "q22", "q21"]
  },
  {
    label: "準動詞",
    questionIds: ["q23", "q83", "q84", "q24", "q25", "q26", "q85", "q86", "q27", "q28", "q29", "q87", "q88", "q30", "q31", "q32", "q33"]
  },
  {
    label: "比較・節・関係詞",
    questionIds: ["q34", "q89", "q90", "q37", "q35", "q36", "q93", "q42", "q43", "q94", "q44", "q91", "q92", "q66", "q39", "q40", "q38", "q41"]
  },
  {
    label: "発展構文と語法",
    questionIds: ["q95", "q45", "q47", "q96", "q46", "q49", "q97", "q48", "q50", "q51", "q54", "q98", "q52", "q53", "q68", "q99", "q55", "q56", "q100", "q59", "q57", "q58", "q60"]
  }
];

const QUESTION_PATCHES = {
  q1: {
    stem: "In \"because he was tired\", \"he was tired\" は何か。",
    choices: ["句", "節", "単語", "文型"],
    answer: "節",
    explanation: "he was tired に主語 he と動詞 was があるため節。because はその節を導く接続詞であり、節そのものではない。"
  },
  q8: {
    stem: "arrive の使い方として正しい文はどれか。",
    choices: ["We arrived the station before noon.", "We arrived at the station before noon.", "We arrived to the station before noon.", "We arrived the station to before noon."],
    answer: "We arrived at the station before noon.",
    explanation: "arrive は目的語を直接取らない自動詞。到着地点には arrive at + 小さい場所 / arrive in + 都市・国を用いる。",
    misconceptions: { "We arrived the station before noon.": "日本語の『駅に着く』から arrive を他動詞のように扱っている。", "We arrived to the station before noon.": "arrive の後の前置詞を to と一般化している。", "We arrived the station to before noon.": "動詞・前置詞・時を表す語の配置を混同している。" }
  },
  q13: {
    stem: "I lost my key, so I can't open the door. に最も合う時制は？",
    choices: ["I lost my key.", "I have lost my key.", "I had lost my key yesterday.", "I am losing my key."],
    answer: "I have lost my key.",
    explanation: "鍵を失った結果が今も続き、今ドアを開けられない。過去の出来事を現在の結果につなぐので現在完了が最も自然。",
    misconceptions: { "I lost my key.": "過去の出来事だけを述べる過去形と、現在に残る結果を混同している。", "I had lost my key yesterday.": "過去完了を明確な過去時点 yesterday と単独で用いている。", "I am losing my key.": "lose を一時的な進行中の動作として扱っている。" },
    reason: { prompt: "現在完了を選ぶ根拠は？", choices: ["失った結果が現在も続いている", "yesterday がある", "主語が三人称単数である", "受動態である"], answer: "失った結果が現在も続いている" }
  },
  q18: {
    stem: "After a month, I am used to ___ up early. に入る形は？",
    choices: ["get", "got", "getting", "to get"],
    answer: "getting",
    explanation: "be used to の to は前置詞で、その後ろには名詞相当の語を置く。動詞なら -ing 形になる。",
    reason: { prompt: "getting を選ぶ直接の根拠は？", choices: ["to が前置詞として働く", "am の後ろは必ず -ing 形", "early が副詞である", "used が過去形である"], answer: "to が前置詞として働く" }
  },
  q21: {
    stem: "My father gave me this book. を「この本」を主語にして受動態にすると？",
    choices: ["This book was given me by my father.", "This book was given to me by my father.", "This book gave me by my father.", "This book was giving to me by my father."],
    answer: "This book was given to me by my father.",
    explanation: "SVOO を物主語の受動態にすると、残る人には通常 to を付ける。時制は be 動詞 was に表し、given は過去分詞。",
    reason: { prompt: "to me が必要な理由は？", choices: ["物を主語にすると、人の要素を前置詞句で残すため", "give は常に to を取る自動詞だから", "受動態では目的語を二つ置けないため", "me が主語になるため"], answer: "物を主語にすると、人の要素を前置詞句で残すため" }
  },
  q29: {
    stem: "The bus stopped ___ passengers get off. に入る形は？",
    choices: ["to let", "letting", "let", "to letting"],
    answer: "to let",
    explanation: "stop to do は「〜するために立ち止まる」。バスが止まった目的を表すので to let。stop -ing なら、その行為自体をやめる意味になる。",
    reason: { prompt: "to let を選ぶ根拠は？", choices: ["停止の目的を表している", "let の後ろは必ず to 不定詞だから", "bus が三人称単数だから", "passengers が複数だから"], answer: "停止の目的を表している" }
  },
  q31: {
    stem: "The lecture was ___, so the students were ___. に最も合う組み合わせは？",
    choices: ["excited / exciting", "exciting / excited", "excite / excitement", "excited / excited"],
    answer: "exciting / excited",
    explanation: "lecture は人を興奮させる側なので exciting、students は興奮を感じる側なので excited。修飾される対象との関係で選ぶ。",
    reason: { prompt: "二つの形を分ける基準は？", choices: ["人をそうさせる側か、そう感じる側か", "名詞が単数か複数か", "文が現在形か過去形か", "-ed の方が長い語か"], answer: "人をそうさせる側か、そう感じる側か" }
  },
  q38: {
    stem: "The scientist ___ research changed the field won the prize. に入る語は？",
    choices: ["who", "whose", "which", "where"],
    answer: "whose",
    explanation: "research の前には、その研究が誰のものかを示す所有格の関係詞 whose が必要。先行詞は scientist。",
    misconceptions: { "who": "人を先行詞にすることだけで who を選び、節内の役割を見ていない。", "which": "直後の research を先行詞だと誤認している。", "where": "場所を表していないのに関係副詞を選んでいる。" },
    reason: { prompt: "whose を選ぶ根拠は？", choices: ["research の所有者を示す必要がある", "scientist が人だから", "後ろが過去形だから", "場所を表す名詞があるから"], answer: "research の所有者を示す必要がある" }
  },
  q43: {
    stem: "___ it was raining, the game was canceled. に最も合う語句は？",
    choices: ["Because", "Because of", "Although", "Despite"],
    answer: "Because",
    explanation: "後ろの it was raining は主語＋動詞を含む節なので Because。Because of と Despite の後ろには名詞句を置く。Although は譲歩を表し、後半の内容と合わない。",
    misconceptions: { "Because of": "because と because of の後ろに置く形を混同している。", "Although": "原因と譲歩の関係を混同している。", "Despite": "前置詞 despite の後ろに節を置いている。" },
    reason: { prompt: "Because を選ぶ直接の根拠は？", choices: ["後ろが主語＋動詞を含む節である", "雨は必ず because を伴う", "the game が単数である", "文が過去形である"], answer: "後ろが主語＋動詞を含む節である" }
  },
  q46: {
    stem: "If I had studied harder, I ___ the exam. に入る形は？",
    choices: ["will pass", "would pass", "would have passed", "had passed"],
    answer: "would have passed",
    explanation: "If + had + p.p. は過去の事実に反する仮定。主節は would have + p.p. で、過去に起こらなかった結果を表す。",
    reason: { prompt: "would have passed を選ぶ根拠は？", choices: ["条件節が過去完了で、過去の反実仮想だから", "harder が比較級だから", "exam が単数だから", "If の後ろは必ず would だから"], answer: "条件節が過去完了で、過去の反実仮想だから" }
  },
  q42: {
    stem: "because と because of の後ろに置く形として正しい組み合わせは？",
    choices: ["because + 節 / because of + 名詞句", "because + 名詞句 / because of + 節", "because + 原形 / because of + 原形", "because + 副詞 / because of + 副詞"],
    answer: "because + 節 / because of + 名詞句",
    explanation: "because it rained のように because の後ろには節を置く。because of the rain のように because of の後ろには名詞句を置く。",
    misconceptions: { "because + 名詞句 / because of + 節": "because と because of の後ろに置く形を逆にしている。", "because + 原形 / because of + 原形": "接続詞・前置詞の後ろを助動詞と同じように扱っている。", "because + 副詞 / because of + 副詞": "節・名詞句・副詞の役割を区別できていない。" },
    reason: { prompt: "組み合わせを分ける直接の根拠は？", choices: ["because の後ろは節、because of の後ろは名詞句だから", "because の方が長い語だから", "because of は過去形だけに使うから", "because は文頭に置けないから"], answer: "because の後ろは節、because of の後ろは名詞句だから" }
  },
  q55: {
    stem: "The report must be finished ___ Friday, but the team will work on it ___ Friday. に最も合う組み合わせは？",
    choices: ["by / until", "until / by", "at / in", "from / during"],
    answer: "by / until",
    explanation: "by Friday は金曜を期限とする。until Friday は金曜まで継続する。前半は完了の期限、後半は作業の継続期間。",
    reason: { prompt: "by と until を分ける基準は？", choices: ["期限か、継続の終点か", "曜日か月か", "主語が単数か複数か", "受動態か能動態か"], answer: "期限か、継続の終点か" }
  },
  q56: {
    stem: "He was outside the room. He crossed the doorway and walked ___ it. に最も合う語は？",
    choices: ["to", "into", "at", "by"],
    answer: "into",
    explanation: "外から戸口を越えて内部へ入る動きなので into。to は到達点を示すだけで、内部への移動までは表さない。",
    misconceptions: { "to": "到達点と内部へ入る移動を区別していない。", "at": "場所を点として示す at を移動の方向に用いている。", "by": "そばを通る意味の by を到達の意味で用いている。" },
    reason: { prompt: "into を選ぶ根拠は？", choices: ["境界を越えて内部へ入る動きがある", "room が単数名詞である", "walk は過去形である", "outside が前置詞だから"], answer: "境界を越えて内部へ入る動きがある" }
  },
  q58: {
    stem: "Few students submitted the form, but a few asked questions. の意味として最も適切なものは？",
    choices: ["提出した生徒はほとんどおらず、質問した生徒は少しはいた", "提出した生徒も質問した生徒も多かった", "提出した生徒は少しおり、質問した生徒はほとんどいなかった", "提出も質問もゼロだった"],
    answer: "提出した生徒はほとんどおらず、質問した生徒は少しはいた",
    explanation: "few は「ほとんどない」、a few は「少しはある」。a の有無は数量だけでなく、話し手の見方を変える。",
    reason: { prompt: "二つの語を分ける根拠は？", choices: ["a の有無が『少しはある』という含みを作る", "few は複数名詞に使えない", "a few は否定文でしか使えない", "form が単数だから"], answer: "a の有無が『少しはある』という含みを作る" }
  }
};

function defaultMisconceptions(question) {
  return Object.fromEntries(question.choices
    .filter(choice => choice !== question.answer)
    .map(choice => [choice, `「${DOMAIN_TARGETS[question.domain]}」の判断根拠を取り違えている。`]));
}

window.GRAMMAR_CHECK_DATA = {
  title: "英文法 基礎知識チェック",
  learningStages: LEARNING_STAGES,
  questionOrder: LEARNING_STAGES.flatMap(stage => stage.questionIds),
  domains: [
    { id: "foundation", label: "品詞・句・節・文の要素", order: 1, rule: "文法用語は、英文を読むための座標です。まず「何が」「どこで」働いているかを分けます。", points: ["句は主語＋動詞を含まないまとまり、節は主語＋動詞を含むまとまり。", "主語(S)・動詞(V)・目的語(O)・補語(C)は文の骨組み。修飾語(M)は骨組みに情報を足す。", "名詞は人・物・事柄、形容詞は名詞を、 副詞は動詞・形容詞・副詞・文全体を修飾する。"], examples: ["in the room は句、because he was tired は節。", "She gave me a book. は S + V + O + O。"], traps: ["長いまとまりでも、主語＋動詞がなければ節ではない。"] },
    { id: "pattern", label: "文型・自他動詞", order: 2, rule: "文型は「動詞の後ろに何を必要とするか」を見る道具です。訳語から決めません。", points: ["SVC の C は S を説明する。SVO の O は動作の対象。", "SVOO は『人に物を与える』型、SVOC の C は O を説明する。", "自動詞は目的語を直接取らず、他動詞は目的語を取る。"], examples: ["She is kind. は SVC。They made him happy. は SVOC。", "listen は listen to music のように前置詞を要する自動詞。"], traps: ["日本語で『〜を』と訳せても、英語で他動詞とは限らない。"] },
    { id: "verb_form", label: "動詞の形・主語との一致", order: 3, rule: "時制・主語・助動詞の三つを先に確認すると、動詞の形はかなり絞れます。", points: ["三人称単数・現在の一般動詞には -s / -es。", "do / does / did の後、助動詞の後、to の後は動詞の原形。", "be 動詞は主語と時制に合わせて am / are / is / was / were を選ぶ。"], examples: ["He plays tennis. / Does he play tennis?", "She can swim. の swim は原形。"], traps: ["does の s と動詞の s を二重にしない。"] },
    { id: "tense", label: "時制・完了形・進行形", order: 4, rule: "時制は出来事を時間軸に置くための仕組みです。単なる日本語訳で選ばず、基準時との前後関係を見ます。", points: ["現在形は習慣・不変の事実・時刻表にも使う。", "進行形は進行中・一時的状態。状態動詞は原則進行形にしない。", "現在完了は『過去から今へ』をつなぐ。継続・経験・完了／結果を文脈で分ける。", "過去完了は過去の基準時よりさらに前。"], examples: ["I have lived here for five years. は継続。", "When I arrived, she had left. は到着より出発が前。"], traps: ["yesterday など明確な過去時点があれば、通常は現在完了を使わない。"] },
    { id: "modal", label: "助動詞", order: 5, rule: "助動詞は話し手の判断を加え、後ろの動詞を原形にします。", points: ["can / may / must / should / will の後ろは原形。", "must have + p.p. は過去への強い推量。", "used to do は過去の習慣、be used to -ing は『〜に慣れている』。"], examples: ["She must be tired. / She must have been tired.", "I used to play soccer. / I am used to getting up early."], traps: ["must not は『してはいけない』で、have to の否定とは意味が違う。"] },
    { id: "passive", label: "受動態", order: 6, rule: "受動態は『受ける側』を主語にし、be + 過去分詞で作ります。", points: ["時制は be 動詞に表す。", "SVOO は物を主語にする場合、通常 to / for が必要。", "be interested in のように、by 以外の前置詞を伴う受動表現も多い。"], examples: ["The window was broken yesterday.", "A book was given to me."], traps: ["過去分詞だけでは受動態にならない。be 動詞との組で考える。"] },
    { id: "infinitive", label: "不定詞", order: 7, rule: "to + 動詞の原形は、文中で名詞・形容詞・副詞のように働きます。", points: ["名詞的用法＝『〜すること』。主語・目的語・補語になる。", "形容詞的用法＝名詞を後ろから修飾する。", "副詞的用法＝目的・原因・判断の根拠・結果などを表す。", "意味上の主語は原則 for 人、性質を述べる形容詞では of 人。"], examples: ["To read is fun. / a book to read / went there to study", "It is kind of you to help me."], traps: ["『主語・目的語・補語』は名詞的用法の位置であり、3用法そのものではない。"] },
    { id: "gerund", label: "動名詞", order: 8, rule: "動名詞は動詞の -ing 形を名詞として使う形です。", points: ["動名詞は主語・目的語・補語になる。", "前置詞の後ろは名詞相当なので、動詞なら -ing 形にする。", "stop -ing は『〜するのをやめる』、stop to do は『〜するために立ち止まる』。"], examples: ["Reading books is useful.", "Thank you for helping me."], traps: ["to が前置詞なら、その後ろも -ing。be used to -ing が代表。"] },
    { id: "participle", label: "分詞・分詞構文", order: 9, rule: "分詞は動詞由来の形容詞です。修飾される名詞との能動・受動関係で選びます。", points: ["現在分詞は『〜している・〜させる』、過去分詞は『〜された・〜している』。", "exciting は物事が人を興奮させる、excited は人が興奮している。", "分詞構文の意味上の主語は主節の主語と一致するのが原則。", "Having + p.p. は主節より前の完了を表す。"], examples: ["a sleeping baby / a broken window", "Feeling tired, I went home."], traps: ["分詞構文の主語が主節の主語とずれる『ぶら下がり分詞』に注意。"] },
    { id: "comparison", label: "比較", order: 10, rule: "比較は、何と何を比べ、どの程度かを形で示します。", points: ["as + 原級 + as は同程度。not as / so ... as は『〜ほど…でない』。", "比較級には than、最上級には範囲を示す in / of を伴いやすい。", "the + 比較級 ..., the + 比較級 ... は『〜すればするほど』。", "no more than は『わずか』、not more than は『せいぜい』。"], examples: ["This book is as useful as that one.", "The more you read, the more you learn."], traps: ["more easier のように比較級を重ねない。"] },
    { id: "relative", label: "関係詞", order: 11, rule: "関係詞は二つの内容をつなぎ、前の名詞を説明します。まず先行詞と、節内で欠ける要素を探します。", points: ["who / which / that は先行詞を持つ。who は人、which は物。", "what は『〜すること／もの』で、先行詞を含む。", "where / when / why は場所・時・理由を表す関係副詞。", "-ever は『〜するものは何でも』『たとえ〜しても』の意味を持つ。"], examples: ["The book which I bought is new.", "What he said was true."], traps: ["what の前に the thing を重ねない。what 自体に先行詞の意味が含まれる。"] },
    { id: "conjunction", label: "接続詞・節", order: 12, rule: "接続詞は節と節をつなぎ、節どうしの関係を示します。", points: ["because の後ろは節、because of の後ろは名詞句。", "whether / if は『〜かどうか』の名詞節を作る。", "時・条件を表す副詞節では、未来のことでも現在形を使う。"], examples: ["I stayed home because it was raining.", "I will call you when I arrive."], traps: ["if は『もし〜なら』の条件節と『〜かどうか』の名詞節を区別する。"] },
    { id: "subjunctive", label: "仮定法", order: 13, rule: "仮定法は現実と距離のあることを、時制を一段ずらして表します。", points: ["仮定法過去：If + 過去形, would + 原形。現在の事実に反する仮定。", "仮定法過去完了：If + had + p.p., would have + p.p.。過去の事実に反する仮定。", "I wish の後ろも、現在の願望なら過去形、過去の後悔なら過去完了。"], examples: ["If I were rich, I would travel.", "If I had studied, I would have passed."], traps: ["仮定法過去は『過去について』ではなく、現在の反実仮想を表せる。"] },
    { id: "nouns", label: "名詞・冠詞・代名詞", order: 14, rule: "名詞は数えられるか、特定されるか、文中でどの格かを確認します。", points: ["可算名詞の単数には原則 a / an / the / this などの限定詞が必要。", "不可算名詞は原則複数形にせず、a piece of などで数える。", "主格 I / he、所有格 my / his、目的格 me / him を位置で使い分ける。", "many は可算複数、much は不可算。"], examples: ["I need some information.", "She gave me her notebook."], traps: ["advice, furniture, information は通常不可算。a advice にはしない。"] },
    { id: "adverb", label: "形容詞・副詞", order: 15, rule: "形容詞は名詞・補語を、副詞は動詞・形容詞・副詞・文全体を修飾します。", points: ["be動詞や look / become などの補語には形容詞を置く。", "hard は『一生懸命に』、hardly は『ほとんど〜ない』。", "friendly / lively のように -ly でも形容詞の語がある。"], examples: ["She looks happy.", "He works hard, but he hardly rests."], traps: ["形容詞に機械的に -ly を付ければ副詞、とは限らない。"] },
    { id: "preposition", label: "前置詞", order: 16, rule: "前置詞は、語と語の時間・場所・方法などの関係を示します。語句ごとに覚えます。", points: ["at は点、on は接触面・曜日、in は内部・月年などの広がり。", "by は期限・手段・行為者、until は継続の終点。", "to は到達点、into は中へ入る動き。"], examples: ["at 7 o'clock / on Monday / in July", "Finish it by Friday. / stay until Friday."], traps: ["日本語の『まで』だけでは by と until を選べない。期限か継続かを見る。"] },
    { id: "negation", label: "否定・疑問・強調・倒置", order: 17, rule: "否定や疑問では、語順と否定の及ぶ範囲が意味を左右します。", points: ["not all は部分否定『すべてが〜というわけではない』。", "few / little は『ほとんどない』、a few / a little は『少しはある』。", "間接疑問は疑問詞 + 主語 + 動詞の平叙文語順。", "否定語が文頭に出ると、助動詞・be 動詞を主語の前に置く倒置が起きる。"], examples: ["Not all students agreed.", "Do you know where he lives?", "Never have I seen it."], traps: ["間接疑問で do you know where does he live? とはしない。"] }
  ],
  questions: [
    ["foundation", "句と節の説明として正しいものは？", ["句は主語＋動詞を含み、節は含まない", "句は主語＋動詞を含まず、節は含む", "句も節も必ず動詞を含む", "句も節も必ず主語を含まない"], "句は主語＋動詞を含まず、節は含む", "節かどうかは、主語＋動詞がそろっているかで判断する。"],
    ["foundation", "She gave me a book. の me の文の要素は？", ["主語", "補語", "目的語", "修飾語"], "目的語", "give は『人に物を与える』SVOO型で、me と a book はどちらも目的語。"],
    ["foundation", "名詞を修飾する品詞はどれか。", ["形容詞", "副詞", "接続詞", "前置詞"], "形容詞", "形容詞は名詞を説明し、副詞は動詞・形容詞・副詞などを説明する。"],
    ["foundation", "because he was tired は何か。", ["句", "節", "単語", "文型"], "節", "he was tired に主語 he と動詞 was があるため節。because はその節を導く接続詞。"],
    ["pattern", "She is kind. の文型は？", ["SV", "SVC", "SVO", "SVOC"], "SVC", "kind は主語 She の性質を説明する補語C。be 動詞の後ろはSVCになりやすい。"],
    ["pattern", "They made him happy. の happy の働きは？", ["主語", "目的語", "目的格補語", "修飾語"], "目的格補語", "happy は目的語 him の状態を説明するC。make + O + C はSVOC。"],
    ["pattern", "I gave my sister a present. の文型は？", ["SVC", "SVO", "SVOO", "SVOC"], "SVOO", "my sister と a present の二つの目的語を取る第4文型。"],
    ["pattern", "自動詞の説明として正しいものは？", ["必ず受動態にできる動詞", "目的語を直接取らない動詞", "必ずbe動詞を伴う動詞", "過去形にならない動詞"], "目的語を直接取らない動詞", "arrive, sleep, listen などは目的語を直接取らない。listen to のように前置詞を伴うことはある。"],
    ["verb_form", "He ___ tennis every Sunday. に入る形は？", ["play", "plays", "playing", "to play"], "plays", "He は三人称単数、every Sunday は現在の習慣なので一般動詞にsを付ける。"],
    ["verb_form", "Does she ___ English? に入る形は？", ["speaks", "spoke", "speak", "speaking"], "speak", "does が時制・三単現の情報を持つため、後ろの動詞は原形。"],
    ["verb_form", "助動詞 can の直後に置く動詞の形は？", ["原形", "三単現のs形", "過去形", "-ing形"], "原形", "助動詞の後ろは例外なく原形。can swims にはしない。"],
    ["tense", "現在形が最も自然に表すものは？", ["今この瞬間だけの動作", "過去に一度だけ起きた出来事", "習慣・不変の事実", "過去より前の出来事"], "習慣・不変の事実", "現在形は習慣や一般的事実に使う。進行中なら通常は進行形。"],
    ["tense", "現在完了の基本的な時間関係は？", ["過去の一点だけ", "過去から現在へのつながり", "未来の予定だけ", "現在より後の出来事"], "過去から現在へのつながり", "have + p.p. は過去の出来事を現在と結び、継続・経験・完了／結果を表す。"],
    ["tense", "I have lived here for five years. の現在完了の用法は？", ["経験", "継続", "完了", "結果"], "継続", "for five years が過去から現在までの期間を示すため継続。"],
    ["tense", "When I arrived, she ___ already ___. に最も合う形は？", ["has / left", "had / left", "was / leaving", "will / leave"], "had / left", "到着した過去の時点より、出発がさらに前なので過去完了。"],
    ["tense", "yesterday を伴う文で通常使う時制は？", ["現在完了", "過去形", "未来完了", "現在完了進行形"], "過去形", "yesterday は完結した過去時点を指定するため、通常は過去形。"],
    ["modal", "must have + 過去分詞 が表すものは？", ["未来の予定", "過去への強い推量", "現在の義務", "過去の習慣"], "過去への強い推量", "must have been tired は『疲れていたにちがいない』。"],
    ["modal", "I am used to ___ early. に入る形は？", ["get", "got", "getting", "to get"], "getting", "be used to の to は前置詞なので、後ろは名詞相当の-ing形。"],
    ["modal", "used to do の意味は？", ["以前はよく〜した", "〜することに慣れている", "今まさに〜している", "〜する予定である"], "以前はよく〜した", "used to + 原形は過去の習慣・状態。be used to -ing とは別物。"],
    ["passive", "受動態の基本形は？", ["be + 過去分詞", "have + 原形", "to + 過去分詞", "do + -ing"], "be + 過去分詞", "受動態の時制はbe動詞に表し、動詞本体は過去分詞にする。"],
    ["passive", "My father gave me this book. を物を主語にして受動態にすると？", ["This book was given me by my father.", "This book was given to me by my father.", "This book gave me by my father.", "This book was giving to me by my father."], "This book was given to me by my father.", "物を主語にする第4文型の受動態では、残る人の目的語の前に通常toを置く。"],
    ["passive", "be interested ___ の組み合わせとして正しいものは？", ["at", "by", "in", "to"], "in", "interested は『興味を持たされている』という受動由来だが、前置詞は in を取る。"],
    ["infinitive", "不定詞の3つの基本用法は？", ["主語的・目的語的・補語的", "名詞的・形容詞的・副詞的", "現在・過去・完了", "能動・受動・進行"], "名詞的・形容詞的・副詞的", "3用法は文中での働き。主語・目的語・補語は名詞的用法が置かれる位置。"],
    ["infinitive", "To read books is fun. の不定詞の用法は？", ["名詞的用法", "形容詞的用法", "副詞的用法", "受動態"], "名詞的用法", "To read books 全体が文の主語で『本を読むこと』を表す。"],
    ["infinitive", "I have a book to read. の to read の用法は？", ["名詞的用法", "形容詞的用法", "副詞的用法", "動名詞"], "形容詞的用法", "to read が直前の a book を後ろから説明し『読むべき本』となる。"],
    ["infinitive", "It is kind ___ you to help me. の空所は？", ["for", "of", "by", "with"], "of", "kind は人の性質を評価する形容詞なので、意味上の主語は of 人。"],
    ["gerund", "Reading books is useful. の Reading の働きは？", ["動名詞で主語", "現在分詞で補語", "不定詞で目的語", "前置詞"], "動名詞で主語", "-ing形が『本を読むこと』という名詞として文全体の主語になっている。"],
    ["gerund", "Thank you for ___ me. に入る形は？", ["help", "to help", "helping", "helped"], "helping", "for は前置詞。前置詞の後ろに動詞を置くなら動名詞にする。"],
    ["gerund", "stop to smoke の意味は？", ["喫煙をやめる", "喫煙するために立ち止まる", "喫煙し続ける", "喫煙させられる"], "喫煙するために立ち止まる", "stop -ing は行為をやめる、stop to do は別の目的で立ち止まる。"],
    ["participle", "a ___ window に最も合うものは？", ["breaking", "broken", "break", "to break"], "broken", "窓は『壊す』側でなく『壊される』側なので過去分詞 broken。"],
    ["participle", "The movie was ___. に最も合うものは？", ["excited", "exciting", "excite", "excitement"], "exciting", "映画が人を興奮させるので exciting。人が感じる側なら excited。"],
    ["participle", "分詞構文の意味上の主語は、原則として何と一致するか。", ["直前の名詞", "主節の主語", "目的語", "接続詞"], "主節の主語", "Feeling tired, I went home. では疲れたのも帰ったのも I。"],
    ["participle", "Having finished my homework, I watched TV. の Having finished が表す関係は？", ["主節と同時", "主節より前に完了", "主節より後", "未来の予定"], "主節より前に完了", "Having + p.p. は『宿題を終えた後で』のように主節より前の完了を表す。"],
    ["comparison", "as + 原級 + as の意味は？", ["〜より…だ", "最も〜だ", "〜と同じくらい…だ", "〜すぎて…できない"], "〜と同じくらい…だ", "同程度を表す原級比較。否定なら not as / so ... as。"],
    ["comparison", "The ___ you read, the ___ you learn. に入る組み合わせは？", ["more / more", "most / most", "much / many", "more / most"], "more / more", "the + 比較級 ..., the + 比較級 ... は『〜すればするほど』。"],
    ["comparison", "no more than ten people の意味は？", ["10人より多い", "10人未満", "わずか10人", "少なくとも10人"], "わずか10人", "no more than は少なさを強調する『わずか』。"],
    ["comparison", "比較級と通常セットで用いる語は？", ["than", "that", "as", "so"], "than", "比較級 + than で比較対象を示す。"],
    ["relative", "The boy ___ is running is my brother. に入る語は？", ["who", "which", "what", "where"], "who", "先行詞が人で、関係詞節内の主語が欠けているため who。"],
    ["relative", "What he said was true. の What の特徴は？", ["先行詞を含む", "必ず人を指す", "後ろに完全文を置く", "前置詞だけを修飾する"], "先行詞を含む", "what は『〜すること／もの』で、the thing which の意味をまとめて持つ。"],
    ["relative", "the town ___ I was born に入る語は？", ["when", "where", "why", "what"], "where", "場所 town を先行詞にして、その場所で生まれたことを表す関係副詞 where。"],
    ["relative", "Whatever happens, keep calm. の Whatever の意味は？", ["何が起きても", "何が起きたか", "何かを起こすために", "起きたもの"], "何が起きても", "複合関係詞 -ever は『たとえ何が〜しても』という譲歩を表せる。"],
    ["conjunction", "because と because of の違いとして正しいものは？", ["becauseの後ろは節、because ofの後ろは名詞句", "becauseの後ろは名詞、because ofの後ろは節", "どちらも動詞の原形を取る", "意味が正反対"], "becauseの後ろは節、because ofの後ろは名詞句", "because it rained / because of the rain の形で区別する。"],
    ["conjunction", "I don't know ___ he will come. に最も合う語は？", ["whether", "because", "although", "so"], "whether", "『来るかどうか』という名詞節を作る whether。if も使える場面が多い。"],
    ["conjunction", "I will call you when I ___. に入る形は？", ["will arrive", "arrive", "arrived", "have arrived yesterday"], "arrive", "時を表す副詞節では未来のことでも現在形で未来を表す。"],
    ["subjunctive", "If I ___ rich, I would travel around the world. に入る形は？", ["am", "were", "had been", "will be"], "were", "現在の事実に反する仮定は If + 過去形。be動詞は were を使うのが基本。"],
    ["subjunctive", "If I had studied harder, I ___ the exam. に入る形は？", ["pass", "would pass", "would have passed", "had passed"], "would have passed", "過去の反実仮想は If + had p.p., would have p.p.。"],
    ["subjunctive", "I wish I ___ taller. に最も合う形は？", ["am", "were", "had been", "will be"], "were", "現在の実現しにくい願望は I wish + 過去形。"],
    ["nouns", "information の扱いとして正しいものは？", ["可算名詞なので an information とする", "不可算名詞なので some information とする", "複数形 informations が普通", "動詞なので冠詞を付けない"], "不可算名詞なので some information とする", "information は通常不可算。数えるなら a piece of information。"],
    ["nouns", "可算名詞の単数形 book を一般的に一つ述べるとき、必要になりやすいものは？", ["冠詞などの限定詞", "必ず複数形", "必ず所有格", "助動詞"], "冠詞などの限定詞", "a book / the book / my book のように単数可算名詞は限定詞を伴う。"],
    ["nouns", "She gave ___ a present. に入る語は？", ["I", "my", "me", "mine"], "me", "gave の直後は目的語なので目的格 me。"],
    ["nouns", "___ students are absent today? に最も合う語は？", ["Much", "Many", "Little", "A little"], "Many", "students は可算名詞の複数なので many。much は不可算名詞。"],
    ["adverb", "She looks ___. に最も合う形は？", ["happily", "happy", "happiness", "happierly"], "happy", "look は主語の状態を説明する補語を取るので形容詞 happy。"],
    ["adverb", "He works hard, but he ___ rests. に入る語は？", ["hard", "hardly", "hardest", "hardness"], "hardly", "hardly は『ほとんど〜ない』。hard は『一生懸命に』で意味が異なる。"],
    ["adverb", "friendly の品詞は通常どれか。", ["形容詞", "副詞", "動詞", "前置詞"], "形容詞", "-ly で終わっても friendly, lively, lovely などは形容詞。"],
    ["preposition", "『金曜日までに仕上げる』の期限を表す前置詞は？", ["by", "until", "during", "from"], "by", "by Friday は金曜を期限とする。until Friday は金曜まで継続する。"],
    ["preposition", "I walked ___ the room. に最も合う語は？", ["to", "into", "at", "by"], "into", "部屋の外から中へ入る動きなので into。to は到達点だけを示す。"],
    ["negation", "Not all students agreed. の意味は？", ["全員が賛成した", "誰も賛成しなかった", "全員が賛成したわけではない", "学生だけが賛成した"], "全員が賛成したわけではない", "not が all にかかる部分否定。『全員が〜ない』とは限らない。"],
    ["negation", "few と a few の違いとして正しいものは？", ["fewはほとんどない、a fewは少しはある", "fewは多い、a fewはゼロ", "両方とも不可算名詞だけに使う", "意味の違いはない"], "fewはほとんどない、a fewは少しはある", "a の有無で話し手の見方が変わる。little / a little も同様。"],
    ["negation", "Do you know where he ___? に入る形は？", ["lives", "does live", "does he live", "live does"], "lives", "間接疑問は where + 主語 + 動詞の平叙文語順。"],
    ["negation", "Never ___ I seen such a view. に入る語は？", ["have", "has", "did", "am"], "have", "否定語 Never が文頭に出ると倒置。現在完了なので have + 主語 + p.p.。"],
    ["pattern", "Birds fly. の文型は？", ["SV", "SVC", "SVO", "SVOC"], "SV", "Birds がS、fly がV。fly の後ろに目的語や補語を必要としないためSV。"],
    ["tense", "現在形と現在進行形の基本的な使い分けとして正しいものは？", ["現在形は習慣、現在進行形は進行中の動作", "現在形は過去、現在進行形は未来", "現在形は受動、現在進行形は能動", "どちらも常に同じ意味"], "現在形は習慣、現在進行形は進行中の動作", "現在形は習慣・一般的事実、現在進行形は今進行中または一時的な動作を表す。"],
    ["pattern", "The soup tastes delicious. の文型は？", ["SV", "SVC", "SVO", "SVOC"], "SVC", "delicious は目的語ではなく、主語 The soup の状態を説明する補語C。したがってSVC。"],
    ["modal", "助動詞と基本的な意味の組み合わせとして正しいものは？", ["can＝能力 / may＝許可・可能性 / should＝助言", "can＝禁止 / may＝過去の習慣 / should＝能力", "can＝完了 / may＝比較 / should＝受動", "can＝所有 / may＝進行 / should＝場所"], "can＝能力 / may＝許可・可能性 / should＝助言", "canは能力、mayは許可・可能性、shouldは助言・軽い義務を表すのが基本。"],
    ["pattern", "She opened the window. の文型は？", ["SV", "SVC", "SVO", "SVOC"], "SVO", "She がS、opened がV、the window が動作の対象O。したがってSVO。"],
    ["relative", "物を先行詞にし、関係詞節内の欠けた要素を補う関係代名詞の組み合わせは？", ["which / that", "who / whom", "where / when", "what / where"], "which / that", "物を先行詞とする関係代名詞にはwhichまたはthatを用いる。whatは先行詞を意味に含むため、直前に先行詞を置かない。"],
    ["pattern", "My uncle bought me a bicycle. の文型は？", ["SVC", "SVO", "SVOO", "SVOC"], "SVOO", "me が『人』の目的語、a bicycle が『物』の目的語。二つの目的語を取るためSVOO。"],
    ["preposition", "時を表すat・on・inの使い分けとして正しい組み合わせは？", ["at 7 o'clock / on Monday / in July", "on 7 o'clock / in Monday / at July", "in 7 o'clock / at Monday / on July", "at 7 o'clock / in Monday / on July"], "at 7 o'clock / on Monday / in July", "時刻にはat、曜日・日付にはon、月・年など広がりのある期間にはinを用いる。"],
    ["pattern", "They elected her captain. の文型は？", ["SVC", "SVO", "SVOO", "SVOC"], "SVOC", "her が目的語O、captain が her の役職を説明する補語C。O = C の関係が成り立つためSVOC。"],
    ["pattern", "The news made everyone anxious. の文型は？", ["SVC", "SVO", "SVOO", "SVOC"], "SVOC", "everyone が目的語O、anxious が everyone の状態を説明する補語C。make + O + C のSVOC。"],
    ["foundation", "文の骨組みS・V・O・Cに情報を付け足す修飾語を表す記号は？", ["M", "P", "A", "N"], "M", "修飾語はModifierの頭文字Mで表す。時・場所・方法などを付け足すが、文型の骨組みには含めない。"],
    ["foundation", "補語Cの役割として正しいものは？", ["主語または目的語を説明する", "動詞の時制だけを示す", "名詞を複数形にする", "文と文だけを接続する"], "主語または目的語を説明する", "補語CはSVCでは主語Sを、SVOCでは目的語Oを説明する。S=CまたはO=Cの関係を確認する。"],
    ["pattern", "他動詞の基本的な特徴は？", ["目的語を直接取る", "必ず前置詞を伴う", "補語だけを取る", "受動態にできない"], "目的語を直接取る", "他動詞は動作の対象となる目的語Oを直接取る。前置詞を介する場合は、その動詞自体は目的語を直接取っていない。"],
    ["pattern", "OとCの間に「O = C」の関係がある文型は？", ["SV", "SVC", "SVOO", "SVOC"], "SVOC", "SVOCのCは目的語Oの状態・名称を説明する。They called him Tom. ならhim = Tom。"],
    ["verb_form", "助動詞の直後に置く一般動詞の形は？", ["原形", "過去形", "三単現形", "現在分詞"], "原形", "can, may, must, shouldなどの助動詞の直後には動詞の原形を置く。"],
    ["verb_form", "三人称単数の主語を用いた現在の肯定文で、一般動詞に付けるものは？", ["-sまたは-es", "必ず-ing", "必ず-ed", "to"], "-sまたは-es", "he, she, itなど三人称単数の主語を現在形で用いると、一般動詞に-sまたは-esを付ける。"],
    ["tense", "原則として進行形にしない状態動詞はどれか。", ["know", "run", "write", "swim"], "know", "knowは知識・認識の状態を表すため、通常は進行形にしない。run, write, swimは動作動詞。"],
    ["tense", "現在完了の基本形は？", ["haveまたはhas + 過去分詞", "be + 現在分詞", "did + 原形", "will + 原形"], "haveまたはhas + 過去分詞", "現在完了はhaveまたはhas + 過去分詞で作り、過去の出来事を現在につなげる。"],
    ["modal", "must notが表す基本的な意味は？", ["〜してはいけない", "〜する必要はない", "〜したかもしれない", "以前は〜した"], "〜してはいけない", "must notは強い禁止を表す。必要がないという意味のdo not have toとは区別する。"],
    ["modal", "do not have toが表す基本的な意味は？", ["〜する必要はない", "〜してはいけない", "〜したにちがいない", "〜することに慣れている"], "〜する必要はない", "do not have toは義務・必要の否定であり、行為を禁止するmust notとは意味が異なる。"],
    ["passive", "受動態で時制と主語との一致を表す部分は？", ["be動詞", "過去分詞", "by + 行為者", "目的語"], "be動詞", "受動態ではis used、was used、will be usedのように、be動詞の形で時制と主語との一致を表す。"],
    ["passive", "助動詞を含む受動態の基本形は？", ["助動詞 + be + 過去分詞", "助動詞 + have + 原形", "助動詞 + being + 原形", "助動詞 + 過去形"], "助動詞 + be + 過去分詞", "can be usedやmust be finishedのように、助動詞の後ろへbe + 過去分詞を置く。"],
    ["infinitive", "名詞を後ろから説明する不定詞の用法は？", ["形容詞的用法", "名詞的用法", "副詞的用法", "進行形"], "形容詞的用法", "a book to readのto readのように、直前の名詞を説明する不定詞は形容詞的用法。"],
    ["infinitive", "「〜するために」という目的を表す不定詞の用法は？", ["副詞的用法", "名詞的用法", "形容詞的用法", "受動態"], "副詞的用法", "I went there to study.のto studyは、wentの目的を説明する副詞的用法。"],
    ["gerund", "前置詞の後ろに動詞の内容を置くときの基本形は？", ["動名詞-ing", "動詞の原形", "過去形", "to不定詞"], "動名詞-ing", "前置詞の後ろには名詞相当の語を置くため、動詞なら-ing形の動名詞にする。"],
    ["gerund", "enjoyの目的語に動詞を置くときの形は？", ["-ing形", "to + 原形", "過去形", "原形"], "-ing形", "enjoyは目的語に動名詞を取る。enjoy readingの形にし、enjoy to readとはしない。"],
    ["participle", "名詞が動作をする側であるとき、名詞を修飾する基本の分詞は？", ["現在分詞", "過去分詞", "不定詞", "動名詞"], "現在分詞", "a sleeping babyのように、修飾される名詞が動作をする側なら現在分詞を用いる。"],
    ["participle", "名詞が動作を受ける側であるとき、名詞を修飾する基本の分詞は？", ["過去分詞", "現在分詞", "動詞の原形", "動名詞"], "過去分詞", "a broken windowのように、修飾される名詞が動作を受ける側なら過去分詞を用いる。"],
    ["comparison", "not as + 原級 + asが表す意味は？", ["〜ほど…ではない", "〜よりも…だ", "最も…だ", "あまりに…なので"], "〜ほど…ではない", "not as ... asは二者が同程度ではないことを表し、「〜ほど…ではない」と訳す。"],
    ["comparison", "goodの比較級と最上級の組み合わせは？", ["better / best", "gooder / goodest", "more good / most good", "well / better"], "better / best", "goodは不規則変化し、比較級better、最上級bestとなる。"],
    ["relative", "関係代名詞whatの特徴は？", ["先行詞を意味に含む", "人だけを先行詞にする", "場所だけを表す", "必ず前置詞を伴う"], "先行詞を意味に含む", "whatはthe thing whichに相当し、「〜すること・もの」という先行詞の意味を内部に含む。"],
    ["relative", "場所を表す先行詞を説明し、節の中で副詞として働く関係詞は？", ["where", "who", "which", "what"], "where", "whereは場所を表す先行詞を受ける関係副詞。後ろには主語・動詞を備えた節が続く。"],
    ["conjunction", "becauseの直後に置く基本的な形は？", ["主語 + 動詞を含む節", "名詞句だけ", "動詞の原形だけ", "前置詞だけ"], "主語 + 動詞を含む節", "becauseは接続詞なので、because it rainedのように主語 + 動詞を含む節を導く。"],
    ["conjunction", "時・条件を表す副詞節で未来のことを述べるとき、基本的に用いる時制は？", ["現在形", "will + 原形", "過去完了", "未来完了"], "現在形", "whenやifが導く時・条件の副詞節では、未来の内容でも現在形で表す。"],
    ["subjunctive", "現在の事実に反する仮定を表す仮定法過去の条件節の基本形は？", ["If + 過去形", "If + 現在形", "If + had + 過去分詞", "If + will + 原形"], "If + 過去形", "現在の反実仮想では時制を一段過去へずらし、If + 過去形を用いる。"],
    ["subjunctive", "過去の事実への後悔を表すI wishの後ろの基本形は？", ["had + 過去分詞", "現在形", "will + 原形", "to + 原形"], "had + 過去分詞", "過去に実現しなかったことへの後悔は、I wish + had + 過去分詞で表す。"],
    ["nouns", "adviceの数え方として正しいものは？", ["a piece of advice", "an advice", "two advices", "many advice"], "a piece of advice", "adviceは通常不可算名詞。数えるときはa piece of adviceなどの単位表現を用いる。"],
    ["adverb", "lookやseemの後ろで主語の状態を説明するとき、基本的に用いる品詞は？", ["形容詞", "副詞", "接続詞", "前置詞"], "形容詞", "look happyやseem tiredのように、主語を説明する補語には形容詞を置く。"],
    ["preposition", "完了の期限「〜までに」を表す基本的な前置詞は？", ["by", "until", "during", "from"], "by", "byは期限までのどこかで完了することを表す。untilはその時点までの継続を表す。"],
    ["negation", "間接疑問文の疑問詞の後ろに続く基本語順は？", ["主語 + 動詞", "助動詞 + 主語", "動詞 + 主語", "疑問詞 + 疑問詞"], "主語 + 動詞", "間接疑問ではwhere he livesのように、疑問詞の後ろを平叙文の語順にする。"]
  ].map(([domain, stem, choices, answer, explanation], index) => {
    const id = `q${index + 1}`;
    const patch = QUESTION_PATCHES[id] || {};
    const question = { id, domain, stem, choices, answer, explanation, ...patch };
    const meta = QUESTION_META[id] || {};
    const skill = meta.skill || "knowledge";
    return {
      ...question,
      skill,
      target: meta.target || DOMAIN_TARGETS[domain],
      priority: meta.priority || (skill === "knowledge" ? "support" : "core"),
      misconceptions: { ...defaultMisconceptions(question), ...(meta.misconceptions || {}), ...(patch.misconceptions || {}) }
    };
  })
};
