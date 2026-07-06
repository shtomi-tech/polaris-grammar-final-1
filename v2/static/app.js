const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

/* ============================================================
   英文法 v2 — harness の store/engine を本採用
   進捗・判定・クリア・Leitner間隔反復は vendor/harness に集約。
   このアプリ固有＝データ→Unit契約への写像 と 説明(explained)フラグ（クイズでないので契約外）。
   ============================================================ */
const HARNESS_CONFIG = {
  appId: "english-practice",
  modes: ["memory", "practice"],
  clear: { memory: { type: "allCorrect" }, practice: { type: "allCorrect" } },
  review: { ladder: [1, 3, 7, 14] },
};
const LEGACY_KEY = "englishGrammarV2.progress";      // 旧・自前進捗
const EXPLAINED_KEY = "englishGrammarV2.explained";  // 説明確認フラグ（app固有）
const COURSE_LABELS = { junior: "中学英文法", senior: "高校・大学受験英文法" };
const KEYS = ["ア", "イ", "ウ", "エ"];

let items = [];
let units = [];        // harness Unit[]
let store = null;
let engine = null;
let cloud = null;      // harness createCloud のインスタンス（init で生成・config無しなら no-op）
let explained = {};    // { [itemId]: true }
let selected = { course: "junior", level: "", unit: "", itemId: "" };
let activeTab = "explain";
let quizState = null;

function esc(value) {
  return String(value ?? "").replace(/[&<>"]/g, ch => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;"
  }[ch]));
}

async function loadJson(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`${path}: ${response.statusText}`);
  return response.json();
}

async function loadOptionalJson(path, fallback) {
  const response = await fetch(path);
  if (!response.ok) return fallback;
  return response.json();
}

/* ---- データ → Unit 契約への写像 ---- */
function toQuestion(q) {
  return {
    id: q.id,
    stem: q.stem,
    choices: q.choices,
    answer: q.answer,
    rationale: { whyCorrect: q.whyCorrect, whyWrong: q.whyWrong, translation: q.translation },
  };
}
function buildUnits(itemList, bank) {
  const mem = {}, pra = {};
  for (const q of bank.memoryQuestions || []) (mem[q.itemId] || (mem[q.itemId] = [])).push(toQuestion(q));
  for (const q of bank.practiceQuestions || []) (pra[q.itemId] || (pra[q.itemId] = [])).push(toQuestion(q));
  return itemList.map(it => ({
    id: it.id,
    meta: it,
    modes: { memory: mem[it.id] || [], practice: pra[it.id] || [] },
  }));
}

/* ============================================================
   cloud sync（生徒別・共有URL ?s=&t=）— harness/cloud.js を利用
   共通スキーマ app_students / app_progress（app="english-practice"）。
   config.json が無ければ no-op で、従来どおり匿名ローカル動作（無回帰）。
   このアプリ固有＝進捗(store)と説明フラグ(explained)を1つのjsonbに合成する点のみ。
   ============================================================ */
function setShareStatus(message, tone = "") {
  const slot = $("#shareStatus");
  if (!slot) return;
  slot.textContent = message || "";
  slot.className = "shareStatus" + (tone ? " " + tone : "");
}
// クラウドに保存する形： { v, progress(store全体), explained }
function collectCloudPayload() {
  return { v: 1, progress: store.snapshot(), explained };
}
// クラウドから来た内容を localStorage へ静かに反映（cloudエコー保存を避ける）
function applyCloudPayload(payload) {
  if (!payload || typeof payload !== "object") return;
  const prog = payload.progress || payload; // 旧形式後方互換
  if (prog && typeof prog === "object") store.replace(prog);
  if (payload.explained && typeof payload.explained === "object") explained = payload.explained;
  try {
    localStorage.setItem(`harness.${HARNESS_CONFIG.appId}.progress`, JSON.stringify(store.snapshot()));
  } catch { /* ignore */ }
  saveExplained();
}
function applySharedUi() {
  const enabled = !!(cloud && cloud.isEnabled());
  document.body.classList.toggle("sharedMode", enabled);
  const resetBtn = $("#resetBtn");
  if (resetBtn) resetBtn.classList.toggle("hide", enabled);
}

