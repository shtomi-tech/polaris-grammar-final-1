"use strict";

import {
  attemptFromSlash,
  checkpointsReady,
  completeItem,
  defaultProgress,
  isAttemptReady,
  markForReview,
  materializeAnswer,
  normalizeProgress,
  normalizeStep,
  recommendedTarget as recommendedProgressTarget,
  seedSlashText,
  updateAttempt as updateProgressAttempt,
} from "./domain.js";

const ROLES = ["S", "V", "O", "C", "M", "接", "仮S", "真S", "仮O", "真O"];
const ROLE_LABELS = {
  S: "S（主語）",
  V: "V（動詞）",
  O: "O（目的語）",
  C: "C（補語）",
  M: "M（修飾語）",
  "接": "接（等位接続詞）",
  "仮S": "仮S（形式主語）",
  "真S": "真S（真主語）",
  "仮O": "仮O（形式目的語）",
  "真O": "真O（真目的語）",
};
const PATTERNS = ["SV", "SVC", "SVO", "SVOO", "SVOC", "special"];
const PATTERN_LABELS = {
  SV: "第1文型 SV",
  SVC: "第2文型 SVC",
  SVO: "第3文型 SVO",
  SVOO: "第4文型 SVOO",
  SVOC: "第5文型 SVOC",
  special: "その他・特殊構文（第1〜5文型以外）",
};
const STEPS = [
  ["first", "1 英文を分析"],
  ["compare", "2 正解と比較"],
  ["input", "3 解説を確認"],
];
const STEP_LABELS = Object.fromEntries(STEPS);
const VIEW_URL = "modules/reading/view.html";
const MANIFEST_URL = "modules/reading/data/manifest.json";

/* 統合前は生徒名（自由入力の文字列）をlocalStorageキーに含めていたため、
   生徒IDで管理する他モジュールと突き合わせられなかった。
   統合後は shared/identity.js の生徒IDが唯一の識別子で、
   進捗は統合ストアの reading 名前空間（データセット別）に入る。 */
let editorEnabled = false;
let viewRoot = document;
let ctx = null;

const state = {
  mode: "learn",
  manifest: { datasets: [] },
  datasetId: "",
  dataset: null,
  selectedId: "",
  step: "first",
  progress: defaultProgress(),
  editorJson: "",
  cloudStatus: { message: "", tone: "" },
};

const $ = (sel) => viewRoot.querySelector(sel);

function el(tag, attrs = {}, ...kids) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value == null) continue;
    if (key === "class") node.className = value;
    else if (key === "html") node.innerHTML = value;
    else if (key.startsWith("on") && typeof value === "function") node.addEventListener(key.slice(2), value);
    else node.setAttribute(key, value);
  }
  for (const kid of kids.flat()) {
    if (kid == null) continue;
    node.appendChild(typeof kid === "string" ? document.createTextNode(kid) : kid);
  }
  return node;
}

function datasetProgress(datasetId = state.datasetId) {
  const all = ctx.store.get();
  const parsed = (all && all.datasets && all.datasets[datasetId]) || null;
  return normalizeProgress(parsed);
}

function loadProgress() {
  return datasetProgress();
}

/* completedIds だけでなく totalItems も残す。
   統合前は全問数が分からず、ステッパーが「完了」を判定できなかった。 */
function saveProgress() {
  ctx.store.update((current) => {
    const datasets = { ...(current.datasets || {}) };
    datasets[state.datasetId] = state.progress;
    return {
      ...current,
      datasets,
      totalItems: state.dataset?.items?.length || current.totalItems || 0,
    };
  });
}

/* クラウド同期は shared/shell.js が一括で行う。
   統合前はこのモジュールが独自の app 値（eibun-kaishaku-polaris1）で
   別レコードに保存しており、1生徒の学習が3行に分散していた。 */

function answerFor(itemId) {
  const materialized = materializeAnswer(state.progress, itemId);
  state.progress = materialized.progress;
  return materialized.answer;
}

function patternLabel(pattern) {
  return PATTERN_LABELS[pattern] || pattern || "未選択";
}

function defaultTranslationForRole(role) {
  if (role === "仮S") return "形式上の主語";
  if (role === "仮O") return "形式上の目的語";
  return "";
}

function currentItem() {
  const items = state.dataset?.items || [];
  return items.find((item) => item.id === state.selectedId) || items[0] || null;
}

