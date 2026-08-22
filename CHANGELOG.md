# Actual CSS 0.4.0 — Changelog

# 0.4.0 — unreleased

### Added

* Modular CSS architecture with `core`, `layout`, `typography`, `forms`, `components`, `effects`, and `utilities` families, with family and individual-module imports.
* `actual-css/full` / `actual.full.*` bundles for the complete CSS and JS framework.
* `.column-layout` with `column-span-1…12` and `column-start-1…12` for explicit opt-in 12-column composition.
* Intrinsic `.switcher` and `.sidebar-layout` layout recipes, plus explicit layout-selection guidance.
* `.scroll-target` with `--scroll-target-offset` for hash links and `scrollIntoView()` below sticky UI.
* Dedicated `typography/lead.css` and `layout/measure.css`; `.measure` exposes `--measure`.
* Generated and published `reserved-classes.json` for the framework-owned class namespace.
* Native `accent-color` theming for unstyled platform controls, recomputed across `[data-theme]` islands.
* “Building with Actual CSS” integration guide covering theme tokens, layout selection, hooks, utilities, and application CSS.
* Expanded build, architecture, compatibility, browser-layout, package, and generated-output guardrails, including real `npm pack` verification.
* `brutalist` theme.
* `--soft-fg-mix` tunes soft foreground ink; at its `100%` default soft text stays the raw intent, and lowering it rebates the ink toward `--text` for palettes whose intents are too light or too saturated to carry text on their own soft surface.
* Optional `--link` overrides `.prose` link ink when a theme's `--primary` works as an accent but not as inline body text.
* `check:color-space` guardrail: an intent tinted against a theme-controlled surface or border must interpolate in `oklab`, with an `intentional-oklch` escape hatch.
* Bundle tool.

### Changed

* The bare `actual-css` entrypoint is now the minimal core; use `actual-css/full` for all CSS families.
* `actual-css/js` is now the enhancement loader only; use `actual-css/js/full` or `actual.full.js` for the complete pre-registered runtime.
* `.grid` remains space-driven through `--grid-min`; `.grid-2/3/4/6` now express bounded structural density and degrade responsively.
* `.container-query` optionally gives `.grid-N` balanced divisor-based subdivisions (`2→1`, `3→1`, `4→2→1`, `6→3→2→1`) instead of being required for responsiveness.
* `--grid-columns` is the explicit escape hatch for exact custom tracks, including arbitrary structural counts, asymmetric ratios, and mixed intrinsic/flexible tracks; applications own their narrow behavior.
* `.sidebar-layout` now uses intrinsic flex wrapping instead of a hidden container-query/viewport breakpoint contract.
* Grid primitives remove the automatic `min-inline-size` floor from their direct children to preserve overflow-safe track sizing.
* `.card` is now a column flex container; a direct `<footer>` anchors to the bottom when extra space is available, aligning actions across equal-height cards.
* Focus is a core invariant and no longer depends on loading focus styles after components.
* Focus rings are derived from each `[data-theme]` island's own `--focus`; preset palettes only keep intentional overrides such as neon.
* `.prose` now includes sane native description-list (`dt` / `dd`) styling.
* `.lead` and `.measure` are independent from `.prose`.
* Utilities distinguish compact framework shortcuts from verbose optional property/value helpers; optional helpers include semantic gap sizes and common sizing, alignment, overflow, spacing, text, border, and surface escape hatches.
* Preset theme palettes are reference/demo material rather than package API; their bundle is generated for demos/docs instead of `dist/`.
* `llms.txt` now documents the core/full package split, layout-selection model, class manifest, and application-CSS integration workflow.
* Biome now covers `src/`, `scripts/`, and `tests/`, and lint runs as part of `build:all`.
* Use OKLab for intent/context color mixes to keep custom themes stable when surfaces or borders are chromatic.
* Docs syntax highlighting uses a purpose-built local palette instead of the theme intents, which do not hold contrast as small text under most presets and are too close together on the monochromatic ones to stay distinguishable.
* CI and browser diagnostics are updated for Bun 1.4 and verify committed `dist/`, `site/`, and `size-report.json` against fresh builds.

### Fixed

* Forced-colors and theme-island focus/state handling.
* Grid child min-content overflow in narrow tracks.
* Drawer RTL behavior now follows resolved direction through `:dir(rtl)`.
* Badge typography uses shared font-size/density tokens instead of private literals.
* `.sr-only` now combines modern `clip-path` hiding with the legacy `clip` fallback.
* `dim` and `indigo` shadows use palette-appropriate shadow colors.
* Vendor pseudo-element handling for color inputs and meters.
* Tooltip Escape handling and LIFO surface dismissal, including pinned tooltips.
* OTP, switch, joined-control, floating-field, validation, and native color-control focus/state edge cases.
* Flyout panel lifecycle cleanup.
* Prose spacing and component focus regressions.
* Compatibility checks ignore feature names appearing only in CSS comments.
* Navbar and status-bar guidance now makes responsive trigger placement and transient-feedback semantics explicit.

### Breaking

* `actual-css` now contains only the core. Replace it with `actual-css/full` when the previous full-framework behavior is required.
* `actual-css/js` / `actual.js` now contain only the enhancement loader. Use `actual-css/js/full` / `actual.full.js` for the previous complete runtime.
* `.grid-N` no longer means a fixed N-column grid at every width; it is a responsive structural-density preset, with balanced divisor layouts available through `.container-query`.
* `.sidebar-layout` no longer depends on `.container-query` or the old fixed breakpoint; direct children now participate in its intrinsic flex sizing contract.
* `.card` now establishes a column flex formatting context so direct structural footers can anchor to the bottom; code relying on block margin collapsing inside cards should be reviewed.
* Direct imports of `typography/prose` no longer include `.lead` or `.measure`; import `typography/lead` and `layout/measure` explicitly when needed.


