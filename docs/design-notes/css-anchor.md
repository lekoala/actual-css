# CSS Anchor Positioning

The CSS Anchor Positioning API is designed to replace the JS positioning engine. It covers 100% of the use cases (arrow, flip/up-down, shift).

## Flip / Shift

Collisions are handled natively via `position-try-options`. The browser automatically picks the layout that fits the viewport.

```css
.tooltip {
  position: absolute;
  position-anchor: --my-button;
  top: anchor(bottom);
  justify-self: anchor-center;

  position-try-options: flip-block, flip-inline;
}
```

When the user scrolls and space below disappears, the browser flips the tooltip above the button (`flip-block`) without JavaScript.

## Arrow

The pseudo-element can anchor to the target center regardless of the tooltip position.

```css
.tooltip::before {
  content: "";
  position: absolute;
  left: anchor(center);
  bottom: 100%;
}
```

If the tooltip shifts left due to the viewport edge, the arrow stays fixed on `anchor(center)`.

## Recommendation: keep JS for now

CSS Anchor Positioning is the right long-term replacement, but the current JS implementation is the pragmatic choice today:

- **Compatibility**: JS works on 100% of browsers today. CSS Anchor Positioning leaves out older Apple devices (pre-Safari 18) and older Firefox.
- **Performance**: The existing math functions (`l`, `i`, `vb`) are pure, minified, fast, and dependency-free.

Revisit CSS Anchor Positioning for v2 when global support reaches ~95%.
