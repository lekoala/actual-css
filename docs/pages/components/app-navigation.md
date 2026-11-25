# App navigation

> Primary application destinations in a persistent bottom bar or labelled side navigation.

Use one `.app-nav` landmark for the application's primary destinations. Links
remain links, and `aria-current="page"` is the only current-page state.

Reach for `.app-nav` only as part of a persistent application shell: it exists
as a direct child of `.app-layout`, which turns the landmark from a bottom bar
into side navigation. A site or webapp header with normal scrolling stays
`.navbar` — `.app-nav` is not a stacked-icon variant of the horizontal bar. See
[Navbar](navbar.md).

**Related terms:** tab bar, bottom navigation, bottom nav, navigation rail, side navigation.

```html demo
<nav class="app-nav" aria-label="Primary">
  <a href="#today" aria-current="page">
    <span aria-hidden="true">☀</span>
    <span>Today</span>
  </a>
  <a href="#tasks">
    <span aria-hidden="true">✓</span>
    <span>Tasks</span>
  </a>
  <a href="#settings">
    <span aria-hidden="true">⚙</span>
    <span>Settings</span>
  </a>
</nav>
```

On its own, `.app-nav` is a sticky bottom bar. Compose it as a direct child of
`.app-layout` to let the layout turn the same landmark into side navigation when space
permits. The component contains no JavaScript and does not manage routing.
The icon slot accepts SVGs, images, and decorative elements such as icon-font
`i` elements marked with `aria-hidden="true"`.

## Usage

- A tile is a direct-child `a` or `button`. Use a button for an action that is
  not a destination, such as a "More" button that opens a
  [drawer](drawer.md) holding the secondary destinations.
- `aria-current="page"` goes on a link only. When the current page lives in
  the "More" drawer, mark the link in the drawer, not the button: the button
  opens a group of destinations and keeps `aria-expanded`.
- A disabled destination is a `button` with `disabled`.

## Header and footer

Inside `.app-layout`, side navigation can carry a brand and a primary action
above the destinations and an account block below them. Put them in one
direct-child `header` and one direct-child `footer`. The header's first child,
usually the brand, shares the topbar's band; anything after it stacks below.
The footer sits at the block end and follows the last link when the
destinations outgrow the viewport. An account menu there is a
[flyout](../enhancements/flyout.md) opening upward
(`data-flyout-placement="top-start"`); the
[Tasks template](../../demo/templates/tasks.html) has one.

```html
<nav class="app-nav" aria-label="Primary">
  <header>
    <a class="navbar-brand" href="/">Fieldwork</a>
    <a class="btn primary" href="/new">New task</a>
  </header>
  <a href="/today" aria-current="page">…</a>
  <a href="/tasks">…</a>
  <footer>
    <button class="btn ghost" type="button">Account</button>
  </footer>
</nav>
```

Both are optional. Without a `header`, the brand belongs in the topbar, which
then spans the navigation; see
[App layout](../layout/app-layout.md#where-the-brand-lives).

At most one of each per `.app-nav`. The bottom bar hides both: it has room for
destinations only, so give their content a second home on a phone — identity in
the topbar, the primary action in a [FAB](fab.md), the account behind a button
tile that opens a bottom-sheet [drawer](drawer.md) with the same items. The
[Tasks template](../../demo/templates/tasks.html) shows that account tile; it
hides the tile from the side breakpoint, where the footer takes over. Use an
SVG or icon-font glyph in the tile: the icon slot sizes its font to
`--app-nav-icon-size`, which an avatar's initials do not survive.

## Rail

Set `data-nav="rail"` on `.app-layout` to show the side navigation as a narrow
rail. Each tile keeps its label as a small caption under the icon, as in the
bottom bar, so the rail needs no tooltip. Two-word labels wrap onto a second
line; keep labels to one or two short words. The bottom bar ignores the
attribute.

The application owns the preference: the toggle, its label, and persisting the
choice. What the header and footer show on the rail, such as a compact brand
mark, is application CSS keyed to the same attribute. See
[App layout](../layout/app-layout.md#rail).

## Hooks

- `--app-nav-size` controls the minimum bottom-bar size.
- `--app-nav-gap` controls spacing between destinations.
- `--app-nav-current-bg` and `--app-nav-current-fg` repaint the current state,
  for example a soft tint instead of the selected fill. The bottom bar and the
  rail paint a pill around the icon and keep the label in the bar's ink;
  labelled side navigation fills the whole row. The fill is the only current
  cue, so keep it distinct from the navigation surface.
