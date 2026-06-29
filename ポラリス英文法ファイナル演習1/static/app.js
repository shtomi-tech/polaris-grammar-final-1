const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

const LEGACY_STORAGE_KEY = "polarisFinalGrammar1.progress";
const STORAGE_PREFIX = "polarisFinalGrammar1.progress.";
const STUDENTS_KEY = "polarisFinalGrammar1.students";
const ACTIVE_STUDENT_KEY = "polarisFinalGrammar1.activeStudent";
const CONFIG_PATH = "static/config.json";
const DEFAULT_STUDENT = { id: "default", name: "共通" };
const KEYS = ["ア", "イ", "ウ", "エ"];
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
let students = [];
let activeStudentId = DEFAULT_STUDENT.id;
let progress = {};
let selected = { unitId: "", setId: "", mode: "setAll" };
let quiz = null;
let runtimeConfig = {};
let saveQueue = Promise.resolve();
let sharedSession = {
  requested: false,
  enabled: false,
  studentId: "",
  token: "",
  student: null
};

const MODE_HELP = {
  setAll: "選択したセットの10問を出題します。",
  setUnresolved: "選択したセットのうち、まだ正解済みになっていない問題だけを出題します。",
  setWrong: "選択したセットのうち、過去に間違えていて、まだ正解済みでない問題だけを出題します。",
  unitRandom: "選択したUNIT内の問題をランダム順で出題します。",
  allRandom: "収録済みの全問題をランダム順で出題します。",
  tenTest: "収録済みの全問題からランダムに10問を出題します。"
};

const MODE_TITLE = {
  setAll: "セット全問",
  setUnresolved: "セットの未正解のみ",
  setWrong: "セットの誤答のみ",
  unitRandom: "UNIT指定ランダム",
  allRandom: "全問ランダム",
  tenTest: "10問テスト",
  review: "全体の未正解を復習"
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

async function loadOptionalJson(path) {
  try {
    return await loadJson(path);
  } catch {
    return {};
  }
}

function normalizeConfig(raw = {}) {
  const supabase = raw.supabase || {};
  return {
    appBaseUrl: String(raw.appBaseUrl || "").trim(),
    supabaseUrl: String(raw.supabaseUrl || supabase.url || "").trim().replace(/\/+$/, ""),
    supabaseAnonKey: String(raw.supabaseAnonKey || supabase.anonKey || "").trim()
  };
}

function parseSharedParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    studentId: params.get("s") || params.get("student") || "",
    token: params.get("t") || params.get("token") || ""
  };
}

function hasCloudConfig() {
  return Boolean(runtimeConfig.supabaseUrl && runtimeConfig.supabaseAnonKey);
}

function supabaseHeaders() {
  return {
    apikey: runtimeConfig.supabaseAnonKey,
    Authorization: `Bearer ${runtimeConfig.supabaseAnonKey}`,
    "Content-Type": "application/json"
  };
}

async function supabaseRpc(name, payload) {
  if (!hasCloudConfig()) throw new Error("Supabase設定が未完了です。");
  const response = await fetch(`${runtimeConfig.supabaseUrl}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: supabaseHeaders(),
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${name}: ${response.status} ${text || response.statusText}`);
  }
  if (response.status === 204) return null;
  return response.json();
}

function setShareStatus(message, tone = "") {
  const slot = $("#shareStatus");
  if (!slot) return;
  slot.textContent = message || "";
  slot.className = `shareStatus ${tone}`.trim();
}

async function startSharedSession() {
  if (!sharedSession.studentId || !sharedSession.token) {
    throw new Error("共有URLに生徒IDまたはアクセストークンがありません。");
  }
  if (!hasCloudConfig()) {
    throw new Error("共有URLですが、static/config.json のSupabase設定が未完了です。");
  }

  const authRows = await supabaseRpc("polaris_auth_student", {
    p_student_id: sharedSession.studentId,
    p_access_token: sharedSession.token
  });
  const student = Array.isArray(authRows) ? authRows[0] : authRows;
  if (!student || !student.id) {
    throw new Error("生徒URLを確認できませんでした。QRコードを作り直してください。");
  }

  sharedSession.enabled = true;
  sharedSession.student = {
    id: String(student.id),
    name: String(student.display_name || student.name || student.id)
  };
  students = [sharedSession.student];
  activeStudentId = sharedSession.student.id;

  const loaded = await supabaseRpc("polaris_load_progress", {
    p_student_id: sharedSession.studentId,
    p_access_token: sharedSession.token
  });
  const cloudProgress = Array.isArray(loaded) ? loaded[0] : loaded;
  progress = (cloudProgress && typeof cloudProgress === "object")
    ? (cloudProgress.progress || cloudProgress)
    : {};
  localStorage.setItem(progressKey(), JSON.stringify(progress));
  setShareStatus(`${activeStudent().name} さんの共有進捗を読み込みました。`, "ok");
}

