# Motion cost

What an animation costs per frame depends on the property it animates, not on
how complex the effect looks. `transform` and `opacity` run on the compositor:
the layer is rastered once and moved. Anything else — a registered custom
property, `box-shadow`, `background-position` — runs style and paint on the
main thread every frame, off screen included.

## Measuring

`bun run report:paint` loads each page it is given and reports renderer CPU,
main-thread task time and frame pacing over a fixed window. Give it one page
per variant; a fixture reads its variant from the query string. Confirm a
finding in a real browser with DevTools → Rendering → Paint flashing: a
repainted element flashes green on every frame.

## Aura

`.aura` animates `--aura-angle`, a registered property that feeds the frame's
`conic-gradient`. The usual border-beam technique, built with a JavaScript
component that adds a beam element, draws the same light by rotating a static
conic square with `transform`, cut to a ring by a mask.

```sh
bun run report:paint \
  "scripts/fixtures/aura-paint.html?variant=frozen&n=20" \
  "scripts/fixtures/aura-paint.html?variant=current&n=20" \
  "scripts/fixtures/aura-paint.html?variant=glow&n=20" \
  "scripts/fixtures/aura-paint.html?variant=layout&n=20" \
  "scripts/fixtures/aura-paint.html?variant=static&n=20" \
  "scripts/fixtures/aura-paint.html?variant=nohalo&n=20" \
  "scripts/fixtures/aura-paint.html?variant=rotate&n=20"
```

Measured on 2026-11-12, headless Chrome, renderer CPU in ms per second:

| Auras on screen    | Frozen | `.aura`   | `.aura-glow` | Rotated beam |
| ------------------ | ------ | --------- | ------------ | ------------ |
| 1                  | 14     | 150–210   | 118          | 35–45        |
| 4                  | 17     | 290–590   | 537          | 35–90        |
| 20                 | 20–40  | 1150–1700 | 815          | 90–100       |
| 5 (+15 off screen) | 20     | ~500      | 360          | ~90          |

Paint flashing in Chrome agreed: every `.aura` flashes, the beam never does.
No variant dropped below 60 fps.

- The cost is the `--aura-angle` animation itself. `contain: layout`, a static
  near halo on its own layer, and no near halo at all all stayed within noise
  of the current aura.
- Off-screen auras keep paying main-thread style on every frame.
- `.aura-glow` costs less but still repaints: its far halo breathes through
  `box-shadow`.

Aura keeps its implementation. The compositor version needs an element to
rotate inside a ring-shaped clip, and `.aura` has none to give: both pseudos
are taken (near halo, occlusion), a mask on `.aura` would clip the child, and
`overflow: clip` would cut the halo and the child's focus ring. Adding a beam
element would break the one-child contract for an effect meant for one or two
objects per view, which is what the Aura page now asks.

Reopen this if a design needs many simultaneous auras: the answer is then an
explicit beam element, not containment.
