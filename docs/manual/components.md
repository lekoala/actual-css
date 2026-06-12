# Components

Components are opt-in and use semantic HTML with a small, predictable class API.

- Use one component class for the thing being styled: `.btn`, `.card`, `.alert`, `.table`.
- Use shared intent modifiers when color carries meaning: `.primary`, `.secondary`, `.success`, `.warning`, `.danger`, `.neutral`.
- Use shared visual variants when emphasis changes: `.solid`, `.soft`, `.outline`.
- Buttons add two button-only variants: `.ghost` and `.link`.
- Use shared size modifiers when the component supports sizing: `.sm`, `.lg`.
- Components can compose with each other and with layout utilities.
- Components own only their intrinsic layout. Page spacing belongs to layout utilities.
- ARIA roles and attributes are part of the API when they describe behavior or state.

## Accordion

- Use native `<details>` and `<summary>` for collapsible content.
- Use the `name` attribute for exclusive accordions.
- Supports any valid body element (`div`, `p`, `ul`, ...).
- Toggle marker is globally customizable with CSS variables (placement and icon).

```html
<div class="accordion">
  <details open>
    <summary>A paragraph body that is opened</summary>
    <p>This is a paragraph.</p>
  </details>

  <details>
    <summary>With a list</summary>
    <ul>
      <li>First item</li>
      <li>Second item</li>
    </ul>
  </details>

  <details>
    <summary>
      <i class="ti ti-settings" aria-hidden="true"></i>
      <span>With a custom icon</span>
    </summary>
    <div>
      <p>Any valid flow content can be used here.</p>
    </div>
  </details>
</div>
```

```html
<div class="accordion">
  <details name="settings">
    <summary>This is grouped with the next one</summary>
    <p>Using the <code>name</code> attribute groups items like radio buttons.</p>
  </details>

  <details name="settings">
    <summary>This is grouped with the previous one</summary>
    <p>Only one item in the same named group can be open.</p>
  </details>
</div>
```

```html
<div class="accordion accordion-demo">
  <details open>
    <summary>
      <span class="accordion-demo-icon" aria-hidden="true"></span>
      <span>Custom marker at the start</span>
    </summary>
    <p>This demo swaps the default end marker for a local plus/minus icon.</p>
  </details>

  <details>
    <summary>
      <span class="accordion-demo-icon" aria-hidden="true"></span>
      <span>Another item</span>
    </summary>
    <p>The icon belongs to the example, not the base accordion API.</p>
  </details>
</div>
```

Links:
- https://picocss.com/docs/accordion
- https://oat.ink/components/#accordion
- https://daisyui.com/components/accordion/
- https://getbootstrap.com/docs/5.3/components/accordion/
- https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/details
- https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/summary
- https://semantic-ui.com/modules/accordion.html
- https://modern-css.com/accordion-without-javascript/
- https://modern-css.com/exclusive-accordions-without-javascript/
- https://uiterms.com/accordion/

## Alert

- Supports intent colors.
- Supports longer text and lists.
- Links inherit alert color by default.
- Use `<menu class="actions cluster">` for alert action lists.
- Use `role="alert"` only when the alert is injected dynamically and should be announced.
- Not a toast.
- Could have simple or complex html content.
- Alerts may include a decorative leading icon. Place an `aria-hidden="true"` element as the first direct child.
- Font-size inherits from the surrounding context. Adjust via local CSS variables for specific use cases.

```html{.stack}
<div class="alert success">
  <strong>✓</strong> Your changes have been saved. <a href="#">View activity</a>.
</div>

<div class="alert warning" role="alert">
  <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M9.05.435c-.58-.58-1.52-.58-2.1 0L.436 6.95c-.58.58-.58 1.519 0 2.098l6.516 6.516c.58.58 1.519.58 2.098 0l6.516-6.516c.58-.58.58-1.519 0-2.098zM8 4c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995A.905.905 0 0 1 8 4m.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2"/></svg>
  <div>Please review the <a href="#">failed checks</a> before continuing.</div>
</div>

<div class="alert">
  <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M5.255 5.786a.237.237 0 0 0 .241.247h.825c.138 0 .248-.113.266-.25.09-.656.54-1.134 1.342-1.134.686 0 1.314.343 1.314 1.168 0 .635-.374.927-.965 1.371-.673.489-1.206 1.06-1.168 1.987l.003.217a.25.25 0 0 0 .25.246h.811a.25.25 0 0 0 .25-.25v-.105c0-.718.273-.927 1.01-1.486.609-.463 1.244-.977 1.244-2.056 0-1.511-1.276-2.241-2.673-2.241-1.267 0-2.655.59-2.75 2.286m1.557 5.763c0 .533.425.927 1.01.927.609 0 1.028-.394 1.028-.927 0-.552-.42-.94-1.029-.94-.584 0-1.009.388-1.009.94"/></svg>
  <div>This is a default alert message.</div>
</div>

<div class="alert danger" role="alert">
  <strong>Error!</strong>
  <div>Something went wrong.</div>
</div>

<div class="alert danger" role="alert">
  I'm a simple error
</div>

<div class="alert danger" role="alert">
  I'm a simple error <a href="#">with a link and no joke</a>
</div>
```

