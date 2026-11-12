# Actual CSS Changelog

## [Unreleased]

### Added
- `.reveal` and `.reveal-group`: one-shot entrance effects driven by the new `data-enhance="in-view"` token, with `data-in-view-margin`, `--reveal-duration`, `--reveal-distance`, and `--reveal-stagger`.
- `.mark-sweep`: a highlight that sweeps in behind a phrase, reusing the new `--mark-bg` / `--mark-fg` theme pair.
- `mark`: a theme-tuned highlight pair in both schemes, with `Mark` / `MarkText` in forced colors.
- `bun run report:paint`: renderer CPU, main-thread time and frame pacing per page, to compare animation variants.
- `docs/design-notes/motion-cost.md`: what an animation costs per frame, with the Aura measurements and `scripts/fixtures/aura-paint.html`.
- `demo/templates/blocks.html`: notification preferences composition with Email and Push switch columns.
- `demo/templates/focus-bench.html`: component focus samples, validation alternatives, surface and theme islands, and computed-style inspection of a live data grid.
- `demo/templates/border-contrast.html`: `--border-control` at 25, 35 and 45 % of ink in both schemes and on two surfaces, with the edge measured live against the control fill and the panel, and the mix that silently does nothing on a plain container.
- `--rating-star-outline`: the default star as an outline, for `--rating-star-empty`.
- `cyberpunk` theme: ink rating stars with outlined empty stars.
- `neon` theme: rating stars as lit and unlit primary tubes.
- `material` theme: Google Yellow rating stars over `--border`.
- `demo/sites/neon-ramen`: read-only ratings on the home stats and the Spicy miso page, a "Rate your last bowl" input on the order page, and neon-tube stars in `neon-site.css`.

### Changed
- `.rating`: stars are gold by default instead of `--warning`; set `--rating-color` on `.rating` to restore it.
- `.rating`: empty stars tint `--text` into `--surface` instead of using `--border`, so ink-bordered themes no longer draw them black.
- Docs: the Rating page shows neutral, outlined and custom-symbol stars, and the theme rule that sets them.
- Docs: Rating form examples use `.field-group.flush`, adding `.field` only with help or error text.
- Docs: `--border-control` states the `--surface-subtle` ratio, why `--border-control-mix` needs a theme boundary, and the two ways to soften controls — the theme mix or `--control-border` on the fields.
- Switch docs and demo templates use native checkbox state without redundant `aria-checked` synchronization.
- `.switch`: the border follows the track fill, including checked and disabled states, and unchecked hover uses a subtle neutral fill.
- `:focus` uses local `--focus` for generic outlines; `--focus-outline-color` remains an inherited override, and invalid fields keep their validation color.
- `.nav-list`: a nested `.nav-list` hangs from a rail under the parent's icon, its labels still aligned with the parent label.
- `.nav-list`: `--nav-list-icon-size` (the leading icon width) replaces `--nav-list-indent`.
- `.nav-list`: `--nav-list-rail-color` sets the nested rail; `transparent` hides it and keeps the alignment.
- `.shimmer`: the band has a fixed width, crosses the whole label, then rests before the next pass.
- Docs: Aura repaints every frame; reserve it for one or two objects per view.
- `--duration-shimmer` slows from 1.2s to 2s, pacing `.shimmer`, `.skeleton` and indeterminate `.progress`.
- `.switch`: `--switch-knob-margin` increases from 8% to 10% of the track height, giving the knob more breathing room.

### Fixed
- `fixtureUrl()` keeps a page's query string and hash instead of escaping them into the file name.
- `.shimmer`: the sweep runs right to left in right-to-left text.
- `demo/templates/blocks.html`: table filters share one wrapping cluster so the status and owner selects sit side by side when space permits.

## [0.18.0] - 2026-11-11
### Added
- Docs: "Coding agents and DESIGN.md" guide — the skill, `PRODUCT.md`/`DESIGN.md`/`PROJECT.md` ownership, and working with a design skill such as Impeccable.
- Starter skill: reads the project's `DESIGN.md` after `PROJECT.md`.
- Starter skill: `PROJECT.md.example` gains a "Design mapping" section from `DESIGN.md` roles to Actual classes.
- `demo/templates/alerts.html`: alert icon alignment bench — icon sources, icon sets, text fonts, text sizes, line heights, icon sizes, message shapes, actions and lists, variants, mixed timeline markers and the neo-brutalist tile, with optional box guides.
- `demo/templates/carousel.html`: a hero carousel from one scroll-snap list, with full-width slides, native scroll buttons for previous/next and scroll markers as dots.
- `.list.grouped`: opt-in raised surface, border, rounded shell and inline gutter for standalone lists; `--list-radius` is the new hook.
- `neo-brutalist` and `glass` themes: `.list.grouped` joins the framed-surface and frosted-panel treatments.
- Docs: the List page composes grouped active-sessions and member rows, including a `surface sm` pill action, a badge and a row flyout.
- `.timeline-dates-end`: each event's `<time>` sits at the end of its first line instead of above it.
- `.timeline`: an icon slot with an intent gets a soft tinted disc, rim and ink, following `--soft-bg-mix` and `--soft-border-mix`.
- `--timeline-glyph-size`: icon and spinner size in a timeline slot, half the slot by default.
- `--timeline-marker-nudge`: moves the whole timeline marker off the first line box's centre, like `--alert-icon-nudge`.
- Docs: the Timeline page shows an in-progress event with a `.spinner` inside the icon slot.
- Docs: the Timeline page composes an activity feed with avatars, a `.chat-bubble` comment, a `.badge` status and a file `.btn`.

### Changed
- Docs: the site loads Inter for its own pages; the framework keeps the platform faces, so a consumer's page depends on no locally installed family.
- `.btn.surface`: hover paints an opaque ink mix, so a surface button still shows feedback on a dark theme.
- `demo/templates/data-grid.html`: `data-grid-component` 3.10.0, with the grouped page-size footer, the floating bulk bar and one quiet control edge.
- `.btn.outline`: a neutral outline takes `--border-control`; an explicit intent keeps its color.
- Docs: the search panel opens on its destination quick links, keeps the close in the header row, and pins a keyboard footer below a scrolling result list.
- Docs: the header search opener is a quiet surface button on the control edge that shows `⌘ K` on macOS and `Ctrl K` elsewhere.
- Docs: the sidebar lists one destination's pages as static group sections instead of collapsible, indented rows.
- Docs: page-end navigation is two cards (Previous / Next); the source links are quiet text links.
- Docs: the header marks the active section by ink alone, so only the sidebar row is filled.
- `.timeline`: `--timeline-slot-size` defaults to `2rem`, and the dateline uses tabular numerals.

