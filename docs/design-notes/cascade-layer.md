# Cascade layer strategy

## Purpose

Actual CSS is designed for new projects where its bare class names don't
conflict. For existing projects that need coexistence, `actual.layer.css`
wraps the core entrypoint in a single `@layer actual` so its specificity
is lower than unlayered author styles. `actual.layer.css` is layered core —
it does not include the functional families. Use it as the base and import
the families you need from `actual-css/css/*` outside the layer.

## Usage

Replace `actual.css` with `actual.layer.css`:

```css
/* Before — classes may override existing project styles */
@import "actual-css";

/* After — all Actual rules are scoped to the `actual` layer */
@import "actual-css/css/layer";
```

Author styles outside any layer will win over layer styles with equal specificity.

## Layer structure

A single `actual` layer. The internal import order is a contract: later imports
can override earlier ones within the layer. Sublayers (`actual.reset`,
`actual.components`, etc.) are reserved for future use if the single layer
causes real-world override issues.

## Import order contract

Within `actual.css` (the minimal core) the order is:

1. Reset
2. Tokens
3. Theme
4. Base (document defaults)
5. Intents
6. Variants
7. Focus
8. Print

This order is stable. If a future version introduces sublayers, the relative
order will be preserved.

## Limitations

- `actual.layer.css` cannot protect against conflicts with other layered
  frameworks that also use `@layer actual`. If both projects use the same
  layer name, the later `@layer` declaration wins.
- The layer applies only when importing from `actual.layer.css`. Direct
  imports of individual files bypass the layer.
