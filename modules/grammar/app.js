import { CONTENT_VERSION as FOUNDATION_CONTENT_VERSION } from "../foundation/status.js";

"use strict";
/* 英文法演習（統合アプリのモジュール）。
   出題・採点・ステップ判定のロジックは統合前から変更していない。
   変えたのは「生徒識別」「進捗の保存先」「他モジュールへの導線」の3点だけ。
   生徒名簿とSupabase同期は shared/identity.js と shared/shell.js が持つ。 */

const VIEW_URL = "modules/grammar/view.html";
const DATA_URL = "modules/grammar/data/polaris_questions.json";

/* 統合前は document 全体を探していた。いまは自分がマウントされた範囲だけを見る。 */
let viewRoot = document;
let ctx = null;
const $ = (selector, scope = viewRoot) => scope.querySelector(selector);
const $$ = (selector, scope = viewRoot) => Array.from(scope.querySelectorAll(selector));

const KEYS = ["ア", "イ", "ウ", "エ"];
const SPACED_REVIEW_DAYS = [1, 3, 7, 14];
const QUIZ_SESSION_VERSION = 1;
const FOUNDATION_STAGE_COUNT = 5;
const UNIT_SOURCES = {
  unit01: "中部大学 工/経営情報/国際関係など",
  unit02: "札幌学院大学 法/経済/経営/社会情報",
  unit03: "神奈川大学 法/経済/経営/外国語など",
  unit04: "北海学園大学 経済/人文/工",
  unit05: "芝浦工業大学 工/システム理工/デザイン工",
  unit06: "九州国際大学 法/経済/国際関係",
  unit07: "玉川大学 教育/芸術/リベラルアーツなど",
  unit08: "成城大学 経済",
  unit09: "東京経済大学 経済/経営/コミュニケーションなど",
  unit10: "東京電機大学 未来科学/工/理工/情報環境"
};

let questionData = { source: {}, units: [], questions: [] };
const DOMAIN_LABELS = {
  foundation: "品詞・句・節・文の要素", pattern: "文型・自他動詞", verb_form: "動詞の形・主語との一致",
  tense: "時制・完了形・進行形", modal: "助動詞", passive: "受動態", infinitive: "不定詞", gerund: "動名詞",
  participle: "分詞・分詞構文", comparison: "比較", relative: "関係詞", conjunction: "接続詞・節",
  subjunctive: "仮定法", nouns: "名詞・冠詞・代名詞", adverb: "形容詞・副詞", preposition: "前置詞",
  negation: "否定文・疑問文・間接疑問"
};
let progress = {};
let selected = { unitId: "", setId: "", mode: "setAll" };
let quiz = null;

const MODE_HELP = {
  setAll: "選択したセットの10問を出題します。",
  tenTest: "収録済みの全問題からランダムに10問を出題します。"
};

const MODE_TITLE = {
  setAll: "このセットを解く",
  tenTest: "実力チェック",
  review: "苦手だけ復習"
};

const MASTER_TARGET = 30;
const RECENT_STEP3_LIMIT = 10;

function esc(value) {
  return String(value ?? "").replace(/[&<>"]/g, ch => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;"
  }[ch]));
}

async function loadJson(path) {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) throw new Error(`${path}: ${response.statusText}`);
  return response.json();
}

/* 共有URL認証・クラウド保存・生徒名簿は shared/ が一括で持つようになった。
   統合前はこのファイルが独自にSupabase RPCを叩いており、
   基礎チェック・英文解釈とは別の app 値・別の生徒概念で保存していた。 */

function unitSource(unit) {
  return unit?.source || UNIT_SOURCES[unit?.id] || "出題元未登録";
}

function activeStudent() {
  return ctx.identity.active();
}

/* 進捗は統合ストア経由。生徒の切り替えとクラウド保存はシェルが受け持つ。 */
function loadProgress() {
  const saved = ctx.store.get();
  progress = saved && typeof saved === "object" && !Array.isArray(saved) ? saved : {};
}

function saveProgress() {
  ctx.store.set(progress);
}

function storedQuizSession() {
  const saved = progress?.__session;
  if (!saved || typeof saved !== "object" || saved.version !== QUIZ_SESSION_VERSION) return null;
  return saved;
}

function serializeQuizSession() {
  if (!quiz) return null;
  return {
    version: QUIZ_SESSION_VERSION,
    kind: quiz.kind,
    mode: quiz.mode || "",
    globalReview: Boolean(quiz.globalReview),
    poolIds: Array.isArray(quiz.pool) ? quiz.pool.map(question => question.id) : [],
    index: Number.isInteger(quiz.index) ? quiz.index : 0,
    answered: Boolean(quiz.answered),
    selectedChoice: Number.isInteger(quiz.selectedChoice) ? quiz.selectedChoice : null,
    currentQuestionId: quiz.currentQuestion?.id || null,
    streak: Number(quiz.streak || 0),
    recentIds: Array.isArray(quiz.recentIds) ? quiz.recentIds.slice(0, RECENT_STEP3_LIMIT) : [],
    correctCount: Number(quiz.correctCount || 0),
    wrongCount: Number(quiz.wrongCount || 0),
    updatedAt: new Date().toISOString()
  };
}

function saveQuizSession() {
  const saved = serializeQuizSession();
  if (!saved) return;
  progress.__session = saved;
  saveProgress();
}

function clearQuizSession() {
  if (!progress.__session) return;
  delete progress.__session;
  saveProgress();
}

function quizSessionTitle(saved) {
  if (saved.kind === "step1") return saved.mode === "step1Wrong" ? "誤答演習" : "UNIT演習";
  if (saved.kind === "step2") return "Step 2 ランダム制覇";
  if (saved.kind === "step3") return "Step 3 最終確認";
  if (saved.kind === "spaced") return "今日の間隔復習";
  if (saved.globalReview) return "誤答復習";
  return "自由演習";
}

function resumeQuizAction() {
  const saved = storedQuizSession();
  if (!saved) return null;
  const total = saved.kind === "step3" ? MASTER_TARGET : saved.poolIds?.length || 0;
  const current = saved.kind === "step3" ? `${saved.streak || 0}/${MASTER_TARGET}` : `${Math.min((saved.index || 0) + 1, total)}/${total}`;
  const stateLabel = saved.answered ? "解説を確認して続ける" : `${current}から再開`;
  return {
    kind: "resume",
    label: `▶ ${stateLabel} — ${quizSessionTitle(saved)}`
  };
}

