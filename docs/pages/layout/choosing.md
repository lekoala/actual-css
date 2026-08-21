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
| Explicit region placement on a shared 12-column canvas       | `.column-layout`  |

For cards, products, results, and galleries, start with `.grid`. Use a fixed
`.grid-N` only when N columns remain part of the structure at every width. If
all peers should move together rather than form a partial row, use `.switcher`.

For a main region plus an aside, use `.sidebar-layout`.

Use `.column-layout` when the placement of each region is itself part of the
design — an 8 / 4 split, a 10-column article starting on column 2, a 3 / 6 / 3
shell. It is the one layout primitive with no automatic responsive behavior: the
canvas stays twelve columns and the application owns narrow-container
recomposition. Choose it because placement is the design, not because a mockup
happens to contain columns.

Reserve `--grid-columns` for track templates whose sizes carry meaning rather
than twelve interchangeable units, such as `minmax(12rem, 18rem) 1fr`. Its
narrow behavior is yours to write.

`.container-query` is a low-level opt-in for a component that changes its own
representation according to allocated space. It does not enable responsive
behavior for layout primitives and never changes their meaning.
