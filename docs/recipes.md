# Recipes

Composable patterns for common product UI. These use existing Actual CSS components and layout primitives.

## Split Button

Use `.join` for grouped buttons. Put a `.dropdown` inside the group for secondary actions.

```html
<div class="join">
  <button class="btn primary" type="button">Save</button>
  <details class="dropdown">
    <summary class="btn primary outline" aria-label="More save actions">More</summary>
    <menu class="dropdown-menu">
      <button class="btn neutral link" type="button">Save draft</button>
      <button class="btn neutral link" type="button">Save and publish</button>
      <button class="btn neutral link" type="button">Duplicate</button>
    </menu>
  </details>
</div>
```

## Form Card

Group related fields in `.card.stack`, then use a `.cluster` footer for actions.

```html
<article class="card stack">
  <header>
    <h3>Profile</h3>
    <p>Update account information.</p>
  </header>

  <label class="field">
    <span class="label">Name</span>
    <input class="input" type="text" value="Mila Stone">
  </label>

  <label class="field">
    <span class="label">Email</span>
    <input class="input" type="email" value="mila@example.com">
  </label>

  <label class="choice">
    <input class="switch" type="checkbox" checked>
    Email notifications
  </label>

  <footer class="cluster">
    <button class="btn neutral outline" type="button">Cancel</button>
    <button class="btn primary" type="button">Save</button>
  </footer>
</article>
```

## Empty State

Use a centered card with concise text and one primary action.

```html
<article class="card stack">
  <h3>Nothing here yet</h3>
  <p>Create your first project to start tracking work.</p>
  <div class="cluster">
    <button class="btn primary" type="button">New project</button>
  </div>
</article>
```

## Stats Cards

Use `.grid`, `.card`, `.metric`, `.badge`, and native `progress` or `meter` elements.

```html
<section class="grid" aria-label="Key metrics">
  <article class="card metric">
    <span class="metric-label">Revenue</span>
    <strong class="metric-value">$42,200</strong>
    <span class="badge success soft">+12%</span>
    <progress class="progress success" max="100" value="72">72%</progress>
  </article>

  <article class="card metric">
    <span class="metric-label">Completion</span>
    <strong class="metric-value">46%</strong>
    <span class="badge warning soft">-2%</span>
    <meter class="meter" min="0" max="1" low="0.3" high="0.7" optimum="1" value="0.46">46%</meter>
  </article>

  <article class="card metric">
    <span class="metric-label">Tickets</span>
    <strong class="metric-value">14</strong>
    <span class="badge neutral soft">Open</span>
    <progress class="progress primary" max="100" value="35">35%</progress>
  </article>
</section>
```
