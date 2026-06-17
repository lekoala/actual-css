# Guidelines

Follow these guidelines as best as possible, but don't follow them blindly.
If guidelines conflict, think about what would be best or ask the user if no decisive answer can be made.

- Wide browser support (even older browsers, not IE 11)
- No compile, build step (it's just css)
- No post processing - use browsers prefix when needed
- Dark mode is for modern browsers only (light mode is default otherwise): use `light-dark()` for theme tokens (https://caniuse.com/wf-light-dark), keep `@media (prefers-color-scheme)` only for the `color-scheme` declaration
- Everything is themable (colors, radius, border-width...)
- Em/Rem are already spacing units : use em for consistent spacing with the size of the element (eg: bigger buttons)
- Grouping works with `role="group"` and `:has` (https://caniuse.com/css-has) : it's a progresssive enhancement, ui should
still be functional without it
- Prefer container queries of media queries (https://modern-css.com/responsive-components-without-media-queries/) : local behaviour
- Components don't deal with page layout (no "margin-bottom" for a card)
- Avoid inline styles when possible (use utilities)
- Use logical properties (https://modern-css.com/direction-aware-layouts-without-left-and-right/) — prefer `padding-block`/`padding-inline` over physical `padding` shorthands when axes differ; symmetric single-value `padding` is fine
- Don't fight z-index, isolate (https://modern-css.com/z-index-isolation/) — when a z-index is unavoidable, source it from a `--z-*` token, not a magic number
- Naming: try to stick to https://uiterms.com/ naming
- Must be accessible by default (keyboard navigation, aria-label, hidden element, proper semantic) — every interactive element gets a `:focus-visible` ring, including links, summaries, and nav items
- Works everywhere, works best on modern browsers
- Explicit color scheme
- CSS nesting is not allowed - code must be findable as exposed in the inspector
- Organize css code AS IF we are using css nesting. Related rules reads one after another and organized together
- Icons could be <i> or inlined <svg>
- Avoid transition all unless needed, try to target specific properties
- Use @supports positively (no @supports not) — default to the flat baseline, gate the enhanced declaration inside a positive `@supports`
- Every `color-mix()` declaration needs a flat fallback outside `@supports` (older browsers drop the whole property, not just the function)
- Prefix all `@keyframes` with `actual-` to avoid collisions with consumer code
- Each component must have a small surface and be easy to opt-out