```html
<div class="alert danger soft" role="alert">
  <i class="ti ti-alert-triangle" aria-hidden="true"></i>

  <div class="stack">
    <strong>Payment failed.</strong>
    <p>Check your billing details or try another card.</p>

    <menu class="actions cluster">
      <li><a class="btn danger sm" href="/billing">Update billing</a></li>
      <li><a href="/support">Contact support</a></li>
    </menu>
  </div>
</div>
```

```html{.stack}
<div class="alert danger sm" role="alert">
  I'm a small error
</div>

<div class="alert danger lg" role="alert">
  I'm a large error
</div>

<div class="alert danger outline" role="alert">
  I'm an outline error <a href="#">with a link</a>
</div>
```

Links:
- https://oat.ink/components/#alert
- https://getbootstrap.com/docs/5.3/components/alerts/
- https://playground.halfaccessible.com/aria-reference/alert-role
- https://www.a11y-collective.com/blog/aria-alert/
- https://primer.style/accessibility/patterns/accessible-notifications-and-messages/
- https://uiterms.com/alert/

## Avatar

- Supports initials and images.
- Can be an inert element, link, or button.
- Can be grouped with `role="group"` and `:has()`
- Can be combined with `badge` and `indicator`.
- Does not support shape modifiers as public API. Shape is theme-level.
- Sizes can be adjusted with CSS variables and optional `.sm` or `.lg`.
- Background is an exposed css variable (and can use `data-tone`).

```html
<div class="avatar" role="img" aria-label="John Doe, online">
  <span aria-hidden="true">JD</span>
  <span class="badge indicator success" aria-label="Online"></span>
</div>

<div class="avatar lg" role="img" aria-label="John Doe, online">
  <span aria-hidden="true">JD</span>
  <span class="badge indicator success" aria-label="Online"></span>
</div>

<div class="avatar sm" role="img" aria-label="John Doe, online">
  <span aria-hidden="true">JD</span>
  <span class="badge indicator indicator-bottom danger" aria-label="Online"></span>
</div>
```

```html
<a href="#" class="avatar">
  <img src="https://mockmind-api.uifaces.co/content/human/219.jpg" alt="Jane Doe" />
</a>

<button type="button"
        class="avatar"
        aria-haspopup="menu"
        aria-expanded="false"
        aria-label="Jane Doe, open profile menu">
  <img src="https://mockmind-api.uifaces.co/content/human/219.jpg" alt="" />
</button>
```

```html
<div role="group" aria-label="Team members">
  <div class="avatar" role="img" aria-label="John Doe" style="--avatar-bg:#E5EEE4">
    <span aria-hidden="true">JD</span>
  </div>
  <div class="avatar" role="img" aria-label="Jane Doe" style="--avatar-bg:#F6F4E8">
    <span aria-hidden="true">JD</span>
  </div>
  <div class="avatar" role="img" aria-label="99 more team members" style="--avatar-bg:#744577;" data-tone="dark">
    <span aria-hidden="true">+99</span>
  </div>
</div>
```

Links:
- https://oat.ink/components/#avatar
- https://daisyui.com/components/avatar/
- https://smolcss.dev/#smol-avatar-list

## Badge

- Supports intent colors.
- Supports shared variants, especially `.soft` and `.outline`.
- Can be used inline in headings.
- Can be used as a count badge.
- Can be used as a dot badge when it has an accessible name.

