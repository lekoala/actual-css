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
  <form>
    <label class="field">
      <span class="field-label">Email</span>
      <input type="email" placeholder="you@example.com" />
    </label>
  </form>
</section>
```

Use stack for forms, card content, modal bodies, side panels, and documentation blocks.

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

Use cluster for action rows, tags, toolbar sections, metadata, and compact navigation.

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

Tune width and side padding with local variables.

```css
.docs-page {
  --center-size: 48rem;
  --center-pad: var(--space-4);
}
```

`.center` intentionally uses `box-sizing: content-box`. The max inline size is
the content measure, while inline padding is added outside that measure. This is
deliberate even though the global reset uses `border-box`.

## List

> Lists stay native by default. Compose visual list rows from existing primitives.

Use `.list-reset` only when markers are not part of the content. Combine `.stack`, `.media`, `.cluster`, spacing helpers, and local styles for application-style rows.

```html
<figure class="stack">
  <figcaption><strong>Most played songs this week</strong></figcaption>

  <ul class="list-reset stack gap-none">
    <li class="media items-center py" style="border-block-end: var(--border-width) solid var(--border)">
      <div class="avatar">
        <img src="https://i.pravatar.cc/48?img=5" alt="Dio Lupa" />
      </div>
      <div class="cluster">
        <div class="stack grow" style="--gap: var(--space-1)">
          <strong>Dio Lupa</strong>
          <span class="muted">Remaining Reason</span>
        </div>
        <span class="muted">3:45</span>
      </div>
    </li>

    <li class="media items-center py" style="border-block-end: var(--border-width) solid var(--border)">
      <div class="avatar">
        <img src="https://i.pravatar.cc/48?img=10" alt="Astral Planes" />
      </div>
      <div class="cluster">
        <div class="stack grow" style="--gap: var(--space-1)">
          <strong>Astral Planes</strong>
          <span class="muted">Neon Drift</span>
        </div>
        <span class="muted">4:12</span>
      </div>
    </li>
  </ul>
</figure>
```

Keep semantic lists unstyled when the markers carry meaning.

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

Tune the minimum item width with `--grid-min`, or replace the responsive
template entirely with `--grid-columns` when the layout needs an asymmetric
ratio.

```css
.pricing-grid {
  --grid-min: 20rem;
}
```

```css
.feature-grid {
  --grid-columns: minmax(0, 2fr) minmax(0, 1fr);
}
```

`--grid-columns` applies to `.grid` only. The `.grid-2`, `.grid-3`,
`.grid-4`, and `.grid-6` presets retain their fixed-column contracts.

### Fixed Columns

Predictable 2/3/4/6-column grids. Full count by default; wrap in `.container-query` to make the column count collapse on narrow wrappers.

Use `.grid-2`, `.grid-3`, `.grid-4`, and `.grid-6` when the column count matters more than the item minimum width — for example, when a row should always read as "three items side by side", or when an empty cell should not stretch to fill space. Unlike `.grid`, the columns are fixed; if you have only two items in a `.grid-3`, the third cell stays empty rather than redistributing.

A `.grid-2/3/4/6` without a wrapper is a **fixed grid** (always at its full column count); with a `.container-query` wrapper, it's a **responsive grid** (the column count collapses on narrow wrappers). The wrapper is the query container; the grid itself is a plain block grid.

```html
<div class="container-query">
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

A `grid-4` demo

```html
<div class="container-query">
  <div class="grid-4">
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
    <article class="card">
      <h3>Enterprise</h3>
      <p>Contact us.</p>
    </article>
  </div>
</div>
```

A `grid-6` demo for compact items:

```html
<div class="container-query">
  <div class="grid-6">
    <article class="card compact">
      <span class="muted">Open</span>
      <strong>18</strong>
    </article>
    <article class="card compact">
      <span class="muted">Queued</span>
      <strong>7</strong>
    </article>
    <article class="card compact">
      <span class="muted">Blocked</span>
      <strong>2</strong>
    </article>
    <article class="card compact">
      <span class="muted">Shipped</span>
      <strong>41</strong>
    </article>
    <article class="card compact">
      <span class="muted">Owners</span>
      <strong>6</strong>
    </article>
    <article class="card compact">
      <span class="muted">SLA</span>
      <strong>99%</strong>
    </article>
  </div>
</div>
```

Behavior:
- Without `.container-query`: `.grid-2` is always 2 cols, `.grid-3` is always 3 cols, `.grid-4` is always 4 cols, and `.grid-6` is always 6 cols.
- With `.container-query`: `.grid-2`, `.grid-3`, and `.grid-4` collapse to one column on a narrow wrapper (under 28rem). `.grid-3` and `.grid-4` step through 2 columns between 28rem and 48rem. `.grid-6` starts at 2 columns under 28rem, steps through 3 columns between 28rem and 64rem, then returns to 6 columns.
- The intermediate 2-col step is useful for lists of items divisible by both 2 and 3 (or 4) — a 12-item list reads as 12 lines, then 6 lines of 2, then 4 lines of 3 (or 3 lines of 4), depending on the grid.
- `.grid-6` is for compact items such as stats, shortcut tiles, swatches, avatar summaries, and small settings cards. It does not collapse to one column by default. If item width matters more than an exact six-column rhythm, prefer `.grid` with a smaller `--grid-min`.
- The wrapper is the query container, so the same class behaves differently in a narrow sidebar than in a wide main area. No viewport breakpoints are involved.

