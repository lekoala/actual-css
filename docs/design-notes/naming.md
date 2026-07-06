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

- Classes name components, not markup. Prefer the established UI term even when it matches the element (`.form`, `.select`, `.table`); do not invent synonyms just to avoid repetition.
- When one element can host multiple components, use the component role instead of the element name (`.modal` / `.drawer` on `dialog`, `.check` / `.radio` / `.switch` on `input`).
- Do not merely restate the element when a more precise or canonical component name exists (`.key`, not `.kbd`; `.modal` / `.drawer`, not `.dialog`).
- Prefer the shortest established term when it improves searchability without drifting from the component vocabulary (`.btn`, not `.button`).
- Inside a scope such as `.form`, native controls should work without standalone classes where practical. Classes like `.input`, `.select`, `.check`, and `.radio` remain the opt-in API for use outside that scope.
- Classes name roles and boolean modifiers; `data-*` carries configurable values.
- `is-*` classes are runtime internals, not author API.
- Public JS data attributes are namespaced by feature (`data-flyout-*`, `data-context-menu-*`, `data-dialog-*`, `data-tooltip-*`; `data-toast-*` is reserved). Do not expose shared implementation names such as `surface` unless they are meant as a stable author concept.
- Custom events use the `actual:*` namespace.
