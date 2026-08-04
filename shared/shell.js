"use strict";
/* ============================================================
   shared/shell.js — アプリの外装（1回だけ描画される）

   統合前はヘッダー・モジュールナビ・ステッパーが3つのHTMLに重複していた。
   ここで1箇所に統合し、モジュールは本文だけを描く。
   ============================================================ */

import { createIdentity } from "./identity.js";
import { createStore } from "./store.js";
import { createRouter } from "./router.js?v=20260804-grammar200q-v9";
import { MODULES, computeFlow, findModule } from "./flow.js?v=20260804-grammar200q-v9";

const APP_ID = "english-grammar-trainer"; // app_progress.app（統合により1生徒＝1行）
const CONFIG_PATH = "config.json";

const identity = createIdentity();
const store = createStore();
let cloud = null;
let router = null;

const dom = {};

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

/* ---- ヘッダー ---------------------------------------------- */

function buildHeader() {
  const header = el("header", "appHeader");
  const row = el("div", "appHeader__row");

  const brand = el("div", "appHeader__brand");
  brand.appendChild(el("p", "eyebrow", "英語学習トレーナー"));
  dom.title = el("h1", null, "");
  brand.appendChild(dom.title);
  row.appendChild(brand);

  const tools = el("div", "appHeader__tools");

  dom.studentPicker = el("div", "studentPicker");
  const label = el("label", null, "生徒");
  label.setAttribute("for", "studentSelect");
  dom.studentSelect = el("select");
  dom.studentSelect.id = "studentSelect";
  dom.studentSelect.addEventListener("change", (e) => switchStudent(e.target.value));
  dom.addStudent = el("button", "ghostButton", "生徒追加");
  dom.addStudent.type = "button";
  dom.addStudent.addEventListener("click", addStudent);
  dom.studentPicker.append(label, dom.studentSelect, dom.addStudent);
  tools.appendChild(dom.studentPicker);

  dom.shareStatus = el("p", "shareStatus");
  dom.shareStatus.setAttribute("aria-live", "polite");
  tools.appendChild(dom.shareStatus);

  row.appendChild(tools);
  header.appendChild(row);
  return header;
}

function renderStudents() {
  if (identity.isLocked()) {
    dom.studentPicker.classList.add("hidden");
    return;
  }
  dom.studentPicker.classList.remove("hidden");
  dom.studentSelect.replaceChildren();
  identity.list().forEach((student) => {
    const option = el("option", null, student.name);
    option.value = student.id;
    dom.studentSelect.appendChild(option);
  });
  dom.studentSelect.value = identity.activeId();
}

function switchStudent(id) {
  identity.setActive(id);
  store.useStudent(identity.activeId());
  renderStudents();
  renderFlow();
  // 生徒が変われば進捗も変わる。表示中のモジュールを新しい進捗で描き直す。
  router.reload();
}

function addStudent() {
  const name = window.prompt("追加する生徒の名前を入力してください。");
  if (name == null) return;
  const student = identity.add(name);
  if (!student) return;
  identity.setActive(student.id);
  store.useStudent(identity.activeId());
  renderStudents();
  renderFlow();
  router.reload();
}

function setShareStatus(message, tone) {
  dom.shareStatus.textContent = message || "";
  if (tone) dom.shareStatus.dataset.tone = tone;
  else delete dom.shareStatus.dataset.tone;
}

/* ---- 学習フロー ステッパー ＋ 横断CTA ----------------------- */

const STATE_LABELS = {
  done: "完了",
  progress: "進行中",
  todo: "これから",
  locked: "未解放",
};

function buildFlowNav() {
  const nav = el("nav", "flowNav");
  nav.setAttribute("aria-label", "学習フローの現在地");
  dom.flowList = el("ol", "flowNav__list");
  nav.appendChild(dom.flowList);
  return nav;
}

function flowItem(mod, state, flow) {
  const isPointer = flow.pointer === mod.id;
  const isViewing = router.currentId() === mod.id;
  const li = el("li", `flowNav__item flowNav__item--${state.status}`);
  if (isPointer) li.classList.add("flowNav__item--current");
  if (isViewing) li.classList.add("flowNav__item--viewing");

  const locked = state.status === "locked";
  const control = el(locked ? "span" : "button", "flowNav__link");
  if (locked) {
    control.setAttribute("aria-disabled", "true");
    control.title = "43セクションの基礎チェックを完了すると解放されます";
  } else {
    control.type = "button";
    if (isViewing) control.setAttribute("aria-current", "page");
    control.setAttribute(
      "aria-label",
      `${mod.name}：${STATE_LABELS[state.status]}、${state.detail}${isPointer ? "（現在地）" : ""}`
    );
    control.addEventListener("click", () => router.navigate(mod.id));
  }

  const badge = el("span", "flowNav__badge", state.status === "done" ? "✓" : (locked ? "🔒" : mod.num));
  badge.setAttribute("aria-hidden", "true");

  const body = el("span", "flowNav__body");
  const name = el("span", "flowNav__name");
  name.appendChild(el("span", "flowNav__mod", mod.name));
  if (isPointer) name.appendChild(el("span", "flowNav__you", "現在地"));
  const status = el("span", "flowNav__status");
  status.appendChild(el("span", "flowNav__stateLabel", STATE_LABELS[state.status]));
  status.appendChild(el("span", "flowNav__detail", state.detail));
  body.append(name, status);

  control.append(badge, body);
  li.appendChild(control);
  return li;
}

