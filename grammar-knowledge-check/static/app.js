(() => {
  "use strict";

  const DATA = window.GRAMMAR_CHECK_DATA;
  const KEY = "grammar-knowledge-check-v2";
  const APP_ID = "grammar-knowledge-check";
  const app = document.querySelector("#app");
  const resetButton = document.querySelector("#resetButton");
  const keys = ["1", "2", "3", "4"];
  const skillLabels = {
    knowledge: "知識",
    distinction: "識別",
    application: "適用"
  };
  const domainById = new Map(DATA.domains.map(domain => [domain.id, domain]));
  let session = null;
  let pendingChoice = null;
  let pendingReason = null;
  let pendingUncertain = false;
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
      questions: shuffle(DATA.questions).map(question => ({ ...question, choices: shuffle(question.choices) })),
      responses: []
    };
    pendingChoice = null;
    pendingReason = null;
    pendingUncertain = false;
    renderQuiz();
  }

  function home() {
    session = null;
    pendingChoice = null;
    pendingReason = null;
    pendingUncertain = false;
    const history = loadHistory();
    const historyHtml = history
      ? `<p class="muted">前回: ${escapeHtml(history.completedAt)} ／ ${history.score}/${history.total}問正解。記録はこの端末にのみ保存されます。</p>`
      : "<p class=\"muted\">進捗はこの端末のブラウザにのみ保存します。生徒名や外部サービスは使いません。</p>";
    app.innerHTML = `
      <section class="panel dark">
        <p class="kicker">START HERE / ABOUT 40 MINUTES</p>
        <h2>${DATA.questions.length}問で、知識と識別を分けて確かめる。</h2>
        <p class="lead">用語を知っているかだけでなく、似た形を見分け、文脈から根拠を選べるかを確認します。重要な問題では、答えの根拠も選びます。</p>
        <div class="overview" aria-label="アプリの概要">
          <div><strong>${DATA.questions.length}</strong><span>4択の基礎確認</span></div>
          <div><strong>17</strong><span>英文法の分野</span></div>
          <div><strong>3</strong><span>知識・識別・適用</span></div>
        </div>
        <div class="primaryAction">
          <button class="primary" id="startButton" type="button">${DATA.questions.length}問のチェックを始める <span>推奨</span></button>
          <p>問題順と選択肢順は毎回入れ替わります。</p>
        </div>
      </section>
      <section class="panel">
        <p class="kicker">FLOW</p>
        <h2>解く → 混同を知る → 解説を読む</h2>
        <div class="flowSteps" aria-label="学習の流れ">
          <div><strong>1</strong><p>4択で${DATA.questions.length}問を解く</p></div>
          <div><strong>2</strong><p>重要項目では根拠も選ぶ</p></div>
          <div><strong>3</strong><p>誤った混同だけを復習する</p></div>
        </div>
        <p class="shortcutHint">数字キー 1〜4 で解答を選択、Enter で次へ進めます。</p>
        ${historyHtml}
      </section>
    `;
    document.querySelector("#startButton").addEventListener("click", startQuiz);
  }

  function renderQuiz() {
    const question = session.questions[session.index];
    const percent = Math.round((session.index / session.questions.length) * 100);
    const domain = domainById.get(question.domain);
    const needsReason = Boolean(question.reason);
    const canContinue = Boolean(pendingChoice) && (!needsReason || Boolean(pendingReason));
    const answerStatus = !pendingChoice
      ? "答えを1つ選んでください。"
      : needsReason && !pendingReason
        ? "続けて、答えを選んだ根拠を1つ選んでください。"
        : "解答を記録して、次へ進めます。";
    app.innerHTML = `
      <section class="panel">
        <div class="quizHead">
          <div>
            <p class="questionCount">QUESTION ${session.index + 1} / ${session.questions.length} · ${escapeHtml(skillLabels[question.skill])}</p>
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
        ${needsReason && pendingChoice ? `
          <fieldset class="reasonBox">
            <legend>根拠を1つ選ぶ</legend>
            <p>${escapeHtml(question.reason.prompt)}</p>
            <div class="reasonGrid">
              ${question.reason.choices.map((choice, index) => `
                <button class="reasonChoice${pendingReason === choice ? " selected" : ""}" data-reason="${escapeHtml(choice)}" type="button" aria-pressed="${pendingReason === choice}">
                  <span class="key">${String.fromCharCode(65 + index)}</span><span>${escapeHtml(choice)}</span>
                </button>
              `).join("")}
            </div>
          </fieldset>
        ` : ""}
        <div class="choiceActions">
          <label class="flag"><input id="uncertain" type="checkbox" ${pendingUncertain ? "checked" : ""}> 正解でも根拠が曖昧なら印を付ける</label>
          <div class="quizActionBar">
            <p>${answerStatus}</p>
            <button class="primary" id="nextButton" type="button" ${canContinue ? "" : "disabled"}>${session.index === session.questions.length - 1 ? "結果を見る" : "この解答で次へ"}</button>
          </div>
        </div>
      </section>
    `;
    document.querySelectorAll(".choice").forEach(button => {
      button.addEventListener("click", () => {
        pendingChoice = button.dataset.choice;
        pendingReason = null;
        renderQuiz();
      });
    });
    document.querySelectorAll(".reasonChoice").forEach(button => {
      button.addEventListener("click", () => {
        pendingReason = button.dataset.reason;
        renderQuiz();
      });
    });
    document.querySelector("#uncertain").addEventListener("change", event => {
      pendingUncertain = event.target.checked;
    });
    document.querySelector("#nextButton").addEventListener("click", commitAnswer);
  }

  function commitAnswer() {
    const question = session.questions[session.index];
    session.responses.push({
      id: question.id,
      chosen: pendingChoice,
      chosenReason: pendingReason,
      uncertain: pendingUncertain
    });
    pendingChoice = null;
    pendingReason = null;
    pendingUncertain = false;
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
      const correct = response.chosen === question.answer;
      return {
        ...question,
        ...response,
        correct,
        reasonCorrect: question.reason ? response.chosenReason === question.reason.answer : null,
        misconception: correct ? null : question.misconceptions[response.chosen]
      };
    });
    return {
      version: 2,
      completedAt: new Intl.DateTimeFormat("ja-JP", { dateStyle: "medium", timeStyle: "short" }).format(new Date()),
      total: answers.length,
      score: answers.filter(answer => answer.correct).length,
      answers
    };
  }

  function measurementStats(result) {
    return Object.keys(skillLabels).map(skill => {
      const answers = result.answers.filter(answer => answer.skill === skill);
      const correct = answers.filter(answer => answer.correct).length;
      const reasonAnswers = answers.filter(answer => answer.reason);
      const reasonCorrect = reasonAnswers.filter(answer => answer.reasonCorrect).length;
      return { skill, label: skillLabels[skill], answers, correct, reasonAnswers, reasonCorrect };
    });
  }

  function domainStats(result) {
    return DATA.domains.map(domain => {
      const answers = result.answers.filter(answer => answer.domain === domain.id);
      const correct = answers.filter(answer => answer.correct).length;
      const uncertain = answers.filter(answer => answer.uncertain).length;
      const rate = correct / answers.length;
      const missedCore = answers.some(answer => answer.priority === "core" && !answer.correct);
      let status = "review";
      let label = answers.length < 3 ? "要追加確認" : "要確認";
      if (rate < .5) {
        status = "weak";
        label = "未定着";
      } else if (answers.length >= 3 && rate >= .8 && !missedCore && !uncertain) {
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

  function renderResult(result) {
    session = null;
    const stats = domainStats(result);
    const measurements = measurementStats(result);
    const misconceptions = misconceptionStats(result);
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
        <button class="secondary quietAction" id="retryButton" type="button">問題順を変えて、もう一度解く</button>
      </section>
      <section class="panel">
        <p class="kicker">MEASUREMENT</p>
        <h2>何ができているか</h2>
        <div class="measurementGrid">
          ${measurements.map(stat => `
            <article class="measurementCard">
              <p class="kicker">${escapeHtml(stat.label)}</p>
              <strong>${stat.correct}<span> / ${stat.answers.length}</span></strong>
              <p>${stat.skill === "knowledge" ? "用語・基本ルールを再生する力" : stat.skill === "distinction" ? "似た形を根拠で見分ける力" : "文脈から形を判断する力"}</p>
              ${stat.reasonAnswers.length ? `<p class="measurementMeta">根拠問題 ${stat.reasonCorrect}/${stat.reasonAnswers.length} 正解</p>` : ""}
            </article>
          `).join("")}
        </div>
      </section>
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
          <div class="domainList">${stats.map(domainRowHtml).join("")}</div>
        </details>
      </section>
    `;
    document.querySelector("#readGuideButton").addEventListener("click", () => renderReview(result));
    document.querySelector("#retryButton").addEventListener("click", startQuiz);
  }

  function domainRowHtml(stat) {
    return `<div class="domainRow"><div><strong>${escapeHtml(stat.domain.label)}</strong><div class="domainMeta">${stat.correct}/${stat.answers.length} 正解${stat.uncertain ? ` / 保留 ${stat.uncertain}` : ""}</div></div><span class="status ${stat.status}">${stat.label}</span></div>`;
  }

  function renderReview(result) {
    const reviewAnswers = result.answers.filter(answer => !answer.correct || answer.uncertain || answer.reasonCorrect === false);
    const reviewDomains = domainStats(result).filter(stat => stat.status !== "good");
    app.innerHTML = `
      <section class="panel dark">
        <p class="kicker">REVIEW / WRONG, UNCERTAIN, OR REASON</p>
        <h2>解説を読む</h2>
        <p class="lead">正誤だけを追わず、選んだ誤答がどの混同から出たかを確認します。必要なら、解説の後で問題順を変えて解き直します。</p>
        <div class="primaryAction"><button class="primary" id="retryButton" type="button">解説を読んだら、もう一度${DATA.questions.length}問を解く</button><p>同じ問題でも、順番を変えると別の弱点が見えます。</p></div>
        <button class="secondary quietAction" id="backResultButton" type="button">結果へ戻る</button>
      </section>
      <section class="panel">
        <h2>あなたの解答</h2>
        ${reviewAnswers.length ? reviewAnswers.map(answerHtml).join("") : "<div class=\"empty\">誤答・保留・根拠の誤りはありません。</div>"}
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
    const state = !answer.correct ? "bad" : answer.reasonCorrect === false ? "flagged" : "flagged";
    const stateLabel = !answer.correct ? "不正解" : answer.reasonCorrect === false ? "根拠を再確認" : "保留";
    const misconception = answer.misconception ? `<p><strong>混同：</strong>${escapeHtml(answer.misconception)}</p>` : "";
    const reason = answer.reason ? `<p><strong>根拠：</strong>${escapeHtml(answer.chosenReason || "未選択")} ${answer.reasonCorrect ? "（正解）" : "（要確認）"}</p>` : "";
    return `
      <article class="reviewItem">
        <p class="questionCount">${escapeHtml(domainById.get(answer.domain).label)} / ${escapeHtml(skillLabels[answer.skill])} / ${stateLabel}</p>
        <h3>${escapeHtml(answer.stem)}</h3>
        <div class="answerLine ${state}">
          <p><strong>正解：</strong>${escapeHtml(answer.answer)}</p>
          <p><strong>あなたの解答：</strong>${escapeHtml(answer.chosen)}</p>
          ${reason}
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
    if (keys.includes(event.key)) {
      const question = session.questions[session.index];
      pendingChoice = question.choices[Number(event.key) - 1];
      pendingReason = null;
      renderQuiz();
      return;
    }
    if (event.key === "Enter" && pendingChoice && (!session.questions[session.index].reason || pendingReason)) {
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

  if (!DATA || DATA.questions.length !== 100 || DATA.domains.length !== 17) {
    app.innerHTML = "<section class=\"panel\"><h2>データの読み込みに失敗しました</h2><p>問題数または分野数が想定と異なります。</p></section>";
    return;
  }

  async function init() {
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