function nextItemAfter(itemId) {
  const items = state.dataset?.items || [];
  const index = items.findIndex((item) => item.id === itemId);
  if (index < 0 || index >= items.length - 1) return null;
  return items[index + 1];
}

function setCompleted(itemId) {
  state.progress = completeItem(state.progress, itemId);
}

function setReview(itemId) {
  state.progress = markForReview(state.progress, itemId);
}

function teacherChunks(item) {
  return item?.root?.chunks || [];
}

function updateAttempt(itemId, phase, patch) {
  const updated = updateProgressAttempt(
    state.progress,
    itemId,
    phase,
    patch,
    state.step,
    new Date().toISOString(),
  );
  state.progress = updated.progress;
  saveProgress();
}

async function loadApp() {
  state.manifest = await fetch(MANIFEST_URL, { cache: "no-store" }).then((r) => r.json());
  state.datasetId = state.manifest.datasets[0]?.id || "";
  await loadDataset(state.datasetId);
  state.mode = editorEnabled ? "editor" : "learn";
  bindShell();
  render();
}

async function loadDataset(datasetId) {
  const info = state.manifest.datasets.find((dataset) => dataset.id === datasetId) || state.manifest.datasets[0];
  state.datasetId = info.id;
  // manifest の url は教材フォルダからの相対。統合でアプリのルートが変わったため解決する。
  state.dataset = await fetch(`modules/reading/${info.url}`, { cache: "no-store" }).then((r) => r.json());
  state.progress = loadProgress();
  state.selectedId = state.progress.lastItemId || state.dataset.items?.[0]?.id || "";
  const selectedAnswer = answerFor(state.selectedId);
  state.step = normalizeStep(selectedAnswer.lastStep);
  state.editorJson = JSON.stringify(state.dataset, null, 2);
}

function bindShell() {
  $("#learnTab").addEventListener("click", () => {
    state.mode = "learn";
    render();
  });
  const editorTab = $("#editorTab");
  if (!editorEnabled) {
    editorTab.classList.add("hide");
    return;
  }
  editorTab.addEventListener("click", () => {
    state.mode = "editor";
    state.editorJson = JSON.stringify(state.dataset, null, 2);
    render();
  });
}

function render() {
  if (!editorEnabled) state.mode = "learn";
  $("#learnTab").classList.toggle("active", state.mode === "learn");
  $("#editorTab").classList.toggle("active", state.mode === "editor");
  $("#learnView").classList.toggle("hide", state.mode !== "learn");
  $("#editorView").classList.toggle("hide", state.mode !== "editor");
  if (state.mode === "learn") renderLearn();
  else renderEditor();
}

function renderLearn() {
  const view = $("#learnView");
  view.innerHTML = "";
  const item = currentItem();
  view.appendChild(renderStartCta());
  view.appendChild(renderControls());
  view.appendChild(el("div", { class: "shell" },
    el("aside", {},
      renderSummary(),
      el("details", { class: "itemPicker", id: "itemPicker" },
        el("summary", {}, `ほかの問題を選ぶ（${state.dataset?.items?.length || 0}教材）`),
        renderItemList()
      )
    ),
    el("section", { class: "panel workspace", id: "workspace", tabindex: "-1" }, item ? renderWorkspace(item) : renderEmpty())
  ));
}

function focusWorkspace() {
  setTimeout(() => {
    const workspace = document.querySelector("#workspace");
    if (!workspace) return;
    workspace.scrollIntoView({ behavior: "auto", block: "start" });
    workspace.focus({ preventScroll: true });
  }, 0);
}

function recommendedTarget() {
  const items = state.dataset?.items || [];
  const target = recommendedProgressTarget(items, state.progress);
  if (!target) return null;
  if (target.kind === "resume" || target.kind === "next") answerFor(target.item.id);
  return target;
}