```html
<span class="badge">Default</span>
<span class="badge secondary">Secondary</span>
<span class="badge success">Success</span>
<span class="badge warning">Warning</span>
<span class="badge danger">Danger</span>
<span class="badge success outline">Outline success</span>
<span class="badge warning soft">Soft warning</span>
```

```html
<h2>New features <span class="badge success soft">New</span></h2>
```

```html
<button type="button" class="btn ghost" aria-label="Notifications">
  <i class="ti ti-bell" aria-hidden="true"></i>
  <span class="badge danger" aria-label="12 unread notifications">12</span>
</button>

<button type="button" class="btn secondary soft" aria-label="Notifications">
  <i class="ti ti-bell" aria-hidden="true"></i>
  <span class="badge indicator danger" aria-label="Errors!"></span>
</button>
```

Links:
- https://oat.ink/components/#badge
- https://daisyui.com/components/badge/
- https://semantic-ui.com/elements/label.html
- https://getbootstrap.com/docs/5.3/components/badge/
- https://uiterms.com/badge/
- https://m3.material.io/components/badges/overview
- https://daisyui.com/components/indicator/

## Breadcrumb

- Use a semantic `<nav>` landmark.
- Put `.breadcrumb` on the ordered list.
- Use `aria-current="page"` for the current page.
- Separators are generated with CSS (`li + li::before`).

```html
<nav aria-label="Breadcrumb">
  <ol class="breadcrumb">
    <li><a href="/home">Home</a></li>
    <li><a href="/projects">Projects</a></li>
    <li><a href="/projects/docs">Docs</a></li>
    <li><a href="/current" aria-current="page">Breadcrumb</a></li>
  </ol>
</nav>
```

Links:
- https://oat.ink/components/#breadcrumb
- https://daisyui.com/components/breadcrumbs/
- https://getbootstrap.com/docs/5.3/components/breadcrumb/
- https://gomakethings.com/articles/creating-unstyled-lists/
- https://uiterms.com/breadcrumbs/

## Button

- Use a real `<button>` for actions.
- Use `<a class="btn">` for navigation.
- Always set `type="button"` when a button is not submitting a form.
- Supports shared intents, shared variants, button-only variants, and sizes.
- Adds button-only `.ghost` and `.link` variants.
- Button groups use `role="group"` and are progressively enhanced with `:has()`.

```html{.cluster}
<button type="button">Unstyled</button>
<button class="btn" type="button">Default</button>
<button class="btn secondary" type="button">Secondary</button>
<button class="btn danger" type="button">Danger</button>
<button class="btn outline" type="button">Outline</button>
<button class="btn danger outline" type="button">Danger outline</button>
<button class="btn soft" type="button">Soft</button>
<button class="btn danger soft" type="button">Danger soft</button>
<button class="btn ghost" type="button">Ghost</button>
<a class="btn primary" href="/account">Account</a>
<button class="btn link" type="button">Button as link</button>
<button class="btn primary" type="button" aria-busy="true" disabled>Loading</button>
<button class="btn" type="button" disabled>Disabled</button>
```

```html
<div role="group" aria-label="Text alignment">
  <button class="btn" type="button">Left</button>
  <button class="btn outline" type="button">Center</button>
  <button class="btn soft" type="button">Right</button>
</div>
```

```html
<button class="btn" type="button">Default</button>
<button class="btn sm" type="button">Small</button>
<button class="btn lg" type="button">Large</button>
<button class="btn" type="button"><i class="ti ti-star"></i> With an icon</button>
<button class="btn primary loading" aria-busy="true">Save</button>
```

Links:
- https://picocss.com/docs/button
- https://daisyui.com/components/button/
- https://semantic-ui.com/elements/button.html
- https://bulma.io/documentation/elements/button/
- https://oat.ink/components/#button
- https://getbootstrap.com/docs/5.3/components/buttons/
- https://moderncss.dev/icon-button-css-styling-guide/
- https://moderncss.dev/css-button-styling-guide/
- Button theming: https://codepen.io/lekoalabe/pen/RNaXBBP
- Buttons: https://codepen.io/lekoalabe/pen/oNORPZP

## Card

- Use semantic elements.
- Supports one or more content sections.
- Should display nicely in grids with equal-height behavior.
- Does not own page spacing.

