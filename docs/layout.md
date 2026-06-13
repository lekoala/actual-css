# Layout

Layout provides a small set of composable building blocks for common page, app, and content structure. It is not a utility-first framework and it is not a twelve-column grid system.

- Layout classes compose components; components do not own page spacing.
- Use custom properties to tune a layout instance.
- Prefer intrinsic and container-friendly behavior over breakpoint-heavy APIs.
- Keep class names semantic enough to remember and generic enough to reuse.
- Add a new layout primitive only when a pattern appears often and is awkward to express with existing primitives.

## Tokens

> Layout shares the global spacing surface and exposes a small set of gap and rhythm tokens.

Layout uses the shared spacing surface.

```css
:root {
  --gap: 0.75rem;
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-5: 1.5rem;
  --space-6: 2rem;
}
```

Most layout primitives should read `--gap` and allow local overrides.

```css
.settings-form {
  --gap: var(--space-5);
}
```

Prefer a local custom property over adding many one-off utility classes. Use inline styles only for demos, prototypes, or truly dynamic values.

## Stack

> Vertical flow with consistent spacing, ideal for forms, card content, and content blocks.

Use `.stack` for vertical flow with consistent spacing.

```html
<section class="stack">
  <h2>Account</h2>
  <p class="muted">Manage profile and billing settings.</p>
  <form class="form">
    <label class="field">
      <span class="field-label">Email</span>
      <input type="email" placeholder="you@example.com" />
    </label>
  </form>
</section>
```

```css
.stack {
  display: flex;
  flex-direction: column;
  gap: var(--gap);
}
```

Use stack for forms, card content, modal bodies, side panels, and documentation blocks.

Links:
- https://github.com/knadh/oat/blob/master/src/css/utilities.css
- https://every-layout.dev/layouts/stack/

## Cluster

> Inline groups that wrap naturally, useful for action rows, tags, and toolbars.

Use `.cluster` for inline groups that wrap naturally.

```html
<div class="cluster">
  <button class="btn primary" type="button">Save</button>
  <button class="btn outline" type="button">Cancel</button>
  <a href="/docs">Read docs</a>
</div>
```

```css
.cluster {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--gap);
}
```

Use cluster for action rows, tags, toolbar sections, metadata, and compact navigation.

Links:
- https://modern-css.com/spacing-elements-without-margin-hacks/
- https://every-layout.dev/layouts/cluster/

## Center

> Constrain readable content and center it in the viewport, with width and padding tunable per instance.

Use `.center` to constrain readable page content and center it in the viewport.

```html
<main class="center stack">
  <header class="prose">
    <h1>Documentation</h1>
    <p>Guides and API notes for Actual CSS.</p>
  </header>
  <section class="card">
    <h2>Getting started</h2>
    <p>Install the stylesheet and use semantic HTML.</p>
  </section>
</main>
```

```css
.center {
  box-sizing: content-box;
  max-inline-size: var(--center-size, 72rem);
  margin-inline: auto;
  padding-inline: var(--center-pad, 1rem);
}
```

Tune width and side padding with local variables.

```css
.docs-page {
  --center-size: 48rem;
  --center-pad: var(--space-4);
}
```

Links:
- https://picocss.com/docs/container
- https://smolcss.dev/#smol-container
- https://every-layout.dev/layouts/center/

## List

> Rich content lists where each item may contain multiple elements, captured as a single figure.

- Use figure to capture as a single unit
- `figcaption` is optional
- Can contain complex items

```html
<figure class="list">
    <figcaption>My favorite fruits</figcaption>    
       <ul>
          <li>Banana</li>
          <li>Orange</li>
          <li>Chocolate</li>
       </ul>
</figure>
```

```html
<figure class="list">
    <figcaption>Most played songs this week</figcaption>    
       <ul>
          <li>
            <div class="avatar"><span>DL</span></div>
            <div>
              <div>Dio Lupa</div>
              <div class="muted">Remaining Reason</div>
            </div>
            <p>
              "Remaining Reason" became an instant hit, praised for its haunting sound and emotional depth. A viral performance brought it widespread recognition, making it one of Dio Lupa’s most iconic tracks.
            </p>
            <button class="btn ghost" aria-label="Play">
              <i class="ti ti-player-play"></i>
            </button>
            <button class="btn ghost" aria-label="Like">
              <i class="ti ti-heart"></i>
            </button>
          </li>
          <li> 
            <div class="avatar"><span>EB</span></div>
            <div>
              <div>Ellie Beilish</div>
              <div class="muted">Bears of a fever</div>
            </div>
            <p>
              "Bears of a Fever" captivated audiences with its intense energy and mysterious lyrics. Its popularity skyrocketed after fans shared it widely online, earning Ellie critical acclaim.
            </p>
        </li>
       </ul>
</figure>
```

