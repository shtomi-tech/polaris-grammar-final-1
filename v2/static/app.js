const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

const STORAGE_KEY = "englishGrammarV2.progress";
const COURSE_LABELS = { junior: "中学英文法", senior: "高校・大学受験英文法" };
const KEYS = ["ア", "イ", "ウ", "エ"];

let items = [];
let memoryQuestions = [];
let practiceQuestions = [];
let progress = {};
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

function loadProgress() {
  try {
    progress = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    progress = {};
  }
}

function saveProgress() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

function defaultProgress() {
  return {
    explained: false,
    memoryCleared: false,
    practiceCleared: false,
    memoryCorrect: [],
    practiceCorrect: [],
    wrongQueue: [],
    reviewStage: 0,
    nextReviewAt: null
  };
}

function stateFor(itemId) {
  if (!progress[itemId]) progress[itemId] = defaultProgress();
  if (!Array.isArray(progress[itemId].memoryCorrect)) progress[itemId].memoryCorrect = [];
  if (!Array.isArray(progress[itemId].practiceCorrect)) progress[itemId].practiceCorrect = [];
  if (!Array.isArray(progress[itemId].wrongQueue)) progress[itemId].wrongQueue = [];
  if (progress[itemId].memoryCleared && progress[itemId].memoryCorrect.length === 0) {
    progress[itemId].memoryCorrect = questionsFor(itemId, "memory").map(q => q.id);
  }
  if (progress[itemId].practiceCleared && progress[itemId].practiceCorrect.length === 0) {
    progress[itemId].practiceCorrect = questionsFor(itemId, "practice").map(q => q.id);
  }
  return progress[itemId];
}

function correctIdsFor(itemId, mode) {
  const state = stateFor(itemId);
  return mode === "memory" ? state.memoryCorrect : state.practiceCorrect;
}

function modeCleared(itemId, mode) {
  const ids = new Set(correctIdsFor(itemId, mode));
  const total = questionsFor(itemId, mode).length;
  return total > 0 && ids.size >= total;
}

function modeProgress(itemId, mode) {
  const total = questionsFor(itemId, mode).length;
  const correct = new Set(correctIdsFor(itemId, mode)).size;
  const remaining = Math.max(total - correct, 0);
  return { total, correct, remaining };
}

function syncClearedFlags(itemId) {
  const state = stateFor(itemId);
  state.memoryCleared = modeCleared(itemId, "memory");
  state.practiceCleared = modeCleared(itemId, "practice");
  return state;
}

function isComplete(itemId) {
  const state = syncClearedFlags(itemId);
  return state.memoryCleared && state.practiceCleared;
}

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

function questionsFor(itemId, mode) {
  const source = mode === "memory" ? memoryQuestions : practiceQuestions;
  return source.filter(q => q.itemId === itemId);
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
    stateFor(item.id).explained = true;
    saveProgress();
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

function scheduleReview(state) {
  const days = [1, 3, 7, 14];
  const stage = Math.min(state.reviewStage || 0, days.length - 1);
  const next = new Date();
  next.setDate(next.getDate() + days[stage]);
  state.nextReviewAt = next.toISOString();
  state.reviewStage = Math.min(stage + 1, days.length - 1);
}

function restartMode(itemId, mode) {
  const state = stateFor(itemId);
  if (mode === "memory") {
    state.memoryCorrect = [];
    state.memoryCleared = false;
  } else {
    state.practiceCorrect = [];
    state.practiceCleared = false;
    state.nextReviewAt = null;
  }
  saveProgress();
  quizState = null;
  renderItemPanel();
}

function answerQuestion(choice) {
  if (quizState.answered) return;
  quizState.answered = true;
  quizState.selectedChoice = choice;
  const item = currentItem();
  const q = quizState.pool[quizState.index];
  const state = stateFor(item.id);
  const correct = choice === q.answer;
  const mode = quizState.mode;
  const wasPracticeCleared = state.practiceCleared;

  const correctIds = correctIdsFor(item.id, mode);
  if (correct && !correctIds.includes(q.id)) correctIds.push(q.id);
  if (mode === "memory") {
    state.memoryCleared = modeCleared(item.id, "memory");
  } else {
    state.practiceCleared = modeCleared(item.id, "practice");
    if (state.practiceCleared && !wasPracticeCleared) {
      scheduleReview(state);
    }
  }
  if (correct) {
    state.wrongQueue = state.wrongQueue.filter(id => id !== q.id);
  } else if (!state.wrongQueue.includes(q.id)) {
    state.wrongQueue.push(q.id);
  }
  saveProgress();

  $$(".choiceBtn").forEach(button => {
    button.disabled = true;
    if (button.dataset.choice === q.answer) button.classList.add("correct");
    if (button.dataset.choice === choice && !correct) button.classList.add("wrong");
  });
  $("#feedbackSlot").innerHTML = feedbackHtml(q, choice, correct, mode);
  const nowCleared = mode === "memory" ? state.memoryCleared : state.practiceCleared;
  $("#nextQuestionBtn").textContent = nowCleared ? "クリアを確認" : "次の問題へ";
  $("#nextQuestionBtn").classList.remove("hide");
  renderItemStatusOnly();
}

function feedbackHtml(q, choice, correct, mode) {
  const wrongEntries = Object.entries(q.whyWrong || {});
  const wrongHtml = wrongEntries.length
    ? `<ul class="explainList">${wrongEntries.map(([key, value]) =>
        `<li><strong>${esc(key)}</strong>: ${esc(value)}</li>`
      ).join("")}</ul>`
    : "";
  const translation = q.translation ? `<p><strong>訳:</strong> ${esc(q.translation)}</p>` : "";
  const answerLine = mode === "memory" ? "正解" : "正解";
  return `
    <div class="feedback ${correct ? "ok" : "ng"}">
      <h3>${correct ? "正解" : "不正解"}</h3>
      <p><strong>${answerLine}:</strong> ${esc(q.answer)}</p>
      <p><strong>なぜ正解か:</strong> ${esc(q.whyCorrect)}</p>
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
    if (!confirm("v2の進捗をリセットしますか？")) return;
    progress = {};
    saveProgress();
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
    memoryQuestions = bankData.memoryQuestions || [];
    practiceQuestions = bankData.practiceQuestions || [];
    loadProgress();
    bindEvents();
    renderHome();
  } catch (error) {
    $("#homePanel").innerHTML = `<div class="empty">データの読み込みに失敗しました: ${esc(error.message)}</div>`;
  }
}

init();
