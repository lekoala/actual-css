# Guidelines

Follow these guidelines as best as possible, but don't follow them blindly.
If guidelines conflict, think about what would be best or ask the user if no decisive answer can be made.

- Works everywhere, works best on modern browsers. Wide browser support (even older browsers, not IE 11)
- No compile, build step (it's just css)
- No post processing - use browsers prefix when needed
- Dark mode is for modern browsers only (light mode is default otherwise): use `light-dark()` for theme tokens (https://caniuse.com/wf-light-dark), keep `@media (prefers-color-scheme)` only for the `color-scheme` declaration
- Everything is themable (colors, radius, border-width...)
- Em/Rem are already spacing units : use em for consistent spacing with the size of the element (eg: bigger buttons)
- Grouping works with `role="group"` and `:has` (https://caniuse.com/css-has) : it's a progresssive enhancement, ui should
still be functional without it
- Keep `:has()` out of selector lists that also contain legacy-safe selectors. Put the `:has()` branch in `@supports selector(...)` so older browsers do not invalidate unrelated rules.
- Prefer container queries of media queries (https://modern-css.com/responsive-components-without-media-queries/) : local behaviour
- Components don't deal with page layout (no "margin-bottom" for a card)
- Avoid inline styles when possible (use utilities)
- Use logical properties (https://modern-css.com/direction-aware-layouts-without-left-and-right/) — prefer `padding-block`/`padding-inline` over physical `padding` shorthands when axes differ; symmetric single-value `padding` is fine
- Don't fight z-index, isolate (https://modern-css.com/z-index-isolation/) — when a z-index is unavoidable, source it from a `--z-*` token, not a magic number
- Naming: try to stick to https://uiterms.com/ naming
- Must be accessible by default (keyboard navigation, aria-label, hidden element, proper semantic) — every interactive element gets a `:focus-visible` ring, including links, summaries, and nav items
- Explicit color scheme
- CSS nesting is not allowed - code must be findable as exposed in the inspector. Organize css code AS IF we are using css nesting. Related rules reads one after another and organized together
- Icons could be <i> or inlined <svg> (typically, using tabler icons like <i class="ti ti-settings" aria-hidden="true"></i>)
- Avoid `transition: all` unless needed, try to target specific properties
- Use `@supports` positively (no `@supports not`) only when it protects a dependent group of rules or a real fallback/modern branch. Do not gate a single progressive declaration whose unsupported value is simply ignored by the browser, such as `text-wrap: balance`.
- Layer-compatible, not layer-dependent. Unlayered for the Degraded target; expose cascade layers only through optional wrappers such as `actual.layer.css`.
- Public CSS grammar is `.component [intent] [variant] [size] [modifier]`. Classes name roles and boolean modifiers; `data-*` carries configurable values; `is-*` classes are runtime internals, not author API.
- Public data attributes are namespaced by feature (`data-menu-*`, `data-dialog-*`, `data-tooltip-*`). Do not expose shared implementation names such as `surface` unless they are meant as a stable author concept.
- JavaScript modules are side-effect enhancers. `actual-css/js` enables everything; `actual-css/js/<module>` lets projects opt into one behavior. Keep modules self-registering and safe to import independently.
- Every `color-mix()` declaration needs a flat fallback outside `@supports` (older browsers drop the whole property, not just the function)
- CSS data-URI icons should be masks when possible, with color supplied by CSS. Use `background-image` icons only for controls that cannot use masks/currentColor.
- Prefix all `@keyframes` with `actual-` to avoid collisions with consumer code
- Each component must have a small surface and be easy to opt-out
- Component names must be easy to search (eg: `btn` vs `button`) and should not repeat the html element (no <kbd class="kbd"> or <dialog class="dialog">)
- Use native html (<button>, <dialog>) whenever possible. Augment with JS when needed (eg: improve usability). Use standalone web components only when behaviour needs a custom surface (eg: combobox, datepicker).

## Interactive states 

- Interactive controls must be identifiable at rest, either by their own styling or by clear surrounding context
- Interactive states are: rest, hover, active / pressed, focus-visible, disabled, selected / current / expanded (when applicable)
- Do not rely on hover alone to reveal interactivity
- Do not use color alone to communicate state
- Use structure, border, background, iconography, and spacing consistently