async function saveSharedProgress() {
  await supabaseRpc("polaris_save_progress", {
    p_student_id: sharedSession.studentId,
    p_access_token: sharedSession.token,
    p_progress: progress
  });
}

function queueSharedSave() {
  if (!sharedSession.enabled) return;
  setShareStatus("進捗を保存中...", "syncing");
  saveQueue = saveQueue
    .then(() => saveSharedProgress())
    .then(() => setShareStatus(`${activeStudent().name} さんの進捗を保存しました。`, "ok"))
    .catch(error => {
      console.error(error);
      setShareStatus("進捗のクラウド保存に失敗しました。通信後にもう一度解答してください。", "ng");
    });
}

function applySharedUi() {
  document.body.classList.toggle("sharedMode", sharedSession.enabled);
  const controls = $(".studentControls");
  const resetButton = $("#resetBtn");
  if (controls) controls.classList.toggle("hide", sharedSession.enabled);
  if (resetButton) resetButton.classList.toggle("hide", sharedSession.enabled);
  if (!sharedSession.enabled && !sharedSession.requested) {
    setShareStatus("ローカル保存モード");
  }
}

function unitSource(unit) {
  return unit?.source || UNIT_SOURCES[unit?.id] || "出題元未登録";
}

function progressKey(studentId = activeStudentId) {
  return `${STORAGE_PREFIX}${studentId}`;
}

function safeStudentId(name) {
  const normalized = String(name || "").trim().toLowerCase();
  const ascii = normalized
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return ascii || `student-${Date.now().toString(36)}`;
}

function loadStudents() {
  try {
    students = JSON.parse(localStorage.getItem(STUDENTS_KEY) || "[]");
  } catch {
    students = [];
  }
  if (!Array.isArray(students)) students = [];
  if (!students.some(student => student.id === DEFAULT_STUDENT.id)) {
    students.unshift(DEFAULT_STUDENT);
  }
  students = students
    .filter(student => student && student.id && student.name)
    .map(student => ({ id: String(student.id), name: String(student.name) }));
  saveStudents();

  activeStudentId = localStorage.getItem(ACTIVE_STUDENT_KEY) || DEFAULT_STUDENT.id;
  if (!students.some(student => student.id === activeStudentId)) {
    activeStudentId = DEFAULT_STUDENT.id;
    localStorage.setItem(ACTIVE_STUDENT_KEY, activeStudentId);
  }
}

function saveStudents() {
  localStorage.setItem(STUDENTS_KEY, JSON.stringify(students));
}

function activeStudent() {
  return students.find(student => student.id === activeStudentId) || DEFAULT_STUDENT;
}

function migrateLegacyProgress() {
  const defaultKey = progressKey(DEFAULT_STUDENT.id);
  if (localStorage.getItem(defaultKey) || !localStorage.getItem(LEGACY_STORAGE_KEY)) return;
  localStorage.setItem(defaultKey, localStorage.getItem(LEGACY_STORAGE_KEY));
}

function loadProgress() {
  try {
    progress = JSON.parse(localStorage.getItem(progressKey()) || "{}");
  } catch {
    progress = {};
  }
}

function saveProgress() {
  localStorage.setItem(progressKey(), JSON.stringify(progress));
  queueSharedSave();
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
      step3Wrong: 0
    };
  }
  const state = progress[questionId];
  if (typeof state.step1Cleared !== "boolean") state.step1Cleared = false;
  if (typeof state.step2Cleared !== "boolean") state.step2Cleared = false;
  if (typeof state.step3Correct !== "number") state.step3Correct = 0;
  if (typeof state.step3Wrong !== "number") state.step3Wrong = 0;
  return progress[questionId];
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

function filteredQuestions(unitId, setId, mode) {
  const questions = questionsForSet(unitId, setId);
  if (mode === "setUnresolved") return questions.filter(question => !stateFor(question.id).cleared);
  if (mode === "setWrong") return questions.filter(question => stateFor(question.id).wrong > 0 && !stateFor(question.id).cleared);
  return questions;
}

function questionsForUnit(unitId) {
  return questionData.questions
    .filter(question => question.unitId === unitId)
    .sort((a, b) => String(a.setId).localeCompare(String(b.setId)) || Number(a.no) - Number(b.no));
}

