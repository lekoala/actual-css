# Progressive Enhancements

> The optional JavaScript runtime that completes Actual's interactive components — dialog, drawer, flyout, tooltip, tabs, scrollspy, and status bar — through progressive enhancement.

UI components need JavaScript or modern platform behavior to be complete. They
follow the same principles as every component: semantic markup first, small
class API, shared tokens, and progressive enhancement.

- CSS owns layout, surfaces, state styling, and transitions.
- JavaScript owns open/closed state, ARIA synchronization, focus management, keyboard behavior, and dismissal.
- Prefer native platform features when they fit, with small helpers where browser support or ergonomics need it.
- Keep behavior optional when possible. Markup should remain understandable without JavaScript.
- Use shared button classes and variants for triggers.
- Do not add toasts. Use alerts, status regions, dialogs, or inline validation instead.

## Popover ownership

Actual drives the top layer itself. On every surface and tooltip its runtime
manages, `surface.js` and `tooltip.js` own the `popover` attribute and both
`showPopover()` and `hidePopover()`.

On a managed element, an application must not:

- set or change `popover`. The runtime writes `manual` over any other value, because `popover="auto"` hands the browser a dismissal policy of its own that competes with `data-flyout-auto-close`.
- call `showPopover()`, `hidePopover()`, or `togglePopover()`.
- cancel its `beforetoggle`. Preventing an open leaves Actual's state saying open while the element is not in the top layer, and nothing repairs that — Actual owns the lifecycle rather than mediating it.

To stop a surface from opening, cancel Actual's own `actual:surface-open`
instead. It is dispatched before anything is promoted, so cancelling it leaves
no state behind.

**What counts as managed is the runtime's decision, not the attribute's.** A
panel is managed when a `data-enhance="flyout"` trigger points at it through
`aria-controls`, or when a `data-context-menu` target names it; a tooltip is
managed when a `data-tooltip` trigger points at it. A `.flyout[popover]` or
`.tooltip[popover]` that no such trigger reaches is never touched — Actual
supplies its presentation and the application owns its lifecycle. That is the
supported way to drive either class with `popovertarget` or a third-party
lifecycle. Do not do both to the same element.

## Modules

The full runtime is `actual-css/js/full`. Each enhancer is also importable on its own
for projects that use custom components or want a smaller behavior surface:

```js
import "actual-css/js/dialog";
import "actual-css/js/flyout";
import "actual-css/js/tooltip";
```

Enhancer modules self-register when imported. They do not require init calls and
are safe to import during server-side rendering: outside a browser, registration
is a no-op until the module is loaded again with a DOM.

## Component pages

Each interactive component has its own page documenting the exact markup its
enhancement expects: Dialog, Drawer, Flyout, Tooltip, Tabs, Scrollspy, and
Status Bar. The full runtime is loaded on the docs pages, so the examples
work with the documented markup alone.