### Fixed
- A bare checkbox or radio focuses in `--focus`; the core currentColor fallback painted the ring in the text ink, so it read as untinted on a dark surface.
- Docs: card hover lifts to `--border-control`; the former `--border-strong` was never a token, so `border-color` fell back to `currentColor` and drew a full-contrast ring.
- `check:docs` rejects a `var()` in the site chrome whose token no stylesheet declares.
- `.timeline`: an avatar or icon slot taller than the line box stays inside its event instead of overflowing the list and eating into `--timeline-gap`.
- `.alert-icon`: centred on the first line box from `--alert-line-height`, `--alert-font-size` and `--alert-icon-size` instead of a fixed `0.125em`; `--alert-line-height` and `--alert-icon-nudge` are the new hooks.
- `.alert.admonition > .alert-title > .alert-icon`: an icon in the admonition title bar takes `.alert-icon` and follows `--alert-icon-nudge`.
- `.alert > .close`: centred on the first line box and no longer grows the title row, which pushed the body down.
- `.alert > ul`, `.alert > ol`: bullets start on the text column's edge instead of the 40px UA indent.

## [0.17.1] - 2026-11-08
### Added
- Docs: a "Skip to content" link is the first tab stop on every page.
- Docs: search results link to the matching section, show their group, and say when nothing matched; a result on the current page closes the search.
- Docs: the homepage links to the Actual Blocks gallery under "Start building".
- Docs: collapsed sidebar groups stay collapsed for the session; the current page's group always opens.
- Docs: search matches `--hooks` and `.classes` as whole names.
- Docs: live color swatches on the Tokens page follow the selected scheme and theme.
- `actual-css contrast` and `report:theme-contrast` measure the resting edge of a field, checkbox and radio (3:1).
- Docs: a Components overview lists every component and pattern as a card; the Components destination opens on it.
- Docs: `<!--docs-index:<group>-->` in a page expands to a card per page of that group.
- `--border-control-mix` sets the ink share of `--border-control` (45%).
- `check:templates` rejects `@latest` and bare-major CDN URLs in demo and docs templates.

### Changed
- `--border-control` derives from `--text` and `--surface`, reaching 3:1 on the default palette; it equals `--border` only without `color-mix()`.
- `.nav-link`: the current and hover fills are paler, 8% and 5% of the link's ink (were 18% and 10%), so a current row no longer reads as a pressed button.
- `.input-icon`: the text sits half a `--control-pad-x` from the icon instead of a full one, on both sides.
- `.join`: adjacent filled buttons (default, `.solid`, `.soft`) draw a hairline seam, so the group no longer reads as one button.
- `.alert.callout`: the leading corners take `--radius-sm`, so the flag stays a straight bar.
- `--line-height-relaxed` is 1.6 (was 1.75); `.lead` and `.text-lead` read tighter.
- `.prose`: `pre` and tables use `--line-height` instead of the prose reading leading.
- Docs: page titles use sentence case, and the Components navigation is alphabetical.
- Docs: tables span the content column; class reference tables reflow on phones.
- Docs: the homepage presents the named themes as demos of the theme contract and counts components instead of themes.
- `forest`, `sunset`, `ocean` themes: `--border-control-mix: 49%`, clearing 3.2:1 in light.
- `glass` theme: `--border-control-mix: 75%`, a light rim clearing 3:1 over the whole backdrop.
- Demo and docs templates load Tabler Icons `3.46.0` instead of `@latest` or `@3`.
- Docs: Badge recommends a photo or a single initial in default and `.sm` person chips; two-letter initials need `.lg`.
- Docs: the Aura, Chat, Floating action button, Shimmer, Floating labels and OTP pages open on their description, not their module note.

### Fixed
- `.floating-field`: a `.select` keeps its label headroom under the `appearance: base-select` enhancement instead of drawing the label over the value.
- `.accordion.flush`: a `<ul>` or `<ol>` panel directly after `<summary>` keeps its marker gutter instead of hanging its bullets outside the panel.
- Docs: the homepage alerts use `danger` and `primary` (`error` and `info` do not exist) and drop `role="alert"`.
- Docs: `check:doc-classes` also checks the docs page templates.

