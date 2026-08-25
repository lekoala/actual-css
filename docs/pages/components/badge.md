# Badge

> Compact label for counts, status, or category tags, with shared intents and variants.

- Supports intent colors.
- Soft by default. Use `.solid` for counters and notification badges, or `.outline` for quieter emphasis.
- Dots stay solid regardless of variant.
- Use `.sm` or `.lg` for compact density changes.
- Can be used inline in headings.
- Can be used as a count badge.
- Can be used as a stable dot badge when empty and given an accessible name.
- Empty badges render as dots. The element must be truly empty: no text and no whitespace.

A badge is **content-sized**: it never stretches to fill its container, even as a
direct child of `.stack` (where flex children otherwise stretch). Use
`inline-size: 100%` — or the optional `.inline-size-full` utility — when a
full-width badge is intentional.

**Related terms:** chip, tag, pill, removable tag.

## Class reference

| Class           | Kind        | Description                                                  |
|-----------------|-------------|--------------------------------------------------------------|
| `.badge`        | Component   | Compact label; soft by default.                              |
| `.badge:empty`  | Composition | Truly-empty badge renders as a solid dot.                    |
| Shared intents  | Intent      | `.primary`, `.secondary`, `.success`, `.warning`, `.danger`. |
| Shared variants | Variant     | `.solid` (filled) and `.outline` (bordered) emphasis.        |
| `.sm` / `.lg`   | Size        | Compact density.                                             |

## Basic usage

```html demo
<span class="badge">Default</span>
<span class="badge secondary">Secondary</span>
<span class="badge success">Success</span>
<span class="badge warning">Warning</span>
<span class="badge danger">Danger</span>
<span class="badge success outline">Outline success</span>
<span class="badge warning soft">Soft warning</span>
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
<span class="badge success sm">Small Success</span>
<span class="badge success">Regular Success</span>
<span class="badge success lg">Large Success</span>
```

## Removable tag pattern

Use `.badge soft` for tag visuals. Add a direct dismiss button only when the tag can actually be removed. There is no separate chip component.
For a compact action or filter, use `.btn.sm` instead; badges describe content
and must not be turned into toggle controls merely to obtain a compact shape.

```html demo
<span class="badge primary soft">
  Design
  <button type="button" aria-label="Remove Design">
    <i class="ti ti-x" aria-hidden="true"></i>
  </button>
</span>
<span class="badge primary soft">
  <button type="button" aria-label="Remove Design">
    <i class="ti ti-x" aria-hidden="true"></i>
  </button>
  Design
</span>
```

## CSS hooks

- `--badge-radius` — corner radius.
- `--badge-size` — minimum block size; also the square size of an `:empty` dot badge.
- `--badge-dot-size` — size of an `:empty` dot badge.
- `--badge-font-size` — label font size.
- `--badge-pad-x` — inline padding.
