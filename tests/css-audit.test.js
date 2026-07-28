import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readCss(path) {
  return readFileSync(join(import.meta.dir, "..", path), "utf8");
}

test("avatar stack sizing uses stack tokens and RTL status-dot direction", () => {
  const css = readCss("src/css/components/avatar.css");

  expect(css).toContain("--avatar-size: var(--avatar-stack-size, 2.25rem);");
  expect(css).toContain("--avatar-stack-size: 1.75rem;");
  expect(css).toContain(".avatar:dir(rtl) > .badge:empty");
});

test("single selects include size=1 in native and custom select paths", () => {
  const selectCss = readCss("src/css/forms/select.css");
  const customSelectCss = readCss("src/css/forms/custom-select.css");

  expect(selectCss).toContain(':not([multiple])[size="1"]');
  expect(customSelectCss).toContain('[size]:not([size="1"])');
});

test("nav-list is self-laid out with grid gap", () => {
  const css = readCss("src/css/components/navbar.css");

  expect(css).toMatch(/\.nav-list\s*\{[\s\S]*display:\s*grid;/);
  expect(css).toMatch(/\.nav-list\s*\{[\s\S]*gap:\s*var\(--gap\);/);
});

test("card picture bleed clips children", () => {
  const css = readCss("src/css/components/card.css");

  expect(css).toMatch(/\.card > picture\.bleed\s*\{[\s\S]*overflow:\s*hidden;/);
});

test("backdrop token remains dark independent from surface-solid", () => {
  const css = readCss("src/css/tokens.css");

  expect(css).toContain("--backdrop-color: rgb(0 0 0);");
});

test("switch travel accounts for border width", () => {
  const css = readCss("src/css/forms/switch.css");

  expect(css).toContain("var(--border-width)");
  expect(css).toMatch(/--switch-travel:[\s\S]*var\(--border-width\)/);
});

test("file selector button reflects disabled cursor", () => {
  const css = readCss("src/css/forms/native.css");

  expect(css).toContain(".file:disabled::file-selector-button");
  expect(css).toContain("cursor: not-allowed;");
});

test("status bar supports long tokens and is hidden in print", () => {
  const statusCss = readCss("src/css/components/status-bar.css");
  const printCss = readCss("src/css/print.css");

  expect(statusCss).toContain("overflow-wrap: anywhere;");
  expect(printCss).toContain(".status-bar");
});

test("busy overlay can inherit local surface background", () => {
  const busyCss = readCss("src/css/components/busy.css");
  const cardCss = readCss("src/css/components/card.css");

  expect(busyCss).toContain("var(--busy-overlay-bg, var(--surface))");
  expect(cardCss).toContain("--busy-overlay-bg: var(--surface-solid);");
});

test("flyout styles include disabled item treatment", () => {
  const css = readCss("src/css/components/flyout.css");

  expect(css).toContain('[aria-disabled="true"]');
  expect(css).toContain("pointer-events: none;");
});

test("tabs include vertical orientation styling", () => {
  const css = readCss("src/css/components/tab.css");

  expect(css).toContain('.tabs[aria-orientation="vertical"]');
  expect(css).toContain("border-inline-end");
});

test("breadcrumb supports aria-current on list items", () => {
  const css = readCss("src/css/components/breadcrumb.css");

  expect(css).toContain('.breadcrumb li:where([aria-current]:not([aria-current="false"]))');
  expect(css.includes("pointer-events: none")).toBe(false);
});

test("prose styles native kbd elements", () => {
  const css = readCss("src/css/prose.css");

  expect(css).toContain(".prose kbd");
  expect(css).toContain("font-family: var(--font-mono);");
});

test("scrollspy CSS exposes native target-current enhancement", () => {
  const css = readCss("src/css/components/scrollspy.css");

  expect(css).toContain("scroll-target-group: auto;");
  expect(css).toContain(".scrollspy a:target-current");
});

test("modal uses scrollbar gutter only for measured classic-scrollbar locks", () => {
  const css = readCss("src/css/components/modal.css");
  const resetCss = readCss("src/css/reset.css");

  expect(css).toContain("html.has-modal-open.had-scrollbar");
  expect(css).toContain("scrollbar-gutter: stable;");
  expect(resetCss.includes("scrollbar-gutter: stable;")).toBe(false);
});

test("alert.callout is excluded from the soft-tint recipe and uses ::before inset band", () => {
  const css = readCss("src/css/components/alert.css");

  expect(css).toContain(':not(.solid, .outline, .callout)');
  expect(css).toContain(".alert.callout::before");
  expect(css).toContain("background: var(--intent, var(--neutral));");
});

test("alert.admonition neutralizes root padding and gap, and defines alert-title/alert-body", () => {
  const css = readCss("src/css/components/alert.css");

  expect(css).toContain(".alert.admonition");
  expect(css).toMatch(/\.alert\.admonition\s*\{[\s\S]*padding:\s*0;/);
  expect(css).toMatch(/\.alert\.admonition\s*\{[\s\S]*gap:\s*0;/);
  expect(css).toContain(".alert-title");
  expect(css).toContain(".alert-body");
});

test("every intent-consuming component declares its @sync intent-boundary block", () => {
  const components = [
    { file: "alert.css", name: "alert" },
    { file: "badge.css", name: "badge" },
    { file: "button.css", name: "btn" },
    { file: "card.css", name: "card" },
  ];

  for (const { file, name } of components) {
    const css = readCss(`src/css/components/${file}`);
    expect(css).toContain("@sync intent-boundary");
  }
});

test("alert-title margins are reset inside alert-body", () => {
  const css = readCss("src/css/components/alert.css");

  expect(css).toContain(".alert-body > :first-child");
  expect(css).toContain(".alert-body > :last-child");
});
