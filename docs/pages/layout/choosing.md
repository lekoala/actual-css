# Choosing a layout

Choose a primitive from the relationship between its children, not from the
number of children visible in one mockup.

## Page and application shells

| Situation | Recipe |
|---|---|
| Public, marketing, editorial, or normally scrolling page | Semantic landmarks; optionally `.app-shell`, with `.navbar` for site navigation |
| Persistent topbar + independently scrolling main + bottom-to-side primary navigation | `.app-layout` with its exact direct-child contract |

Do not choose `.app-layout` from the word "app" or from the presence of a
header. Its viewport-sized grid, hidden shell overflow, internal main scroll,
and adaptive `.app-nav` are one indivisible behavior. If any of those is not
wanted, compose the ordinary page from semantic landmarks and the primitives
below.

## Content relationships

| Situation                                                    | Primitive         |
|--------------------------------------------------------------|-------------------|
| Vertical flow                                                | `.stack`          |
| Inline actions, tags, or navigation that may wrap            | `.cluster`        |
| Responsive collection; an incomplete final row is acceptable | `.grid`           |
| Known structural density, at most N columns                 | `.grid-N`         |
| Peer regions that must switch together                       | `.switcher`       |
| Main content followed by a secondary region                  | `.sidebar-layout` |
| Fixed media followed by flexible content                     | `.media`          |
| Explicit region placement on a shared 12-column canvas       | `.column-layout`  |

For cards, products, results, and galleries, start with `.grid`. Use a fixed
`.grid-N` only when N columns remain part of the structure at every width. If
all peers should move together rather than form a partial row, use `.switcher`.

For a main region plus an aside, use `.sidebar-layout`.

Use `.column-layout` when the placement of each region is itself part of the
design — a 10-column article starting on column 2, regions in separate sibling
sections that must share the same column lines, an editorial composition whose
starts and spans are deliberately aligned across the page. It is the one layout
primitive with no automatic responsive behavior: the canvas stays twelve
columns and the application owns narrow-container recomposition. Choose it
because placement is the design, not because a mockup happens to contain
columns.

Use `--grid-columns` for exact track templates that do not match a built-in
layout contract: arbitrary structural counts such as seven calendar days,
asymmetric fractional tracks, or mixed intrinsic/flexible tracks. Once set, the
application owns narrow-container behavior.

`.container-query` is a low-level opt-in for a component that changes its own
representation according to allocated space. It does not enable responsive
behavior for layout primitives and never changes their meaning.
