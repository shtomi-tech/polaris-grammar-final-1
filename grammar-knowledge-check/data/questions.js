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
  adverb: "修飾先から形容詞・副詞の形と位置を選ぶ力",
  negation: "be動詞・do・助動詞の使い分けと語順で否定文・疑問文を組み立てる力"
};

const DOMAIN_REVIEW_HINTS = {
  foundation: "語数だけでなく、主語と述語動詞の有無、文中での働きを確認する。",
  pattern: "動詞の直後に目的語・補語のどちらが必要かを、文の要素で確かめる。",
  verb_form: "主語・時制・助動詞の有無を順に確認し、動詞の形を一つに絞る。",
  tense: "時を表す語と、出来事が基準時より前・同時・後のどこにあるかを確認する。",
  modal: "助動詞の後ろは原形であることと、肯定・否定で生じる意味の違いを確認する。",
  passive: "主語が動作をする側か受ける側かを見て、be動詞と過去分詞の組を確認する。",
  infinitive: "to + 原形が文中で名詞・形容詞・副詞のどの働きをしているかを確認する。",
  gerund: "空所が名詞の位置か、前置詞や動名詞を目的語に取る動詞の後ろかを確認する。",
  participle: "修飾される名詞が動作をする側か受ける側かを確認し、-ingと過去分詞を分ける。",
  comparison: "比較する二者と程度を確認し、原級・比較級・最上級の形を対応させる。",
  relative: "先行詞が人か物か、関係詞節の中で主語・目的語・副詞のどれが欠けているかを確認する。",
  conjunction: "空所の後ろが節か名詞句か、前後が理由・譲歩・条件のどの関係かを確認する。",
  subjunctive: "反実の内容が現在か過去かを確認し、条件節と主節の時制を対応させる。",
  nouns: "名詞が可算か不可算か、特定されているか、文中でどの格が必要かを確認する。",
  adverb: "修飾される語が名詞か動詞か、空所が補語か修飾語かを確認する。",
  negation: "述語がbe動詞・一般動詞・助動詞のどれかを確認し、疑問文でも後続動詞を原形にする。"
};

function questionIdRange(first, last) {
  return Array.from({ length: last - first + 1 }, (_, index) => `q${first + index}`);
}

const LEARNING_STAGES = [
  { label: "品詞と文の骨組み", questionIds: ["q1", ...questionIdRange(3, 8), "q121", ...questionIdRange(9, 29), "q2"] },
  { label: "動詞の形と時制", questionIds: [...questionIdRange(30, 37), "q122", ...questionIdRange(38, 55), ...questionIdRange(123, 125)] },
  { label: "助動詞・受動態と準動詞", questionIds: [...questionIdRange(57, 60), "q56", ...questionIdRange(61, 67), "q130", ...questionIdRange(68, 75), "q126", "q77", "q76", ...questionIdRange(78, 80), ...questionIdRange(127, 129)] },
  { label: "準動詞と文のつなぎ方", questionIds: [...questionIdRange(131, 135), ...questionIdRange(82, 88), "q81", ...questionIdRange(89, 95), "q137", "q136", ...questionIdRange(96, 103)] },
  { label: "比較・仮定法と仕上げ", questionIds: [...questionIdRange(104, 109), "q138", "q142", ...questionIdRange(112, 115), "q149", "q150", "q111", ...questionIdRange(116, 120), "q143", ...questionIdRange(139, 141), "q144", "q145", "q110", "q146", "q147", "q148"] }
];

function defaultMisconceptions(question) {
  return Object.fromEntries(question.choices
    .filter(choice => choice !== question.answer)
    .map(choice => [choice, `「${choice}」と判断している。正答の「${question.answer}」と比べ、${DOMAIN_REVIEW_HINTS[question.domain]}`]));
}

