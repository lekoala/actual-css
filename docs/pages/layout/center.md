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
deliberate even though the global reset uses `border-box`.

Because the padding sits outside that content box, do not force a `.center`
flex or grid item to `inline-size: 100%` without subtracting its inline padding.
Otherwise its outer size becomes the available width plus both padding edges.