/* ---- 説明(explained)フラグの永続化 ---- */
function loadExplained() {
  try { explained = JSON.parse(localStorage.getItem(EXPLAINED_KEY) || "{}"); }
  catch { explained = {}; }
}
function saveExplained() {
  try { localStorage.setItem(EXPLAINED_KEY, JSON.stringify(explained)); } catch { /* ignore */ }
}

/* ---- 旧進捗 → harness store 形式へ一度だけ移行（データ喪失回避） ---- */
function migrateLegacy() {
  const storeKey = `harness.${HARNESS_CONFIG.appId}.progress`;
  if (localStorage.getItem(storeKey)) return; // 既に新形式あり
  let legacy;
  try { legacy = JSON.parse(localStorage.getItem(LEGACY_KEY) || "null"); }
  catch { legacy = null; }
  if (!legacy || typeof legacy !== "object") return;
  const next = {};
  for (const [id, st] of Object.entries(legacy)) {
    next[id] = {
      memory:   { correctIds: st.memoryCorrect || [], cleared: !!st.memoryCleared, wrongQueue: [], reviewStage: 0, nextReviewAt: null },
      practice: { correctIds: st.practiceCorrect || [], cleared: !!st.practiceCleared, wrongQueue: st.wrongQueue || [], reviewStage: st.reviewStage || 0, nextReviewAt: st.nextReviewAt || null },
    };
    if (st.explained) explained[id] = true;
  }
  try { localStorage.setItem(storeKey, JSON.stringify(next)); } catch { /* ignore */ }
  saveExplained();
}

/* ============================================================
   engine/store 上の薄いシム（ビューはこの名前をそのまま使う）
   ============================================================ */
function questionsFor(itemId, mode) { return engine.questionsFor(itemId, mode); }
function correctIdsFor(itemId, mode) { return store.modeState(itemId, mode).correctIds; }
function modeCleared(itemId, mode) { return engine.isModeCleared(itemId, mode); }
function modeProgress(itemId, mode) { return engine.progressOf(itemId, mode); } // {total,correct,remaining}
function isComplete(itemId) { return engine.isUnitComplete(itemId); }
function stateFor(itemId) {
  return {
    explained: !!explained[itemId],
    memoryCleared: engine.isModeCleared(itemId, "memory"),
    practiceCleared: engine.isModeCleared(itemId, "practice"),
  };
}
function syncClearedFlags(itemId) { return stateFor(itemId); }

function grouped(itemsToGroup, key) {
  return [...new Set(itemsToGroup.map(item => item[key]))];
}

function currentItems() {
  return items
    .filter(item => item.course === selected.course)
    .filter(item => !selected.level || item.level === selected.level)
    .filter(item => !selected.unit || item.unit === selected.unit)
    .filter(item => !$("#incompleteOnly").checked || !isComplete(item.id))
    .sort((a, b) => a.order - b.order);
}

function setVisible(panel) {
  for (const id of ["homePanel", "itemPanel", "checkerPanel"]) {
    $(`#${id}`).classList.toggle("hide", id !== panel);
  }
}