window.GRAMMAR_CHECK_DATA = {
  title: "英文法 基礎知識チェック",
  learningStages: LEARNING_STAGES,
  questionOrder: LEARNING_STAGES.flatMap(stage => stage.questionIds),
  domains: [
    { id: "foundation", label: "品詞・句・節・文の要素", order: 1, rule: "文法用語は、英文を読むための座標です。まず「何が」「どこで」働いているかを分けます。", points: ["単語は一つの語として品詞上の働きをもつ単位。句は二語以上で主語＋述語動詞を含まないまとまり。節は主語＋述語動詞を含むまとまり。", "主語(S)・動詞(V)・目的語(O)・補語(C)は文の骨組み。修飾語(M)は骨組みに情報を足す。", "名詞は人・物・事柄、形容詞は名詞を、 副詞は動詞・形容詞・副詞・文全体を修飾する。"], examples: ["book は単語、in the room は句、because he was tired は節。", "She gave me a book. は S + V + O + O。"], traps: ["語数だけでなく、主語＋述語動詞の有無を見て句と節を分ける。"] },
    { id: "pattern", label: "文型・自他動詞", order: 2, rule: "文型は「動詞の後ろに何を必要とするか」を見る道具です。訳語から決めません。", points: ["SVC の C は S を説明する。SVO の O は動作の対象。", "SVOO は『人に物を与える』型、SVOC の C は O を説明する。", "自動詞は目的語を直接取らず、他動詞は目的語を取る。"], examples: ["She is kind. / He became a teacher. は SVC。They made him happy. は SVOC。", "listen は listen to music のように前置詞を要する自動詞。"], traps: ["日本語で『〜を』と訳せても、英語で他動詞とは限らない。"] },
    { id: "verb_form", label: "動詞の形・主語との一致", order: 3, rule: "時制・主語・助動詞の三つを先に確認すると、動詞の形はかなり絞れます。", points: ["三人称単数・現在の一般動詞には -s / -es。規則動詞の過去形は -ed。", "do / does / did の後、助動詞の後、to の後は動詞の原形。", "be 動詞は主語と時制に合わせて選ぶ。There is / are は後ろの名詞に合わせる。"], examples: ["He plays tennis. / He played tennis yesterday.", "There are two cats under the table."], traps: ["does の s と動詞の s を二重にしない。"] },
    { id: "tense", label: "時制・完了形・進行形", order: 4, rule: "時制は出来事を時間軸に置くための仕組みです。単なる日本語訳で選ばず、基準時との前後関係を見ます。", points: ["現在形は習慣・不変の事実。今進行中の動作は現在進行形。", "will + 原形 / be going to + 原形で未来を表す。", "was / were + -ing は、過去のある時点で進行中だった動作を表す。", "現在完了 have + p.p. は『過去から今へ』をつなぐ。継続・経験・完了／結果を文脈で分ける。"], examples: ["I will call you tonight. / It is going to rain.", "When you called, I was making dinner.", "I have lived here for five years. は継続、three times なら経験。", "I have lost my key. は完了・結果。"], traps: ["yesterday など明確な過去時点があれば、通常は現在完了を使わない。"] },
    { id: "modal", label: "助動詞", order: 5, rule: "助動詞は話し手の判断を加え、後ろの動詞を原形にします。", points: ["can / may / must / should / will の後ろは原形。", "must not は『してはいけない』、do not have to は『〜する必要はない』。", "used to do は過去の習慣・状態を表す。"], examples: ["You must not swim here. / You don't have to hurry.", "I used to play soccer."], traps: ["must not は『してはいけない』で、have to の否定とは意味が違う。"] },
    { id: "passive", label: "受動態", order: 6, rule: "受動態は『受ける側』を主語にし、be + 過去分詞で作ります。", points: ["時制は be 動詞に表す。", "行為者を示す必要があるときは by 〜 を付ける。", "SVOO は物を主語にする場合、通常 to / for が必要。", "be interested in のように、by 以外の前置詞を伴う受動表現も多い。"], examples: ["The window was broken by the boy.", "A book was given to me."], traps: ["過去分詞だけでは受動態にならない。be 動詞との組で考える。"] },
    { id: "infinitive", label: "不定詞", order: 7, rule: "to + 動詞の原形は、文中で名詞・形容詞・副詞のように働きます。", points: ["名詞的用法＝『〜すること』。主語・目的語・補語になる。", "want / decide / hope などは目的語に to 不定詞を取る。", "tell / ask / want + 人 + to do は『人に〜するように言う・頼む』。", "形容詞的用法は名詞を後ろから修飾し、副詞的用法は目的などを表す。"], examples: ["To read is fun. / I want to be a doctor.", "My mother told me to clean my room.", "a book to read / went there to study"], traps: ["『主語・目的語・補語』は名詞的用法の位置であり、3用法そのものではない。"] },
    { id: "gerund", label: "動名詞", order: 8, rule: "動名詞は動詞の -ing 形を名詞として使う形です。", points: ["動名詞は主語・目的語・補語になる。", "前置詞の後ろは名詞相当なので、動詞なら -ing 形にする。", "enjoy / finish などは目的語に動名詞を取る。"], examples: ["Reading books is useful.", "Thank you for helping me. / She is good at drawing."], traps: ["to が前置詞なら、その後ろも -ing。be used to -ing が代表。"] },
    { id: "participle", label: "分詞・分詞構文", order: 9, rule: "分詞は動詞由来の形容詞です。修飾される名詞との能動・受動関係で選びます。", points: ["現在分詞は『〜している・〜させる』、過去分詞は『〜された・〜している』。", "二語以上の分詞のまとまりは、名詞を後ろから修飾する。", "exciting は物事が人を興奮させる、excited は人が興奮している。", "分詞構文の意味上の主語は主節の主語と一致するのが原則。"], examples: ["a sleeping baby / a broken window", "the boy playing tennis / a book written by a famous writer", "Feeling tired, I went home."], traps: ["分詞構文の主語が主節の主語とずれる『ぶら下がり分詞』に注意。"] },
    { id: "comparison", label: "比較", order: 10, rule: "比較は、何と何を比べ、どの程度かを形で示します。", points: ["as + 原級 + as は同程度。not as / so ... as は『〜ほど…でない』。", "短い語は -er / -est、長い語は more / most で比較級・最上級を作る。", "比較級には than、最上級には範囲を示す in / of を伴いやすい。", "the + 比較級 ..., the + 比較級 ... は『〜すればするほど』。"], examples: ["This book is as useful as that one.", "The more you read, the more you learn."], traps: ["more easier のように比較級を重ねない。"] },
    { id: "relative", label: "関係詞", order: 11, rule: "関係詞は二つの内容をつなぎ、前の名詞を説明します。まず先行詞と、節内で欠ける要素を探します。", points: ["who / which / that は先行詞を持つ。who は人、which は物。", "目的格の関係代名詞は省略でき、名詞 + S + V の並びになる。", "what は『〜すること／もの』で、先行詞を含む。", "where / when / why は場所・時・理由を表す関係副詞。"], examples: ["The book (which) I bought is new.", "What he said was true."], traps: ["what の前に the thing を重ねない。what 自体に先行詞の意味が含まれる。"] },
    { id: "conjunction", label: "接続詞・節", order: 12, rule: "接続詞は節と節をつなぎ、節どうしの関係を示します。", points: ["that は『〜ということ』の名詞節を作り、think / know などの目的語になる。", "because の後ろは節、because of の後ろは名詞句。", "whether / if は『〜かどうか』の名詞節を作る。", "時・条件を表す副詞節では、未来のことでも現在形を使う。"], examples: ["I think that he is right.", "I stayed home because it was raining.", "I will call you when I arrive."], traps: ["if は『もし〜なら』の条件節と『〜かどうか』の名詞節を区別する。"] },
    { id: "subjunctive", label: "仮定法", order: 13, rule: "仮定法は現実と距離のあることを、時制を一段ずらして表します。", points: ["仮定法過去：If + 過去形, would + 原形。現在の事実に反する仮定。", "仮定法過去完了：If + had + p.p., would have + p.p.。過去の事実に反する仮定。", "I wish の後ろも、現在の願望なら過去形、過去の後悔なら過去完了。"], examples: ["If I were rich, I would travel.", "If I had studied, I would have passed."], traps: ["仮定法過去は『過去について』ではなく、現在の反実仮想を表せる。"] },
    { id: "nouns", label: "名詞・冠詞・代名詞", order: 14, rule: "名詞は数えられるか、特定されるか、文中でどの格かを確認します。", points: ["可算名詞の単数には原則 a / an / the / this などの限定詞が必要。", "初めて話題に出す物には a / an、既に出た特定の物には the。", "不可算名詞は原則複数形にせず、a piece of などで数える。", "主格 I / he、所有格 my / his、目的格 me / him を位置で使い分ける。", "many は可算複数、much は不可算。"], examples: ["I bought a book. The book was interesting.", "I need some information.", "She gave me her notebook."], traps: ["advice, furniture, information は通常不可算。a advice にはしない。"] },
    { id: "adverb", label: "形容詞・副詞", order: 15, rule: "形容詞は名詞・補語を、副詞は動詞・形容詞・副詞・文全体を修飾します。", points: ["be動詞や look / become などの補語には形容詞を置く。", "always / usually などの頻度の副詞は、一般動詞の前・be動詞の後に置く。", "friendly / lively のように -ly でも形容詞の語がある。"], examples: ["She looks happy.", "He always gets up early. / She is always kind."], traps: ["形容詞に機械的に -ly を付ければ副詞、とは限らない。"] },
    { id: "negation", label: "否定文・疑問文・間接疑問", order: 16, rule: "否定文・疑問文は、be動詞・助動詞・do の使い分けと語順で組み立てます。", points: ["一般動詞の否定文・疑問文は do / does / did を使い、後ろの動詞は原形にする。", "be動詞・助動詞の文は、be動詞・助動詞を主語の前に出して疑問文にする。", "間接疑問は疑問詞 + 主語 + 動詞の平叙文語順。"], examples: ["He doesn't play tennis. / Does he play tennis?", "Is he a student? / Can you swim?", "Do you know where he lives?"], traps: ["間接疑問で do you know where does he live? とはしない。"] }
  ],
  questions: [
    // ---- STAGE 1 品詞と文の骨組み（q1-q29）----
    // 品詞・句・節・文の要素
    ["foundation", "「品詞」の説明として正しいものは？", ["単語を文中での働きによって分類したもの", "単語を文字数によって分類したもの", "単語を発音によって分類したもの", "文を長さによって分類したもの"], "単語を文中での働きによって分類したもの", "名詞・動詞・形容詞・副詞などの品詞は、単語が文の中でどんな働きをするかによる分類。同じ単語でも働きが変われば品詞も変わる。"],
    ["conjunction", "There is ___ that regular practice improves performance. に入る語句は？", ["no doubt", "not doubt", "no doubting", "any doubts"], "no doubt", "There is no doubt that + 文で『〜ということは疑いない』を表す。thatの後ろには主語＋動詞を備えた節を置く。"],
    ["foundation", "英文法で「句」と呼ぶまとまりの説明として正しいものは？", ["一つの語として品詞上の働きをもつ単位", "二語以上で主語＋述語動詞を含まないまとまり", "主語＋述語動詞を含むまとまり", "必ずピリオドで終わる文全体"], "二語以上で主語＋述語動詞を含まないまとまり", "in the roomやto read a bookのように、二語以上が一つの品詞のように働き、主語＋述語動詞を含まないまとまりを句という。"],
    ["foundation", "英文法で「節」と呼ぶまとまりの説明として正しいものは？", ["一つの語として品詞上の働きをもつ単位", "二語以上で主語＋述語動詞を含まないまとまり", "主語＋述語動詞を含むまとまり", "必ずピリオドで終わる文全体"], "主語＋述語動詞を含むまとまり", "because he was tiredのhe wasのように、主語と述語動詞を含む語のまとまりを節という。節は文の一部としても働く。"],
    ["foundation", "in the room は何か。", ["単語", "句", "節", "文型"], "句", "in the room は二語以上のまとまりだが、主語と述語動詞を含まないため句。文の中で場所を表す修飾語として働く。", { "節": "まとまりの中に主語・述語動詞があるかを確認していない。", "単語": "二語以上のまとまりであることを見ていない。", "文型": "まとまりの種類と文型を混同している。" }],
    ["foundation", "She is a doctor. の a doctor の文の要素は？", ["主語（S）", "目的語（O）", "補語（C）", "修飾語（M）"], "補語（C）", "a doctor は主語 She が何者かを説明し、She = a doctor の関係を作るため補語C。be動詞は目的語を取らない。", { "主語（S）": "文の主語は動詞isの前にあるShe。a doctorはSheを説明する側である。", "目的語（O）": "be動詞の後ろの名詞を目的語と考えている。She = a doctor が成り立つため、a doctorは補語C。", "修飾語（M）": "a doctorは取り除ける付加情報ではなく、主語の内容を完成させる補語である。" }],
    ["foundation", "She gave me a book. の me の文の要素は？", ["主語", "補語", "目的語", "修飾語"], "目的語", "give は『人に物を与える』SVOO型で、me と a book はどちらも目的語。"],
    ["foundation", "修飾語（M）の説明として正しいものは？", ["文の骨組みに時・場所・様子などの情報を付け加える", "必ず文の主語になる", "動詞の代わりに述語になる", "どの文にも必ず一つ以上必要である"], "文の骨組みに時・場所・様子などの情報を付け加える", "S・V・O・Cが文の骨組みで、修飾語Mはそこに情報を足す。Mを取り除いても文としては成立する。"],
    // 名詞・冠詞・代名詞
    ["nouns", "How ___ information do you need? に入る語は？", ["many", "much", "few", "a few"], "much", "informationは数えられない名詞なのでmuchを使う。manyと(a) fewは数えられる名詞の複数形に使う。", { "many": "informationを数えられる名詞として扱っている。manyはmany booksのように可算名詞の複数形に使う。", "few": "fewは可算名詞の複数形に使い、『ほとんどない』を表す。informationには使えない。", "a few": "a fewは可算名詞の複数形に使い、『少しはある』を表す。informationには使えない。" }],
    ["nouns", "He is ___ honest student. に入る冠詞は？", ["a", "an", "the", "冠詞なし"], "an", "aとanは直後の文字ではなく音で選ぶ。honestはhを発音せず母音で始まるためan honest studentとなる。", { "a": "honestのつづりのhだけを見ている。hは発音せず母音で始まるためanを使う。", "the": "文脈で特定されていない一人の生徒にtheを使っている。ここでは不特定の一人を表すanが必要。", "冠詞なし": "studentは単数の可算名詞なので、この文では冠詞などの限定詞が必要。" }],
    ["nouns", "I bought a book yesterday. ___ book was interesting. に入る語は？", ["A", "The", "An", "Some"], "The", "初めて話題に出すときは a book、二度目からは『その本』と特定できるので the book。", { "A": "初出の a / an と、既に話題に出た特定の物を指す the を混同している。" }],
    ["nouns", "information の扱いとして正しいものは？", ["可算名詞なので an information とする", "不可算名詞なので some information とする", "複数形 informations が普通", "動詞なので冠詞を付けない"], "不可算名詞なので some information とする", "information は通常不可算。数えるなら a piece of information。"],
    ["nouns", "She gave ___ a present. に入る語は？", ["I", "my", "me", "mine"], "me", "gave の直後は目的語なので目的格 me。主格 I は主語の位置、所有格 my は名詞の前に置く。"],
    ["nouns", "I bought a watch, but I lost ___ soon. に入る語は？", ["it", "one", "this", "mine"], "it", "前に出た特定の物（買ったその時計）そのものを受けるのは it。one は同じ種類の別の一つを指す。", { "one": "特定の物そのものを受ける it と、同種の別の一つを指す one を混同している。" }],
    ["nouns", "This notebook is not mine. Is it ___? に入る語は？", ["you", "your", "yours", "yourself"], "yours", "空所の後ろに名詞がなく、『あなたのもの』という意味を単独で表すため所有代名詞yoursを使う。yourは後ろに名詞が必要。", { "you": "主格・目的格のyouを所有の意味で使っている。ここでは『あなたのもの』を表す所有代名詞が必要。", "your": "所有格yourを単独で使っている。yourはyour notebookのように後ろに名詞を置く。", "yourself": "再帰代名詞yourselfと、所有を表すyoursを混同している。" }],
    // 形容詞・副詞
    ["adverb", "形容詞の基本的な働きとして正しいものは？", ["名詞を修飾し、補語として主語や目的語を説明する", "動詞・形容詞・副詞だけを修飾する", "主語の動作や時制を表す", "語と語や節と節を結ぶ"], "名詞を修飾し、補語として主語や目的語を説明する", "形容詞は名詞を修飾するほか、be動詞やlookなどの後ろで補語となり、主語や目的語の性質・状態を説明する。"],
    ["adverb", "I haven't seen Yuna ___. に入る語は？", ["lately", "late", "latest", "later"], "lately", "latelyは『最近』という副詞で、現在完了とよく使う。lateは『遅く・遅い』であり、意味が異なる。", { "late": "形が似ているlateとlatelyを同じ意味だと考えている。" }],
    ["adverb", "She looks ___. に最も合う形は？", ["happily", "happy", "happiness", "happierly"], "happy", "look は主語の状態を説明する補語を取るので形容詞 happy。副詞 happily は補語になれない。", { "happily": "look の後ろが補語であることを見ず、動詞の後ろだから副詞と考えている。" }],
    ["adverb", "She sings very ___. に最も合う語は？", ["good", "well", "best", "goodness"], "well", "動詞 sings を修飾するのは副詞 well。good は形容詞なので動詞を修飾できない。"],
    ["adverb", "always などの頻度を表す副詞の基本の位置は？", ["一般動詞の前、be動詞の後", "必ず文頭", "必ず文末", "名詞の直前"], "一般動詞の前、be動詞の後", "He always gets up early. / She is always kind. のように、頻度の副詞は一般動詞の前・be動詞や助動詞の後に置くのが基本。"],
    // 文型・自他動詞
    ["pattern", "自動詞の説明として正しいものは？", ["必ず受動態にできる動詞", "目的語を直接取らない動詞", "必ずbe動詞を伴う動詞", "過去形にならない動詞"], "目的語を直接取らない動詞", "arrive, sleep, listen などは目的語を直接取らない。listen to のように前置詞を伴うことはある。"],
    ["pattern", "他動詞の基本的な特徴は？", ["目的語を直接取る", "必ず前置詞を伴う", "補語だけを取る", "受動態にできない"], "目的語を直接取る", "他動詞は動作の対象となる目的語Oを直接取る。前置詞を介する場合は、その動詞自体は目的語を直接取っていない。"],
    ["foundation", "There is ___ with this printer; it stops every few minutes. に入る語句は？", ["something wrong", "wrong something", "anything wrong", "wrong anything"], "something wrong", "somethingなど-thingで終わる不定代名詞を形容詞で説明するとき、形容詞は後ろに置く。something wrongで『何かおかしいところ』。"],
    ["pattern", "She is kind. の文型は？", ["SV", "SVC", "SVO", "SVOC"], "SVC", "kind は主語 She の性質を説明する補語C。be 動詞の後ろはSVCになりやすい。"],
    ["adverb", "相手に『何時が都合よいですか』と尋ねる自然な英文は？", ["What time is convenient for you?", "What time are you convenient?", "When do you convenient?", "Which time conveniently you?"], "What time is convenient for you?", "convenientは時・場所・物事を主語にして『人にとって都合がよい』と表す。人を主語にしてYou are convenientとはしない。", { "What time are you convenient?": "日本語の『あなたは都合がよい』に引かれ、人をconvenientの主語にしている。" }],
    ["pattern", "She opened the window. の文型は？", ["SV", "SVC", "SVO", "SVOC"], "SVO", "She がS、opened がV、the window が動作の対象O。したがってSVO。"],
    ["pattern", "I gave my sister a present. の文型は？", ["SVC", "SVO", "SVOO", "SVOC"], "SVOO", "my sister と a present の二つの目的語を取る第4文型。『人に物を与える』型の動詞に多い。"],
    ["pattern", "They made him happy. の文型は？", ["SVC", "SVO", "SVOO", "SVOC"], "SVOC", "him が目的語O、happy が him の状態を説明する補語C。O = C（him = happy）の関係が成り立つためSVOC。"],
    ["pattern", "We listened to the teacher carefully. で、teacher の前に to が必要な理由は？", ["listenは目的語を直接取らない自動詞だから", "listenは必ず受動態になる動詞だから", "teacherが文の主語だから", "carefullyが名詞を修飾する形容詞だから"], "listenは目的語を直接取らない自動詞だから", "listenは目的語を直接取らない自動詞なので、聞く対象はlisten to + 名詞で表す。carefullyはlistenedを修飾する副詞。", { "listenは必ず受動態になる動詞だから": "前置詞toを受動態の印と考えている。この文はWeを主語とする能動態である。", "teacherが文の主語だから": "文の主語は動詞listenedの前にあるWe。the teacherは前置詞toの目的語である。", "carefullyが名詞を修飾する形容詞だから": "carefullyは副詞で、動詞listenedの様子を説明する。toが必要な理由とは関係しない。" }],
    // ---- STAGE 2 動詞の形と時制（q30-q55）----
    // 動詞の形・主語との一致
    ["verb_form", "Each of the students ___ a notebook. に入る形は？", ["have", "has", "having", "to have"], "has", "主語の中心は複数形studentsではなくEach。eachは単数として扱うため、現在形の動詞はhasになる。", { "have": "空所の直前にあるstudentsに動詞を一致させている。主語の中心Eachは単数なのでhas。", "having": "文を成立させる述語動詞が必要な位置に-ing形を置いている。", "to have": "文を成立させる述語動詞が必要な位置にto不定詞を置いている。" }],
    ["verb_form", "Two hours ___ enough to finish this task. に入る形は？", ["is", "are", "be", "have"], "is", "時間・距離・金額などを一つのまとまりとして見ると、形が複数でも単数扱いにする。Two hours全体を一つの所要時間と考えるのでis。", { "are": "hoursの複数形だけを見て、時間全体が一つのまとまりであることを確認していない。" }],
    ["verb_form", "He ___ tennis every Sunday. に入る形は？", ["play", "plays", "playing", "to play"], "plays", "He は三人称単数、every Sunday は現在の習慣なので一般動詞にsを付ける。"],
    ["verb_form", "一般動詞（規則変化）の過去形の作り方は？", ["原形に-edを付ける", "原形に-sを付ける", "原形に-ingを付ける", "前にbeを置く"], "原形に-edを付ける", "played, watchedのように規則動詞は原形 + -ed。go → wentのような不規則動詞は個別に覚える。"],
    ["verb_form", "Does she ___ English? に入る形は？", ["speaks", "spoke", "speak", "speaking"], "speak", "does が時制・三単現の情報を持つため、後ろの動詞は原形。does と動詞の s を二重にしない。", { "speaks": "does がすでに三単現の情報を持っていることを見ず、s を二重に付けている。" }],
    ["verb_form", "助動詞 can の直後に置く動詞の形は？", ["原形", "三単現のs形", "過去形", "-ing形"], "原形", "助動詞の後ろは例外なく原形。can swims にはしない。"],
    ["verb_form", "They ___ busy yesterday. に入る形は？", ["are", "is", "was", "were"], "were", "主語 They は複数で、yesterday があるので過去。複数・過去のbe動詞は were。"],
    ["verb_form", "There ___ two cats under the table. に入る形は？", ["is", "are", "be", "been"], "are", "There is / are 構文では、後ろの名詞が主語の扱い。two cats は複数なので are。", { "is": "There の後ろの名詞（本当の主語）の単複を確認していない。" }],
    // 否定文・疑問文
    ["negation", "be動詞の文を疑問文にする方法として正しいものは？", ["be動詞を主語の前に出す", "文頭にDoを置く", "動詞を-ing形にする", "文末にnotを置く"], "be動詞を主語の前に出す", "He is a student. → Is he a student? のように、be動詞の文はbe動詞を主語の前に出す。Doを使うのは一般動詞の文。", { "文頭にDoを置く": "be動詞の文と一般動詞の文の疑問文の作り方を混同している。" }],
    ["negation", "___ he play soccer? に入る語は？", ["Does", "Is", "Do", "Are"], "Does", "play は一般動詞なので疑問文は do / does を使う。主語 he は三人称単数なので Does。", { "Is": "be動詞の文と一般動詞の文の疑問文の作り方を混同している。", "Do": "主語 he が三人称単数であることを見ていない。", "Are": "be動詞の文と一般動詞の文の疑問文の作り方を混同している。" }],
    ["negation", "He ___ like coffee.（彼はコーヒーが好きではない）に入る語は？", ["doesn't", "isn't", "don't", "not"], "doesn't", "一般動詞の否定文は don't / doesn't + 原形。主語 He は三人称単数なので doesn't like。", { "isn't": "be動詞の文と一般動詞の文の否定文の作り方を混同している。", "don't": "主語 He が三人称単数であることを見ていない。", "not": "一般動詞の否定に必要な do / does を落としている。" }],
    ["negation", "She ___ come to school yesterday.（彼女は昨日学校に来なかった）に入る語は？", ["didn't", "doesn't", "wasn't", "don't"], "didn't", "yesterday があるので過去。一般動詞の過去の否定文は didn't + 原形。", { "doesn't": "現在の否定と過去の否定を混同している。", "wasn't": "be動詞の文と一般動詞の文の否定文の作り方を混同している。" }],
    ["negation", "『彼女は昨日何を買いましたか』に合う英文は？", ["What did she buy yesterday?", "What she bought yesterday?", "What did she bought yesterday?", "What was she buy yesterday?"], "What did she buy yesterday?", "過去の一般動詞を使う直接疑問文は、疑問詞 + did + 主語 + 動詞の原形の語順にする。didが過去を表すためbuyは原形。", { "What she bought yesterday?": "疑問詞の後ろを平叙文の語順にしている。直接疑問文ではdidを主語の前に置く。", "What did she bought yesterday?": "didとboughtの両方を過去形にしている。didの後ろは原形buy。", "What was she buy yesterday?": "一般動詞buyの疑問文にbe動詞wasを使っている。過去の一般動詞にはdidを使う。" }],
    // 時制・完了形・進行形
    ["tense", "現在形が最も自然に表すものは？", ["今この瞬間だけの動作", "過去に一度だけ起きた出来事", "習慣・不変の事実", "過去より前の出来事"], "習慣・不変の事実", "現在形は習慣や一般的事実に使う。進行中なら通常は進行形。"],
    ["tense", "現在形と現在進行形の基本的な使い分けとして正しいものは？", ["現在形は習慣、現在進行形は進行中の動作", "現在形は過去、現在進行形は未来", "現在形は受動、現在進行形は能動", "どちらも常に同じ意味"], "現在形は習慣、現在進行形は進行中の動作", "現在形は習慣・一般的事実、現在進行形は今進行中または一時的な動作を表す。"],
    ["tense", "Look! The baby ___ now. に入る形は？", ["cries", "is crying", "cried", "has cried"], "is crying", "Look! と now から、今まさに進行中の動作。現在進行形 be + -ing を使う。", { "cries": "習慣を表す現在形と、今進行中を表す現在進行形を混同している。" }],
    ["tense", "When you called me, I ___ dinner.（電話が来たとき、夕食を作っている最中だった）に入る形は？", ["was making", "am making", "made", "have made"], "was making", "過去のある時点（電話が来たとき）に進行中だった動作は、過去進行形 was / were + -ing で表す。", { "made": "過去の一回の動作と、過去のある時点で進行中だった動作を区別していない。", "am making": "現在進行形と過去進行形の be 動詞の時制を混同している。" }],
    ["tense", "yesterday を伴う文で通常使う時制は？", ["現在完了", "過去形", "未来完了", "現在完了進行形"], "過去形", "yesterday は完結した過去時点を指定するため、通常は過去形。現在完了とは併用しないのが原則。"],
    ["tense", "When I arrived at the theater, the movie ___. に入る形は？", ["had already started", "has already started", "already started", "will already start"], "had already started", "the movieが始まったのは、I arrivedという過去の基準時より前。過去の出来事よりさらに前を表すhad + 過去分詞の過去完了を使う。", { "already started": "二つの過去の出来事の前後関係を示さず、単純過去だけで処理している。", "has already started": "現在を基準にする現在完了を、過去の基準時より前の出来事に使っている。" }],
    ["tense", "Don't worry. I ___ you. に最も合う形は？", ["will help", "helped", "helps", "have helped"], "will help", "これからすることをその場で申し出ているので、未来を表す will + 原形。", { "helped": "これからの動作なのに過去形を選んでいる。" }],
    ["tense", "Look at those dark clouds. It ___ rain soon. に最も合う語句は？", ["is going to", "is going", "will going to", "goes to"], "is going to", "目の前の兆候（黒い雲）から予測する未来は be going to + 原形。", { "will going to": "will と be going to を重ねて使っている。どちらか一方でよい。" }],
    ["tense", "現在完了の基本形は？", ["haveまたはhas + 過去分詞", "be + 現在分詞", "did + 原形", "will + 原形"], "haveまたはhas + 過去分詞", "現在完了はhaveまたはhas + 過去分詞で作り、過去の出来事を現在につなげる。"],
    ["tense", "I have lived here ___ 2020. に入る語は？", ["since", "for", "during", "from"], "since", "2020は継続の始まった時点なのでsinceを使う。forはfor five yearsのように期間の長さを表す。", { "for": "起点2020と期間の長さを混同している。forの後ろにはfive yearsなどの期間を置く。", "during": "duringは特定の期間中に起きたことを表す前置詞で、現在完了の継続の起点にはsinceを使う。", "from": "fromは起点を示せるが、この現在完了の継続ではsince 2020が自然。fromを使うなら終点など別の構造が必要。" }],
    ["tense", "I have lived here for five years. の現在完了の用法は？", ["継続", "経験", "完了・結果", "過去完了"], "継続", "for five yearsが過去から現在まで続く期間を示すため、継続の用法。"],
    ["tense", "I have visited Kyoto three times. の現在完了の用法は？", ["継続", "経験", "完了・結果", "過去完了"], "経験", "three timesが現在までに経験した回数を示すため、経験の用法。"],
    ["tense", "I have lost my key, so I can't open the door. の現在完了の用法は？", ["継続", "経験", "完了・結果", "過去完了"], "完了・結果", "鍵を失った結果が現在も続き、今ドアを開けられないため、完了・結果の用法。", { "継続": "過去から現在まで続く状態と、現在に残る結果を混同している。", "経験": "回数・ever・neverなどで表す経験と、現在に残る結果を混同している。", "過去完了": "現在完了の用法と、過去の基準時より前を表す過去完了を混同している。" }],
    // ---- STAGE 3 助動詞・受動態と準動詞（q56-q80）----
    // 助動詞
    ["modal", "I would rather ___ at home tonight. に入る形は？", ["stay", "to stay", "staying", "stayed"], "stay", "would rather + 動詞の原形で『むしろ〜したい』を表す。wouldは助動詞なので、後ろにtoや-ingを置かない。"],
    ["modal", "助動詞shouldが表す基本的な意味は？", ["助言・軽い義務", "過去の習慣", "強い禁止", "完了した経験"], "助言・軽い義務", "shouldは「〜した方がよい」「〜すべきだ」という助言・軽い義務を表す。"],
    ["modal", "must notが表す基本的な意味は？", ["〜してはいけない", "〜する必要はない", "〜したかもしれない", "以前は〜した"], "〜してはいけない", "must notは強い禁止を表す。必要がないという意味のdo not have toとは区別する。", { "〜する必要はない": "禁止の must not と、必要がないことを表す do not have to を混同している。" }],
    ["modal", "do not have toが表す基本的な意味は？", ["〜する必要はない", "〜してはいけない", "〜したにちがいない", "〜することに慣れている"], "〜する必要はない", "do not have toは義務・必要の否定であり、行為を禁止するmust notとは意味が異なる。", { "〜してはいけない": "必要がないことを表す do not have to と、禁止の must not を混同している。" }],
    ["modal", "used to do の意味は？", ["以前はよく〜した", "〜することに慣れている", "今まさに〜している", "〜する予定である"], "以前はよく〜した", "used to + 原形は過去の習慣・状態。be used to -ing（〜に慣れている）とは別物。", { "〜することに慣れている": "used to do と be used to -ing の形と意味を混同している。" }],
    // 受動態
    ["passive", "受動態の基本形は？", ["be + 過去分詞", "have + 原形", "to + 過去分詞", "do + -ing"], "be + 過去分詞", "受動態の時制はbe動詞に表し、動詞本体は過去分詞にする。"],
    ["passive", "受動態で時制と主語との一致を表す部分は？", ["be動詞", "過去分詞", "by + 行為者", "目的語"], "be動詞", "受動態ではis used、was used、will be usedのように、be動詞の形で時制と主語との一致を表す。"],
    ["passive", "受動態で「〜によって」と行為者を示す語は？", ["by", "from", "of", "at"], "by", "The window was broken by the boy. のように、行為者を示す必要があるときは by 〜 を付ける。示す必要がなければ省略する。"],
    ["passive", "The window ___ by the boy yesterday. に入る形は？", ["broke", "was broken", "is breaking", "has broken"], "was broken", "窓は壊される側なので受動態 be + 過去分詞。yesterday があるので過去形の was broken。", { "broke": "壊される側が主語なのに能動態のまま過去形にしている。" }],
    ["passive", "助動詞を含む受動態の基本形は？", ["助動詞 + be + 過去分詞", "助動詞 + have + 原形", "助動詞 + being + 原形", "助動詞 + 過去形"], "助動詞 + be + 過去分詞", "can be usedやmust be finishedのように、助動詞の後ろへbe + 過去分詞を置く。"],
    ["passive", "My father gave me this book. を物を主語にして受動態にすると？", ["This book was given me by my father.", "This book was given to me by my father.", "This book gave me by my father.", "This book was giving to me by my father."], "This book was given to me by my father.", "物を主語にする第4文型の受動態では、残る人の目的語の前に通常toを置く。"],
    ["passive", "English is spoken in many countries. で、by + 行為者を置かない主な理由は？", ["話す人が一般的で、特定する必要がないから", "English自身が話す動作をするから", "現在形の受動態ではbyを使えないから", "in many countriesが行為者を表すから"], "話す人が一般的で、特定する必要がないから", "受動態のby + 行為者は、誰が行ったかを示す必要があるときに置く。この文では話す人々を特定する必要がないため省略する。", { "English自身が話す動作をするから": "主語Englishは話される側であり、is spokenは受動態。主語が動作をする能動態ではない。", "現在形の受動態ではbyを使えないから": "by + 行為者は時制にかかわらず必要に応じて使える。現在形だから省略されるわけではない。", "in many countriesが行為者を表すから": "in many countriesは話される場所・範囲を表す。行為者を示す語句ではない。" }],
    // 不定詞
    ["infinitive", "不定詞の基本形は？", ["to + 動詞の原形", "to + 動詞の過去形", "to + 動詞の-ing形", "to + 過去分詞"], "to + 動詞の原形", "不定詞は to + 動詞の原形。主語が三人称単数でも to plays とはしない。"],
    ["infinitive", "不定詞の3つの基本用法は？", ["主語的・目的語的・補語的", "名詞的・形容詞的・副詞的", "現在・過去・完了", "能動・受動・進行"], "名詞的・形容詞的・副詞的", "3用法は文中での働き。主語・目的語・補語は名詞的用法が置かれる位置。"],
    ["infinitive", "To read books is fun. の不定詞の用法は？", ["名詞的用法", "形容詞的用法", "副詞的用法", "受動態"], "名詞的用法", "To read books 全体が文の主語で『本を読むこと』を表す。名詞の働きなので名詞的用法。"],
    ["infinitive", "Aya is the last person ___ a secret. に入る形は？", ["to reveal", "revealing", "reveal", "revealed"], "to reveal", "the last person to doは『最も〜しそうにない人』という意味を表せる。personを後ろから説明する形容詞的用法の不定詞。"],
    ["infinitive", "I want ___ a doctor in the future. に入る形は？", ["to be", "being", "be", "been"], "to be", "want は目的語に to 不定詞を取るので want to be。『〜になりたい』は want to be 〜。"],
    ["infinitive", "I have a book to read. の to read の用法は？", ["名詞的用法", "形容詞的用法", "副詞的用法", "動名詞"], "形容詞的用法", "to read が直前の a book を後ろから説明し『読むべき本』となる。名詞を修飾するので形容詞的用法。"],
    ["infinitive", "「〜するために」という目的を表す不定詞の用法は？", ["副詞的用法", "名詞的用法", "形容詞的用法", "受動態"], "副詞的用法", "I went there to study.のto studyは、wentの目的を説明する副詞的用法。"],
    ["infinitive", "My mother told me ___ my room. に入る形は？", ["to clean", "cleaning", "clean", "cleaned"], "to clean", "tell + 人 + to do で『人に〜するように言う』。ask / want も同じ形を取る。", { "cleaning": "tell + 人 + to do の型を見ず、-ing 形を選んでいる。" }],
    // 動名詞
    ["gerund", "I was annoyed by Tom's ___ during the movie. に入る形は？", ["talking", "to talk", "talk", "talked"], "talking", "動名詞の動作主は所有格または目的格で表せる。Tom's talkingで『Tomが話すこと』となり、Tom'sが動名詞talkingの意味上の主語。"],
    ["gerund", "Reading books is useful. の Reading の働きは？", ["動名詞で主語", "現在分詞で補語", "不定詞で目的語", "前置詞"], "動名詞で主語", "-ing形が『本を読むこと』という名詞として文全体の主語になっている。"],
    ["gerund", "Thank you for ___ me. に入る形は？", ["help", "to help", "helping", "helped"], "helping", "for は前置詞。前置詞の後ろに動詞を置くなら動名詞にする。"],
    ["gerund", "enjoyの目的語に動詞を置くときの形は？", ["-ing形", "to + 原形", "過去形", "原形"], "-ing形", "enjoyは目的語に動名詞を取る。enjoy readingの形にし、enjoy to readとはしない。", { "to + 原形": "目的語に to 不定詞を取る want などと、動名詞を取る enjoy などを混同している。" }],
    ["gerund", "She is good at ___ pictures. に入る形は？", ["drawing", "draw", "to draw", "drew"], "drawing", "at は前置詞なので、後ろに動詞を置くなら動名詞 -ing にする。be good at -ing で『〜が得意だ』。"],
    // ---- STAGE 4 準動詞と文のつなぎ方（q81-q103）----
    // 分詞・分詞構文
    ["participle", "窓の外を見ると、子どもが通りを走っているところだった。I saw a child ___ across the street. に入る形は？", ["running", "run", "ran", "to run"], "running", "see + 目的語 + -ingで、目的語が動作している途中の場面を見たことを表す。childが走る側なので現在分詞running。"],
    ["participle", "名詞が動作をする側であるとき、名詞を修飾する基本の分詞は？", ["現在分詞", "過去分詞", "不定詞", "動名詞"], "現在分詞", "a sleeping babyのように、修飾される名詞が動作をする側なら現在分詞を用いる。"],
    ["participle", "a ___ window に最も合うものは？", ["breaking", "broken", "break", "to break"], "broken", "窓は『壊す』側でなく『壊される』側なので過去分詞 broken。", { "breaking": "名詞が動作を受ける側なのに、動作をする側の現在分詞を選んでいる。" }],
    ["participle", "The movie was ___. に最も合うものは？", ["excited", "exciting", "excite", "excitement"], "exciting", "映画が人を興奮させる側なので exciting。感じる側なら excited。", { "excited": "感情を引き起こす側（exciting）と感情を感じる側（excited）を混同している。" }],
    ["participle", "The students were ___ by the lecture. に最も合う語は？", ["excited", "exciting", "excite", "excitement"], "excited", "studentsは興奮を感じる側なので過去分詞由来の形容詞excitedを使う。人を興奮させる側を表すならexciting。", { "exciting": "感情を感じる側（excited）と感情を引き起こす側（exciting）を混同している。" }],
    ["participle", "The boy ___ tennis over there is my brother. に入る形は？", ["playing", "played", "is playing", "plays"], "playing", "playing tennis over there という二語以上のまとまりが、名詞 The boy を後ろから修飾する。少年はテニスをする側なので現在分詞。", { "is playing": "関係代名詞 who がないのに、名詞の直後へ S + V のように動詞を続けている。", "played": "名詞が動作をする側なのに、動作を受ける側の過去分詞を選んでいる。" }],
    ["participle", "This is a book ___ by a famous writer. に入る形は？", ["written", "writing", "wrote", "writes"], "written", "本は書かれる側なので過去分詞 written。written by 〜 のまとまりが a book を後ろから修飾する。", { "writing": "名詞が動作を受ける側なのに、動作をする側の現在分詞を選んでいる。" }],
    ["participle", "Walking to school, I saw an old friend. で、学校へ歩いていたのは誰か。", ["主節の主語 I", "目的語 an old friend", "場所を表す school", "文中では特定できない"], "主節の主語 I", "分詞構文Walking to schoolの意味上の主語は、原則として主節の主語Iと一致する。"],
    // 接続詞・節
    ["conjunction", "The box was so heavy ___ I could not lift it. に入る語は？", ["that", "because", "to", "as"], "that", "so + 形容詞 + that + 文で『とても〜なので…』を表す。heavyの程度と、その結果I could not lift itをthatでつなぐ。"],
    ["conjunction", "I think that he is right. の that の働きは？", ["『〜ということ』のまとまり（名詞節）を作る接続詞", "直前の名詞を修飾する関係代名詞", "理由を表す接続詞", "場所を表す関係副詞"], "『〜ということ』のまとまり（名詞節）を作る接続詞", "that he is right 全体が『彼が正しいということ』という名詞のかたまりで、think の目的語。この that は省略されることも多い。", { "直前の名詞を修飾する関係代名詞": "接続詞の that と関係代名詞の that を混同している。この that の後ろは欠けのない完全な文。" }],
    ["conjunction", "I know ___ she is kind.（彼女が親切だということを知っている）に入る語は？", ["that", "what", "which", "because"], "that", "『〜ということ』という名詞節を作る接続詞 that。know の目的語になっている。", { "what": "先行詞を含む what の後ろは不完全な文。ここは she is kind という完全な文なので that。", "because": "『〜ということ』の名詞節と『〜だから』の理由の節を混同している。" }],
    ["conjunction", "because と because of の後ろに置く形の組み合わせは？", ["because + 節 / because of + 名詞句", "because + 名詞句 / because of + 節", "because + 原形 / because of + 原形", "because + 名詞句 / because of + 名詞句"], "because + 節 / because of + 名詞句", "because it rained のようにbecauseの後ろには節を、because of the rain のようにbecause ofの後ろには名詞句を置く。", { "because + 名詞句 / because of + 節": "becauseとbecause ofの後ろに置く形を逆にしている。becauseには節、because ofには名詞句を続ける。", "because + 原形 / because of + 原形": "接続詞・群前置詞の後ろに動詞の原形を直接置く形だと考えている。becauseには節、because ofには名詞句が必要。", "because + 名詞句 / because of + 名詞句": "becauseも名詞句を取ると考えている。becauseは主語と述語動詞を含む節を導く。" }],
    ["conjunction", "Neither the teacher nor the students ___ ready. に入る形は？", ["were", "was", "is", "be"], "were", "neither A nor Bでは、動詞をBに近い主語に一致させるのが基本。直前のthe studentsが複数なのでwere。全体は『先生も生徒たちも準備ができていなかった』。", { "was": "最初の単数名詞the teacherに一致させ、動詞に近いthe studentsを確認していない。" }],
    ["conjunction", "I don't know ___ he will come. に最も合う語は？", ["whether", "because", "although", "so"], "whether", "『来るかどうか』という名詞節を作る whether。if も使える場面が多い。"],
    ["conjunction", "I will call you when I ___. に入る形は？", ["will arrive", "arrive", "arrived", "have arrived yesterday"], "arrive", "時を表す副詞節では未来のことでも現在形で未来を表す。", { "will arrive": "時・条件の副詞節では未来でも現在形を使う、という原則を見ていない。" }],
    // 関係詞
    ["relative", "関係代名詞の基本的な働きとして正しいものは？", ["直前の名詞を、後ろの節で説明する", "文全体を否定する", "動詞の時制を決める", "感情を強調する"], "直前の名詞を、後ろの節で説明する", "who / which / that は先行詞（直前の名詞）を受け、後ろの節でその名詞を詳しく説明する。"],
    ["relative", "The boy ___ is running is my brother. に入る語は？", ["who", "which", "what", "where"], "who", "先行詞が人（The boy）で、関係詞節内の主語が欠けているため who。"],
    ["relative", "物を先行詞にし、関係詞節内の欠けた要素を補う関係代名詞の組み合わせは？", ["which / that", "who / whom", "where / when", "what / where"], "which / that", "物を先行詞とする関係代名詞にはwhichまたはthatを用いる。whatは先行詞を意味に含むため、直前に先行詞を置かない。"],
    ["relative", "The book ___ I bought yesterday was interesting. に入る語は？", ["which", "who", "what", "where"], "which", "先行詞が物（The book）で、bought の目的語が欠けているため目的格の which（that も可）。", { "who": "先行詞が物なのに、人を受ける who を選んでいる。", "what": "先行詞 The book があるのに、先行詞を含む what を重ねている。", "where": "節内で目的語が欠けているのに、副詞の働きをする関係副詞を選んでいる。" }],
    ["relative", "The book I bought yesterday was interesting. で省略されている語は？", ["目的格の関係代名詞 which", "主格の関係代名詞 who", "接続詞 because", "前置詞 of"], "目的格の関係代名詞 which", "名詞 + S + V（The book + I bought）の並びは、目的格の関係代名詞の省略。主格の関係代名詞は省略できない。", { "主格の関係代名詞 who": "省略できるのは目的格で、主格の関係代名詞は省略できない。" }],
    ["relative", "I have a friend ___ father is a doctor. に入る語は？", ["who", "whose", "which", "where"], "whose", "father の前には、その父が誰のものかを示す所有格の関係詞 whose が必要。先行詞は a friend。", { "who": "人を先行詞にすることだけで who を選び、直後の father との所有関係を見ていない。", "which": "直後の father を先行詞だと誤認している。", "where": "場所を表していないのに関係副詞を選んでいる。" }],
    ["relative", "the town ___ I was born に入る語は？", ["when", "where", "why", "what"], "where", "場所 town を先行詞にして、その場所で生まれたことを表す関係副詞 where。"],
    ["relative", "What he said was true. の What の特徴は？", ["先行詞を含む", "必ず人を指す", "後ろに完全文を置く", "前置詞だけを修飾する"], "先行詞を含む", "what は『〜すること／もの』で、the thing which の意味をまとめて持つ。"],
    // ---- STAGE 5 比較・仮定法と仕上げ（q104-q120）----
    // 比較
    ["comparison", "as + 原級 + as の意味は？", ["〜より…だ", "最も〜だ", "〜と同じくらい…だ", "〜すぎて…できない"], "〜と同じくらい…だ", "同程度を表す原級比較。否定なら not as / so ... as。"],
    ["comparison", "比較級と通常セットで用いる語は？", ["than", "that", "as", "so"], "than", "比較級 + than で比較対象を示す。"],
    ["comparison", "比較級・最上級の基本的な作り方として正しいものは？", ["短い語は-er / -est、長い語はmore / most", "すべての語に-er / -estを付ける", "すべての語にmore / mostを付ける", "動詞の後ろにthanを付けるだけ"], "短い語は-er / -est、長い語はmore / most", "tall → taller / tallest、beautiful → more / most beautiful のように、語の長さで作り方が変わる。"],
    ["comparison", "The weather became ___ as evening approached. に入る形は？", ["colder and colder", "more cold and cold", "coldest and coldest", "as colder as"], "colder and colder", "比較級 and 比較級で『だんだん〜、ますます〜』という変化を表す。coldの比較級colderを繰り返す。"],
    ["comparison", "not as + 原級 + asが表す意味は？", ["〜ほど…ではない", "〜よりも…だ", "最も…だ", "あまりに…なので"], "〜ほど…ではない", "not as ... asは二者が同程度ではないことを表し、「〜ほど…ではない」と訳す。"],
    ["comparison", "The ___ you read, the ___ you learn. に入る組み合わせは？", ["more / more", "most / most", "much / many", "more / most"], "more / more", "the + 比較級 ..., the + 比較級 ... は『〜すればするほど』。"],
    ["negation", "It was so dark that we could ___ see the road. に入る語は？", ["hardly", "hard", "nearly", "clearly"], "hardly", "hardlyは『ほとんど〜ない』という否定の意味をもつ副詞。hard『一生懸命に・激しく』とは意味が異なる。", { "hard": "形が似ているhardとhardlyを同じ意味だと考えている。" }],
    // 仮定法
    ["subjunctive", "I took a taxi; ___, I would have missed the last train. に入る語は？", ["otherwise", "therefore", "moreover", "for example"], "otherwise", "otherwiseは『そうでなければ』を表し、if I had not taken a taxiという条件を代用する。後ろのwould have missedとともに過去の反実仮想を作る。"],
    ["subjunctive", "現在の事実に反する仮定を表す仮定法過去の条件節の基本形は？", ["If + 過去形", "If + 現在形", "If + had + 過去分詞", "If + will + 原形"], "If + 過去形", "現在の反実仮想では時制を一段過去へずらし、If + 過去形を用いる。"],
    ["subjunctive", "If I ___ rich, I would travel around the world. に入る形は？", ["am", "were", "had been", "will be"], "were", "現在の事実に反する仮定は If + 過去形。be動詞は were を使うのが基本。", { "had been": "現在の反実仮想（仮定法過去）と過去の反実仮想（仮定法過去完了）を混同している。" }],
    ["subjunctive", "If I had studied harder, I ___ the exam. に入る形は？", ["would pass", "would have pass", "would have passed", "had passed"], "would have passed", "条件節がhad + 過去分詞なので、過去の事実に反する仮定。主節はwould have + 過去分詞で、過去に起こらなかった結果を表す。", { "would pass": "would + 原形を選び、現在の反実仮想と過去の反実仮想を混同している。過去の結果にはwould have + 過去分詞を使う。", "would have pass": "would haveの後ろを原形にしている。完了形のhaveの後ろには過去分詞passedが必要。", "had passed": "条件節と同じ過去完了を主節にも置いている。主節はwould have + 過去分詞で、起こらなかった結果を表す。" }],
    ["subjunctive", "I wish I ___ taller. に最も合う形は？", ["am", "were", "had been", "will be"], "were", "現在の実現しにくい願望は I wish + 過去形。過去への後悔なら I wish + had + 過去分詞。"],
    // ポラリス頻出の追加確認
    ["subjunctive", "___ you won a scholarship, how would you use it? に入る語は？", ["Suppose", "Unless", "Because", "Despite"], "Suppose", "Suppose + 主語 + 動詞で『もし〜だとしたら』という仮定を置く。後ろのhow would you use it?が、その仮定に対する結果を尋ねている。", { "Unless": "『〜でない限り』という条件と、単純に仮定を置くSupposeを混同している。", "Despite": "despiteの後ろは名詞句で、節を導いて仮定を表す接続表現ではない。" }],
    ["nouns", "___ students in this class volunteer every month. に入る語句は？", ["A number of", "The number of", "Much", "Every"], "A number of", "a number of + 複数名詞は『多くの〜』を表し、複数扱いなので後ろのvolunteerと一致する。the number of + 複数名詞は『〜の数』で単数扱いになる。", { "The number of": "『多くの学生』ではなく『学生の数』という単数の主語を作る表現を選んでいる。", "Much": "muchは不可算名詞に使い、studentsのような可算複数名詞には使わない。" }],
    ["nouns", "We have ___ time left, so let's take a taxi. に入る語は？", ["little", "a few", "many", "few"], "little", "timeは不可算名詞で、little timeは『ほとんど時間がない』。a few / fewは可算名詞の複数に使う。", { "a few": "可算名詞複数に使う表現を、不可算名詞timeに使っている。", "many": "manyは可算名詞複数に使う。timeを量として表すときはmuch / littleを使う。" }],
    ["adverb", "The old printer is ___ in use. に入る語句は？", ["no longer", "not longer", "any longer", "longer not"], "no longer", "no longerは『もはや〜ない』を表す副詞句。be動詞の後ろで、現在は使われていないことを示す。", { "any longer": "any longerは通常notと組み合わせて文末に置く（isn't in use any longer）。", "not longer": "比較の長さを表す語順で、『もはや〜ない』という副詞句にはならない。" }],
    ["infinitive", "The coach advised the players ___ early. に入る形は？", ["to arrive", "arriving", "arrive", "arrived"], "to arrive", "advise + 人 + to doで『人に〜するよう助言する』。目的語the playersの後ろにはto + 動詞の原形を置く。", { "arriving": "adviseの後ろを動名詞にせず、advise + 人 + to doの型を確認する。", "arrive": "助動詞の後ろのように原形だけを置いている。advise + 人 + to doではtoが必要。" }],
    // ---- ポラリス入試演習への橋渡し（q121-q150）----
    ["foundation", "The elderly need safe places to rest. の The elderly の説明として正しいものは？", ["形容詞にtheが付き、複数の人々を表す名詞相当", "一人の高齢者を表す可算名詞の単数", "場所を説明する副詞句", "elderlyを最上級にした表現"], "形容詞にtheが付き、複数の人々を表す名詞相当", "the + 形容詞は、その性質をもつ人々全体を表し、複数扱いになる。the elderly は『高齢者の人々』という名詞相当のまとまり。"],
    ["verb_form", "This laptop ___ to my sister. に入る形は？", ["belongs", "is belonging", "belong", "belonged"], "belongs", "belongは所有・所属という状態を表し、通常は進行形にしない。主語This laptopは三人称単数なので現在形belongs。", { "is belonging": "今の状態だから進行形と考えている。belongは動作ではなく状態を表すため、通常は現在形を使う。", "belong": "現在形であることだけを見て、三人称単数の主語に必要な-sを落としている。" }],
    ["tense", "By the time we reached the station, the train ___. に入る形は？", ["had left", "has left", "left", "will leave"], "had left", "駅に着いたという過去の基準時より前に、列車はすでに出発していた。過去より前の出来事はhad + 過去分詞の過去完了で表す。", { "left": "二つの過去の出来事の前後関係を示さず、どちらも単純過去で処理している。" }],
    ["tense", "By next April, she ___ at this school for ten years. に入る形は？", ["will have worked", "has worked", "had worked", "will work"], "will have worked", "by next Aprilという未来の基準時までに10年間の勤務が続くので、will have + 過去分詞の未来完了を使う。", { "will work": "未来であることだけを見て、未来の時点までの継続を表す完了形を落としている。" }],
    ["tense", "I ___ for the test since breakfast, and I am still studying now. に入る形は？", ["have been studying", "am studying", "studied", "had studied"], "have been studying", "since breakfastとstill studying nowから、過去に始まり今も続く動作。have been + -ingの現在完了進行形を使う。", { "am studying": "今進行中であることだけを見て、since breakfastが示す過去からの継続を表していない。" }],
    ["infinitive", "Please don't forget ___ the lights before you leave. に入る形は？", ["to turn off", "turning off", "turn off", "turned off"], "to turn off", "forget to doは『これからすることを忘れる』。外出前に消すべきことを忘れないよう頼んでいるのでto turn off。forget doingは『したことを忘れる』。", { "turning off": "これから行う動作と、すでに行った動作の記憶を混同している。" }],
    ["gerund", "I remember ___ this temple when I was a child. に入る形は？", ["visiting", "to visit", "visit", "visited"], "visiting", "remember doingは『したことを覚えている』。when I was a childが過去の経験を示すためvisiting。remember to doは『忘れずに〜する』。", { "to visit": "過去の経験の記憶と、これからすることを忘れないという意味を混同している。" }],
    ["gerund", "We are considering ___ to a smaller office. に入る形は？", ["moving", "to move", "move", "moved"], "moving", "considerは『〜することを検討する』の意味では目的語に動名詞を取る。consider movingが正しく、consider to moveとはしない。"],
    ["gerund", "After five years in Canada, Ken is used to ___ English at work. に入る形は？", ["speaking", "speak", "spoke", "have spoken"], "speaking", "be used toのtoは前置詞で、『〜することに慣れている』を表す。前置詞の後ろなので動詞は-ing形。used to + 原形『以前は〜した』と区別する。", { "speak": "used to + 原形とbe used to + -ingを混同している。ここではbe動詞isがあるため『慣れている』の形。" }],
    ["passive", "I had my bicycle ___ at the shop. に入る形は？", ["repaired", "repair", "repairing", "to repair"], "repaired", "have + 目的語 + 過去分詞で『目的語を〜してもらう』。自転車は修理される側なので過去分詞repaired。", { "repair": "have + 人 + 原形『人に〜してもらう』と、物を目的語にするhave + 物 + 過去分詞を混同している。" }],
    ["gerund", "We couldn't help ___ when the puppy fell asleep in a shoe. に入る形は？", ["laughing", "to laugh", "laugh", "laughed"], "laughing", "cannot help doingは『〜せずにはいられない』という慣用表現。helpの後ろに動名詞を置く。"],
    ["gerund", "It is no use ___ about a decision that cannot be changed. に入る形は？", ["complaining", "to complain", "complain", "complained"], "complaining", "It is no use doingは『〜しても無駄だ』という形。useの後ろには動名詞を置く。"],
    ["infinitive", "I couldn't decide which train ___. に入る形は？", ["to take", "taking", "take", "took"], "to take", "疑問詞 + to doで『どの〜をすべきか』を表せる。which train to takeで『どの電車に乗るべきか』。"],
    ["infinitive", "It was careless ___ Rina to leave the door unlocked. に入る語は？", ["of", "for", "to", "with"], "of", "carelessは人の性質・行為への評価を表す形容詞なので、It is 形容詞 of 人 to doの形を使う。forはdifficultなど、行為の難易度を述べる形容詞で使う。", { "for": "行為の難易度を表すforと、人の性質を評価するofを区別していない。" }],
    ["infinitive", "The missing files seem ___ before the backup was made. に入る形は？", ["to have been deleted", "to be deleted", "to delete", "having deleted"], "to have been deleted", "削除はseemが示す現在の判断より前に起き、filesは削除される側。完了不定詞to have + 過去分詞と受動態been deletedを組み合わせる。", { "to be deleted": "受動態にはしているが、before the backup was madeが示すseemより前の出来事を完了不定詞で表していない。" }],
    ["infinitive", "Many students find it difficult ___ up with all the new terms. に入る形は？", ["to keep", "keeping", "keep", "kept"], "to keep", "find it + 形容詞 + to doで『〜するのは…だと感じる』。ここではto keep up withがitの内容を説明する。", { "keeping": "動名詞を置く型ではなく、find it + 形容詞 + to doの構文であることを見ていない。", "keep": "findの後ろに目的語＋補語だけを置くSVOCと、to不定詞で内容を示す構文を混同している。" }],
    ["conjunction", "Take an umbrella ___ it rains later. に入る語句は？", ["in case", "because of", "during", "despite"], "in case", "in case + 主語＋動詞で『〜するといけないから、〜に備えて』を表す。後ろのit rainsは節なので、名詞句を取る前置詞は置けない。"],
    ["comparison", "Yuki is one of the most reliable ___ on our team. に入る形は？", ["members", "member", "a member", "the member"], "members", "one of the + 最上級 + 複数名詞で『最も〜な…の一人・一つ』。複数いる集合の中の一人なのでmembers。", { "member": "oneに引かれて単数形を選んでいる。ofの後ろは複数の集合を表す。" }],
    ["nouns", "Could you give me ___ about choosing a course? に入る語句は？", ["some advice", "an advice", "some advices", "advises"], "some advice", "adviceは不可算名詞なのでanを付けず、複数形advicesにもしない。量を表すならsome adviceやa piece of advice。"],
    ["nouns", "The number of students in this class ___ increased this year. に入る形は？", ["has", "have", "are", "were"], "has", "the number of + 複数名詞の主語の中心はnumberで単数扱い。a number of + 複数名詞『多くの〜』なら複数扱いになる。", { "have": "直前のstudentsに動詞を一致させ、主語の中心the numberを確認していない。" }],
    ["nouns", "I have two keys. One is for the front door, and ___ is for the back door. に入る語は？", ["the other", "another", "other", "others"], "the other", "二つのうち一方がoneなら、残るもう一方はthe other。anotherは三つ以上ある中の不特定のもう一つに使う。", { "another": "二つに限定された残り一つと、三つ以上の中の不特定の一つを区別していない。" }],
    ["comparison", "This problem is ___ more difficult than the previous one. に入る語は？", ["much", "very", "most", "many"], "much", "比較級more difficultを強調するのはmuch。veryは原級を強調するが、very more difficultとはしない。", { "very": "原級の強調と比較級の強調を混同している。" }],
    ["subjunctive", "I wish I ___ the earlier train yesterday. に入る形は？", ["had taken", "took", "would take", "have taken"], "had taken", "yesterdayの過去の事実に反する後悔なので、I wish + had + 過去分詞を使う。『もっと早い電車に乗っていればよかった』という意味。", { "took": "現在の願望に使うI wish + 過去形と、過去の後悔を表すI wish + had + 過去分詞を混同している。", "would take": "wish節の過去の反実仮想に、未来・意志を表すwouldを置いている。" }],
    ["relative", "関係詞を選ぶとき、後ろが『必要な文の要素が欠けていない完全文』なら、基本的に何を選ぶか。", ["関係副詞", "関係代名詞", "疑問代名詞", "再帰代名詞"], "関係副詞", "関係副詞where / when / whyは副詞として場所・時・理由を補うため、後ろは主語・動詞・目的語などがそろった完全文になる。関係代名詞の後ろは一要素が欠ける。"],
    ["relative", "Maya has three cousins, all of ___ live abroad. に入る語は？", ["whom", "who", "them", "which"], "whom", "前置詞ofの後ろなので目的格whomを使う。all of whom全体が先行詞three cousinsを説明する関係詞節を作る。", { "who": "人を表すことだけで主格whoを選び、前置詞ofの目的語になる格を確認していない。", "them": "代名詞themでは二つの節を接続できない。関係代名詞whomが必要。" }],
    ["negation", "Do you know where the nearest station ___? に入る語は？", ["is", "is it", "does", "be"], "is", "間接疑問文は疑問詞 + 主語 + 動詞の平叙文語順。where the nearest station isとなり、where is the nearest stationの疑問語順にはしない。", { "is it": "直接疑問文の語順を間接疑問文の中に残している。" }],
    ["negation", "You finished the report, ___? に入る付加疑問は？", ["didn't you", "did you", "weren't you", "don't you"], "didn't you", "本文が過去形の肯定文finishedなので、付加疑問は否定のdidn't + 主語you。本文と反対の肯定・否定を使う。"],
    ["modal", "That story ___ be true; I was there and saw what happened. に入る語は？", ["can't", "must", "should", "may"], "can't", "確かな根拠から『本当であるはずがない』と強く否定推量するためcan't beを使う。must beは強い肯定推量。", { "must": "強い推量であることだけを見て、根拠が否定を導いていることを確認していない。" }],
    ["subjunctive", "It is time you ___. に入る形は？", ["went to bed", "go to bed", "will go to bed", "have gone to bed"], "went to bed", "It is time + 主語 + 過去形で『もう〜する時間だ』を表す。形は過去形だが、意味は現在すべきこと。"],
    ["subjunctive", "___ I known about the traffic, I would have left earlier. に入る語は？", ["Had", "If", "Were", "Should"], "Had", "If I had knownのifを省略すると、hadを主語の前に出してHad I knownとする。過去の反実仮想を表す仮定法過去完了の倒置。", { "If": "If I knownとはできない。ifを使うならIf I had known、ifを省略するならHad I knownとなる。" }]
  ].map(([domain, stem, choices, answer, explanation, misconceptions], index) => {
    const question = { id: `q${index + 1}`, domain, stem, choices, answer, explanation };
    return {
      ...question,
      skill: "knowledge",
      target: DOMAIN_TARGETS[domain],
      priority: "support",
      misconceptions: { ...defaultMisconceptions(question), ...(misconceptions || {}) }
    };
  })
};
