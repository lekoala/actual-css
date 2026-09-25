# Actual CSS Changelog

## [Unreleased]

## [0.10.0] - 2026-09-25

### Breaking changes

- `.inverted` is removed: it mixed a contrasting surface with theme inversion while remapping only part of the palette. Use a `data-theme` island for a complete light/dark subtree, or paint a local band in application CSS.
- `.white-space-normal` is renamed `.text-wrap`, the counterpart of `.text-nowrap`.
- `.dialog-close`, `.drawer-close`, and `.alert-dismiss` are replaced by the shared `.close` (`components/close.css`); a modular build imports it next to its host.
- A removable badge needs `<button class="close">`: a bare `.badge > button` is no longer styled, and an empty one no longer paints an X.
- `--alert-dismiss-size` and `--badge-dismiss-icon-size` are replaced by `--close-size` / `--close-icon-size`.
- The dialog corner applies to a `.close` that is a direct child of the dialog, of its `form` or `header`, or of a `form` inside that header.
- `getSurfaceAutoClose` is removed from `surface.js`: it had no caller, and the code that opens a surface passes its own `autoClose`.
- `.column-span-1…12` and `.column-start-1…12` are replaced by the `--column-span` / `--column-start` hooks on each `.column-layout` child.
- The bare `actual-css` entrypoint resolves to the complete compiled framework, like `actual-css/full`, `style`, `unpkg`, and `jsdelivr`; import `actual-css/css` for the core alone.
- `package.json#main` is removed.
- `dist/actual.css` and `dist/actual.min.css` are no longer built or published; compose the core from `actual-css/css`.
- `dist/actual.js` (the compiled loader alone) is no longer built or published; bundle your own entry from `actual-css/js` and `actual-css/js/*`.
- `.input`, `.textarea`, `.select`, and an open custom select draw a `--focus-ring-width` inset outline in `--focus` instead of a focus border plus outer halo.
- `.join` no longer moves a field's focus ring onto the group: each segment keeps its own indicator.
- `.btn`, `.close`, `.check`, `.radio`, `.switch`, `.choice-card`, `.file`, and `.color` draw a solid `--focus-ring-width` line in `--focus` at `--focus-outline-offset` instead of a translucent halo.
- `.range` thumb focus ring is solid `--focus` instead of `--focus-ring`.
- `--focus-ring` and `--focus-ring-shadow` are removed; every focus indicator reads `--focus`.
- `--btn-focus-color` and `--btn-focus-ring-color` are removed: a button's focus color no longer follows its intent.
- `.check`, `.radio`, and `.switch` keep their resting border on focus instead of switching it to `--focus`.
- The default `--focus` is `hsl(268 30% 55%)` in both schemes instead of `var(--neutral)`: a primary-hued mid-tone that holds 3:1 against `--surface` and `--surface-solid`.
- `--focus-ring-width` is `2px` instead of `3px`, and `3px` instead of `4px` under `prefers-contrast: more`.
- `bootstrap-v6` sets `--focus: #3d8bfd` and `--focus-ring-width: 3px` instead of its own ring recipe.

### Added

- `.bleed` is a shared surface contract: `src/css/components/bleed.css` reads the relayed `--surface-pad`, so a direct child of a `.drawer` or of an accordion panel escapes its inset like a card child already did.
- `--accordion-pad` hook: the summary row and the panel no longer hard-code their inset, and the panel relays it so `.accordion.separated` items accept a `.bleed` child.
- `--accordion-marker-size` hook.
- `.data-list.stacked`: the value sits under its term instead of beside it.
- `--bleed-pad` is a public read-only hook: `padding: var(--bleed-pad)` pads a `.bleed` band that is not a header, footer, or figure.
- `.join` supports a control nested one wrapper level deep (e.g. a combobox element): the wrapper carries the group corners and primary-edge `z-index`, the inner control inherits the radius, and no widget is named.
- `.nav-link` works on a `<button>`: UA button chrome is neutralized with `<a>`-identical metrics.
- `material` demo theme: Material 3 baseline palette, filled underline fields and addons whose focus thickens the bottom line, pill buttons, and a joined outline action drawn as one more filled segment.
- `.choice-card.chip`: compact pill form for filter chips and selectable tags, with a leading dot that turns into the check without moving the label.
- `--choice-chip-dot` is a read-only hook on the chip's `::before`: the check-slot centre, so a theme can grow the dot's `circle()` clip into a selected fill.
- The `material` theme grows the chip dot into a tonal fill.
- The `gradient` theme demos the outer-halo field focus; `bootstrap-v6` and `edge` have no field focus override.
- `demo/templates/contrast-contexts.html`: the page, `data-theme` islands, a card island, a named theme and an application-painted band with every intent variant, a form, a combobox, a date picker and focus lines measured live, plus a `.join` gallery with no focus adaptation.

