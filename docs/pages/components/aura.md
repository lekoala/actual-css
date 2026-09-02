# Aura

> **Module** — import `actual-css/css/effects/aura` or `actual-css/css/effects`.

Aura adds a decorative intent-colored border and halo around one direct child.
It is visual emphasis only and does not change the child's semantics.

```html demo
<div class="cluster" style="gap: 2.5rem">
  <span class="aura primary">
    <article class="card" style="inline-size: 13rem">
      <p><strong>Rotating arc</strong></p>
      <p class="muted">One lit segment travels around the frame.</p>
    </article>
  </span>

  <span class="aura aura-glow primary">
    <article class="card" style="inline-size: 13rem">
      <p><strong>Breathing glow</strong></p>
      <p class="muted">The whole perimeter lights and breathes.</p>
    </article>
  </span>
</div>
```

`.aura` sends a short accent of light travelling around the frame, over a
permanent halo that keeps the object present between two passes. Add
`.aura-glow` to light the whole perimeter evenly instead, as a halo that
breathes slowly.

Aura reads best when it has enough perimeter to travel around, and is naturally
more pronounced on dark surfaces. It still composes on small shapes:

```html demo
<div class="cluster">
  <span class="aura primary">
    <button class="btn" type="button">Publish</button>
  </span>

  <span class="aura aura-glow secondary">
    <span class="badge">New</span>
  </span>

  <span class="aura aura-glow success">
    <span class="badge success soft">Live</span>
  </span>

  <span class="aura danger">
    <span class="badge danger solid" aria-label="12 unread notifications">12</span>
  </span>
</div>
```

Note the intent on the wrapper, not on the child: `.aura` is an intent
boundary, so the badge or alert inside keeps its own color and the frame keeps
the one you gave the wrapper. Matching them reads as one object; deliberately
mismatching them reads as two.

```html demo
<div class="stack" style="max-inline-size: 28rem">
  <span class="aura warning">
    <div class="alert warning" role="alert">
      <i class="ti ti-alert-triangle alert-icon" aria-hidden="true"></i>
      <div>Your trial ends in three days.</div>
    </div>
  </span>

  <span class="aura aura-glow danger">
    <div class="alert danger" role="alert">
      <i class="ti ti-credit-card-off alert-icon" aria-hidden="true"></i>
      <div>Two payment methods failed. <a href="#">Review them</a>.</div>
    </div>
  </span>
</div>
```

Motion changes how the light lives, never whether the effect is there: when the
user has requested reduced motion, the travelling accent becomes two opposite
lit corners — a deliberate composition rather than a rotation frozen at an
arbitrary angle — and the glow stays a full, still halo.

The frame color comes from an intent such as `.primary`, `.success`, or
`.danger`; there are no separate aura color variants. The intent is sovereign:
a neutral intent produces a neutral aura. Use a chromatic intent when you want
a visibly luminous effect.

Two hooks tune how loud the effect is. `--aura-intensity` scales both halos at
once, resting and breathing alike, so the breath stays proportional at every
setting; `--aura-duration` sets one full rotation of the accent, or one breath
of the glow.

```html demo
<div class="cluster" style="gap: 2rem">
  <span class="aura aura-glow primary" style="--aura-intensity: 0.4">
    <span class="card" style="inline-size: 8rem">Muted</span>
  </span>

  <span class="aura aura-glow primary">
    <span class="card" style="inline-size: 8rem">Default</span>
  </span>

  <span class="aura aura-glow primary" style="--aura-intensity: 2">
    <span class="card" style="inline-size: 8rem">Loud</span>
  </span>

  <span class="aura primary" style="--aura-duration: 2s">
    <span class="card" style="inline-size: 8rem">Fast accent</span>
  </span>
</div>
```

Keep exactly one direct child and set `--aura-radius` when its shape differs
from the common button, card, alert, and badge shapes detected as a visual
enhancement.

The child must be opaque. The frame paints across the whole box and relies on
the child to cover all but its edge, so a transparent child — an `.outline`
alert, a `.ghost` button — is filled edge to edge with the frame color instead
of framed by it. Give such a child a surface, or move the aura to an opaque
wrapper around it.

## CSS hooks

- `--aura-color` — frame and halo color; follows the local intent.
- `--aura-width` — frame thickness.
- `--aura-blur` — near halo blur; the far halo derives its own blur and its
  spread beyond the frame from this value, so one hook scales both.
- `--aura-intensity` — multiplies both halo opacities, resting and breathing.
  It does not touch the frame itself, which stays a crisp line at any setting.
- `--aura-radius` — child corner radius used to derive the outer radius.
- `--aura-duration` — one rotation of the accent, or one breath of the glow.
