# Center

Constrain readable content and center it in the viewport, with width and padding tunable per instance.

```html demo
<main class="center stack">
  <header class="prose">
    <h1>Documentation</h1>
    <p>Guides and API notes for Actual CSS.</p>
  </header>
  <section class="card">
    <h2>Getting started</h2>
    <p>Install the stylesheet and use semantic HTML.</p>
  </section>
</main>
```

Tune width and side padding with local variables.

```css
.docs-page {
  --center-size: 48rem;
  --center-pad: var(--space-40);
}
```

`.center` intentionally uses `box-sizing: content-box`. The max inline size is
the content measure, while inline padding is added outside that measure. This is
deliberate even though the global reset uses `border-box`. Its explicit inline
size subtracts that padding, so `.center` also keeps its available width as a
flex or grid item instead of collapsing to its min-content width.

Do not override it with `inline-size: 100%`: because the padding sits outside
the content box, that would make its outer size exceed the available width by
both padding edges.
