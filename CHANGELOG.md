# Changelog

All notable changes will be documented here.

This project follows Keep a Changelog and uses semver, including during 0.x.

## [0.2.0] - Unreleased

### Added
- Enhancement contract: `class` = presentation, `data-enhance` = behaviour,
  ARIA/HTML = semantics, `data-*` = configuration.
- `enhancementSelector()`, `hasEnhancement()`, `registerEnhancement()` in
  `actual-css/js/enhance`.
- Primitive subpath exports: `events`, `focus`, `keys`, `menu`, `surface`.
- `.alert.callout` — neutral surface with inset intent accent band.
- `.alert.admonition` + `.alert-title` / `.alert-body` — structured anatomy.
- `.scroller.stable-gutter` — opt-in `scrollbar-gutter: stable`.
- `--shadow-xs` and two-layer `--shadow` token.
- `data-scrollspy-offset` attribute (parseable per docs, algorithm deferred).
- Widget primitives catalogue (`docs/design-notes/widget-primitives.md`).
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
- `selectors.js` holds written-state vocabulary only (discovery entries removed).
- `surface.js` owns its own teardown via `data-actual-surface` marker and
  per-document binding.

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
