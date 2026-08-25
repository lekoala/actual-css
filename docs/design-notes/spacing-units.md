# Spacing Units: When to Use `em`, `rem`, `ch`, `lh`, or `--space-*`

Actual does not require every relative length to come from a design token.

CSS relative units already carry useful semantics. A literal `0.5em`, `1lh`, `20rem`, or `65ch` can be more meaningful than replacing it with an unrelated spacing token.

The goal is not to eliminate literal values. The goal is to choose the unit that best expresses the relationship.

## Core rule

Use `--space-*` when the value belongs to the **shared interface rhythm**.

Use a CSS relative unit when the value belongs to the **intrinsic geometry or typography of the component**.

A useful question is:

> If this value changes, is that a design-system decision or a local relationship inside the component?

If it is a design-system decision, prefer a token.

If it is a local relationship, prefer the appropriate CSS unit.

## `--space-*`: interface rhythm

Use spacing tokens for layout distances that should remain consistent across components and respond to Actual's density system.

Typical cases:

```css
.card {
  padding: var(--space-40);
}

.cluster {
  gap: var(--space-20);
}

.data-list {
  gap: var(--space-20) var(--space-40);
}
```

Good candidates include:

* component padding
* gaps between peer controls
* spacing between sections
* list and grid gaps
* toolbar spacing
* application layout rhythm

Using a spacing token also communicates that the value is expected to participate in density changes.

Do not use `--space-*` merely to avoid writing a literal relative unit.

## `em`: relative to the local text

Use `em` when a dimension should scale with the font size of the element or component.

Typical cases:

```css
.prose dd {
  margin-inline-start: 1.5em;
}

.inline-icon {
  margin-inline-end: 0.4em;
}
```

Good candidates include:

* typographic indentation
* small offsets around inline icons
* decorative elements sized relative to text
* local relationships that should scale when the component font size changes

`em` is especially useful when the relationship is best understood as:

> some fraction or multiple of this text size

Do not use `em` for general application spacing when local font-size changes should not affect the layout.

## `rem`: relative to the root scale

Use `rem` when a dimension should follow the user's/root font size but remain independent of a component's local typography.

Typical cases:

```css
.sidebar {
  inline-size: 18rem;
}

.dialog {
  max-inline-size: 36rem;
}
```

Good candidates include:

* component size constraints
* layout thresholds
* widths and heights tied to the overall UI scale
* values that should remain stable when nested inside differently sized text

A literal `18rem` does not need a custom property unless the value itself is part of the public API, reused significantly, or expected to be configured.

## `ch`: text-measure relationships

Use `ch` when a dimension is naturally related to the approximate width of characters.

Typical cases:

```css
.prose {
  max-inline-size: 65ch;
}

.search-field {
  inline-size: 24ch;
}
```

Good candidates include:

* readable text measures
* text-oriented input widths
* content regions whose useful size is determined by expected text length

Do not use `ch` as a generic substitute for `rem`; its value depends on font metrics.

## `lh`: line-height relationships

Use `lh` when a dimension should be directly related to the computed line height.

Typical cases:

```css
.floating-label {
  inset-block-start: calc(0.5lh + var(--border-width));
}
```

Good candidates include:

* vertical positioning relative to a line of text
* text-area or field geometry
* offsets that conceptually represent one or part of one line

`lh` is preferable to reconstructing line height indirectly from font size when line height is the actual relationship being expressed.

## Choosing between them

| Intent                                  | Prefer           |
| --------------------------------------- | ---------------- |
| Shared application spacing              | `var(--space-*)` |
| Density-aware spacing                   | `var(--space-*)` |
| Local relationship to component text    | `em`             |
| Stable size relative to root typography | `rem`            |
| Width related to text length            | `ch`             |
| Geometry related to line height         | `lh`             |

## Examples

### System rhythm

```css
.alert {
  padding: var(--space-30) var(--space-40);
  gap: var(--space-30);
}
```

The spacing is part of the visual density and should stay aligned with other components.

### Intrinsic typography

```css
.prose dd {
  margin-inline-start: 1.5em;
}
```

The indentation belongs to the description text itself. A spacing token would add no useful meaning.

### Stable component width

```css
.sidebar {
  flex-basis: 18rem;
}
```

The width belongs to the component geometry, not to the spacing scale.

### Readable prose

```css
.prose {
  max-inline-size: 65ch;
}
```

The width exists to control line length, so `ch` expresses the intention directly.

### Line-relative positioning

```css
.field-label {
  inset-block-start: 0.5lh;
}
```

The position is defined relative to the text line, not to global spacing.

## Avoid token laundering

Do not replace meaningful CSS units with spacing tokens simply to make a stylesheet appear more tokenized.

Avoid patterns such as:

```css
.icon {
  translate: 0 var(--space-10);
}

.prose {
  max-inline-size: var(--space-900);
}

.label {
  margin-inline-end: var(--space-20);
}
```

when the real relationships would be better expressed as:

```css
.icon {
  translate: 0 -0.1em;
}

.prose {
  max-inline-size: 65ch;
}

.label {
  margin-inline-end: 0.5em;
}
```

Tokens should add meaning, not hide it.

## Literal relative values are not a code smell

A well-chosen literal relative value is valid framework CSS.

Values such as:

```css
0.25em
1.5em
1lh
18rem
65ch
```

can be more stable and understandable than introducing a custom property or mapping them artificially onto the spacing scale.

Promote a value to a token when at least one of these becomes true:

* it represents a shared design decision
* multiple components need the same semantic value
* themes or density modes should modify it
* users are expected to configure it
* naming the value improves understanding of the API

Otherwise, keep the direct CSS unit.

## Guideline

> Use tokens for shared design rhythm. Use CSS relative units for intrinsic relationships.

Actual favors semantic CSS over tokenization for its own sake.
