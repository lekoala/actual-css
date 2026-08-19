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

test("size=1 selects follow the single-select paths", () => {
  const selectCss = readCss("src/css/forms/select.css");
  const customSelectCss = readCss("src/css/forms/custom-select.css");

  expect(selectCss).toContain(':not([multiple], [size]:not([size="1"]))');
  expect(customSelectCss).toContain('[size]:not([size="1"])');
});

test("accordion and select share the chevron asset", () => {
  const tokensCss = readCss("src/css/tokens.css");
  const selectCss = readCss("src/css/forms/select.css");
  const accordionCss = readCss("src/css/components/accordion.css");

  expect(tokensCss).toContain("--icon-chevron:");
  expect(tokensCss).not.toContain("--icon-chevron-mask:");
  expect(tokensCss).not.toContain("--icon-chevron-image:");

  expect(selectCss).toContain("background-image: var(--icon-chevron);");
  expect(accordionCss).toContain("mask: var(--icon-chevron) center / contain no-repeat;");
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

test("generic grid exposes an override without changing fixed grids", () => {
  const css = readCss("src/css/grid.css");

  expect(css.replace(/\s+/g, " ")).toContain(
    "grid-template-columns: var( --grid-columns, repeat(auto-fit, minmax(min(100%, var(--grid-min, 16rem)), 1fr)) );",
  );
  expect(css).toContain("--grid-min");
  expect(css).toContain("--grid-columns");
  expect(css).toContain(".grid-2 {\n  grid-template-columns: repeat(2, minmax(0, 1fr));");
  expect(css).toContain(".grid-3 {\n  grid-template-columns: repeat(3, minmax(0, 1fr));");
  expect(css).toContain(".grid-4 {\n  grid-template-columns: repeat(4, minmax(0, 1fr));");
  expect(css).toContain(".grid-6 {\n  grid-template-columns: repeat(6, minmax(0, 1fr));");
  expect(css).toContain(".container-query .grid-6 {\n    grid-template-columns: repeat(3, minmax(0, 1fr));");
});

test("form-actions exposes alignment hooks while sticky behavior remains intact", () => {
  const css = readCss("src/css/forms/form-actions.css");

  expect(css).toContain("align-items: var(--form-actions-align, center);");
  expect(css).toContain("justify-content: var(--form-actions-justify, flex-start);");
  expect(css).toContain("margin-block-start: var(--form-actions-margin-block-start, var(--space-50));");
  expect(css).toContain(".form-actions.sticky {");
  expect(css).toContain("position: sticky;");
});

test("cluster resets direct-child margins like stack", () => {
  const css = readCss("src/css/layout.css");

  expect(css).toMatch(/\.stack > \* \{\s*margin: 0;\s*\}/);
  expect(css).toMatch(/\.cluster > \* \{\s*margin: 0;\s*\}/);
});

test("native color control has normal, disabled, focus, and forced-colors states", () => {
  const css = readCss("src/css/forms/native.css");

  expect(css).toContain(".color {");
  expect(css).toContain("inline-size: var(--control-size);");
  expect(css).toContain("block-size: var(--control-size);");
  expect(css).toContain(".color:disabled");
  expect(css).toContain(".color:focus-visible");
  expect(css).toContain("@media (forced-colors: active)");
  expect(css).toContain(".color::-webkit-color-swatch-wrapper");
  expect(css).toContain(".color::-moz-color-swatch");
});

test("status bar supports long tokens and is hidden in print", () => {
  const statusCss = readCss("src/css/components/status-bar.css");
  const printCss = readCss("src/css/print.css");

  expect(statusCss).toContain("overflow-wrap: anywhere;");
  expect(printCss).toContain(".status-bar");
});

test("badge is content-sized and never stretches in a stack", () => {
  const css = readCss("src/css/components/badge.css");

  expect(css).toMatch(/\.badge \{[\s\S]*inline-size: fit-content;/);
  expect(css).toMatch(/\.badge \{[\s\S]*max-inline-size: 100%;/);
});

test("inverted is a generic inverse surface treatment via --ui-*", () => {
  const css = readCss("src/css/variants.css");

  expect(css).toMatch(/\.inverted \{[\s\S]*--ui-bg: var\(--surface-solid\);/);
  expect(css).toMatch(/\.inverted \{[\s\S]*--ui-fg: var\(--surface\);/);
  expect(css).toMatch(/\.inverted \{[\s\S]*--heading: var\(--surface\);/);
});

test("busy overlay can inherit local surface background", () => {
  const busyCss = readCss("src/css/components/busy.css");
  const variantsCss = readCss("src/css/variants.css");

  expect(busyCss).toContain("var(--busy-overlay-bg, var(--surface))");
  expect(variantsCss).toContain("--busy-overlay-bg: var(--surface-solid);");
});

test("menu item styles include disabled treatment", () => {
  const css = readCss("src/css/components/menu.css");

  expect(css).toContain('[aria-disabled="true"]');
  expect(css).toContain("cursor: not-allowed;");
});

test("tabs include vertical orientation styling", () => {
  const css = readCss("src/css/components/tab.css");

  expect(css).toContain('.tabs[aria-orientation="vertical"]');
  expect(css).toContain("border-inline-end");
});

test("breadcrumb supports aria-current on the link or span", () => {
  const css = readCss("src/css/components/breadcrumb.css");

  expect(css).toContain('.breadcrumb :where(a, span):where([aria-current]:not([aria-current="false"]))');
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

test("dialog surfaces stay fixed to the viewport", () => {
  const modalCss = readCss("src/css/components/modal.css");
  const drawerCss = readCss("src/css/components/drawer.css");

  expect(modalCss).toMatch(/dialog\.modal\s*\{[^}]*position:\s*fixed;/);
  expect(drawerCss).toMatch(/dialog\.drawer\s*\{[^}]*position:\s*fixed;/);
  expect(drawerCss).toMatch(/dialog\.drawer\s*\{[^}]*inset-block-start:\s*0;/);
  expect(drawerCss).toMatch(/dialog\.drawer\s*\{[^}]*block-size:\s*100%;/);
  expect(drawerCss).toMatch(/dialog\.drawer\s*\{[^}]*max-block-size:\s*100%;/);
});

test("confirmation dialog composes media alignment with an intent-aware icon well", () => {
  const css = readCss("src/css/components/modal.css");

  expect(css).toContain("dialog.modal.dialog-confirmation > form > .media");
  expect(css).toMatch(/\.dialog-icon\s*\{[^}]*place-items:\s*center;/);
  expect(css).toMatch(/\.dialog-icon\s*\{[^}]*border-radius:\s*var\(--radius-full\);/);
  expect(css).toContain("background: var(--ui-bg, var(--surface-subtle));");
  expect(css).toContain("color: var(--ui-fg, var(--intent, var(--text-muted)));");
});

test("alert.callout is excluded from the soft-tint recipe and uses a thick solid leading border", () => {
  const css = readCss("src/css/components/alert.css");

  expect(css).toContain(':not(.solid, .outline, .callout)');
  expect(css).toContain(
    "border-inline-start: var(--alert-border-inline-start-width, 4px) solid",
  );
  expect(css).toContain("border: 0");
});

test("alert.admonition neutralizes root padding and gap, and scopes alert-title/alert-body", () => {
  const css = readCss("src/css/components/alert.css");

  expect(css).toContain(".alert.admonition");
  expect(css).toMatch(/\.alert\.admonition\s*\{[\s\S]*padding:\s*0;/);
  expect(css).toContain(".alert.admonition > .alert-title");
  expect(css).toContain(".alert.admonition > .alert-body");
  expect(css).not.toMatch(/(^|\n)\.alert-title\s*\{/);
});

test("alert-title margins are reset inside a scoped alert-body", () => {
  const css = readCss("src/css/components/alert.css");

  expect(css).toContain(".alert.admonition > .alert-body > :first-child");
  expect(css).toContain(".alert.admonition > .alert-body > :last-child");
});

test("theme-derived aliases are declared on :root, [data-theme] so islands recompute them", () => {
  const tokensCss = readCss("src/css/tokens.css");
  const themeCss = readCss("src/css/theme.css");

  const inThemeBoundary = (source, prop) => {
    const block = source.match(/^:root,\s*\n\[data-theme\]\s*\{([\s\S]*?)\n\}/m)?.[1] ?? "";
    return block.includes(prop);
  };

  // tokens.css aliases
  for (const prop of ["--state-selected", "--state-disabled", "--indicator-ring"]) {
    expect(inThemeBoundary(tokensCss, prop), `${prop} on [data-theme] in tokens.css`).toBe(true);
  }
  // theme.css aliases
  for (const prop of ["--heading", "--selection-bg", "--selection-fg", "--focus-ring-shadow"]) {
    expect(inThemeBoundary(themeCss, prop), `${prop} on [data-theme] in theme.css`).toBe(true);
  }
  // color-mix shadows re-derive from --shadow-color on the theme boundary
  expect(tokensCss).toMatch(/@supports \(color: color-mix\(in oklch, red, white\)\)\s*\{\s*:root,\s*\n\s*\[data-theme\]\s*\{[\s\S]*--shadow:/);
});

test("controls inside a disabled fieldset match :disabled by inheritance", () => {
  const choiceCss = readCss("src/css/forms/choice.css");
  const switchCss = readCss("src/css/forms/switch.css");
  const choiceCardCss = readCss("src/css/forms/choice-card.css");
  const controlCss = readCss("src/css/forms/control.css");

  expect(choiceCss).toContain(".check:disabled");
  expect(choiceCss).toContain(".radio:disabled");
  expect(choiceCss).toContain(".choice:has(> :disabled)");

  expect(switchCss).toContain(".switch:disabled");

  expect(choiceCardCss).toContain(".choice-card:has(:disabled)");

  expect(controlCss).toContain(".input:disabled");
  expect(controlCss).toContain(".textarea:disabled");
  expect(controlCss).toContain(".select:disabled");
});

test("optional OTP keeps one native input and covers validation states", () => {
  const css = readCss("src/css/optional/otp.css");

  expect(css).toContain(".otp > input");
  expect(css).toMatch(/\.otp\s*\{[\s\S]*inline-size:\s*fit-content;/);
  expect(css).toMatch(/\.otp\s*\{[\s\S]*border-radius:\s*var\(--radius\);/);
  expect(css).toContain('input[aria-invalid="true"] ~ span');
  expect(css).toContain(".needs-validation.was-validated .otp > input:invalid ~ span");
  expect(css).toContain("input:user-invalid ~ span");
  expect(css).toContain("input:disabled ~ span");
});

test("optional chat bubbles consume shared intents and variants", () => {
  const css = readCss("src/css/optional/chat.css");

  expect(css).toContain(":where(.chat-bubble)");
  expect(css).toContain("var(--ui-bg, var(--intent, var(--surface-subtle)))");
  expect(css).toContain("overflow-wrap: anywhere;");
});

test("optional aura only animates when motion is allowed", () => {
  const css = readCss("src/css/optional/aura.css");

  expect(css).toContain("@media (prefers-reduced-motion: no-preference)");
  expect(css).toContain(".aura:not(.aura-glow)");
  expect(css).toContain("@media (forced-colors: active)");
});

test("optional FAB preserves DOM order and stays out of print", () => {
  const css = readCss("src/css/optional/fab.css");

  expect(css).toContain("flex-direction: column;");
  expect(css).not.toContain("column-reverse");
  expect(css).toContain(".fab[open] > .fab-actions");
  expect(css).toContain("@media print");
});