function renderSelectors() {
  const courses = grouped(items, "course");
  $("#courseSel").innerHTML = courses.map(course =>
    `<option value="${esc(course)}">${esc(COURSE_LABELS[course] || course)}</option>`
  ).join("");
  if (!courses.includes(selected.course)) selected.course = courses[0] || "";
  $("#courseSel").value = selected.course;

  const courseItems = items.filter(item => item.course === selected.course);
  const levels = grouped(courseItems, "level");
  if (!levels.includes(selected.level)) selected.level = levels[0] || "";
  $("#levelSel").innerHTML = levels.map(level =>
    `<option value="${esc(level)}">${esc(level)}</option>`
  ).join("");
  $("#levelSel").value = selected.level;

  const levelItems = courseItems.filter(item => item.level === selected.level);
  const units = grouped(levelItems, "unit");
  if (!units.includes(selected.unit)) selected.unit = units[0] || "";
  $("#unitSel").innerHTML = units.map(unit =>
    `<option value="${esc(unit)}">${esc(unit)}</option>`
  ).join("");
  $("#unitSel").value = selected.unit;
}

function statusBadges(item) {
  const state = syncClearedFlags(item.id);
  const memory = modeProgress(item.id, "memory");
  const practice = modeProgress(item.id, "practice");
  return [
    `<span class="badge ${state.explained ? "ok" : ""}">説明 ${state.explained ? "済" : "未"}</span>`,
    `<span class="badge ${state.memoryCleared ? "ok" : "warn"}">暗記 ${state.memoryCleared ? "済" : `${memory.correct}/${memory.total}`}</span>`,
    `<span class="badge ${state.practiceCleared ? "ok" : "warn"}">演習 ${state.practiceCleared ? "済" : `${practice.correct}/${practice.total}`}</span>`,
    `<span class="badge ${isComplete(item.id) ? "ok" : ""}">完了 ${isComplete(item.id) ? "済" : "未"}</span>`
  ].join("");
}

function renderSummary() {
  const scope = items.filter(item => item.course === selected.course);
  const done = scope.filter(item => isComplete(item.id)).length;
  $("#progressSummary").textContent = `${done}/${scope.length} 完了`;
}

function renderItemList() {
  renderSummary();
  const list = currentItems();
  $("#itemList").innerHTML = list.length ? list.map(item => `
    <button class="itemCard ${isComplete(item.id) ? "done" : ""}" type="button" data-id="${esc(item.id)}">
      <div class="itemMeta">${esc(COURSE_LABELS[item.course])} / ${esc(item.level)} / ${esc(item.unit)}</div>
      <h3>${esc(item.item)}</h3>
      <div class="badgeRow">${statusBadges(item)}</div>
    </button>
  `).join("") : `<div class="empty">この条件に該当する文法事項はありません。</div>`;

  $$(".itemCard").forEach(button => {
    button.onclick = () => openItem(button.dataset.id, "explain");
  });
}

function renderHome() {
  renderSelectors();
  renderItemList();
  setVisible("homePanel");
}

function currentItem() {
  return items.find(item => item.id === selected.itemId);
}

function openItem(itemId, tab = "explain") {
  selected.itemId = itemId;
  activeTab = tab;
  quizState = null;
  renderItemPanel();
  setVisible("itemPanel");
}

function renderItemPanel() {
  const item = currentItem();
  const state = stateFor(item.id);
  $("#itemBreadcrumb").textContent = `${COURSE_LABELS[item.course]} / ${item.level} / ${item.unit}`;
  $("#itemTitle").textContent = item.item;
  $("#itemStatusLine").innerHTML = statusBadges(item);
  $$(".tab").forEach(tab => tab.classList.remove("active"));
  $(`#tab${activeTab[0].toUpperCase()}${activeTab.slice(1)}`).classList.add("active");

  if (activeTab === "explain") renderExplain(item, state);
  if (activeTab === "memory") renderQuiz(item, "memory");
  if (activeTab === "practice") renderQuiz(item, "practice");
}