function renderStartCta() {
  const target = recommendedTarget();
  if (!target) return el("section", { class: "panel ctaPanel" }, el("p", {}, "教材データがありません。"));
  if (target.kind === "done") {
    return el("section", { class: "panel ctaPanel" },
      el("p", { class: "label" }, "教材完了"),
      el("h2", {}, "英文解釈を一巡しました"),
      el("p", { class: "hint" }, "全30教材を完了しました。必要なら一覧から復習し、終える場合は学習ホームへ戻ります。"),
      el("div", { class: "actions" },
        el("a", { class: "primary", href: grammarHref(new URLSearchParams(location.search)) }, "学習ホームへ戻る"),
        el("button", {
          class: "ghost",
          type: "button",
          onclick: () => {
            const picker = $("#itemPicker");
            if (!picker) return;
            picker.open = true;
            picker.scrollIntoView({ behavior: "smooth", block: "start" });
          },
        }, "教材一覧を開く")
      )
    );
  }
  const eyebrow = target.kind === "resume" ? "前回の続き" : target.kind === "review" ? "復習" : "はじめに";
  const title = `${target.kind === "resume" ? "続きから始める" : target.kind === "review" ? "復習から始める" : "最初の問題を始める"}：${target.item.theme} ${target.item.pointNo}. ${target.item.pointTitle}`;
  return el("section", { class: "panel ctaPanel" },
    el("p", { class: "label" }, eyebrow),
    el("button", {
      class: "primary cta",
      type: "button",
      onclick: () => {
        state.selectedId = target.item.id;
        state.step = target.step;
        answerFor(target.item.id).lastStep = target.step;
        state.progress.lastItemId = target.item.id;
        saveProgress();
        render();
        focusWorkspace();
      },
    }, title),
    el("p", { class: "hint" }, `${STEP_LABELS[target.step]} から再開します`)
  );
}

function renderControls() {
  // 生徒の選択はシェルのヘッダーに集約したため、ここには置かない。
  const fields = [];

  if (state.manifest.datasets.length > 1) {
    const datasetSelect = el("select", {
      onchange: async (event) => {
        await loadDataset(event.target.value);
        render();
      },
    }, ...state.manifest.datasets.map((dataset) => el("option", {
      value: dataset.id,
      selected: dataset.id === state.datasetId ? "selected" : null,
    }, dataset.label)));
    fields.unshift(field("教材", datasetSelect));
  }

  const nodes = [...fields];
  if (state.cloudStatus.message) {
    nodes.push(el("p", { class: `hint cloudStatus ${state.cloudStatus.tone || ""}` }, state.cloudStatus.message));
  }

  return el("section", { class: "panel controls" }, ...nodes);
}

function field(label, control) {
  return el("label", { class: "field" }, el("span", {}, label), control);
}

function renderSummary() {
  const total = state.dataset?.items?.length || 0;
  const completed = state.progress.completedIds.length;
  const review = state.progress.reviewIds.length;
  return el("section", { class: "summary" },
    stat("教材数", total),
    stat("完了", completed),
    stat("復習", review)
  );
}

function stat(label, value) {
  return el("div", { class: "stat" }, el("strong", {}, String(value)), el("span", {}, label));
}

function renderItemList() {
  const items = state.dataset?.items || [];
  const recommendedId = recommendedTarget()?.item?.id;
  const groups = [];
  for (const item of items) {
    const last = groups[groups.length - 1];
    if (last && last.theme === item.theme) last.items.push(item);
    else groups.push({ theme: item.theme, themeTitle: item.themeTitle, items: [item] });
  }
  return el("section", { class: "panel itemList" },
    ...groups.flatMap((group) => [
      el("p", { class: "itemGroupHead" }, `${group.theme} ${group.themeTitle || ""}`),
      ...group.items.map((item) => {
        const answer = answerFor(item.id);
        const done = state.progress.completedIds.includes(item.id);
        const review = state.progress.reviewIds.includes(item.id);
        const recommended = item.id === recommendedId;
        return el("button", {
          class: `itemButton ${item.id === state.selectedId ? "active" : ""} ${done ? "done" : ""} ${review ? "review" : ""}`,
          type: "button",
          onclick: () => {
            state.selectedId = item.id;
            state.step = normalizeStep(answer.lastStep);
            state.progress.lastItemId = item.id;
            saveProgress();
            render();
          },
        },
        recommended ? el("span", { class: "recommendedBadge" }, "▶ 次はこれ") : null,
        `${item.pointNo}. ${item.pointTitle}`,
        el("small", {}, done ? "完了" : review ? "復習対象" : answer.updatedAt ? "学習中" : "未学習")
        );
      }),
    ])
  );
}

function renderWorkspace(item) {
  return el("div", {},
    renderLessonHead(item),
    el("p", { class: "sentence" }, item.sentence),
    renderStepNav(item),
    renderStepBody(item)
  );
}

