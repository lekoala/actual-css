import { expect, test } from "bun:test";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

function readCss(path) {
  return readFileSync(join(import.meta.dir, "..", path), "utf8");
}

/* Comment-free copy, for assertions about what a stylesheet must NOT contain.
   The prose in these files routinely names the selector or declaration that was
   removed, and why — a plain `not.toContain` over the raw source reads that
   explanation as the thing still being there. */
function readRules(path) {
  return readCss(path).replace(/\/\*[\s\S]*?\*\//g, "");
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
  expect(css).toMatch(/\.nav-list\s+\.nav-link\s*\{[^}]*inline-size:\s*100%/);
});

test("card picture bleed clips children", () => {
  const css = readCss("src/css/components/card.css");

  expect(css).toMatch(/\.card > picture\.bleed\s*\{[\s\S]*overflow:\s*hidden;/);
});

test("card owns bare flow and yields layout to composed primitives", () => {
  const css = readCss("src/css/components/card.css");

  // The box sits at zero specificity so a layout primitive on the same element
  // owns it: components/ loads after layout/, so a plain .card declaration
  // would beat .media on source order and flatten `class="card media"`.
  expect(css).toMatch(
    /:where\(\.card\)\s*\{\s*display:\s*flex;\s*flex-direction:\s*column;\s*gap:\s*var\(--card-gap\);\s*\}/,
  );
  expect(css).not.toMatch(/^\.card\s*\{[^}]*\bdisplay:/m);
  expect(css).toMatch(/:where\(\.card\) > \*\s*\{[^}]*margin-block:\s*0;/);
  expect(css).toMatch(/\.card > footer\s*\{[\s\S]*margin-block-start:\s*auto;/);
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

test("generic grid exposes an override and stays space-driven", () => {
  const css = readCss("src/css/layout/grid.css");

  expect(css.replace(/\s+/g, " ")).toContain(
    "grid-template-columns: var( --grid-columns, repeat(auto-fit, minmax(min(100%, var(--grid-min, 16rem)), 1fr)) );",
  );
  expect(css).toContain("--grid-min");
  expect(css).toContain("--grid-columns");
});

test("grid primitives remove the intrinsic child floor", () => {
  const css = readCss("src/css/layout/grid.css");

  expect(css.replace(/\s+/g, " ")).toContain(
    ":where(.grid, .grid-2, .grid-3, .grid-4, .grid-6) > * { min-inline-size: 0; }",
  );
});

test("density presets declare a count and collapse through divisors of it", () => {
  const css = readCss("src/css/layout/grid.css");
  // Anchored on the mechanism, not on a guard: @container is self-guarding,
  // so no @supports wraps these blocks.
  const ENHANCEMENT = "@container actual-container";

  /* Baseline: bounded auto-fill, so a preset is responsive and overflow-safe
     with no wrapper at all. auto-fit would stretch the items of a partial
     final page beyond the width their peers have on a full page. */
  const baseline = css.slice(css.indexOf(":where(.grid-2"), css.indexOf(ENHANCEMENT));
  expect(baseline).toContain("auto-fill");
  for (const [preset, count] of [
    ["grid-2", 2],
    ["grid-3", 3],
    ["grid-4", 4],
    ["grid-6", 6],
  ]) {
    expect(css).toContain(`.${preset} {\n  --grid-count: ${count};`);
  }

  /* --grid-min must not reach the presets. @container thresholds cannot
     resolve a custom property, so honoring the hook in the baseline alone
     would make it fall silent the moment a query container is added. */
  expect(baseline).not.toContain("--grid-min");

  /* Subdivision is an enhancement gated on container queries, and every step
     must land on a divisor of its preset — never 5 + 1, never 4 + 2. It keys
     off the named actual-container context so an incidental query container never
     changes a grid. */
  expect(css).toContain(ENHANCEMENT);
  expect(css).toContain("@container actual-container (min-width:");
  const enhancement = css.slice(css.indexOf(ENHANCEMENT));
  const steps = [
    ...enhancement.matchAll(/@container actual-container \(min-width: (\d+)rem\)([\s\S]*?)\n\}/g),
  ];
  expect(steps.length).toBeGreaterThan(0);
  const seen = [];
  for (const [, threshold, body] of steps) {
    for (const rule of body.matchAll(
      /:where\(([^)]*)\)\s*\{\s*grid-template-columns: repeat\((\d+),/g,
    )) {
      const columns = Number(rule[2]);
      for (const preset of rule[1].matchAll(/\.grid-(\d)/g)) {
        const count = Number(preset[1]);
        seen.push(`grid-${count}@${threshold}`);
        expect(`grid-${count} @${threshold}rem enters ${columns}: ${count % columns}`).toBe(
          `grid-${count} @${threshold}rem enters ${columns}: 0`,
        );
      }
    }
  }
  expect(seen.length).toBeGreaterThanOrEqual(6);
});

test("intrinsic composition primitives do not depend on an ancestor opt-in", () => {
  const clusterCss = readCss("src/css/layout/cluster.css");
  const switcherCss = readCss("src/css/layout/switcher.css");
  const sidebarCss = readCss("src/css/layout/sidebar-layout.css");

  expect(clusterCss).toMatch(/\.cluster\s*\{[\s\S]*display:\s*flex;[\s\S]*flex-direction:\s*row;/);
  expect(switcherCss).toMatch(
    /\.switcher\s*\{[\s\S]*display:\s*flex;[\s\S]*flex-direction:\s*row;[\s\S]*flex-wrap:\s*wrap;/,
  );
  expect(switcherCss).toMatch(
    /\.switcher > \*\s*\{[\s\S]*var\(--switcher-threshold, 40rem\)[\s\S]*flex-grow:\s*1;/,
  );
  expect(sidebarCss).toMatch(
    /\.sidebar-layout\s*\{[\s\S]*display:\s*flex;[\s\S]*flex-direction:\s*row;[\s\S]*flex-wrap:\s*wrap;/,
  );
  // Roles are positional: first is main, last is aside; .reverse (aside-first
  // in the DOM) swaps them so the aside keeps its width and main reclaims.
  expect(sidebarCss).toMatch(
    /\.sidebar-layout > :first-child\s*\{[\s\S]*flex-grow:\s*999;[\s\S]*min-inline-size: min\(100%, var\(--sidebar-content-min, 30rem\)\);/,
  );
  expect(sidebarCss).toMatch(
    /\.sidebar-layout > :last-child\s*\{[\s\S]*flex-basis: var\(--sidebar-layout-size, 18rem\);[\s\S]*min-inline-size: 0;/,
  );
  expect(sidebarCss).toMatch(
    /\.sidebar-layout\.reverse > :last-child\s*\{[\s\S]*flex-grow:\s*999;[\s\S]*min-inline-size: min\(100%, var\(--sidebar-content-min, 30rem\)\);/,
  );
  expect(sidebarCss).toMatch(
    /\.sidebar-layout\.reverse > :first-child\s*\{[\s\S]*flex-basis: var\(--sidebar-layout-size, 18rem\);[\s\S]*min-inline-size: 0;/,
  );
  expect(sidebarCss).not.toContain("order: 2");
  expect(sidebarCss).not.toContain(".container-query .sidebar-layout");

  const topbarCss = readCss("src/css/layout/topbar.css");
  expect(topbarCss).not.toContain(".switcher");
});

test("field-group owns its box, never the distance to its siblings", () => {
  const css = readCss("src/css/forms/form.css");

  expect(css).toContain(".field-group {");
  // A component cannot know whether its siblings are stacked or gridded, so
  // the gap between groups belongs to the composition (.stack on the form).
  expect(css).not.toContain(".field-group + .field-group");
});

test("form-actions exposes alignment hooks while sticky behavior remains intact", () => {
  const css = readCss("src/css/forms/form-actions.css");

  expect(css).toContain("align-items: var(--form-actions-align, center);");
  expect(css).toContain("justify-content: var(--form-actions-justify, flex-start);");
  expect(css).toContain(
    "margin-block-start: var(--form-actions-margin-block-start, var(--space-50));",
  );
  expect(css).toContain(".form-actions.sticky {");
  expect(css).toContain("position: sticky;");
});

test("stack resets block margins, cluster resets all margins", () => {
  const stackCss = readCss("src/css/layout/stack.css");
  const clusterCss = readCss("src/css/layout/cluster.css");

  expect(stackCss).toMatch(/\.stack > \* \{\s*margin-block: 0;\s*\}/);
  expect(clusterCss).toMatch(/\.cluster > \* \{\s*margin: 0;\s*\}/);
});

test("center keeps its content-box measure when it participates in flex or grid", () => {
  const css = readCss("src/css/layout/center.css");

  expect(css).toContain("box-sizing: content-box;");
  expect(css).toContain("inline-size: calc(100% - var(--center-pad, 1rem) * 2);");
  expect(css).toContain("max-inline-size: var(--center-size, 72rem);");
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

test("surface variant maps theme chrome and stays literal", () => {
  const variants = readCss("src/css/core/variants.css");
  const rule = variants.match(/\n\.surface \{([^}]*)\}/)?.[1] ?? "";

  expect(rule).toContain("--ui-bg: var(--surface);");
  expect(rule).toContain("--ui-fg: var(--intent, var(--text));");
  expect(rule).toContain("--ui-border: var(--border);");
  // The one variant that must read exactly as the theme's own surface: no
  // color-mix enhancement may be added for it, or it becomes a second .soft.
  expect(variants.match(/\.surface \{/g)).toHaveLength(1);
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

test("icon-only buttons stay square with icons larger than the text line", () => {
  const css = readCss("src/css/components/button.css");

  expect(css).toMatch(
    /\.btn\.icon-only\s*\{[\s\S]*?inline-size:\s*var\(--btn-min-size\);[\s\S]*?block-size:\s*var\(--btn-min-size\);[\s\S]*?padding:\s*0;/,
  );
});

test("joined icon-only buttons release their fixed block size", () => {
  const css = readCss("src/css/components/join.css");

  expect(css).toMatch(/\.join > \.btn\.icon-only\s*\{[^}]*block-size:\s*auto;/);
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
  expect(css).toContain("mask: var(--icon-check)");
  expect(css).not.toMatch(/content:\s*["'][✓−○●]["']/);
});

test("native flyout and tooltip popovers neutralize conflicting UA geometry", () => {
  const flyout = readCss("src/css/components/flyout.css");
  const tooltip = readCss("src/css/components/tooltip.css");

  expect(flyout).toMatch(
    /\.flyout\[popover\]\s*\{[^}]*position:\s*fixed;[^}]*inset:\s*auto;[^}]*margin:\s*0;/,
  );
  expect(flyout).toContain(":popover-open");
  expect(tooltip).toMatch(
    /\.tooltip\[popover\]\s*\{[^}]*inset:\s*auto;[^}]*margin:\s*0;[^}]*overflow:\s*visible;/,
  );
  expect(tooltip).toContain(":popover-open");
});

/*
 * State belongs to the primitive, not to a composition. `.step-complete` and
 * `aria-current="step"` mean the same thing in a row and in a column, so they
 * are written once against `.steps` and neither `.steps-horizontal` nor
 * `.steps-vertical` may restate them.
 */
test("steps keep complete and current distinct, and current wins when both apply", () => {
  const css = readCss("src/css/components/steps.css");

  // Equal specificity, so source order decides: current must come last.
  const complete = css.indexOf(".steps > .step-complete {");
  const current = css.indexOf('.steps > [aria-current="step"] {');
  expect(complete).toBeGreaterThan(-1);
  expect(current).toBeGreaterThan(complete);

  // Filled reads as "done", outlined as "you are here" — no glyph required.
  expect(css).toMatch(
    /\n\.steps > \.step-complete \{[^}]*--step-marker-bg: var\(--state-selected\);/,
  );
  expect(css).toMatch(
    /\n\.steps > \[aria-current="step"\] \{[^}]*--step-marker-bg: var\(--surface\);/,
  );

  // An accented connector means "already walked", so the segment leaving the
  // current step goes back to neutral.
  expect(css).toMatch(/\n\.steps > \[aria-current="step"\] \{[^}]*--step-line: var\(--border\);/);

  // Current wins on every channel, not only on color: the completion glyph is
  // excluded on it too.
  expect(css).not.toContain(".steps > .step-complete::before");
  expect(css).toContain('.steps > .step-complete:not([aria-current="step"])::before');
  expect(css).toContain('.steps > [aria-current="step"]::before');

  /* No state rule may be written against a composition: a marker that read
     differently in a sidebar than in a row would be two components. */
  const rules = readRules("src/css/components/steps.css");
  expect(rules).not.toMatch(/\.steps-(horizontal|vertical)[^{,]* > \.step-complete/);
  expect(rules).not.toMatch(/\.steps-(horizontal|vertical)[^{,]* > \[aria-current/);
});

test("tabs include vertical orientation styling without spending specificity on it", () => {
  const css = readCss("src/css/components/tab.css");
  const rules = readRules("src/css/components/tab.css");

  expect(css).toContain('.tabs:where([aria-orientation="vertical"])');
  expect(css).toContain("border-inline-end");

  /* Keeping aria-orientation out of the cascade is a repo-wide invariant, so
     check:architecture owns the negative assertion for every stylesheet.
     What is specific to this file is that the selected indicator still carries
     its own [aria-selected] weight, because it has to outrank the horizontal
     indicator rule. */
  expect(rules).toMatch(
    /\.tabs:where\(\[aria-orientation="vertical"\]\) \.tab\[aria-selected="true"\]::after/,
  );

  /* A vertical tab is attached along its inline end, so the horizontal
     focus-ring radius would round the wrong corners. */
  expect(css).toMatch(
    /\.tabs:where\(\[aria-orientation="vertical"\]\) \.tab:focus-visible \{[^}]*border-start-start-radius/,
  );
  expect(css).not.toContain("border-top-left-radius");
});

test("--modal-size is a fallback-only hook", () => {
  const css = readCss("src/css/components/modal.css");

  /* Declared on dialog.modal, the hook carries type+class specificity and a
     single author class cannot set it: the public width hook would silently
     keep its default. Fallback-only, as choice.css does for
     --choice-control-offset, so `.my-modal { --modal-size: 58rem }` and an
     inherited override both reach it. */
  expect(css).not.toMatch(/^\s*--modal-size:/m);
  expect(css).toMatch(/var\(\s*--modal-size,\s*32rem\s*\)/);
});

test("breadcrumb supports aria-current on the link or span", () => {
  const css = readCss("src/css/components/breadcrumb.css");

  expect(css).toContain(
    '.breadcrumb :where(li, a, span):where([aria-current]:not([aria-current="false"]))',
  );
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
  expect(css).toMatch(/\.prose > \*\s*\{\s*margin-block-end:\s*0;\s*\}/);
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

test("drawer RTL keeps the Degraded fallback and enhances inherited direction", () => {
  const css = readCss("src/css/components/drawer.css");

  expect(css).toContain('[dir="rtl"] dialog.drawer {');
  expect(css).toContain('[dir="rtl"] dialog.drawer[data-side="end"] {');
  expect(css).toContain("@supports selector(:dir(rtl))");
  expect(css).toContain("dialog.drawer:dir(ltr) {");
  expect(css).toContain('dialog.drawer[data-side="end"]:dir(rtl) {');
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
  expect(css).toContain("border-inline-start: var(--alert-border-inline-start-width, 4px) solid");
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
  expect(tokensCss).toMatch(
    /@supports \(color: color-mix\(in oklch, red, white\)\)\s*\{\s*:root,\s*\n\s*\[data-theme\]\s*\{[\s\S]*--shadow:/,
  );

  // Forced-colors state remap (see CONTRIBUTING.md "Forced colors invariant"):
  // the only state tokens overridden in forced colors are the disabled pair.
  expect(tokensCss).toMatch(
    /@media \(forced-colors: active\)\s*\{\s*:root,\s*\n\s*\[data-theme\]\s*\{[\s\S]*--state-disabled: GrayText;[\s\S]*--disabled-opacity: 1;/,
  );
  // Selected/current colors are NOT remapped to Highlight/HighlightText — they
  // resolve to their theme value and are forced by the UA. Guard against the
  // old repaint-theme regression.
  expect(tokensCss).not.toMatch(
    /@media \(forced-colors: active\)[\s\S]*--state-selected:\s*Highlight/,
  );
  expect(themeCss).toMatch(
    /@media \(prefers-contrast: more\)\s*\{\s*:root,[\s\S]*\[data-theme\]\[data-theme\]\s*\{[\s\S]*--text-muted:/,
  );
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

test("inline choices are sized by typography, not by field density", () => {
  const tokensCss = readCss("src/css/core/tokens.css");
  const choiceCss = readCss("src/css/forms/choice.css");
  const switchCss = readCss("src/css/forms/switch.css");

  expect(tokensCss).toMatch(/--choice-control-size:\s*[\d.]+em;/);
  expect(choiceCss).toContain("inline-size: var(--choice-control-size);");
  expect(choiceCss).toContain("block-size: var(--choice-control-size);");
  expect(switchCss).toMatch(/--switch-block-size:\s*calc\(var\(--choice-control-size\)/);

  // Density must not reach an inline choice: it would resize the control but
  // not its label, which is exactly what the alignment depends on.
  expect(switchCss).not.toContain("var(--control-size)");
  expect(choiceCss).not.toContain("var(--control-size)");
});

test("every inline choice derives its first-line offset from its own height", () => {
  const css = readCss("src/css/forms/choice.css");

  // A per-control constant cannot keep an 18px checkbox and a 20px switch on
  // the same optical line once the line-height or the control size changes,
  // so both run the same 1lh formula over their own block size.
  expect(css).toContain("calc((1lh - var(--choice-control-size)) / 2 + 0.0625em)");
  expect(css).toContain("calc((1lh - var(--switch-block-size)) / 2 + 0.0625em)");

  // Fallback-only, so an override anywhere up the tree still reaches the
  // control instead of losing to a declaration on .choice itself.
  expect(css).not.toMatch(/^\s*--choice-control-offset:/m);
  expect(css).toMatch(/margin-block-start:\s*var\(\s*--choice-control-offset,/);
});

test("the switch knob is concentric inside its track", () => {
  const css = readCss("src/css/forms/switch.css");

  // --switch-block-size is a border-box height, so the knob has to clear the
  // borders as well as the inset; deriving from the outer height alone leaves
  // it --border-width closer to the rails than to the ends.
  expect(css).toMatch(
    /--switch-knob-size:\s*calc\([\s\S]*?var\(--border-width\)[\s\S]*?var\(--switch-knob-margin\)/,
  );
});

test("optional OTP keeps one native input and covers validation states", () => {
  const css = readCss("src/css/forms/otp.css");

  expect(css).toContain(".otp > input");
  expect(css).toMatch(/\.otp\s*\{[\s\S]*inline-size:\s*fit-content;/);
  expect(css).toMatch(/\.otp\s*\{[\s\S]*border-radius:\s*var\(--radius\);/);
  expect(css).toContain("overflow: clip;");
  expect(css).not.toContain("overflow: hidden;");
  // Focus is carried by the cell edge, never by a ring around the whole group.
  expect(css).not.toContain(".otp:focus-within");
  expect(css).not.toContain(".otp:has(");
  expect(css).not.toContain("--focus-ring-shadow");
  // The input must be the first direct child: state rules select the cells as
  // following siblings, so this contract is asserted on the source text.
  expect(css).toContain(".otp > input:focus ~ span");
  expect(css).toMatch(
    /\.otp > input:focus ~ span[\s\S]*?--otp-cell-border-width:\s*calc\(var\(--border-width\) \* 2\);/,
  );
  expect(css).toMatch(
    /\.otp > span\s*\{[\s\S]*?border:\s*var\(--otp-cell-border-width, var\(--border-width\)\) solid/,
  );
  expect(css).toContain("inline-size: calc(100% + var(--otp-caret-space));");
  expect(css).toContain("padding-inline: calc((var(--otp-cell-size) - 1ch) / 2) 0;");
  expect(css).toContain('input[aria-invalid="true"] ~ span');
  expect(css).toContain(".needs-validation.was-validated .otp > input:invalid ~ span");
  expect(css).toContain("input:user-invalid ~ span");
  expect(css).toContain("input:disabled ~ span");
  // Disabled cells must be visibly distinct — muted gray border over a subtle
  // background at --disabled-opacity, not just the cursor.
  expect(css).toMatch(/input:disabled ~ span[\s\S]*?--otp-cell-border: var\(--state-disabled\);/);
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
  // Forced-colors: the transparent border baseline becomes a visible boundary
  // without a repaint block (CONTRIBUTING.md "Forced colors invariant").
  expect(css).toContain("border: var(--border-width) solid transparent;");
  expect(css).not.toContain("@media (forced-colors: active)");
});

test("optional FAB preserves DOM order and stays out of print", () => {
  const css = readCss("src/css/components/fab.css");

  expect(css).toContain("flex-direction: column;");
  expect(css).not.toContain("column-reverse");
  expect(css).toContain(".fab[open] > .fab-actions");
  // Plus/close toggle markers: the framework owns both speed dial glyphs.
  expect(css).toContain(".fab > summary::before");
  expect(css).toContain(".fab[open] > summary::after");
  expect(css).toContain("mask: var(--icon-plus) center / contain no-repeat;");
  expect(css).toContain("mask: var(--icon-close) center / contain no-repeat;");
  // The old contract is gone: no rotated app icon and no :only-child magic.
  expect(css).not.toContain("rotate(45deg)");
  expect(css).not.toContain('[aria-hidden="true"]:only-child');
  expect(css).toMatch(/\.fab-action\s*\{[\s\S]*inline-size:\s*max-content;/);
  expect(css).toMatch(/\.fab-label\s*\{[\s\S]*box-shadow:\s*var\(--shadow\);/);
  expect(css).toContain("@media print");
});

test("app navigation stays semantic and app-layout owns its adaptive geometry", () => {
  const navCss = readCss("src/css/components/app-nav.css");
  const layoutCss = readCss("src/css/layout/app-layout.css");

  expect(navCss).toContain('.app-nav > a:where([aria-current]:not([aria-current="false"]))');
  expect(navCss).toContain("env(safe-area-inset-bottom)");
  expect(navCss).toContain("min-block-size: var(--control-size-lg);");
  expect(navCss).toMatch(
    /> a > :where\(svg, img, \[aria-hidden="true"\]\)\s*\{[\s\S]*font-size: 1\.5rem;[\s\S]*line-height: 1;/,
  );
  // Selected state is carried by font-weight — a structural distinction that
  // survives forced colors without a repaint block (CONTRIBUTING.md).
  expect(navCss).toMatch(/\[aria-current\][^{]*\{[\s\S]*font-weight: var\(--font-weight-bold\);/);
  expect(navCss).not.toContain("@media (forced-colors: active)");
  expect(navCss).not.toContain(".active");
  expect(navCss).not.toContain("@media (min-width:");

  expect(layoutCss).toContain('"topbar" auto');
  expect(layoutCss).toContain('"nav topbar" auto');
  expect(layoutCss).toContain(".app-layout > .app-nav");
  expect(layoutCss).toContain(".app-layout > .app-nav > a");
  expect(layoutCss).toContain(".app-layout > .app-main");
  expect(layoutCss).toContain("block-size: var(--viewport-block);");
  expect(layoutCss).toContain(
    "padding-block-start: calc(var(--space-30) + env(safe-area-inset-top));",
  );
  expect(layoutCss).toContain("--app-nav-side-size: 12rem;");
  expect(layoutCss).toMatch(
    /\.app-layout > \.fab\s*\{[\s\S]*position: relative;[\s\S]*grid-area: main;[\s\S]*place-self: end;[\s\S]*inset: auto;[\s\S]*margin: var\(--fab-offset\);/,
  );
  expect(layoutCss).toMatch(
    /@media \(min-width: 48rem\)[\s\S]*\.app-layout > \.fab\s*\{[\s\S]*margin-block-end: max\(var\(--fab-offset\), env\(safe-area-inset-bottom\)\);/,
  );
  expect(layoutCss).toContain("grid-template-columns: 1.5rem minmax(0, 1fr);");
  expect(layoutCss).toContain("align-items: center;");
  expect(layoutCss).toMatch(
    /@media \(min-width: 48rem\)[\s\S]*?\.app-layout > \.app-nav\s*\{[\s\S]*?gap: var\(--space-20\);[\s\S]*?padding-inline: var\(--space-20\);/,
  );
});

test("application lists provide optional regions without owning their controls", () => {
  const css = readCss("src/css/components/list.css");
  const rules = readRules("src/css/components/list.css");

  /* The row is flex, not a three-track grid. A fixed template hands an absent
     region a track and a gap anyway: a row with no leading region put its
     content in the leading track and gave the flexible one to the trailing
     control, which inverts the documented "optional leading and trailing"
     contract. tests/browser/list-item.test.js measures the four shapes. */
  expect(rules).not.toContain("grid-template-columns");
  expect(css).toMatch(/\.list > li > \.list-item \{[^}]*display: flex;/);
  expect(css).toMatch(/\.list-item-content \{[^}]*flex: 1 1 0;/);
  expect(css).toMatch(/\.list-item-trailing \{[^}]*margin-inline-start: auto;/);
  expect(rules).not.toContain("justify-self");
  expect(css).toContain("align-items: start;");
  expect(css).toContain("min-block-size: var(--list-item-min-size);");
  expect(css).toContain("border-block-start: var(--list-divider);");
  expect(css).not.toContain("border-block: var(--list-divider);");
  expect(css).toContain(".list-item-content");
  expect(css).toContain("min-inline-size: 0;");
  expect(css).toContain("a.list-item");
  // The divider is a real border, so it stays visible in forced colors without
  // a repaint block (CONTRIBUTING.md "Forced colors invariant").
  expect(css).not.toContain("@media (forced-colors: active)");
  expect(css).not.toContain("two-line");
  expect(css).not.toContain("three-line");
});

test("indicator exposes only logical four-corner positioning", () => {
  const css = readCss("src/css/components/indicator.css");

  expect(css).toContain(".indicator-item.start");
  expect(css).toContain(".indicator-item.bottom");
  expect(css).toContain(".indicator-item:dir(rtl)");
  expect(css).not.toMatch(
    /\.indicator-item\s*\{[^}]*?(?:background|box-shadow|inline-size|block-size):/s,
  );
});

test("steps derive markers from list order and keep state semantic", () => {
  const css = readCss("src/css/components/steps.css");

  expect(css).toContain("counter-increment: actual-step;");
  expect(css).toContain("content: counter(actual-step);");
  expect(css).toContain('[aria-current="step"]');
  // Intrinsic responsiveness: items fill then scroll, never squish below
  // --step-min. Both live on the horizontal composition, the only one with a
  // width budget to spend.
  expect(css).toMatch(/\n\.steps-horizontal > li \{[^}]*flex: 1 0 var\(--step-min\);/);
  expect(css).toMatch(
    /\n\.steps-horizontal > li \{[^}]*min-inline-size: max\(var\(--step-size\), var\(--step-min\)\);/,
  );
  expect(css).toMatch(/\n\.steps-horizontal \{[^}]*overflow-x: auto;/);
  /* Both axes are stated. `overflow-x: auto` alone computes the block axis to
     `auto` as well, and a row hugs fractional content with no slack, so a
     rounding difference raises a phantom vertical scrollbar. Clipping then
     happens at the padding edge, which is why a navigable row — and only a
     navigable row — reserves the focus ring's own width and offset. */
  expect(css).toMatch(/\n\.steps-horizontal \{[^}]*overflow-y: hidden;/);
  expect(css).toMatch(
    /\n\.steps-horizontal:has\(a\[href\]\) \{[^}]*padding-block: calc\(var\(--focus-outline-offset\) \+ var\(--border-width\) \* 2\);/,
  );

  /* The primitive's own rule carries no orientation. Any of these would put a
     layout decision on the class both compositions share — which is exactly
     what made `.steps` mean two things before, and what forced every horizontal
     rule to carry `:not(.steps-vertical)`. */
  const primitive = css.match(/\n\.steps \{([^}]*)\}/)[1];
  for (const orientation of [
    "flex-direction",
    "overflow",
    "inline-size",
    "grid-template",
    "text-align",
    "--step-min",
    "--step-gap",
    "--step-vertical-gap",
  ]) {
    expect(`${orientation} :: ${primitive.includes(orientation)}`).toBe(`${orientation} :: false`);
  }

  /* A step label may be an `a[href]`, and that is the whole interactive
     surface. A generic `:is(a[href], button, [tabindex])` would be selector
     weight spent on markup the component does not describe: no fixture, demo
     or documented example puts a `<button>` or a `tabindex` in a step. */
  const rules = readRules("src/css/components/steps.css");
  expect(rules).not.toContain("button");
  expect(rules).not.toContain("[tabindex]");

  /* No forced-colors branch. Painting a complete marker
     `Highlight`/`HighlightText` renders its own number or check unreadable, in
     the exact mode the branch would exist to help. Complete and upcoming do
     read alike in a numbered flow there, and `--step-complete-mark` is the
     honest answer — documented as such rather than patched around here. */
  expect(rules).not.toContain("forced-colors");
  expect(css).toContain("overscroll-behavior-inline: contain;");
  expect(css).toContain("content: var(--step-complete-mark, counter(actual-step));");
  // The connector is a whole background so a theme can drop in a gradient, an
  // image or nothing, and the line colour rides inside it as a gradient of the
  // step's own --step-line. A custom property resolves its var() before
  // inheritance, so a default --step-connector on .steps would freeze the
  // parent's colour and a .step-complete connector would never follow its state.
  expect(css).toMatch(
    /background: var\(\s*--step-connector,\s*linear-gradient\(var\(--step-line\), var\(--step-line\)\)/,
  );
  expect(css).not.toMatch(/\n\.steps \{[^}]*--step-connector:/);
});

/*
 * Orientation and labels are independent dimensions, so the whole responsive
 * contract is one container query plus one `:empty` rule per orientation.
 *
 * `>= 60rem` moves a labelled row's marker beside its label. Calibrated on
 * five steps, the widest supported row and therefore the binding case, and
 * pulling it down was measured and rejected — at 48rem that row does render
 * inline, with the connector collapsed to a 15px stub where the representation
 * promises the region a themed chevron lives in. Literal rem, because
 * `@container` cannot read a custom property: overriding `--step-min` moves the
 * scroll budget but not this threshold.
 *
 * `> li:empty` is not responsive at all, and that is the point: an empty step
 * is compact wherever it is put, with no size context, no variant class and
 * nothing hidden. `:empty` rather than `:has()` for two reasons — it says what
 * the markup says, the way `.badge:empty` already does, and it predates
 * `:has()` by a decade, so the compact shape survives the Degraded tier while
 * only the inline bonus depends on a modern selector.
 *
 * The assertions below are mostly negative, and they guard one rule: the
 * component never removes authored content to make a layout fit. The cheap
 * version of that — a narrow query hiding a four- or five-step row's labels,
 * `:has(> :nth-child(4))` to find the count, `:not(:has(a[href]))` so the
 * hiding does not clip a focus target to 1x1 — is a shape to keep out, not a
 * shape to tune.
 */
test("steps sizing follows content, and never hides a label", () => {
  const css = readCss("src/css/components/steps.css");
  /* The formatter wraps long selectors inside :has() and :is(), so match
     against a whitespace-normalised copy rather than the source lines. */
  const flatten = (s) =>
    s.replace(/\s+/g, " ").replace(/\( /g, "(").replace(/ \)/g, ")").replace(/, /g, ",");

  const queries = [...css.matchAll(/@container actual-container \(([^)]*)\)/g)].map((m) => m[1]);
  expect(queries).toEqual(["inline-size >= 60rem"]);

  const block = flatten(
    css.slice(css.indexOf("@container actual-container")).match(/\{([\s\S]*?)\n\}/)[1],
  );

  /* Every rule keyed on the row and gated on a label, spelled the same way
     three times. Pinned as text because the formatter owns where these wrap,
     and a break landing outside the parens would turn a compound boundary into
     a descendant combinator — a `.steps-horizontal` inside a
     `.steps-horizontal`, which matches nothing and fails silently. Keying one
     on the shared `.steps` instead would reach a column that never asked to be
     measured. */
  expect([...block.matchAll(/(\.steps[^{}]*)\{/g)].map(([, sel]) => sel.trim())).toEqual([
    ".steps-horizontal:has(.step-label) > li",
    ".steps-horizontal:has(.step-label) > li::after",
    ".steps-horizontal:has(.step-label) > li:last-child",
  ]);

  /* It counts nothing and reads no state. One threshold serves 2 to 5, and a
     6+ row is out of contract rather than owed a curated fallback — selector
     weight on every supported row to be polite to one that is already wrong is
     the trade this component declines. */
  expect(block).not.toContain(":nth-child");
  expect(block).not.toContain("aria-current");

  // The inline connector is the only one a theme can repaint separately, and
  // it still falls back to --step-connector before the default line.
  expect(block).toContain("background: var(--step-inline-connector,var(--step-connector,");

  /* The compact form, asked of the item's own content, and small in both
     orientations: a marker's width instead of a reading width, aligned to the
     start of its share so the track runs edge to edge, and a final step with
     no share to fill. Pinned declaration by declaration — an `:empty` rule
     that grows means a base rule has started describing a labelled step
     rather than a step. */
  expect(css).toMatch(
    /\n\.steps-horizontal > li:empty \{\n {2}flex: 1 1 0;\n {2}justify-items: start;\n {2}min-inline-size: var\(--step-size\);\n\}/,
  );
  expect(css).toMatch(
    /\n\.steps-horizontal > li:empty::after \{\n {2}inset-inline-start: var\(--step-size\);\n\}/,
  );
  expect(css).toMatch(/\n\.steps-horizontal > li:empty:last-child \{\n {2}flex: 0 0 auto;\n\}/);
  expect(css).toMatch(
    /\n\.steps-vertical > li:empty \{\n {2}grid-template-columns: var\(--step-size\);\n\}/,
  );
  /* Never `:has()`: that puts the compact form above the Degraded tier, and
     per item it hands bare text a marker floor while its wrapped peers keep
     `--step-min`. Read from the comment-free copy — the prose right above
     those rules names both spellings in order to reject them. */
  expect(readRules("src/css/components/steps.css")).not.toMatch(/> li:not\(:has|> li:has/);

  /* Why the row's rule is that small: its template declares the marker's row
     only, so a label creates the second one implicitly and an empty step gets
     neither an empty track nor the gap that comes with it. The column cannot
     do the same — `grid-auto-flow` is `row`, so an auto-placed label lands
     under its marker — so its second track is explicit and its `:empty` rule
     takes that one back. */
  expect(css).toMatch(/\n\.steps-horizontal > li \{[^}]*grid-template-rows: var\(--step-size\);\n/);
  expect(css).toMatch(
    /\n\.steps-vertical > li \{[^}]*grid-template-columns: var\(--step-size\) minmax\(0, 1fr\);/,
  );

  /* Nothing in the file hides a label, in any representation: no `.sr-only`
     clone, and no variant class asking an author to write content only to have
     it removed again. */
  expect(css).not.toContain("clip-path");
  expect(css).not.toContain("steps-markers");

  /* The one `a[href]` left is the focus-ring reservation, which exists because
     the row clips at its padding edge — not a guard deciding whether hiding a
     label is allowed. */
  expect([...css.matchAll(/^\.steps[^{}\n]*a\[href\][^{}\n]*\{/gm)].map(([sel]) => sel)).toEqual([
    ".steps-horizontal:has(a[href]) {",
  ]);
});

/*
 * The two orientations are peers on a shared primitive, not a base and a
 * variant: `<ol class="steps steps-horizontal">` and
 * `<ol class="steps steps-vertical">`. Neither is the default, so neither has
 * to be excluded from the other and neither inherits layout it must undo.
 *
 * The payoff is measurable in what is absent. The column resets no overflow, no
 * overscroll-behavior, no flex basis, no grid-template-rows, no min-inline-size
 * and no text-align — six declarations that existed only while `.steps` meant
 * "the component" and "horizontal" at once. The row, in turn, carries no
 * `:not(.steps-vertical)`.
 */
test("steps keep the two orientations as peers on a shared primitive", () => {
  const css = readCss("src/css/components/steps.css");
  const rules = readRules("src/css/components/steps.css");

  // Not `.vertical`: the orientation is part of the component's own namespace.
  expect(css).not.toContain(".steps.vertical");
  expect(css).toContain("\n.steps-vertical {");
  expect(css).toContain("\n.steps-horizontal {");

  /* Both compositions are opt-in and neither excludes the other.
     `.steps.steps-vertical` would be the old variant spelling — the primitive
     doubling as the horizontal default — and `:not(.steps-vertical)` is the
     guard that spelling forced onto every horizontal rule. */
  expect(rules).not.toContain(".steps.steps-vertical");
  expect(rules).not.toContain(":not(.steps-vertical)");
  expect(rules).not.toContain(":not(.steps-horizontal)");
  expect(rules).not.toContain(":is(.steps,");

  expect(css).toMatch(/\n\.steps-vertical \{[^}]*flex-direction: column;/);

  /* Nothing here undoes the row, because the row never applied. The column is
     not a scroll container, so it has no overflow to restore; its items are not
     row items, so they have no flex or min-inline-size to unset. Each of these
     was a declaration in the variant version. */
  const vertical = css.slice(css.indexOf("\n.steps-vertical {"));
  for (const undo of [
    "overflow: visible",
    "overscroll-behavior: auto",
    "flex: none",
    "grid-template-rows: auto",
    "min-inline-size: 0",
    "text-align: start",
  ]) {
    expect(`${undo} :: ${vertical.includes(undo)}`).toBe(`${undo} :: false`);
  }

  // Marker column then label, with the connector running down the track.
  expect(css).toMatch(
    /\n\.steps-vertical > li \{[^}]*grid-template-columns: var\(--step-size\) minmax\(0, 1fr\);/,
  );
  expect(css).toMatch(
    /\n\.steps-vertical > li::after \{[\s\S]*?inline-size: var\(--step-line-size\);/,
  );

  /* `justify-items` is the one declaration that survived the audit rather than
     the copy: grid items blockify, so without it an `a.step-label` stretches
     across the whole 1fr track — measured at 264px against 75px — giving a
     vertical link a full-width focus ring where the row gives the same link a
     box that hugs its text. */
  expect(css).toMatch(/\n\.steps-vertical > li \{[^}]*justify-items: start;/);

  /* No --step-vertical-connector hook. The horizontal --step-connector cannot
     transpose onto this geometry, but nothing has asked for a vertical one and
     .steps-vertical > li::after is a perfectly reachable override — API a real
     design has not requested is API not worth publishing. The track still
     follows each step's own --step-line. */
  expect(css).not.toMatch(/var\(--step-vertical-connector|--step-vertical-connector:/);
  expect(css).toMatch(
    /\n\.steps-vertical > li::after \{[\s\S]*?linear-gradient\(var\(--step-line\), var\(--step-line\)\)/,
  );

  /* The connector's geometry is per composition, so the primitive may not set
     `content` on `> li::after` and then take it back on `:last-child`: that
     pits two rules against each other and makes the outcome a specificity
     question. The primitive states the condition instead, and a pseudo-element
     with no content generates no box, so neither composition can trail a line
     past the final step however it writes its geometry. */
  expect(css).toContain(".steps > li:not(:last-child)::after");
  expect(rules).not.toContain("content: none");
  expect(rules).not.toMatch(/\n\.steps-(horizontal|vertical) > li::after \{[^}]*content:/);
});

/*
 * The label is the quiet half of the anatomy: the marker carries the state, so
 * the text sits a notch below it and only the current step earns extra weight.
 *
 * The size in particular belongs to the component and not to a representation.
 * Scoped inside a container block it would resize the text as the reader
 * dragged a window, on top of the layout move the threshold already makes —
 * and it would have to be repeated once per supported step count.
 */
test("steps keep the label a notch below the marker, at one size throughout", () => {
  const css = readCss("src/css/components/steps.css");
  const enhancement = css.indexOf("@container actual-container");

  const label = css.match(/\n\.steps \.step-label \{([^}]*)\}/);
  expect(label).not.toBeNull();
  expect(label[1]).toContain("font-size: var(--font-size-sm);");
  expect(label[1]).toContain("line-height: var(--line-height-tight);");
  // Declared on the component, above the container blocks, so no threshold can
  // change it — and no representation may set a font-size of its own.
  expect(css.indexOf(label[0])).toBeLessThan(enhancement);
  expect(css.slice(enhancement)).not.toContain("font-size:");

  // Weight marks "where I am now" only. A completed step leans on its filled
  // disc; giving it bold text too would flatten the two states back together.
  expect(css).toMatch(
    /> \[aria-current="step"\] \.step-label \{[^}]*font-weight: var\(--font-weight-strong\);/,
  );
  expect(css).not.toMatch(/> \.step-complete[^{]*\.step-label \{[^}]*font-weight/);

  /* Combinators say what they mean. `> li` and `> [aria-current="step"]` are
     the sequence's own items, so a nested list is not swept in; the label
     inside one is then reached as a plain descendant, because the framework
     owns that structure and restating it protects nothing. No `.step-label`
     rule may re-state `> li >` to reach a property that does not need it. */
  expect(css).not.toMatch(/> li > \.step-label \{[^}]*(font-|position|color)/);

  /* --link is a theme hook, so a navigable label must not inherit a link colour
     that would read ahead of the marker states. The underline is untouched:
     that is what still signals the link. `color: inherit` rides in the label
     rule rather than in a separate `a.step-label` one — a span inherits its ink
     anyway, so the extra rule only ever served the link. */
  expect(label[1]).toContain("color: inherit;");
  expect(readRules("src/css/components/steps.css")).not.toContain("a.step-label");
  expect(label[1]).not.toContain("text-decoration");

  /* And it stays scoped, unlike `.menu-item-text` and the other sub-part
     classes in this framework. A bare `.step-label` weighs (0,1,0) — exactly
     `.prose :where(a)` — so a stepper inside prose would be decided by the
     order the bundle happens to concatenate two files in. */
  expect(css).not.toMatch(/\n\.step-label \{/);

  /* Vertical puts the label beside a taller marker: centre a single line on it,
     and let a wrapped one fall back to the row's start alignment. This is the
     one label rule that keeps `> li >` — `align-self` is a grid-item property,
     so the declaration is meaningless on anything but a direct child. */
  expect(css).toMatch(/\n\.steps-vertical > li > \.step-label \{[^}]*align-self: center;/);
});

test("rating keeps radio order and cumulative fill progressive", () => {
  const css = readCss("src/css/components/rating.css");

  expect(css).toContain('.rating > input[type="radio"]');
  expect(css).toContain("@supports selector(:has(*))");
  expect(css).toContain(':has(~ input[type="radio"]:checked)');
  expect(css).toContain(':hover ~ input[type="radio"]');
  expect(css).toMatch(/\.rating\s*\{[^}]*?gap:\s*0;/s);
  expect(css).toContain("inline-size: calc(var(--rating-size) + var(--rating-gap));");
  expect(css).toContain("mask: var(--rating-star) center / var(--rating-size)");
  expect(css).toContain("background: var(--rating-empty);");
  expect(css).toContain("background: var(--rating-color);");
  expect(css).not.toContain("opacity: 0.25");
  expect(css).not.toContain("clip-path");
  expect(css).not.toContain("row-reverse");
  expect(css).toContain("@media (forced-colors: active)");
  expect(css).toMatch(/@media \(forced-colors: active\)[\s\S]*?appearance:\s*auto;/);
});

test("controls never zero the outline in their base style", () => {
  const css = readCss("src/css/forms/control.css").replace(/\/\*[\s\S]*?\*\//g, "");

  expect(css).toContain(".input:focus-visible");
  expect(css).toContain("outline: 2px solid transparent;");
  expect(css).not.toMatch(/outline\s*:\s*(none|0)\b/);
});

/*
 * .column-layout is three zero-specificity tiers, so only source order
 * separates them. Both possible reorderings fail silently in a browser — the
 * canvas still renders, it just renders the wrong composition — so the order
 * is asserted here on the source text, and the geometry it produces is
 * asserted in tests/browser/column-layout.test.js.
 */
test("column-layout keeps its placement tiers in cascade order", () => {
  const css = readCss("src/css/layout/column-layout.css").replace(/\/\*[\s\S]*?\*\//g, "");

  const reset = css.indexOf(":where(.column-layout) > *");
  const firstStart = css.indexOf(":where(.column-start-1)");
  const firstSpan = css.indexOf(":where(.column-span-1)");
  const lastStart = css.indexOf(":where(.column-start-12)");
  const lastSpan = css.indexOf(":where(.column-span-12)");

  expect(reset).toBeGreaterThan(-1);
  /* tier 1 < tier 2 < tier 3, with no interleaving of the two ladders. */
  expect(reset).toBeLessThan(firstStart);
  expect(lastStart).toBeLessThan(firstSpan);
  expect(firstSpan).toBeLessThan(lastSpan);
});

test("column-layout keeps auto-placement available to its children", () => {
  const css = readCss("src/css/layout/column-layout.css").replace(/\/\*[\s\S]*?\*\//g, "");

  /* The child reset must span, never name a start line: `grid-column: 1 / -1`
     gives every child a definite column position and disables auto-placement,
     so `.column-span-8` beside `.column-span-4` would stack. */
  expect(css).toMatch(/:where\(\.column-layout\) > \*\s*\{[^}]*grid-column-end:\s*span 12;/);
  expect(css).not.toMatch(/:where\(\.column-layout\) > \*\s*\{[^}]*grid-column:\s*1 \/ -1;/);

  /* A start with no span must stop at the canvas edge rather than inheriting
     the reset's `span 12` and adding nine implicit columns. */
  expect(css).toContain("grid-column: 9 / -1;");
  expect(css).not.toMatch(/grid-column-start:\s*9;/);

  /* Twelve tracks, fixed, with no min-content floor. */
  expect(css).toContain("grid-template-columns: repeat(12, minmax(0, 1fr));");
  expect(css).not.toContain("--column-count");
});

test("motion tokens: presence pair exists, no generic easing leaks, exceptions hold", () => {
  const tokensCss = readCss("src/css/core/tokens.css");
  const cssRoot = join(import.meta.dir, "..", "src", "css");

  const cssFiles = new Map();
  const walk = (dir) => {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) walk(full);
      else if (/\.css$/.test(entry)) cssFiles.set(entry, readFileSync(full, "utf8"));
    }
  };
  walk(cssRoot);

  const source = [...cssFiles.values()].join("\n").replace(/\/\*[\s\S]*?\*\//g, "");

  /* Generic `--ease` stays gone: state/interaction motion uses the CSS
     default `ease`, shake and View Transitions included. The presence pair
     `--ease-enter` / `--ease-exit` is the dedicated vocabulary; the exact
     patterns below never match those prefixed names. */
  expect(tokensCss).not.toMatch(/--ease\s*:/);
  expect(source).not.toMatch(/var\(--ease\)/);
  expect(tokensCss).toContain("--ease-enter: cubic-bezier(0.2, 0, 0, 1);");
  expect(tokensCss).toContain("--ease-exit: cubic-bezier(0.4, 0, 1, 1);");

  /* Presence semantics spread only where open and closed states own separate
     transition declarations (status-bar, modal, drawer). */
  for (const file of ["status-bar.css", "modal.css", "drawer.css"]) {
    expect(cssFiles.get(file)).toContain("var(--ease-enter)");
    expect(cssFiles.get(file)).toContain("var(--ease-exit)");
  }

  /* Shared-single-transition toggles and backdrops stay on neutral `ease`;
     their exclusion is documented in tokens.md, not an oversight. */
  for (const file of ["tooltip.css", "flyout.css", "surface.css"]) {
    expect(cssFiles.get(file)).not.toMatch(/var\(--ease-(enter|exit)\)/);
  }
});

/*
 * The z-index scale is a public token table, and the docs are the only place
 * that says what each layer orders. Nothing else fails when a token is added
 * or removed: --z-tooltip could be deleted from tokens.css and the table would
 * keep advertising it, which is exactly how it would have outlived the
 * tooltip's move to the top layer.
 *
 * Scoped to --z-* on purpose. Synchronising every custom property with its
 * documentation would turn the token docs into generated output; this is one
 * small closed set whose whole point is to be read as an ordering, so a stale
 * row is a wrong ordering rather than a stale description.
 */
test("the documented z-index scale matches the tokens", () => {
  const declared = new Map(
    [...readCss("src/css/core/tokens.css").matchAll(/^\s*(--z-[\w-]+):\s*([^;]+);/gm)].map(
      ([, name, value]) => [name, value.trim()],
    ),
  );
  const documented = new Map(
    [
      ...readCss("docs/pages/foundations/tokens.md").matchAll(
        /^\|\s*`(--z-[\w-]+)`\s*\|\s*([^|]+?)\s*\|/gm,
      ),
    ].map(([, name, value]) => [name, value]),
  );

  expect(declared.size).toBeGreaterThan(0);
  expect([...documented.keys()].sort()).toEqual([...declared.keys()].sort());
  for (const [name, value] of declared) {
    expect(documented.get(name)).toBe(value);
  }
});
