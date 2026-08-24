# App Layout

> Specialized application recipe with a topbar, independently scrolling content, and one adaptive primary navigation landmark.

Use `.app-layout` only when all three direct regions are intentional:

- `.topbar` is persistent application chrome;
- `.app-main` is the page's independent scroll container;
- `.app-nav` changes from bottom navigation to labelled side navigation.

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

A direct-child `.fab` overlays the end of the main grid area. It therefore
clears both bottom and side navigation without copying the navigation size or
bottom safe-area inset. When navigation moves aside, the layout applies the
bottom inset at the viewport edge. Outside this recipe, FAB keeps its
viewport-fixed placement.

The recipe uses the dynamic viewport token and gives scrolling to `.app-main`,
which avoids fixed-position offsets and keeps mobile keyboard resizing within
the same layout contract. The topbar preserves its normal spacing below the
top safe-area inset. The recipe provides no routing or page lifecycle.

### Hooks

- `--app-nav-side-size` controls the side navigation track.