function restoreQuizSession() {
  if (!foundationUnlocked()) {
    ctx.navigate("foundation");
    return false;
  }
  const saved = storedQuizSession();
  if (!saved) return false;
  const pool = (saved.poolIds || [])
    .map(id => questionData.questions.find(question => question.id === id))
    .filter(Boolean);
  const currentQuestion = saved.currentQuestionId
    ? questionData.questions.find(question => question.id === saved.currentQuestionId)
    : null;
  if (saved.kind !== "step3" && !pool.length) {
    delete progress.__session;
    saveProgress();
    return false;
  }
  quiz = {
    kind: saved.kind,
    mode: saved.mode,
    globalReview: Boolean(saved.globalReview),
    pool,
    index: Math.max(0, Math.min(Number(saved.index || 0), Math.max(pool.length - 1, 0))),
    answered: Boolean(saved.answered),
    selectedChoice: Number.isInteger(saved.selectedChoice) ? saved.selectedChoice : null,
    currentQuestion: currentQuestion || undefined,
    streak: Number(saved.streak || 0),
    recentIds: Array.isArray(saved.recentIds) ? saved.recentIds : [],
    correctCount: Number(saved.correctCount || 0),
    wrongCount: Number(saved.wrongCount || 0)
  };
  if (quiz.kind === "step3" && !quiz.currentQuestion) {
    clearQuizSession();
    return false;
  }
  renderQuiz();
  setVisible("quizPanel");
  return true;
}

function metaState() {
  if (!progress.__meta || typeof progress.__meta !== "object") {
    progress.__meta = {};
  }
  const meta = progress.__meta;
  if (typeof meta.bestStreak !== "number") meta.bestStreak = 0;
  if (typeof meta.mastered !== "boolean") meta.mastered = false;
  return meta;
}

function stateFor(questionId) {
  if (!progress[questionId]) {
    progress[questionId] = {
      attempts: 0,
      correct: 0,
      wrong: 0,
      lastChoice: null,
      lastAnsweredAt: null,
      cleared: false,
      step1Cleared: false,
      step2Cleared: false,
      step3Correct: 0,
      step3Wrong: 0,
      reviewStage: 0,
      nextReviewAt: null
    };
  }
  const state = progress[questionId];
  if (typeof state.step1Cleared !== "boolean") state.step1Cleared = false;
  if (typeof state.step2Cleared !== "boolean") state.step2Cleared = false;
  if (typeof state.step3Correct !== "number") state.step3Correct = 0;
  if (typeof state.step3Wrong !== "number") state.step3Wrong = 0;
  if (typeof state.reviewStage !== "number") state.reviewStage = 0;
  if (typeof state.nextReviewAt !== "string" && state.nextReviewAt !== null) state.nextReviewAt = null;
  if (state.step2Cleared && !state.nextReviewAt) scheduleInitialReview(state);
  return progress[questionId];
}

function localDateKey(date = new Date()) {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Tokyo" }).format(date);
}

function reviewDateAfter(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return localDateKey(date);
}

function spacedDueQuestions() {
  const today = localDateKey();
  return questionData.questions.filter(question => {
    const state = stateFor(question.id);
    return state.step2Cleared && state.nextReviewAt && state.nextReviewAt <= today;
  });
}

function scheduleInitialReview(state) {
  state.reviewStage = 0;
  state.nextReviewAt = reviewDateAfter(SPACED_REVIEW_DAYS[0]);
}

function updateSpacedReviewState(state, correct) {
  if (!correct) {
    state.reviewStage = 0;
    state.nextReviewAt = reviewDateAfter(1);
    return;
  }
  state.reviewStage = Math.min(state.reviewStage + 1, SPACED_REVIEW_DAYS.length - 1);
  state.nextReviewAt = reviewDateAfter(SPACED_REVIEW_DAYS[state.reviewStage]);
}

function unitById(unitId) {
  return questionData.units.find(unit => unit.id === unitId);
}

function setsFor(unitId) {
  const unit = unitById(unitId);
  return unit ? unit.sets : [];
}

function setById(unitId, setId) {
  return setsFor(unitId).find(set => set.id === setId);
}

function questionsForSet(unitId, setId) {
  return questionData.questions
    .filter(question => question.unitId === unitId && question.setId === setId)
    .sort((a, b) => Number(a.no) - Number(b.no));
}

function step1WrongQuestions(questions) {
  return questions.filter(question => {
    const state = stateFor(question.id);
    return state.wrong > 0 && !state.step1Cleared;
  });
}

function filteredQuestions(unitId, setId) {
  return questionsForSet(unitId, setId);
}

function questionsForUnit(unitId) {
  return questionData.questions
    .filter(question => question.unitId === unitId)
    .sort((a, b) => String(a.setId).localeCompare(String(b.setId)) || Number(a.no) - Number(b.no));
}

function buildQuestionPool() {
  if (selected.mode === "tenTest") return shuffled(questionData.questions).slice(0, 10);
  return shuffled(filteredQuestions(selected.unitId, selected.setId));
}

function stepStats(field, questions = questionData.questions) {
  const total = questions.length;
  const cleared = questions.filter(question => stateFor(question.id)[field]).length;
  return { total, cleared, remaining: Math.max(total - cleared, 0) };
}

function step2Unlocked() {
  return stepStats("step1Cleared").remaining === 0 && questionData.questions.length > 0;
}

function step3Unlocked() {
  return step2Unlocked() && stepStats("step2Cleared").remaining === 0 && questionData.questions.length > 0;
}

/* 画面に同時展開するStepを1つに絞るための「今どこをやるべきか」判定。
   Step1/2/3セクションはこれに応じて自動的に開閉する（他は<details>で畳む）。 */
function currentFocusStep() {
  if (stepStats("step1Cleared").remaining > 0) return 1;
  if (stepStats("step2Cleared").remaining > 0) return 2;
  return 3;
}

function foundationStatus() {
  const history = loadFoundationHistory();
  const stageResults = history?.stageResults || {};
  const completedStages = Array.from({ length: FOUNDATION_STAGE_COUNT }, (_, index) => index + 1)
    .filter(index => stageResults[`stage${index}`]?.completed === true).length;
  return {
    history,
    stageResults,
    completedStages,
    total: FOUNDATION_STAGE_COUNT,
    unlocked: completedStages === FOUNDATION_STAGE_COUNT
  };
}

