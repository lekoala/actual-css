# AI Usage Guide

Use Actual CSS by combining one component class with optional intent, variant, and size classes. The same grammar works across supported components.

## Grammar

```txt
.component intent variant size
```

## Good Examples

```html
<button class="btn primary">Save</button>
<button class="btn neutral outline">Cancel</button>
<button class="btn danger soft">Delete</button>
<span class="badge success soft">Published</span>
<div class="alert warning soft" role="alert">Check the entered value.</div>
```

## Rules

- Use `.primary` for the main action.
- Use `.neutral` for secondary/default actions.
- Use `.danger` only for destructive actions.
- Use `.warning` for caution, not destruction.
- Use `.success` for positive status.
- Use `.soft` for low-emphasis status UI.
- Use `.outline` for secondary visual emphasis.
- Do not invent component-specific classes such as `.btn-primary`.
- Do not hard-code theme colors in inline styles.
- Do not invent tokens.

## Forbidden

```html
<button class="btn-primary">Save</button>
<button class="btn btn-primary">Save</button>
<div style="background: #2563eb; color: white">...</div>
```


## Themes

Use `[data-theme]` globally or locally.

```html
<html data-theme="corporate">
<section data-theme="dark">
  <article class="card">Nested dark island</article>
</section>
```

Available MVP themes:

```txt
light, dark, dim, corporate, forest, ocean, sunset, lavender, mono
```

## Layout Helpers

Use small layout primitives instead of utility soup:

```html
<main class="center stack">
  <div class="cluster">...</div>
  <div class="grid">...</div>
  <div class="sidebar">...</div>
</main>
```

Do not invent spacing utilities unless the framework explicitly provides them.
