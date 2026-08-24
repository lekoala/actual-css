const views = new Set(["today", "tasks", "projects", "activity", "settings"]);
const pages = [...document.querySelectorAll("[data-page]")];
const navigationLinks = [...document.querySelectorAll(".app-nav [data-view]")];
const appMain = document.getElementById("app-main");
const titles = {
  today: "Today",
  tasks: "Tasks",
  projects: "Projects",
  activity: "Activity",
  settings: "Settings",
};

function requestedView() {
  const view = new URL(location.href).searchParams.get("view");
  return views.has(view) ? view : "today";
}

function showView(view, { push = false, focus = false } = {}) {
  if (!views.has(view)) view = "today";

  for (const page of pages) {
    const active = page.dataset.page === view;
    page.hidden = !active;
    page.inert = !active;
  }
  for (const link of navigationLinks) {
    if (link.dataset.view === view) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  }

  document.title = `${titles[view]} — Actual Tasks`;
  if (push) history.pushState({ view }, "", `?view=${view}`);
  appMain.scrollTop = 0;
  if (focus) appMain.focus({ preventScroll: true });
}

document.addEventListener("click", (event) => {
  const link = event.target.closest("a[data-view]");
  if (!link || !views.has(link.dataset.view)) return;
  event.preventDefault();
  showView(link.dataset.view, { push: true, focus: true });
});

addEventListener("popstate", () => showView(requestedView(), { focus: true }));
showView(requestedView());

const todayList = document.getElementById("today-list");
const todayEmpty = document.getElementById("today-empty");
const filterGroup = document.querySelector(".mobile-filters");

filterGroup.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-filter]");
  if (!button) return;

  for (const candidate of filterGroup.querySelectorAll("button[data-filter]")) {
    const selected = candidate === button;
    candidate.setAttribute("aria-pressed", String(selected));
    candidate.classList.toggle("outline", !selected);
  }

  let visible = 0;
  for (const row of todayList.children) {
    row.hidden = button.dataset.filter !== "all" && row.dataset.state !== button.dataset.filter;
    if (!row.hidden) visible++;
  }
  todayEmpty.hidden = visible !== 0;
});

todayList.addEventListener("change", (event) => {
  const checkbox = event.target.closest('input[type="checkbox"]');
  const row = checkbox?.closest("[data-state]");
  if (!row) return;
  row.dataset.state = checkbox.checked ? "done" : "open";
  document.dispatchEvent(
    new CustomEvent("actual:status", {
      detail: { message: checkbox.checked ? "Task completed." : "Task reopened.", intent: "success" },
    }),
  );
});

const taskList = document.getElementById("task-list");
const taskSearch = document.getElementById("task-search");
const tasksEmpty = document.getElementById("tasks-empty");

setTimeout(() => {
  document.getElementById("tasks-loading").hidden = true;
  taskList.hidden = false;
}, 450);

taskSearch.addEventListener("input", () => {
  const query = taskSearch.value.trim().toLocaleLowerCase();
  let visible = 0;
  for (const row of taskList.children) {
    row.hidden = !row.dataset.search.includes(query);
    if (!row.hidden) visible++;
  }
  tasksEmpty.hidden = visible !== 0;
});

taskList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-delete-task]");
  const row = button?.closest("li");
  if (!row) return;
  const name = row.querySelector("strong")?.textContent || "Task";
  row.remove();
  tasksEmpty.hidden = taskList.children.length !== 0;
  document.dispatchEvent(
    new CustomEvent("actual:status", {
      detail: { message: `${name} deleted.`, intent: "neutral" },
    }),
  );
});

const taskDialog = document.getElementById("task-dialog");
const taskForm = document.getElementById("task-form");
let taskRatingSequence = 0;

const createTaskRating = (taskName) => {
  const field = document.createElement("fieldset");
  field.className = "field task-rating";

  const legend = document.createElement("legend");
  legend.className = "sr-only";
  legend.textContent = `Rate ${taskName}`;

  const rating = document.createElement("span");
  rating.className = "rating primary sm";
  const groupName = `rating-created-task-${taskRatingSequence++}`;

  for (let value = 1; value <= 5; value += 1) {
    const input = document.createElement("input");
    input.type = "radio";
    input.name = groupName;
    input.value = String(value);
    input.setAttribute("aria-label", `${value} ${value === 1 ? "star" : "stars"}`);
    rating.append(input);
  }

  field.append(legend, rating);
  return field;
};

taskForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!taskForm.checkValidity()) return;

  const data = new FormData(taskForm);
  const name = String(data.get("name")).trim();
  const item = document.createElement("li");
  item.className = "list-item";
  item.dataset.search = name.toLocaleLowerCase();

  const avatar = document.createElement("span");
  avatar.className = "avatar primary sm";
  const abbreviation = document.createElement("abbr");
  abbreviation.textContent = name.slice(0, 2).toUpperCase();
  avatar.append(abbreviation);

  const body = document.createElement("div");
  body.className = "list-item-content";
  const title = document.createElement("strong");
  title.className = "list-item-title";
  title.textContent = name;
  const meta = document.createElement("span");
  meta.className = "list-item-text";
  meta.textContent = `${data.get("priority")} priority · Just now`;
  body.append(title, meta, createTaskRating(name));

  const remove = document.createElement("button");
  remove.className = "btn ghost icon-only sm";
  remove.type = "button";
  remove.dataset.deleteTask = "";
  remove.setAttribute("aria-label", `Delete ${name}`);
  remove.innerHTML = '<i class="ti ti-trash mobile-icon" aria-hidden="true"></i>';

  item.append(avatar, body, remove);
  taskList.prepend(item);
  taskList.hidden = false;
  tasksEmpty.hidden = true;
  taskForm.reset();
  taskDialog.close();
  showView("tasks", { push: requestedView() !== "tasks", focus: true });
  document.dispatchEvent(
    new CustomEvent("actual:status", {
      detail: { message: "Task created.", intent: "success" },
    }),
  );
});

const themeSelect = document.getElementById("theme-select");

function applyPreferences() {
  const theme = localStorage.getItem("actual-mobile-theme") || "";
  themeSelect.value = theme;
  if (theme) document.documentElement.dataset.theme = theme;
  else document.documentElement.removeAttribute("data-theme");
}

themeSelect.addEventListener("change", () => {
  localStorage.setItem("actual-mobile-theme", themeSelect.value);
  applyPreferences();
});

document.getElementById("clear-local-data").addEventListener("click", () => {
  localStorage.removeItem("actual-mobile-theme");
  applyPreferences();
  document.dispatchEvent(
    new CustomEvent("actual:status", { detail: { message: "Preferences cleared." } }),
  );
});

applyPreferences();