function foundationUnlocked() {
  return foundationStatus().unlocked;
}

function requireFoundationComplete() {
  if (foundationUnlocked()) return true;
  ctx.navigate("foundation");
  return false;
}

function updateStepCompletionDates() {
  const meta = metaState();
  const now = new Date().toISOString();
  if (!meta.step1CompletedAt && step2Unlocked()) meta.step1CompletedAt = now;
  if (!meta.step2CompletedAt && step3Unlocked()) meta.step2CompletedAt = now;
  if (meta.mastered && !meta.masteredAt) meta.masteredAt = now;
}

function pickStep3Question(recentIds = []) {
  const blocked = new Set(recentIds);
  const candidates = questionData.questions.filter(question => !blocked.has(question.id));
  const pool = candidates.length ? candidates : questionData.questions;
  return pool[Math.floor(Math.random() * pool.length)];
}

function allUnresolvedQuestions() {
  return questionData.questions
    .filter(question => {
      const state = stateFor(question.id);
      return state.wrong > 0 && !state.cleared;
    })
    .sort((a, b) => String(a.unitId).localeCompare(String(b.unitId)) || Number(a.no) - Number(b.no));
}

function shuffled(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function statsFor(questions) {
  const total = questions.length;
  const cleared = questions.filter(question => stateFor(question.id).cleared).length;
  const wrong = questions.filter(question => stateFor(question.id).wrong > 0 && !stateFor(question.id).cleared).length;
  return { total, cleared, wrong, remaining: Math.max(total - cleared, 0) };
}

function setVisible(panel) {
  for (const id of ["homePanel", "quizPanel", "grammarLockPanel"]) {
    $(`#${id}`).classList.toggle("hide", id !== panel);
  }
  $("#mobileCtaBar").classList.toggle("hide", panel !== "homePanel");
}

function renderSelectors() {
  $("#unitSel").innerHTML = questionData.units.map(unit =>
    `<option value="${esc(unit.id)}">${esc(unit.title)}</option>`
  ).join("");
  if (!unitById(selected.unitId)) selected.unitId = questionData.units[0]?.id || "";
  $("#unitSel").value = selected.unitId;

  const sets = setsFor(selected.unitId);
  $("#setSel").innerHTML = sets.map(set =>
    `<option value="${esc(set.id)}">${esc(set.title)}</option>`
  ).join("");
  if (!setById(selected.unitId, selected.setId)) selected.setId = sets[0]?.id || "";
  $("#setSel").value = selected.setId;
  if (!MODE_HELP[selected.mode]) selected.mode = "setAll";
  $("#modeSel").value = selected.mode;
  $("#modeHelp").textContent = MODE_HELP[selected.mode] || "";
}

function progressRatio(stats) {
  return stats.total ? `${stats.cleared}/${stats.total}` : "0/0";
}

function renderMasterPath() {
  const meta = metaState();
  updateStepCompletionDates();
  const step1 = stepStats("step1Cleared");
  const step2 = stepStats("step2Cleared");
  const step2Open = step2Unlocked();
  const step3Open = step3Unlocked();
  const masterLabel = meta.mastered ? "MASTER" : `最高連続正解 ${meta.bestStreak}/${MASTER_TARGET}`;

  $("#masterPath").innerHTML = `
    <div class="masterGrid">
      <a class="stepCard active" data-target="step1Section" href="#step1Section">
        <p class="label">Step 1</p>
        <h3>UNIT演習</h3>
        <div class="stepCount">${progressRatio(step1)}</div>
        <p class="hint">UNITごとに一度正解した問題を積み上げる。</p>
      </a>
      <a class="stepCard ${step2Open ? "active" : "locked"}" data-target="step2Section" href="#step2Section">
        <p class="label">Step 2</p>
        <h3>ランダム制覇</h3>
        <div class="stepCount">${progressRatio(step2)}</div>
        <p class="hint">${step2Open ? "未クリア問題だけをランダム出題。下のヒートマップから始められます。" : "Step 1を全問クリアで解放。"}</p>
      </a>
      <a class="stepCard ${step3Open ? "active" : "locked"} ${meta.mastered ? "mastered" : ""}" data-target="step3Section" href="#step3Section">
        <p class="label">Step 3</p>
        <h3>30問連続正解</h3>
        <div class="stepCount">${masterLabel}</div>
        <p class="hint">${step3Open ? "間違えたら0から続行。30連続で合格。" : "Step 2を全問クリアで解放。"}</p>
      </a>
    </div>
  `;
  $$(".stepCard[data-target]").forEach(card => {
    card.onclick = event => {
      event.preventDefault();
      const target = document.getElementById(card.dataset.target);
      if (!target) return;
      ["step1Section", "step2Section", "step3Section"].forEach(id => {
        const section = document.getElementById(id);
        if (section && "open" in section) section.open = id === card.dataset.target;
      });
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    };
  });
}

function nextAction() {
  const foundation = foundationStatus();
  if (!foundation.unlocked) {
    const nextFoundationStage = Array.from({ length: FOUNDATION_STAGE_COUNT }, (_, index) => index + 1)
      .find(index => foundation.stageResults[`stage${index}`]?.completed !== true) || 1;
    const foundationHistory = loadFoundationHistory();
    const savedFoundation = foundationHistory?.inProgress;
    const savedStage = Number.isInteger(savedFoundation?.stageIndex) ? savedFoundation.stageIndex + 1 : nextFoundationStage;
    const savedQuestion = Number.isInteger(savedFoundation?.index) ? savedFoundation.index + 1 : 1;
    return {
      kind: "foundation",
      resume: Boolean(savedFoundation),
      label: savedFoundation
        ? `▶ 基礎チェックを再開 — 第${savedStage}段階・第${savedQuestion}問`
        : `▶ 基礎から始める — 第${nextFoundationStage}段階`
    };
  }
  for (const unit of questionData.units) {
    for (const set of unit.sets) {
      const questions = questionsForSet(unit.id, set.id);
      const stats = stepStats("step1Cleared", questions);
      if (stats.remaining > 0) {
        const wrongCount = step1WrongQuestions(questions).length;
        const variant = wrongCount > 0 ? "wrongOnly" : "all";
        const label = wrongCount > 0
          ? `▶ つづきから始める — ${unit.title} 誤答${wrongCount}問`
          : `▶ つづきから始める — ${unit.title} 残り${stats.remaining}問`;
        return {
          kind: "step1",
          unitId: unit.id,
          setId: set.id,
          variant,
          label
        };
      }
    }
  }
  const step2Stats = stepStats("step2Cleared");
  if (step2Stats.remaining > 0) {
    return { kind: "step2", label: `▶ つづきから始める — Step 2 残り${step2Stats.remaining}問` };
  }
  const meta = metaState();
  if (meta.mastered) {
    return {
      kind: "reading",
      label: "▶ 英文解釈へ進む — ポラリス完了"
    };
  }
  return {
    kind: "step3",
    label: "▶ つづきから始める — Step 3 チャレンジ"
  };
}

function renderContinueCta() {
  const isLocked = !foundationUnlocked();
  const resume = resumeQuizAction();
  const progressAction = nextAction();
  const dueCount = spacedDueQuestions().length;
  const unresolvedCount = allUnresolvedQuestions().length;
  let action;
  if (progressAction.kind === "foundation") {
    action = progressAction;
  } else if (progressAction.kind === "reading") {
    action = progressAction;
  } else if (resume) {
    action = resume;
  } else if (dueCount > 0) {
    action = { kind: "spaced", label: `▶ 今日の復習を始める — ${dueCount}問` };
  } else if (unresolvedCount > 0) {
    action = { kind: "review", label: `▶ 誤答を復習する — ${unresolvedCount}問` };
  } else {
    action = progressAction;
  }
  const onClick = () => {
    if (action.kind === "resume") {
      if (!restoreQuizSession()) renderHome();
    } else if (action.kind === "foundation") ctx.navigate("foundation");
    else if (action.kind === "step1") startStep1Quiz(action.unitId, action.setId, action.variant);
    else if (action.kind === "step2") startStep2Quiz();
    else if (action.kind === "spaced") startSpacedReview();
    else if (action.kind === "review") startQuiz(true);
    else if (action.kind === "reading") ctx.navigate("reading");
    else startStep3Quiz();
  };
  const hero = $(".hero");
  if (hero) hero.classList.toggle("is-locked", isLocked && action.kind === "foundation");
  const hint = $("#continueHint");
  if (hint) {
    hint.textContent = isLocked && action.kind === "foundation"
      ? "上部の「次にやること」から基礎チェックを始めます。"
      : action.kind === "resume"
      ? "途中保存した問題を続けます。"
      : action.kind === "foundation"
        ? (action.resume ? "保存した途中地点から再開します。" : "まずは基礎チェックを始めます。")
        : action.kind === "reading"
          ? "ポラリス完了。次は文法知識を使って英文の構造を読みます。"
          : "迷った問題を優先して進めます。";
  }
  for (const id of ["continueBtn", "continueBtnMobile"]) {
    const button = $(`#${id}`);
    if (!button) continue;
    button.hidden = isLocked && action.kind === "foundation";
    button.textContent = action.label;
    button.onclick = onClick;
  }
}

function renderHeatmap(enabled) {
  const overall = stepStats("step2Cleared");
  const rows = questionData.units.map(unit => {
    const questions = questionsForUnit(unit.id);
    const stats = stepStats("step2Cleared", questions);
    const cells = questions.map(question => {
      const done = stateFor(question.id).step2Cleared;
      return `
        <button class="heatCell ${done ? "filled" : ""}" type="button" data-question="${esc(question.id)}" ${enabled ? "" : "disabled"} title="${esc(unit.title)} 問${String(question.no).padStart(2, "0")}">
          ${esc(question.no)}
        </button>
      `;
    }).join("");
    return `
      <div class="heatRow">
        <div class="heatLabel">${esc(unit.title)} <span>${stats.cleared}/${stats.total}</span></div>
        <div class="heatCells">${cells}</div>
      </div>
    `;
  }).join("");
  if (!enabled) {
    return `
      <details class="stepSection stepSectionDetails lockedDetails" id="step2Section">
        <summary>
          <span>
            <span class="label">Step 2</span>
            <strong>ランダム制覇マップ</strong>
          </span>
          <span class="lockedReason">Step 1全問クリアで解放</span>
        </summary>
        <div class="stepSectionBody">
          <p class="hint">Step 1のUNIT演習をすべて正解すると、未クリア問題だけのランダム演習が使えます。</p>
        </div>
      </details>
    `;
  }
  const openAttr = currentFocusStep() === 2 ? " open" : "";
  return `
    <details class="stepSection stepSectionDetails heatmap" id="step2Section"${openAttr}>
      <summary>
        <span>
          <span class="label">Step 2</span>
          <strong>ランダム制覇マップ</strong>
        </span>
        <span class="summaryMeta">${progressRatio(overall)}</span>
      </summary>
      <div class="stepSectionBody">
        <p class="hint">正解した問題が埋まります。未クリアな問題からランダムに出題する場合は下のボタンを押してください。マスを押すとその1問だけ確認できます。</p>
        <div class="actions"><button class="cta" id="step2StartBtn" type="button">未クリアからランダムに出題</button></div>
        ${rows}
      </div>
    </details>
  `;
}

function renderStep3Challenge(enabled) {
  const meta = metaState();
  if (!enabled) {
    return `
      <details class="stepSection stepSectionDetails lockedDetails" id="step3Section">
        <summary>
          <span>
            <span class="label">Step 3</span>
            <strong>30問連続正解チャレンジ</strong>
          </span>
          <span class="lockedReason">Step 2全問クリアで解放</span>
        </summary>
        <div class="stepSectionBody">
          <p class="hint">Step 2のランダム制覇を終えると、30問連続正解チャレンジが使えます。</p>
        </div>
      </details>
    `;
  }
  const filled = Math.min(meta.bestStreak, MASTER_TARGET);
  const rows = [0, 10, 20].map(start => {
    const cells = Array.from({ length: 10 }, (_, offset) => {
      const number = start + offset + 1;
      return `<span class="challengeDot ${number <= filled ? "filled" : ""}" aria-label="${number}問目">${number}</span>`;
    }).join("");
    return `
      <div class="challengeTrackRow">
        <div class="challengeTrackLabel">${start + 1}-${start + 10}</div>
        <div class="challengeTrack">${cells}</div>
      </div>
    `;
  }).join("");
  const remaining = Math.max(MASTER_TARGET - filled, 0);
  const openAttr = currentFocusStep() === 3 ? " open" : "";
  return `
    <details class="stepSection stepSectionDetails challengeMap ${meta.mastered ? "mastered" : ""}" id="step3Section"${openAttr}>
      <summary>
        <span>
          <span class="label">Step 3</span>
          <strong>30問連続正解チャレンジ</strong>
        </span>
        <span class="summaryMeta">${meta.mastered ? "MASTER" : `あと ${remaining}`}</span>
      </summary>
      <div class="stepSectionBody">
        <div class="challengeStatus">
          <div>
            <span class="stepCount">${meta.mastered ? "最高記録 達成済" : `最高 ${filled}/${MASTER_TARGET}`}</span>
            <p class="hint">現在の連続正解はセッション内のみ。最高記録は保存されます。</p>
          </div>
          <button class="ghost" id="step3PanelBtn" type="button">Step 3を始める</button>
        </div>
        <div class="challengeTracks">${rows}</div>
      </div>
    </details>
  `;
}

function renderSetList() {
  const step1 = stepStats("step1Cleared");
  $("#progressSummary").textContent = `${activeStudent().name}: Step 1 ${step1.cleared}/${step1.total}`;
  const step1Section = $("#step1Section");
  if (step1Section) step1Section.open = currentFocusStep() === 1;
  const step1SummaryMeta = $("#step1SummaryMeta");
  if (step1SummaryMeta) step1SummaryMeta.textContent = progressRatio(step1);
  const units = questionData.units;
  const cards = [];
  let recommendedKey = "";
  units.forEach(unit => {
    unit.sets.forEach(set => {
      const questions = questionsForSet(unit.id, set.id);
      const stats = stepStats("step1Cleared", questions);
      const wrongCount = step1WrongQuestions(questions).length;
      const cleared = stats.remaining === 0 && stats.total > 0;
      let buttonLabel;
      let variant;
      if (stats.total === 0) {
        buttonLabel = "問題なし";
      } else if (cleared) {
        buttonLabel = "クリア済み（もう一度解く）";
        variant = "all";
      } else if (wrongCount > 0) {
        buttonLabel = `間違えた${wrongCount}問をやり直す`;
        variant = "wrongOnly";
      } else if (stats.cleared > 0) {
        buttonLabel = `残り${stats.remaining}問を解く`;
        variant = "all";
      } else {
        buttonLabel = "UNIT演習をはじめる";
        variant = "all";
      }
      const key = `${unit.id}:${set.id}`;
      const recommended = !recommendedKey && stats.remaining > 0;
      if (recommended) recommendedKey = key;
      cards.push({ key, recommended, html: `
        <div class="itemCard ${cleared ? "done" : ""}">
          <div class="itemMeta">${esc(unit.title)}</div>
          <h3>${esc(set.title)}</h3>
          <p class="sourceLine">${esc(unitSource(unit))}</p>
          <div class="badgeRow">
            <span class="badge ${cleared ? "ok" : "warn"}">Step 1 ${stats.cleared}/${stats.total}</span>
            ${wrongCount ? `<span class="badge warn">誤答 ${wrongCount}</span>` : ""}
          </div>
          <div class="cardActions">
            <button class="startUnitBtn" type="button" data-unit="${esc(unit.id)}" data-set="${esc(set.id)}" data-variant="${variant || ""}" ${stats.total === 0 ? "disabled" : ""}>${esc(buttonLabel)}</button>
          </div>
        </div>
      ` });
    });
  });
  const recommendedCard = cards.find(card => card.recommended) || cards[0];
  const otherCards = cards.filter(card => !recommendedCard || card.key !== recommendedCard.key);
  $("#setList").innerHTML = recommendedCard
    ? `<div class="recommendedUnit"><p class="label">まずここから</p>${recommendedCard.html}</div>
      <details class="otherUnits"><summary>ほかのUNITを選ぶ（${otherCards.length}件）</summary><div class="otherUnitGrid">${otherCards.map(card => card.html).join("")}</div></details>`
    : `<div class="empty">問題データがまだありません。スクショOCR後に data/polaris_questions.json へ追加します。</div>`;

  $$(".startUnitBtn").forEach(button => {
    button.onclick = () => {
      const variant = button.dataset.variant === "wrongOnly" ? "wrongOnly" : "all";
      selected.unitId = button.dataset.unit;
      selected.setId = button.dataset.set;
      selected.mode = "setAll";
      renderHome();
      startStep1Quiz(selected.unitId, selected.setId, variant);
    };
  });

  const step2Open = step2Unlocked();
  $("#step2Heatmap").innerHTML = renderHeatmap(step2Open);
  $$(".heatCell[data-question]").forEach(cell => {
    cell.onclick = () => {
      if (!step2Open) return;
      const question = questionData.questions.find(item => item.id === cell.dataset.question);
      if (question) startStep2Quiz(question);
    };
  });
  const step2StartBtn = $("#step2StartBtn");
  if (step2StartBtn) step2StartBtn.onclick = () => startStep2Quiz();

  const step3Open = step3Unlocked();
  $("#step3Challenge").innerHTML = renderStep3Challenge(step3Open);
  const step3PanelBtn = $("#step3PanelBtn");
  if (step3PanelBtn) step3PanelBtn.onclick = () => startStep3Quiz();
}

function renderHome() {
  renderSelectors();
  renderFoundationDashboard();
  renderGrammarGate();
  if (!foundationUnlocked()) {
    renderContinueCta();
    setVisible("grammarLockPanel");
    return;
  }
  renderContinueCta();
  renderMasterPath();
  renderSetList();
  setVisible("homePanel");
}

/* 統合ストアから基礎チェックの記録を読む。
   統合前はここが localStorage の "grammar-knowledge-check-v2" を直接読んでいたが、
   基礎チェック側の保存キーは "-v3" に上がっており、移行処理も無かった。
   そのため5段階を完走しても解放されず、ダッシュボードも常に空だった。 */
function loadFoundationHistory() {
  const history = ctx.peek("foundation");
  return history?.contentVersion === FOUNDATION_CONTENT_VERSION ? history : null;
}


function renderGrammarGate() {
  const panel = $("#grammarLockPanel");
  if (!panel) return;
  const foundation = foundationStatus();
  if (foundation.unlocked) {
    panel.classList.add("hide");
    return;
  }
  const nextStage = Array.from({ length: foundation.total }, (_, index) => index + 1)
    .find(index => foundation.stageResults[`stage${index}`]?.completed !== true) || foundation.total;
  panel.innerHTML = `
    <p class="label">Grammar / Locked</p>
    <h2>英文法演習は、基礎チェック完了後に解放されます。</h2>
    <p class="hint">現在 ${foundation.completedStages} / ${foundation.total} 段階完了。次は第${nextStage}段階です。</p>
    <div class="actions">
      <button class="ghost" id="foundationGateLink" type="button">基礎チェックを続ける</button>
    </div>
  `;
  panel.classList.remove("hide");
  $("#foundationGateLink").onclick = () => ctx.navigate("foundation");
}

function renderFoundationDashboard() {
  const body = $("#foundationDashboardBody");
  const foundationLink = $("#foundationDashboardLink");
  if (!body || !foundationLink) return;
  foundationLink.onclick = () => ctx.navigate("foundation");

  const history = loadFoundationHistory();
  const stageResults = history?.stageResults || {};
  const completedStages = Object.keys(stageResults).filter(key => /^stage[1-5]$/.test(key) && stageResults[key]?.completed === true).length;
  const answers = [120, 150].includes(history?.total) && Array.isArray(history.answers)
    ? history.answers
    : Object.values(stageResults).flatMap(result => Array.isArray(result.answers) ? result.answers : []);
  const weakDomains = [];
  for (const domain of DOMAIN_LABELS ? Object.keys(DOMAIN_LABELS) : []) {
    const domainAnswers = answers.filter(answer => answer.domain === domain);
    if (!domainAnswers.length) continue;
    const correct = domainAnswers.filter(answer => answer.correct).length;
    const uncertain = domainAnswers.filter(answer => answer.uncertain).length;
    if (correct / domainAnswers.length < 0.8 || uncertain > 0) weakDomains.push(domain);
  }
  const nextStage = [1, 2, 3, 4, 5].find(index => stageResults[`stage${index}`]?.completed !== true);
  const step1 = stepStats("step1Cleared");
  const step2 = stepStats("step2Cleared");
  const meta = metaState();

  if (!history) {
    body.innerHTML = `<p class="hint">基礎知識チェックはまだ開始されていません。まず5段階の基礎確認から始めます。</p>`;
    return;
  }
  body.innerHTML = `
    <div class="dashboardGrid">
      <div><p class="label">FOUNDATION</p><strong>${completedStages} / 5段階</strong><p class="hint">${nextStage ? `次は第${nextStage}段階` : "5段階完了"}</p></div>
      <div><p class="label">POLARIS STEP 1</p><strong>${step1.cleared} / ${step1.total}</strong><p class="hint">UNIT演習</p></div>
      <div><p class="label">POLARIS STEP 2</p><strong>${step2.cleared} / ${step2.total}</strong><p class="hint">${step2.remaining ? "ランダム制覇へ" : (meta.mastered ? "Step 3 MASTER" : "Step 3 挑戦可能")}</p></div>
    </div>
    <p class="hint">${weakDomains.length ? `現在の弱点分野：${weakDomains.slice(0, 4).map(domain => DOMAIN_LABELS[domain]).join("・")}` : "基礎知識の弱点分野はありません。"}</p>
  `;
}

function startStep1Quiz(unitId, setId, variant = "all") {
  if (!requireFoundationComplete()) return;
  const questions = questionsForSet(unitId, setId);
  const pool = variant === "wrongOnly" ? step1WrongQuestions(questions) : questions;
  quiz = {
    kind: "step1",
    mode: variant === "wrongOnly" ? "step1Wrong" : "step1",
    pool: shuffled(pool),
    index: 0,
    answered: false,
    selectedChoice: null,
    correctCount: 0,
    wrongCount: 0
  };
  saveQuizSession();
  renderQuiz();
  setVisible("quizPanel");
}

function startStep2Quiz(singleQuestion = null) {
  if (!requireFoundationComplete()) return;
  const remaining = questionData.questions.filter(question => !stateFor(question.id).step2Cleared);
  const pool = singleQuestion ? [singleQuestion] : (remaining.length ? remaining : questionData.questions);
  quiz = {
    kind: "step2",
    mode: singleQuestion ? "step2Single" : "step2",
    pool: shuffled(pool),
    index: 0,
    answered: false,
    selectedChoice: null,
    correctCount: 0,
    wrongCount: 0
  };
  saveQuizSession();
  renderQuiz();
  setVisible("quizPanel");
}

function startStep3Quiz() {
  if (!requireFoundationComplete()) return;
  quiz = {
    kind: "step3",
    mode: "step3",
    pool: [],
    index: 0,
    answered: false,
    selectedChoice: null,
    currentQuestion: pickStep3Question(),
    streak: 0,
    recentIds: [],
    correctCount: 0,
    wrongCount: 0
  };
  saveQuizSession();
  renderQuiz();
  setVisible("quizPanel");
}

function startQuiz(globalReview) {
  if (!requireFoundationComplete()) return;
  const pool = globalReview
    ? shuffled(allUnresolvedQuestions())
    : buildQuestionPool();
  quiz = {
    kind: "free",
    globalReview,
    mode: globalReview ? "review" : selected.mode,
    pool,
    index: 0,
    answered: false,
    selectedChoice: null,
    correctCount: 0,
    wrongCount: 0
  };
  saveQuizSession();
  renderQuiz();
  setVisible("quizPanel");
}

function startSpacedReview() {
  if (!requireFoundationComplete()) return;
  const pool = shuffled(spacedDueQuestions());
  if (!pool.length) return renderHome();
  quiz = {
    kind: "spaced",
    mode: "spaced",
    pool,
    index: 0,
    answered: false,
    selectedChoice: null,
    correctCount: 0,
    wrongCount: 0
  };
  saveQuizSession();
  renderQuiz();
  setVisible("quizPanel");
}

function currentQuestion() {
  if (quiz?.kind === "step3") return quiz.currentQuestion;
  return quiz?.pool[quiz.index];
}

function questionContext(question) {
  const unit = unitById(question.unitId);
  const set = setById(question.unitId, question.setId);
  return { unit, set };
}

function renderQuiz() {
  const q = currentQuestion();
  if (!q) {
    $("#quizBreadcrumb").textContent = "English Grammar Trainer";
    $("#quizTitle").textContent = "演習対象なし";
    $("#quizBody").innerHTML = `
      <div class="empty">この条件で出題できる問題はありません。</div>
      <div class="actions"><button class="ghost" id="emptyBackBtn" type="button">一覧へ戻る</button></div>
    `;
    $("#emptyBackBtn").onclick = renderHome;
    return;
  }

  const { unit, set } = questionContext(q);
  $("#quizBreadcrumb").textContent = `${unit?.title || q.unitId} / ${set?.title || q.setId}`;
  $("#quizTitle").textContent = quizTitle(q, set);
  const stats = quiz.kind === "step3" ? null : statsFor(quiz.pool);
  const stem = String(q.stem || "").replace(/\n/g, "<br>");
  const progressText = quizProgressText(stats);
  const hasAnswer = Boolean(quiz.answered && Number.isInteger(quiz.selectedChoice));
  const answeredCorrect = hasAnswer && quiz.selectedChoice === q.answerIndex;

  $("#quizBody").innerHTML = `
    <div class="quizBox">
      <div class="quizTop">
        <div>
          <p class="label">出典問題 ${esc(q.no)}</p>
          <div class="hint">${esc(progressText)}</div>
        </div>
        <div class="streak">${esc(q.sourcePage ? `p.${q.sourcePage}` : questionData.source.book || "英文法トレーナー")}</div>
      </div>
      <p class="stem">${stem}</p>
      <div class="choices">
        ${q.choices.map((choice, index) => `
          <button class="choiceBtn ${hasAnswer && index === q.answerIndex ? "correct" : ""} ${hasAnswer && index === quiz.selectedChoice && !answeredCorrect ? "wrong" : ""}" type="button" data-index="${index}" ${hasAnswer ? "disabled" : ""}>
            <span class="key">${KEYS[index] || index + 1}</span><span>${esc(choice)}</span>
          </button>
        `).join("")}
      </div>
      <div id="feedbackSlot" tabindex="-1">${hasAnswer ? feedbackHtml(q, quiz.selectedChoice, answeredCorrect) : ""}</div>
    </div>
    <div class="actions">
      <button class="cta ${hasAnswer ? "" : "hide"}" id="nextBtn" type="button">${hasAnswer ? nextButtonText() : "次の問題へ"}</button>
    </div>
  `;

  $$(".choiceBtn").forEach(button => {
    button.onclick = () => answerQuestion(Number(button.dataset.index));
  });
  $("#nextBtn").onclick = () => {
    const result = moveNext();
    if (result !== "completed") renderQuiz();
  };
}

function quizTitle(question, set) {
  if (quiz.kind === "step1") {
    return quiz.mode === "step1Wrong"
      ? `Step 1 誤答演習 / ${set?.title || ""}`
      : `Step 1 UNIT演習 / ${set?.title || ""}`;
  }
  if (quiz.kind === "step2") return quiz.mode === "step2Single" ? "Step 2 1問確認" : "Step 2 ランダム制覇";
  if (quiz.kind === "step3") return "Step 3 30問連続正解";
  if (quiz.kind === "spaced") return "間隔復習";
  return quiz.globalReview
    ? MODE_TITLE.review
    : `${MODE_TITLE[quiz.mode] || "4択演習"}${quiz.mode?.startsWith("set") ? ` / ${set?.title || ""}` : ""}`;
}

function quizProgressText(stats) {
  if (quiz.kind === "step3") {
    const meta = metaState();
    return `現在 ${quiz.streak}/${MASTER_TARGET} 連続正解 / 最高 ${meta.bestStreak}/${MASTER_TARGET}`;
  }
  return `この演習内 ${quiz.index + 1} / ${quiz.pool.length}問目 / 未正解 ${stats.remaining}`;
}

function answerQuestion(choiceIndex) {
  if (quiz.answered) return;
  quiz.answered = true;
  quiz.selectedChoice = choiceIndex;
  const q = currentQuestion();
  const state = stateFor(q.id);
  const correct = choiceIndex === q.answerIndex;
  state.attempts += 1;
  state.lastChoice = choiceIndex;
  state.lastAnsweredAt = new Date().toISOString();
  if (correct) {
    state.correct += 1;
    if (quiz.kind === "free") state.cleared = true;
    if (quiz.kind === "step1") state.step1Cleared = true;
    if (quiz.kind === "step2") state.step2Cleared = true;
    if (quiz.kind === "step2") scheduleInitialReview(state);
    if (quiz.kind === "spaced") updateSpacedReviewState(state, true);
    if (quiz.kind === "step3") {
      state.step3Correct += 1;
      quiz.streak += 1;
      const meta = metaState();
      if (quiz.streak > meta.bestStreak) meta.bestStreak = quiz.streak;
      if (quiz.streak >= MASTER_TARGET) meta.mastered = true;
    }
  } else {
    state.wrong += 1;
    quiz.wrongCount += 1;
    if (quiz.kind === "free") state.cleared = false;
    if (quiz.kind === "spaced") updateSpacedReviewState(state, false);
    if (quiz.kind === "step3") {
      state.step3Wrong += 1;
      quiz.streak = 0;
    }
  }
  if (correct) quiz.correctCount += 1;
  updateStepCompletionDates();
  saveQuizSession();

  $$(".choiceBtn").forEach(button => {
    const index = Number(button.dataset.index);
    button.disabled = true;
    if (index === q.answerIndex) button.classList.add("correct");
    if (index === choiceIndex && !correct) button.classList.add("wrong");
  });
  $("#feedbackSlot").innerHTML = feedbackHtml(q, choiceIndex, correct);
  $("#nextBtn").classList.remove("hide");
  $("#nextBtn").textContent = nextButtonText();
  focusFeedbackAndScrollToNext();
}

function focusFeedbackAndScrollToNext() {
  if (quiz.kind !== "step1") return;
  const feedback = $("#feedbackSlot");
  const nextButton = $("#nextBtn");
  if (!feedback || !nextButton) return;

  feedback.focus({ preventScroll: true });
  const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
  requestAnimationFrame(() => nextButton.scrollIntoView({ behavior, block: "center" }));
}

function nextButtonText() {
  if (quiz.kind === "step3") {
    return metaState().mastered ? "合格後も続ける" : "次の問題へ";
  }
  return quiz.index >= quiz.pool.length - 1 ? "結果を確認" : "次の問題へ";
}

function feedbackHtml(q, choiceIndex, correct) {
  const answer = q.choices[q.answerIndex];
  const yourAnswer = q.choices[choiceIndex];
  const note = q.note ? `<p><strong>解説:</strong></p><p class="noteText" style="white-space: pre-wrap;">${esc(q.note)}</p>` : "";
  const translation = q.translation ? `<p><strong>訳:</strong> ${esc(q.translation)}</p>` : "";
  return `
    <div class="feedback ${correct ? "ok" : "ng"}">
      <h3>${correct ? "正解" : "不正解"}</h3>
      <p><strong>正解:</strong> ${esc(KEYS[q.answerIndex])}. ${esc(answer)}</p>
      ${!correct ? `<p class="hint">あなたの解答: ${esc(KEYS[choiceIndex])}. ${esc(yourAnswer)}</p>` : ""}
      ${note}
      ${translation}
    </div>
  `;
}

function renderCompletionResult() {
  const completed = quiz;
  const total = completed.kind === "step3" ? MASTER_TARGET : completed.pool.length;
  const correct = completed.correctCount || 0;
  const wrong = completed.wrongCount || 0;
  const next = nextAction();
  const polarisCompleted = next.kind === "reading";
  const nextLabel = polarisCompleted
    ? "英文解釈へ進む"
    : next.kind === "foundation"
      ? "基礎チェックへ進む"
    : next.kind === "step1"
      ? next.label.replace(/^▶\s*/, "")
      : next.kind === "step2"
        ? "Step 2を続ける"
        : next.kind === "spaced"
          ? "今日の復習へ進む"
          : next.kind === "review"
            ? "誤答を復習する"
            : "Step 3へ進む";
  $("#quizBreadcrumb").textContent = "学習結果";
  $("#quizTitle").textContent = "演習完了";
  $("#quizBody").innerHTML = `
    <div class="completionPanel${polarisCompleted ? " polarisComplete" : ""}">
      <p class="label">${polarisCompleted ? "POLARIS COMPLETE" : "SESSION COMPLETE"}</p>
      <h3>${polarisCompleted ? "ポラリス英文法を完了しました" : "この演習を完了しました"}</h3>
      <div class="completionStats" aria-label="演習結果">
        <div><span class="label">正解</span><strong>${correct}</strong><span> / ${total}</span></div>
        <div><span class="label">誤答</span><strong>${wrong}</strong></div>
      </div>
      <p class="hint">${polarisCompleted ? "結果は保存されています。次は文法知識を使い、英文の構造を正確に読む練習へ進みます。" : "結果は保存されています。次にやることを1つ選んでください。"}</p>
      <div class="actions completionActions">
        <button class="cta" id="completionNextBtn" type="button">${esc(nextLabel)}</button>
        ${wrong > 0 ? `<button class="ghost" id="completionWrongBtn" type="button">誤答 ${wrong}問を復習</button>` : ""}
        <button class="ghost" id="completionHomeBtn" type="button">学習一覧へ戻る</button>
      </div>
    </div>
  `;
  $("#completionNextBtn").onclick = () => {
    if (next.kind === "foundation") ctx.navigate("foundation");
    else if (next.kind === "step1") startStep1Quiz(next.unitId, next.setId, next.variant);
    else if (next.kind === "step2") startStep2Quiz();
    else if (next.kind === "spaced") startSpacedReview();
    else if (next.kind === "review") startQuiz(true);
    else if (next.kind === "reading") ctx.navigate("reading");
    else startStep3Quiz();
  };
  const wrongButton = $("#completionWrongBtn");
  if (wrongButton) {
    wrongButton.onclick = () => {
      if (completed.kind === "step1" && completed.pool[0]) {
        const first = completed.pool[0];
        startStep1Quiz(first.unitId, first.setId, "wrongOnly");
      } else if (completed.kind === "step3") {
        startStep3Quiz();
      } else {
        startQuiz(true);
      }
    };
  }
  $("#completionHomeBtn").onclick = renderHome;
  setVisible("quizPanel");
}

function moveNext() {
  if (quiz.kind === "step3") {
    const q = currentQuestion();
    quiz.recentIds = [q.id, ...quiz.recentIds.filter(id => id !== q.id)].slice(0, RECENT_STEP3_LIMIT);
    quiz.currentQuestion = pickStep3Question(quiz.recentIds);
    quiz.answered = false;
    quiz.selectedChoice = null;
    saveQuizSession();
    return;
  }
  if (quiz.index < quiz.pool.length - 1) {
    quiz.index += 1;
    quiz.answered = false;
    quiz.selectedChoice = null;
    saveQuizSession();
    return;
  }
  clearQuizSession();
  renderCompletionResult();
  return "completed";
}

/* 生徒切替・生徒追加・記録削除はシェルの持ち物になったため、ここからは外した。
   （統合前は3モジュールが各自の生徒UIと各自の名簿を持っていた） */
function bindEvents() {
  $("#unitSel").onchange = event => {
    selected.unitId = event.target.value;
    selected.setId = setsFor(selected.unitId)[0]?.id || "";
    renderHome();
  };
  $("#setSel").onchange = event => {
    selected.setId = event.target.value;
    renderHome();
  };
  $("#modeSel").onchange = event => {
    selected.mode = event.target.value;
    renderHome();
  };
  $("#startBtn").onclick = () => startQuiz(false);
  $("#backBtn").onclick = renderHome;
}

export async function mount(root, context) {
  ctx = context;
  viewRoot = root;

  root.innerHTML = await fetch(VIEW_URL, { cache: "no-store" }).then(response => {
    if (!response.ok) throw new Error(`${VIEW_URL}: ${response.statusText}`);
    return response.text();
  });

  quiz = null;
  selected = { unitId: "", setId: "", mode: "setAll" };

  try {
    questionData = await loadJson(DATA_URL);
    loadProgress();
    bindEvents();
    renderHome();
  } catch (error) {
    console.error(error);
    root.innerHTML = `<div class="card"><div class="empty">データの読み込みに失敗しました: ${esc(error.message)}</div></div>`;
  }

  return {
    unmount() {
      quiz = null;
      viewRoot = document;
    }
  };
}