function renderLessonHead(item) {
  const answer = answerFor(item.id);
  const status = state.progress.completedIds.includes(item.id)
    ? "完了"
    : answer.updatedAt ? "学習中" : "未学習";
  return el("div", { class: "lessonHead" },
    el("div", {},
      el("p", { class: "label" }, `${item.theme} / ${item.themeTitle || ""}`),
      el("h2", {}, `${item.pointNo}. ${item.pointTitle}`)
    ),
    el("span", { class: "status" }, status)
  );
}

function renderStepNav(item) {
  return el("div", { class: "stepNav" },
    ...STEPS.map(([id, label]) => el("button", {
      class: id === state.step ? "active" : "ghost",
      "aria-current": id === state.step ? "step" : null,
      type: "button",
      onclick: () => {
        state.step = id;
        answerFor(item.id).lastStep = id;
        saveProgress();
        render();
      },
    }, label))
  );
}

function renderStepBody(item) {
  state.step = normalizeStep(state.step);
  if (state.step === "input") return renderExplanation(item);
  if (state.step === "compare") return renderCompare(item);
  return renderAttempt(item, "first", "解釈");
}

function renderAttempt(item, phase, title) {
  const answer = answerFor(item.id);
  let attempt = answer[phase];
  const seededAttempt = seedSlashText(item, attempt);
  if (seededAttempt.slashText !== attempt.slashText) {
    answer[phase] = seededAttempt;
    attempt = seededAttempt;
  }
  return el("section", {},
    el("div", {},
      field(`${title}: 英文に / を入れて区切る`, el("textarea", {
        value: attempt.slashText,
        placeholder: item.sentence || "英文に / を入れて区切る",
        oninput: (event) => {
          attempt.slashText = event.target.value;
          updateAttempt(item.id, phase, { slashText: event.target.value });
        },
      }, attempt.slashText))
    ),
    el("div", { class: "actions", style: "margin-top:12px" },
      el("button", {
        type: "button",
        onclick: () => {
          const latest = answerFor(item.id)[phase];
          updateAttempt(item.id, phase, attemptFromSlash(latest));
          render();
        },
      }, "区切った部分を分析する")
    ),
    renderStudentChunks(item, attempt, phase),
    renderPatternField(item, attempt, phase),
    renderNextAction(item, attempt, phase)
  );
}

function renderNextAction(item, attempt, phase) {
  const ready = isAttemptReady(attempt);
  return el("div", { class: "actions", style: "margin-top:14px" },
    el("button", {
      class: "primary",
      type: "button",
      disabled: ready ? null : "disabled",
      onclick: () => {
        if (!ready) return;
        answerFor(item.id).lastStep = "compare";
        state.step = "compare";
        saveProgress();
        render();
      },
    }, "自分の分析と正解を比べる"),
    ready ? null : el("span", { class: "hint" }, "英文を区切り、文の要素と文型を入力すると進めます")
  );
}

function renderPatternField(item, attempt, phase) {
  return el("div", { class: "panel", style: "margin-top:12px" },
    field("文型", el("select", {
      onchange: (event) => {
        attempt.pattern = event.target.value;
        updateAttempt(item.id, phase, attempt);
        render();
      },
    },
    el("option", { value: "" }, "選択"),
    ...PATTERNS.map((pattern) => el("option", {
      value: pattern,
      selected: attempt.pattern === pattern ? "selected" : null,
    }, patternLabel(pattern)))
    ))
  );
}

function renderStudentChunks(item, attempt, phase) {
  if (!attempt.chunks?.length) {
    return el("p", { class: "warning" }, "① 意味のまとまりに / を入れる　②「区切った部分を分析する」を押す");
  }
  return el("div", { class: "chunkRows" },
    ...attempt.chunks.map((chunk, index) => el("div", { class: "chunkRow" },
      el("input", {
        value: chunk.text,
        oninput: (event) => {
          chunk.text = event.target.value;
          updateAttempt(item.id, phase, attempt);
        },
      }),
      el("select", {
        onchange: (event) => {
          chunk.role = event.target.value;
          const defaultTranslation = defaultTranslationForRole(chunk.role);
          if (defaultTranslation && !chunk.translation?.trim()) {
            chunk.translation = defaultTranslation;
          }
          updateAttempt(item.id, phase, attempt);
          render();
        },
      },
      el("option", { value: "" }, "文の要素"),
      ...ROLES.map((role) => el("option", { value: role, selected: chunk.role === role ? "selected" : null }, ROLE_LABELS[role]))
      ),
      el("input", {
        value: chunk.translation || "",
        placeholder: "自分の訳",
        oninput: (event) => {
          chunk.translation = event.target.value;
          updateAttempt(item.id, phase, attempt);
        },
      })
    ))
  );
}

