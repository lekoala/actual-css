import { expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Window } from "happy-dom";

const appRoot = resolve("demo/sites/actual-tasks");
const html = readFileSync(resolve(appRoot, "index.html"), "utf8");

test("mobile demo uses one adaptive navigation landmark and semantic compact controls", () => {
  const window = new Window();
  window.document.write(html);

  const shell = window.document.body;
  expect(shell.matches(".app-shell.app-layout")).toBe(true);
  expect(shell.querySelectorAll(":scope > .topbar")).toHaveLength(1);
  expect(shell.querySelectorAll(":scope > .app-main")).toHaveLength(1);
  expect(shell.querySelectorAll(":scope > nav.app-nav")).toHaveLength(1);
  expect(shell.querySelectorAll(".app-nav a[data-view]")).toHaveLength(5);
  expect(shell.querySelectorAll('.app-nav a[aria-current="page"]')).toHaveLength(1);
  expect(shell.querySelectorAll("[data-page]")).toHaveLength(5);
  expect(shell.querySelectorAll(".list").length).toBeGreaterThanOrEqual(5);
  expect(shell.querySelectorAll("button.btn[aria-pressed]").length).toBeGreaterThanOrEqual(3);
  expect(shell.querySelectorAll('input.switch[type="checkbox"]')).toHaveLength(1);
  expect(shell.querySelectorAll("#task-list .task-rating .rating.sm")).toHaveLength(2);
  expect(shell.querySelector("#task-dialog.modal:not(.scrollable)")).not.toBeNull();
  for (const rating of shell.querySelectorAll("#task-list .task-rating .rating")) {
    expect(rating.querySelectorAll('input[type="radio"]')).toHaveLength(5);
    expect(rating.querySelectorAll('input[type="radio"]:checked')).toHaveLength(1);
  }
  expect(
    shell.querySelector(".input-icon > .ti-search:first-child + input[aria-label='Search tasks']"),
  ).not.toBeNull();
  expect(shell.querySelector("#compact-mode")).toBeNull();
  expect(shell.querySelectorAll(":scope > .fab.mobile-fab > .btn.icon-only")).toHaveLength(1);
  expect(shell.querySelector(".chip, .snackbar")).toBeNull();

  const appCss = readFileSync(resolve(appRoot, "app.css"), "utf8");
  const appJs = readFileSync(resolve(appRoot, "app.js"), "utf8");
  expect(appCss).toMatch(/\.mobile-icon,[\s\S]*?inline-size:\s*1\.5rem;/);
  expect(appCss).toMatch(/\.mobile-icon,[\s\S]*?block-size:\s*1\.5rem;/);
  expect(html).toContain("@tabler/icons-webfont@3.46.0");
  expect(html).not.toContain("<symbol");
  expect(appCss).not.toContain("body.sm");
  expect(appJs).not.toContain("actual-mobile-density");

  window.close();
});

test("mobile demo stays independent from install and offline infrastructure", () => {
  expect(existsSync(resolve(appRoot, "app.css"))).toBe(true);
  expect(existsSync(resolve(appRoot, "app.js"))).toBe(true);
  expect(existsSync(resolve(appRoot, "manifest.webmanifest"))).toBe(false);
  expect(existsSync(resolve(appRoot, "service-worker.js"))).toBe(false);
});
