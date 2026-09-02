# Actual CSS Changelog

## [Unreleased]

### Added

* `.step-label` wraps every step's label. It is part of the component contract, not an
  option: the wrapper is the only handle the space-aware representations have — something to
  move beside a marker, place under one, or visually hide.
* Horizontal `.steps` has three space-aware representations of the same markup, once it has
  an `actual-container` size context: the label beside its marker when there is generous
  room, stacked under it by default, and markers only when even that would scroll. Not a
  variant — it is what the component does once the author grants the context (the
  `.container-query` class, or the name declared in their own CSS) on the step flow or on a
  region around it. Two thresholds in all:

  | Container width | 2–3 stages | 4–5 stages |
  | --- | --- | --- |
  | below 35rem | stacked, scrolls if it must | markers only |
  | 35rem to 60rem | stacked | stacked |
  | from 60rem | inline | inline |

  Both are calibrated on five stages, the widest supported row. `35rem` is that count's
  `--step-min` budget, so no supported row scrolls where markers-only could have helped;
  four stages share it and are reduced slightly earlier than they strictly need to be.
  `60rem` is where a five-stage row still leaves its connector a real region rather than a
  stub. Markers-only covers 4–5 only: a 2- or 3-stage row stays readable stacked far below
  any width worth designing for, and scrolls instead.
  Every label is hidden in the markers-only form, current included, so the markers keep an
  even pitch — the surrounding screen names the current step. A flow whose labels are
  interactive keeps them rather than leaving a link in the tab order with its focus ring
  clipped away.
* `.steps-vertical` is an explicit vertical orientation for a wizard sidebar or a narrow
  process panel: markers form a column track and labels sit beside them. It is a composition
  choice, not a responsive fallback — container queries never switch a row into it — and it
  is not bound by the horizontal 2–5 range.
* `.step-label` is typed a notch below its marker — one size down, neutral weight, tight
  leading — because the marker's fill and ring already carry the state. Only
  `aria-current="step"` earns extra text weight; a completed step leans on its filled disc.
  The size is set on the component rather than per representation, so a resize moves the
  layout without also resizing the text. A navigable label keeps its own state colour
  instead of the theme's `--link`, and keeps its underline, hover and focus ring.
* `--step-inline-connector` repaints the connector of the inline representation, where it
  absorbs the free space between marker + label groups — the natural region for a themed
  chevron. It falls back to `--step-connector`, then to the default line. Vertical steps have
  no equivalent hook: their geometry differs, but no design has asked to repaint it and
  `.steps-vertical > li::after` is a reachable override.

### Changed

* `.steps` states `overflow-y: hidden` alongside its horizontal scroll instead of leaving the
  block axis to compute to `auto`. A row hugs fractional content with no slack, so whether a
  phantom vertical scrollbar appeared depended on the font, the device pixel ratio and the
  zoom level. A row with an interactive label now reserves `padding-block` for its focus
  ring, which the clip would otherwise cut; an informational stepper keeps its height.
* `--step-connector` now takes a complete CSS background value, not a colour, so a theme can
  replace the line with a gradient, an image or nothing at all. The default paints the
  hairline as a gradient of the step's own `--step-line`, so a `.complete` connector still
  follows its state.
* The framework's query container name is now `actual-container`, not `actual-grid`.
  It was named after its first consumer; the contract is generic — "here is the width you
  were allocated" — and `.steps` reads the same context as `.grid-N`. Rename
  `container: actual-grid / inline-size` and any `@container actual-grid` rule of your own.
  `.container-query` is unchanged.
* Documentation demo previews no longer grant a query container, so a rendered demo behaves
  like the snippet printed beside it. `actual-container` is a contract an author declares,
  and one shared name reaches every size-aware component, not just `.grid-N`. The `bare`
  fence flag is gone with the ambient grant it existed to escape; an example needing the
  context now establishes it in its own markup, where the reader can see it.


## [0.5.0] - 2026-09-01

### Added

