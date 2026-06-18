# Typography

## Overview

> Quiet global defaults plus an opt-in prose scope for long-form content, with a separate optional module for fluid display type.

Typography has three layers:

- global defaults that make plain HTML readable without becoming classless CSS
- `.prose`, an opt-in rich-text scope for articles, documentation, markdown, CMS content, and long-form text
- a small optional fluid module for display, title, and lead sizes that scale with the viewport

Components must not depend on `.prose`. App screens, forms, cards, tables, navigation, dashboards, and component examples should use their own component or layout rules.

Use `.prose` directly on a semantic content container, usually an `article`.

## Why this shape

The framework is a components-oriented, theme-oriented library, not a classless stylesheet and not a utility-first framework. The typography system reflects that.

Global typography should stay mild because:

- a card, a dialog, a sidebar, or a dashboard must not be accidentally reshaped by selectors that target `h1` or `p` outside `.prose`
- form controls, navigation, and dense app UI need predictable inheritance rather than decorative defaults
- the only place where headings, paragraphs, lists, and blockquotes can be styled as a hierarchy is the `.prose` scope

The framework avoids exposing a large public type scale. There is no `fs-1` to `fs-7`, no Bootstrap-like heading utilities, no `text-display` / `text-h1` / `text-h2` ladder on day one. Theme work, real components, and repeated use cases are what justify new type tokens — not a speculative API.

The framework avoids RFS-style fluid typography as a foundation. Fluid sizes are useful for display text on marketing pages, but they make body text and app UI harder to reason about. A small optional module covers the display use case without dragging the rest of the system along.

## Boundaries

The typography system is split into three layers with strict responsibilities.

### Global baseline

The baseline owns the minimum needed to make plain HTML readable.

It applies everywhere — cards, dialogs, heroes, app shells — not only in prose.

It does not own visual hierarchy. No global `font-size` on headings, no global `font-weight` on headings, no global margins on headings, no global `text-decoration` on links. These choices would shape app UI in ways the framework cannot predict.

The only mildly opinionated defaults at the baseline are: line-height on headings (tight, so multi-line headings stay readable), `text-wrap: balance` on headings where supported, the `hr` rule, the `::selection` rule, the `code` / `kbd` / `samp` / `pre` font family, and `small` font size. Everything else stays neutral so components and `.prose` can take over without fighting the baseline.

Global links inherit color. The visual affordance of a link is the responsibility of `.prose` (for authored content) or of a component (for nav links, button-like links, tabs, breadcrumbs, etc.). Underlining every `a` globally would collide with all of those.

### `.prose` scope

`.prose` is the opt-in rich-text scope. It owns the visual hierarchy of authored content.

It owns: readable measure, vertical rhythm between common text elements, heading hierarchy, link affordance, list spacing, code and keyboard treatment, blockquote treatment, table treatment, image / figure / figcaption treatment, mark, and `text-wrap` balance / pretty for prose elements.

It does not own: page layout, app cards, alerts, forms, app tables, navigation, component variants, or any automatic styling outside the `.prose` subtree.

The reason for that boundary: a dialog title, a card heading, or a sidebar section heading should not become a "prose h1". Components own those. If a card or a dialog wants a richer heading, it can use a component-level rule, not a global selector.

### Optional fluid module

`src/optional/typography-fluid.css` is a small file that is not imported by `actual.css`. Projects that need display, title, and lead sizes that scale with the viewport (landing pages, marketing pages, hero sections, documentation homepages) import it manually after `actual.css`.

The module exposes three size tokens (`--fluid-display`, `--fluid-title`, `--fluid-lead`) and three composed classes (`.text-display`, `.text-title`, `.text-lead`). It is deliberately not the foundation: body text, app UI, and the default prose scale stay static.

There is also a non-fluid `.lead` utility in the core, for a simple readable intro paragraph. The optional module does not redefine `.lead`; it adds a separate `.text-lead` for display contexts. This avoids an optional import silently changing how existing markup renders.

## Link treatment

Global links are intentionally neutral. Only `.prose` styles them as prose links, and only components style their own link-like elements (nav links, button-as-link, tabs, breadcrumbs, etc.). The reason is that underlining every `a` globally fights against button-like links, nav links, clickable cards, menu items, and tab triggers. Components that need link semantics should opt in with their own rule.

The `--link-decoration-thickness`, `--link-decoration-thickness-hover`, and `--link-underline-offset` tokens have been removed because no global rule consumes them. Prose and components set their own underline metrics inline.

## Type scale

There is no exposed type scale.

The framework exposes font weights, line heights, and the prose-specific overrides. It does not expose `fs-1` through `fs-7`, heading-level tokens, or heading-level utility classes. The reason is the same as for the baseline: a public scale is a contract, and adding it now would lock in choices before theme work and real component use tell us what is actually needed.

When a scale is needed, the optional fluid module is the right place to start. A future theme can override its tokens, not invent a parallel scale in components.

## Font weights

The framework exposes a small set of weights:

- `--font-weight` (400) — body default
- `--font-weight-medium` (500) — slightly heavier than body, for nav links
- `--font-weight-strong` (650) — emphasis, prose headings, badges, tabs, table headers
- `--font-weight-bold` (700) — the strongest weight exposed, used by the navbar brand and the accordion summary

No `--font-weight-light`. Light weights depend on the typeface, are rarely a good default, and add surface area without a recurring need.

These weights are also the values used by components. Components do not use literal `font-weight: 600` or `font-weight: 750`; they reference the tokens. Theme authors can re-map them in one place.

## Line heights

The framework exposes three line-height tokens:

- `--line-height-tight` (1.25) — used by global headings and by display / title classes
- `--line-height` (1.5) — body default
- `--line-height-relaxed` (1.75) — used by `.lead` and `.text-lead` for intro text

There is no `--line-height-normal`. It would be redundant with `--line-height`. Prose overrides line-height through `--prose-line-height` and `--prose-heading-line-height` because the readable values for long-form text are different from app UI.

## text-wrap

`text-wrap: balance` and `text-wrap: pretty` are used at three levels:

- global headings, where supported
- inside `.prose` for headings (balance) and for paragraphs, list items, and blockquotes (pretty)
- as opt-in utilities `.text-balance` and `.text-pretty` for any element outside `.prose`

All three are wrapped in `@supports` so that the property gracefully degrades in browsers that do not support it. There is no `text-align: center` hidden inside `.text-balance`: balance is about wrapping, not alignment.

## Headings

Headings are split between the global baseline and `.prose`.

Globally, headings get a tight line-height, a color from `--heading` (or inherited), and `text-wrap: balance` where supported. They do not get a `font-size`, a `font-weight`, or margins. The reason is that a card heading, a dialog title, or a sidebar section should not be auto-magically enlarged by selector.

Inside `.prose`, headings get a `font-weight` from `--font-weight-strong`, a tighter line-height from `--prose-heading-line-height`, a margin-block rhythm, and an explicit `text-wrap: balance`. The `h1` to `h4` font sizes are also scoped to `.prose` and are not exposed as a public scale.

The `hgroup` element gets only structural styling: a grid layout, a gap, and a reset of internal margins. No font-size, no color, no weight. Its visual identity is the responsibility of the headings and paragraphs it contains.

## Links and text utilities

Three logical alignment utilities exist (`.text-start`, `.text-center`, `.text-end`) because alignment is independent of typography hierarchy and is useful in many contexts. They use logical properties so they follow writing direction.

`text-wrap` balance and pretty are exposed as utilities so they can be applied outside `.prose` (e.g. on a card title, a dialog description, a hero subtitle).

`transition: all` is not used. Transitions target specific properties. This is a general rule, not just a typography rule.

## Small elements

`small` gets a smaller font size globally (`0.875em`) because it is a semantic element, not a utility. There is no `.small` class competing with the element.

`code`, `kbd`, `samp`, and `pre` get the mono font family globally. Visual treatment (background, padding, radius) is left to `.prose` or to code-block components.

## Tables

Prose tables are a different concern from app data tables. Long-form content can contain a small table, but a sortable, dense, row-actionable app table belongs to the table component. The `.prose table` rule is intentionally minimal: it does not define sticky headers, selection states, row actions, or density variants.

## Optional module — how to use it

To enable fluid display type on a marketing or documentation surface, import the optional module after `actual.css` in the project's stylesheet entry point. The module does not change anything in the core: it adds three size tokens and three classes. Body text, app UI, and the default prose scale are not affected.

Projects that do not need fluid display type do nothing — the optional module is not part of the default bundle.

## What not to reintroduce

These are decisions that the framework has already made. Re-introducing them silently would regress the system.

- Do not add `font-size` on global `h1` to `h6`. Headings inherit size from context (component or `.prose`).
- Do not add `font-weight` on global `h1` to `h6`. Strong weight is scoped to `.prose` and to components that need it.
- Do not add global `text-decoration: underline` on `a`. Links get their visual affordance from `.prose` or from their component.
- Do not add `transition: all`. Transitions target specific properties.
- Do not add a `--font-weight-light`. It is rarely a good default and depends on the typeface.
- Do not add a `text-align: center` shortcut to `.text-balance`. Balance is about wrapping, not alignment.
- Do not add RFS-style fluid type to the foundation. Fluid sizing is for display text in the optional module.
- Do not add heading-level utility classes (`h1`, `h2`, …) or a public `fs-*` scale until theme work and real components prove they are needed.
- Do not extend `.prose` to style cards, alerts, app tables, or navigation. Those belong to their components.

## References

- https://daisyui.com/docs/layout-and-typography/
- https://nordhealth.design/typography
- https://primer.style/product/primitives/typography/
- https://picocss.com/docs/typography
- https://piccalil.li/blog/a-more-modern-css-reset/
- https://moderncss.dev/generating-font-size-css-rules-and-creating-a-fluid-type-scale/