## [0.17.0] - 2026-11-06
### Added
- `demo/templates/changelog.html`: a release changelog composed from `.timeline`, with a meta column and a scroll-driven light on the rail.
- `.drawer`: `data-side="bottom"` makes a bottom sheet, content-sized up to `--drawer-size` or 85% of the viewport, clear of the iOS home indicator.
- `adaptive-surface.html`: the bottom drawer uses `data-side="bottom"`; the page keeps only the choice of surface.
- `.sidebar-shell`: a persistent `aside` beside the main region from `64rem`, each scrolling on its own; below, the aside hides and the document scrolls (`--sidebar-shell-size`).
- Docs: Sidebar Shell page with the drawer-closing `matchMedia` recipe; the navigation-list page links to it instead of printing a `.shell-sidebar` recipe.
- `actual-css/js/dirty`: `data-enhance="dirty"` sets `data-dirty` on a form while its submittable data differs from the baseline, and dispatches `actual:dirty-change`.
- `FormDirty.capture()`, `FormDirty.markClean()` and `FormDirty.refresh()` move the baseline after an in-page save or programmatic edits; `data-dirty-ignore` leaves a control out.
- Docs: Unsaved Changes page with `beforeunload` and autosave recipes.
- `actual-css/js/ajax`: `data-enhance="ajax"` submits a form through `fetch` as a native submission would, and leaves the cases it cannot reproduce to the browser.
- `data-ajax-target`: an HTML answer with a 2xx or `422` status replaces the target's content.
- `actual:ajax-start`, `actual:ajax-response` and `actual:ajax-error` report an ajax submission; see the Ajax Submission page.
- `actual:tab-change` bubbles from a tablist after the selected tab changes, with `{ tab, panel, previousTab }`.
- `data-dialog-open` opens a dialog at load; on a dialog that also has `open`, it upgrades the no-JS rendering to a modal.
- `actual-css/js/focus`: `nextTabStop(node)` returns the first tab stop after an element, outside it.
- `.nav-link`: `--nav-current-bg` and `--nav-current-fg` restyle the current link.
- `.nav-link`: a default `gap` for icon + label rows.
- `.nav-link`: `aria-current="true"` marks a section link whose section holds the current page, as on `.tab`.
- `.nav-list`: a `<summary class="nav-link">` gets a chevron that follows `[open]`, and a nested `.nav-list` is indented (`--nav-list-indent`).
- `.segmented.vertical` stacks the segments in one column; a segmented tablist with `aria-orientation="vertical"` does the same.
- `.rating`: `--rating-star-empty` draws empty stars in their own shape, such as an outline, on inputs and read-only displays.
- Docs: Rating page shows the component in context and with custom star shapes.
- Docs: Anatomy trees on the Rating, Alert, Segmented and Color swatches pages.
- Docs: six destinations in the header (`destinations` in `docs/navigation.json`); the sidebar lists the current one's groups, the drawer all of them as a grid.
- Docs: the homepage opens on six working panels composed from the framework (appearance, review, order, invoices, sharing, chat).
- Docs: Rating page has a required-rating scenario with its field error.
- `.flyout.scrollable`: the header and footer stay in view while the one body region scrolls.
- The `material` theme slides the `.table` row hover between rows through anchor positioning.
- Docs: Table "Sticky headers" — a header stuck to the page, and a header row and first column stuck in a scroll box.
- Docs: Empty State pattern, with the no-results case returning focus to the search field.
- Docs: Stat pattern — label, value, detail and a signed trend, inverted when lower is better.
- Docs: Column Layout "Uneven feature grids" for bento and mosaic layouts with `grid-row`.
- Docs: Accessibility page shows a label hidden on narrow screens only, with the `.sr-only` declarations in a media query.
- Docs: product-wide density is `class="compact"` on `<html>`.
- Docs: `.join` takes `role="group"` only for several controls acting as a set, not for an input with one attached button.
- Docs: Ajax — a server that issues a CSRF token per submission re-renders the form with its answer.
- Docs: Flyout "Panel with actions" — a named `<form>` flyout, and closing a validating form with `closeSurface()` from its success path.

### Changed
- `.nav-link`: the current link takes `--text` ink on a fill one step above hover instead of the selected accent; `--state-selected-text` no longer applies to it.
- `.nav-list`: the current-link trait only shows in forced colors; horizontal `.nav-link` gets an underline there.
- `.color-swatch`: the checked mark is one `--text` ring outside the swatch, past a transparent gap, instead of a double ring inset on the color.
- `.color-swatch`: `--color-swatch-radius` inherits, so one declaration on the palette shapes every swatch.
- Docs: demo previews sit on a faintly tinted stage with more padding; the code below them returns to the plain surface.
- Docs: demo code opens with a bar holding its language and the Copy button, which no longer covers the first line.
- `.rating`: stars sit `--space-10` apart instead of `0.1rem`, and each radio's hit area is `--space-20` taller than its star.
- `[aria-busy]` overlay: fades in after `--busy-delay`, so a fast request no longer flashes it.

### Fixed
- `.modal`: a modal authored inside `.stack` or `.cluster` opens centered instead of pinned to the top of the viewport.
- `ajax.js`: restores the form's and submitter's authored `aria-busy` after a request instead of removing it, so a resting last-child `.spinner` stays hidden.
- `dialog.js`: with `data-dialog-view-transition`, a submitter's `formmethod` decides whether a submission closes the dialog, and a control named `method` no longer breaks it.
- `dialog.js`: a dialog closed and reopened in the same task keeps `has-modal-open` and its focus target when the queued `close` event arrives.
- `--dismiss`: focus inside the dismissed target moves to the next tab stop instead of staying on the hidden close button.
- `validation.js`: picking a radio in a required group clears `aria-invalid` on every radio of the group, so its `.field-error` hides.
- `.drawer`: the body's scrollbar sits on the panel edge and the content keeps `--drawer-pad` on both sides instead of running up to the scrollbar.
- `.btn.icon-only` stays square beside a full-width control in a `.join` or flex row instead of shrinking.
- `.segmented` in `.compact` matches the `.btn` height instead of standing 1px taller.
- `.select` with the customizable picker in `.compact` matches the `.input` height instead of standing 2px taller.

### Removed
- Docs: the Ajax forms recipe in the progressive enhancement guide; use `data-enhance="ajax"`.

## [0.16.1] - 2026-11-04
### Fixed
- `.field-group.flush`: the legend takes the `.field-label` size (`--control-font-size`) instead of the framed legend's `--font-size-xs`.
- `status.js`: the status bar rises above a `.form-actions.sticky` bar docked to the bottom edge instead of covering its submit button.
- `.choice-card` and `.choice-card.chip`: hover preserves the selected border and only applies on devices that support hover.

### Added
- `.chat`: `--chat-avatar-align` places the avatar beside the header (`start`) instead of the last line (`end`, default).
- `demo/templates/playful-faq.html`: a separated accordion with a pill marker and a CSS-only open/close animation, linked from the accordion docs.
- `demo/templates/card-rail.html`: one list as a grid on wide and a `.scroll-snap` rail with CSS scroll markers on narrow, documented in the scroll-snap docs.

### Changed
- `date-fields.html`, `contrast-contexts.html`, `neo-brutalist.html`: `@lekoala/date-picker` 0.6.1; `date-fields.html` shows its locale entry mask.

## [0.16.0] - 2026-10-29
### Fixed
- `dialog.js`: dialogs inside custom elements or shadow roots keep their native lifecycle and commands unless delegated with `data-enhance="dialog"` or the dialog API.
- `.range`: the `[dir="rtl"]` fill fallback is its own rule, so browsers without `:dir()` keep it.
- `.range`: an LTR island inside an RTL region fills from the left.

### Added
- `enhance()` accepts a third `{ accept }` argument to filter lifecycle membership across subtree moves.
- `components.json`: a `docs` URL per component, read from the CSS `Docs:` header (tab → `enhancements/tabs.html`, join → `forms/joined-controls.html`).
- `actual-css/tokens.json`: the public global tokens, generated with `components.json` and verified by `check:catalog`.
- `menu.css`: `Docs:` header pointing at the flyout page.
- `.field-group.flush`: a fieldset without its frame, the legend as a plain label above the options.
- `.rating[role="img"]`: read-only rating display on one element, with `--rating-value` (fractions draw partial stars) and `--rating-max`.
- Avatar docs: an initials trigger keeps its initials in the accessible name (WCAG 2.5.3).
- Card docs: group a title and its subtitle in an `<hgroup>` inside the header slot, which splits direct children.
- Progressive enhancement guide: which runtime entry to load with a bundler, per enhancer, or without a build step.
- Steps docs: a word wider than its share breaks inside the word; `--step-min` keeps whole words.

