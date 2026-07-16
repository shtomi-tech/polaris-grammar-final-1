(() => {
  "use strict";

  const DATA = window.GRAMMAR_CHECK_DATA;
  const KEY = "grammar-knowledge-check-v1";
  const APP_ID = "grammar-knowledge-check";
  const app = document.querySelector("#app");
  const resetButton = document.querySelector("#resetButton");
  const keys = ["1", "2", "3", "4"];
  const domainById = new Map(DATA.domains.map(domain => [domain.id, domain]));
  let session = null;
  let pendingChoice = null;
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
      return JSON.parse(localStorage.getItem(KEY)) || null;
    } catch {
      return null;
    }
  }

  function saveHistory(result) {
    localStorage.setItem(KEY, JSON.stringify(result));
    if (cloud) cloud.queueSave();
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

  function startQuiz() {
    session = {
      index: 0,
      questions: DATA.questions.map(question => ({ ...question, choices: shuffle(question.choices) })),
      responses: []
    };
    pendingChoice = null;
    renderQuiz();
  }

  function home() {
    session = null;
    pendingChoice = null;
    const history = loadHistory();
    const historyHtml = history
      ? `<p class="muted">前回: ${escapeHtml(history.completedAt)} ／ ${history.score}/${history.total}問正解。記録はこの端末にのみ保存されます。</p>`
      : "<p class=\"muted\">進捗はこの端末のブラウザにのみ保存します。生徒名や外部サービスは使いません。</p>";
    app.innerHTML = `
      <section class="panel dark">
        <p class="kicker">START HERE / 15–20 MINUTES</p>
        <h2>まず、60問の基礎チェックを始める。</h2>
        <p class="lead">英文の空所補充ではなく、用語・形・働き・区別を直接確認します。迷った問題は印を付け、終了後に必要な解説だけを読みます。</p>
        <div class="overview" aria-label="アプリの概要">
          <div><strong>60</strong><span>4択の基礎確認</span></div>
          <div><strong>17</strong><span>英文法の分野</span></div>
          <div><strong>0</strong><span>外部送信・ログイン</span></div>
        </div>
        <div class="primaryAction">
          <button class="primary" id="startButton" type="button">60問のチェックを始める <span>推奨</span></button>
          <p>初めてなら、ここから始めます。</p>
        </div>
      </section>
      <section class="panel">
        <p class="kicker">FLOW</p>
        <h2>解く → 弱点を知る → 解説を読む</h2>
        <div class="flowSteps" aria-label="学習の流れ">
          <div><strong>1</strong><p>4択で60問を解く</p></div>
          <div><strong>2</strong><p>迷った問題にも印を付ける</p></div>
          <div><strong>3</strong><p>必要な分野だけ解説を読む</p></div>
        </div>
        <p class="shortcutHint">数字キー 1〜4 で選択、Enter で次へ進めます。</p>
        ${historyHtml}
      </section>
    `;
    document.querySelector("#startButton").addEventListener("click", startQuiz);
  }

  function renderQuiz() {
    const question = session.questions[session.index];
    const percent = Math.round((session.index / session.questions.length) * 100);
    const domain = domainById.get(question.domain);
    app.innerHTML = `
      <section class="panel">
        <div class="quizHead">
          <div>
            <p class="questionCount">QUESTION ${session.index + 1} / ${session.questions.length}</p>
            <p class="muted">${escapeHtml(domain.label)}</p>
          </div>
          <div class="progress">${session.index + 1} / ${session.questions.length}</div>
        </div>
        <div class="progressBar" aria-label="進捗 ${session.index + 1}/${session.questions.length}"><span style="width:${percent}%"></span></div>
        <h2 class="stem">${escapeHtml(question.stem)}</h2>
        <div class="choiceGrid" id="choiceGrid">
          ${question.choices.map((choice, index) => `
            <button class="choice${pendingChoice === choice ? " selected" : ""}" data-choice="${escapeHtml(choice)}" type="button" aria-pressed="${pendingChoice === choice}">
              <span class="key">${keys[index]}</span><span>${escapeHtml(choice)}</span>
            </button>
          `).join("")}
        </div>
        <div class="choiceActions">
          <label class="flag"><input id="uncertain" type="checkbox"> 正解でも根拠が曖昧なら印を付ける</label>
          <div class="quizActionBar">
            <p>${pendingChoice ? "選択しました。次へ進めます。" : "答えを1つ選んでください。"}</p>
            <button class="primary" id="nextButton" type="button" ${pendingChoice ? "" : "disabled"}>${session.index === session.questions.length - 1 ? "結果を見る" : "この解答で次へ"}</button>
          </div>
        </div>
      </section>
    `;
    document.querySelectorAll(".choice").forEach(button => {
      button.addEventListener("click", () => {
        pendingChoice = button.dataset.choice;
        renderQuiz();
      });
    });
    document.querySelector("#nextButton").addEventListener("click", commitAnswer);
  }

  function commitAnswer() {
    const question = session.questions[session.index];
    session.responses.push({
      id: question.id,
      chosen: pendingChoice,
      uncertain: document.querySelector("#uncertain").checked
    });
    pendingChoice = null;
    session.index += 1;
    if (session.index < session.questions.length) {
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
      return { ...question, ...response, correct: response.chosen === question.answer };
    });
    return {
      completedAt: new Intl.DateTimeFormat("ja-JP", { dateStyle: "medium", timeStyle: "short" }).format(new Date()),
      total: answers.length,
      score: answers.filter(answer => answer.correct).length,
      answers
    };
  }

  function domainStats(result) {
    return DATA.domains.map(domain => {
      const answers = result.answers.filter(answer => answer.domain === domain.id);
      const correct = answers.filter(answer => answer.correct).length;
      const uncertain = answers.filter(answer => answer.uncertain).length;
      let status = "good";
      let label = "定着";
      if (correct < answers.length) {
        status = "weak";
        label = "未定着";
      } else if (uncertain > 0) {
        status = "review";
        label = "要確認";
      }
      return { domain, answers, correct, uncertain, status, label };
    });
  }

  function resultMessage(result) {
    const rate = result.score / result.total;
    if (rate >= .9) return "基礎事項はかなり整理されています。保留を付けた分野だけ、短く読み直せば十分です。";
    if (rate >= .7) return "骨組みはあります。未定着の分野は、問題順ではなく下の解説順で確認すると戻りやすいです。";
    return "今は知識が散らばっている段階です。点数を急がず、未定着の分野を一つずつつなぎ直してください。";
  }

  function renderResult(result) {
    session = null;
    const stats = domainStats(result);
    const needsReview = stats.filter(stat => stat.status !== "good");
    const priorityNames = needsReview.slice(0, 4).map(stat => stat.domain.label);
    app.innerHTML = `
      <section class="panel dark">
        <p class="kicker">RESULT / ${escapeHtml(result.completedAt)}</p>
        <h2>チェック完了</h2>
        <div class="score"><strong>${result.score}</strong><span>/ ${result.total} 問正解</span></div>
        <p class="lead">${resultMessage(result)}</p>
        <div class="nextStep">
          <p class="kicker">NEXT STEP / RECOMMENDED</p>
          <p>${priorityNames.length ? `まずは「${escapeHtml(priorityNames.join("・"))}」の解説を確認します。` : "迷った分野の解説を短く確認します。"}</p>
          <button class="primary" id="readGuideButton" type="button">弱点の解説を読む <span>推奨</span></button>
        </div>
        <button class="secondary quietAction" id="retryButton" type="button">最初から60問を解き直す</button>
      </section>
      <section class="panel">
        <p class="kicker">PRIORITY</p>
        <h2>今、確認する分野</h2>
        <p class="muted">正解でも「根拠が曖昧」を選んだ分野は、要確認に残しています。</p>
        <div class="domainList priorityList">
          ${(needsReview.length ? needsReview : stats).map(stat => `
            <div class="domainRow">
              <div><strong>${escapeHtml(stat.domain.label)}</strong><div class="domainMeta">${stat.correct}/${stat.answers.length} 正解${stat.uncertain ? ` / 保留 ${stat.uncertain}` : ""}</div></div>
              <span class="status ${stat.status}">${stat.label}</span>
            </div>
          `).join("")}
        </div>
        <details class="allResults">
          <summary>17分野すべての結果を表示する</summary>
          <div class="domainList">
            ${stats.map(stat => `
              <div class="domainRow">
                <div><strong>${escapeHtml(stat.domain.label)}</strong><div class="domainMeta">${stat.correct}/${stat.answers.length} 正解${stat.uncertain ? ` / 保留 ${stat.uncertain}` : ""}</div></div>
                <span class="status ${stat.status}">${stat.label}</span>
              </div>
            `).join("")}
          </div>
        </details>
      </section>
    `;
    document.querySelector("#readGuideButton").addEventListener("click", () => renderReview(result));
    document.querySelector("#retryButton").addEventListener("click", startQuiz);
  }

  function renderReview(result) {
    const reviewAnswers = result.answers.filter(answer => !answer.correct || answer.uncertain);
    const reviewDomains = domainStats(result).filter(stat => stat.status !== "good");
    app.innerHTML = `
      <section class="panel dark">
        <p class="kicker">REVIEW / WRONG OR UNCERTAIN</p>
        <h2>解説を読む</h2>
        <p class="lead">問題の正誤だけを追わず、同じ分野のルールをまとめて読みます。必要なら、読み終わってから60問をもう一度解いてください。</p>
        <div class="primaryAction"><button class="primary" id="retryButton" type="button">解説を読んだら、もう一度60問を解く</button><p>解き直しは、解説を読み終えてからで十分です。</p></div>
        <button class="secondary quietAction" id="backResultButton" type="button">結果へ戻る</button>
      </section>
      <section class="panel">
        <h2>あなたの解答</h2>
        ${reviewAnswers.length ? reviewAnswers.map(answerHtml).join("") : "<div class=\"empty\">誤答・保留はありません。必要なら全分野の復習としてもう一度解けます。</div>"}
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
    return `
      <article class="reviewItem">
        <p class="questionCount">${escapeHtml(domainById.get(answer.domain).label)} / ${stateLabel}</p>
        <h3>${escapeHtml(answer.stem)}</h3>
        <div class="answerLine ${state}">
          <p><strong>正解：</strong>${escapeHtml(answer.answer)}</p>
          <p><strong>あなたの解答：</strong>${escapeHtml(answer.chosen)}</p>
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
          <div class="guideCell"><h3>次に確認すること</h3><p>この分野の問題をもう一度解き、答えを選ぶ前に「何を根拠にしたか」を一言で言えるか確認する。</p></div>
        </div>
      </article>
    `;
  }

  document.addEventListener("keydown", event => {
    if (!session || event.ctrlKey || event.metaKey || event.altKey) return;
    if (keys.includes(event.key)) {
      const question = session.questions[session.index];
      pendingChoice = question.choices[Number(event.key) - 1];
      renderQuiz();
      return;
    }
    if (event.key === "Enter" && pendingChoice) {
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

  if (!DATA || DATA.questions.length !== 60 || DATA.domains.length !== 17) {
    app.innerHTML = "<section class=\"panel\"><h2>データの読み込みに失敗しました</h2><p>問題数または分野数が想定と異なります。</p></section>";
    return;
  }
  async function init() {
    cloud = createCloud({
      appId: APP_ID,
      configPath: "../static/config.json",
      getPayload: () => ({ version: 1, history: loadHistory() }),
      applyLoaded: applyCloudProgress,
    });
    await cloud.init();
    home();
  }

  init();
})();
