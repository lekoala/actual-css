# Future Transition: CSS Anchor Positioning

## Context

Currently, the positioning logic for tooltips, flyouts, and context menus is handled by a custom JavaScript engine (in `floating.js`). This engine computes absolute coordinates, handles viewport boundaries, and applies "flip" and "shift" heuristics to prevent overflow.

As of mid-2024, modern browsers started supporting the **CSS Anchor Positioning API**, which delegates this heavy mathematical lifting directly to the browser's layout engine.

## Migration Path

When global browser support for CSS Anchor Positioning reaches a safe threshold (~95%), the JS positioning engine should be deprecated in favor of a CSS-only approach.

### 1. Element-to-Element Anchoring (Tooltips & Flyouts)

For elements anchored to physical DOM nodes (like a button triggering a flyout), the JS calculation can be fully replaced by CSS:

```css
.flyout {
  position: absolute;
  position-anchor: --trigger-element;
  top: anchor(bottom);
  left: anchor(start);
  
  /* Replaces the JS flip/shift logic natively */
  position-try-fallbacks: flip-block, flip-inline;
}
```

### 2. The Pointer Coordinates Exception (Context Menus)

CSS Anchor Positioning does not cover 100% of our use cases. Context menus (repositionAt) open at dynamic pointer coordinates (clientX/clientY), not relative to a DOM element.

Therefore, the JS engine cannot be entirely deleted. A lightweight JavaScript layer will still be required to capture the pointer event and pass the coordinates to the DOM (either by updating CSS variables --x/--y, or using the upcoming JS Virtual Anchor API).
