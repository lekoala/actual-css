# Application UI boundaries

Actual CSS provides application chrome and content composition without owning
the application lifecycle.

```text
app-shell      full-height single-column document flow
sidebar-shell  persistent side region + main, each scrolling, on a wide viewport
topbar         persistent top application chrome
app-layout     specialized topbar + internal scroll + adaptive navigation recipe
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

## Sidebar shell

An admin or dashboard keeps a sidebar beside its content on a wide screen and
hands it to a drawer on a phone. None of the existing shapes is that:
`.app-shell` is one column, `.sidebar-layout` a wrapping pair inside a page,
and `.app-layout` moves navigation to a bottom bar.

Contract:

- Two direct children: an `aside` (the side region, any content) and one
  other element (the main region). The drawer is a separate `dialog.drawer`
  outside the shell; the two are never one element transformed.
- At `64rem` and up, a viewport-height grid, side then main. Each region
  scrolls on its own, so the sidebar never scrolls away with the content.
- Below `64rem`, the side region is hidden and the document scrolls. A phone
  keeps its native behaviors: the collapsing URL bar, tap-to-top, and a
  virtual keyboard that resizes the document rather than a fixed box.
- The breakpoint is a literal: a custom property cannot sit in a media
  condition. A project that needs another one copies the two rules.
- Hidden with `(width < 64rem)`, not shown above it: the side region keeps
  the author's own `display` (an `aside.stack`). Where range syntax is
  unsupported the rule drops and the sidebar stacks above the content, still
  reachable.
- CSS only. Closing an open drawer when the viewport widens belongs to the
  page (`matchMedia` change → `dialog.close()`), a documented recipe rather
  than a watcher in the primitive.
- Print is one flow, side then main, nothing clipped. The narrow rule is
  `screen` only: print never hides framework content, so leaving the sidebar
  off paper is the application's print stylesheet.

Rejected: a bottom navigation (that is `.app-layout`), a collapsible icon rail
(an application state), and a breakpoint hook (impossible in a media query).

Compact UI vocabulary remains semantic rather than shape-driven:

- use `.btn.sm` for compact actions and `aria-pressed` filters;
- use `.badge` for passive counts, statuses, and categories;
- use `.badge` with a `.close` button when a displayed tag can be removed;
- use `.status-bar` for passive feedback, not an actionable toast.

There is no generic chip or snackbar component. Those names conflate different
HTML semantics that the existing components already keep explicit.
