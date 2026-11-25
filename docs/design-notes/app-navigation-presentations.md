# One app navigation, three presentations

Parts 1 to 4 of the direction are implemented and asserted in
`tests/browser/app-nav-presentations.test.js`; the `tasks` demo uses them. The
"Still open" questions are not settled.

## Problem

`.app-layout` gives one `.app-nav` landmark two presentations chosen by the
viewport: a bottom bar, then labelled side navigation from `48rem`. A real
product asks for more. A medical-practice application prototype built on
Actual CSS (the source of the `tasks` demo) needs:

- a brand at the head of the side navigation, wordmark or compact mark;
- a primary action in the side navigation ("+ Rendez-vous");
- an account block and a collapse toggle at its foot;
- a collapsed icon rail, chosen by the user, not by the viewport;
- a bottom bar with a "More" button that opens a drawer holding the rest;
- a soft current tint instead of the full `--state-selected` fill;
- a counter beside a side label that becomes a dot on the rail icon.

None of these fit `.app-nav`, which styles `> a` only. So the prototype skipped
`.app-layout` altogether: `.sidebar-shell` with a stack of `.btn.ghost` links,
a second hand-rolled `.mobile-navigation` with the same destinations, JavaScript
that keeps `aria-current` in sync across both, and `placeNavigation()`, which
moves the nav between hosts on a `matchMedia` change. That is roughly 120 lines
of shell CSS, two landmarks for one navigation, and a sync bug waiting to
happen. The `tasks` demo copied the shape until it was migrated to
`.app-layout`; the brief itself prescribed `.sidebar-shell`.

The cost of the gap is not the missing CSS. It is that the product falls back
to two competing navigation systems.

## Prior decision

[app-ui.md](app-ui.md) rejects "a collapsible icon rail (an application state)"
for `.sidebar-shell`. That holds there: the shell's side region takes any
content, so the framework cannot know what an icon-only form of it would be.
`.app-nav` is different: its tiles have a fixed icon + label anatomy, so the
icon-only form is defined by the component.

## Responsibilities

- Actual CSS: the responsive switch between bottom bar and side navigation,
  the geometry of all three presentations, the current-state paint.
- Application: the sidebar or rail preference and its persistence, routes,
  which destinations are primary, opening the "More" drawer.

The bottom bar ignores the desktop preference: below `48rem` both settings
produce the same bar.

## Direction

Each part stands alone and can ship separately.

### 1. Current tint hooks

`--app-nav-current-bg` and `--app-nav-current-fg`, fallback-only, read by
`a[aria-current="page"]` with the present `--state-selected` pair as fallback.
Same shape as `--nav-current-bg` / `--nav-current-fg` on `.nav-link`, so the two
navigations theme alike. Not coupled to the focus color: the `.segmented`
exception exists because its ring is inset on the selected fill, and an
`.app-nav` ring is not.

A pale tint must still identify the current tile on the rail, where the label
weight is gone. The fill is then the only cue, so its contrast against the nav
surface is the theme's responsibility; the docs say so beside the hooks.

### 2. Buttons as tiles

`.app-nav > :is(a, button)` share the tile anatomy. A button is how "More"
opens a drawer, and how a disabled destination renders.

### 3. Side-only regions: `header` and `footer`

At most one direct-child `header` (brand, primary action) and one `footer`
(account, rail toggle) per `.app-nav`. That limit is the component's contract,
not an HTML rule, and the docs state it.

- Side presentation: `header` first, `footer` pinned to the block end, links
  between them.
- Bottom bar: both hidden. The bar has room for destinations only; the topbar
  carries identity, `.fab` the primary action, the drawer the account. Anything
  in these regions needs a second home on a phone.

Element selectors rather than classes keep the anatomy out of the class
namespace. The primary action sits in `header`, before the links, as in
compose buttons; that needs no third region. What the compact brand mark and
the account block show on the rail is application CSS: Actual cannot know which
part of a logo survives.

### 4. Rail preference: `data-nav="rail"`

```html
<div class="app-layout">                  <!-- sidebar on desktop -->
<div class="app-layout" data-nav="rail">  <!-- rail on desktop -->
```

`rail` names the presentation; `collapsed` would name a transition. Only this
one value is public: no `sidebar` or `bottom`, no forcing the bar on desktop.
An application that wants the rail on tablets sets the attribute from
`matchMedia` itself.

In the side presentation only:

- the side track shrinks to `--app-nav-rail-size`;
- tiles keep their icon; the label is visually hidden with the `.sr-only`
  technique, so the accessible name survives. The prototype used
  `font-size: 0`, which keeps the name but leaves no handle for anything else.

### Implementation notes

- The side presentation is a flex column, not grid rows: `margin-block-start:
  auto` pins the footer, and `overflow-y: auto` lets a long list scroll with
  the footer after the last link instead of over it.