function renderExplain(item, state) {
  const ex = item.explanation;
  $("#tabBody").innerHTML = `
    <div class="explainGrid">
      <div class="noteCell"><strong>一言ルール</strong><p>${esc(ex.rule)}</p></div>
      <div class="noteCell"><strong>形・公式</strong><p>${esc(ex.form)}</p></div>
      <div class="noteCell"><strong>使う場面</strong><p>${esc(ex.usage)}</p></div>
      <div class="noteCell"><strong>例文</strong><p>${esc(ex.example)}<br><span class="hint">${esc(ex.translation)}</span></p></div>
      <div class="noteCell"><strong>よくあるミス</strong><p>${esc(ex.mistake)}</p></div>
    </div>
    <div class="actions">
      <button class="cta" id="markExplainBtn" type="button">${state.explained ? "確認済み" : "説明を確認済みにする"}</button>
      <button class="ghost" id="goMemoryBtn" type="button">暗記4択へ</button>
      <button class="ghost" id="goPracticeBtn" type="button">練習問題へ</button>
    </div>
  `;
  $("#markExplainBtn").onclick = () => {
    explained[item.id] = true;
    saveExplained();
    if (cloud) cloud.queueSave();   // explained は store を触らないので明示的に同期
    renderItemPanel();
  };
  $("#goMemoryBtn").onclick = () => switchTab("memory");
  $("#goPracticeBtn").onclick = () => switchTab("practice");
}

function switchTab(tab) {
  activeTab = tab;
  quizState = null;
  renderItemPanel();
}