* `surface` shared variant: the page surface with the theme border, intent in the text only.
  Fills the gap between `soft` (always intent-tinted) and `outline` (no fill at all).
* `--link` is now read by the base `a` rule, so a theme that sets it colors bare links and
  prose links at once. Unset, nothing changes.
* `touch-target` for small buttons.
* `data-list` for compact term–value pairs describing the properties of a single object.
* Segmented `meter`.
* `intent-color` to apply color based on intent.
* `demo/templates/motion.html` — a motion catalogue that replays each overlay's
  entry/exit side by side, stretches durations to read the presence curves, and
  simulates reduced motion.

### Changed

* `--bar-height` is a public hook. It was classified Internal by mistake while both
  `progress` and `meter` used it as their only thickness mechanism. Size variants stay
  unsupported on those two: a bar keeps its inline size and only changes thickness, which
  the hook expresses better than a three-step scale.
* Removed the `.field-group + .field-group` sibling margin (breaking, pre-1.0). A component
  cannot know whether its siblings are stacked or gridded; space consecutive groups with
  `.stack` on the form.
* `steps` now separates the two accented states: `.complete` is a filled marker with an
  accented connector, `[aria-current="step"]` an outlined one with a thicker ring. They were
  visually identical, so a numbered stepper could not show position without a check glyph.
  A step carrying both renders entirely as current, connector and completion glyph included.
* `status-bar` visibility is driven by the `.is-open` state class instead of `:empty`,
  and `status.clear()` now empties the text and intent only after the exit transition,
  so the bar animates out at the size and color it was shown at. A message dispatched
  during that exit cancels the pending cleanup. An empty message now clears instead of
  opening a blank pill. The runtime also lifts the bar above the mobile software keyboard
  via `visualViewport`. Deferred component cleanup now shares one CSS-transition helper,
  so unrelated or infinite author animations cannot strand a status bar or surface.
* Removed the generic `--ease` motion token (breaking, pre-1.0). Generic interaction and
  state transitions now use the CSS default `ease` directly; the dialog shake and the
  `actual-dialog` View Transition keep that default deliberately, so no behavior changes.
* Introduced `--ease-enter` / `--ease-exit` presence curves for one-shot open/close, applied
  to `status-bar`, `modal`, and `drawer`. The drawer exit shortens to `--duration` (entry
  stays `--duration-slow`) and its `::backdrop` follows the panel duration. Flyout, tooltip,
  and all backdrops keep the neutral `ease`; they share a single fast transition list or are
  pure-opacity scrims where the presence pair does not resolve.


## [0.4.2] - 2026-08-25

### Fixed

* `card` + `cluster` regression.
* Some markup in demos.


## [0.4.1] - 2026-08-25

### Added

* `indicator`, `rating`, and intrinsically responsive `steps` components.
* `list` / `list-item` for repeated application rows with leading, content, and trailing regions.
* `app-nav` and `app-layout` primitives for adaptive application shells.
* `.sidebar-layout.reverse` to place the sidebar visually first while keeping main-content-first DOM order.
* `icon-slot` documented pattern for predictable contained icon regions.
* `check:doc-classes` guardrail for validating framework classes used in documentation.
* New **Actual Tasks** mobile/application demo.
* `docs-geometry` guardrail asserting the documentation shell can reach the structural-grid thresholds, read from `grid.css` rather than hard-coded.
* `--width` on `shot:page` for captures at an exact layout viewport; the flag was previously accepted and silently ignored.

### Changed

* Improved card and prose vertical rhythm:
  * bare cards now own direct-child spacing through `--card-gap`;
  * direct child block margins are normalized;
  * `.stack` and `.media` keep ownership when composed with `.card`;
  * prose sibling rhythm is more deterministic.
