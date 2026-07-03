# Why Actual CSS

Actual CSS is for new projects that want semantic HTML, small class APIs, theme tokens, and progressive enhancement without a build step.

It claims a small public grammar: `.component [intent] [variant] [size] [modifier]`. For existing projects with collisions, use cascade layers, import order, or an application-side prefix transform.

## Tradeoffs

| Library | Good at | Tradeoff |
|---|---|---|
| Actual CSS | Semantic components, theming, source imports | Young ecosystem |
| Bootstrap | Broad coverage, familiar patterns | Larger API and stronger defaults |
| Pico | Fast readable pages | Less component depth |
| daisy-style libraries | Many ready variants | Usually tied to a build pipeline |

## Non-goals

- No legacy drop-in promise.
- No large utility surface.
- No compatibility build that rewrites the product.
- No complex widgets before real projects prove the need.
