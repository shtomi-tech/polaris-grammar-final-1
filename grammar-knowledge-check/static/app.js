(() => {
  "use strict";

  const DATA = window.GRAMMAR_CHECK_DATA;
  const KEY = "grammar-knowledge-check-v2";
  const APP_ID = "grammar-knowledge-check";
  const SESSION_VERSION = 1;
  const REVIEW_LADDER_DAYS = [1, 3, 7, 14];
  const app = document.querySelector("#app");
  const resetButton = document.querySelector("#resetButton");
  const keys = ["1", "2", "3", "4"];
  const skillLabels = {
    knowledge: "知識"
  };
  const domainById = new Map(DATA.domains.map(domain => [domain.id, domain]));
  const questionById = new Map(DATA.questions.map(question => [question.id, question]));
  let session = null;
  let pendingChoice = null;
  let pendingUncertain = false;
  let answerRevealed = false;
  let cloud = null;

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function loadHistory() {
    try {
      const history = JSON.parse(localStorage.getItem(KEY)) || null;
      if (history && !history.spacedSchedule) {
        const answers = history.total === DATA.questions.length && Array.isArray(history.answers)
          ? history.answers
          : Object.values(history.stageResults || {}).flatMap(result => Array.isArray(result.answers) ? result.answers : []);
        history.spacedSchedule = scheduleNewAnswers({}, answers);
        localStorage.setItem(KEY, JSON.stringify(history));
      }
      return history;
    } catch {
      return null;
    }
  }

  function grammarUnlocked(history = loadHistory()) {
    const stageResults = history?.stageResults || {};
    return DATA.learningStages.every((_, index) => Boolean(stageResults[`stage${index + 1}`]));
  }

  function updateGrammarNavigation(history = loadHistory()) {
    const unlocked = grammarUnlocked(history);
    const query = new URLSearchParams(location.search);
    const current = document.querySelector("#grammarLink");
    if (!current) return;
    let grammarLink = current;
    if (unlocked && current.tagName !== "A") {
      grammarLink = document.createElement("a");
      grammarLink.id = "grammarLink";
      current.replaceWith(grammarLink);
    } else if (!unlocked && current.tagName !== "SPAN") {
      grammarLink = document.createElement("span");
      grammarLink.id = "grammarLink";
      current.replaceWith(grammarLink);
    }
    grammarLink.classList.toggle("locked", !unlocked);
    if (unlocked) {
      grammarLink.href = trainerHref(query);
      grammarLink.removeAttribute("aria-disabled");
      grammarLink.title = "英文法演習を開く";
    } else {
      grammarLink.setAttribute("aria-disabled", "true");
      grammarLink.title = "5段階の基礎チェックを完了すると解放されます";
    }
    grammarLink.textContent = unlocked ? "英文法演習" : "英文法演習（基礎完了後）";
  }

  function saveHistory(result) {
    const previous = loadHistory() || {};
    if (result.kind === "spaced") {
      const next = {
        ...previous,
        spacedSchedule: updateSpacedSchedule(previous.spacedSchedule || {}, result.answers),
        lastSpacedReview: result,
        lastSpacedReviewAt: result.completedAt
      };
      delete next.inProgress;
      localStorage.setItem(KEY, JSON.stringify(next));
      if (cloud) cloud.queueSave();
      return;
    }
    if (result.kind === "review") {
      const next = { ...previous, lastReview: result, lastReviewAt: result.completedAt };
      delete next.inProgress;
      localStorage.setItem(KEY, JSON.stringify(next));
      if (cloud) cloud.queueSave();
      return;
    }
    const stageResults = { ...(previous.stageResults || {}) };
    if (result.stageKey) stageResults[result.stageKey] = result;
    const next = {
      ...result,
      stageResults,
      lastReview: previous.lastReview || null,
      spacedSchedule: scheduleNewAnswers(previous.spacedSchedule || {}, result.answers)
    };
    delete next.inProgress;
    localStorage.setItem(KEY, JSON.stringify(next));
    if (cloud) cloud.queueSave();
  }

  function saveInProgress() {
    if (!session) return;
    const previous = loadHistory() || {};
    const inProgress = {
      version: SESSION_VERSION,
      kind: session.kind || "check",
      stageIndex: session.stageIndex,
      stageKey: session.stageKey,
      stageLabel: session.stageLabel,
      index: session.index,
      questions: session.questions.map(question => ({ id: question.id, choices: question.choices })),
      responses: session.responses.map(response => ({ ...response })),
      pendingChoice,
      pendingUncertain,
      answerRevealed,
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(KEY, JSON.stringify({ ...previous, inProgress }));
    if (cloud) cloud.queueSave();
  }

  function clearInProgress() {
    const previous = loadHistory();
    if (!previous?.inProgress) return;
    delete previous.inProgress;
    localStorage.setItem(KEY, JSON.stringify(previous));
    if (cloud) cloud.queueSave();
  }

  function resumeLabel(saved) {
    if (!saved) return "";
    if (saved.answerRevealed) return `${saved.stageLabel || "学習"} — 解説を確認して続ける`;
    return `${saved.stageLabel || "学習"} — 第${Math.min(Number(saved.index || 0) + 1, saved.questions?.length || 1)}問から再開`;
  }

  function restoreInProgress() {
    const saved = loadHistory()?.inProgress;
    if (!saved || saved.version !== SESSION_VERSION || !Array.isArray(saved.questions) || !saved.questions.length) return false;
    const questions = saved.questions
      .map(item => {
        const question = questionById.get(item.id);
        return question ? { ...question, choices: Array.isArray(item.choices) && item.choices.length === 4 ? item.choices : shuffle(question.choices) } : null;
      })
      .filter(Boolean);
    if (!questions.length) return false;
    session = {
      kind: saved.kind || "check",
      stageIndex: saved.stageIndex ?? null,
      stageKey: saved.stageKey || null,
      stageLabel: saved.stageLabel || null,
      questions,
      responses: Array.isArray(saved.responses) ? saved.responses : [],
      index: Math.max(0, Math.min(Number(saved.index || 0), questions.length - 1))
    };
    pendingChoice = typeof saved.pendingChoice === "string" ? saved.pendingChoice : null;
    pendingUncertain = Boolean(saved.pendingUncertain);
    answerRevealed = Boolean(saved.answerRevealed && pendingChoice);
    renderQuiz();
    document.querySelector(answerRevealed ? "#instantFeedback" : "#choiceGrid")?.focus();
    return true;
  }

  function applyCloudProgress(progress) {
    const history = progress && typeof progress === "object" ? progress.history : null;
    if (history && typeof history === "object") localStorage.setItem(KEY, JSON.stringify(history));
  }

  function shuffle(items) {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function reviewCandidates(history = loadHistory()) {
    if (!history) return [];
    const baseAnswers = history.total === DATA.questions.length && Array.isArray(history.answers)
      ? history.answers
      : Object.values(history.stageResults || {}).flatMap(result => Array.isArray(result.answers) ? result.answers : []);
    const latestReview = new Map((history.lastReview?.answers || []).map(answer => [answer.id, answer]));
    const byId = new Map(baseAnswers.map(answer => [answer.id, latestReview.get(answer.id) || answer]));
    return [...byId.values()]
      .filter(answer => !answer.correct || answer.uncertain)
      .sort((a, b) => Number(a.correct) - Number(b.correct) || Number(b.uncertain) - Number(a.uncertain))
      .map(answer => questionById.get(answer.id))
      .filter(Boolean);
  }

  function dateOnly(date = new Date()) {
    return new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Tokyo" }).format(date);
  }

  function addDays(days) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return dateOnly(date);
  }

  function scheduleNewAnswers(schedule, answers) {
    const next = { ...schedule };
    for (const answer of answers || []) {
      if (answer.correct && !answer.uncertain) next[answer.id] = { stage: 0, nextReviewAt: addDays(REVIEW_LADDER_DAYS[0]) };
      else delete next[answer.id];
    }
    return next;
  }

  function updateSpacedSchedule(schedule, answers) {
    const next = { ...schedule };
    for (const answer of answers || []) {
      const current = next[answer.id] || { stage: 0 };
      if (answer.correct && !answer.uncertain) {
        const stage = Math.min(Number(current.stage || 0) + 1, REVIEW_LADDER_DAYS.length - 1);
        next[answer.id] = { stage, nextReviewAt: addDays(REVIEW_LADDER_DAYS[stage]) };
      } else {
        next[answer.id] = { stage: 0, nextReviewAt: addDays(1) };
      }
    }
    return next;
  }

  function spacedCandidates(history = loadHistory()) {
    if (!history?.spacedSchedule) return [];
    const today = dateOnly();
    return Object.entries(history.spacedSchedule)
      .filter(([, item]) => item?.nextReviewAt && item.nextReviewAt <= today)
      .map(([id]) => questionById.get(id))
      .filter(Boolean);
  }

  function startQuiz(stageIndex = null) {
    const stage = stageIndex === null ? null : DATA.learningStages[stageIndex];
    const ids = stage ? stage.questionIds : DATA.questionOrder;
    session = {
      index: 0,
      kind: "check",
      stageIndex,
      stageKey: stage ? `stage${stageIndex + 1}` : null,
      stageLabel: stage?.label || null,
      questions: ids.map(id => questionById.get(id)).map(question => ({ ...question, choices: shuffle(question.choices) })),
      responses: []
    };
    pendingChoice = null;
    pendingUncertain = false;
    answerRevealed = false;
    saveInProgress();
    renderQuiz();
  }

  function startReviewQuiz() {
    const questions = reviewCandidates().map(question => ({ ...question, choices: shuffle(question.choices) }));
    if (!questions.length) return home();
    session = {
      index: 0,
      kind: "review",
      stageIndex: null,
      stageKey: null,
      stageLabel: null,
      questions,
      responses: []
    };
    pendingChoice = null;
    pendingUncertain = false;
    answerRevealed = false;
    saveInProgress();
    renderQuiz();
  }

  function startSpacedQuiz() {
    const questions = spacedCandidates().map(question => ({ ...question, choices: shuffle(question.choices) }));
    if (!questions.length) return home();
    session = {
      index: 0,
      kind: "spaced",
      stageIndex: null,
      stageKey: null,
      stageLabel: null,
      questions,
      responses: []
    };
    pendingChoice = null;
    pendingUncertain = false;
    answerRevealed = false;
    saveInProgress();
    renderQuiz();
  }

  function home() {
    session = null;
    pendingChoice = null;
    pendingUncertain = false;
    answerRevealed = false;
    const history = loadHistory();
    updateGrammarNavigation(history);
    const stageResults = history?.stageResults || {};
    const completedStages = DATA.learningStages.filter((_, index) => stageResults[`stage${index + 1}`]).length;
    const nextStageIndex = DATA.learningStages.findIndex((_, index) => !stageResults[`stage${index + 1}`]);
    const reviewItems = reviewCandidates(history);
    const spacedItems = spacedCandidates(history);
    const inProgress = history?.inProgress;
    const hasCompletedResult = history && Number.isFinite(history.total) && Number.isFinite(history.score);
    const historyHtml = hasCompletedResult
      ? `<p class="muted">前回: ${escapeHtml(history.completedAt)} ／ ${history.score}/${history.total}問正解。記録はこの端末にのみ保存されます。</p>`
      : "<p class=\"muted\">進捗はこの端末のブラウザにのみ保存します。生徒名や外部サービスは使いません。</p>";
    const progressHtml = inProgress
      ? `<p class="muted">途中保存: ${escapeHtml(resumeLabel(inProgress))}。解答と解説の表示状態も保存しています。</p>`
      : "";
    const stageCards = DATA.learningStages.map((stage, index) => {
      const saved = stageResults[`stage${index + 1}`];
      return `<article class="measurementCard"><p class="kicker">STAGE ${index + 1}</p><strong>${saved ? `${saved.score}<span> / ${saved.total}</span>` : `${stage.questionIds.length}<span>問</span>`}</strong><p>${escapeHtml(stage.label)}</p><button class="secondary stageButton" data-stage-index="${index}" type="button">${saved ? "もう一度解く" : "この段階を解く"}</button></article>`;
    });
    const recommendedStageIndex = nextStageIndex >= 0 ? nextStageIndex : 0;
    const recommendedStage = stageCards[recommendedStageIndex];
    const otherStageCards = stageCards.filter((_, index) => index !== recommendedStageIndex).join("");
    app.innerHTML = `
      <section class="panel dark">
        <p class="kicker">START HERE / ABOUT 50 MINUTES</p>
        <h2>${DATA.questions.length}問で、英文法の基礎知識を一巡する。</h2>
        <p class="lead">品詞と文の骨組みから仮定法・語法まで、17分野の基礎を学習順に確認します。解答すると、その場で正答と解説を表示します。</p>
        <div class="overview" aria-label="アプリの概要">
          <div><strong>${DATA.questions.length}</strong><span>4択の基礎確認</span></div>
          <div><strong>17</strong><span>英文法の分野</span></div>
          <div><strong>5</strong><span>学習段階</span></div>
        </div>
        <div class="primaryAction">
          <button class="primary" id="startButton" type="button">${inProgress ? "途中から再開する" : (nextStageIndex >= 0 ? `第${nextStageIndex + 1}段階から始める` : "総合チェックをもう一度解く")} <span>${inProgress ? "保存済み" : (nextStageIndex >= 0 ? "推奨" : "復習")}</span></button>
          <p>段階ごとに進めても、120問の総合チェックを選んでも構いません。</p>
        </div>
      </section>
      <section class="panel">
        <p class="kicker">LEARNING PATH / ${completedStages} OF ${DATA.learningStages.length}</p>
        <h2>5段階で基礎を積み上げる</h2>
        <div class="recommendedStage"><p class="kicker">NEXT / 推奨</p>${recommendedStage}</div>
        <details class="otherStages"><summary>別の段階を選ぶ（${DATA.learningStages.length - 1}件）</summary><div class="measurementGrid">${otherStageCards}</div></details>
        <p class="shortcutHint">途中でやめても、次回は未完了の段階から再開できます。段階を完了すると結果を保存します。</p>
      </section>
      <section class="panel">
        <p class="kicker">FLOW</p>
        <h2>解く → その場で解説 → 弱点を知る</h2>
        <div class="flowSteps" aria-label="学習の流れ">
          <div><strong>1</strong><p>4択で${DATA.questions.length}問を解く</p></div>
          <div><strong>2</strong><p>正答と解説を確認する</p></div>
          <div><strong>3</strong><p>誤答の根拠を読み直す</p></div>
        </div>
        <p class="shortcutHint">数字キー 1〜4 で解答を選択、Enter で次へ進めます。</p>
        ${historyHtml}
        ${progressHtml}
      </section>
      <section class="panel">
        <p class="kicker">REVIEW / ${reviewItems.length} ITEMS</p>
        <h2>誤答と保留だけを復習する</h2>
        <p class="lead">誤答を先に、保留をその後に出題します。復習で正解できた問題は、次回の対象から外れます。</p>
        <button class="primary" id="startReviewButton" type="button" ${reviewItems.length ? "" : "disabled"}>${reviewItems.length ? `弱点${reviewItems.length}問を復習する` : "復習対象はありません"}</button>
      </section>
      <section class="panel">
        <p class="kicker">SPACED REVIEW / ${spacedItems.length} DUE</p>
        <h2>今日の間隔復習</h2>
        <p class="lead">正解が続いた問題ほど、1日後・3日後・7日後・14日後へ間隔を延ばします。</p>
        <button class="primary" id="startSpacedButton" type="button" ${spacedItems.length ? "" : "disabled"}>${spacedItems.length ? `今日の${spacedItems.length}問を復習する` : "今日の復習はありません"}</button>
      </section>
    `;
    document.querySelector("#startButton").addEventListener("click", () => {
      if (inProgress && restoreInProgress()) return;
      if (nextStageIndex >= 0) startQuiz(nextStageIndex);
      else startQuiz();
    });
    document.querySelectorAll(".stageButton").forEach(button => {
      button.addEventListener("click", () => startQuiz(Number(button.dataset.stageIndex)));
    });
    document.querySelector("#startReviewButton").addEventListener("click", startReviewQuiz);
    document.querySelector("#startSpacedButton").addEventListener("click", startSpacedQuiz);
  }

  function renderQuiz() {
    const question = session.questions[session.index];
    const percent = Math.round((session.index / session.questions.length) * 100);
    const domain = domainById.get(question.domain);
    const canContinue = answerRevealed;
    const answerStatus = answerRevealed
      ? "解説を確認したら、次へ進んでください。"
      : "答えを選ぶと、その場で採点します。";
    app.innerHTML = `
      <section class="panel">
        <div class="quizHead">
          <div>
            <p class="questionCount">この段階の問題 ${session.index + 1} / ${session.questions.length} · ${escapeHtml(skillLabels[question.skill])}</p>
            <p class="muted">${escapeHtml(domain.label)}</p>
          </div>
          <div class="progress">${session.index + 1} / ${session.questions.length}</div>
        </div>
        <div class="progressBar" aria-label="進捗 ${session.index + 1}/${session.questions.length}"><span style="width:${percent}%"></span></div>
        <h2 class="stem">${escapeHtml(question.stem)}</h2>
        <div class="choiceGrid" id="choiceGrid">
          ${question.choices.map((choice, index) => `
            <button class="choice${answerChoiceClass(question, choice)}" data-choice="${escapeHtml(choice)}" type="button" aria-pressed="${pendingChoice === choice}" ${answerRevealed ? "disabled" : ""}>
              <span class="key">${keys[index]}</span><span>${escapeHtml(choice)}</span>
            </button>
          `).join("")}
        </div>
        ${instantFeedbackHtml(question)}
        <div class="choiceActions">
          <label class="flag"><input id="uncertain" type="checkbox" ${pendingUncertain ? "checked" : ""}> 正解でも根拠が曖昧なら印を付ける</label>
          <div class="quizActionBar">
            <p>${answerStatus}</p>
            <button class="primary" id="nextButton" type="button" ${canContinue ? "" : "disabled"}>${answerRevealed ? (session.index === session.questions.length - 1 ? "結果を見る" : "次の問題へ") : "解答を選ぶ"}</button>
          </div>
        </div>
      </section>
    `;
    document.querySelectorAll(".choice").forEach(button => {
      button.addEventListener("click", () => {
        selectAnswer(button.dataset.choice);
      });
    });
    document.querySelector("#uncertain").addEventListener("change", event => {
      pendingUncertain = event.target.checked;
      saveInProgress();
    });
    document.querySelector("#nextButton").addEventListener("click", commitAnswer);
  }

  function answerChoiceClass(question, choice) {
    if (!answerRevealed) return pendingChoice === choice ? " selected" : "";
    if (choice === question.answer) return " correct";
    if (choice === pendingChoice) return " incorrect";
    return " subdued";
  }

  function selectAnswer(choice) {
    if (answerRevealed) return;
    pendingChoice = choice;
    revealAnswer();
  }

  function revealAnswer() {
    if (!pendingChoice) return;
    answerRevealed = true;
    saveInProgress();
    renderQuiz();
    document.querySelector("#instantFeedback")?.focus();
  }

  function instantFeedbackHtml(question) {
    if (!answerRevealed) return "";
    const correct = pendingChoice === question.answer;
    const state = correct ? "good" : "bad";
    const label = correct ? "正解" : "不正解";
    const misconception = !correct && question.misconceptions[pendingChoice]
      ? `<p><strong>今回の混同：</strong>${escapeHtml(question.misconceptions[pendingChoice])}</p>`
      : "";
    return `
      <section class="instantFeedback ${state}" id="instantFeedback" tabindex="-1" aria-live="polite">
        <p class="kicker">ANSWER / EXPLANATION</p>
        <h3>${label}</h3>
        <p><strong>正答：</strong>${escapeHtml(question.answer)}</p>
        ${!correct ? `<p><strong>あなたの解答：</strong>${escapeHtml(pendingChoice)}</p>` : ""}
        ${misconception}
        <p><strong>解説：</strong>${escapeHtml(question.explanation)}</p>
      </section>
    `;
  }

  function commitAnswer() {
    if (!answerRevealed) return;
    const question = session.questions[session.index];
    session.responses.push({
      id: question.id,
      chosen: pendingChoice,
      uncertain: pendingUncertain
    });
    pendingChoice = null;
    pendingUncertain = false;
    answerRevealed = false;
    session.index += 1;
    if (session.index < session.questions.length) {
      saveInProgress();
      renderQuiz();
      return;
    }
    const result = buildResult();
    saveHistory(result);
    renderResult(result);
  }

  function buildResult() {
    const byId = new Map(session.questions.map(question => [question.id, question]));
    const answers = session.responses.map(response => {
      const question = byId.get(response.id);
      const correct = response.chosen === question.answer;
      return {
        ...question,
        ...response,
        correct,
        misconception: correct ? null : question.misconceptions[response.chosen]
      };
    });
    return {
      version: 2,
      kind: session.kind || "check",
      stageIndex: session.stageIndex,
      stageKey: session.stageKey,
      stageLabel: session.stageLabel,
      completedAt: new Intl.DateTimeFormat("ja-JP", { dateStyle: "medium", timeStyle: "short" }).format(new Date()),
      total: answers.length,
      score: answers.filter(answer => answer.correct).length,
      answers
    };
  }

  function stageStats(result) {
    return DATA.learningStages.map((stage, index) => {
      const questionIds = new Set(stage.questionIds);
      const answers = result.answers.filter(answer => questionIds.has(answer.id));
      const correct = answers.filter(answer => answer.correct).length;
      return { index: index + 1, label: stage.label, answers, correct };
    });
  }

  function domainStats(result) {
    return DATA.domains.map(domain => {
      const answers = result.answers.filter(answer => answer.domain === domain.id);
      const correct = answers.filter(answer => answer.correct).length;
      const uncertain = answers.filter(answer => answer.uncertain).length;
      const rate = correct / answers.length;
      let status = "review";
      let label = answers.length < 3 ? "要追加確認" : "要確認";
      if (rate < .5) {
        status = "weak";
        label = "未定着";
      } else if (answers.length >= 3 && rate >= .8 && !uncertain) {
        status = "good";
        label = "定着";
      }
      return { domain, answers, correct, uncertain, rate, status, label };
    });
  }

  function misconceptionStats(result) {
    const counts = new Map();
    result.answers.filter(answer => answer.misconception).forEach(answer => {
      const current = counts.get(answer.misconception) || { text: answer.misconception, count: 0, domains: new Set() };
      current.count += 1;
      current.domains.add(domainById.get(answer.domain).label);
      counts.set(answer.misconception, current);
    });
    return [...counts.values()].sort((a, b) => b.count - a.count || a.text.localeCompare(b.text)).slice(0, 3);
  }

  function resultMessage(result) {
    const rate = result.score / result.total;
    if (rate >= .9) return "基礎事項はかなり整理されています。根拠で迷った項目だけを短く確認すれば十分です。";
    if (rate >= .7) return "骨組みはあります。誤答の数より、どの形を混同したかを見て復習すると戻りやすいです。";
    return "今は知識が散らばっている段階です。点数を急がず、下の混同を一つずつほどいてください。";
  }

  function appendQuery(target, query = "") {
    const value = query instanceof URLSearchParams ? query.toString() : String(query || "").replace(/^\?/, "");
    return value ? `${target}?${value}` : target;
  }

  function trainerHref(query = "") {
    const path = decodeURI(location.pathname);
    const localHost = ["", "localhost", "127.0.0.1"].includes(location.hostname);
    const localNestedApp = localHost && path.includes("/grammar-knowledge-check/");
    return appendQuery(localNestedApp ? "../ポラリス英文法ファイナル演習1/index.html" : "../", query);
  }

  function readingHref(query = "") {
    return appendQuery("../reading/", query);
  }

  function renderResult(result) {
    session = null;
    const stats = domainStats(result);
    const isReview = result.kind === "review";
    const isSpaced = result.kind === "spaced";
    const visibleStats = result.stageKey || isReview || isSpaced ? stats.filter(stat => stat.answers.length > 0) : stats;
    const stages = isReview || isSpaced ? [] : stageStats(result).filter(stat => !result.stageKey || stat.answers.length > 0);
    const misconceptions = misconceptionStats(result);
    const needsReview = visibleStats.filter(stat => stat.status !== "good");
    const priorityNames = needsReview.slice(0, 4).map(stat => stat.domain.label);
    const focusDomains = needsReview.map(stat => stat.domain.id);
    const history = loadHistory();
    updateGrammarNavigation(history);
    const completedStages = DATA.learningStages.filter((_, index) => history?.stageResults?.[`stage${index + 1}`]).length;
    const focusParams = new URLSearchParams(location.search);
    focusParams.set("focus", focusDomains.join(","));
    const nextStageIndex = result.stageIndex !== null && result.stageIndex !== undefined
      && result.stageIndex + 1 < DATA.learningStages.length
      ? result.stageIndex + 1
      : null;
    const allStagesComplete = completedStages === DATA.learningStages.length;
    const nextStepDescription = nextStageIndex !== null
      ? `次は第${nextStageIndex + 1}段階「${DATA.learningStages[nextStageIndex].label}」です。`
      : allStagesComplete
        ? "基礎チェックを完了しました。次はPolaris入試基礎演習へ進めます。"
        : (priorityNames.length ? `まずは「${priorityNames.join("・")}」の解説を確認します。` : "迷った分野の解説を短く確認します。");
    const nextStepAction = nextStageIndex !== null
      ? `<button class="primary" id="nextStepButton" type="button">第${nextStageIndex + 1}段階へ進む</button>`
      : allStagesComplete
        ? `<a class="primary" href="${escapeHtml(trainerHref(location.search))}">Polaris入試基礎演習へ進む</a>`
        : `<button class="primary" id="readGuideButton" type="button">弱点の解説を読む <span>推奨</span></button>`;
    const guideAction = nextStageIndex !== null || allStagesComplete
      ? `<button class="secondary quietAction" id="readGuideButton" type="button">弱点の解説を読む</button>`
      : "";
    app.innerHTML = `
      <section class="panel dark">
        <p class="kicker">RESULT / ${escapeHtml(result.completedAt)}</p>
        <h2>${isSpaced ? "間隔復習を完了" : (isReview ? "弱点復習を完了" : (result.stageLabel ? `第${result.stageIndex + 1}段階を完了` : "総合チェック完了"))}</h2>
        <div class="score"><strong>${result.score}</strong><span>/ ${result.total} 問正解</span></div>
        <p class="lead">${resultMessage(result)}</p>
        <div class="nextStep">
          <p class="kicker">NEXT STEP / RECOMMENDED</p>
          <p>${escapeHtml(nextStepDescription)}</p>
          ${nextStepAction}
        </div>
        ${guideAction}
        <button class="secondary quietAction" id="retryButton" type="button">${isSpaced ? "次回の間隔復習を確認する" : (isReview ? "残っている弱点をもう一度復習する" : (result.stageKey ? "この段階をもう一度解く" : "総合チェックをもう一度解く"))}</button>
        ${focusDomains.length ? `<a class="secondary quietAction" href="${escapeHtml(trainerHref(focusParams))}">弱点分野のPolaris問題へ進む</a>` : ""}
        <button class="secondary quietAction" id="backHomeButton" type="button">学習一覧へ戻る</button>
      </section>
      ${stages.length ? `<section class="panel">
        <p class="kicker">COVERAGE</p>
        <h2>学習範囲ごとの到達</h2>
        <div class="measurementGrid">
          ${stages.map(stat => `
            <article class="measurementCard">
              <p class="kicker">STAGE ${stat.index}</p>
              <strong>${stat.correct}<span> / ${stat.answers.length}</span></strong>
              <p>${escapeHtml(stat.label)}</p>
            </article>
          `).join("")}
        </div>
      </section>` : ""}
      <section class="panel">
        <p class="kicker">MISCONCEPTIONS</p>
        <h2>今、ほどく混同</h2>
        ${misconceptions.length ? `<div class="misconceptionList">${misconceptions.map(item => `<article><strong>${escapeHtml(item.text)}</strong><p>${item.count}問 / ${escapeHtml([...item.domains].join("・"))}</p></article>`).join("")}</div>` : "<div class=\"empty\">誤答から特定できる混同はありません。保留を付けた問題を見直してください。</div>"}
      </section>
      <section class="panel">
        <p class="kicker">PRIORITY</p>
        <h2>今、確認する分野</h2>
        <p class="muted">2問以下の分野は、全問正解でも判定を急がず「要追加確認」にしています。</p>
        <div class="domainList priorityList">
          ${(needsReview.length ? needsReview : stats).map(domainRowHtml).join("")}
        </div>
        <details class="allResults">
          <summary>17分野すべての結果を表示する</summary>
          <div class="domainList">${visibleStats.map(domainRowHtml).join("")}</div>
        </details>
      </section>
    `;
    document.querySelector("#readGuideButton")?.addEventListener("click", () => renderReview(result));
    document.querySelector("#nextStepButton")?.addEventListener("click", () => startQuiz(nextStageIndex));
    document.querySelector("#retryButton").addEventListener("click", () => {
      if (isSpaced) startSpacedQuiz();
      else if (isReview) startReviewQuiz();
      else if (result.stageIndex !== null && result.stageIndex !== undefined) startQuiz(result.stageIndex);
      else startQuiz();
    });
    document.querySelector("#backHomeButton").addEventListener("click", home);
  }

  function domainRowHtml(stat) {
    return `<div class="domainRow"><div><strong>${escapeHtml(stat.domain.label)}</strong><div class="domainMeta">${stat.correct}/${stat.answers.length} 正解${stat.uncertain ? ` / 保留 ${stat.uncertain}` : ""}</div></div><span class="status ${stat.status}">${stat.label}</span></div>`;
  }

  function renderReview(result) {
    const reviewAnswers = result.answers.filter(answer => !answer.correct || answer.uncertain);
    const reviewDomains = domainStats(result).filter(stat => stat.status !== "good");
    app.innerHTML = `
      <section class="panel dark">
        <p class="kicker">REVIEW / WRONG OR UNCERTAIN</p>
        <h2>解説を読む</h2>
        <p class="lead">正誤だけを追わず、選んだ誤答がどの混同から出たかを確認します。必要なら、解説の後で問題順を変えて解き直します。</p>
        <div class="primaryAction"><button class="primary" id="retryButton" type="button">解説を読んだら、もう一度${DATA.questions.length}問を解く</button><p>同じ学習順で、根拠まで言えるか確かめます。</p></div>
        <button class="secondary quietAction" id="backResultButton" type="button">結果へ戻る</button>
      </section>
      <section class="panel">
        <h2>あなたの解答</h2>
        ${reviewAnswers.length ? reviewAnswers.map(answerHtml).join("") : "<div class=\"empty\">誤答・保留はありません。</div>"}
      </section>
      <section class="panel">
        <h2>分野ごとの解説</h2>
        ${reviewDomains.length ? reviewDomains.map(stat => guideHtml(stat.domain)).join("") : DATA.domains.map(guideHtml).join("")}
      </section>
    `;
    document.querySelector("#backResultButton").addEventListener("click", () => renderResult(result));
    document.querySelector("#retryButton").addEventListener("click", startQuiz);
  }

  function answerHtml(answer) {
    const state = !answer.correct ? "bad" : "flagged";
    const stateLabel = !answer.correct ? "不正解" : "保留";
    const misconception = answer.misconception ? `<p><strong>混同：</strong>${escapeHtml(answer.misconception)}</p>` : "";
    return `
      <article class="reviewItem">
        <p class="questionCount">${escapeHtml(domainById.get(answer.domain).label)} / ${escapeHtml(skillLabels[answer.skill])} / ${stateLabel}</p>
        <h3>${escapeHtml(answer.stem)}</h3>
        <div class="answerLine ${state}">
          <p><strong>正解：</strong>${escapeHtml(answer.answer)}</p>
          <p><strong>あなたの解答：</strong>${escapeHtml(answer.chosen)}</p>
          ${misconception}
          <p>${escapeHtml(answer.explanation)}</p>
        </div>
      </article>
    `;
  }

  function guideHtml(domain) {
    return `
      <article class="guide">
        <header class="guideHeader"><h2>${escapeHtml(domain.label)}</h2><span class="domainMeta">AREA ${String(domain.order).padStart(2, "0")}</span></header>
        <p class="lead">${escapeHtml(domain.rule)}</p>
        <div class="guideGrid">
          <div class="guideCell"><h3>整理</h3><ul>${domain.points.map(point => `<li>${escapeHtml(point)}</li>`).join("")}</ul></div>
          <div class="guideCell"><h3>例</h3><ul>${domain.examples.map(example => `<li>${escapeHtml(example)}</li>`).join("")}</ul></div>
          <div class="guideCell"><h3>よくある混同</h3><p>${escapeHtml(domain.traps[0])}</p></div>
          <div class="guideCell"><h3>次に確認すること</h3><p>答えを選ぶ前に、「どの形・意味・文脈が根拠か」を一言で言えるか確認する。</p></div>
        </div>
      </article>
    `;
  }

  document.addEventListener("keydown", event => {
    if (!session || event.ctrlKey || event.metaKey || event.altKey) return;
    if (!answerRevealed && keys.includes(event.key)) {
      const question = session.questions[session.index];
      selectAnswer(question.choices[Number(event.key) - 1]);
      return;
    }
    if (event.key === "Enter" && answerRevealed) {
      event.preventDefault();
      document.querySelector("#nextButton")?.click();
    }
  });

  resetButton.addEventListener("click", () => {
    if (!confirm("この端末に保存した結果を消しますか？")) return;
    localStorage.removeItem(KEY);
    if (cloud) cloud.queueSave();
    home();
  });

  const hasValidOrder = Array.isArray(DATA.questionOrder)
    && DATA.questionOrder.length === DATA.questions.length
    && new Set(DATA.questionOrder).size === DATA.questions.length
    && DATA.questionOrder.every(id => questionById.has(id));
  if (!DATA || DATA.questions.length !== 120 || DATA.domains.length !== 17 || !hasValidOrder) {
    app.innerHTML = "<section class=\"panel\"><h2>データの読み込みに失敗しました</h2><p>問題数または分野数が想定と異なります。</p></section>";
    return;
  }

  async function init() {
    const trainerLink = document.querySelector("#trainerLink");
    const homeLink = document.querySelector("#homeLink");
    const grammarLink = document.querySelector("#grammarLink");
    const readingLink = document.querySelector("#readingLink");
    const query = new URLSearchParams(location.search);
    if (trainerLink) trainerLink.href = trainerHref(query);
    if (homeLink) homeLink.href = trainerHref(query);
    if (grammarLink) grammarLink.href = trainerHref(query);
    if (readingLink) readingLink.href = readingHref(query);
    cloud = createCloud({
      appId: APP_ID,
      configPath: "../static/config.json",
      getPayload: () => ({ version: 2, history: loadHistory() }),
      applyLoaded: applyCloudProgress
    });
    await cloud.init();
    home();
  }

  init();
})();
