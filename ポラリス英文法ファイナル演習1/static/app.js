const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

const LEGACY_STORAGE_KEY = "polarisFinalGrammar1.progress";
const STORAGE_PREFIX = "polarisFinalGrammar1.progress.";
const STUDENTS_KEY = "polarisFinalGrammar1.students";
const ACTIVE_STUDENT_KEY = "polarisFinalGrammar1.activeStudent";
const DEFAULT_STUDENT = { id: "default", name: "共通" };
const KEYS = ["ア", "イ", "ウ", "エ"];

let questionData = { source: {}, units: [], questions: [] };
let students = [];
let activeStudentId = DEFAULT_STUDENT.id;
let progress = {};
let selected = { unitId: "", setId: "", mode: "all" };
let quiz = null;

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
}

function stateFor(questionId) {
  if (!progress[questionId]) {
    progress[questionId] = {
      attempts: 0,
      correct: 0,
      wrong: 0,
      lastChoice: null,
      lastAnsweredAt: null,
      cleared: false
    };
  }
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

function filteredQuestions(unitId, setId, mode) {
  const questions = questionsForSet(unitId, setId);
  if (mode === "unresolved") return questions.filter(question => !stateFor(question.id).cleared);
  if (mode === "wrong") return questions.filter(question => stateFor(question.id).wrong > 0 && !stateFor(question.id).cleared);
  return questions;
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
  for (const id of ["homePanel", "quizPanel", "summaryPanel"]) {
    $(`#${id}`).classList.toggle("hide", id !== panel);
  }
}

function renderStudentControls() {
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
  $("#modeSel").value = selected.mode;
}

function badgeHtml(stats) {
  return [
    `<span class="badge ${stats.cleared === stats.total && stats.total ? "ok" : "warn"}">正解済 ${stats.cleared}/${stats.total}</span>`,
    `<span class="badge ${stats.remaining === 0 && stats.total ? "ok" : ""}">残り ${stats.remaining}</span>`,
    `<span class="badge ${stats.wrong ? "warn" : "ok"}">誤答 ${stats.wrong}</span>`
  ].join("");
}

function renderSetList() {
  const allStats = statsFor(questionData.questions);
  $("#progressSummary").textContent = `${activeStudent().name}: ${allStats.cleared}/${allStats.total} 正解済`;
  const units = questionData.units;
  $("#setList").innerHTML = units.map(unit => {
    const cards = unit.sets.map(set => {
      const stats = statsFor(questionsForSet(unit.id, set.id));
      return `
        <button class="itemCard ${stats.remaining === 0 && stats.total ? "done" : ""}" type="button" data-unit="${esc(unit.id)}" data-set="${esc(set.id)}">
          <div class="itemMeta">${esc(unit.title)}</div>
          <h3>${esc(set.title)}</h3>
          <div class="badgeRow">${badgeHtml(stats)}</div>
        </button>
      `;
    }).join("");
    return cards;
  }).join("") || `<div class="empty">問題データがまだありません。スクショOCR後に data/polaris_questions.json へ追加します。</div>`;

  $$(".itemCard").forEach(card => {
    card.onclick = () => {
      selected.unitId = card.dataset.unit;
      selected.setId = card.dataset.set;
      renderHome();
      startQuiz(false);
    };
  });
}

function renderHome() {
  renderStudentControls();
  renderSelectors();
  renderSetList();
  setVisible("homePanel");
}

function startQuiz(globalReview) {
  const pool = globalReview
    ? allUnresolvedQuestions()
    : filteredQuestions(selected.unitId, selected.setId, selected.mode);
  quiz = {
    globalReview,
    pool: shuffled(pool),
    index: 0,
    answered: false,
    selectedChoice: null
  };
  renderQuiz();
  setVisible("quizPanel");
}

function currentQuestion() {
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
  $("#quizTitle").textContent = quiz.globalReview ? "全体復習" : set?.title || "4択演習";
  const stats = statsFor(quiz.pool);
  const stem = String(q.stem || "").replace(/\n/g, "<br>");

  $("#quizBody").innerHTML = `
    <div class="quizBox">
      <div class="quizTop">
        <div>
          <p class="label">Question ${esc(q.no)}</p>
          <div class="hint">${quiz.index + 1}/${quiz.pool.length} 問目 / この演習内の未正解 ${stats.remaining}</div>
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
    state.cleared = true;
  } else {
    state.wrong += 1;
    state.cleared = false;
  }
  saveProgress();

  $$(".choiceBtn").forEach(button => {
    const index = Number(button.dataset.index);
    button.disabled = true;
    if (index === q.answerIndex) button.classList.add("correct");
    if (index === choiceIndex && !correct) button.classList.add("wrong");
  });
  $("#feedbackSlot").innerHTML = feedbackHtml(q, choiceIndex, correct);
  $("#nextBtn").classList.remove("hide");
  $("#nextBtn").textContent = quiz.index >= quiz.pool.length - 1 ? "結果を確認" : "次の問題へ";
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
  if (quiz.index < quiz.pool.length - 1) {
    quiz.index += 1;
    quiz.answered = false;
    quiz.selectedChoice = null;
    return;
  }
  renderSummary();
}

function renderSummary() {
  renderStudentControls();
  const rows = questionData.units.map(unit => {
    const setRows = unit.sets.map(set => {
      const stats = statsFor(questionsForSet(unit.id, set.id));
      return `
        <div class="checkerRow">
          <div class="checkerCell">${esc(unit.title)} / ${esc(set.title)}</div>
          <div class="checkerCell state ${stats.cleared === stats.total && stats.total ? "ok" : "ng"}">正解済 ${stats.cleared}/${stats.total}</div>
          <div class="checkerCell state ${stats.remaining === 0 && stats.total ? "ok" : "ng"}">残り ${stats.remaining}</div>
          <div class="checkerCell state ${stats.wrong ? "ng" : "ok"}">誤答 ${stats.wrong}</div>
          <div class="checkerCell state ${stats.total ? "ok" : "ng"}">収録 ${stats.total}</div>
        </div>
      `;
    }).join("");
    return `
      <div class="checkerGroup">
        <div class="checkerGroupHead">
          <span>${esc(unit.title)}</span>
          <span>${statsFor(questionData.questions.filter(q => q.unitId === unit.id)).cleared}/${questionData.questions.filter(q => q.unitId === unit.id).length}</span>
        </div>
        <div class="checkerRows">${setRows}</div>
      </div>
    `;
  }).join("");
  $("#summaryBody").innerHTML = rows || `<div class="empty">問題データがまだありません。</div>`;
  setVisible("summaryPanel");
}

function bindEvents() {
  $("#studentSel").onchange = event => {
    activeStudentId = event.target.value;
    localStorage.setItem(ACTIVE_STUDENT_KEY, activeStudentId);
    loadProgress();
    quiz = null;
    renderHome();
  };
  $("#addStudentBtn").onclick = () => {
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
  $("#summaryBtn").onclick = renderSummary;
  $("#summaryCloseBtn").onclick = renderHome;
  $("#resetBtn").onclick = () => {
    if (!confirm(`${activeStudent().name} のポラリス演習の進捗をリセットしますか？`)) return;
    progress = {};
    saveProgress();
    renderHome();
  };
}

async function init() {
  try {
    questionData = await loadJson("data/polaris_questions.json");
    loadStudents();
    migrateLegacyProgress();
    loadProgress();
    bindEvents();
    renderHome();
  } catch (error) {
    $("#homePanel").innerHTML = `<div class="empty">データの読み込みに失敗しました: ${esc(error.message)}</div>`;
  }
}

init();
