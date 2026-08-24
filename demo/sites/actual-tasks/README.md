# Actual Tasks mobile demo

This framework-free task demo exercises Actual CSS as application UI rather
than as a component gallery. Build the distribution files, then open
`demo/sites/actual-tasks/index.html`.

## Screens

- **Today** tests compact filters, task states, badges, choices, and an empty state.
- **Tasks** tests search, tabs, skeleton loading, dialog validation, dynamic rows, and compact ratings inside list content.
- **Projects** tests responsive cards, progress, badges, and avatar stacks.
- **Activity** tests ordered three-zone lists, long text, metadata, and grouping.
- **Settings** tests form controls, theme islands, switches, and local preferences.

The demo deliberately keeps routing, history, and local preferences in
`app.js`. Actual owns only the UI primitives and progressive enhancements.
Interface icons come from the pinned Tabler Icons webfont, matching the other
full-page demos.

## Friction audit

| Local rule | Classification | Decision |
|---|---|---|
| `.mobile-brand`, `.mobile-page`, task metadata and empty state | Product-specific | Keep local. |
| `.mobile-filters > .btn` | Product shape | Existing `.btn.sm` and `aria-pressed` cover the behavior; no chip component. |
| Three-zone task/settings rows | Repeated framework gap | Promoted to `.list` / `.list-item`; no local row geometry remains. |
| Topbar safe-area padding | Framework integration gap | Promoted to `.app-layout`, which owns chrome touching the physical viewport edge. |
| FAB/app-nav avoidance | Composition gap | Promoted to `.app-layout`; a direct-child FAB overlays the main grid area instead of copying navigation geometry. |

The app uses `.status-bar` for passive create, delete, completion, and
preference feedback. It intentionally does not add an actionable snackbar.
