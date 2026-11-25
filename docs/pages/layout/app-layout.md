# App layout

> Specialized application recipe with a topbar, independently scrolling content, and one adaptive primary navigation landmark.

Use `.app-layout` only when all three direct regions are intentional:

- `.topbar` is persistent application chrome;
- `.app-main` is the page's independent scroll container;
- `.app-nav` changes from bottom navigation to labelled side navigation.

**Related terms:** app shell, workspace, inset shell, tab bar, bottom
navigation, side navigation, navigation rail, master-detail app.

This is not a generic wrapper for a website, dashboard, or anything described
as an "app." It fixes the shell to the dynamic viewport and hides overflow on
that shell. A public, marketing, editorial, or normally scrolling page should
use semantic landmarks, optionally `.app-shell` for full-height document flow,
and `.navbar` for top-level site navigation.

```html demo
<div class="app-shell app-layout" style="block-size: 30rem">
  <header class="topbar">
    <strong>Tasks</strong>
  </header>
  <main class="app-main padding-context">
    <div class="stack">
      <h2>Today</h2>
      <p>The main region scrolls without displacing the application chrome.</p>
    </div>
  </main>
  <nav class="app-nav" aria-label="Primary">
    <a href="#today" aria-current="page"><span aria-hidden="true">☀</span><span>Today</span></a>
    <a href="#tasks"><span aria-hidden="true">✓</span><span>Tasks</span></a>
    <a href="#settings"><span aria-hidden="true">⚙</span><span>Settings</span></a>
  </nav>
  <div class="fab">
    <button class="btn primary circle icon-only" type="button" aria-label="Add task">+</button>
  </div>
</div>
```

The direct-child relationship is required, not illustrative: `.app-layout`
assigns those children to named grid areas and changes `.app-nav` from a bottom
bar to labelled side navigation. Missing, renamed, or wrapped regions mean a
different layout contract should be used.

## Where the brand lives

From the side breakpoint, the brand's place decides who owns the top-left
corner:

- brand in the topbar, no `header` in `.app-nav`: the topbar is a global bar
  over the navigation, for identity, global search, the account and other
  application-wide context. Collapsing the rail leaves the brand untouched.
- brand in a side `.app-nav > header`: the navigation runs the full height,
  the compact shape of a small standalone app.

No attribute chooses between them; adding or removing the `header` does. The
[Tasks template](../../demo/templates/tasks.html) switches between both from
its account menu.

The topbar earns its band with global actions, such as search or creation.
Without any, hide it from the side breakpoint (`@media (min-width: 48rem)`):
its row collapses, the side navigation's `header` carries the brand, and a
phone keeps the topbar, where that header is hidden. Size
`--app-layout-bar-size` to the main region's first row so the brand stays on
its line; the [Tasks template](../../demo/templates/tasks.html) does this.

A direct-child `.fab` overlays the end of the main grid area. It therefore
clears both bottom and side navigation without copying the navigation size or
bottom safe-area inset. When navigation moves aside, the layout applies the
bottom inset at the viewport edge. Outside this recipe, FAB keeps its
viewport-fixed placement.

The recipe uses the dynamic viewport token and gives scrolling to `.app-main`,
which avoids fixed-position offsets and keeps mobile keyboard resizing within
the same layout contract. The topbar preserves its normal spacing below the
top safe-area inset. The recipe provides no routing or page lifecycle.

The [Tasks template](../../demo/templates/tasks.html) composes it with a
master-detail workspace inset on the canvas: `.app-nav` drops its own surface,
and `.app-main` carries the raised one.

## Rail

`data-nav="rail"` is a desktop preference for a captioned rail instead of labelled
side navigation. Below the side breakpoint both produce the same bottom bar.

```html
<div class="app-layout" data-nav="rail">
```

The layout only draws the rail. Toggling the attribute, labelling the toggle
and remembering the choice belong to the application; to use the rail on
tablets only, set the attribute from `matchMedia`. See
[App navigation](../components/app-navigation.md#rail) for what each tile shows.

## Hooks

- `--app-nav-side-size` controls the side navigation track.
- `--app-nav-rail-size` controls the rail track.
- `--app-layout-bar-size` is the top band shared by the topbar and the first
  row of a side `.app-nav > header`, so the brand sits on the topbar's line and
  the first destination starts level with the main region. Raise it when the
  topbar holds taller content, or size it to the main region's first row when
  the topbar is hidden on desktop.
