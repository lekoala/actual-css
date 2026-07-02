# Utilities

Utilities are a small escape hatch for common single-purpose needs. They should support composition, not become the primary way to build UI.

- Prefer semantic HTML, components, and layout primitives first.
- Add utilities only when the rule is broadly useful and unlikely to become a component.
- Keep utility names stable, boring, and few.
- Utilities should use logical properties where relevant.

## Accessibility

### Screen Reader Only

Use `.sr-only` for text that should be available to assistive technology but visually hidden.

```html
<button class="btn ghost" type="button">
  <i class="ti ti-menu-2" aria-hidden="true"></i>
  <span class="sr-only">Open navigation</span>
</button>
```

```css
.sr-only {
  position: absolute;
  inline-size: 1px;
  block-size: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

Links:
- https://piccalil.li/blog/a-modern-css-reset/
- https://www.a11yproject.com/posts/how-to-hide-content/

## Overflow

> Explicit overflow handling for content that may exceed its container.

Use `.overflow-auto` when content may overflow its container, especially tables and code-like regions.

```html
<div class="overflow-auto">
  <table class="table">
    <caption>Team members</caption>
    <thead>
      <tr>
        <th>Name</th>
        <th>Role</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Alice Johnson</td>
        <td>Admin</td>
      </tr>
    </tbody>
  </table>
</div>
```

```css
.overflow-auto {
  overflow: auto;
}
```

Links:
- https://getbootstrap.com/docs/5.3/content/tables/#responsive-tables
- https://picocss.com/docs/overflow-auto

## Sizing And Wrapping

> Small layout corrections for controls, labels, and compact rails.

Use `.fit` when a control or element should shrink to its content instead of filling the available inline space.

```html
<select class="select fit" aria-label="Theme">
  <option>System</option>
  <option>Light</option>
  <option>Dark</option>
</select>
```

Use `.nowrap` on a flex layout such as `.cluster` when the group must stay on one line.

```html
<div class="cluster nowrap gap-sm">
  <select class="select sm fit" aria-label="Segment">
    <option>All segments</option>
  </select>
  <button class="btn sm outline" type="button">Filter</button>
</div>
```

Use `.truncate` on the flexible item that should ellipsize inside a constrained row.

```html
<header class="cluster nowrap">
  <strong class="truncate">A long account name that should not push actions away</strong>
  <button class="btn sm ghost" type="button">Open</button>
</header>
```

```css
.fit {
  inline-size: fit-content;
  max-inline-size: 100%;
}

.nowrap {
  flex-wrap: nowrap;
  white-space: nowrap;
}