function buildQuestionPool() {
  if (selected.mode === "unitRandom") return shuffled(questionsForUnit(selected.unitId));
  if (selected.mode === "allRandom") return shuffled(questionData.questions);
  if (selected.mode === "tenTest") return shuffled(questionData.questions).slice(0, 10);
  return shuffled(filteredQuestions(selected.unitId, selected.setId, selected.mode));
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
    .filter(question => !stateFor(question.id).cleared)
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
  for (const id of ["homePanel", "quizPanel"]) {
    $(`#${id}`).classList.toggle("hide", id !== panel);
  }
}

function renderStudentControls() {
  if (sharedSession.enabled) {
    $("#studentSel").innerHTML = `<option value="${esc(activeStudentId)}">${esc(activeStudent().name)}</option>`;
    $("#studentSel").value = activeStudentId;
    return;
  }
  $("#studentSel").innerHTML = students.map(student =>
    `<option value="${esc(student.id)}">${esc(student.name)}</option>`
  ).join("");
  $("#studentSel").value = activeStudentId;
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
      <div class="stepCard active">
        <p class="label">Step 1</p>
        <h3>UNIT演習</h3>
        <div class="stepCount">${progressRatio(step1)}</div>
        <p class="hint">UNITごとに一度正解した問題を積み上げる。</p>
      </div>
      <div class="stepCard ${step2Open ? "active" : "locked"}">
        <p class="label">Step 2</p>
        <h3>ランダム制覇</h3>
        <div class="stepCount">${progressRatio(step2)}</div>
        <p class="hint">${step2Open ? "未クリア問題だけをランダム出題。" : "Step 1を全問クリアで解放。"}</p>
        <button class="ghost" id="step2Btn" type="button" ${step2Open ? "" : "disabled"}>Step 2を始める</button>
      </div>
      <div class="stepCard ${step3Open ? "active" : "locked"} ${meta.mastered ? "mastered" : ""}">
        <p class="label">Step 3</p>
        <h3>30問連続正解</h3>
        <div class="stepCount">${masterLabel}</div>
        <p class="hint">${step3Open ? "間違えたら0から続行。30連続で合格。" : "Step 2を全問クリアで解放。"}</p>
        <button class="ghost" id="step3Btn" type="button" ${step3Open ? "" : "disabled"}>Step 3を始める</button>
      </div>
    </div>
  `;

  $("#step2Btn").onclick = () => startStep2Quiz();
  $("#step3Btn").onclick = () => startStep3Quiz();
}

function renderHeatmap(enabled) {
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
  return `
    <div class="heatmap ${enabled ? "" : "locked"}">
      <div class="heatHead">
        <div>
          <p class="label">Step 2 Heatmap</p>
          <h3>ランダム制覇マップ</h3>
        </div>
        <p class="hint">${enabled ? "正解した問題が埋まります。マスを押すとその1問を確認できます。" : "Step 1クリア後に解放されます。"}</p>
      </div>
      ${rows}
    </div>
  `;
}

function renderStep3Challenge(enabled) {
  const meta = metaState();
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
  return `
    <div class="challengeMap ${enabled ? "" : "locked"} ${meta.mastered ? "mastered" : ""}">
      <div class="challengeHeader">
        <div>
          <p class="label">Step 3 Challenge</p>
          <h3>30問連続正解チャレンジ</h3>
        </div>
        <div class="challengeResult">${meta.mastered ? "MASTER" : `あと ${remaining}`}</div>
      </div>
      <div class="challengeStatus">
        <div>
          <span class="stepCount">${meta.mastered ? "最高記録 達成済" : `最高 ${filled}/${MASTER_TARGET}`}</span>
          <p class="hint">${enabled ? "現在の連続正解はセッション内のみ。最高記録は保存されます。" : "Step 2クリア後に解放されます。"}</p>
        </div>
        <button class="ghost" id="step3PanelBtn" type="button" ${enabled ? "" : "disabled"}>Step 3を始める</button>
      </div>
      <div class="challengeTracks">${rows}</div>
    </div>
  `;
}

function renderSetList() {
  const step1 = stepStats("step1Cleared");
  $("#progressSummary").textContent = `${activeStudent().name}: Step 1 ${step1.cleared}/${step1.total}`;
  const units = questionData.units;
  $("#setList").innerHTML = units.map(unit => {
    const cards = unit.sets.map(set => {
      const questions = questionsForSet(unit.id, set.id);
      const stats = stepStats("step1Cleared", questions);
      const wrongCount = step1WrongQuestions(questions).length;
      return `
        <div class="itemCard ${stats.remaining === 0 && stats.total ? "done" : ""}">
          <div class="itemMeta">${esc(unit.title)}</div>
          <h3>${esc(set.title)}</h3>
          <p class="sourceLine">${esc(unitSource(unit))}</p>
          <div class="badgeRow">
            <span class="badge ${stats.remaining === 0 && stats.total ? "ok" : "warn"}">Step 1 ${stats.cleared}/${stats.total}</span>
            <span class="badge ${stats.remaining === 0 && stats.total ? "ok" : ""}">残り ${stats.remaining}</span>
            <span class="badge ${wrongCount ? "warn" : ""}">誤答 ${wrongCount}</span>
          </div>
          <div class="cardActions">
            <button class="startUnitBtn" type="button" data-unit="${esc(unit.id)}" data-set="${esc(set.id)}">UNIT演習</button>
            <button class="ghost wrongUnitBtn" type="button" data-unit="${esc(unit.id)}" data-set="${esc(set.id)}" ${wrongCount ? "" : "disabled"}>間違えた問題だけ</button>
          </div>
        </div>
      `;
    }).join("");
    return cards;
  }).join("") || `<div class="empty">問題データがまだありません。スクショOCR後に data/polaris_questions.json へ追加します。</div>`;

  $$(".startUnitBtn").forEach(button => {
    button.onclick = () => {
      selected.unitId = button.dataset.unit;
      selected.setId = button.dataset.set;
      selected.mode = "setAll";
      renderHome();
      startStep1Quiz(selected.unitId, selected.setId);
    };
  });

  $$(".wrongUnitBtn").forEach(button => {
    button.onclick = () => {
      selected.unitId = button.dataset.unit;
      selected.setId = button.dataset.set;
      selected.mode = "setWrong";
      renderHome();
      startStep1Quiz(selected.unitId, selected.setId, "wrongOnly");
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

  const step3Open = step3Unlocked();
  $("#step3Challenge").innerHTML = renderStep3Challenge(step3Open);
  $("#step3PanelBtn").onclick = () => startStep3Quiz();
}

function renderHome() {
  renderStudentControls();
  renderSelectors();
  renderMasterPath();
  renderSetList();
  setVisible("homePanel");
}

function startStep1Quiz(unitId, setId, variant = "all") {
  const questions = questionsForSet(unitId, setId);
  const pool = variant === "wrongOnly" ? step1WrongQuestions(questions) : questions;
  quiz = {
    kind: "step1",
    mode: variant === "wrongOnly" ? "step1Wrong" : "step1",
    pool: shuffled(pool),
    index: 0,
    answered: false,
    selectedChoice: null
  };
  renderQuiz();
  setVisible("quizPanel");
}

function startStep2Quiz(singleQuestion = null) {
  const remaining = questionData.questions.filter(question => !stateFor(question.id).step2Cleared);
  const pool = singleQuestion ? [singleQuestion] : (remaining.length ? remaining : questionData.questions);
  quiz = {
    kind: "step2",
    mode: singleQuestion ? "step2Single" : "step2",
    pool: shuffled(pool),
    index: 0,
    answered: false,
    selectedChoice: null
  };
  renderQuiz();
  setVisible("quizPanel");
}

function startStep3Quiz() {
  quiz = {
    kind: "step3",
    mode: "step3",
    pool: [],
    index: 0,
    answered: false,
    selectedChoice: null,
    currentQuestion: pickStep3Question(),
    streak: 0,
    recentIds: []
  };
  renderQuiz();
  setVisible("quizPanel");
}

function startQuiz(globalReview) {
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
    selectedChoice: null
  };
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
    $("#quizBreadcrumb").textContent = "Polaris";
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

  $("#quizBody").innerHTML = `
    <div class="quizBox">
      <div class="quizTop">
        <div>
          <p class="label">Question ${esc(q.no)}</p>
          <div class="hint">${esc(progressText)}</div>
        </div>
        <div class="streak">${esc(q.sourcePage ? `p.${q.sourcePage}` : questionData.source.book || "Polaris")}</div>
      </div>
      <p class="stem">${stem}</p>
      <div class="choices">
        ${q.choices.map((choice, index) => `
          <button class="choiceBtn" type="button" data-index="${index}">
            <span class="key">${KEYS[index] || index + 1}</span><span>${esc(choice)}</span>
          </button>
        `).join("")}
      </div>
      <div id="feedbackSlot"></div>
    </div>
    <div class="actions">
      <button class="ghost" id="backToHomeBtn" type="button">一覧へ戻る</button>
      <button class="cta hide" id="nextBtn" type="button">次の問題へ</button>
    </div>
  `;

  $$(".choiceBtn").forEach(button => {
    button.onclick = () => answerQuestion(Number(button.dataset.index));
  });
  $("#backToHomeBtn").onclick = renderHome;
  $("#nextBtn").onclick = () => {
    moveNext();
    renderQuiz();
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
  return quiz.globalReview
    ? MODE_TITLE.review
    : `${MODE_TITLE[quiz.mode] || "4択演習"}${quiz.mode?.startsWith("set") ? ` / ${set?.title || ""}` : ""}`;
}

function quizProgressText(stats) {
  if (quiz.kind === "step3") {
    const meta = metaState();
    return `現在 ${quiz.streak}/${MASTER_TARGET} 連続正解 / 最高 ${meta.bestStreak}/${MASTER_TARGET}`;
  }
  return `${quiz.index + 1}/${quiz.pool.length} 問目 / この演習内の未正解 ${stats.remaining}`;
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
    if (quiz.kind === "step3") {
      state.step3Correct += 1;
      quiz.streak += 1;
      const meta = metaState();
      if (quiz.streak > meta.bestStreak) meta.bestStreak = quiz.streak;
      if (quiz.streak >= MASTER_TARGET) meta.mastered = true;
    }
  } else {
    state.wrong += 1;
    if (quiz.kind === "free") state.cleared = false;
    if (quiz.kind === "step3") {
      state.step3Wrong += 1;
      quiz.streak = 0;
    }
  }
  updateStepCompletionDates();
  saveProgress();

  $$(".choiceBtn").forEach(button => {
    const index = Number(button.dataset.index);
    button.disabled = true;
    if (index === q.answerIndex) button.classList.add("correct");
    if (index === choiceIndex && !correct) button.classList.add("wrong");
  });
  $("#feedbackSlot").innerHTML = feedbackHtml(q, choiceIndex, correct);
  $("#nextBtn").classList.remove("hide");
  $("#nextBtn").textContent = nextButtonText();
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

function moveNext() {
  if (quiz.kind === "step3") {
    const q = currentQuestion();
    quiz.recentIds = [q.id, ...quiz.recentIds.filter(id => id !== q.id)].slice(0, RECENT_STEP3_LIMIT);
    quiz.currentQuestion = pickStep3Question(quiz.recentIds);
    quiz.answered = false;
    quiz.selectedChoice = null;
    return;
  }
  if (quiz.index < quiz.pool.length - 1) {
    quiz.index += 1;
    quiz.answered = false;
    quiz.selectedChoice = null;
    return;
  }
  renderHome();
}

function bindEvents() {
  $("#studentSel").onchange = event => {
    if (sharedSession.enabled) return;
    activeStudentId = event.target.value;
    localStorage.setItem(ACTIVE_STUDENT_KEY, activeStudentId);
    loadProgress();
    quiz = null;
    renderHome();
  };
  $("#addStudentBtn").onclick = () => {
    if (sharedSession.enabled) return;
    const name = prompt("生徒名を入力してください。");
    if (!name || !name.trim()) return;
    const trimmedName = name.trim();
    let id = safeStudentId(trimmedName);
    let suffix = 2;
    while (students.some(student => student.id === id)) {
      id = `${safeStudentId(trimmedName)}-${suffix}`;
      suffix += 1;
    }
    students.push({ id, name: trimmedName });
    activeStudentId = id;
    saveStudents();
    localStorage.setItem(ACTIVE_STUDENT_KEY, activeStudentId);
    progress = {};
    saveProgress();
    renderHome();
  };
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
  $("#reviewBtn").onclick = () => startQuiz(true);
  $("#backBtn").onclick = renderHome;
  $("#resetBtn").onclick = () => {
    if (sharedSession.enabled) return;
    if (!confirm(`${activeStudent().name} のステップ進捗・自由演習記録をすべてリセットしますか？`)) return;
    progress = {};
    saveProgress();
    renderHome();
  };
}

async function init() {
  try {
    runtimeConfig = normalizeConfig(await loadOptionalJson(CONFIG_PATH));
    const sharedParams = parseSharedParams();
    sharedSession.studentId = sharedParams.studentId;
    sharedSession.token = sharedParams.token;
    sharedSession.requested = Boolean(sharedSession.studentId || sharedSession.token);
    questionData = await loadJson("data/polaris_questions.json");
    if (sharedSession.requested) {
      await startSharedSession();
    } else {
      loadStudents();
      migrateLegacyProgress();
      loadProgress();
    }
    bindEvents();
    applySharedUi();
    renderHome();
  } catch (error) {
    $("#homePanel").innerHTML = `<div class="empty">データの読み込みに失敗しました: ${esc(error.message)}</div>`;
    setShareStatus("共有設定または進捗データの読み込みに失敗しました。", "ng");
  }
}

init();
