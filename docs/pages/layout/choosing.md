# Choosing a layout

Choose a primitive from the relationship between its children, not from the
number of children visible in one mockup.

## Page and application shells

| Situation                              | Recipe                                      |
| -------------------------------------- | ------------------------------------------- |
| A normally scrolling page              | Semantic landmarks, optionally `.app-shell` |
| Topbar + scrolling main + adaptive nav | `.app-layout`                               |

For public, marketing, and editorial pages, use semantic landmarks and add
`.navbar` for site navigation.

Use `.app-layout` for a viewport-sized shell where the main region scrolls
independently and navigation moves from bottom to side. Follow its
[required structure](app-layout.md). For other arrangements, compose the
primitives below.

## Content relationships

| Situation                                                    | Primitive         |
| ------------------------------------------------------------ | ----------------- |
| Vertical flow                                                | `.stack`          |
| Inline actions, tags, or navigation that may wrap            | `.cluster`        |
| Responsive collection; an incomplete final row is acceptable | `.grid`           |
| Known structural density, at most N columns                  | `.grid-N`         |
| Peer regions that must switch together                       | `.switcher`       |
| Main content followed by a secondary region                  | `.sidebar-layout` |
| Fixed media followed by flexible content                     | `.media`          |
| Explicit region placement on a shared 12-column canvas       | `.column-layout`  |

For cards, products, results, and galleries, start with `.grid`. Use a fixed
`.grid-N` only when N columns remain part of the structure at every width. If
all peers should move together rather than form a partial row, use `.switcher`.

For a main region plus an aside, use `.sidebar-layout`.

Use `.column-layout` for deliberate placement on a shared 12-column canvas:
an inset article, aligned sections, or an editorial composition. It keeps
twelve columns at every width; add application CSS to rearrange it in narrow
containers.

Use `--grid-columns` for exact track templates that do not match a built-in
layout contract: arbitrary structural counts such as seven calendar days,
asymmetric fractional tracks, or mixed intrinsic/flexible tracks. Once set, the
application owns narrow-container behavior.

`.container-query` is a low-level opt-in for a component that changes its own
representation according to allocated space. It does not enable responsive
behavior for layout primitives and never changes their meaning.