## [0.3.1] - 2026-08-20

### Changed

* `.stack` children keep their inline margins; only block-axis margins are reset (`margin-block: 0`), so self-centering children via `margin-inline: auto` work inside a stack.
* Improved `.inverted` contract
* Tooltip performance when not visible
* Flyout edge cases are better handled
* Docs improvements


## [0.3.0] - 2026-08-19

### Added

* New documentation site with search, theme switching, examples, and documented public CSS hooks.
* New optional CSS bundle with OTP, Chat, Aura, FAB, and floating-field components.
* Built-in dismiss handling for dialogs and alerts with the generic `--dismiss` command.
* Richer menus and context menus with improved keyboard, focus, and touch interactions.

### Changed

* Expanded component and layout customization hooks, including grid, cluster, form actions, buttons, tabs, and alerts.
* Added native color input styling and icon-only button support.
* Enhancement lifecycle and cleanup are stricter and more predictable.

### Breaking

* Spacing tokens move from `--space-1`…`--space-6` to the extensible `--space-10`…`--space-60` scale.
* Size-related `--variant-*` tokens become `--density-*`; density now affects spacing and geometry, not typography or icon size.
* `.nowrap` becomes `.text-nowrap`; cards now use `--surface-raised`.
* The named `dark` theme becomes `indigo`; `data-theme="dark"` now forces the default theme into dark mode.
* The JavaScript runtime now targets the Minimal tier (Firefox 98+, Safari 15.4+, Chromium 99+); the legacy dialog fallback and `enhance().forget()` are removed.

### Fixed

* Improved focus, forced-colors, validation, and control accessibility.
* Improved menu, surface, and context-menu lifecycle and dismissal behavior.


## [0.2.0] - 2026-07-28

### Added
- Enhancement contract: `class` = presentation, `data-enhance` = behaviour,
  ARIA/HTML = semantics, `data-*` = configuration.
- `enhancementSelector()`, `hasEnhancement()`, `registerEnhancement()` in
  `actual-css/js/enhance`.
- Primitive subpath exports: `events`, `focus`, `keys`, `menu`, `surface`.
- `.alert.callout` — neutral surface with 4px accent border on the leading edge.
- `.alert.admonition` + `.alert-title` / `.alert-body` — structured anatomy.
- `.scroller.stable-gutter` — opt-in `scrollbar-gutter: stable`.
- `--shadow-xs` and two-layer `--shadow` token.
- `data-scrollspy-offset` attribute with deterministic geometry-based
  activation (pixels or percentage, replaces IntersectionObserver).
- Widget primitives catalogue (`docs/design-notes/widget-primitives.md`).
- `.range` — fully custom-styled range slider (`appearance: none`) with
  intent-tinted thumb, focus ring on the thumb surface, and disabled state.
- `check:enhance` guardrail script.

### Changed
- Behaviour discovery moved from presentation classes to `data-enhance` tokens
  (`tabs`, `flyout`, `scrollspy`, `validation`). The old classes remain valid
  for presentation-only or CSS-only modes.
- `status.js` now resolves its target via `[data-status][role="status"]` instead
  of `.status-bar[data-status]`.
- `.badge` is soft by default; use `.solid` for counters. `:empty` dots
  unchanged.
- `.btn` gap tightened to `0.375em` and weight to `--font-weight-medium`.
- `.spinner` default size is `1em` (was `1.5rem`), `.sm` = `0.75em`,
  `.lg` = `2rem`.
- `--shadow` is a two-layer shadow (was single-layer), `--shadow-popout`
  unchanged.
- Focus ring is now neutral (`--neutral:focus`), with a single consistent recipe
  across all interactive controls. `forced-colors` fallback is centralised, and
  theme-specific exceptions (Edge) removed.
- `selectors.js` holds written-state vocabulary only (discovery entries removed).
- `surface.js` owns its own teardown via `data-actual-surface` marker and
  per-document binding.
- Spacing tokens move to an extensible tens namespace: `--space-1`…`--space-6`
  become `--space-10`…`--space-60`. Actual CSS reserves multiples of 10;
  applications can intercalate intermediate values (`--space-15`, `--space-45`)
  without colliding with a future framework step (breaking).
- `.nowrap` is renamed `.text-nowrap` (text wrapping only); keeping a
  `.cluster` on one row is now `--cluster-wrap: nowrap` (breaking).
- `.card` background now falls back to `--surface-raised` instead of `--surface`
  (breaking where the two differ).

### Fixed
- Menu-item detection no longer matches items of a neighbouring surface (D11).
- Keyboard navigation and click-autoclose work on surfaces with custom CSS.
- Orphaned mounted surfaces close when their trigger/context target is removed (D9).
- `surface.js` teardown and outside-click listener bind per owning document (D22).

### Removed
- `FormValidator.init()` default selector changed from `.needs-validation` to
  the `data-enhance="validation"` token. The live opt-out (removing the class
  from a connected form) is gone — the marker is read once at connect.
- Five runtime `.needs-validation` re-checks removed — `init(customSelector)`
  now actually works.

## [0.1.0] - 2025-04

- Initial pre-1.0 package surface.
- Public class grammar, theme contract, runtime DOM tests, and build guardrails.
- Changed `.nowrap` to only set text wrapping; use optional `.flex-nowrap` for flex wrapping.