function renderFlow() {
  const flow = computeFlow(store);
  dom.flowList.replaceChildren();
  MODULES.forEach((mod, index) => {
    if (index > 0) {
      const sep = el("li", "flowNav__sep", "›");
      sep.setAttribute("aria-hidden", "true");
      dom.flowList.appendChild(sep);
    }
    dom.flowList.appendChild(flowItem(mod, flow.states[mod.id], flow));
  });
  renderNextAction(flow);
  const current = findModule(router.currentId());
  if (current) dom.title.textContent = current.name;
}

/* 横断の「つづきから」。
   いま見ている画面が推奨導線上の現在地と一致するときは出さない。
   1画面の主要アクションを1つに保つため（モジュール側のCTAと二重にしない）。 */
function renderNextAction(flow) {
  dom.nextAction.replaceChildren();
  if (!flow.next.label || router.currentId() === flow.next.moduleId) {
    dom.nextAction.classList.add("hidden");
    return;
  }
  dom.nextAction.classList.remove("hidden");
  dom.nextAction.appendChild(el("p", "nextAction__label", "次にやること"));
  const button = el("button", "nextAction__cta", flow.next.label);
  button.type = "button";
  button.addEventListener("click", () => router.navigate(flow.next.moduleId));
  dom.nextAction.appendChild(button);
}

/* ---- フッター ---------------------------------------------- */

function buildFooter() {
  const footer = el("footer", "appFooter");
  dom.storageNote = el("p", null, "");
  const reset = el("button", "dangerButton", "この生徒の記録をすべて消す");
  reset.type = "button";
  reset.addEventListener("click", () => {
    const name = identity.active().name;
    if (!window.confirm(`${name} の学習記録（基礎チェック・英文法演習・英文解釈）をすべて消しますか？この操作は元に戻せません。`)) return;
    store.clearAll();
    renderFlow();
    router.reload();
  });
  footer.append(dom.storageNote, reset);
  return footer;
}

function renderStorageNote() {
  dom.storageNote.textContent = cloud && cloud.isEnabled()
    ? "記録はクラウドに保存されます。"
    : "記録はこの端末のブラウザにだけ保存されます。";
}

/* ---- 起動 -------------------------------------------------- */

function buildContext(mod, params) {
  return {
    store: store.scope(mod.id),
    identity,
    /* 他モジュールの進捗を読むための口（例: 英文法演習が基礎チェックの到達度を表示する）。
       統合前はここが localStorage の直接参照で、しかもキーが食い違っていた。 */
    peek: (moduleId) => store.scope(moduleId).get(),
    params: params || new URLSearchParams(),
    navigate: (id, nextParams) => router.navigate(id, nextParams),
    flow: () => computeFlow(store),
  };
}

async function start() {
  identity.load();
  store.useStudent(identity.activeId());

  const shell = el("div", "appShell");
  shell.append(buildHeader(), buildFlowNav());
  dom.nextAction = el("section", "nextAction hidden");
  shell.appendChild(dom.nextAction);
  dom.main = el("main");
  dom.main.id = "moduleRoot";
  shell.appendChild(dom.main);
  shell.appendChild(buildFooter());
  document.body.replaceChildren(shell);

  const styleLink = document.getElementById("moduleStyles");

  router = createRouter({
    mountPoint: dom.main,
    styleLink,
    buildContext,
    onChange: () => renderFlow(),
  });

  renderStudents();

  // 共有URL（?s=&t=）があるときだけクラウド同期が有効になる。
  // 無ければ完全にローカル動作（harness の設計を踏襲）。
  if (typeof window.createCloud === "function") {
    /* クラウドから来た進捗は、いったん受け取るだけにして即座には適用しない。
       cloud.init() は「認証してから進捗を返す」ため、applyLoaded が呼ばれる時点では
       まだ生徒が確定しておらず、端末の既定生徒（default）の記録に書き込んでしまう。
       その後 useStudent() で本人へ切り替えると、その記録は読み捨てられて空になり、
       次の解答でクラウドへ空の進捗が上書き保存される（学習記録の消失）。
       生徒を確定させた後に適用する。 */
    let loadedFromCloud = null;
    cloud = window.createCloud({
      appId: APP_ID,
      configPath: CONFIG_PATH,
      getPayload: () => store.snapshot(),
      applyLoaded: (progress) => { loadedFromCloud = progress; },
      onStatus: (message, tone) => setShareStatus(message, tone),
    });
    const session = await cloud.init();
    if (session.enabled && session.student) {
      identity.lockTo(session.student);
      store.useStudent(identity.activeId());
      if (loadedFromCloud) store.replace(loadedFromCloud);
      renderStudents();
    }
    // 保存の登録は、正しい生徒の進捗を読み込み終えた後に行う。
    store.setPersist(() => cloud.queueSave());
  }

  renderStorageNote();
  store.subscribe(() => renderFlow());
  await router.start();
  renderFlow();
}

start().catch((e) => {
  console.error(e);
  document.body.replaceChildren();
  const p = el("p", "muted", "アプリの起動に失敗しました。ページを再読み込みしてください。");
  document.body.appendChild(p);
});