.truncate {
  min-inline-size: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
```

### Scroller

Use `.scroller` to apply optional framework scrollbar treatment to a scroll container. It styles the scrollbar only; pair it with `.overflow-auto` or a component that already creates overflow.

`scroller` is not imported by `actual.css`. Import it explicitly when a project wants Actual CSS scrollbar chrome instead of the native OS default:

```css
@import "actual-css/css/optional/scroller";
```

```html
<div class="overflow-auto scroller" style="max-block-size: 12rem">
  <div class="stack">
    <p>Scrollable content keeps the native scrollbar but makes it quieter.</p>
    <p>Long content can keep flowing without forcing every component to invent its own scrollbar rules.</p>
    <p>The utility exposes local custom properties for one-off tuning.</p>
  </div>
</div>
```

```css
.scroller {
  --scroller-size: 0.625rem;
  --scroller-padding: 0.125rem;
  --scroller-track: transparent;
  --scroller-thumb: var(--border);
  --scroller-thumb-hover: var(--text-muted);

  scrollbar-color: var(--scroller-thumb) var(--scroller-track);
  scrollbar-width: thin;
}
```

Customize locally when a scroll surface needs more contrast:

```html
<div class="overflow-auto scroller"
     style="--scroller-thumb: var(--text-muted); --scroller-thumb-hover: var(--text)">
  ...
</div>
```

For rounded scroll containers, keep the thumb visually away from the edge by tuning `--scroller-padding` rather than adding extra wrappers or masking pseudo-elements.

## Flex Helpers

> Small flex helpers for grow behavior and other one-line needs.

### Grow

Use `.grow` when one item in a flex layout should take available space without overflowing.

```html
<header class="cluster">
  <a href="/" class="brand">Actual CSS</a>
  <nav class="grow" aria-label="Main navigation">
    <a href="/docs">Docs</a>
    <a href="/components">Components</a>
  </nav>
  <button class="btn ghost" type="button">Menu</button>
</header>
```

```css
.grow {
  flex: 1 1 auto;
  min-inline-size: 0;
}
```

### Items Start

Use `.items-start` on flex or grid layouts when children should keep their natural height and align to the block-start edge. This is especially useful for form fields in a grid, where the default grid stretch would make short fields as tall as taller neighbors.

```html
<div class="grid items-start">
  <label class="field">
    <span class="field-label">Name</span>
    <input type="text" />
  </label>
  <label class="field">
    <span class="field-label">Notes</span>
    <textarea></textarea>
  </label>
</div>
```

## Spacing Helpers

> Semantic step helpers for gap, padding, and margin — the most common inline-style escape hatches.

Spacing helpers use a restrained semantic scale:

- `-sm` — small step, `--space-2` (0.5rem)
- Default — standard step, `--space-4` (1rem)
- `-lg` — large step, `--space-5` (1.5rem)

All map to logical properties (`padding-block`, `margin-block-end`, etc.) for writing-direction safety.

### Gap

Override the default gap from layout primitives (`.stack`, `.cluster`, `.grid`):

```html
<ul class="cluster gap-sm">
  <li><a href="/about" class="btn ghost">About</a></li>
  <li><a href="/contact" class="btn ghost">Contact</a></li>
</ul>
```

| Class | Maps to |
|-------|---------|
| `.gap-none` | `gap: 0` |
| `.gap-sm` | `gap: var(--space-2)` |
| `.gap-lg` | `gap: var(--space-5)` |

### Padding

Block (vertical) and inline (horizontal) padding:

```html
<section role="tabpanel" class="py">
  Panel content with breathing room above and below.
</section>
```

| Class | Maps to |
|-------|---------|
| `.py-sm` | `padding-block: var(--space-2)` |
| `.py` | `padding-block: var(--space-4)` |
| `.py-lg` | `padding-block: var(--space-5)` |
| `.px-sm` | `padding-inline: var(--space-2)` |
| `.px` | `padding-inline: var(--space-4)` |
| `.px-lg` | `padding-inline: var(--space-5)` |

### Margin

Block-start and block-end margin for giving elements room:

```html
<h2 class="mbs">A section heading with space above</h2>
```

| Class | Maps to |
|-------|---------|
| `.mbs-sm` | `margin-block-start: var(--space-2)` |
| `.mbs` | `margin-block-start: var(--space-4)` |
| `.mbs-lg` | `margin-block-start: var(--space-5)` |
| `.mbe-sm` | `margin-block-end: var(--space-2)` |
| `.mbe` | `margin-block-end: var(--space-4)` |
| `.mbe-lg` | `margin-block-end: var(--space-5)` |

No `mbs-none` / `mbe-none` — use `margin: 0` via `.list-reset` for lists, or a layout primitive that already resets margins (`.stack > *`).

## Text Helpers

> Lightweight helpers for muted or secondary text without a full color scale.

### Muted

Use `.muted` for secondary text when no semantic element already carries the meaning.

```html
<p class="muted">Last updated June 12, 2026.</p>
```

```css
.muted {
  color: var(--text-muted);
}
```

Do not create a full text color utility scale. Intent colors belong to components and state, not arbitrary text decoration.

### Text Alignment

Use `.text-start`, `.text-center`, or `.text-end` when a component or layout primitive does not already set alignment. These use logical properties so they follow the writing direction.

### Text Wrap

`.text-balance` and `.text-pretty` opt elements outside `.prose` into balanced or pretty text wrapping. They are safe progressive enhancements: browsers that do not support a `text-wrap` value ignore that declaration and keep normal wrapping.

### Lead

`.lead` is a slightly larger, more relaxed reading-introduction paragraph (`1.125em`, `--line-height-relaxed`). Use it for introductory text in editorial surfaces. For fluid headline sizing, use `src/css/optional/typography-fluid.css`.

## Shape Helpers

> Rare shape utilities for cases that must be perfectly round or square.

Shape utilities should be rare because shape is mostly theme-level.

### Circle

Use `.circle` only when an element must be perfectly round.

```html
<img class="circle" src="/avatar.jpg" alt="Jane Doe" width="48" height="48" />
```

```css
.circle {
  --radius: 999px;
  border-radius: 999px;
}
```

Do not add `.rounded-sm`, `.rounded-lg`, `.square`, or `.pill` unless repeated real use proves they are needed.

## Content

### Measure

`.measure` caps a block at a readable width using `--prose-measure`. It does not center — combine with `.center` for the common centered reading column, or with `margin-inline: auto` for a one-off centered block.

Use it for any content that needs a comfortable measure: prose articles, TOC lists, form fields, callouts. Avoid using it for full-bleed surfaces.

## List Helpers

### List Reset

`.list-reset` removes the native list chrome (margin, padding, markers) from any list. It is the generic version of `.nav-list` — use `.nav-list` when the list is a navigation list for semantic intent, and `.list-reset` for everything else (tag clouds, footer columns, related items, comment threads, embedded controls).

## Editorial Labels

### Overline

`.overline` is a small editorial label: muted color, smaller size, uppercase, slight letter-spacing. It does not impose a shape by itself. Add `.pill` for a bordered rounded chip, and combine with an intent class (`.primary`, `.success`, etc.) to tint the chip's text, border, and background.

The overline exists because categories, kicker labels, and section markers recur across editorial surfaces, and `.badge` is the wrong shape for them. `.badge` is a status indicator; `.overline` is metadata.

## Link Variants

### Plain

`.link-plain` removes the link's underline and inherits the surrounding color. Use for chrome that is conceptually a link (a card title, a table row action, a tag, a breadcrumb segment) but should not look like prose.

### Muted

`.link-muted` is a `.link-plain` that starts in the muted text color and shifts to the full text color on hover. Use for navigation lists, table of contents, and other secondary navigation surfaces.

## Non-Goals

> Utilities deliberately excluded to keep the surface small and intentional.

- No display scale such as `.block`, `.flex`, `.grid` — use layout primitives.
- No color scales such as `.text-primary` or `.bg-success` — intent colors belong to components and state.
- No breakpoint utility variants — use container queries or layout primitives.
- No utility variants for hover, focus, dark mode, or arbitrary selectors — use component states.
- No full spacing scale with every step and direction — the 17 spacing helpers above cover the most common escape hatches.

Links:
- https://github.com/knadh/oat/blob/master/src/css/utilities.css
