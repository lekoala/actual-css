# App Layout

> Application recipe with a topbar, independently scrolling content, and one adaptive primary navigation landmark.

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
</div>
```

The direct-child relationship is intentional: `.app-layout` owns the grid and
changes `.app-nav` from a bottom bar to labelled side navigation. `.app-nav`
does not make that application-level decision by itself.

The recipe uses the dynamic viewport token and gives scrolling to `.app-main`,
which avoids fixed-position offsets and keeps mobile keyboard resizing within
the same layout contract. It provides no routing or page lifecycle.

### Hooks

- `--app-nav-side-size` controls the side navigation track.