function renderExplanation(item) {
  const exp = item.explanation || {};
  const answer = answerFor(item.id);
  const nextItem = nextItemAfter(item.id);
  const ready = checkpointsReady(item, answer);
  return el("section", { class: "explainGrid" },
    el("div", { class: "noteBox full" },
      el("h3", {}, "解析"),
      renderTeacherChunks(item)
    ),
    noteBox("指針", exp.guidance || ""),
    noteBox("解説", exp.analysis || ""),
    noteBox("和訳例", exp.translationExample || ""),
    el("div", { class: "noteBox" },
      el("h3", {}, "語句"),
      el("ul", { class: "vocabList" },
        ...(exp.vocab || []).map((row) => el("li", {}, el("strong", {}, row.term), `　${row.meaning}`))
      )
    ),
    el("div", { class: "noteBox full" },
      el("h3", {}, "チェックポイント"),
      el("ul", { class: "checkList" },
        ...(exp.checkpoints || []).map((text, index) => el("li", {},
          el("label", { class: "checkItem" },
            el("input", {
              type: "checkbox",
              checked: answer.checkpoints?.[index] ? "checked" : null,
              onchange: (event) => {
                answer.checkpoints[index] = event.target.checked;
                answer.lastStep = "input";
                answer.updatedAt = new Date().toISOString();
                state.progress.lastItemId = item.id;
                saveProgress();
                render();
              },
            }),
            el("span", {}, text)
          )
        ))
      )
    ),
    el("div", { class: "actions full" },
      el("button", {
        class: "primary",
        type: "button",
        disabled: ready ? null : "disabled",
        onclick: () => {
          if (!checkpointsReady(item, answer)) return;
          setCompleted(item.id);
          answerFor(item.id).lastStep = "input";
          if (nextItem) {
            state.selectedId = nextItem.id;
            state.step = "first";
            state.progress.lastItemId = nextItem.id;
            answerFor(nextItem.id).lastStep = "first";
          }
          saveProgress();
          render();
          if (nextItem) focusWorkspace();
        },
      }, nextItem ? "次の問題へ" : "この教材を完了"),
      ready ? null : el("span", { class: "hint" }, "チェックポイントを確認すると進めます"),
      el("button", {
        class: "ghost",
        type: "button",
        onclick: () => {
          setReview(item.id);
          saveProgress();
          render();
        },
      }, "あとで復習する")
    )
  );
}

function renderTeacherChunks(item) {
  return renderChunkGrid(teacherChunks(item));
}

function renderChunkGrid(chunks) {
  return el("div", { class: "teacherChunks" },
    ...chunks.map((chunk) => el("div", { class: "teacherChunk" },
      el("span", {}, chunk.text),
      el("span", { class: "role" }, chunk.role || "-"),
      el("span", {}, chunk.translation || "")
    ))
  );
}

function noteBox(title, body) {
  return el("div", { class: "noteBox" }, el("h3", {}, title), el("p", {}, body || "未入力"));
}

function renderCompare(item) {
  const answer = answerFor(item.id);
  return el("section", {},
    compareBox("自分の解釈", answer.first),
    el("div", { class: "noteBox full", style: "margin-top:12px" },
      el("h3", {}, "先生データ"),
      renderTeacherChunks(item)
    ),
    el("div", { class: "actions", style: "margin-top:14px" },
      el("button", {
        class: "primary",
        type: "button",
        onclick: () => {
          state.step = "input";
          answer.lastStep = "input";
          saveProgress();
          render();
        },
      }, "解説へ進む"),
      el("button", {
        class: "secondary",
        type: "button",
        onclick: () => {
          state.step = "first";
          answer.lastStep = "first";
          saveProgress();
          render();
        },
      }, "Step 1に戻ってやり直す"),
      el("button", {
        class: "ghost",
        type: "button",
        onclick: () => {
          setReview(item.id);
          saveProgress();
          render();
        },
      }, "あとで復習する")
    )
  );
}

