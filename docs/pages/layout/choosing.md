# Choosing a layout

Choose a primitive from the relationship between its children, not from the
number of children visible in one mockup.

| Situation                                                    | Primitive         |
|--------------------------------------------------------------|-------------------|
| Vertical flow                                                | `.stack`          |
| Inline actions, tags, or navigation that may wrap            | `.cluster`        |
| Responsive collection; an incomplete final row is acceptable | `.grid`           |
| Exact structural column count                                | `.grid-N`         |
| Peer regions that must switch together                       | `.switcher`       |
| Main content followed by a secondary region                  | `.sidebar-layout` |
| Fixed media followed by flexible content                     | `.media`          |

For cards, products, results, and galleries, start with `.grid`. Use a fixed
`.grid-N` only when N columns remain part of the structure at every width. If
all peers should move together rather than form a partial row, use `.switcher`.

For a main region plus an aside, use `.sidebar-layout`. Reserve
`--grid-columns` for exact editorial templates whose ratios are intentional and
whose narrow behavior the application will own.

`.container-query` is a low-level opt-in for a component that changes its own
representation according to allocated space. It does not enable responsive
behavior for layout primitives and never changes their meaning.