### Changed
- `.avatar-stack`: default `--avatar-stack-overlap` is an eighth of the size instead of a quarter, so two-letter initials stay readable.
- Choice cards docs: the first demo groups cards in `.field-group.flush`.
- `package.json#homepage` points at the docs site (`/actual-css/site/`) instead of the redirect page.
- `tokens.css` and `theme.css` headers list their internal tokens in an `Internal:` section; `--surface-link` is internal.
- `generate:catalog` fails when a file outside core lists a public global token under `Internal:` without a `(local value …)` note.
- Bun 1.4.4 (`packageManager`); CI reads the version from there.
- `data-grid.html`: `data-grid-component` 3.8.0, with row details in the component's own modal dialog.
- `data-grid.html`: sets the `--modal-size` and `--modal-pad` hooks the data-grid theme reads for that dialog.
- `data-grid.html`: grid buttons use `.btn.surface` instead of `.btn.outline`, so pagination and row actions keep the theme's light border.
- `date-fields.html`, `contrast-contexts.html`, `neo-brutalist.html`: `@lekoala/date-picker` 0.6.0.
- `combobox.html`, `contrast-contexts.html`, `neo-brutalist.html`: `@lekoala/combobox` 0.8.0.

## [0.15.1] - 2026-10-26
### Changed
- Reset: `-webkit-tap-highlight-color: transparent` on `html`, so the rectangular native tap flash no longer covers rounded controls.
- Bare links thicken their underline on `:active` as well as `:hover`, as touch feedback.
- Bare text links (`a[href]` with no class) keep a tap flash tinted from their own color.

## [0.15.0] - 2026-10-18
### Added
- `.tabs-attached` and `.tab-panel`: folder-style horizontal tabs joined to their panel, with shared surface, padding and shadow hooks.
- `--control-default-bg`: inherited resting field fill shared with external widget bridges.
- `theming.md`: a custom button focus recipe that preserves the outline and elevation when focus and hover coincide.
- `modular-import.md`: replacing a component while keeping its markup, states and theme tokens, with a minimal Steps recipe linked from Philosophy.
- `neo-brutalist` demo theme: pastel intents under black ink, offset shadows on framed objects, lifting buttons, a plus accordion marker.
- `demo/templates/neo-brutalist.html`: a risograph print studio page on that theme, with page-loaded fonts.
- Theming docs: where a font goes when a theme is in use (`:root`, not `[data-theme]`).
- Card docs: tones (`.card.soft` plus an intent class).
- Date picker docs and `date-fields.html`: the token bridge maps the panel shadow to `--shadow-popout`.
- `--btn-shadow`: a resting button elevation that inherits and that the solid hover overlay keeps.
- `--control-shadow`: a resting elevation for `.input`, `.textarea` and `.select` that keyboard focus keeps.
- `--table-header-bg` and `--table-header-fg`: theme hooks for the `.table` header band, also read by the data grid template bridge.
- `--accordion-marker-icon` and `--accordion-marker-open-rotate`: swap the accordion marker glyph and its open turn (plus to cross with `--icon-plus` and `45deg`).
- `.badge > .avatar`: a leading avatar sized to the badge for person chips (mention, assignee, contributor).
- `.timeline`: vertical history of dated events, with intent dots and an optional avatar or icon slot.
- Dashboard and Admini demos: activity feeds use `.timeline` instead of local feed CSS.
- Diagrams docs and `diagrams.html`: Pele 1.6.0 on Actual tokens through a demo `<pele-diagram>` web component.
- File upload docs and `file-upload.html`: Dropzone 6.3.5 rows composed from `.list`, `.progress` and `.close`, and FilePond 5.0.0-beta.74 on a `--default-*` token bridge.

### Fixed
- `::selection`: SVG text uses the theme's selection foreground, keeping Pele diagram labels legible when selected.
- `.card.solid`: bare and `.prose` links follow the card's text color at rest, hover and keyboard focus, including when a theme sets `--link`.
- `.skeleton`: `--skeleton-track` and `--skeleton-highlight` are translucent ink tints, so a placeholder keeps its edges on cards, soft cards and dark surfaces.
- `.choice-card.chip`: `--state-selected-text` takes priority over explicit intents to keep checks legible on light selected fills.
- `.alert` with `.alert-icon`: an icon taller than one line, or an alert stretched by an equal-height grid, no longer opens a gap between the title and the body.

### Removed
- The `bootstrap-v6` demo theme: the core focus line and field treatment it demonstrated are now the defaults.

### Changed
- `.badge > .close`: a trailing disc inside the pill, mirroring a leading `.avatar`; a transparent hit area keeps the 24px target.
- `edge` theme: the default button drops its hover overlay through `--btn-hover-overlay` instead of `box-shadow: none`.
- Date picker docs and demos: `@lekoala/date-picker` 0.5.1; focus maps through `--dp-focus` / `--dp-focus-width` instead of two override rules.
- Date picker docs and demos: `setDefaultControlClasses()` gives every calendar header real `.select`, `.input` and `.btn` controls.
- Combobox docs and demos: `@lekoala/combobox` 0.7.1; the control reads `--border-width`, `--control-shadow` and `--control-hover-border` like `.input`.
- Combobox docs and demos: `setDefaultChipClass()` gives every chip the `.badge primary` skin without per-element attributes.
- `data-grid.html`: `data-grid-component` 3.7.0 with `themes/actual.css`, global Actual control classes and responsive column disclosure.
- `contrast-contexts.html` and `neo-brutalist.html`: combobox and date picker bridges follow the current recipes (0.7.1 / 0.5.1).
- `@lekoala/floating` 0.3.1: `repositionAt()` throws on an unknown placement outside a browser too.

## [0.14.1] - 2026-10-14
### Added
- `actual-css/js/enhance` logs a console warning when a second copy of the runtime loads (dist bundle plus source modules, or two bundles).

