# Application UI boundaries

Actual CSS provides application chrome and content composition without owning
the application lifecycle.

```text
app-shell   full-height primitive
topbar      persistent top application chrome
app-layout  topbar, scrolling main region, and primary navigation arrangement
app-nav     primary application destinations
list        repeated application rows with leading/content/trailing regions
status-bar  passive transient feedback
```

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
