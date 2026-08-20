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

## Modules

The full runtime is `actual-css/js`. Each enhancer is also importable on its own
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
Status Bar. The default runtime is loaded on the docs pages, so the examples
work with the documented markup alone.