### Changed
- `@lekoala/floating` 0.3: a wrapped inline trigger flipped above anchors to its first line, and start/end alignment follows CSS `direction` without a `dir` attribute.
- `data-tooltip-placement` and `data-flyout-placement`: an unknown value logs one console warning and falls back to the default placement.
- `dist/`, `site/` and `demo/assets/` are no longer committed: run `bun run build:all` after a clone; npm, GitHub releases and Pages ship the CI build.
- GitHub Pages deploys from CI (`build:pages`, `scripts/pages.js`) instead of serving the branch.

### Fixed
- `.color-swatch`: an inline swatch (a flyout trigger beside its label) centers on the text instead of sitting above the baseline.
- `data-enhance-config`: a relaxed config keeps `key:`-like text inside a double-quoted string (`{url: "http://x"}`) instead of throwing.

## [0.14.0] - 2026-10-13
### Breaking changes

- `--soft-border-mix` has no default: read it as `var(--soft-border-mix, 100%)` for the soft tint or `var(--soft-border-mix, 65%)` for the opaque `.soft` mix.

### Added

- `.color-swatch`: palette color on a native radio or checkbox, or a `<button>` opening a palette flyout, with `--color-swatch-value`, `--color-swatch-size` and `--color-swatch-radius`.
- `.segmented` / `.segment`: segmented control for radios, a `role="tablist"` or navigation links, with `--segmented-bg`, `--segmented-pad`, `--segmented-radius`, `--segmented-fg`, `--segmented-selected-bg` and `--segmented-selected-border`.
- `demo/templates/order-management.html`: one state at three levels — a badge in a selectable list, a contextual alert, and a notification with its own action — plus a critical alert, with no new framework API.
- `prefers-reduced-transparency: reduce` paints `.topbar` and `.form-actions.sticky` opaque without backdrop blur.
- The glass demo theme switches to opaque surfaces and drops its blur under `prefers-reduced-transparency: reduce`.
- `shot:states` accepts a `transparency` state.
- `--switch-knob-inline-size` sets the switch knob width for a capsule knob; the travel follows it.
- `demo/templates/settings-ios.html`: iOS-like controls and grouped settings from unchanged markup, with the local CSS each gap needs.
- `admin-neutral` demo theme: light-only business interface with a grey page, white cards, neutral actions and flat semantic tints.
- `--state-selected-text`: selected ink on a regular surface (current `.nav-link`, selected `.tab`, current step number and ring), falling back to `--state-selected`.
- `actual-css contrast` measures selected ink on each surface and the solid `-fg` pairs; a gradient fill reads n/a.
- `components.json`: `pseudoElements` lists the `::before`/`::after` each component generates, keyed by the element that owns them (`.nav-link`, `.accordion summary`).
- `actual-css design` writes a portable `dtcg/` token profile beside `figma/` and `penpot/`, with spec `$types` (`fontWeight`, `fontFamily`, `duration`, `cubicBezier`, `number`) and the font stacks, line heights and motion `figma/` drops.

### Fixed

- `.color` shows a round swatch the height of a `.switch` on a control-sized hit area, with the focus ring on the swatch; `--color-size` sets it.
- A flyout no longer closes when the arrow keys or Space move through a radio group inside it.
- Opening a flyout from the keyboard focuses a radio group at its checked radio, not its first one.
- `.list-item` moves its trailing region to a new line when it no longer fits beside the longest word, instead of breaking `.list-item-title` mid-word.
- `.truncate` inside `.list-item-content` keeps the trailing region on its line.
- `actual-css design` writes DTCG colors with a 6-digit `hex` and `alpha` separate; Penpot still receives the alpha in its hex.
- `.scroll-snap` keeps a focused item's ring inside its own clip on all four sides.
- `.alert.compact` and `.alert.spacious` step `--alert-pad-block`.
- `.close` stays visible in forced colors on a light-on-dark ink such as a `.solid` admonition title.
- `.app-nav` frames the current tile in forced colors with a transparent border on a `::before` overlay, so selecting a tile never shifts its icon or label and no `Highlight` repaint is needed.
- `--state-selected-text` resets on every theme boundary, so a nested theme island reads its own `--state-selected` instead of inheriting the parent's selected ink.
- Demo themes clear 4.5:1 on their solid pairs: bootstrap-v6 primary, success and danger; spruce and petrol warning; petrol secondary; edge warning; brutalist secondary and danger.
- Demo themes set `--state-selected-text` where the primary cannot be both fill and page text: bootstrap-v6, brutalist, cyberpunk, gradient, ocean, square, sunset.
- bootstrap-v6 filled badges keep their fill on hover.
- The edge demo theme's default button reads its intent through `--soft-fg-mix`.
- The glass demo theme keeps the default `--soft-bg-mix` and sets `--soft-border-mix: 70%`, so soft tints show their intent.
- `.alert.admonition` title bar follows `.solid`, `.surface` and `.outline`; `.solid` previously left white ink on the soft tint.

### Changed

- `admin-neutral` uses emerald success fills with white solid ink, amber warning fills with dark ink, lighter neutral badges and white admonition bodies with neutral frames.
- `demo/templates/order-management.html` softens the address notice, makes New order secondary and tightens the Orders header.
- `demo/templates/order-management.html` pins `admin-neutral` and adds an Orders-list composition beside the existing three-level narrative.
- `.alert.admonition` `.alert-title` is semibold.
- `.alert.admonition.solid` frames its body with the neutral `--border` instead of the intent.
- `.badge`, `.alert` and `.btn.soft` paint a translucent intent tint with no rim; the shared `.soft` on `.card`, `.navbar`, `.app-nav` and `.chat-bubble` stays an opaque mix.
- `--soft-hover-alpha` defaults to `6%`.
- `actual-css contrast` measures soft pairs composited on `--surface`, `--surface-raised` and `--surface-subtle`.
- Demo themes retune `--soft-fg-mix` (bootstrap-v6, corporate, cyberpunk, dim, edge, gradient, indigo, lavender, material, square) and `--soft-hover-alpha` (lavender, neon) for the soft tint.

## [0.13.0] - 2026-10-06
### Breaking changes