- The nav spans both layout rows, so its header cannot read the topbar's
  height: the brand sat 6px above the topbar's line and the first destination
  12px above the main region. `--app-layout-bar-size` gives both one band.
  Only the header's first row takes it, because a primary action stacked under
  the brand would otherwise grow the header and push the brand off the line.
  Subgrid was the alternative and fails here: the nav would need every
  destination wrapped to keep them out of the band row.
- A topbar earns its band with global actions. Three compositions were
  compared on the `tasks` demo: a global topbar holding only the brand and
  the theme picker (a band for nothing), no desktop topbar, and a toolbar
  inside the workspace. Fieldwork has no global action, so it hides the
  topbar from `48rem`; a product with global search (patient lookup) keeps it
  as a workspace toolbar. Hiding works with no framework change, since the
  empty row collapses; no `.no-topbar` variant. The cost is one copy of the
  `48rem` literal, the same friction as distributing destinations.
- A global topbar over the navigation (identity, search, active practice,
  account) suits a product with application-wide functions; the brand in the
  nav header suits a small standalone app. Building the global bar in
  application CSS meant restating the layout's area names, the rail columns
  and the `48rem` literal, so the layout owns it. The structure chooses: no
  nav `header`, and the topbar spans. No attribute, since moving the brand is
  already the decision. `:not(:has())` sets areas only: at its weight a full
  `grid-template` would override the rail's columns.
- Hover is in `:where(a, button:enabled)`. `:is()` takes its strongest
  argument, so `button:enabled` raised hover over `a[aria-current]` and
  repainted the current tile.
- In the rail, every tile child except the icon slot is hidden, a counter
  included: the count stays in the accessible name, and the visible dot is
  the open notification question below.
- In the `tasks` demo, an `aria-label` swap ("Collapse" / "Expand
  navigation") replaced `aria-pressed` on the toggle: a pressed `.btn` paints a
  selected fill that competes with the current destination. Aligning the
  header and footer content with the tile icons is application CSS there;
  a primary action spanning the tile width would want the opposite.

## Still open

### Distribution between the bar and the drawer

Desktop shows six destinations; the phone shows four, then "More", whose drawer
holds the other two plus the account. Three ways to decide who goes where:

- automatic overflow from available space: unpredictable, and a layout engine
  in CSS;
- moving links in the DOM by viewport: the original problem again;
- the application declares primary and secondary destinations: preferred.

The secondary destinations are then rendered twice, once as side-only tiles and
once in the drawer, from the same server-side definition. That is a small
markup duplication, not a second navigation system or a second source of
truth. Zero duplication is not the goal.

The friction to watch: hiding secondary tiles in the bar and "More" on desktop
means application media queries that copy the `48rem` literal, twice. Document
the composition first. If the `tasks` migration and the prototype both show that
copy, one presentation marker on tiles is the smallest framework answer.

### Current state behind "More"

`aria-current="page"` belongs on the link in the drawer, not on the button:
"More" opens a group of destinations and is not a page. The button keeps
`aria-expanded` and `aria-controls`, and may take an accessible description
naming the current section. Visually it should look current. Actual has no
visual-only state attribute today (`data-current` would be the first), so the
marker is decided at implementation, against the existing conventions.

### Tooltips on the rail

The rail needs a hover and focus label; the expanded sidebar does not. The
tooltip enhancement has no notion of presentation, so `data-tooltip` on every
tile would duplicate the visible label when expanded, and its
`aria-describedby` would make a screen reader announce the name twice. Check
whether the enhancement can stay wired and stay silent while the label is
visible, rather than adding and removing attributes on every switch.

### Notifications on the rail

A counter beside the label becomes a dot on the icon, and the count must
survive for assistive technology when the label is visually hidden. Start
from a `.badge` in the tile and `.indicator` around the icon before anything
new.

## Rejected

- **Two navigations, one per presentation.** The prototype's shape and the
  debt this note removes.
- **A separate `.app-rail` component.** The rail is a presentation of the same
  landmark, not a second navigation.
- **Viewport-driven collapse by default.** A breakpoint cannot be a hook, and
  an application can set `data-nav="rail"` from `matchMedia`.
- **An inset, floating or desktop variant of `.app-layout`.** The inset is
  composition and paint: the topbar and nav drop their surface, `.app-main`
  carries a raised one. It lives in the `tasks` demo. Revisit only if a third
  use shows the `.topbar` overrides (border, background, `backdrop-filter`)
  are the friction, and then as a paint default at zero specificity.

## Verification

The `tasks` migration is the integration test, the prototype the second real
case. Beyond unit browser tests of each part:

- an existing `.app-nav` without the new elements renders unchanged;
- many destinations on a short viewport: the nav scrolls, the footer never
  covers the last links;
- header or footer content wider than the rail;
- resize with the "More" drawer open, and with focus on an element about to
  disappear;
- switch sidebar and rail without losing the current state;
- notification counters in all three presentations, including their
  accessible text;
- long labels, RTL, zoom;
- current-state and focus contrast in light, dark and forced colors.
