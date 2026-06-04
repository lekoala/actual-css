# Card

Cards are used to group and display content in a way that is easily readable.

## Variants

- `.raised`
- `.subtle`
- `.solid`
- `.compact`

## Sizes

- `.sm`
- `.lg`

## Default

A flat card with default styling.

```html
<article class="card">
  <h3>Title</h3>
  <p>Content goes here.</p>
</article>
```

## Variants

Card surface styles.

```html
<article class="card raised">Raised card</article>
```

```html
<article class="card subtle">Subtle card</article>
```

```html
<article class="card solid">Solid card</article>
```

```html
<article class="card compact">Compact card</article>
```

## Sizes

Available sizes.

```html
<article class="card sm">Small card</article>
```

```html
<article class="card">Default card</article>
```

```html
<article class="card lg">Large card</article>
```

## Sections

Card with header, body, and footer.

```html
<article class="card">
  <header class="card-header">
    <h3>Title</h3>
  </header>
  <div class="card-body">
    <p>Content</p>
  </div>
  <footer class="card-footer">
    <button class="btn primary">Save</button>
  </footer>
</article>
```

## Accessibility

- Use <article> for self-contained content.
- Cards consume surface tokens, not intent tokens by default.