- `--cluster-justify`, `--cluster-align` and `--cluster-wrap` no longer inherit into nested `.cluster` rows; set them on the row itself or select nested rows.
- `--grid-columns` and `--grid-min` no longer inherit into a nested `.grid`.
- `.avatar-stack` no longer infers its size from child `.avatar.sm`/`.lg`; set `.sm`/`.lg` on the stack and omit size classes on its avatars.
- `--focus-outline` has no default value: it is a fallback-only hook that replaces the generic focus line; read `var(--focus-ring-width) solid var(--focus-outline-color)` instead.
- `data-enhance="tabs"` needs `role="tablist"` on the same element; without it the runtime warns and wires nothing.
- `.nav-link` shows its current state only for `aria-current="page"` or `"location"`, and `a.list-item` only for `"page"` or `"true"`; any other value, `"false"` included, is inert.

### Added

- `actual-css/js/full` now exposes `enhance`, `applyEnhancement`, and `registerEnhancement` from the same runtime that registers the built-ins.
- `--tab-flex` on `.tabs` sets each tab's flex; `1 1 0` gives equal-width tabs.
- In supporting browsers, an overflowing link `.tabs` strip or `.steps-horizontal` row starts scrolled to its `aria-current` item, with no runtime (`scroll-initial-target`).
- `--border-control` sets the resting edge of fields, choices, switches, OTP cells, choice cards, `.join-addon` and the color and file inputs; it defaults to `--border`, which keeps separating surfaces.

### Changed

- `.steps-horizontal` fits short labels on a phone, wraps (and hyphenates) long names, and aligns its outer stacked steps with the row's edges at every width.
- `.steps-horizontal` `--step-min` defaults to the marker width and only sets a wider budget; `--step-gap` also separates adjacent steps.
- `forms/form-actions` no longer has to load after `layout/cluster`: `.form-actions` relays its hooks into the row's `--cluster-*`.
- An overflowing horizontal `.tabs` strip shows its selected tab in full, at connect and whenever selection changes, scrolling the strip only.
- `.floating-field` accepts its `.field-label` before or after the control; state is read through `:has()` on the cell.
- `.list-item` regions center on the row by default; add `.items-start` to the row or the `.list` for rows with long supporting text.
- A horizontal `.tabs` strip never wraps, nor do its labels: a strip that does not fit scrolls horizontally.
- `.breadcrumb` never wraps: a trail that does not fit truncates its labels with an ellipsis, ancestors before the current page.
- A navigation flyout `.tab` shows the current state with `aria-current="true"` while its panel holds the current page.
- `.breadcrumb` ancestor labels truncate on their `<a>` or `<span>`; the current page also truncates as bare text in an `<li aria-current="page">`.
- The current `.nav-list` link trait sits inside the row's inline padding with rounded ends, instead of flush on its rounded edge.
- A horizontal `.tabs` strip hides its scrollbar; selecting or focusing the clipped tab scrolls it into view.
- An overflowing horizontal `.tabs` strip fades the edges it can still scroll toward, where scroll-driven animations are supported.
- `.scroller` no longer styles the scrollbar on touch screens, where the native overlay scrollbar, hidden at rest, stays.

### Fixed

- `actual-css contrast --theme FILE` and `actual-css design --theme FILE` accept a theme written on `:root` and measure its own values, not the default palette.
- A default `.btn.outline` in a field `.join` takes `--border-control` like the field, not `--border`.
- The scrolling body of a `dialog.modal.scrollable` and a `dialog.drawer` keeps the focus line of its first and last controls inside its clip.
- `actual-css contrast` and `actual-css design` detect a theme written `[data-theme = "brand"]` or `[data-theme=brand]`, and ignore selectors quoted in comments.
- `actual-css contrast` measures a theme whose name contains `&` or `<` under its own name, instead of an island the name had broken.
- `actual-css contrast` and `actual-css design` reject a `--name` the theme file does not declare as `[data-theme]`, instead of measuring the framework defaults.
- A bare heading in a `dialog.modal > header` drops its block margins, so the band no longer grows and the title centers on the close.
- A `<nav>` around `.breadcrumb` or `.tabs` shrinks inside a flex or grid row, so the trail truncates or the strip scrolls instead of the page.
- An enhanced tablist no longer operates the tabs of a nested `role="tablist"` that has no `data-enhance="tabs"`.
- A tablist with `data-enhance="tabs"` sets its roving tabindex when a classic script in `<head>` connects it before its tabs are parsed.
- The generic focus line of links, `summary` and nav items follows a `--focus-ring-width` set on a `[data-theme]` island or any region, like the `.btn` ring beside it.
- The focus reserve of a scrolling dialog or drawer body is `--focus-outline-offset` + `--focus-ring-width`, no longer widened by `2 × --border-width`.

## [0.12.0] - 2026-10-02
### Breaking changes

- `.actions` is removed; compose a `<menu>` (or `<ul>`) with `cluster` for a row, or `stack list-reset` for a vertical list.
- `.navbar-nav` is removed; the horizontal link list is a `.cluster` with the framework `--gap`.
- `.dialog-confirmation` is removed; compose `.media` with `.dialog-icon`, then `<footer class="bleed background-subtle cluster justify-content-space-between">` (recipe in `docs/pages/components/dialog.md`).
- The `dialog.modal` body `<footer>` has no layout of its own; compose its row as `<footer class="cluster justify-content-end">`, as in the drawer.
- `--modal-header-bg` is removed; put a `.background-*` utility on the `dialog.modal > header` band.
- `.form-actions` no longer lays out its row; write `class="cluster form-actions"` (`--form-actions-justify` and `--form-actions-align` still apply).
- `.form-actions` drops its top margin and `--form-actions-margin-block-start`; space it from the fields with `.stack` on the form.
- `.justify-content-*` no longer sets `--cluster-justify`, so it aligns only its own element, never a nested `.cluster`.
- `.card` header and footer rows drop to zero specificity: `.media`, `.cluster`, `.form-actions` and `.justify-content-*` on a slot now take over its layout.
- `--font-width-dense` is removed; set `font-stretch` on an element that should render condensed.
- A theme sets `--control-pad-x-sm` / `-md` / `-lg` instead of `--control-pad-x`, which `.sm`/`.lg` and `.compact`/`.spacious` now select from.
- A theme that sets its own control steps re-selects them in its block to work as a nested island (recipe in `docs/pages/foundations/tokens.md`).

### Added

