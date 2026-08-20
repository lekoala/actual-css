# Scrollspy

> Behavior hook for navigation that marks the active section while the page scrolls.

Scrollspy is a behavior hook, not a visual component. It marks a navigation
region for the JavaScript enhancement. Pair it with `.nav-list` and `.nav-link`,
or style `[aria-current]` yourself.

## Class reference

| Class        | Kind        | Description                                                     |
|--------------|-------------|-----------------------------------------------------------------|
| `.scrollspy` | Component   | Marks the nav region for the enhancer; adds no visual styles.   |
| `.nav-list`  | Composition | Vertical list of navigation links.                              |
| `.nav-link`  | Component   | Navigation link whose active state comes from `[aria-current]`. |

## Usage

- `.scrollspy` marks the region for JS detection. It does not add visual styles.
- `.nav-list` and `.nav-link` provide the visible list and active link styling.
- The JS enhancer toggles `aria-current="location"` on the active link. Without JavaScript, the links remain regular anchor links.
- Detection is geometric and deterministic: on each scroll, the active section is the last one whose top has crossed an activation line. Reaching the end of the scroll always activates the last section, and sitting above the first activates none.
- `data-scrollspy-root="#container"` measures a scroll container instead of the viewport.
- `data-scrollspy-offset` moves the activation line: a bare number or `px` value is pixels, a `%` value is a share of the root's visible height. Invalid values fall back to `20%`, and negatives clamp to `0`.
- The same markup also works with the CSS-native scroll markers path (see below).

```html demo
<nav class="scrollspy" data-enhance="scrollspy" aria-label="Page sections">
  <ol class="nav-list stack">
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

## Native scroll markers

Modern browsers are starting to support CSS-native scroll markers with
`scroll-target-group` and `:target-current`. This can style the active link
without JavaScript.

```css
@supports selector(:target-current) {
  .scrollspy {
    scroll-target-group: auto;
  }

  .scrollspy a:target-current {
    color: var(--primary);
    font-weight: var(--font-weight-medium);
  }
}
```

Keep this as progressive enhancement. The JavaScript enhancement remains the
portable fallback — the same markup serves both paths.
