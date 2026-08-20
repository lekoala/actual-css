import { expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
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
  const tokensCss = readCss("src/css/core/tokens.css");
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
  const css = readCss("src/css/core/tokens.css");

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
  const css = readCss("src/css/layout/grid.css");

  expect(css.replace(/\s+/g, " ")).toContain(
    "grid-template-columns: var( --grid-columns, repeat(auto-fit, minmax(min(100%, var(--grid-min, 16rem)), 1fr)) );",
  );
  expect(css).toContain("--grid-min");
  expect(css).toContain("--grid-columns");
  expect(css).toContain(".grid-2 {\n  grid-template-columns: repeat(2, minmax(0, 1fr));");
  expect(css).toContain(".grid-3 {\n  grid-template-columns: repeat(3, minmax(0, 1fr));");
  expect(css).toContain(".grid-4 {\n  grid-template-columns: repeat(4, minmax(0, 1fr));");
  expect(css).toContain(".grid-6 {\n  grid-template-columns: repeat(6, minmax(0, 1fr));");
  expect(css).not.toContain(".container-query .grid-");
  expect(css).not.toContain("@container");
});

test("intrinsic composition primitives do not depend on an ancestor opt-in", () => {
  const switcherCss = readCss("src/css/layout/switcher.css");
  const sidebarCss = readCss("src/css/layout/sidebar-layout.css");

  expect(switcherCss).toMatch(/\.switcher\s*\{[\s\S]*display:\s*flex;[\s\S]*flex-wrap:\s*wrap;/);
  expect(switcherCss).toMatch(
    /\.switcher > \*\s*\{[\s\S]*var\(--switcher-threshold, 40rem\)[\s\S]*flex-grow:\s*1;/,
  );
  expect(sidebarCss).toMatch(/\.sidebar-layout\s*\{[\s\S]*display:\s*flex;[\s\S]*flex-wrap:\s*wrap;/);
  expect(sidebarCss).toMatch(
    /\.sidebar-layout > :first-child\s*\{[\s\S]*flex-grow:\s*999;[\s\S]*var\(--sidebar-content-min, 30rem\)/,
  );
  expect(sidebarCss).toMatch(
    /\.sidebar-layout > :last-child\s*\{[\s\S]*var\(--sidebar-layout-size, 18rem\)/,
  );
  expect(sidebarCss).not.toContain(".container-query .sidebar-layout");

  const topbarCss = readCss("src/css/layout/topbar.css");
  expect(topbarCss).not.toContain(".switcher");
});

test("form-actions exposes alignment hooks while sticky behavior remains intact", () => {
  const css = readCss("src/css/forms/form-actions.css");

  expect(css).toContain("align-items: var(--form-actions-align, center);");
  expect(css).toContain("justify-content: var(--form-actions-justify, flex-start);");
  expect(css).toContain("margin-block-start: var(--form-actions-margin-block-start, var(--space-50));");
  expect(css).toContain(".form-actions.sticky {");
  expect(css).toContain("position: sticky;");
});

test("stack resets block margins, cluster resets all margins", () => {
  const stackCss = readCss("src/css/layout/stack.css");
  const clusterCss = readCss("src/css/layout/cluster.css");

  expect(stackCss).toMatch(/\.stack > \* \{\s*margin-block: 0;\s*\}/);
  expect(clusterCss).toMatch(/\.cluster > \* \{\s*margin: 0;\s*\}/);
});

test("typography is imported before layout so stack/cluster own vertical rhythm inside prose", () => {
  const css = readCss("src/css/actual.full.css");
  const typographyIndex = css.indexOf("./typography/index.css");
  const layoutIndex = css.indexOf("./layout/index.css");

  expect(typographyIndex).toBeGreaterThan(-1);
  expect(layoutIndex).toBeGreaterThan(typographyIndex);
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

test("status bar supports long tokens and owns its print behavior", () => {
  const statusCss = readCss("src/css/components/status-bar.css");
  const printCss = readCss("src/css/core/print.css");

  expect(statusCss).toContain("overflow-wrap: anywhere;");
  expect(statusCss).toMatch(/@media print\s*\{[\s\S]*\.status-bar/);
  expect(printCss).not.toContain(".status-bar");
});

test("global print defaults do not know component selectors", () => {
  const printCss = readCss("src/css/core/print.css");

  for (const selector of [
    ".alert",
    ".badge",
    ".btn",
    ".card",
    ".drawer",
    ".flyout",
    ".modal",
    ".spinner",
    ".status-bar",
    ".surface-backdrop",
    ".tooltip",
  ]) {
    expect(printCss).not.toContain(selector);
  }
});

test("badge is content-sized and never stretches in a stack", () => {
  const css = readCss("src/css/components/badge.css");

  expect(css).toMatch(/\.badge \{[\s\S]*inline-size: fit-content;/);
  expect(css).toMatch(/\.badge \{[\s\S]*max-inline-size: 100%;/);
});

test("inverted maps tokens and paints early in variants.css (no late paint)", () => {
  const variants = readCss("src/css/core/variants.css");

  expect(variants).toMatch(/\.inverted \{[\s\S]*--ui-bg: var\(--surface-solid\);/);
  expect(variants).toMatch(/\.inverted \{[\s\S]*--ui-fg: var\(--surface\);/);
  expect(variants).toMatch(/\.inverted \{[\s\S]*--heading: var\(--surface\);/);
  // the direct paint must live on the same early rule, not in a late file
  expect(variants).toMatch(/\.inverted \{[\s\S]*background: var\(--ui-bg\);/);
  expect(variants).toMatch(/\.inverted \{[\s\S]*color: var\(--ui-fg\);/);
  expect(variants).toMatch(/\.inverted \{[\s\S]*border-color: var\(--ui-border\);/);
  // a late paint file must never reappear (it forces non-participants)
  expect(existsSync(join(import.meta.dir, "..", "src", "css", "variants-late.css"))).toBe(false);
});

test("card derives contextual tokens from the surface it owns", () => {
  const css = readCss("src/css/components/card.css");

  expect(css).toMatch(/\.card \{[\s\S]*--card-bg: var\(--ui-bg, var\(--surface-raised\)\);/);
  expect(css).toMatch(/\.card \{[\s\S]*--card-fg: var\(--ui-fg, var\(--text\)\);/);
  expect(css).toMatch(/\.card \{[\s\S]*--heading: var\(--card-fg\);/);
  expect(css).toMatch(/\.card \{[\s\S]*--busy-overlay-bg: var\(--card-bg\);/);
});

test("transparent treatments follow currentColor, including hover", () => {
  const variants = readCss("src/css/core/variants.css");
  const button = readCss("src/css/components/button.css");
  const badge = readCss("src/css/components/badge.css");

  expect(variants).toMatch(/\.outline \{[\s\S]*--ui-fg: var\(--intent, currentColor\);/);
  expect(variants).toMatch(/\.outline \{[\s\S]*--ui-border: var\(--intent, currentColor\);/);
  expect(button).toMatch(/\.btn\.ghost \{[\s\S]*--ui-fg: var\(--intent, currentColor\);/);
  expect(button).toMatch(/\.btn\.link \{[\s\S]*--ui-fg: var\(--intent, currentColor\);/);
  expect(button).toContain("color-mix(in oklch, currentColor 10%, transparent)");
  expect(badge).toContain("color-mix(in oklch, currentColor 10%, transparent)");
});

test("alert and badge defaults stay behind explicit shared treatments", () => {
  const alert = readCss("src/css/components/alert.css");
  const badge = readCss("src/css/components/badge.css");

  expect(alert).toContain("--alert-bg: var(--ui-bg, var(--alert-default-bg));");
  expect(alert).toContain("--alert-border: var(--ui-border, var(--alert-default-border));");
  expect(alert).not.toMatch(/\.alert \{[\s\S]*--ui-bg: color-mix/);
  expect(badge).toContain("--badge-bg: var(--ui-bg, var(--badge-default-bg));");
  expect(badge).toContain("--badge-fg: var(--ui-fg, var(--badge-default-fg));");
  expect(badge).not.toMatch(/\.badge \{[\s\S]*--badge-bg: color-mix/);
});

test("navbar consumes the shared surface contract with an intent boundary", () => {
  const css = readCss("src/css/components/navbar.css");

  expect(css).toMatch(/:where\(\.navbar\) \{[\s\S]*--ui-bg: initial;/);
  expect(css).toMatch(/\.navbar \{[\s\S]*background: var\(--ui-bg, var\(--surface-raised\)\);/);
  expect(css).toMatch(/\.navbar \{[\s\S]*color: var\(--ui-fg, var\(--text\)\);/);
  expect(css).toMatch(/\.navbar-brand \{[\s\S]*color: var\(--ui-fg, var\(--text\)\);/);
  expect(css).toMatch(/\.nav-link \{[\s\S]*color: var\(--ui-fg, var\(--text-muted\)\);/);
});

test("overline is content-sized only on the pill and exposes a radius hook", () => {
  const css = readCss("src/css/typography/overline.css");

  expect(css).not.toMatch(/\.overline \{[\s\S]*align-self: flex-start;/);
  expect(css).toMatch(/\.overline\.pill \{[\s\S]*inline-size: fit-content;/);
  expect(css).toMatch(/\.overline\.pill \{[\s\S]*max-inline-size: 100%;/);
  expect(css).toMatch(/\.overline\.pill \{[\s\S]*--overline-radius: var\(--radius-full\);/);
  expect(css).toMatch(/border-radius: var\(--overline-radius\);/);
});

test("btn.link is intrinsically content-sized", () => {
  const css = readCss("src/css/components/button.css");

  expect(css).toMatch(/\.btn\.link \{[\s\S]*inline-size: fit-content;/);
  expect(css).toMatch(/\.btn\.link \{[\s\S]*max-inline-size: 100%;/);
});

test("busy overlay can inherit local surface background", () => {
  const busyCss = readCss("src/css/components/busy.css");
  const variantsCss = readCss("src/css/core/variants.css");

  expect(busyCss).toContain("var(--busy-overlay-bg, var(--surface))");
  expect(variantsCss).toContain("--busy-overlay-bg: var(--surface-solid);");
});

test("menu item styles include disabled treatment", () => {
  const css = readCss("src/css/components/menu.css");

  expect(css).toContain('[aria-disabled="true"]');
  expect(css).toContain("cursor: not-allowed;");
});

test("rich menu slots and checkable states share the leading column", () => {
  const css = readCss("src/css/components/menu.css");

  expect(css).toContain(".menu-item-icon");
  expect(css).toContain(".menu-item-text");
  expect(css).toContain(".menu-item-end");
  expect(css).toContain('[role="menuitemcheckbox"][aria-checked="true"]');
  expect(css).toContain('[role="menuitemradio"][aria-checked="true"]');
  expect(css).toContain("var(--menu-item-icon-size)");
});

test("tabs include vertical orientation styling", () => {
  const css = readCss("src/css/components/tab.css");

  expect(css).toContain('.tabs[aria-orientation="vertical"]');
  expect(css).toContain("border-inline-end");
});

test("breadcrumb supports aria-current on the link or span", () => {
  const css = readCss("src/css/components/breadcrumb.css");

  expect(css).toContain('.breadcrumb :where(li, a, span):where([aria-current]:not([aria-current="false"]))');
  expect(css.includes("pointer-events: none")).toBe(false);
});

test("prose styles native kbd elements", () => {
  const css = readCss("src/css/typography/prose.css");

  expect(css).toContain(".prose :where(kbd)");
  expect(css).toContain("font-family: var(--font-mono);");
});

test("prose keeps contextual colors and low-specificity element recipes", () => {
  const css = readCss("src/css/typography/prose.css");
  const proseBase = css.match(/\.prose \{([\s\S]*?)\n\}/)?.[1] ?? "";

  expect(proseBase).not.toContain("color:");
  expect(css).toContain(".prose :where(a)");
  expect(css).toMatch(
    /\.prose :where\(h1, h2, h3, h4, h5, h6\) \{[\s\S]*color: var\(--heading, var\(--text\)\);/,
  );
});

test("scrollspy CSS exposes native target-current enhancement", () => {
  const css = readCss("src/css/components/scrollspy.css");

  expect(css).toContain("scroll-target-group: auto;");
  expect(css).toContain(".scrollspy a:target-current");
});

test("modal uses scrollbar gutter only for measured classic-scrollbar locks", () => {
  const css = readCss("src/css/components/modal.css");
  const resetCss = readCss("src/css/core/reset.css");

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

test("alert.callout overrides local defaults with its final surface recipe", () => {
  const css = readCss("src/css/components/alert.css");

  expect(css).toContain("--alert-bg: var(--ui-bg, var(--alert-default-bg));");
  expect(css).toMatch(/\.alert\.callout \{[\s\S]*--alert-bg: var\(--surface-subtle\);/);
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
  const tokensCss = readCss("src/css/core/tokens.css");
  const themeCss = readCss("src/css/core/theme.css");

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
  const css = readCss("src/css/forms/otp.css");

  expect(css).toContain(".otp > input");
  expect(css).toMatch(/\.otp\s*\{[\s\S]*inline-size:\s*fit-content;/);
  expect(css).toMatch(/\.otp\s*\{[\s\S]*border-radius:\s*var\(--radius\);/);
  expect(css).toContain('input[aria-invalid="true"] ~ span');
  expect(css).toContain(".needs-validation.was-validated .otp > input:invalid ~ span");
  expect(css).toContain("input:user-invalid ~ span");
  expect(css).toContain("input:disabled ~ span");
});

test("optional chat bubbles consume shared intents and variants", () => {
  const css = readCss("src/css/components/chat.css");

  expect(css).toContain(":where(.chat-bubble)");
  expect(css).toContain("var(--ui-bg, var(--intent, var(--surface-subtle)))");
  expect(css).toContain("overflow-wrap: anywhere;");
});

test("optional aura only animates when motion is allowed", () => {
  const css = readCss("src/css/effects/aura.css");

  expect(css).toContain("@media (prefers-reduced-motion: no-preference)");
  expect(css).toContain(".aura:not(.aura-glow)");
  expect(css).toContain("@media (forced-colors: active)");
});

test("optional FAB preserves DOM order and stays out of print", () => {
  const css = readCss("src/css/components/fab.css");

  expect(css).toContain("flex-direction: column;");
  expect(css).not.toContain("column-reverse");
  expect(css).toContain(".fab[open] > .fab-actions");
  expect(css).toContain('.fab[open] > summary > [aria-hidden="true"]:only-child');
  expect(css).toContain("transform: rotate(45deg);");
  expect(css).toMatch(/\.fab-action\s*\{[\s\S]*inline-size:\s*max-content;/);
  expect(css).toMatch(/\.fab-label\s*\{[\s\S]*box-shadow:\s*var\(--shadow\);/);
  expect(css).toContain("@media print");
});

test("controls never zero the outline in their base style", () => {
  const css = readCss("src/css/forms/control.css").replace(/\/\*[\s\S]*?\*\//g, "");

  expect(css).toContain(".input:focus-visible");
  expect(css).toContain("outline: 2px solid transparent;");
  expect(css).not.toMatch(/outline\s*:\s*(none|0)\b/);
});
