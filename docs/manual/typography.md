# Typography

Typography has two layers:

- global defaults that make plain HTML readable without becoming classless styling
- `.prose`, an opt-in rich-text scope for articles, documentation, markdown, CMS content, and long-form text

Components should not depend on `.prose`. App screens, forms, cards, tables, and navigation should use their own component/layout rules.

## Baseline

Global typography should stay mild.

- Set body font family, size, line height, background, and text color from tokens.
- Let form controls inherit typography.
- Keep links inheriting color by default unless they are inside `.prose`.
- Do not add global margins to every heading, paragraph, and list in a way that affects app UI.
- Do not use viewport-based font scaling.
- Use normal letter spacing by default.

```css
body {
  background: var(--surface);
  color: var(--text);
  font-family: var(--font-body);
  font-size: var(--font-size);
  line-height: var(--line-height);
}

button,
input,
textarea,
select {
  font: inherit;
}
```

## Tokens

Typography tokens should cover the baseline and the `.prose` scope without creating a large type scale.

```css
:root {
  --font-sans: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --font-mono: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  --font-body: var(--font-sans);

  --font-size: 1rem;
  --line-height: 1.5;
  --font-weight: 400;
  --font-weight-strong: 650;

  --prose-size: 1rem;
  --prose-line-height: 1.7;
  --prose-measure: 70ch;
  --prose-flow: 1em;
  --prose-heading-line-height: 1.2;
}
```

The public surface should stay semantic. Avoid exposing a separate token for each heading level unless real theme work proves it is needed.

## Prose

Use `.prose` for content where element selectors are helpful and expected.

```html
<article class="prose">
  <h1>Designing with Actual CSS</h1>
  <p>
    Prose styles are opt-in, so long-form content can be pleasant without
    changing the shape of app screens.
  </p>

  <h2>Principles</h2>
  <ul>
    <li>Semantic HTML first.</li>
    <li>Small token surface.</li>
    <li>Components compose with layout utilities.</li>
  </ul>

  <blockquote>
    <p>Good defaults should be quiet, not invisible.</p>
  </blockquote>
</article>
```

The `.prose` class owns:

- readable measure
- vertical rhythm between common text elements
- heading hierarchy
- link affordance
- list spacing
- blockquote, code, keyboard, mark, table, image, and figure treatment

The `.prose` class does not own:

- page layout
- cards, alerts, forms, tables used as app UI, or navigation
- component variants
- automatic styling outside the `.prose` subtree

## Prose Rules

Keep selectors scoped and predictable.

```css
.prose {
  max-inline-size: var(--prose-measure);
  color: var(--text);
  font-size: var(--prose-size);
  line-height: var(--prose-line-height);
}

.prose :where(p, ul, ol, blockquote, pre, table, figure) {
  margin-block: var(--prose-flow) 0;
}

.prose :where(h1, h2, h3, h4) {
  margin-block: 1.5em 0;
  color: var(--text);
  font-weight: var(--font-weight-strong);
  line-height: var(--prose-heading-line-height);
}

.prose > :first-child {
  margin-block-start: 0;
}
```

Use `:where()` to keep specificity low. Component classes inside `.prose` should still be able to win.

## Headings

Headings should create hierarchy without needing a large public scale.

```css
.prose h1 {
  font-size: 2rem;
}

.prose h2 {
  font-size: 1.5rem;
}

.prose h3 {
  font-size: 1.25rem;
}

.prose h4 {
  font-size: 1.125rem;
}
```

Use document structure for hierarchy. Do not use heading classes as visual utilities.

## Text Links

Global links inherit color. `.prose` links should look like links by default.

```css
.prose a {
  color: var(--primary);
  text-decoration-line: underline;
  text-decoration-thickness: 0.08em;
  text-underline-offset: 0.18em;
}

.prose a:hover {
  text-decoration-thickness: 0.12em;
}
```

## Lists

Lists inside `.prose` should be readable and conventional.

```css
.prose :where(ul, ol) {
  padding-inline-start: 1.5em;
}

.prose li + li {
  margin-block-start: 0.35em;
}
```

Avoid turning lists into layout utilities. Layout lists belong in components or layout docs.

## Code

Inline code and code blocks should be readable without taking over the design.

```css
.prose code,
.prose kbd {
  border-radius: var(--radius-sm);
  background: var(--surface-subtle);
  color: var(--text);
  font-family: var(--font-mono);
  font-size: 0.875em;
}

.prose code {
  padding: 0.15em 0.3em;
}

.prose pre {
  overflow-x: auto;
  padding: 1em;
  border: var(--border-width) solid var(--border);
  border-radius: var(--radius);
  background: var(--surface-subtle);
}

.prose pre code {
  padding: 0;
  background: transparent;
}
```

## Quotes And Media

```css
.prose blockquote {
  padding-inline-start: 1em;
  border-inline-start: var(--border-width) solid var(--border);
  color: var(--text-muted);
}

.prose :where(img, video, canvas, svg) {
  max-inline-size: 100%;
  block-size: auto;
}

.prose figure {
  margin-inline: 0;
}

.prose figcaption {
  margin-block-start: 0.5em;
  color: var(--text-muted);
  font-size: 0.875em;
}
```

## Tables

Long-form content can contain simple prose tables, but app data tables should use the table component.

```css
.prose table {
  inline-size: 100%;
  border-collapse: collapse;
}

.prose th,
.prose td {
  padding: 0.5em;
  border-block-end: var(--border-width) solid var(--border);
  text-align: start;
}
```

## Density

Add density only when there is a clear need.

```html
<article class="prose prose-sm">...</article>
<article class="prose prose-lg">...</article>
```

```css
.prose-sm {
  --prose-size: 0.9375rem;
}

.prose-lg {
  --prose-size: 1.125rem;
  --prose-measure: 72ch;
}
```

Do not create heading-size modifiers unless the first implementation cannot stay readable without them.

## Links

- https://daisyui.com/docs/layout-and-typography/
- https://nordhealth.design/typography
- https://primer.style/product/primitives/typography/
- https://picocss.com/docs/typography
- https://piccalil.li/blog/a-more-modern-css-reset/
- https://moderncss.dev/generating-font-size-css-rules-and-creating-a-fluid-type-scale/