Links:
- https://daisyui.com/components/list/
- https://html.spec.whatwg.org/multipage/grouping-content.html#the-li-element

## Grid

> Responsive equal-width item grids with a tunable minimum item width.

Use `.grid` for responsive equal-width item grids.

```html
<section class="grid">
  <article class="card">
    <h3>Starter</h3>
    <p>For small projects.</p>
  </article>
  <article class="card">
    <h3>Team</h3>
    <p>For shared products.</p>
  </article>
  <article class="card">
    <h3>Scale</h3>
    <p>For larger systems.</p>
  </article>
</section>
```

```css
.grid {
  display: grid;
  gap: var(--gap);
  grid-template-columns: repeat(auto-fit, minmax(min(100%, var(--grid-min, 16rem)), 1fr));
}
```

Tune the minimum item width with `--grid-min`.

```css
.pricing-grid {
  --grid-min: 20rem;
}
```

### Fixed Columns

> Predictable 2/3/4-column grids. Full count by default; wrap in `.grid-responsive` to make the column count collapse on narrow wrappers.

Use `.grid-2`, `.grid-3`, and `.grid-4` when the column count matters more than the item minimum width — for example, when a row should always read as "three items side by side", or when an empty cell should not stretch to fill space. Unlike `.grid`, the columns are fixed; if you have only two items in a `.grid-3`, the third cell stays empty rather than redistributing.

A `.grid-2/3/4` without a wrapper is a **fixed grid** (always at its full column count); with a `.grid-responsive` wrapper, it's a **responsive grid** (the column count collapses on narrow wrappers). The wrapper is the query container; the grid itself is a plain block grid.

```html
<div class="grid-responsive">
  <div class="grid-3">
    <article class="card">
      <h3>Starter</h3>
      <p>For small projects.</p>
    </article>
    <article class="card">
      <h3>Team</h3>
      <p>For shared products.</p>
    </article>
    <article class="card">
      <h3>Scale</h3>
      <p>For larger systems.</p>
    </article>
  </div>
</div>
```

```css
.grid-responsive {
  container-type: inline-size;
}

.grid-2,
.grid-3,
.grid-4 {
  display: grid;
  gap: var(--gap);
}

.grid-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.grid-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.grid-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }

@container (width < 28rem) {
  .grid-responsive .grid-2,
  .grid-responsive .grid-3,
  .grid-responsive .grid-4 {
    grid-template-columns: 1fr;
  }
}

@container (28rem <= width < 48rem) {
  .grid-responsive .grid-3,
  .grid-responsive .grid-4 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
```

Behavior:
- Without `.grid-responsive`: `.grid-2` is always 2 cols, `.grid-3` is always 3 cols, `.grid-4` is always 4 cols.
- With `.grid-responsive`: all three collapse to one column on a narrow wrapper (under 28rem). As the wrapper widens, they step back to 2 cols (28rem-48rem) and then to their full count (48rem+).
- The intermediate 2-col step is useful for lists of items divisible by both 2 and 3 (or 4) — a 12-item list reads as 12 lines, then 6 lines of 2, then 4 lines of 3 (or 3 lines of 4), depending on the grid.
- The wrapper is the query container, so the same class behaves differently in a narrow sidebar than in a wide main area. No viewport breakpoints are involved.

Do not add `.row`, `.col-6`, `.offset-2`, or other fixed grid-system classes unless the project later proves it needs a formal grid system.

Links:
- https://picocss.com/docs/grid
- https://oat.ink/components/#grid
- https://modern-css.com/grid-layout-without-extra-wrappers/
- https://moderncss.dev/3-css-grid-techniques-to-make-you-a-grid-convert/
- https://smolcss.dev/#smol-css-grid

## Sidebar

> Two-column layout where one side has a preferred width and the other takes the remaining space.

Use `.sidebar` for two-column layouts where one side has a preferred width and the other takes the remaining space.

```html
<div class="sidebar">
  <aside>
    <nav aria-label="Settings">
      <a href="/profile" aria-current="page">Profile</a>
      <a href="/billing">Billing</a>
    </nav>
  </aside>

  <main class="stack">
    <h1>Dashboard</h1>
    <p class="muted">Overview of recent activity and account settings.</p>
  </main>
</div>
```

```css
.sidebar {
  display: flex;
  flex-wrap: wrap;
  gap: var(--gap);
}

.sidebar > :first-child {
  flex-basis: var(--sidebar-size, 16rem);
  flex-grow: 1;
}

.sidebar > :last-child {
  flex-basis: 0;
  flex-grow: 999;
  min-inline-size: min(100%, var(--sidebar-content-min, 50%));
}
```