- `actual-css contrast [--theme FILE]` (Bun) measures a theme's soft, focus, invalid-focus and inverse pairs in each declared scheme, and exits 1 on a miss.
- `.tight` and `.loose` set the inherited `--gap` to `--space-20` / `--space-50` alone, without the padding or control size of `.compact` / `.spacious`.
- `docs/pages/guides/upgrading.md` lists the edits a 0.11 project needs for 0.12.
- `.items-baseline` aligns children on their first text baseline and sets `--items-align`, completing the `.items-*` series.

### Changed

- An action row composed from `.cluster` inherits the framework `--gap` (0.75rem); the removed `.actions` set 0.5rem. Use `.tight` for the tighter rhythm.
- `.cluster` removes the native list chrome (`margin`, `padding`, `list-style`) from a `ul`, `ol` or `menu` it is applied to; the element stays a list in the DOM.
- A heading that is the first child beside a leading `.dialog-icon` in a `.media` row centers on the icon anywhere, not only in a dialog.
- A `dialog.modal` or `.drawer` header gives back its corner-close room when the dialog contains no `.close`; without `:has()` the room stays.
- `.compact` and `.spacious` no longer set `font-stretch`: density changes rhythm and geometry, never typography.
- `.compact` and `.spacious` select `--control-pad-x-sm` / `-lg`, so density controls get narrower or wider, not only shorter or taller.
- `.sm` controls use the shared `--control-pad-x-sm` step: 13px of inline padding instead of 14px.
- `.card.compact` lowers `--card-gap` to `--space-20` along with `--card-pad`.
- `.nav-list` rows sit `--space-10` apart instead of `--space-20`, so a vertical nav reads as one list.
- `.topbar` lays out its default row at zero specificity, so `topbar cluster` hands the row to `.cluster`.
- The WCAG and OKLCH color math moves from `scripts/utils/color.js` to `src/tooling/color.js`.
- `report:theme-contrast` labels a dark-only preset (`dim`, `glass`, `indigo`, `neon`) as dark instead of light.

### Fixed

- `actual-css contrast` counts a resting soft pair under 4.5:1 as a miss; it only gated the hovered pair.
- The `design` and `contrast` examples run `bunx --bun actual-css`: plain `bunx` honors the CLI's Node shebang and stops on "needs Bun".
- `dialog.modal.scrollable` lays the body wrapper out as a flex column: a structural header or footer keeps its size and every other region scrolls, so a modal with an external `dialog > header` no longer collapses its footer to zero.
- `--dialog-icon-size` and `--dialog-icon-glyph-size` are read, not declared, on `.dialog-icon`, so an override on the icon's media row or the dialog moves the circle and the heading beside it together.
- An `.avatar-stack` avatar layers its fill over `--surface-opaque`, so a translucent fill no longer shows the neighbour it overlaps.
- `prefers-reduced-motion` also resets `::backdrop`, so a modal or drawer scrim no longer fades when the user reduces motion.

## [0.11.1] - 2026-09-30

### Added

- `dialog.modal > header` provides aligned icon/title/action chrome through `--modal-header-bg`; modal body wrappers expose `--modal-pad` and support `.bleed` bands.
- `actual-css design` (Bun) exports a theme to Figma and Penpot tokens; see `docs/pages/guides/design-tools.md`.
- `actual-css design` writes a Penpot plugin that builds Button, Input, Badge, Alert and Card bound to those tokens.
- Soft fills and borders export as recipe tokens named `<variant>-<intent>-<role>` (`soft-danger-bg`).
- `scripts/serve.js --cors` serves the repository to another origin, such as penpot.app loading a local plugin.
- `--meter-track` sets the `.meter` track, matching `--progress-track`.
- `--close-bg` sets the dialog corner `.close` background, so a dialog over a painted band can drop the default chip.
- `--close-color` and `--close-hover-color` set the X ink at rest and on hover, so a bare X can take a painted band's foreground.
- `--close-hover-overlay` routes the `.close` hover/active wash (matching `--btn-hover-overlay`); the modal/drawer corner sets it transparent so only the ink changes.

### Changed

- `dialog.modal` is borderless: the raised surface and shadow define the panel, so a full-bleed header, footer, or hero band no longer meets a hard edge; a forced-colors border keeps the outline.

### Fixed

- A corner `.close` that is a direct child of `dialog.modal > header` reserves inline room for itself; previously only the wrapper `<header>` did, so a long chrome title could run under it.
- `dialog.modal` derives one `--dialog-inner-radius` for the body wrapper, the header band, and the `.dialog-confirmation` footer, so an edge band keeps the panel corner instead of taking its own radius.
- The `.dialog-confirmation` action band spreads a two-action decision to its edges, keeping a cancel action apart from the committing one.
- `.dialog-confirmation` centers its leading icon on the title while keeping supporting copy in the same text column.
- `.btn` and the `.file` selector button take their borders out of the block padding, so they match `.input` height at every size instead of standing 2px taller outside a `.join`.
- `tests/browser/control-geometry.test.js` measures controls outside a `.join`, whose stretch had hidden the mismatch.

## [0.11.0] - 2026-09-30

### Breaking changes

- `enhancementSelector()` and `hasEnhancement()` are no longer exported from `actual-css/js/enhance`; query `[data-enhance~="name"]` directly.
- `registerCommands()` drops the `prepare` callback; write `aria-controls`, `aria-haspopup`, and `aria-pressed` on command buttons in the markup.
- `registerCommands()` and `commandSelector()` throw on a name that is neither a native `command` keyword nor a custom `--` command.
- `FormValidator.init()` is removed; the module self-registers, and `applyEnhancement("validation", selector)` opts forms in by selector.
- The non-modal dialog command is `command="--show"`; `command="show"` is not an HTML keyword and no longer opens a dialog.
- `.choice-card` shows its control on the leading edge — a ring (radio) or box (checkbox) at rest that fills with the check — instead of a corner badge shown only once checked; the badge is now the "Corner badge" recipe in `docs/pages/forms/choice-cards.md`.
- `.choice-card` is a two-column grid: each child element of the label becomes a row beside the indicator, so loose text needs an element.
- `--choice-card-check-size` defaults to `1.25em` and also sets the width of the `.choice-card` indicator column.
- `--aura-width` is the whole painted `.aura` frame (the border, no padding); `--aura-width: 3px` reproduces the former default frame.
- `.aura` defaults to a thin lit line: `--aura-width: 1px` and `--aura-intensity: 0.4`.

### Added

