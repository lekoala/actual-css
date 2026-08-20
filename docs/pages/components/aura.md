# Aura

> **Module** — import `actual-css/css/effects/aura` or `actual-css/css/effects`.

Aura adds a decorative intent-colored border and halo around one direct child.
It is visual emphasis only and does not change the child's semantics.

```html demo
<div class="cluster">
  <span class="aura primary">
    <button class="btn" type="button">Publish</button>
  </span>

  <span class="aura aura-glow secondary">
    <span class="badge">New</span>
  </span>
</div>
```

The animated conic frame runs only when the user has not requested reduced
motion. Add `.aura-glow` for a static, solid frame. The component uses an
intent such as `.primary`, `.success`, or `.danger`; it does not introduce
separate aura color variants.

Keep exactly one direct child and set `--aura-radius` when its shape differs
from the common button, card, alert, and badge shapes detected as a visual
enhancement.

## CSS hooks

- `--aura-color` — frame and halo color; follows the local intent.
- `--aura-width` — frame thickness.
- `--aura-blur` — halo blur radius.
- `--aura-radius` — child corner radius used to derive the outer radius.
- `--aura-duration` — rotation duration when motion is allowed.