* `steps` now use one intrinsic responsive layout, filling available space and scrolling only when `--step-min` cannot be maintained.
* Added `--step-marker-radius`, `--step-connector`, and `--step-complete-mark` customization hooks.
* Improved `app-layout` / `app-nav` composition with framework-owned safe-area handling and automatic FAB/navigation avoidance.
* Clarified that `app-layout` targets persistent application shells rather than regular document pages.
* Simplified forced-colors support: native/system colors are preferred, with framework overrides limited to structural states that would otherwise disappear.
* Expanded documentation around lists, application layouts, icon containment, and framework-vs-application CSS ownership.
* Documented reference container sizes for `.grid-N`, including that the thresholds describe the query container's content box rather than the viewport.
* Recorded why the framework exposes no global breakpoint scale: container width is not a monotonic function of viewport width, measured across a composition that reveals a sidebar as the viewport grows.

### Fixed

* Tooltip cleanup now follows enhancement-root membership correctly, including triggers moved outside the observed root while still connected.
* Documentation home-page overflow and minimum-size issues.
* Documentation demo previews could not reach the structural-grid thresholds. The article column capped every live preview at 45.9rem at any viewport width, so `.grid-3` demos rendered one column and `.grid-4` / `.grid-6` two — including on the page documenting `6 -> 3 -> 2 -> 1`. No framework CSS was involved or changed.
* Invalid or misleading documentation class examples.
* Steps sizing and narrow-container behavior.


## [0.4.0] - 2026-08-22

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
* `--soft-fg-mix` for tuning soft foreground ink.
* Optional `--link` override for prose link ink.
* `check:color-space` guardrail for intent/context color interpolation.
* Bundle tool.

### Changed

* The bare `actual-css` entrypoint is now the minimal core; use `actual-css/full` for all CSS families.
* `actual-css/js` is now the enhancement loader only; use `actual-css/js/full` or `actual.full.js` for the complete pre-registered runtime.
* `.grid` remains space-driven through `--grid-min`; `.grid-2/3/4/6` now express bounded structural density and degrade responsively.
* `.container-query` optionally gives `.grid-N` balanced divisor-based subdivisions.
* `--grid-columns` is the explicit escape hatch for exact custom tracks.
* `.sidebar-layout` now uses intrinsic flex wrapping instead of a hidden breakpoint contract.
* Grid primitives preserve overflow-safe track sizing.
* `.card` is now a column flex container and direct footers can anchor to the bottom.
* Focus is now a core invariant.
* Focus rings follow each theme island's `--focus`.
* `.prose` adds native description-list styling.
* `.lead` and `.measure` are independent from `.prose`.
* Utilities are split between compact framework shortcuts and optional property/value helpers.
* Preset theme palettes are reference/demo material rather than package API.
* `llms.txt` documents package splits, layout selection, the class manifest, and application-CSS integration.
* Biome covers `src/`, `scripts/`, and `tests/`.
* Intent/context color mixes use OKLab.
* Documentation syntax highlighting uses its own local palette.
* CI and browser diagnostics were updated for Bun 1.4 and verify committed generated output.

### Fixed

* Forced-colors and theme-island focus/state handling.
* Grid child min-content overflow.
* Drawer RTL behavior.
* Badge typography token usage.
* `.sr-only` legacy fallback.
* `dim` and `indigo` shadows.
* Vendor pseudo-element handling for color inputs and meters.
* Tooltip Escape handling and LIFO dismissal.
* OTP, switch, joined-control, floating-field, validation, and native color-control edge cases.
* Flyout lifecycle cleanup.
* Prose spacing and component focus regressions.
* Compatibility checks matching feature names in CSS comments.
* Navbar and status-bar guidance.

### Breaking

* `actual-css` now contains only the core. Use `actual-css/full` for the previous full-framework behavior.
* `actual-css/js` / `actual.js` now contain only the enhancement loader. Use `actual-css/js/full` / `actual.full.js` for the previous complete runtime.
* `.grid-N` no longer means a fixed N-column grid at every width.
* `.sidebar-layout` no longer depends on `.container-query` or the old fixed breakpoint.
* `.card` now establishes a column flex formatting context.
* Direct imports of `typography/prose` no longer include `.lead` or `.measure`.


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
