# Badge

> Compact label for counts, status, or category tags, with shared intents and variants.

- Supports intent colors.
- Soft by default. Use `.solid` for counters and notification badges, or `.outline` for quieter emphasis.
- Dots stay solid regardless of variant.
- Use `.sm` or `.lg` to scale the badge locally.
- Use `.compact` or `.spacious` on a context to change geometry without changing the label or icon size.
- Can be used inline in headings.
- Can be used as a count badge.
- Can be used as a stable dot badge when empty and given an accessible name.
- Empty badges render as dots. The element must be truly empty: no text and no whitespace.

A badge is **content-sized**: it never stretches to fill its container, even as a
direct child of `.stack` (where flex children otherwise stretch), and a flex
parent never compresses it (`flex: none`). Use `inline-size: 100%` — or the
optional `.inline-size-full` utility — when a full-width badge is intentional.

**Related terms:** chip, tag, pill, removable tag.

## Class reference

| Class           | Kind        | Description                               |
| --------------- | ----------- | ----------------------------------------- |
| `.badge`        | Component   | Compact label; soft by default.           |
| `.badge:empty`  | Composition | Truly-empty badge renders as a solid dot. |
| `.dot`          | Composition | Status dot inside a badge.                |
| Shared intents  | Intent      | `.primary`, `.secondary`, `.success`, …   |
| Shared variants | Variant     | `.solid`, `.outline`, `.surface`.         |
| `.sm` / `.lg`   | Size        | Smaller or larger optical scale.          |

The shared intents are `.primary`, `.secondary`, `.success`, `.warning` and
`.danger`. The variants set emphasis: `.solid` is filled, `.outline` bordered,
`.surface` untinted.

## Basic usage

```html demo
<span class="badge">Default</span>
<span class="badge secondary">Secondary</span>
<span class="badge success">Success</span>
<span class="badge warning">Warning</span>
<span class="badge danger">Danger</span>
<span class="badge success outline">Outline success</span>
<span class="badge warning soft">Soft warning</span>
<span class="badge primary solid">Solid primary</span>
<span class="badge success solid">Solid success</span>
<span class="badge danger solid">Solid danger</span>
```

## In a title

```html demo
<h2>New features <span class="badge success soft">New</span></h2>
```

## Composed

```html demo
<button type="button" class="btn ghost" aria-label="Notifications">
  <i class="ti ti-bell" aria-hidden="true"></i>
  <span class="badge danger solid" aria-label="12 unread notifications">12</span>
</button>

<button type="button" class="btn secondary soft" aria-label="Notifications">
  <i class="ti ti-bell" aria-hidden="true"></i>
  <span class="badge danger" aria-label="Errors!"></span>
</button>
```

## Status dot

```html demo
<span class="badge success" aria-label="Online"></span>
```

An autonomous dot conveys state without visible text, so give it an accessible
name.

For a dot beside a label, put the shared `.dot` utility inside the badge. It
paints with `currentColor`, so it follows the badge ink instead of needing the
intent class repeated on it.

```html demo
<span class="badge warning">
  <span class="dot" aria-hidden="true"></span>
  In progress
</span>
<span class="badge danger">
  <span class="dot" aria-hidden="true"></span>
  Blocked
</span>
<span class="badge success">
  <span class="dot" aria-hidden="true"></span>
  Completed
</span>
```

Custom status or category dots define a custom intent (`--intent` /
`--intent-fg`); `--ui-*` controls treatment, while empty dots intentionally
remain solid.

## Color marker

Use an empty badge as a compact intent-colored marker in legends and status
labels. When adjacent text carries the same information, keep the marker
decorative.

```html demo
<span class="badge primary" aria-hidden="true"></span>
Regular
```

## Size variants

```html demo
<span class="badge success sm">Small</span>
<span class="badge success">Default</span>
<span class="badge success lg">Large</span>
```

## Density

Density changes the pill geometry without scaling its label or icon.

```html demo
<span class="compact"><span class="badge success">Compact</span></span>
<span><span class="badge success">Default</span></span>
<span class="spacious"><span class="badge success">Spacious</span></span>
```

## With an icon

Decorative SVG, image, or `[aria-hidden="true"]` children follow
`--badge-icon-size`.

```html demo
<span class="badge success">
  <i class="ti ti-rosette-discount-check" aria-hidden="true"></i>
  Verified
</span>
<span class="badge warning">
  <i class="ti ti-clock" aria-hidden="true"></i>
  Pending
</span>
<span class="badge danger solid">
  <i class="ti ti-alert-circle" aria-hidden="true"></i>
  Failed
</span>
```

## Loading status

A decorative spinner follows the badge color and optical size.

```html demo
<span class="badge danger sm">
  <span class="spinner" aria-hidden="true"></span>
  Deleting
</span>
<span class="badge sm">
  Generating
  <span class="spinner" aria-hidden="true"></span>
</span>
```

## Custom sizing

Override the existing hooks when the three-step scale does not fit the content.

```html demo
<span class="badge primary" style="--badge-size: 2rem; --badge-font-size: var(--font-size-md);">
  Prominent
</span>
```

## Removable tag pattern

Use `.badge soft` for tag visuals. Add a direct dismiss button only when the tag can actually be removed. There is no separate chip component.
For a compact action or filter, use `.btn.sm` instead; badges describe content
and must not be turned into toggle controls merely to obtain a compact shape.

Leave the dismiss button empty: it paints its own X, so the pattern needs no
icon font and no text glyph. Put your own icon inside it and that content is
used instead.

```html demo
<span class="badge primary soft">
  Design
  <button type="button" aria-label="Remove Design"></button>
</span>
<span class="badge primary soft">
  <button type="button" aria-label="Remove Design"></button>
  Design
</span>
```

## CSS hooks

- `--badge-radius` — corner radius.
- `--badge-size` — minimum block size; also the square size of an `:empty` dot badge.
- `--badge-dot-size` — size of an `:empty` dot badge.
- `--badge-font-size` — label font size.
- `--badge-icon-size` — decorative child size; `1em` follows the label by default.
- `--badge-pad-x` — inline padding. Derived from `--badge-size`, so it stays proportional to the pill; set it to opt out.
- `--badge-dismiss-icon-size` — size of the X painted by an empty dismiss button.