- `--surface-opaque` and `--surface-solid-fg` let a theme paint translucent surfaces while rings, separators and inverse text stay opaque.
- `report:theme-contrast` reports the `--surface-solid-fg` on `--surface-solid` text pair.
- `scripts/utils/color.js` holds the WCAG contrast and OKLCH math for reports and browser tests; `contrast()` refuses translucent colors.
- `glass` demo theme: translucent surfaces over a theme-painted backdrop, a stress test of the opaque surface roles.
- `tests/browser/translucent-surface.test.js` keeps rings, separators, step markers, and inverse text opaque over translucent surfaces.
- `--choice-card-gap` sets the space between a `.choice-card` indicator and its label.
- `tests/browser/choice-card.test.js` locks the leading indicator: visible at rest, level with the first line of a wrapping label, and kept under forced colors.
- `.shimmer` (`actual-css/css/effects/shimmer`) sweeps a highlight across a text label for an activity in progress; hooks `--shimmer-color` and `--shimmer-highlight`.
- `.range` moves to a `1.125rem` thumb on a `0.625rem` track with a `data-enhance="range"` fill (`--range-progress`) and named `datalist` values (`aria-valuetext` plus `output` sync).
- `--flyout-pad` gives rich flyout panels dialog air.
- `tests/browser/control-geometry.test.js` locks the shared control block geometry: input, select, addon, and buttons (including busy and icon-only) share one height per size, and the spinner follows its context at `1em`.

### Changed

- `--indicator-ring`, the `.avatar-stack` ring, the `.range` thumb separator, segmented `.meter` separators and `.steps` markers read `--surface-opaque`.
- `.tooltip` text reads `--surface-solid-fg`.
- `.aura` masks its frame under the child with `--surface-opaque`, so a transparent or translucent child is framed rather than filled.
- The `.aura` far halo is an outer `box-shadow`, so it never paints under the child.
- `.status-bar` without an intent paints `--surface-solid` / `--surface-solid-fg` instead of `--text` / `--surface`.
- `registerEnhancement()` discovers every named behavior through one shared `[data-enhance]` query per root instead of one `[data-enhance~="name"]` selector each.
- The command router calls `event.preventDefault()` once a target resolves, before `handle`; handlers no longer cancel the click themselves.
- `--focus-outline` (the generic `currentColor` focus fallback) is `--focus-ring-width` wide instead of `2 × --border-width`: 3px instead of 4px under `prefers-contrast: more`.

### Fixed

- `actual-css/js/range` synchronizes fill, `aria-valuetext`, and outputs after a native form reset, including controls associated through `form="…"`, while respecting cancellation and teardown.
- Docs search leaves Enter on the close button and IME confirmation alone, and ArrowUp from no selection reaches the last result.
- `demo/sites/admini/chat.html` loads the shared composer recipe before local overrides so the bottom bar keeps its flat border and compact textarea.
- `.otp` with `.input` on its native input no longer draws the field focus ring around all the cells.
- Docs search keeps focus in the input while arrowing through results (`aria-activedescendant` + `Home`/`End`), so the second and later matches are reachable by keyboard; `Enter` follows the highlight instead of closing the dialog.
- `.tab` and `.rating` draw the component focus ring (`--focus-ring-width` solid `--focus`): an intent on the rating no longer becomes the focus color, and neither ring is 4px under `prefers-contrast: more`.
- `commandSelector()` matches native command keywords case-insensitively, as the router does.
- The command router ignores a trigger disabled through a `<fieldset disabled>` ancestor.
- `tooltip.js` shows on focus only when the trigger matches `:focus-visible`: a pointer press, or focus handed back by a dialog closed with the pointer, no longer brings the tooltip back.

### Documentation and tooling

- Choice cards: a stacked-list demo, and a "Corner badge" recipe (`.choice-tile`) that the Neon Ramen item page uses for its tiles.
- `tests/browser/choice-chip.test.js` asserts the chip's dot layer keeps its height, not just its clip and colour.
- `tests/exports.test.js` keys its inventory on every JS subpath of `package.json#exports`, so a new subpath or an export on an unlisted module now fails the suite.
- Docs search ranks a query token inside a longer alias (`select` finds the Combobox page via `searchable select`) and matches body text on word boundaries, so `selection` no longer outranks `select`; Combobox and Forms carry `select`, `custom select`, and `form controls` aliases.
- `focus.css` documents two focus contracts: text-like elements keep the `currentColor` fallback, boxed components draw the `--focus` ring, and an invalid field's `--form-invalid-border` ring is the one exception.
- `tests/css-audit.test.js` fails on any framework `outline` outside the two focus contracts.
- `report:theme-contrast` reports each preset's invalid-field focus line against the field background.
- `check:sync` fails when the `.sm` and `.lg` participant lists in `variants.css` diverge.
- Tailwind guide: `.outline` is named as the dangerous collision, with `.table`, `.sticky`, `.truncate`, `.prose`, and `.sr-only`.
- Tailwind and Bootstrap guides: a prefix transform is consumer-pipeline work and must also rename the runtime state classes in `actual-css/js/selectors`.
- Table: clarified the responsive boundary — horizontal overflow (`.table-wrap` + `--table-min` + accessible scroll) stays the strategy, and the docs now name the alternatives (list/media view, `.data-list`, dedicated data grid).
- Badge vs choice chip vs removable tag vocabulary: a badge is information (non-interactive), `choice-card.chip` is a selectable label (never nest a `.close` inside it), and removable tags belong to the widget that produced them.
- Combobox: a "Bridge contract" section names what Actual owns (tokens, focus, invalid, `.join`, contrast) versus the widget (behavior, multi-value, i18n), and keeps the bridge CSS in docs/demo.
- Tabs: the `.tabs` strip / `.tab` trigger pair is documented as the container/item convention, with the `tab` module versus `tabs` token split stated.
- Pagination: items are documented as `.btn.ghost` with chevrons on Previous/Next, so `aria-current="page"` is the only filled item.
- Rich text: `demo/templates/rich-text.html` is now an `@lekoala/rich-text` integration (`@0.2` from jsDelivr) instead of a hand-wired Squire prototype, with the skin reduced to a `--rt-*` token bridge plus a rich composer reusing `.composer` chrome.

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
- Pushing a version tag publishes the GitHub release: `bun run release` bumps, dates, rebuilds, commits and tags on the bare format, `bun run release:notes` extracts (and validates) the dated changelog section, and the CI `release` job attaches `dist/`.
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
