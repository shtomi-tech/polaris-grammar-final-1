import {
  CONTENT_VERSION,
  FOUNDATION_SESSION_VERSION,
} from "./status.js?v=20260804-grammar200q-v10";

export async function mount(root, ctx) {
  "use strict";

  const app = root;
  app.classList.add("app");
  app.setAttribute("aria-live", "polite");
  // The student-facing path now separates time (Tense) from stance (Mood).
  // Keep a path version so scores can be migrated deliberately when section
  // membership changes.
  const PATH_VERSION = "tense-mood-v1";
  const LETTERS = ["A", "B", "C", "D"];
  const SELECTABLE_SET_ID = "english-grammar-200-merged";
  // Xの通常ポスト相当。Premiumの長文ポストではなく、短い投稿の連結を教材の基準にする。
  const PREPARATION_POST_CHAR_LIMIT = 280;
  const PREPARATION_PROGRESS_VERSION = 1;
  const PREPARATION_GUIDANCE = {
    "lesson-01-sentence-core": {
      goal: "V→S→M→O/Cの順に骨格を見つけ、5文型を説明できる",
      minutes: "約5分",
    },
  };
  // 一旦、全セクションを自由に選べる状態にする。順路へ戻すときは false に戻す。
  const ALL_LESSONS_UNLOCKED = true;
  // The data shape changed with the 43-section path. The versioned URL keeps
  // a browser from reusing the older 19-unit JSON from its HTTP cache.
  const DATA_URL = "modules/foundation/data/questions.json?v=grammar-200q-v1";
  const prepPath = (lesson) => `data/prep-${lesson.id}.md`;
  const STAGE_ORDER = {
    "基礎確認": 0,
    "識別・使い分け": 1,
    "入試型総合": 2,
  };
  const DIFFICULTY_ORDER = {
    "基礎": 0,
    "標準": 1,
    "発展": 2,
  };
  // 対象セクションは段階の順を保ったまま、同じ型を続けて判断できる
  // ようにする。問題の本文・正答・解説は変えず、安定IDで表示順だけを
  // 指定する。
  const LESSON_QUESTION_ORDER = {
    // 文の骨格は、V/S → 修飾語 → O/C → 5文型の順に組み立てる。
    "lesson-01-sentence-core": [
      "cur-002",
      "cur-003",
      "cur-004",
      "cur-006",
      "cur-007",
      "add-097",
      "add-098",
      "add-330",
      "add-331",
    ],
    // 動詞の型は、前置詞の有無 → 目的語 → 固定的な型 → 入試表現へ進める。
    "lesson-02-verb-frames": [
      "cur-009",
      "cur-019",
      "cur-010",
      "cur-012",
      "add-321",
      "add-326",
      "add-327",
      "add-329",
      "add-332",
      "add-328",
      "add-333",
      "add-003",
    ],
    // 名詞は、働き → 可算性 → 数 → 一般・特定の順で分類する。
    "lesson-03-nouns-count": [
      "cur-021",
      "add-077",
      "add-075",
      "add-308",
      "add-309",
      "cur-129",
      "cur-131",
    ],
    // 冠詞・数量詞は、冠詞 → 個数/量 → 少なさ → 集団・程度へ進める。
    "lesson-04-articles-quantity": [
      "cur-127",
      "cur-126",
      "cur-128",
      "cur-132",
      "leg-158",
      "cur-133",
      "cur-134",
      "cur-156",
      "cur-130",
      "add-052",
      "add-053",
    ],
    // 代名詞は、格・所有 → other系 → one/none → 相互代名詞 → 代用表現へ進める。
    "lesson-05-pronouns-determiners": [
      "leg-133",
      "add-036",
      "add-312",
      "add-311",
      "add-313",
      "add-314",
      "add-315",
      "add-018",
      "cur-136",
      "cur-137",
      "cur-138",
      "leg-144",
      "leg-145",
      "leg-149",
      "leg-150",
      "add-019",
      "add-051",
    ],
    // 修飾は、修飾先 → 語順 → 紛らわしい形 → 程度・語法へ進める。
    "lesson-06-modifiers": [
      "cur-022",
      "cur-140",
      "cur-147",
      "cur-023",
      "cur-149",
      "add-317",
      "add-318",
      "add-288",
      "cur-141",
      "leg-164",
      "cur-142",
      "cur-143",
      "cur-144",
      "cur-145",
      "cur-146",
      "cur-195",
      "cur-148",
      "add-322",
      "add-055",
    ],
    // 前置詞は、後ろの形 → 時間/場所 → 関係 → 語法・比較へ進める。
    "lesson-07-prepositions": [
      "leg-136",
      "leg-137",
      "leg-138",
      "leg-139",
      "add-296",
      "add-035",
      "add-230",
      "add-259",
      "add-290",
      "add-297",
      "add-298",
      "add-299",
      "add-300",
      "add-307",
      "add-016",
      "add-065",
      "add-067",
      "cur-159",
      "leg-134",
      "leg-140",
      "leg-141",
      "leg-142",
      "add-049",
      "add-050",
    ],
    // 時制は、基準時 → 進行と予定 → 現在完了 → 節の時間関係へ進める。
    "lesson-tense-reference": [
      "cur-027",
      "cur-028",
      "add-123",
      "add-124",
      "add-126",
      "add-203",
      "add-209",
    ],
    "lesson-tense-progressive-future": [
      "cur-029",
      "add-127",
      "leg-010",
      "add-205",
      "cur-030",
      "leg-011",
      "leg-012",
      "add-128",
      "add-073",
    ],
    "lesson-tense-present-perfect": [
      "cur-033",
      "add-206",
      "add-129",
      "leg-003",
      "leg-004",
      "leg-013",
      "leg-005",
      "add-068",
      "add-130",
      "add-210",
    ],
    "lesson-tense-perfect-clauses": [
      "cur-035",
      "cur-198",
      "leg-007",
      "add-060",
      "add-131",
      "add-207",
      "add-132",
      "add-133",
      "add-134",
      "add-208",
      "add-204",
      "cur-032",
      "cur-122",
      "leg-009",
    ],
    // 一致の基本は、単純な主語 → be動詞 → each/everyへ進める。
    "lesson-11-agreement-basic": [
      "cur-014",
      "add-121",
      "add-320",
      "cur-015",
      "cur-016",
      "leg-195",
      "leg-196",
      "add-201",
      "cur-026",
    ],
    // there構文は、場所との区別 → 時制 → 数 → 疑問・否定 → 長い名詞句へ進める。
    "lesson-36-there-construction": [
      "cur-011",
      "add-152",
      "cur-186",
      "add-153",
      "add-154",
      "add-155",
    ],
    // Moodは、助動詞 → 仮定法の基本 → 条件の変形 → 願望・提案・命令へ進める。
    "lesson-mood-modal-basic": [
      "cur-037",
      "cur-038",
      "cur-031",
      "add-064",
      "cur-039",
      "cur-041",
      "cur-050",
      "add-138",
      "add-211",
      "add-215",
      "add-135",
      "cur-040",
      "leg-029",
      "leg-031",
    ],
    "lesson-mood-subjunctive-basic": [
      "cur-162",
      "add-034",
      "add-216",
      "add-217",
      "add-218",
      "cur-163",
      "cur-174",
      "add-087",
    ],
    "lesson-mood-subjunctive-conditions": [
      "cur-164",
      "cur-165",
      "cur-166",
      "cur-167",
      "leg-047",
      "cur-171",
      "cur-173",
      "cur-175",
      "cur-200",
      "add-137",
      "add-139",
      "add-140",
      "add-141",
      "add-219",
      "add-220",
      "add-221",
    ],
    "lesson-mood-wish-proposal": [
      "cur-017",
      "cur-018",
      "leg-190",
      "add-031",
      "cur-168",
      "cur-169",
      "cur-172",
      "leg-072",
      "add-042",
      "add-222",
      "add-223",
      "add-224",
      "add-225",
    ],
    // 疑問文は、be/助動詞 → do → 疑問詞の役割 → 応答へ進める。
    "lesson-14-direct-questions": [
      "leg-167",
      "leg-169",
      "cur-181",
      "add-281",
      "add-283",
      "add-284",
      "add-306",
      "add-202",
      "leg-170",
      "leg-171",
      "leg-172",
    ],
    // 否定は、be → do → 助動詞 → 完了 → 否定を強める表現へ進める。
    "lesson-15-negation-basic": [
      "leg-175",
      "add-037",
      "cur-183",
      "add-286",
      "add-287",
      "add-289",
      "leg-176",
      "leg-178",
    ],
    // 受動態の基本は、目的語の移動 → beの時制 → 助動詞・疑問へ進める。
    "lesson-16-passive-basic": [
      "add-032",
      "cur-045",
      "add-099",
      "add-100",
      "cur-046",
      "add-063",
      "add-125",
      "add-226",
      "add-066",
      "leg-017",
      "leg-021",
    ],
    // 不定詞の基本は、形 → 三用法 → 否定・前置詞のtoへ進める。
    "lesson-17-infinitive-basic": [
      "cur-051",
      "add-105",
      "add-231",
      "add-234",
      "add-106",
      "cur-054",
      "add-238",
      "cur-060",
      "cur-053",
      "cur-089",
      "cur-059",
    ],
    // 不定詞の応用は、動作主 → 時点 → 動詞の型 → 慣用・入試型へ進める。
    "lesson-18-infinitive-advanced": [
      "add-237",
      "add-239",
      "add-240",
      "cur-055",
      "cur-056",
      "cur-088",
      "cur-057",
      "add-236",
      "add-336",
      "add-340",
      "add-342",
      "leg-074",
      "add-014",
      "add-108",
      "cur-197",
      "add-023",
      "add-024",
      "add-235",
      "add-107",
      "add-025",
      "add-057",
      "cur-058",
      "leg-066",
    ],
    // 原形不定詞は、使役 → 知覚 → help → to不定詞との対比へ進める。
    "lesson-37-bare-infinitive": [
      "add-335",
      "cur-061",
      "cur-188",
      "cur-189",
      "add-343",
      "add-345",
      "add-346",
    ],
    // 動名詞は、名詞の席 → 前置詞/動詞の型 → 意味差 → 慣用へ進める。
    "lesson-19-gerund": [
      "cur-063",
      "add-103",
      "add-241",
      "add-242",
      "add-247",
      "add-248",
      "add-249",
      "cur-069",
      "add-020",
      "add-021",
      "add-022",
      "add-246",
      "add-250",
      "cur-064",
      "cur-068",
      "add-043",
      "cur-086",
      "cur-087",
    ],
    // 目的語に来る形は、不定詞・動名詞を学んだ後に型と意味差を比較する。
    "lesson-38-verb-complements": [
      "add-232",
      "add-233",
      "leg-063",
      "cur-062",
      "add-243",
      "add-244",
      "cur-065",
      "add-104",
      "cur-067",
      "leg-069",
      "leg-070",
      "leg-071",
      "add-245",
      "cur-085",
    ],
    // 分詞の形容詞用法は、修飾先 → 能動/受動 → 位置 → 知覚動詞へ進める。
    "lesson-20-participle-adjective": [
      "cur-070",
      "add-109",
      "add-316",
      "add-251",
      "add-110",
      "add-253",
      "add-255",
      "add-338",
      "add-070",
      "add-252",
      "add-339",
      "cur-071",
      "cur-072",
      "cur-083",
      "cur-084",
    ],
    // 分詞構文は、主語 → 接続関係 → 時点 → 否定/受動 → 慣用へ進める。
    "lesson-21-participial-construction": [
      "add-076",
      "add-111",
      "add-112",
      "add-254",
      "add-256",
      "add-258",
      "cur-073",
      "cur-074",
      "cur-076",
      "cur-077",
      "cur-079",
      "cur-082",
      "leg-083",
      "leg-085",
      "add-026",
      "add-027",
      "add-089",
      "add-257",
      "add-260",
      "add-044",
      "leg-087",
      "leg-090",
    ],
    // 従属接続詞は、節の形 → 時間/理由/対比 → 条件 → 目的/結果へ進める。
    "lesson-23-conjunctions-adverb": [
      "cur-024",
      "cur-093",
      "add-092",
      "leg-122",
      "add-096",
      "add-302",
      "add-093",
      "add-304",
      "add-088",
      "add-095",
      "add-094",
      "cur-097",
      "cur-098",
      "leg-125",
      "cur-100",
      "cur-101",
      "add-007",
      "add-009",
      "add-268",
      "add-270",
      "add-303",
      "add-008",
      "add-010",
      "add-048",
      "cur-099",
    ],
    // 名詞節は、主節の席 → that/if/whether → what/howへ進める。
    "lesson-24-conjunctions-noun": [
      "add-080",
      "add-265",
      "add-266",
      "add-267",
      "cur-095",
      "cur-096",
      "add-120",
      "add-305",
      "cur-104",
      "cur-123",
      "add-323",
    ],
    // 間接疑問は語順、付加疑問は前半の助動詞から判断する。
    "lesson-25-indirect-questions-tags": [
      "add-081",
      "add-285",
      "cur-105",
      "cur-182",
      "add-119",
      "add-282",
      "leg-189",
      "add-013",
      "add-056",
    ],
    // 関係代名詞は、主格/目的格 → that/省略 → 所有 → thatの識別へ進める。
    "lesson-26-relatives-basic": [
      "cur-107",
      "leg-095",
      "add-113",
      "add-264",
      "cur-108",
      "add-115",
      "add-261",
      "add-116",
      "cur-109",
      "cur-111",
      "cur-118",
      "cur-110",
      "add-114",
      "cur-103",
    ],
    // 関係副詞は、where/when → why → 完全な節と場所の区別へ進める。
    "lesson-39-relative-adverbs": [
      "add-117",
      "add-263",
      "cur-112",
      "add-118",
      "cur-113",
      "cur-114",
      "cur-119",
      "cur-125",
    ],
    // 関係詞の応用は、コンマ/前置詞 → 完全性 → 複合関係詞 → 節全体whichへ進める。
    "lesson-27-relatives-advanced": [
      "add-082",
      "cur-115",
      "cur-116",
      "cur-196",
      "add-262",
      "add-005",
      "add-269",
      "add-006",
      "add-045",
      "cur-117",
    ],
    // 時制の一致と話法は、基準時 → 時制の後退 → 人称・命令の変換へ進める。
    "lesson-32-sequence-speech": [
      "add-030",
      "cur-036",
      "leg-186",
      "leg-188",
      "leg-192",
      "leg-187",
      "leg-191",
    ],
    // 比較の基本は、原級 → 比較級 → 最上級 → 定型・最上級相当へ進める。
    "lesson-08-comparison-basic": [
      "cur-150",
      "cur-151",
      "add-142",
      "add-143",
      "add-144",
      "add-145",
      "add-276",
      "add-150",
      "add-148",
      "add-274",
      "add-275",
      "add-272",
      "add-271",
      "add-279",
      "cur-152",
      "cur-153",
      "cur-158",
      "cur-157",
    ],
    // 比較構文の発展は、倍数 → 比例 → 数量・限度 → 慣用表現へ進める。
    "lesson-28-comparison-advanced": [
      "add-083",
      "add-146",
      "add-147",
      "add-273",
      "add-278",
      "cur-155",
      "cur-154",
      "cur-160",
      "cur-161",
      "leg-116",
      "add-149",
      "add-280",
      "add-324",
      "add-325",
      "add-277",
      "add-002",
      "add-046",
      "add-001",
    ],
    // 部分否定・省略は、否定の範囲 → 全否定 → 省略の条件 → 復元へ進める。
    "lesson-30-negation-ellipsis": [
      "add-085",
      "cur-176",
      "cur-177",
      "leg-180",
      "cur-080",
      "cur-124",
      "cur-081",
      "leg-181",
    ],
    // 強調・倒置は、強調 do → 文頭語による倒置 → 定型表現へ進める。
    "lesson-31-emphasis-inversion": [
      "add-086",
      "cur-191",
      "add-292",
      "add-291",
      "add-295",
      "cur-178",
      "cur-179",
      "cur-180",
      "cur-192",
      "add-011",
      "add-012",
      "add-004",
    ],
    // 特殊構文・語法は、形式主語 → 強調構文 → 感嘆文 → 動詞の型へ進める。
    "lesson-35-special-structures-usage": [
      "cur-025",
      "add-015",
      "add-061",
      "add-069",
      "add-122",
      "cur-194",
      "add-039",
    ],
    // 助動詞の発展は、形 → 現在の推量 → 否定 → 過去の推量 →
    // should have → 慣用表現 → 入試型の順にする。
    "lesson-mood-modal-advanced": [
      "add-062",
      "add-072",
      "add-033",
      "add-136",
      "add-214",
      "cur-043",
      "cur-044",
      "leg-030",
      "cur-187",
      "leg-032",
      "cur-042",
      "add-074",
      "add-213",
      "add-212",
      "add-041",
      "cur-199",
      "leg-036",
    ],
    "lesson-22-passive-advanced": [
      "add-079",
      "leg-022",
      "leg-023",
      "cur-047",
      "add-071",
      "add-227",
      "add-228",
      "add-229",
      "cur-049",
      "add-101",
      "add-337",
      "add-102",
      "add-341",
      "cur-048",
      "cur-091",
      "cur-190",
    ],
    "lesson-29-agreement-advanced": [
      "add-084",
      "add-319",
      "add-293",
      "cur-139",
      "add-028",
      "add-294",
      "add-310",
      "cur-135",
      "cur-185",
      "cur-184",
      "add-059",
      "cur-193",
    ],
    // 接続詞の基本は、同じ働きのまとまりをつなぐ形から始め、
    // 節どうしの関係、命令文に続く特殊な関係へ進める。
    "lesson-08-conjunctions-basic": [
      "leg-121",
      "cur-121",
      "cur-020",
      "add-090",
      "add-301",
      "add-091",
    ],
  };

  function rank(order, key) {
    return Object.prototype.hasOwnProperty.call(order, key) ? order[key] : 99;
  }

  let DATA = null;
  let state = null;
  let lastPreparationOpen = null;
  let cleanupPreparationTracking = null;
  const SESSION_ID = Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);

  /* 基礎チェックの記録は、シェルが管理する生徒別ストアへ保存する。
     grammar-200q単体版のlocalStorageキーをそのまま使うと、生徒切替と
     クラウド同期から外れるため、ここでv2の進捗形式へ寄せる。 */
  function loadProgress() {
    const progress = ctx.store.get();
    if (!progress || progress.contentVersion !== CONTENT_VERSION) {
      return {
        version: 1,
        contentVersion: CONTENT_VERSION,
        pathVersion: PATH_VERSION,
        scores: {},
        preparation: emptyPreparationProgress(),
      };
    }
    return progress;
  }

  function emptyPreparationProgress() {
    return { version: PREPARATION_PROGRESS_VERSION, lessons: {} };
  }

  function normalizePreparationProgress(raw) {
    const normalized = emptyPreparationProgress();
    if (!raw || typeof raw !== "object") return normalized;
    normalized.lessons = raw.lessons && typeof raw.lessons === "object" ? raw.lessons : {};
    return normalized;
  }

  function loadPreparationLessonProgress(lessonId) {
    const preparation = normalizePreparationProgress(loadProgress().preparation);
    const saved = preparation.lessons[lessonId];
    if (!saved || typeof saved !== "object") {
      return { version: PREPARATION_PROGRESS_VERSION, postIndex: -1, checks: {}, completedAt: null };
    }
    return {
      version: PREPARATION_PROGRESS_VERSION,
      postIndex: Number.isInteger(saved.postIndex) ? saved.postIndex : -1,
      checks: saved.checks && typeof saved.checks === "object" ? { ...saved.checks } : {},
      completedAt: saved.completedAt || null,
      updatedAt: saved.updatedAt || null,
    };
  }

  function foundationProgressPayload(progress, overrides) {
    const payload = {
      version: 1,
      contentVersion: CONTENT_VERSION,
      pathVersion: PATH_VERSION,
      scores: progress.scores && typeof progress.scores === "object" ? progress.scores : {},
      preparation: normalizePreparationProgress(progress.preparation),
    };
    if (Object.prototype.hasOwnProperty.call(progress, "session")) {
      payload.session = progress.session;
    }
    return Object.assign(payload, overrides || {});
  }

  function savePreparationLessonProgress(lessonId, lessonProgress) {
    const progress = loadProgress();
    const preparation = normalizePreparationProgress(progress.preparation);
    preparation.lessons = {
      ...preparation.lessons,
      [lessonId]: {
        version: PREPARATION_PROGRESS_VERSION,
        postIndex: Number.isInteger(lessonProgress.postIndex) ? lessonProgress.postIndex : -1,
        checks: lessonProgress.checks && typeof lessonProgress.checks === "object"
          ? { ...lessonProgress.checks }
          : {},
        completedAt: lessonProgress.completedAt || null,
        updatedAt: lessonProgress.updatedAt || new Date().toISOString(),
      },
    };
    ctx.store.set(foundationProgressPayload(progress, { preparation: preparation }));
  }

  function stopPreparationTracking() {
    if (cleanupPreparationTracking) {
      cleanupPreparationTracking();
      cleanupPreparationTracking = null;
    }
  }

  function loadScores() {
    const progress = loadProgress();
    const scores = progress.scores && typeof progress.scores === "object" ? progress.scores : {};
    const setScores = scores[SELECTABLE_SET_ID];
    if (!setScores || typeof setScores !== "object") return {};
    const validScores = {};
    learningLessons().forEach(function (lesson) {
      const savedScore = setScores[lesson.id];
      const expectedTotal = lessonCountForSet(lesson, SELECTABLE_SET_ID);
      if (savedScore && Number(savedScore.total) === expectedTotal) {
        validScores[lesson.id] = savedScore;
      }
    });
    return { [SELECTABLE_SET_ID]: validScores };
  }

  function saveScore(setId, lessonId, correct, total) {
    const progress = loadProgress();
    const currentScores = progress.scores && typeof progress.scores === "object" ? progress.scores : {};
    const scores = {
      ...currentScores,
      [setId]: {
        ...(currentScores[setId] || {}),
        [lessonId]: { correct: correct, total: total, completed: true },
      },
    };
    ctx.store.set(foundationProgressPayload(progress, { scores: scores, session: null }));
  }

  const learningEvents = [];

  function loadLearningEvents() {
    return learningEvents.slice();
  }

  function recordLearningEvent(type, payload) {
    learningEvents.push(Object.assign({
      version: 1,
      pathVersion: PATH_VERSION,
      type: type,
      occurredAt: new Date().toISOString(),
      sessionId: SESSION_ID,
    }, payload || {}));
    if (learningEvents.length > 5000) {
      learningEvents.splice(0, learningEvents.length - 5000);
    }
  }

  function exportLearningLog() {
    const payload = {
      app: "grammar-200q",
      version: 1,
      pathVersion: PATH_VERSION,
      exportedAt: new Date().toISOString(),
      events: loadLearningEvents(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "grammar-200q-learning-log-" + new Date().toISOString().slice(0, 10) + ".json";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(function () { URL.revokeObjectURL(url); }, 0);
  }

  function el(tag, props, children) {
    props = props || {};
    const node = document.createElement(tag);
    Object.keys(props).forEach(function (k) {
      const v = props[k];
      if (k === "class") node.className = v;
      else if (k === "html") node.innerHTML = v;
      else if (k.indexOf("on") === 0 && typeof v === "function") {
        node.addEventListener(k.slice(2), v);
      } else {
        node.setAttribute(k, v);
      }
    });
    (Array.isArray(children) ? children : children == null ? [] : [children]).forEach(function (c) {
      if (c == null) return;
      node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    });
    return node;
  }

  function escapeHtml(s) {
    return s.replace(/[&<>]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c];
    });
  }

  function unitTitle(unitId) {
    const u = DATA.units.find(function (x) {
      return x.id === unitId;
    });
    return u ? u.title : unitId;
  }

  function setTitle(setId) {
    const set = DATA.sets.find(function (x) {
      return x.id === setId;
    });
    return set ? set.title : setId;
  }

  function learningLessons() {
    const lessons = [];
    DATA.learningPath.chapters.forEach(function (chapter) {
      chapter.lessons.forEach(function (lesson) {
        lessons.push(lesson);
      });
    });
    return lessons;
  }

  function lessonCountForSet(lesson, setId) {
    const counts = lesson.countsBySet || {};
    return counts[setId] || lesson.count || 0;
  }

  function lessonForId(lessonId) {
    return learningLessons().find(function (lesson) {
      return lesson.id === lessonId;
    }) || null;
  }

  function lessonAfter(lessonId) {
    const lessons = learningLessons();
    const index = lessons.findIndex(function (lesson) {
      return lesson.id === lessonId;
    });
    return index >= 0 ? lessons[index + 1] || null : null;
  }

  function loadResumeSession() {
    const session = loadProgress().session;
    if (!session || session.version !== FOUNDATION_SESSION_VERSION) return null;
    if (session.setId !== SELECTABLE_SET_ID || !lessonForId(session.lessonId)) return null;
    if (!Array.isArray(session.questionIds) || session.questionIds.length === 0) return null;
    if (!Number.isInteger(session.index) || session.index < 0 || session.index >= session.questionIds.length) return null;
    return session;
  }

  function sessionPosition(session) {
    if (!session || !Array.isArray(session.questionIds) || !session.questionIds.length) return "";
    return Math.min(Math.max(Number(session.index || 0) + 1, 1), session.questionIds.length)
      + " / " + session.questionIds.length;
  }

  function saveSession() {
    if (!state || !state.questions || !state.questions.length) return;
    const progress = loadProgress();
    const currentScores = progress.scores && typeof progress.scores === "object" ? progress.scores : {};
    const session = {
      version: FOUNDATION_SESSION_VERSION,
      setId: state.setId,
      lessonId: state.lessonId,
      questionIds: state.questions.map(function (question) { return String(question.id); }),
      index: state.index,
      answered: Boolean(state.answered),
      selectedIndex: Number.isInteger(state.selectedIndex) ? state.selectedIndex : null,
      correctCount: state.correctCount,
      missed: state.missed.map(function (item) {
        return { questionId: String(item.question.id), chosenIndex: item.chosenIndex };
      }),
      preparationViewed: Boolean(state.preparationViewed),
      startedAt: state.startedAt || Date.now(),
      updatedAt: new Date().toISOString(),
    };
    ctx.store.set(foundationProgressPayload(progress, {
      scores: currentScores,
      session: session,
    }));
  }

  function buildPathNextAction(nextLesson, resumeSession, completedCount, totalLessons) {
    const action = el("section", {
      class: "path-next-action",
      "aria-labelledby": "path-next-action-title",
    });
    const copy = el("div", { class: "path-next-action-copy" });
    const eyebrow = resumeSession ? "途中保存" : nextLesson ? "次にやること" : "基礎チェック完了";
    const title = resumeSession
      ? lessonForId(resumeSession.lessonId).title
      : nextLesson
        ? nextLesson.title
        : "全43セクションを完了しました";
    const description = resumeSession
      ? `前回の ${sessionPosition(resumeSession)} 問目から続けます。`
      : nextLesson
        ? `全${lessonCountForSet(nextLesson, SELECTABLE_SET_ID)}問。このセクションを終えると学習済みが ${completedCount + 1}/${totalLessons} になります。`
        : "次は復習として、もう一度セクションを解けます。";
    copy.append(
      el("p", { class: "path-next-action-eyebrow" }, eyebrow),
      el("h3", { id: "path-next-action-title", class: "path-next-action-title" }, title),
      el("p", { class: "path-next-action-description" }, description)
    );

    const button = el("button", {
      class: "btn cta",
      type: "button",
      onclick: function () {
        if (resumeSession) restoreLesson(resumeSession);
        else if (nextLesson) renderPreparation(nextLesson);
        else startLesson(SELECTABLE_SET_ID, learningLessons()[0].id);
      },
    }, resumeSession ? "途中から再開する" : nextLesson ? "次の予習資料を読む" : "復習を始める");
    action.append(copy, button);
    return action;
  }

  function renderSetSelect() {
    stopPreparationTracking();
    state = null;
    app.classList.remove("is-comparison");
    window.scrollTo(0, 0);
    const scores = loadScores();
    const set = DATA.sets.find(function (item) {
      return item.id === SELECTABLE_SET_ID;
    });
    const setScores = scores[SELECTABLE_SET_ID] || {};
    const allLessons = learningLessons();
    const completedCount = allLessons.filter(function (lesson) {
      return Boolean(setScores[lesson.id]);
    }).length;
    const nextIndex = allLessons.findIndex(function (lesson) {
      return !setScores[lesson.id];
    });
    const nextLesson = nextIndex >= 0 ? allLessons[nextIndex] : null;
    const resumeSession = loadResumeSession();
    const progressText = completedCount
      ? completedCount + "/" + allLessons.length + "セクションを学習済み"
      : "まだ学習記録はありません";

    root.innerHTML = "";
    root.appendChild(el("div", { class: "selection-heading" }, [
      el("h2", {}, "統合セットの学習ルート"),
      el("p", {}, "すべてのセクションを選べます。予習資料のあるセクションでは、先に資料を読んでから問題へ進めます。"),
    ]));

    root.appendChild(el("div", { class: "path-overview card" }, [
      el("div", { class: "path-overview-main" }, [
        el("strong", { class: "path-overview-title" }, set.title),
        el(
          "span",
          { class: "path-overview-meta" },
          "全" + set.questionCount + "問・" + DATA.learningPath.chapterCount + "章" + DATA.learningPath.lessonCount + "セクション"
        ),
      ]),
      el("span", { class: "path-overview-progress" }, progressText),
    ]));

    root.appendChild(buildPathNextAction(nextLesson, resumeSession, completedCount, allLessons.length));

    const pathRoot = el("div", { class: "learning-path" });
    let globalIndex = 0;
    DATA.learningPath.chapters.forEach(function (chapter, chapterIndex) {
      const chapterCompleted = chapter.lessons.filter(function (lesson) {
        return Boolean(setScores[lesson.id]);
      }).length;
      const lessonList = el("div", { class: "path-lesson-list" });

      chapter.lessons.forEach(function (lesson) {
        const score = setScores[lesson.id];
        const isCompleted = Boolean(score);
        const isCurrent = globalIndex === nextIndex;
        const isLocked = !ALL_LESSONS_UNLOCKED && nextIndex >= 0 && globalIndex > nextIndex;
        const cardClasses = ["path-lesson-card", "card"];
        if (isCurrent) cardClasses.push("is-current");
        if (isLocked) cardClasses.push("is-locked");
        const statusText = isCompleted
          ? "前回 " + score.correct + "/" + score.total
            : isLocked
              ? "順番待ち"
            : isCurrent
              ? "次に進む"
              : "未学習";
        const actionList = el("div", { class: "path-lesson-actions" });

        if (isLocked) {
          actionList.appendChild(el(
            "span",
            { class: "path-lock-note" },
            "前のセクションを終えると開きます"
          ));
        } else {
          {
            actionList.appendChild(el(
              "button",
              {
                class: "btn btn-secondary unit-card-action",
                onclick: function () { renderPreparation(lesson); },
              },
              "予習資料を読む"
            ));
          }
          actionList.appendChild(el(
            "button",
            {
              class: "btn btn-secondary unit-card-action",
              onclick: function () {
                const session = loadResumeSession();
                if (session && session.lessonId === lesson.id) restoreLesson(session);
                else startLesson(SELECTABLE_SET_ID, lesson.id);
              },
            },
            isCompleted
              ? "復習する"
              : (resumeSession && resumeSession.lessonId === lesson.id ? "途中から再開" : "問題を解く")
          ));
        }

        const lessonCount = lessonCountForSet(lesson, SELECTABLE_SET_ID);
        const lessonCard = el("div", { class: cardClasses.join(" ") }, [
          el("span", { class: "path-lesson-number" }, String(globalIndex + 1).padStart(2, "0")),
          el("div", { class: "path-lesson-main" }, [
            el("div", { class: "path-lesson-heading" }, [
              el("span", { class: "path-lesson-title" }, lesson.title),
              el("span", { class: "path-lesson-status" }, statusText),
            ]),
            el("span", { class: "path-lesson-meta" }, "全" + lessonCount + "問"),
          ]),
          actionList,
        ]);
        lessonList.appendChild(lessonCard);
        globalIndex += 1;
      });

      pathRoot.appendChild(el("section", {
        class: "path-chapter card",
        "aria-labelledby": "chapter-heading-" + chapterIndex,
      }, [
        el("div", { class: "path-chapter-header" }, [
          el("div", { class: "path-chapter-number" }, "CHAPTER " + String(chapterIndex + 1).padStart(2, "0")),
          el("div", { class: "path-chapter-heading" }, [
            el("h3", { id: "chapter-heading-" + chapterIndex, class: "path-chapter-title" }, chapter.title),
            el("p", { class: "path-chapter-meta" }, chapterCompleted + "/" + chapter.lessons.length + "セクション完了"),
          ]),
        ]),
        lessonList,
      ]));
    });
    const allSections = el("details", { class: "path-all-sections" });
    allSections.appendChild(el("summary", {}, "すべてのセクションから選ぶ（" + allLessons.length + "）"));
    allSections.appendChild(pathRoot);
    root.appendChild(allSections);
  }

  function inlineMarkdown(text) {
    return escapeHtml(text)
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  }

  function preparationHtmlBlocks(fragments) {
    const container = document.createElement("div");
    container.innerHTML = fragments.join("");
    return Array.from(container.children).map(function (element) {
      return {
        html: element.outerHTML,
        isCheck: element.classList.contains("prep-check-interactive"),
        visibleLength: Array.from(element.textContent || "").length,
      };
    });
  }

  function splitPreparationPost(posts, heading, fragments, charLimit) {
    if (!fragments.length) return;
    if (!charLimit) {
      posts.push({ heading: heading, html: fragments.join("") });
      return;
    }

    const blocks = preparationHtmlBlocks(fragments);
    let currentBlocks = [];
    let currentLength = 0;

    function closeChunk(kind) {
      if (!currentBlocks.length) return;
      posts.push({ heading: heading, html: currentBlocks.join(""), kind: kind || "content" });
      currentBlocks = [];
      currentLength = 0;
    }

    blocks.forEach(function (block) {
      if (block.isCheck) {
        closeChunk();
        currentBlocks.push(block.html);
        closeChunk("check");
        return;
      }
      const blockLength = block.visibleLength;
      if (currentBlocks.length && currentLength + blockLength > charLimit) {
        closeChunk();
      }
      currentBlocks.push(block.html);
      currentLength += blockLength;
    });
    closeChunk();
  }

  function parsePreparationMarkdown(markdown, charLimit) {
    const posts = [];
    let output = [];
    let paragraph = [];
    let listTag = null;
    let boardLines = null;
    let calloutType = null;
    let calloutId = null;
    let calloutLines = null;
    let practiceLines = null;
    let currentHeading = null;
    let avatar = null;
    let title = "";
    let checkCount = 0;

    function closeParagraph() {
      if (paragraph.length) {
        output.push("<p>" + paragraph.join(" ") + "</p>");
        paragraph = [];
      }
    }

    function closeList() {
      if (listTag) {
        output.push("</" + listTag + ">");
        listTag = null;
      }
    }

    function closeBoard() {
      if (boardLines === null) return;
      output.push(
        '<aside class="blackboard-note" role="note">' +
        '<div class="blackboard-label">板書</div>' +
        '<div class="blackboard-content">' +
        boardLines.map(function (line) { return inlineMarkdown(line); }).join("<br>") +
        "</div></aside>"
      );
      boardLines = null;
    }

    function closeCallout() {
      if (calloutLines === null) return;
      const labels = {
        point: "ポイント",
        mistake: "よくある誤り",
        check: "10秒確認",
      };
      if (calloutType === "check") {
        output.push(renderPreparationCheck(calloutLines, calloutId, checkCount + 1));
        checkCount += 1;
      } else {
        output.push(
          '<aside class="prep-callout prep-' + calloutType + '" role="note">' +
          '<div class="prep-callout-label">' + labels[calloutType] + '</div>' +
          '<div class="prep-callout-content">' +
          calloutLines.map(function (line) { return inlineMarkdown(line); }).join("<br>") +
          "</div></aside>"
        );
      }
      calloutType = null;
      calloutId = null;
      calloutLines = null;
    }

    function closePractice() {
      if (practiceLines === null) return;
      output.push(
        '<section class="preparation-assignment" aria-label="教授からの課題">' +
        '<div class="preparation-assignment-content">' +
        practiceLines.map(function (line) { return inlineMarkdown(line); }).join("<br>") +
        "</div>" +
        '<a class="btn btn-primary preparation-practice-link" href="#practice">このセクションの問題を解く</a>' +
        "</section>"
      );
      practiceLines = null;
    }

    function closePost() {
      if (output.length) {
        splitPreparationPost(posts, currentHeading, output, charLimit);
      }
      output = [];
    }

    markdown.split(/\r?\n/).forEach(function (line) {
      const trimmed = line.trim();
      if (boardLines !== null) {
        if (trimmed === ":::") {
          closeBoard();
        } else {
          boardLines.push(trimmed);
        }
        return;
      }
      if (calloutLines !== null) {
        if (trimmed === ":::") {
          closeCallout();
        } else {
          calloutLines.push(trimmed);
        }
        return;
      }
      if (practiceLines !== null) {
        if (trimmed === ":::") {
          closePractice();
        } else {
          practiceLines.push(trimmed);
        }
        return;
      }
      if (trimmed === ":::board") {
        closeParagraph();
        closeList();
        boardLines = [];
        return;
      }
      const calloutStart = /^:::(point|mistake|check)(?:\s+([a-zA-Z0-9_-]+))?$/.exec(trimmed);
      if (calloutStart) {
        closeParagraph();
        closeList();
        calloutType = calloutStart[1];
        calloutId = calloutStart[2] || null;
        calloutLines = [];
        return;
      }
      if (trimmed === ":::practice") {
        closeParagraph();
        closeList();
        practiceLines = [];
        return;
      }
      if (!trimmed) {
        closeParagraph();
        closeList();
        return;
      }

      const heading = /^(#{1,3})\s+(.+)$/.exec(trimmed);
      if (heading) {
        closeParagraph();
        closeList();
        const level = heading[1].length;
        if (level === 1) {
          closePost();
          currentHeading = heading[2];
          title = heading[2];
          return;
        }
        if (level === 2) {
          closePost();
          currentHeading = heading[2];
        }
        output.push("<h" + level + ">" + inlineMarkdown(heading[2]) + "</h" + level + ">");
        return;
      }

      const image = /^!\[([^\]]*)\]\(([^)]+)\)$/.exec(trimmed);
      if (image) {
        closeParagraph();
        closeList();
        const imageSrc = image[2].indexOf("static/") === 0
          ? "modules/foundation/data/" + image[2]
          : image[2];
        if (!avatar) {
          avatar = { src: imageSrc, alt: image[1] };
        } else {
          output.push(
            '<figure class="preparation-image">' +
            '<img src="' + escapeHtml(imageSrc) + '" alt="' + escapeHtml(image[1]) + '">' +
            "</figure>"
          );
        }
        return;
      }

      if (/^---+$/.test(trimmed)) {
        closeParagraph();
        closeList();
        output.push("<hr>");
        return;
      }

      const unordered = /^-\s+(.+)$/.exec(trimmed);
      const ordered = /^\d+\.\s+(.+)$/.exec(trimmed);
      if (unordered || ordered) {
        closeParagraph();
        const nextTag = unordered ? "ul" : "ol";
        if (listTag !== nextTag) {
          closeList();
          listTag = nextTag;
          output.push("<" + listTag + ">");
        }
        output.push("<li>" + inlineMarkdown((unordered || ordered)[1]) + "</li>");
        return;
      }

      if (trimmed.indexOf("> ") === 0) {
        closeParagraph();
        closeList();
        output.push("<blockquote>" + inlineMarkdown(trimmed.slice(2)) + "</blockquote>");
        return;
      }

      closeList();
      paragraph.push(inlineMarkdown(trimmed));
    });

    closeParagraph();
    closeList();
    closeBoard();
    closeCallout();
    closePractice();
    closePost();
    return { avatar: avatar, posts: posts, title: title };
  }

  function renderPreparationCheck(lines, explicitId, fallbackIndex) {
    const data = { question: "", choices: [], answer: "", explanation: "" };
    lines.forEach(function (line) {
      const question = /^question:\s*(.+)$/.exec(line);
      const choice = /^choice:\s*([^|]+)\|(.+)$/.exec(line);
      const answer = /^answer:\s*(.+)$/.exec(line);
      const explanation = /^explanation:\s*(.+)$/.exec(line);
      if (question) data.question = question[1].trim();
      else if (choice) data.choices.push({ key: choice[1].trim(), label: choice[2].trim() });
      else if (answer) data.answer = answer[1].trim();
      else if (explanation) data.explanation = explanation[1].trim();
    });

    const safeId = String(explicitId || "check-" + fallbackIndex).replace(/[^a-zA-Z0-9_-]/g, "-");
    if (!data.question || data.choices.length < 2 || !data.answer || !data.explanation) {
      return (
        '<aside class="prep-callout prep-check" role="note">' +
        '<div class="prep-callout-label">10秒確認</div>' +
        '<div class="prep-callout-content">' +
        lines.map(function (line) { return inlineMarkdown(line); }).join("<br>") +
        "</div></aside>"
      );
    }

    const questionId = safeId + "-question";
    return (
      '<section class="prep-callout prep-check prep-check-interactive" data-check-id="' + escapeHtml(safeId) +
      '" data-answer="' + escapeHtml(data.answer) + '" aria-labelledby="' + escapeHtml(questionId) + '">' +
      '<div class="prep-callout-label">10秒確認</div>' +
      '<fieldset class="prep-check-fieldset">' +
      '<legend class="prep-check-question" id="' + escapeHtml(questionId) + '">' + inlineMarkdown(data.question) + '</legend>' +
      '<div class="prep-check-options">' +
      data.choices.map(function (choice) {
        return '<button type="button" class="prep-check-choice" data-choice="' + escapeHtml(choice.key) +
          '" aria-pressed="false"><span class="prep-check-choice-key">' + escapeHtml(choice.key) +
          '</span><span>' + inlineMarkdown(choice.label) + '</span></button>';
      }).join("") +
      "</div></fieldset>" +
      '<div class="prep-check-feedback" aria-live="polite"></div>' +
      '<div class="prep-check-explanation" hidden><strong>判断の理由</strong><p>' +
      inlineMarkdown(data.explanation) + "</p></div>" +
      "</section>"
    );
  }

  function preparationPostMeta(post, numberedIndex, totalNumbered) {
    if (post.kind === "check") return "10秒確認";
    const numbered = /^(\d+)\./.exec(post.heading);
    if (numbered) return numberedIndex + " / " + totalNumbered;
    if (post.heading === "教授からの課題") return "課題";
    return "予習スレッド";
  }

  function preparationGuidance(lesson, title) {
    return PREPARATION_GUIDANCE[lesson.id] || {
      goal: title + "の要点を、例文の判断手順に沿って確認する",
      minutes: "約5分",
    };
  }

  function preparationSegmentLabel(post, index) {
    if (post.kind === "check") return "10秒確認：" + post.heading;
    if (post.heading === "教授からの課題") return "課題";
    if (/^\d+\./.test(post.heading)) return post.heading;
    return index === 0 ? "導入" : "確認";
  }

  function buildPreparationHeader(lesson, parsed, progress, totalChecks) {
    const guidance = preparationGuidance(lesson, parsed.title || lesson.title);
    const header = el("section", {
      class: "preparation-header card",
      "aria-labelledby": "preparation-heading",
    });
    const heading = el("h1", { id: "preparation-heading" }, parsed.title || lesson.title);
    const goal = el("p", { class: "preparation-header-goal" }, "今日のゴール：" + guidance.goal);
    const meta = el("div", { class: "preparation-header-meta" }, [
      el("span", {}, "目安 " + guidance.minutes),
      el("span", {}, parsed.posts.length + "投稿"),
    ]);
    const progressTitle = el("span", { class: "preparation-progress-title" }, "読み進める");
    const progressLabel = el("strong", { class: "preparation-progress-label" }, "0 / " + parsed.posts.length);
    const checkLabel = el("span", { class: "preparation-check-label" }, "確認 0 / " + totalChecks);
    const progressSummary = el("div", { class: "preparation-progress-summary" }, [
      progressTitle,
      progressLabel,
      checkLabel,
    ]);
    const segments = el("div", {
      class: "preparation-progress-segments",
      role: "list",
      "aria-label": "予習資料の投稿進捗",
    });
    const segmentButtons = parsed.posts.map(function (post, index) {
      const segment = el("button", {
        class: "preparation-progress-segment",
        type: "button",
        "aria-label": (index + 1) + " / " + parsed.posts.length + "：" + preparationSegmentLabel(post, index),
      }, [el("span", { "aria-hidden": "true" })]);
      segments.appendChild(el("div", { role: "listitem" }, [segment]));
      return segment;
    });
    const progressContainer = el("div", { class: "preparation-progress" }, [progressSummary, segments]);
    const actions = el("div", { class: "preparation-header-actions" });
    let resumeButton = null;
    if (progress.postIndex >= 1) {
      resumeButton = el("button", {
        class: "btn btn-secondary preparation-resume-button",
        type: "button",
      }, "前回の続き（" + (progress.postIndex + 1) + " / " + parsed.posts.length + "）から読む");
      actions.appendChild(resumeButton);
    }
    header.append(heading, goal, meta, progressContainer, actions);
    return {
      header: header,
      progressLabel: progressLabel,
      checkLabel: checkLabel,
      segments: segmentButtons,
      resumeButton: resumeButton,
    };
  }

  function renderPreparation(lesson) {
    const path = prepPath(lesson);
    stopPreparationTracking();
    state = null;
    app.classList.remove("is-comparison");
    root.innerHTML = "";
    window.scrollTo(0, 0);
    root.appendChild(el(
      "a",
      {
        class: "back-link",
        href: "#",
        onclick: function (event) {
          event.preventDefault();
          renderSetSelect();
        },
      },
      "← 学習ルートに戻る"
    ));
    const preparationHeader = el("section", { class: "preparation-header card" }, [
      el("p", { class: "preparation-loading" }, "予習資料を読み込んでいます。"),
    ]);
    const thread = el("div", { class: "thread preparation-card card", "aria-label": "予習スレッド" }, [
      el("p", { class: "preparation-loading" }, "予習資料を読み込んでいます。"),
    ]);
    root.append(preparationHeader, thread);
    fetch("modules/foundation/" + path, { cache: "no-store" })
      .then(function (response) {
        if (!response.ok) throw new Error("Preparation material request failed");
        return response.text();
      })
      .then(function (markdown) {
        const charLimit = PREPARATION_POST_CHAR_LIMIT;
        const parsed = parsePreparationMarkdown(markdown, charLimit);
        const totalNumbered = parsed.posts.filter(function (post) {
          return post.kind !== "check" && /^\d+\./.test(post.heading);
        }).length;
        if (!root.contains(thread)) return;
        thread.innerHTML = "";
        lastPreparationOpen = {
          lessonId: lesson.id,
          openedAt: Date.now(),
        };
        recordLearningEvent("preparation_viewed", {
          setId: SELECTABLE_SET_ID,
          lessonId: lesson.id,
        });
        let numberedIndex = 0;
        parsed.posts.forEach(function (post, postIndex) {
          if (post.kind !== "check" && /^\d+\./.test(post.heading)) numberedIndex += 1;
          thread.appendChild(el("article", {
            class: "thread-post",
            "data-post-index": String(postIndex),
            "aria-label": (postIndex + 1) + " / " + parsed.posts.length + "：" + preparationSegmentLabel(post, postIndex),
          }, [
            el("div", { class: "thread-post-avatar" }, [
              parsed.avatar ? el("img", { src: parsed.avatar.src, alt: parsed.avatar.alt }) : null,
              el("div", { class: "thread-post-line", "aria-hidden": "true" }),
            ]),
            el("div", { class: "thread-post-body" }, [
              el("div", { class: "thread-post-header" }, [
                el("span", { class: "thread-post-name" }, "ハリネズミ教授"),
                el("span", { class: "thread-post-dot", "aria-hidden": "true" }, "・"),
                el("span", { class: "thread-post-meta" }, preparationPostMeta(post, numberedIndex, totalNumbered)),
              ]),
              el("div", { class: "thread-post-content", html: post.html }),
            ]),
          ]));
        });
        const progress = loadPreparationLessonProgress(lesson.id);
        const totalChecks = thread.querySelectorAll(".prep-check-interactive").length;
        const headerParts = buildPreparationHeader(lesson, parsed, progress, totalChecks);
        preparationHeader.replaceWith(headerParts.header);
        const postElements = Array.from(thread.querySelectorAll(".thread-post"));
        let currentPostIndex = progress.postIndex >= 0 ? Math.min(progress.postIndex, postElements.length - 1) : 0;
        let scrollFrame = null;

        function answeredCheckCount() {
          return Array.from(thread.querySelectorAll(".prep-check-interactive")).filter(function (check) {
            return Boolean(progress.checks[check.dataset.checkId]);
          }).length;
        }

        function updatePreparationHeader() {
          const reached = progress.postIndex >= 0 ? progress.postIndex + 1 : 0;
          headerParts.progressLabel.textContent = reached + " / " + postElements.length;
          headerParts.checkLabel.textContent = "確認 " + answeredCheckCount() + " / " + totalChecks;
          headerParts.segments.forEach(function (segment, index) {
            segment.classList.toggle("is-reached", index <= progress.postIndex);
            segment.classList.toggle("is-current", index === currentPostIndex);
            if (index === currentPostIndex) segment.setAttribute("aria-current", "step");
            else segment.removeAttribute("aria-current");
          });
        }

        function markPreparationPostRead(index) {
          const safeIndex = Math.min(Math.max(index, 0), postElements.length - 1);
          currentPostIndex = safeIndex;
          if (safeIndex > progress.postIndex) {
            progress.postIndex = safeIndex;
            progress.completedAt = safeIndex === postElements.length - 1 ? new Date().toISOString() : null;
            progress.updatedAt = new Date().toISOString();
            savePreparationLessonProgress(lesson.id, progress);
            recordLearningEvent("preparation_progressed", {
              setId: SELECTABLE_SET_ID,
              lessonId: lesson.id,
              postIndex: safeIndex,
              postCount: postElements.length,
            });
          }
          updatePreparationHeader();
        }

        function visiblePostIndex() {
          if (!postElements.length) return 0;
          if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 4) {
            return postElements.length - 1;
          }
          const marker = Math.max(120, window.innerHeight * 0.3);
          let visible = 0;
          postElements.forEach(function (post, index) {
            if (post.getBoundingClientRect().top <= marker) visible = index;
          });
          return visible;
        }

        function scheduleProgressUpdate() {
          if (scrollFrame !== null) return;
          scrollFrame = window.requestAnimationFrame(function () {
            scrollFrame = null;
            markPreparationPostRead(visiblePostIndex());
          });
        }

        function scrollToPost(index) {
          const post = postElements[index];
          if (!post) return;
          post.scrollIntoView({ behavior: "smooth", block: "start" });
        }

        headerParts.segments.forEach(function (segment, index) {
          segment.addEventListener("click", function () { scrollToPost(index); });
        });
        if (headerParts.resumeButton) {
          headerParts.resumeButton.addEventListener("click", function () {
            scrollToPost(Math.min(progress.postIndex, postElements.length - 1));
          });
        }

        thread.querySelectorAll(".prep-check-interactive").forEach(function (check) {
          const checkId = check.dataset.checkId;
          const answer = check.dataset.answer;
          const choices = Array.from(check.querySelectorAll(".prep-check-choice"));
          const feedback = check.querySelector(".prep-check-feedback");
          const explanation = check.querySelector(".prep-check-explanation");

          function applyCheck(choice, shouldSave) {
            const correct = choice === answer;
            choices.forEach(function (button) {
              const buttonChoice = button.dataset.choice;
              button.disabled = true;
              button.setAttribute("aria-pressed", buttonChoice === choice ? "true" : "false");
              button.classList.remove("is-correct", "is-incorrect", "is-muted");
              const oldIcon = button.querySelector(".prep-check-result-icon");
              if (oldIcon) oldIcon.remove();
              if (buttonChoice === answer) {
                button.classList.add("is-correct");
                button.appendChild(el("span", { class: "prep-check-result-icon", "aria-hidden": "true" }, "○"));
              } else if (buttonChoice === choice) {
                button.classList.add("is-incorrect");
                button.appendChild(el("span", { class: "prep-check-result-icon", "aria-hidden": "true" }, "✕"));
              } else {
                button.classList.add("is-muted");
              }
            });
            check.classList.add("is-answered");
            feedback.textContent = correct
              ? "○ 正解。判断の理由を確認しましょう。"
              : "✕ 不正解。正解の選択肢を確認しましょう。";
            explanation.hidden = false;
            if (shouldSave) {
              progress.checks[checkId] = {
                choice: choice,
                correct: correct,
                answeredAt: new Date().toISOString(),
              };
              const parentPost = check.closest(".thread-post");
              if (parentPost) markPreparationPostRead(Number(parentPost.dataset.postIndex));
              progress.updatedAt = new Date().toISOString();
              savePreparationLessonProgress(lesson.id, progress);
              recordLearningEvent("preparation_check_answered", {
                setId: SELECTABLE_SET_ID,
                lessonId: lesson.id,
                checkId: checkId,
                choice: choice,
                correct: correct,
              });
              updatePreparationHeader();
            }
          }

          choices.forEach(function (button) {
            button.addEventListener("click", function () { applyCheck(button.dataset.choice, true); });
          });
          const savedCheck = progress.checks[checkId];
          if (savedCheck && savedCheck.choice) applyCheck(savedCheck.choice, false);
        });

        function handleScroll() {
          scheduleProgressUpdate();
        }
        window.addEventListener("scroll", handleScroll, { passive: true });
        window.addEventListener("pagehide", handleScroll);
        markPreparationPostRead(currentPostIndex);
        cleanupPreparationTracking = function () {
          window.removeEventListener("scroll", handleScroll);
          window.removeEventListener("pagehide", handleScroll);
          if (scrollFrame !== null) window.cancelAnimationFrame(scrollFrame);
          scrollFrame = null;
        };
        thread.querySelectorAll(".preparation-practice-link").forEach(function (link) {
          link.addEventListener("click", function (event) {
            event.preventDefault();
            startLesson(SELECTABLE_SET_ID, lesson.id);
          });
        });
      })
      .catch(function () {
        thread.innerHTML = "<p>予習資料を読み込めませんでした。学習ルートに戻って、もう一度開いてください。</p>";
      });
  }

  function questionsForLesson(setId, lessonId) {
    return DATA.questions.filter(function (q) {
      return q.setId === setId && q.lessonId === lessonId;
    }).slice().sort(function (a, b) {
      const preferredOrder = LESSON_QUESTION_ORDER[lessonId];
      if (preferredOrder) {
        const aPreferredIndex = preferredOrder.indexOf(String(a.id));
        const bPreferredIndex = preferredOrder.indexOf(String(b.id));
        const aRank = aPreferredIndex === -1 ? 999 : aPreferredIndex;
        const bRank = bPreferredIndex === -1 ? 999 : bPreferredIndex;
        if (aRank !== bRank) return aRank - bRank;
      }
      // Stage first, then difficulty inside a stage, so a unit runs from the
      // basics to the exam patterns without doubling back.
      const stageDiff = rank(STAGE_ORDER, a.stage) - rank(STAGE_ORDER, b.stage);
      if (stageDiff !== 0) return stageDiff;
      const levelDiff = rank(DIFFICULTY_ORDER, a.difficulty) - rank(DIFFICULTY_ORDER, b.difficulty);
      if (levelDiff !== 0) return levelDiff;
      return String(a.id).localeCompare(String(b.id), undefined, { numeric: true });
    });
  }

  function restoreLesson(session) {
    const baseQuestions = questionsForLesson(session.setId, session.lessonId);
    const questionById = new Map(baseQuestions.map(function (question) {
      return [String(question.id), question];
    }));
    const questions = session.questionIds.map(function (id) {
      return questionById.get(String(id));
    }).filter(Boolean);
    if (!questions.length || questions.length !== session.questionIds.length) {
      startLesson(SELECTABLE_SET_ID, session.lessonId);
      return;
    }
    const missed = (Array.isArray(session.missed) ? session.missed : []).map(function (item) {
      const question = questionById.get(String(item.questionId));
      return question ? { question: question, chosenIndex: item.chosenIndex } : null;
    }).filter(Boolean);
    const lesson = lessonForId(session.lessonId);
    state = {
      setId: session.setId,
      lessonId: session.lessonId,
      lesson: lesson,
      questions: questions,
      index: Math.min(Math.max(Number(session.index || 0), 0), questions.length - 1),
      correctCount: Math.max(Number(session.correctCount || 0), 0),
      missed: missed,
      answered: Boolean(session.answered && Number.isInteger(session.selectedIndex)),
      selectedIndex: Number.isInteger(session.selectedIndex) ? session.selectedIndex : null,
      choiceListEl: null,
      startedAt: session.startedAt || Date.now(),
      questionShownAt: null,
      preparationViewed: Boolean(session.preparationViewed),
    };
    recordLearningEvent("lesson_resumed", {
      setId: state.setId,
      lessonId: state.lessonId,
      questionNumber: state.index + 1,
      questionCount: state.questions.length,
      answered: state.answered,
    });
    renderQuestion({ restoreAnswered: state.answered });
  }

  function startLesson(setId, lessonId) {
    stopPreparationTracking();
    const questions = questionsForLesson(setId, lessonId);
    const preparationProgress = loadPreparationLessonProgress(lessonId);
    const preparationViewed = Boolean(
      (lastPreparationOpen && lastPreparationOpen.lessonId === lessonId)
      || preparationProgress.postIndex >= 0
    );
    recordLearningEvent("lesson_started", {
      setId: setId,
      lessonId: lessonId,
      questionCount: questions.length,
      preparationViewed: preparationViewed,
    });
    state = {
      setId: setId,
      lessonId: lessonId,
      lesson: learningLessons().find(function (item) {
        return item.id === lessonId;
      }),
      questions: questions,
      index: 0,
      correctCount: 0,
      missed: [],
      answered: false,
      selectedIndex: null,
      choiceListEl: null,
      startedAt: Date.now(),
      questionShownAt: null,
      preparationViewed: preparationViewed,
    };
    saveSession();
    renderQuestion();
  }

  function questionLabel(question) {
    return [question.prompt, question.sentence]
      .filter(function (part) { return part; })
      .join(" ")
      .replace(/_{3,}/, "____");
  }

  function goBackToUnits() {
    if (window.confirm("学習ルートに戻りますか？ここまでの回答は保存され、あとで途中から再開できます。")) {
      renderSetSelect();
    }
  }

  function renderQuestion(options) {
    app.classList.remove("is-comparison");
    const questions = state.questions;
    const index = state.index;
    const q = questions[index];
    const restoreAnswered = Boolean(
      options
        && options.restoreAnswered
        && Number.isInteger(state.selectedIndex)
        && state.selectedIndex >= 0
        && state.selectedIndex < q.choices.length
    );
    root.innerHTML = "";
    state.answered = restoreAnswered;
    if (!restoreAnswered) state.selectedIndex = null;
    state.questionShownAt = Date.now();
    recordLearningEvent("question_presented", {
      setId: state.setId,
      lessonId: state.lessonId,
      questionId: q.id,
      questionNumber: index + 1,
      stage: q.stage,
      difficulty: q.difficulty,
      target: q.target,
    });

    root.appendChild(
      el(
        "a",
        {
          class: "back-link",
          href: "#",
          onclick: function (e) {
            e.preventDefault();
            goBackToUnits();
          },
        },
        "← 学習ルートに戻る"
      )
    );

    root.appendChild(
      el("div", { class: "progress-row" }, [
        el("div", { class: "progress-track" }, [
          el("div", {
            class: "progress-fill",
            style: "width:" + (index / questions.length) * 100 + "%",
          }),
        ]),
        el("div", { class: "progress-label" }, index + 1 + " / " + questions.length),
      ])
    );
    root.appendChild(el("p", { class: "keyboard-hint" }, "1〜4で選択・Enterで次へ"));

    const card = el("div", { class: "question-card card" });
    card.appendChild(
      el("div", { class: "question-tags" }, [
        el("span", { class: "tag" }, state.lesson ? state.lesson.title : unitTitle(q.unit)),
        el("span", { class: "tag" }, q.stage),
        el("span", { class: "tag" }, q.difficulty),
      ])
    );
    if (q.prompt) {
      card.appendChild(el("p", { class: "question-prompt" }, q.prompt));
    }
    if (q.sentence) {
      const sentenceHtml = escapeHtml(q.sentence).replace(
        /_{3,}/,
        '<span class="blank">____</span>'
      );
      card.appendChild(el("p", { class: "question-sentence", html: sentenceHtml }));
    }
    root.appendChild(card);

    const choiceList = el("div", { class: "choice-list" });
    q.choices.forEach(function (choice, i) {
      const btn = el(
        "button",
        { class: "choice-btn", onclick: function () { selectChoice(i); } },
        [el("span", { class: "choice-letter" }, LETTERS[i]), el("span", {}, choice)]
      );
      choiceList.appendChild(btn);
    });
    root.appendChild(choiceList);
    state.choiceListEl = choiceList;

    if (restoreAnswered) {
      const buttons = Array.prototype.slice.call(choiceList.children);
      const correct = state.selectedIndex === q.answerIndex;
      buttons.forEach(function (btn, idx) {
        btn.disabled = true;
        if (idx === q.answerIndex) {
          btn.classList.add("is-correct");
          btn.appendChild(el("span", { class: "choice-result-icon" }, "○"));
        } else if (idx === state.selectedIndex) {
          btn.classList.add("is-incorrect");
          btn.appendChild(el("span", { class: "choice-result-icon" }, "✕"));
        } else {
          btn.classList.add("is-muted");
        }
      });
      renderFeedback(q, correct);
    } else if (choiceList.firstChild) {
      choiceList.firstChild.focus();
      saveSession();
    }
  }

  function selectChoice(i) {
    if (!state || state.answered) return;
    state.answered = true;
    state.selectedIndex = i;
    const q = state.questions[state.index];
    const buttons = Array.prototype.slice.call(state.choiceListEl.children);
    const correct = i === q.answerIndex;
    recordLearningEvent("question_answered", {
      setId: state.setId,
      lessonId: state.lessonId,
      questionId: q.id,
      questionNumber: state.index + 1,
      stage: q.stage,
      difficulty: q.difficulty,
      target: q.target,
      selectedIndex: i,
      answerIndex: q.answerIndex,
      correct: correct,
      responseMs: state.questionShownAt ? Date.now() - state.questionShownAt : null,
    });

    buttons.forEach(function (btn, idx) {
      btn.disabled = true;
      if (idx === q.answerIndex) {
        btn.classList.add("is-correct");
        btn.appendChild(el("span", { class: "choice-result-icon" }, "○"));
      } else if (idx === i) {
        btn.classList.add("is-incorrect");
        btn.appendChild(el("span", { class: "choice-result-icon" }, "✕"));
      } else {
        btn.classList.add("is-muted");
      }
    });

    if (correct) {
      state.correctCount += 1;
    } else {
      state.missed.push({ question: q, chosenIndex: i });
    }

    saveSession();
    renderFeedback(q, correct);
  }

  function renderFeedback(q, correct) {
    const panel = el("div", {
      class: "feedback-panel " + (correct ? "correct" : "incorrect"),
    });
    panel.appendChild(
      el(
        "p",
        { class: "feedback-heading" },
        correct ? "○ 正解" : "✕ 不正解(正答: " + LETTERS[q.answerIndex] + ")"
      )
    );
    panel.appendChild(el(
      "p",
      { class: "feedback-target" },
      "今回の判断: " + (q.target || (state.lesson ? state.lesson.title : unitTitle(q.unit)) + "の基本判断")
    ));
    const list = el("ul", { class: "explanation-list" });
    q.explanation.forEach(function (line) {
      list.appendChild(el("li", {}, line));
    });
    panel.appendChild(list);
    if (q.misconceptions) {
      panel.appendChild(el("p", { class: "misconceptions" }, "誤答の焦点: " + q.misconceptions));
    }
    if (q.ruleRefs) {
      panel.appendChild(el("p", { class: "rule-refs" }, "根拠: " + q.ruleRefs));
    }
    root.appendChild(panel);

    const isLast = state.index === state.questions.length - 1;
    const nextBtn = el(
      "button",
      {
        class: "btn btn-primary",
      onclick: isLast ? finishLesson : nextQuestion,
      },
      isLast ? "結果を見る" : "次の問題へ"
    );
    root.appendChild(el("div", { class: "btn-row" }, [nextBtn]));
    nextBtn.focus();
  }

  function nextQuestion() {
    state.index += 1;
    state.selectedIndex = null;
    renderQuestion();
  }

  function finishLesson() {
    recordLearningEvent("lesson_finished", {
      setId: state.setId,
      lessonId: state.lessonId,
      correct: state.correctCount,
      total: state.questions.length,
      rate: Math.round((state.correctCount / state.questions.length) * 100),
      preparationViewed: state.preparationViewed,
      durationMs: state.startedAt ? Date.now() - state.startedAt : null,
    });
    saveScore(state.setId, state.lessonId, state.correctCount, state.questions.length);
    renderResult();
  }

  function renderResult() {
    root.innerHTML = "";
    const total = state.questions.length;
    const correct = state.correctCount;
    const rate = Math.round((correct / total) * 100);

    root.appendChild(
      el("div", { class: "result-banner" }, [
        el("p", { class: "result-score" }, correct + " / " + total),
        el(
          "p",
          { class: "result-rate" },
          "正答率 " + rate + "%・" + (state.lesson ? state.lesson.title : state.lessonId)
        ),
      ])
    );

    if (state.missed.length > 0) {
      const missedList = el("div", { class: "missed-list" });
      state.missed.forEach(function (m) {
        const question = m.question;
        const chosenIndex = m.chosenIndex;
        const details = el("details", { class: "missed-item card" });
        details.appendChild(
          el("summary", {}, questionLabel(question))
        );
        const body = el("div", {}, [
          el(
            "p",
            {},
            "あなたの回答: " +
              LETTERS[chosenIndex] +
              ". " +
              question.choices[chosenIndex] +
              " / 正答: " +
              LETTERS[question.answerIndex] +
              ". " +
              question.choices[question.answerIndex]
          ),
        ]);
        const list = el("ul", { class: "explanation-list" });
        question.explanation.forEach(function (line) {
          list.appendChild(el("li", {}, line));
        });
        body.appendChild(list);
        details.appendChild(body);
        missedList.appendChild(details);
      });
      root.appendChild(missedList);
    } else {
      root.appendChild(el("div", { class: "empty-missed card" }, "全問正解でした。"));
    }

    const nextLesson = lessonAfter(state.lessonId);
    const resultActions = [];
    if (nextLesson) {
      resultActions.push(el(
        "button",
        {
          class: "btn cta",
          onclick: function () { renderPreparation(nextLesson); },
        },
        "次の予習資料へ: " + nextLesson.title
      ));
    } else {
      resultActions.push(el("button", { class: "btn cta", onclick: renderSetSelect }, "学習ルートへ"));
    }
    resultActions.push(
      el("button", { class: "btn ghost", onclick: renderSetSelect }, "学習ルートを見る"),
      el(
        "button",
        { class: "btn ghost", onclick: function () { startLesson(state.setId, state.lessonId); } },
        "もう一度このセクション"
      )
    );
    root.appendChild(el("div", { class: "btn-row result-actions" }, resultActions));
  }

  function onKeydown(e) {
    if (!state || !state.choiceListEl) return;
    if (!state.answered) {
      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= 4) {
        const idx = num - 1;
        if (state.choiceListEl.children[idx]) selectChoice(idx);
      }
    } else if (e.key === "Enter") {
      const nextBtn = root.querySelector(".btn-row .btn-primary");
      if (nextBtn) nextBtn.click();
    }
  }

  document.addEventListener("keydown", onKeydown);

  try {
    const response = await fetch(DATA_URL, { cache: "no-store" });
    if (!response.ok) throw new Error("問題データの読み込みに失敗しました。");
    DATA = await response.json();
    renderSetSelect();
  } catch (err) {
    root.innerHTML = "<p>問題データの読み込みに失敗しました。</p>";
    console.error(err);
  }

  return {
    unmount() {
      stopPreparationTracking();
      document.removeEventListener("keydown", onKeydown);
      state = null;
      app.classList.remove("app", "is-comparison");
    },
  };
}
