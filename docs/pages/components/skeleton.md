# Skeleton

> Placeholder shapes for content that is loading.

- Use `.skeleton` for loading placeholders.
- Use `data-shape` for common placeholder forms: `text`, `title`, `avatar`, `box`.
- Put `role="status"` and accessible text on the loading region, not on every placeholder.
- Use layout utilities for placeholder arrangement.
- Only relevant for simple placeholders - use more structural solutions like phantom-ui for complex cases.

**Related terms:** skeleton screen, shimmer, loading placeholder.

## Class reference

| Class        | Kind      | Description                                         |
|--------------|-----------|-----------------------------------------------------|
| `.skeleton`  | Component | Animated placeholder shape.                         |
| `data-shape` | Modifier  | Geometry presets: `text`, `title`, `avatar`, `box`. |

## Basic usage

```html demo
<article class="card" role="status" aria-label="Loading profile">
  <div class="cluster">
    <div class="skeleton" data-shape="avatar" aria-hidden="true"></div>
    <div class="stack grow">
      <div class="skeleton" data-shape="title" aria-hidden="true"></div>
      <div class="skeleton" data-shape="text" aria-hidden="true"></div>
    </div>
  </div>
</article>
```

## CSS hooks

- `--skeleton-track` — base placeholder color.
- `--skeleton-highlight` — sweeping highlight color.
- `--skeleton-radius` — corner radius; `data-shape` presets override it.
- `--skeleton-size` — block size; `data-shape` presets override it.
- `--skeleton-width` — inline size; `data-shape` presets override it.