```html
<article class="card">
  <header>
    <h3>Understanding Semantic HTML</h3>
  </header>

  <section aria-label="Summary">
    <p>Using the right HTML tags improves both SEO and accessibility.</p>
  </section>

  <section aria-label="Tags">
    <ul>
      <li>HTML</li>
      <li>Accessibility</li>
    </ul>
  </section>

  <footer class="cluster">
    <time datetime="2026-06-12">June 12, 2026</time>
    <button type="button" class="btn">Read more</button>
  </footer>
</article>
```

Links:
- https://oat.ink/components/#card
- https://daisyui.com/components/card/
- https://picocss.com/docs/card
- https://getbootstrap.com/docs/5.3/components/card/
- https://semantic-ui.com/views/card.html
- https://smolcss.dev/#smol-card-component
- https://uiterms.com/card/

## Dialog

- Use native `<dialog class="dialog">`.
- `commandfor`, `command`, and `closedby` are modern enhancements.
- Small JavaScript helpers can provide fallback opening, closing, and return-value handling.
- Dialogs must remain scrollbar aware.

```html
<button class="btn" type="button" commandfor="demo-dialog" command="show-modal">
  Open dialog
</button>

<dialog class="dialog" id="demo-dialog" closedby="any">
  <form method="dialog">
    <header>
      <h3>Title</h3>
      <p>This is a dialog description.</p>
    </header>

    <div>
      <p>Dialog content goes here. You can put any HTML inside.</p>
      <p>Click outside or press Escape to close.</p>
    </div>

    <footer>
      <button class="btn outline" type="button" commandfor="demo-dialog" command="close">Cancel</button>
      <button class="btn primary" value="confirm">Confirm</button>
    </footer>
  </form>
</dialog>
```

Links:
- https://oat.ink/components/#dialog
- https://picocss.com/docs/modal
- https://daisyui.com/components/modal/
- https://getbootstrap.com/docs/5.3/components/modal/
- https://modern-css.com/modal-dialogs-without-a-javascript-library/
- https://modern-css.com/full-width-without-horizontal-scrollbar-overflow/
- https://modern-css.com/modal-controls-without-onclick-handlers/
- https://modern-css.com/dialog-light-dismiss-without-click-outside-listeners/
- https://uiterms.com/alert-dialog/
- https://uiterms.com/dialog/
- Modern dialogs: https://codepen.io/lekoalabe/pen/GgKOKOE

## Drawer

- Use semantic `<aside class="drawer">`.
- Use `aria-controls` and `aria-expanded` on the trigger.
- Navigation drawers should expose a named navigation landmark.
- Opening and closing state is JavaScript behavior; CSS owns the shell.

```html
<button class="btn ghost"
        type="button"
        aria-controls="main-drawer"
        aria-expanded="false"
        aria-label="Open navigation">
  <i class="ti ti-menu-2" aria-hidden="true"></i>
</button>

<aside class="drawer" id="main-drawer" aria-label="Main navigation" hidden>
  <nav>
    <ul>
      <li><a href="#" aria-current="page">Home</a></li>
      <li><a href="#">Users</a></li>
      <li>
        <details>
          <summary>Settings</summary>
          <ul>
            <li><a href="#">General</a></li>
            <li><a href="#">Security</a></li>
            <li><a href="#">Billing</a></li>
          </ul>
        </details>
      </li>
    </ul>
  </nav>

  <footer>
    <button class="btn outline" type="button">Logout</button>
  </footer>
</aside>
```

Links:
- https://oat.ink/components/#sidebar
- https://daisyui.com/components/drawer/
- https://mac81.github.io/pure-drawer/
- Drawer: https://codepen.io/nwest88/pen/PwwZpv
- https://uiterms.com/drawer/

## Meter

- Use native `<meter class="meter">`.
- Shares progress styling DNA.
- Represents a scalar measurement within a known range, not task completion.

```html
<meter class="meter" value="0.8" min="0" max="1" low="0.3" high="0.7" optimum="1"></meter>
<meter class="meter" value="0.5" min="0" max="1" low="0.3" high="0.7" optimum="1"></meter>
<meter class="meter" value="0.2" min="0" max="1" low="0.3" high="0.7" optimum="1"></meter>
```

Links:
- https://oat.ink/components/#meter

## Pagination

- Use a semantic `<nav>` landmark.
- Put `.pagination` on the ordered list.
- Use `aria-current="page"` for the current page.
- Page links can compose with `.btn` for button-like hit targets.