function shuffled(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function unresolvedQuestions(itemId, mode) {
  const correct = new Set(correctIdsFor(itemId, mode));
  return questionsFor(itemId, mode).filter(q => !correct.has(q.id));
}

function ensureQuiz(item, mode) {
  if (quizState && quizState.itemId === item.id && quizState.mode === mode) return;
  const pool = shuffled(unresolvedQuestions(item.id, mode));
  quizState = {
    itemId: item.id,
    mode,
    pool,
    index: 0,
    round: 1,
    answered: false,
    selectedChoice: null
  };
}

function nextQuestion() {
  if (quizState.index >= quizState.pool.length - 1) {
    quizState.pool = shuffled(unresolvedQuestions(quizState.itemId, quizState.mode));
    quizState.index = 0;
    quizState.round += 1;
  } else {
    quizState.index += 1;
  }
  quizState.answered = false;
  quizState.selectedChoice = null;
}

function renderQuiz(item, mode) {
  ensureQuiz(item, mode);
  const state = syncClearedFlags(item.id);
  const { total, correct: correctCount, remaining } = modeProgress(item.id, mode);
  const cleared = mode === "memory" ? state.memoryCleared : state.practiceCleared;
  const title = mode === "memory" ? "暗記4択" : "空所補充4択";
  const description = mode === "memory"
    ? "全2問を正解すると暗記クリア。間違えた問題だけ次の周回に残ります。"
    : "全5問を正解すると演習クリア。間違えた問題だけ次の周回に残ります。";

  if (cleared || !quizState.pool.length) {
    $("#tabBody").innerHTML = `
      <div class="quizBox">
        <div class="quizTop">
          <div>
            <p class="label">${esc(title)}</p>
            <div class="hint">${correctCount}/${total} 正解済み</div>
          </div>
          <div class="streak">クリア済み</div>
        </div>
        <p class="stem">この文法事項の${esc(title)}は全問正解済みです。</p>
      </div>
      <div class="actions">
        <button class="ghost" id="backExplainBtn" type="button">説明へ戻る</button>
        <button class="ghost" id="restartQuizBtn" type="button">このモードをやり直す</button>
      </div>
    `;
    $("#backExplainBtn").onclick = () => switchTab("explain");
    $("#restartQuizBtn").onclick = () => restartMode(item.id, mode);
    return;
  }

  const q = quizState.pool[quizState.index];
  const currentRoundSize = quizState.pool.length;

  $("#tabBody").innerHTML = `
    <div class="quizBox">
      <div class="quizTop">
        <div>
          <p class="label">${esc(title)}</p>
          <div class="hint">${esc(description)}</div>
        </div>
        <div class="streak">正解済み ${correctCount}/${total} / 残り ${remaining}</div>
      </div>
      <div class="roundInfo">第${quizState.round}周: ${quizState.index + 1}/${currentRoundSize} 問目</div>
      <p class="stem">${esc(q.stem).replace("___", '<span class="blank"></span>')}</p>
      <div class="choices">
        ${q.choices.map((choice, index) => `
          <button class="choiceBtn" type="button" data-choice="${esc(choice)}">
            <span class="key">${KEYS[index]}</span><span>${esc(choice)}</span>
          </button>
        `).join("")}
      </div>
      <div id="feedbackSlot"></div>
    </div>
    <div class="actions">
      <button class="ghost" id="backExplainBtn" type="button">説明へ戻る</button>
      <button class="cta hide" id="nextQuestionBtn" type="button">次の問題へ</button>
    </div>
  `;

  $$(".choiceBtn").forEach(button => {
    button.onclick = () => answerQuestion(button.dataset.choice);
  });
  $("#backExplainBtn").onclick = () => switchTab("explain");
  $("#nextQuestionBtn").onclick = () => {
    nextQuestion();
    renderQuiz(item, mode);
  };
}

function restartMode(itemId, mode) {
  store.resetMode(itemId, mode);
  store.save();
  quizState = null;
  renderItemPanel();
}

function answerQuestion(choice) {
  if (quizState.answered) return;
  quizState.answered = true;
  quizState.selectedChoice = choice;
  const item = currentItem();
  const q = quizState.pool[quizState.index];
  const mode = quizState.mode;

  // 判定・進捗更新・クリア再判定・Leitner・保存を engine が一括で行う
  const res = engine.answer(item.id, mode, q.id, choice);
  const correct = res.correct;

  $$(".choiceBtn").forEach(button => {
    button.disabled = true;
    if (button.dataset.choice === q.answer) button.classList.add("correct");
    if (button.dataset.choice === choice && !correct) button.classList.add("wrong");
  });
  $("#feedbackSlot").innerHTML = feedbackHtml(q, choice, correct, mode);
  $("#nextQuestionBtn").textContent = res.modeCleared ? "クリアを確認" : "次の問題へ";
  $("#nextQuestionBtn").classList.remove("hide");
  renderItemStatusOnly();
}

function feedbackHtml(q, choice, correct, mode) {
  const r = q.rationale || {};
  const wrongEntries = Object.entries(r.whyWrong || {});
  const wrongHtml = wrongEntries.length
    ? `<ul class="explainList">${wrongEntries.map(([key, value]) =>
        `<li><strong>${esc(key)}</strong>: ${esc(value)}</li>`
      ).join("")}</ul>`
    : "";
  const translation = r.translation ? `<p><strong>訳:</strong> ${esc(r.translation)}</p>` : "";
  return `
    <div class="feedback ${correct ? "ok" : "ng"}">
      <h3>${correct ? "正解" : "不正解"}</h3>
      <p><strong>正解:</strong> ${esc(q.answer)}</p>
      <p><strong>なぜ正解か:</strong> ${esc(r.whyCorrect)}</p>
      ${wrongHtml ? `<p><strong>他の選択肢:</strong></p>${wrongHtml}` : ""}
      ${translation}
      ${!correct ? `<p class="hint">あなたの解答: ${esc(choice)}</p>` : ""}
    </div>
  `;
}

function renderItemStatusOnly() {
  const item = currentItem();
  $("#itemStatusLine").innerHTML = statusBadges(item);
}

function renderChecker() {
  const byCourse = grouped(items, "course");
  $("#checkerBody").innerHTML = byCourse.map(course => {
    const courseItems = items.filter(item => item.course === course);
    const complete = courseItems.filter(item => isComplete(item.id)).length;
    const rows = courseItems.map(item => {
      const state = syncClearedFlags(item.id);
      const memory = modeProgress(item.id, "memory");
      const practice = modeProgress(item.id, "practice");
      return `
        <div class="checkerRow">
          <div class="checkerCell">${esc(item.level)} / ${esc(item.unit)} / ${esc(item.item)}</div>
          <div class="checkerCell state ${state.explained ? "ok" : "ng"}">説明 ${state.explained ? "済" : "未"}</div>
          <div class="checkerCell state ${state.memoryCleared ? "ok" : "ng"}">暗記 ${state.memoryCleared ? "済" : `${memory.correct}/${memory.total}`}</div>
          <div class="checkerCell state ${state.practiceCleared ? "ok" : "ng"}">演習 ${state.practiceCleared ? "済" : `${practice.correct}/${practice.total}`}</div>
          <div class="checkerCell state ${isComplete(item.id) ? "ok" : "ng"}">完了 ${isComplete(item.id) ? "済" : "未"}</div>
        </div>
      `;
    }).join("");
    return `
      <div class="checkerGroup">
        <div class="checkerGroupHead">
          <span>${esc(COURSE_LABELS[course] || course)}</span>
          <span>${complete}/${courseItems.length} 完了</span>
        </div>
        <div class="checkerRows">${rows}</div>
      </div>
    `;
  }).join("");
  setVisible("checkerPanel");
}

function bindEvents() {
  $("#courseSel").onchange = event => {
    selected.course = event.target.value;
    selected.level = "";
    selected.unit = "";
    renderHome();
  };
  $("#levelSel").onchange = event => {
    selected.level = event.target.value;
    selected.unit = "";
    renderHome();
  };
  $("#unitSel").onchange = event => {
    selected.unit = event.target.value;
    renderHome();
  };
  $("#incompleteOnly").onchange = renderItemList;
  $("#backToListBtn").onclick = renderHome;
  $("#checkerTopBtn").onclick = renderChecker;
  $("#checkerCloseBtn").onclick = renderHome;
  $("#resetBtn").onclick = () => {
    if (cloud && cloud.isEnabled()) return;   // 共有モードでは進捗を消さない
    if (!confirm("v2の進捗をリセットしますか？")) return;
    store.resetAll();
    store.save();                              // onChange 経由でクラウドにも反映
    explained = {};
    saveExplained();
    renderHome();
  };
  $("#tabExplain").onclick = () => switchTab("explain");
  $("#tabMemory").onclick = () => switchTab("memory");
  $("#tabPractice").onclick = () => switchTab("practice");
}

async function init() {
  try {
    const [itemData, extraItemData, bankData] = await Promise.all([
      loadJson("data/grammar_items.json"),
      loadOptionalJson("data/grammar_items_extra.json", { items: [] }),
      loadJson("data/grammar_bank.json")
    ]);
    items = [...(itemData.items || []), ...(extraItemData.items || [])].sort((a, b) => a.order - b.order);
    units = buildUnits(items, bankData);

    loadExplained();
    migrateLegacy();                 // 旧進捗があれば新形式へ（store.load 前に）
    // store の変更（engine.answer 内の save 等）を検知してクラウドへデバウンス保存
    store = createStore({
      appId: HARNESS_CONFIG.appId,
      modes: HARNESS_CONFIG.modes,
      onChange: () => { if (cloud) cloud.queueSave(); },
    });
    store.load();
    engine = createEngine(HARNESS_CONFIG, { store, units });

    // 生徒別クラウド同期（共有URL ?s=&t= があり config.json が揃うときのみ有効）
    cloud = createCloud({
      appId: HARNESS_CONFIG.appId,
      getPayload: collectCloudPayload,
      applyLoaded: applyCloudPayload,
      onStatus: setShareStatus,
    });
    await cloud.init();
    applySharedUi();

    bindEvents();
    renderHome();
  } catch (error) {
    $("#homePanel").innerHTML = `<div class="empty">データの読み込みに失敗しました: ${esc(error.message)}</div>`;
  }
}

init();