function compareBox(title, attempt) {
  return el("div", { class: "noteBox full" },
    el("h3", {}, title),
    el("p", { class: "smallcap" }, `Pattern: ${patternLabel(attempt.pattern)}`),
    renderChunkGrid(attempt.chunks || [])
  );
}

function renderEditor() {
  const view = $("#editorView");
  view.innerHTML = "";
  const studentLabel = ctx.identity.active().name;
  view.appendChild(el("section", { class: "panel editorGrid" },
    el("div", { class: "jsonArea" },
      el("h2", {}, "教材JSON"),
      el("p", {}, "このアプリは授業内の導入用です。ポラリスのテーマを参考にしつつ、英文・和訳・解説はオリジナルで作成し、宿題で本編の同じテーマへ接続します。"),
      el("textarea", {
        id: "editorJson",
        oninput: (event) => { state.editorJson = event.target.value; },
      }, state.editorJson),
      el("div", { class: "actions", style: "margin-top:12px" },
        el("button", { type: "button", onclick: loadEditorJson }, "このJSONを読み込む"),
        el("button", { class: "ghost", type: "button", onclick: downloadEditorJson }, "教材JSON保存"),
        el("button", { class: "ghost", type: "button", onclick: addBlankItem }, "空の項目を追加")
      ),
      el("div", { class: "actions destructiveActions" },
        el("button", {
          class: "danger",
          type: "button",
          onclick: () => {
            if (!confirm(`「${studentLabel}」の学習進捗を全て削除しますか？この操作は元に戻せません。`)) return;
            state.progress = defaultProgress();
            saveProgress();
            render();
          },
        }, `この生徒（${studentLabel}）の進捗を全消去`)
      )
    ),
    el("aside", { class: "preview" },
      el("h2", {}, "収録項目"),
      ...(state.dataset?.items || []).map((item) => el("div", { class: "noteBox" },
        el("p", { class: "label" }, `${item.theme} / ${item.themeTitle || ""}`),
        el("h3", {}, `${item.pointNo}. ${item.pointTitle}`),
        el("p", {}, item.sentence)
      ))
    )
  ));
}

function loadEditorJson() {
  try {
    const parsed = JSON.parse(state.editorJson);
    if (!Array.isArray(parsed.items)) throw new Error("items が配列ではありません。");
    state.dataset = parsed;
    state.progress = loadProgress();
    state.selectedId = parsed.items[0]?.id || "";
    state.mode = "learn";
    render();
  } catch (error) {
    alert(`JSONを読み込めません: ${error.message}`);
  }
}

function downloadEditorJson() {
  try {
    const parsed = JSON.parse(state.editorJson);
    const blob = new Blob([JSON.stringify(parsed, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "polaris1.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch (error) {
    alert(`JSONを保存できません: ${error.message}`);
  }
}

function addBlankItem() {
  const dataset = JSON.parse(state.editorJson || JSON.stringify(state.dataset));
  const nextNo = (dataset.items?.length || 0) + 1;
  dataset.items = dataset.items || [];
  dataset.items.push({
    id: `polaris1_custom_${Date.now()}`,
    theme: "THEME 1",
    themeTitle: "未設定",
    pointNo: nextNo,
    pointTitle: "新しい小テーマ",
    sentence: "",
    pattern: "",
    root: { chunks: [] },
    explanation: {
      analysis: "",
      guidance: "",
      translationExample: "",
      vocab: [],
      checkpoints: []
    }
  });
  state.editorJson = JSON.stringify(dataset, null, 2);
  renderEditor();
}

function renderEmpty() {
  return el("p", { class: "warning" }, "教材データがありません。先生画面でJSONを確認してください。");
}

export async function mount(root, context) {
  ctx = context;
  viewRoot = root;
  // 教材編集は先生用。統合後もクエリで明示したときだけ出す。
  editorEnabled = ctx.params.get("mode") === "editor";
  state.mode = "learn";
  state.cloudStatus = { message: "", tone: "" };

  root.innerHTML = await fetch(VIEW_URL, { cache: "no-store" }).then((response) => {
    if (!response.ok) throw new Error(`${VIEW_URL}: ${response.statusText}`);
    return response.text();
  });

  try {
    await loadApp();
  } catch (error) {
    console.error(error);
    root.innerHTML = `<section class="panel"><h2>読み込みエラー</h2><p>${error.message}</p></section>`;
  }

  return {
    unmount() {
      viewRoot = document;
    }
  };
}