```html
<nav aria-label="Pagination">
  <ol class="pagination">
    <li><a href="?page=2" class="btn outline sm">Previous</a></li>
    <li>
      <a href="?page=1" class="btn outline sm">
        <span class="sr-only">Page </span>1
      </a>
    </li>
    <li>
      <a href="?page=3" class="btn sm" aria-current="page">
        <span class="sr-only">Page </span>3<span class="sr-only">, current</span>
      </a>
    </li>
    <li><a href="?page=4" class="btn outline sm">Next</a></li>
  </ol>
</nav>
```

Links:
- https://oat.ink/components/#pagination
- https://uiterms.com/pagination/

## Progress

- Use native `<progress class="progress">`.
- Shares meter styling DNA.
- Supports indeterminate progress by omitting `value`.
- Can be connected to a busy region with `aria-describedby`.
- Never self-close `<progress>`.

```html
<progress class="progress" value="60" max="100"></progress>
<progress class="progress" value="30" max="100"></progress>
<progress class="progress" value="90" max="100"></progress>
<progress class="progress"></progress>

<section aria-busy="true" aria-describedby="upload-progress">
  <h2>Uploading files</h2>
  <progress class="progress" id="upload-progress" value="60" max="100">60%</progress>
</section>
```

Links:
- https://oat.ink/components/#progress
- https://daisyui.com/components/progress/
- https://picocss.com/docs/progress
- https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/progress
- https://getbootstrap.com/docs/5.3/components/progress/
- Indeterminate: https://codepen.io/lekoalabe/pen/NWEzXMO

## Spinner

- Use `.spinner` for an inline loading indicator.
- Use `aria-busy="true"` on the region or control that is busy.
- Decorative spinners should be `aria-hidden="true"`.
- Use `role="status"` with accessible text when the loading state needs to be announced.

```html
<div class="cluster">
  <span class="spinner" aria-hidden="true"></span>
  <span class="spinner primary" aria-hidden="true"></span>
  <span class="spinner danger lg" aria-hidden="true"></span>
</div>
```

```html
<button class="btn primary" type="button" aria-busy="true" disabled>
  <span class="spinner" aria-hidden="true"></span>
  Loading
</button>

<div role="status">
  <span class="spinner" aria-hidden="true"></span>
  <span class="sr-only">Loading results</span>
</div>
```

Links:
- https://oat.ink/components/#spinner
- https://picocss.com/docs/loading
- https://daisyui.com/components/loading/

## Skeleton

- Use `.skeleton` for loading placeholders.
- Use shape modifiers for common placeholder forms: `.text`, `.title`, `.avatar`, `.box`.
- Put `role="status"` and accessible text on the loading region, not on every placeholder.
- Use layout utilities for placeholder arrangement.

```html
<article class="card" role="status" aria-label="Loading profile">
  <div class="cluster">
    <div class="skeleton avatar" aria-hidden="true"></div>
    <div class="stack">
      <div class="skeleton title" aria-hidden="true"></div>
      <div class="skeleton text" aria-hidden="true"></div>
    </div>
  </div>
</article>
```

Links:
- https://oat.ink/components/#skeleton
- https://daisyui.com/components/skeleton/

## Table

- Use native `<table class="table">`.
- Supports `<caption>`.
- Compose with `.overflow-auto` for horizontal scrolling.
- Tables stay content-first and neutral by default.

```html
<div class="overflow-auto">
  <table class="table">
    <caption>Team members</caption>
    <thead>
      <tr>
        <th>Name</th>
        <th>Email</th>
        <th>Role</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Alice Johnson</td>
        <td>alice@example.com</td>
        <td>Admin</td>
        <td><span class="badge success soft">Active</span></td>
      </tr>
      <tr>
        <td>Bob Smith</td>
        <td>bob@example.com</td>
        <td>Editor</td>
        <td><span class="badge success soft">Active</span></td>
      </tr>
      <tr>
        <td>Carol White</td>
        <td>carol@example.com</td>
        <td>Viewer</td>
        <td><span class="badge secondary soft">Pending</span></td>
      </tr>
    </tbody>
  </table>
</div>
```

Links:
- https://picocss.com/docs/table
- https://picocss.com/docs/overflow-auto
- https://oat.ink/components/#table
- https://getbootstrap.com/docs/5.3/content/tables/