Do not add `.row`, `.col-6`, `.offset-2`, or other fixed grid-system classes unless the project later proves it needs a formal grid system.

## Sidebar

> Two-column layout where one side has a preferred width and the other takes the remaining space.

Use `.sidebar-layout` for two-column layouts where the aside should align to the top of the content, stay sticky, or keep a predictable declared width.

Wrap it in `.container-query` to make the switch depend on the container width. Below 64rem the columns stack; at and above it the aside takes `--sidebar-layout-size` and the content takes the remaining space. Older browsers use the viewport fallback.

```html
<div class="container-query">
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
</div>
```

Tune the side width with `--sidebar-layout-size`.

## Media Object

> Fixed-width leading element (avatar, icon, image) paired with flexible trailing content.

`.media` is the media object: a grid with `auto minmax(0, 1fr)` columns. Use it for author cards, comments, meta rows, and any composition that pairs a small leading element with a flexible content block. The trailing column takes the remaining space and never overflows.

Give `.media` exactly two children. Trailing metadata or actions go inside the content column — nest a `.cluster` and put `.grow` on the flexible part — never as additional children, which silently wrap onto a second grid row.

Add `.items-center` to align the leading element with short trailing content. For multi-line content, the default `align-items: start` is more comfortable.

```html
<article class="card media items-center">
  <span class="avatar"><abbr>AM</abbr></span>
  <div class="stack">
    <strong>Ada Meridian</strong>
    <p class="muted">Senior designer working on design systems.</p>
  </div>
</article>
```

The media object is the underlying pattern of `.blog-author`, `.blog-comment`, and similar compositions in templates. Components can adopt it instead of repeating the grid rule.

## Switcher

> Row that becomes a column when space gets tight, useful for small sets of panels.
> **Optional** — import `actual-css/css/optional/layout-extra` or `actual-css/css/optional/index`.

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

This is useful for small sets of panels, not large card collections. Use `.grid` for repeatable collections.

The `.switcher` class is defined in `src/css/optional/layout-extra.css`. Import it when needed.

## Topbar

> Sticky, frosted top bar shell for app/dashboard layouts with a persistent sidebar.
> **Optional** — import `actual-css/css/optional/layout-extra` or `actual-css/css/optional/index`.

Use `.topbar` for the structural shell of an app-shell header: sticky positioning, stacking, and a frosted background. Row content — search, breadcrumb, actions — stays local to the page.

```html
<header class="topbar">
  <button class="btn neutral ghost" type="button" aria-label="Open navigation">
    <i class="ti ti-menu-2" aria-hidden="true"></i>
  </button>
  <ol class="breadcrumb" aria-label="Breadcrumb">
    <li><a href="#overview">Overview</a></li>
    <li aria-current="page">Accounts</li>
  </ol>
  <div class="grow"></div>
  <span class="avatar sm"><abbr>LW</abbr></span>
</header>
```

This is for the app-shell topbar specifically — a structural need that recurs unchanged across app UIs regardless of brand. It is not for marketing or editorial site headers, which are one-off visual identity per page (see [Patterns → Header Navigation](patterns.md#header-navigation)).

The `.topbar` class is defined in `src/css/optional/layout-extra.css`. Import it when needed.

## Scroll Snap

> Horizontal rails that stay useful without JavaScript and snap in modern browsers.
> **Optional** — import `actual-css/css/optional/scroll-snap` or `actual-css/css/optional/index`.

Use `.scroll-snap` for a niche row of items that should scroll horizontally, such as card rails, media strips, overflow tabs, or a simple touch-friendly carousel baseline. Scrolling only appears when the items are wider than the container; set `--scroll-snap-item-size` for card rails.

```html
<section class="stack" aria-labelledby="featured-title">
  <h2 id="featured-title">Featured articles</h2>

  <ul class="scroll-snap list-reset" style="--scroll-snap-item-size: min(85%, 18rem)">
    <li class="card">Article one</li>
    <li class="card">Article two</li>
    <li class="card">Article three</li>
    <li class="card">Article four</li>
    <li class="card">Article five</li>
  </ul>
</section>
```

The baseline is flex layout plus `overflow-x: auto`, so older browsers still get a usable horizontal scroll area. Browsers with scroll snap support add `scroll-snap-type` and item alignment.

Items snap to the inline start edge by default. Use `data-snap="center"` for visual rails where centered cards are the better fit.

```html
<div class="scroll-snap" data-snap="center" style="--scroll-snap-item-size: min(85%, 18rem)">
  <article class="card">One</article>
  <article class="card">Two</article>
  <article class="card">Three</article>
  <article class="card">Four</article>
  <article class="card">Five</article>
</div>
```

Keep scrollbars visible by default. If a product deliberately hides them, make that choice explicit with `data-scrollbar="hidden"`.

```html
<div class="scroll-snap" data-scrollbar="hidden">
  ...
</div>
```

`.scroll-snap` is not a full interactive carousel. For previous/next controls, pagination, active state, mouse drag, looping, autoplay, or robust accessibility behavior, use a dedicated carousel library such as Swiper and compose it with Actual components.

## Frame

> Media container that holds a stable aspect ratio for images, video, or embeds.

Use `.frame` for media that needs a stable aspect ratio.

```html
<figure class="frame">
  <img src="https://picsum.photos/seed/actual-css-frame/1600/900" alt="Preview placeholder" width="1600" height="900" />
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
