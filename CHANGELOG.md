# Changelog

All notable changes will be documented here.

This project follows Keep a Changelog and uses semver, including during 0.x.

## [0.3.0 - unreleased]

### Added
- Official documentation site in `site/`, built from `docs/pages/**/*.md`
  by `bun run build:docs` (75+ pages, search, theme switcher over all 15 named
  themes, generated landing page). Replaces the legacy `docs/*.md` + generated
  `demo/` workflow.
- `check:compat` — capability floor audit: unguarded above-Minimal structural
  CSS fails the pipeline unless justified in the source or the audit ledger.
- `check:css-api` — validates `Public hooks:` headers: every listed hook must
  be referenced by its file, with an `--audit` mode listing unclassified
  component-prefixed properties.
- `Public hooks:` headers and child/cascade contracts across documented
  component and layout files (`layout.css`, `card.css`, `button.css`,
  `badge.css`, `alert.css`, `modal.css`, `tooltip.css`, `switch.css`,
  `control.css`, `choice-card.css`, `choice.css`, `range.css`,
  `scroll-snap.css`), plus Public/Derived/Internal markers in `theme.css` and
  `tokens.css`.
- Examples section in the docs, featuring `demo/admini/` and `demo/templates/`.
- `scripts/utils/chrome-shot.js` - shared headless-Chrome screenshot plumbing
  used by `shot:page` and `shot:forced`.
- Optional `.floating-field` — floating labels over the text controls
  (`.input`, `.textarea`, `.select`), driven by `:placeholder-shown` with no
  JavaScript. Date/time inputs stay floated, and the reserved headroom follows
  control density through `--control-size`.
- Optional layer ships as a bundle: `dist/optional.css` /
  `dist/optional.min.css`, exposed as `actual-css/css/optional` next to the
  existing per-module source imports.

### Changed
- The JS bundle build is byte-deterministic: `build:js` no longer emits a
  sourcemap (or Bun's per-build `debugId`), so rebuilding unchanged sources
  produces no diff.
- The docs site copies the shipped bundles (`dist/actual.css`,
  `dist/actual.js`, `dist/actual-themes.min.css`) and errors clearly when
  `dist/` is missing.
- Docs navigation gains an Examples group; the root `index.html` redirects to
  `site/index.html`.
- The docs site lives in `site/` (generated output only); its chrome
  (`docs.css`, `docs.js`) moved to `scripts/docs/assets/` and is referenced in
  place from the generated pages, so `site/` never stores a copy.
- `--grid-columns` hook to override the generic `.grid` template for
  custom/asymmetric layouts; the author owns any narrow-container collapse.
- `--form-actions-align` and `--form-actions-justify` hooks.
- `.color` styling for native color inputs, including disabled and forced-colors states.
- Generic `command="--dismiss"` routing with the `actual:dismiss` event.
- Manifest blocks (`script[data-enhance-modules]`) auto-wire through the
  `enhance()` observer; the `DOMContentLoaded` bootstrap is gone.
- `--cluster-wrap` on `.cluster` — override wrapping (`flex-wrap`) per instance.
- `.btn.icon-only` — square icon-only buttons sized to the control height.
- `--btn-gap`, `--tab-gap`, and `--alert-radius` hooks for gap and radius tuning.
- `.gap-sm`, `.gap-md`, `.gap-lg` optional utilities in
  `optional/utilities-extra.css`.

### Changed
- `registerEnhancement()` owns a name per root — a duplicate name on the same
  root throws, and `disconnect()` releases it (breaking).
- `enhance()` cleans up elements moved out of their custom root while still
  connected.
- The JavaScript runtime now targets the **Minimal** tier (Firefox 98+,
  Safari 15.4+, Chromium 99+) instead of Degraded. Modern syntax and built-ins
  available across that baseline (`??=`, `Array.prototype.at()`,
  `Object.hasOwn()`) may be used directly; no transpilation or legacy
  compatibility layer is shipped.
- Abortable event listeners (`addEventListener({ signal })`) are the standard
  cleanup mechanism — one `AbortController` per owned lifecycle.
- Size-related `--variant-*` tokens become the `--density-*` family:
  `--variant-space` → `--density-space`, `--variant-compact-size` →
  `--density-compact-size`. `--variant-pad-block` is removed — the alert no
  longer participates in density and keeps a fixed padding. Density covers
  spacing and geometry only: `.sm`/`.lg` no longer change typography or icon
  size, and `--variant-font-size`, `--variant-icon-size`, and
  `--variant-compact-font-size` are removed (`--control-font-size` stays at
  its baseline) (breaking).

### Removed
- `forget()` from the `enhance()` return value.
- The legacy `<dialog>` fallback (`dialog-fallback.js`, `dialog-fallback.css`,
  and their tests and internal classes). The runtime assumes native `<dialog>`
  across the Minimal tier.
- The static `js-compat` floor test; the browser floor is now a codebase
  decision enforced by review.
- The legacy docs workflow: `build-demo.js`, generated `demo/generated/`,
  `demo/styles/prism.css`, and the old `docs/*.md` reference pages (migrated
  into `docs/pages/`). `build:demo` / `watch:demo` and the `prismjs` devDep
  are gone; `build:all` now runs the docs pipeline.

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