### Fixed

- `dialog.js` only backdrop-dismisses when the press started on the backdrop: a text selection released over the backdrop no longer closes (or shakes) the dialog.
- `dialog.js` restores the horizontal scroll position on open, not just the vertical one.
- `tab.js`, `focus-group.js`, `menu.js`, and the flyout trigger ignore IME-composed and ctrl/alt/meta-modified keys; `escape.js` ignores composition too.
- `status.js` restores its bar when the host dialog was removed from the DOM (htmx/Turbo swap): the next `status()` heals instead of no-opping forever.
- `tooltip.js` resynchronizes shorthand `data-tooltip` text on every show, so a "Copy" → "Copied!" update displays without rewiring.
- The text of a visible shorthand tip updates on the next show, never mid-flight.
- `flyout.js` sets `aria-haspopup="menu"` only for a true `role="menu"` panel: `<menu>` carries the implicit list role.
- `dialog.js` respects `closedby="none"` on `cancel` when `HTMLDialogElement.closedBy` is unavailable, while explicit close requests still work.
- `dialog.js` restores generated ARIA attributes, title IDs, and rewritten `closedby` values on disconnect without overwriting author changes.
- A last `.bleed` child of an accordion panel had square corners over the rounded `.separated` item or the group's last item.
- `applyEnhancement("validation", …)` did not wire an already-connected form: `validation.js` now registers through `registerEnhancement`.
- `--app-nav-side-size` was invisible to `check:css-api` (header read `Public hook:`).
- A custom `data-theme` on `<html>` kept the default palette's `--*-soft-fg` calibration instead of resetting it, so the same theme resolved a different soft ink on `<html data-theme>` than on a nested island.
- `.nav-link` hover/current and `.app-nav` hover fill with a tint of their own ink and follow `--ui-fg`, so they read on a bar with its own `--ui-bg`.
- `.flyout` owns `color: var(--text)`, like modal and drawer.
- Preset themes: every `--focus` is a mid-tone that holds 3:1 on `--surface` and `--surface-solid`, and a `--soft-fg-mix` keeps every soft ink at 4.5:1 (`report:theme-contrast` lists no failing pair).
- `report:theme-contrast` measures `.badge.soft` explicitly, so a preset that fills badges by default (`bootstrap-v6`) is no longer reported against a solid pair.
- `ocean` theme: light `--danger` darkened (solid text 4.1:1 → 5.2:1), `--soft-fg-mix: 50%` (soft inks from 2.0–4.3:1 to ≥ 4.8:1), and a mid-tone `--focus` that holds 3:1 on both surfaces.
- `.join-addon` honours `--control-border-block-end-color` / `-width` like text controls, so a theme's underline or accent edge reaches the addon segment.
- `gradient` theme: the focus halo follows validation (`--form-invalid-border`), and it and `material` restyle the open customizable select with their field focus instead of the core `:open` outline.
- `--dialog-focus-bleed` and `--drawer-focus-bleed` reserve `max(--focus-ring-width, 2 × --border-width)` past the offset, so a 3px component line (`bootstrap-v6`) is no longer clipped by 1px in a scrollable modal or drawer body.
- A focused field in `.join` stacks above an adjacent field (`z-index: 4` rule now follows the primary-edge rule), so the neighbour no longer covers its shared edge.
- A field wrapped one level deep in `.join` fills its stretched wrapper (`block-size: 100%`) instead of stopping short of a taller sibling.
- Focus indicators on a `--surface-solid` band and on a card nested in it hold 3:1 (a primary button's ring measured 1.1:1, a neutral one in a nested card 1.0:1).

### Documentation and tooling

- Combobox: the bridge recipe targets `@lekoala/combobox` 0.5.0, replaces its halo with the field inset outline, reads `--form-invalid-border`, and inherits `.join` corners.
- `tests/browser/field-focus.test.js` asserts the field outline stays inside the border box (default and `prefers-contrast`) and that `--focus` holds 3:1 on `--surface` and `--surface-solid` in both schemes.
- `bun run report:theme-contrast` also reports each preset's `--focus` against `--surface` and `--surface-solid`.
- Theming: "Make a dark (or light) section" replaces the `.inverted` recipe — a `data-theme` island for a whole context, application CSS for a painted band.
- Button: a dark button (formerly `.btn.inverted`) is a custom intent, `--intent: var(--surface-solid)` / `--intent-fg: var(--surface)`.
- `demo/templates/surfaces.html` is removed; `contrast-contexts.html` covers surface boundaries.
- `tests/browser/inverted.test.js` becomes `surface-context.test.js`, on an application-painted band.
- Pushing a version tag publishes the GitHub release: `.npmrc` keeps `npm version` on the bare tag format, `bun run release:notes` extracts (and validates) the dated changelog section, and the CI `release` job attaches `dist/`.
- Theming: a "Replace the palette with my own brand" entry names the tinted neutrals and soft-ink tokens a partial override leaves behind, and points at the minimal recolor set.
- Tokens: the minimal recolor theme includes `--shadow-color`.
- Tokens: a "Where a token is declared" section separates global, component-scoped, and relay properties, and shows the `var(--card-pad, <default>)` form for reading a component hook from outside.
- Button: `--ui-bg` is the lever for an opaque fill under an intent-colored border, which no shared variant expresses; the rule must load after Actual CSS.
- Accordion: the marker is a masked box, so a decorated marker needs a real element — the opt-out recipe paints the chevron and keeps the hover and forced-colors behavior.
- `llms.txt` lists the four `data-enhance` tokens and what the vocabulary does not have (compound intents, breakpoint prefixes, spacing scale, `is-*`, standalone modifiers).
- `parseHookSections` throws on a near-miss section label (`Public hook:`) instead of silently dropping the hooks under it.
- `components.json`: an entry no longer lists another component's class it only styles (`bleed` → `card`), and `plumbingHooks` carries the "Framework plumbing:" section.
- Progressive enhancement guide: built-in `data-*` behaviors expose no `refresh()`; insert the element with its attribute set.
- `utilities/extra.css` header no longer calls extra utilities non-API.
- `skills/actual-css/`: a copyable starter agent skill for building with Actual CSS, shipped in the package and pointed to from the README and `llms.txt`.
- Install docs lead with modular source imports; the full bundle is the zero-config and CDN option.
- Modular import guide: "Start from the full entry" copies `actual.full.css` / `full.js` into the app and prunes them, and names the three shared CSS modules (`close`, `bleed`, `spinner`).
- Tailwind v4 guide: explicit layer order plus the `--font-sans` / `--font-mono` / `--font-weight-*` / `--radius-*` token collisions.
- Choice cards: the CSS hooks list `--choice-card-border`, `--choice-card-bg`, and `--choice-chip-dot`.
- `tests/browser/choice-chip.test.js` asserts the chip label never moves on check, the native inputs stay the controls, Tab focus draws the outer ring, and forced colors keep checked distinct.
- Theming: a `data-theme` island paints nothing; give it a surface, and put it on a wrapper rather than a `<fieldset>`, whose legend straddles the border.
- `demo/scripts/theme-picker.js`: every demo page uses one `<theme-picker>` fed by a single theme list, replacing 30 hand-copied selects and `admini-theme.js`.
- `check:templates` fails when `theme-picker.js` drifts from `src/css/themes/index.css` or a page hand-copies a theme list.


## [0.9.2] - 2026-09-22

### Added

- `--font-width` and `--font-width-dense` typography hooks: `.compact` applies the denser width through `font-stretch` (variable `wdth` axis when available, width-face matching otherwise), `.spacious` restores the normal width. Themes without a useful width axis opt out with `--font-width-dense: 100%`.
- `starts-with` and `ends-with` built-in `data-validation-rules` rules: the trimmed value must begin or end with one of the literal tokens, case-sensitive.
- `tel-prefix` built-in `data-validation-rules` rule: dialing digits are required, local numbers pass, explicit international numbers (`+`, `00`) must match an allowed prefix, and no prefix means local-only. It is an origin policy, not phone validation, and never rewrites the value.

### Fixed

- `.field` packs its rows to the start (`align-content: start`), so a field stretched by a taller grid row — a neighbour revealing its `.field-error` — no longer inflates its own control.


## [0.9.1] - 2026-09-16

### Fixed

- `.modal.scrollable` and `.drawer` body scrollports reserve inline focus-ring space without changing header, body, or footer alignment, so full-width controls no longer clip their focus indicator.
- `:where(dialog).modal` and `:where(dialog).drawer` roots now have 0-1-0 specificity like other components, allowing a later application class to override their defaults and documented hooks normally.
- `[data-context-menu]` resolves its menu per interaction: a target declared before its `<menu>` exists and a same-id menu replacement now open correctly instead of staying dead.
- `escape.js` ignores `Escape` presses already consumed (`defaultPrevented`) or chorded with `metaKey`.
- `isElementVisible()` in `focus.js` passes `visibilityProperty` to `checkVisibility()`, so `visibility:hidden` content is no longer reported focusable on modern engines.
- A flyout `<a>` trigger calls `preventDefault()` once its panel resolved — clicking it no longer navigates, while an unresolved trigger still navigates and bubbles.
- `data-tooltip` triggers containing focusable children now hide correctly: the non-bubbling `blur` listener was replaced by `focusout` with a `relatedTarget` containment check.
- `--dismiss` on an open surface finalizes the surface lifecycle — `.is-open`, the Escape entry, position tracking — and restores focus to the opener; the surface consumes `actual:dismiss` itself, keeping `dismiss.js` generic.
- `.link-muted:hover` and `.link-muted:focus-visible` are separate rules, so the hover color survives browsers without `:focus-visible`.
- `.choice-card` and `.floating-field` participate in `.sm` / `.lg` (and `.choice-card` consumes `--control-font-size`), so their documented size modifiers actually work.
- The `.floating-field` label rests on `--control-pad-x`, the same geometry as the control's text — both now share an inline start edge at every size.
- `.modal` header/footer resets are bounded to the dialog's structural `form` / `.stack` slots, so a header or footer inside the content keeps its own rhythm.
- `.otp` forced-colors styling covers the `:user-invalid` route.
- `print.css` forces `[data-theme]` islands to `color-scheme: light` with a white background and black text, so a dark-themed section no longer prints dark.
- The 11 paired themes declare `color-scheme: light` in their fallback block and `light dark` under `@supports (color: light-dark(...))` — dark UA controls no longer appear on the light fallback palette.

### Documentation and tooling

- Public CSS sources carry a `Docs:` pointer to their canonical usage page, verified by `check:architecture`.
- `check:compat` rejects selector lists mixing an above-floor pseudo with baseline selectors.
- Docs TOC and search headings decode HTML entities, so a heading like `Linting role="menu"` no longer shows `&quot;` in the sidebar.
- `tokens.md` describes the actual forced-colors contract; `enhancement-loader` documents that manifests are trusted application configuration.


## [0.9.0] - 2026-09-13

### Breaking changes

- `--choice-control-offset` is renamed `--choice-control-nudge` and adds to the
  derived first-line offset instead of replacing it — an old value is a whole
  offset and will sit that far too low.
- `--skeleton-width` is a maximum inline size, not a width: a placeholder fills
  its container and stops there, so it no longer gives every shrink-to-fit
  ancestor a min-content floor. A placeholder in a container sized by its own
  content now collapses instead of forcing that container open.

### Fixed

- `.choice` aligns its control on the first line's cap height with the `cap`
  unit, so a checkbox, radio or switch is level with the label text in any
  font — the previous constant was tuned for Segoe UI and sat ~2px low on
  Roboto.
- `.switch` lays its knob out of flow, so the track's baseline is its own
  border box.
- `dialog.drawer` is `--viewport-block` tall again, so a mobile browser's
  collapsing URL bar no longer pushes its footer below the fold.
- `dialog.drawer` scrolls its body region, so the footer stays reachable
  whatever the content length; the rule replaces the `nav`-only one.
- `.table-wrap` is `position: relative`, so an `.sr-only` header inside a wide
  table no longer escapes the scroller and gives the page a phantom horizontal
  scrollbar on small viewports.

### Documentation and tooling

- `tests/browser/mobile-overflow.test.js` asserts that no component scrolls the
  page sideways at 320px and 360px, and that wide content scrolls inside its
  own container.
- `bun run report:overflow` surveys demo and site pages at phone width and
  bisects each failure down to the element that owns it.
- `tests/browser/mega-menu.test.js` exercises three wide sibling nav panels —
  takeover, toggle, focus handover, keyboard open, Escape, clamping at both
  viewport edges, and no drawer mutation on a phone.
- The flyout hooks are documented as a preferred width and a width cap, with
  the cap's `20rem` default stated: a wide panel sets both, like `width` and
  `max-width`.
- The drawer and scrollable-modal pages state that a scrolling body region is
  keyboard-focusable, takes a focus ring, and can claim a dialog's initial
  focus — put the close control in the `header`, or use `autofocus`.
- The kitchen-sink, blocks, blog, combobox and select-intents templates no
  longer scroll sideways at phone widths.
- The alert trailing-action recipe and the dashboard template add `.items-center`:
  a trailing control makes the row taller than a line of text, which left the
  start-aligned `.alert-icon` above the message.

## [0.8.0] - 2026-09-10

Actual CSS 0.8 focuses on a cleaner component contract, more predictable sizing
and density, simpler surface behavior, stronger progressive enhancement, and a
more polished JavaScript runtime.

### Breaking changes

- The JavaScript browser floor is now Safari 17+, Firefox 125+, and Chromium
  116+. Older browsers still receive the CSS degradation covered by the
  Degraded tier, but no longer receive the supported JavaScript runtime.
- The Intermediate browser tier is removed; Minimal now covers the supported
  JavaScript baseline.
- `.gap-sm`, `.gap-md`, and `.gap-lg` are removed. They changed the `gap`
  property without updating Actual's inherited `--gap` rhythm, which could also
  diverge from `.grid-N` track sizing. Use `gap: var(--space-*)` for a local
  one-off gap, and `--gap` only when intentionally rebinding the rhythm inherited
  by nested layout primitives.
- `.alert.callout` is now purely a leading-flag treatment. It no longer forces a
  neutral surface, so intents and surface variants compose with it normally.
- `--font-weight` is renamed to `--font-weight-normal`,
  `--font-weight-strong` to `--font-weight-semibold`, and
  `.font-weight-strong` to `.font-weight-semibold`. Semibold is now 600.
- Badge sizing is independent from density. `--density-compact-size` is removed;
  use the badge size hooks and `.sm` / `.lg` instead.
- Flyouts and context menus no longer turn into mobile sheets. They remain
  anchored non-modal popovers at every viewport size.
  `data-flyout-mobile`, `data-flyout-breakpoint`, the responsive sheet
  presentation, and its generated backdrop are removed.
- `disconnectSurface(menu, { restore })` no longer accepts options; surface
  reparenting is gone.
- `EVENTS.reposition`, `EVENTS.hide`, and `EVENTS.outOfView` are removed from
  `actual-css/js/events`. No runtime path dispatched them.

### Added

- `applyEnhancement(name, selector, root?)` lets applications apply
  `data-enhance` behavior tokens programmatically while preserving existing
  tokens and refreshing registered behaviors.
- Accordion now supports `.flush` and `.separated` container treatments.
- `.list` rows can freely combine leading, content, and trailing regions.
- `--hr-space` customizes an `hr`'s block spacing when used in normal document
  flow.
- Global `pre` elements now use `overflow-x: auto`, preventing long
  unbreakable lines from widening the page.
- Badge status dots use `currentColor`, so they compose naturally with badge
  intent and text color.
- New demos and references:
  - visual guide for spacing, layout primitives, density, and size;
  - color guide for theme islands, intent colors, gradients, and interaction
    colors;
  - popover transport, adaptive filter surface, and settings modal examples;
  - expanded kitchen sink coverage for steps, aura, inverted contexts, density,
    and nested intents.
- New tooling:
  - `bun run serve` for opening demos from another device;
  - `report:dead-css` for unused demo CSS;
  - `report:neutral-ramp` for preset neutral-ramp analysis;
  - `report:theme-contrast` for soft-state contrast reporting.

### Changed

- Updated `@lekoala/floating` to 0.2.0.
- `.sm` and `.lg` now scale participating component families locally.
  `.compact` and `.spacious` remain inherited density contexts.
- Text controls now use the shared `--control-pad-x` geometry. Horizontal
  padding scales with the control size, and select/input-icon geometry follows
  the same control frame.
- Badge size now scales its label, icons, dots, and geometry proportionally.
  Badge inline padding is derived from `--badge-size`, and badges no longer
  shrink inside flex layouts.
- Badge and button typography now both use the medium font weight.
- Accordion summaries use the medium font weight and keep hover feedback in the
  current text color instead of switching to the primary color.
- `.soft` interactions now use one consistent fill change. Soft foreground
  colors resolve per intent through `--intent-soft-fg`, with theme hooks tuned
  for readable hovered states.
- Surface behavior is simpler:
  - interactive surfaces use `popover="manual"` instead of DOM reparenting;
  - `.is-open` is the only state written by `surface.js`;
  - `prepareSurface()` removes `[hidden]` and normalizes the popover transport;
  - Actual surfaces remain mutually exclusive per document; nested surfaces are
    unsupported.
- Tooltips now choose their coordinate space based on their trigger:
  scrolling page content uses absolute/document coordinates, while fixed,
  sticky, popover, and modal contexts stay viewport-relative.
- Tooltips that temporarily leave their positioning boundary are hidden and
  restored rather than torn down.
- Modal dialogs use the small viewport height (`svh`) for their block-size cap,
  avoiding panel reflow while mobile browser chrome expands or collapses.
- RTL fallbacks now use `[dir="rtl"]` for the Degraded tier and `:dir()` for
  nested direction changes. Redundant `@supports selector(:dir(...))` wrappers
  were removed.
- Form controls include `-webkit-appearance` alongside `appearance` where
  needed for older WebKit.
- `.scroll-snap` now uses `proximity` by default.
  `data-snap="mandatory"` opts into strict snapping and
  `data-snap-align="center"` controls item alignment.
- Print styles focus on structural repair and preserve semantic component
  content.
- `reserved-classes.json` now lives at the package root while keeping the same
  public package export.
- Compatibility checks now explicitly audit against the Degraded CSS floor,
  including structural selectors such as `:has()` and selector lists in
  `:not()`.

### Fixed

- `applyEnhancement(name, selector, document)` now refreshes registrations owned
  by either `document` or `document.documentElement`.
- `enhance()` no longer starts an idle `MutationObserver` when no valid enhancer
  record exists.
- Context-menu button triggers now use the same opening path as pointer and
  keyboard triggers, including `data-context-menu-scope`.
- Tooltips shown from touch/focus recover correctly after leaving and re-entering
  their positioning boundary.
- Reusing one explicit tooltip from another trigger correctly restarts position
  tracking.
- Tabs skip hidden items during keyboard navigation.
- Vertical tab focus rings use the correct inline edge.
- `.tabs` keeps `aria-orientation` inside `:where()`, allowing application
  classes to override layout without fighting framework specificity.
- An unchecked `.switch` keeps the correct hover treatment without the hover
  selector overriding the checked state.
- `.input-icon` supports leading and trailing icons at the same time and keeps
  their inset tied to the control frame even when the icon has its own font
  size.
- `.list-item` correctly lays out rows with no leading region.
- `.card.subtle` now propagates its subtle surface to contextual aliases and
  busy overlays.
- `.card`, `.navbar`, and `.app-nav` reset inherited intent state at their
  component boundary, preventing unrelated ancestor intents from tinting their
  variants.
- `.app-nav` uses the system Highlight colors for its current item in forced
  colors mode.
- `.background-surface`, `.background-raised`, and `.background-subtle` restore
  their matching text color and heading context, including inside `.inverted`
  sections.
- All paired themes provide their own `--hover-overlay` and `--shadow-color`
  baseline values instead of inheriting the core tint.
- `.prose` resets the browser's default inline blockquote margin.
- `hr` no longer collapses to zero width inside `.stack`.
- Select styling and modal body scrolling remain functional in Degraded
  Firefox 78–83.
- Badge dismiss buttons keep a 24px pointer-target floor and empty dismiss
  buttons render their built-in close icon correctly.
- `.menu-separator` documentation now uses plain `<hr>` without a redundant
  separator role.
- `--modal-size` can once again be overridden directly on a dialog.
- Theme, density, inverted, and application custom properties now inherit
  correctly into anchored surfaces.

### Documentation and tooling

- Updated the progressive-enhancement, surface, sizing, theme, layout, alert,
  badge, joined-control, and browser-support documentation to match the 0.8
  behavior.
- Added clearer guidance around `--gap`: setting the custom property changes an
  inherited rhythm, while `.gap-context` applies that rhythm to containers that
  do not already consume it.
- Updated Biome guidance for known false positives around `<menu role="menu">`
  and `role="group"`.
- Documentation examples and the examples index were cleaned up to remove stale
  framework classes and retired surface/sheet behavior.
- Package export tests now cover the documented `applyEnhancement()` and
  `ACTUAL_EVENT_PREFIX` exports.

## [0.7.0] - 2026-09-04

### Added

- Native Popover API presentation support for `.flyout[popover]` and
  `.tooltip[popover]`, including component-scoped UA geometry normalization and
  `:popover-open` entry states.

### Changed

- Menu checkbox and radio indicators now use the shared icon token and CSS
  shapes instead of font-dependent text glyphs.
- Build toolchain pinned to bun 1.4.1. The bundled JavaScript differs in bytes
  from 0.6.0 because of the newer minifier; no source or behavior changed.

### Fixed

- A closed `.flyout[popover]` is no longer rendered. The component's own
  `display: grid` outranked the UA rule that hides a closed popover, leaving
  the panel painted at its static position with no way to dismiss it. Both
  `.flyout` and `.tooltip` now cede the platform's hidden state, which also
  gives the native path the exit fade it lacked.
- Icon-only buttons stretch to match labelled siblings when composed in a
  `.join`, while remaining square everywhere else.
- Status messages originating in an open dialog temporarily mount the singleton
  live region inside that dialog, keeping it visible and accessible in the
  active top-layer subtree.

### Known limitations

- A surface managed by `surface.js` is presented in the document's own context,
  not its trigger's. Opening it moves the panel to the nearest dialog or to
  `body`, which severs every scope that reached it by inheritance — a theme
  island, a density scope, `.inverted`, or an application's own scoped custom
  properties. Do not rely on inheritance reaching an anchored surface. See
  `docs/design-notes/surface-reparenting.md`; the repair needs a transport that
  promotes without relocating, which is not available across the current
  Minimal floor.

### Breaking

- Replaced `floating.js` by `@lekoala/floating`.


## [0.6.0] - 2026-09-03

### Changed

- `.list` are now top-aligned.
- `.aura` improvements.

### Breaking

- Reworked completely the `.steps`. Read the updated documentation for changes.
- The framework query-container name is now `actual-container` instead of
  `actual-grid`. `.container-query` is unchanged.

### Fixed

- `.fab` icons.
- `.floating-field` with password managers.


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
