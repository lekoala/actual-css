# Why Actual CSS

Actual CSS is for new projects that want semantic HTML, small class APIs, theme tokens, and progressive enhancement without a build step.

It claims a small public grammar: `.component [intent] [variant] [size] [modifier]`. For existing projects with collisions, use cascade layers, import order, or an application-side prefix transform.

## Tradeoffs

- **Actual CSS** — Semantic components, theming, source imports. Tradeoff: young ecosystem.
- **Bootstrap** — Broad coverage, familiar patterns. Tradeoff: larger API and stronger defaults.
- **Pico** — Fast readable pages. Tradeoff: less component depth.
- **daisy-style libraries** — Many ready variants. Tradeoff: usually tied to a build pipeline.

## Non-goals

- No legacy drop-in promise.
- No large utility surface.
- No compatibility build that rewrites the product.
- No complex widgets before real projects prove the need.
