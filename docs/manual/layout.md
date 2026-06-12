# Layout

Layout provides a small set of composable building blocks for common page, app, and content structure. It is not a utility-first framework and it is not a twelve-column grid system.

- Layout classes compose components; components do not own page spacing.
- Use custom properties to tune a layout instance.
- Prefer intrinsic and container-friendly behavior over breakpoint-heavy APIs.
- Keep class names semantic enough to remember and generic enough to reuse.
- Add a new layout primitive only when a pattern appears often and is awkward to express with existing primitives.

## Tokens

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

Use `.stack` for vertical flow with consistent spacing.

```html
<section class="stack">
  <h2>Account</h2>
  <p class="muted">Manage profile and billing settings.</p>
  <form class="form">
    <label>
      <span class="label-text">Email</span>
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

## Grid

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

Do not add `.row`, `.col-6`, `.offset-2`, or other fixed grid-system classes unless the project later proves it needs a formal grid system.

Links:
- https://picocss.com/docs/grid
- https://oat.ink/components/#grid
- https://modern-css.com/grid-layout-without-extra-wrappers/
- https://moderncss.dev/3-css-grid-techniques-to-make-you-a-grid-convert/
- https://smolcss.dev/#smol-css-grid

## Sidebar

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

Links:
- https://every-layout.dev/layouts/sidebar/

## Switcher

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

Use `.frame` for media that needs a stable aspect ratio.

```html
<figure class="frame">
  <img src="/preview.jpg" alt="Preview of the dashboard" />
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
