# Changelog

All notable changes will be documented here.

This project follows Keep a Changelog and uses semver, including during 0.x.

# 0.4.0 — unreleased

### Added

* Modular CSS architecture with `core`, `layout`, `typography`, `forms`, `components`, `effects`, and `utilities` families, each exposing manifests and individual modules.
* `actual-css/full` and `actual.full.*` bundles for the complete framework.
* `.switcher` as a core layout primitive and intrinsic `.sidebar-layout`.
* Generated and published `reserved-classes.json`.
* Dedicated `typography/lead.css` and `layout/measure.css` modules; `.measure` now exposes `--measure`.
* Architecture, compatibility, vendor-selector, browser-layout, and package guardrails.

### Changed

* The bare `actual-css` entrypoint is now the minimal core; use `actual-css/full` for all functional families.
* `.grid` remains the space-driven intrinsic grid using `--grid-min`.
* `.grid-2/3/4/6` are bounded responsive grids by default; inside `.container-query` they use balanced structural subdivisions (`2→1`, `3→1`, `4→2→1`, `6→3→2→1`).
* `.container-query` is now an optional balanced-layout enhancement rather than a requirement for responsive grids.
* Focus is a core invariant and no longer depends on loading focus styles after components.
* Utilities now explicitly distinguish compact base shortcuts from verbose optional property/value helpers.
* `.lead` and `.measure` are independent from `.prose`.
* CI and browser diagnostics updated for Bun 1.4.

### Fixed

* Forced-colors and theme-island focus/state handling.
* Vendor pseudo-element rules for color inputs and meters.
* Tooltip Escape handling and LIFO surface dismissal, including pinned tooltips.
* OTP and switch focus/state rendering.
* Joined-control focus stacking and floating-field behavior.
* Native color control rendering.
* Flyout panel lifecycle cleanup.
* Validation for fields with names such as `length`.
* Prose spacing and component focus regressions.

### Breaking

* `actual-css` now contains only the core; replace it with `actual-css/full` when the previous full framework behavior is required.
* `.grid-N` no longer means a fixed N-column grid at every width: it now degrades responsively, with balanced divisor-based layouts available under `.container-query`.
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