Tune the side width and wrapping threshold with `--sidebar-size` and `--sidebar-content-min`.

### Sidebar Layout (Grid)

`.sidebar-layout` is a complementary two-column primitive that uses CSS grid instead of flex. Use it when the aside should align to the top of the content (e.g. a sticky table of contents) or when the content area contains multiple sections that should stretch together.

Below the 64rem breakpoint the columns stack; at and above it the aside takes `--sidebar-layout-size` and the content takes the remaining space.

```html
<div class="sidebar-layout" style="--sidebar-layout-size: 18rem">
  <article class="stack">
    <h1>Long-form article</h1>
    <p>Article body that benefits from a sticky table of contents.</p>
  </article>

  <aside class="stack">
    <h3>On this page</h3>
    <ol class="list-reset">
      <li><a class="link-muted" href="#section">Section</a></li>
    </ol>
  </aside>
</div>
```

`.sidebar` and `.sidebar-layout` are not interchangeable. `.sidebar` is flex-based and lets the side and content grow together; `.sidebar-layout` is grid-based and locks the aside to its declared width. Pick the one that matches the role.

Links:
- https://every-layout.dev/layouts/sidebar/

## Media Object

> Fixed-width leading element (avatar, icon, image) paired with flexible trailing content.

`.media` is the media object: a grid with `auto minmax(0, 1fr)` columns. Use it for author cards, comments, meta rows, and any composition that pairs a small leading element with a flexible content block. The trailing column takes the remaining space and never overflows.

Add `.media-middle` to align the leading element to the center of the trailing content's first line. This is what you want when the trailing content is a single short string; for multi-line content, the default `align-items: start` is more comfortable.

```html
<article class="card media">
  <span class="avatar"><abbr>AM</abbr></span>
  <div class="stack">
    <strong>Ada Meridian</strong>
    <p class="muted">Senior designer working on design systems.</p>
  </div>
</article>
```

The media object is the underlying pattern of `.blog-author`, `.blog-comment`, and similar compositions in templates. Components can adopt it instead of repeating the grid rule.

## Switcher

## Switcher

> Row that becomes a column when space gets tight, useful for small sets of panels.

Use `.switcher` for rows that should become columns when space gets tight.

```html
<section class="switcher">
  <article class="card">
    <h3>Profile</h3>
    <p>Personal details and preferences.</p>
  </article>
  <article class="card">
    <h3>Security</h3>
    <p>Password and login settings.</p>
  </article>
  <article class="card">
    <h3>Billing</h3>
    <p>Invoices and payment methods.</p>
  </article>
</section>
```

```css
.switcher {
  display: flex;
  flex-wrap: wrap;
  gap: var(--gap);
}

.switcher > * {
  flex-basis: calc((var(--switcher-threshold, 40rem) - 100%) * 999);
  flex-grow: 1;
}
```

This is useful for small sets of panels, not large card collections. Use `.grid` for repeatable collections.

Links:
- https://every-layout.dev/layouts/switcher/

## Frame

> Media container that holds a stable aspect ratio for images, video, or embeds.

Use `.frame` for media that needs a stable aspect ratio.

```html
<figure class="frame">
  <img src="/preview.jpg" alt="Preview placeholder" width="1600" height="900" />
</figure>
```

```css
.frame {
  aspect-ratio: var(--frame-ratio, 16 / 9);
  overflow: hidden;
}

.frame > :where(img, video, iframe) {
  inline-size: 100%;
  block-size: 100%;
  object-fit: cover;
}
```

Use local variables for common ratios.

```css
.avatar-preview {
  --frame-ratio: 1;
}
```

Links:
- https://every-layout.dev/layouts/frame/

## Header And Footer

> Document landmarks for top and bottom regions, composed with layout primitives.

Header and footer are document landmarks, not required layout classes.

Use semantic elements by default.

```html
<body class="app-shell">
  <header>Actual CSS</header>
  <main class="grow">Main content</main>
  <footer>Footer links</footer>
</body>
```

```css
.app-shell {
  min-block-size: 100vh;
  display: flex;
  flex-direction: column;
}
```

Sticky header/footer behavior should be opt-in and documented only if it becomes part of the shipped layout API.

Links:
- https://uiterms.com/sticky-header/
- https://developer.mozilla.org/en-US/docs/Web/CSS/How_to/Layout_cookbook/Sticky_footers
- https://crinkles.dev/writing/enhanced-sticky-footer/
- https://prismic.io/blog/css-sticky-footers
- https://modern-css.com/sticky-headers-without-javascript-scroll-listeners/
- https://picocss.com/docs/landmarks-section
