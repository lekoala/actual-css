# Naming conventions

## Sources

- Stick to [uiterms.com](https://uiterms.com/) naming when choosing component and pattern names.
- Reference [Open UI](https://open-ui.org/) research when designing new primitives.

## Public class grammar

Actual CSS uses bare global class names as its public CSS API. The grammar is:

```
.component [intent] [variant] [size] [modifier]
```

Examples:

```html
<button class="btn primary outline lg">Publish</button>
<span class="badge success soft">Online</span>
<section class="card raised stack">...</section>
```

Documented classes are the public API. Treat them like package exports: adding one is an API decision, renaming or removing one is breaking, and `is-*` classes belong to runtime internals rather than the author API.

Actual CSS is intended for new projects. Existing projects with class collisions should use `actual.layer.css`, import order, or their own prefix transform as a pipeline output. The primary API remains unprefixed.

### Rules

- Component names must be easy to search (eg: `btn` vs `button`) and should not repeat the HTML element (no `<kbd class="kbd">` or `<dialog class="dialog">`).
- Classes name roles and boolean modifiers; `data-*` carries configurable values.
- `is-*` classes are runtime internals, not author API.
- Public JS data attributes are namespaced by feature (`data-flyout-*`, `data-context-menu-*`, `data-dialog-*`, `data-tooltip-*`; `data-toast-*` is reserved). Do not expose shared implementation names such as `surface` unless they are meant as a stable author concept.
- Custom events use the `actual:*` namespace.
