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

On a managed element, leave `popover` and its native show/hide methods to the
runtime, and let `beforetoggle` proceed. To stop a surface from opening,
cancel `actual:surface-open`.

The runtime manages elements connected to these triggers:

- `data-enhance="flyout"`, pointing to the panel through `aria-controls`.
- `data-context-menu`, naming the menu.
- `data-tooltip`, pointing to the tooltip.

You can drive an unconnected `.flyout[popover]` or `.tooltip[popover]` with
`popovertarget` or a third-party library. Actual supplies its appearance;
your code owns opening and dismissal. Use one owner per element.

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

Load the full bundle **or** individual source modules. Mixing them, or loading
two bundles, registers behaviors twice and can make a flyout close immediately
after opening. The runtime warns in the console when a second copy loads.

## Component pages

Each interactive component has its own page documenting the exact markup its
enhancement expects: Dialog, Drawer, Flyout, Tooltip, Tabs, Scrollspy, and
Status Bar. The full runtime is loaded on the docs pages, so the examples
work with the documented markup alone.
