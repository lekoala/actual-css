# Application UI boundaries

Actual CSS provides application chrome and content composition without owning
the application lifecycle.

```text
app-shell   full-height single-column document flow
topbar      persistent top application chrome
app-layout  specialized topbar + internal scroll + adaptive navigation recipe
app-nav     primary application destinations
list        repeated application rows with leading/content/trailing regions
status-bar  passive transient feedback
```

`app-layout` is selected by that complete behavior, never by product category.
Public sites and applications with ordinary document scrolling stay on
semantic landmarks and may use `app-shell`; a site header uses `navbar`.

Routing, navigation history, application state, SPA page lifecycle, service
workers, manifests, offline policy, and install prompts belong to the
application. Actual does not prescribe Material breakpoints or device classes;
the application layout changes when its available viewport can accommodate
labelled side navigation.

Compact UI vocabulary remains semantic rather than shape-driven:

- use `.btn.sm` for compact actions and `aria-pressed` filters;
- use `.badge` for passive counts, statuses, and categories;
- use `.badge > button` when a displayed tag can be removed;
- use `.status-bar` for passive feedback, not an actionable toast.

There is no generic chip or snackbar component. Those names conflate different
HTML semantics that the existing components already keep explicit.
