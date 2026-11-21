# Scrollspy

> Behavior hook for navigation that marks the active section while the page scrolls.

Scrollspy is a behavior hook, not a visual component. It marks a navigation
region for the JavaScript enhancement. Pair it with `.nav-list` and `.nav-link`,
or style `[aria-current="location"]` yourself.

## Class reference

| Class        | Kind        | Description                                                   |
| ------------ | ----------- | ------------------------------------------------------------- |
| `.scrollspy` | Component   | Marks the nav region for the enhancer; adds no visual styles. |
| `.nav-list`  | Composition | Vertical list of navigation links.                            |
| `.nav-link`  | Component   | Navigation link, current on `aria-current="location"`.        |

## Usage

- `.scrollspy` marks the region for JS detection. It does not add visual styles.
- `.nav-list` and `.nav-link` provide the visible list and active link styling.
- The JS enhancer toggles `aria-current="location"` on the active link. Without JavaScript, the links remain regular anchor links.
- The active section is the last heading past the activation line. Over the final viewport of scroll travel, the line advances to the bottom so short trailing sections become active in order. Above the first section, no link is active.
- `data-scrollspy-root="#container"` measures a scroll container instead of the viewport.
- `data-scrollspy-offset` moves the activation line: a bare number or `px` value is pixels, a `%` value is a share of the root's visible height. Invalid values fall back to `20%`, and negatives clamp to `0`.
- The same markup also works with the CSS-native scroll markers path (see below).
- Add `.rail` to the `.nav-list` for a table of contents: the current band
  slides along the rail as the page scrolls, while keyboard focus stays free.

```html demo
<nav class="scrollspy" data-enhance="scrollspy" aria-label="Page sections">
  <ol class="nav-list">
    <li><a class="nav-link" href="#overview" aria-current="location">Overview</a></li>
    <li><a class="nav-link" href="#tokens">Tokens</a></li>
    <li><a class="nav-link" href="#components">Components</a></li>
  </ol>
</nav>

<main>
  <section id="overview" tabindex="-1">
    <h2>Overview</h2>
  </section>

  <section id="tokens" tabindex="-1">
    <h2>Tokens</h2>
  </section>

  <section id="components" tabindex="-1">
    <h2>Components</h2>
  </section>
</main>
```

## Table of contents on a rail

A scroll container keeps the demo self-contained: the band follows the
section at the top of the panel.

```html demo
<div class="sidebar-layout">
  <div class="overflow-auto scroller" id="rail-demo-panel" style="max-block-size: 14rem">
    <section id="rail-install" tabindex="-1" style="min-block-size: 10rem">
      <h3>Install</h3>
      <p>Add the stylesheet, then the enhancer.</p>
    </section>
    <section id="rail-theme" tabindex="-1" style="min-block-size: 10rem">
      <h3>Theme</h3>
      <p>Replace the palette on <code>:root</code>.</p>
    </section>
    <section id="rail-ship" tabindex="-1" style="min-block-size: 10rem">
      <h3>Ship</h3>
      <p>Pin the version in your CDN link.</p>
    </section>
  </div>
  <nav class="scrollspy" data-enhance="scrollspy" data-scrollspy-root="#rail-demo-panel" aria-label="Steps">
    <ol class="nav-list rail">
      <li><a class="nav-link" href="#rail-install" aria-current="location">Install</a></li>
      <li><a class="nav-link" href="#rail-theme">Theme</a></li>
      <li><a class="nav-link" href="#rail-ship">Ship</a></li>
    </ol>
  </nav>
</div>
```

## Native scroll markers

Modern browsers are starting to support CSS-native scroll markers with
`scroll-target-group` and `:target-current`. This can style the active link
without JavaScript.

```css
@supports selector(:target-current) {
  .scrollspy:not(:has([aria-current="location"])) {
    scroll-target-group: auto;
  }

  .scrollspy:not(:has([aria-current="location"])) a:target-current {
    color: var(--primary);
    font-weight: var(--font-weight-medium);
  }
}
```

The native group yields while JavaScript marks a current location, so only one
link is active. The same markup serves both paths.
