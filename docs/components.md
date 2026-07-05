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

Components are presented alphabetically.

## Accordion

> Collapsible regions built on native details and summary, with optional exclusive groups via the name attribute.

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

## Alert

> Inline status messages for confirmations, warnings, and errors, with intents, icons, and action lists.

- Supports intent colors.
- Supports longer text and lists.
- Links inherit alert color by default.
- Alerts are soft by default. Use `.solid` or `.outline` when the message needs stronger or quieter emphasis.
- Use `<menu class="actions cluster">` for alert action lists.
- Use `role="alert"` only when the alert is injected dynamically and should be announced.
- Not a toast.
- Could have simple or complex html content.
- Alerts may include a decorative leading icon. Place an `aria-hidden="true"` element as the first direct child.
- Use `.sm` or `.lg` for density changes. The inline padding stays stable.

```html{.stack}
<div class="alert success">
  <i class="ti ti-circle-check" aria-hidden="true"></i>
  <div>Your changes have been saved. <a href="#">View activity</a>.</div>
</div>

<div class="alert warning" role="alert">
  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
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
<div class="alert danger" role="alert">
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

Variants

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

<div class="alert danger solid" role="alert">
  I'm a solid error <a href="#">with a link</a>
</div>
```

## Avatar

> Initials or image representing a person or entity, composable with a status dot.

- Supports initials and images.
- Can be an inert element, link, or button.
- Can be grouped with `role="group"` and `:has()`
- A status dot attaches as an empty `.badge` child; the badge carries an `aria-label` so the dot conveys its meaning to assistive tech.
- Does not support shape modifiers as public API. Shape is theme-level.
- Sizes can be adjusted with CSS variables and optional `.sm` or `.lg`.
- Background is an exposed css variable (and can use `data-tone`).

```html
<div class="avatar" role="img" aria-label="John Doe, online">
  <span aria-hidden="true">JD</span>
  <span class="badge success" aria-label="Online"></span>
</div>

<div class="avatar lg" role="img" aria-label="John Doe, online">
  <span aria-hidden="true">JD</span>
  <span class="badge success" aria-label="Online"></span>
</div>

<div class="avatar sm" role="img" aria-label="John Doe, errors">
  <span aria-hidden="true">JD</span>
  <span class="badge danger" aria-label="2 errors"></span>
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

## Badge

> Compact label for counts, status, or category tags, with shared intents and variants.

- Supports intent colors.
- Solid by default. Use `.soft` or `.outline` for quieter emphasis.
- Use `.sm` or `.lg` for compact density changes.
- Can be used inline in headings.
- Can be used as a count badge.
- Can be used as a stable dot badge when empty and given an accessible name.

```html
<span class="badge">Default</span>
<span class="badge secondary">Secondary</span>
<span class="badge success">Success</span>
<span class="badge warning">Warning</span>
<span class="badge danger">Danger</span>
<span class="badge success outline">Outline success</span>
<span class="badge warning soft">Soft warning</span>
```

In a title

```html
<h2>New features <span class="badge success soft">New</span></h2>
```

Composed

```html
<button type="button" class="btn ghost" aria-label="Notifications">
  <i class="ti ti-bell" aria-hidden="true"></i>
  <span class="badge danger" aria-label="12 unread notifications">12</span>
</button>

<button type="button" class="btn secondary soft" aria-label="Notifications">
  <i class="ti ti-bell" aria-hidden="true"></i>
  <span class="badge danger" aria-label="Errors!"></span>
</button>
```

Size variants

```html
<span class="badge success sm">Small Success</span>
<span class="badge success">Regular Success</span>
<span class="badge success lg">Large Success</span>
```

Removable tag pattern

Use `.badge soft` for tag visuals. Add a direct dismiss button only when the tag can actually be removed. There is no separate chip component.

```html
<span class="badge primary soft">
  Design
  <button type="button" aria-label="Remove Design">
    <i class="ti ti-x" aria-hidden="true"></i>
  </button>
</span>
<span class="badge primary soft">
  <button type="button" aria-label="Remove Design">
    <i class="ti ti-x" aria-hidden="true"></i>
  </button>
  Design
</span>
```

## Breadcrumb

> Trail of links showing the current page's location in a hierarchy.

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

## Button

> Actions and navigation with shared intents, variants, sizes, and a loading state.

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
<button class="btn primary" type="button" aria-busy="true" disabled>
  <span class="spinner" aria-hidden="true"></span>
  Loading
</button>
<button class="btn primary" type="button" aria-busy="true">In progress</button>
<button class="btn" type="button" disabled>Disabled</button>
```

Button group using `role="group"`

```html
<div role="group" aria-label="Text alignment">
  <button class="btn" type="button">Left</button>
  <button class="btn outline" type="button">Center</button>
  <button class="btn soft" type="button">Right</button>
</div>
```

Size variants

```html
<button class="btn sm" type="button">Small</button>
<button class="btn" type="button">Regular</button>
<button class="btn lg" type="button">Large</button>
```

With icons, loading state...

```html
<button class="btn" type="button"><i class="ti ti-star"></i> With an icon</button>
<button class="btn primary" type="button" aria-busy="true" disabled>
  <span class="spinner" aria-hidden="true"></span>
  Saving…
</button>
```

## Card

> Flexible content container with optional header, body, footer, and bleed regions.

- Use semantic elements.
- Supports one or more content sections.
- Should display nicely in grids with equal-height behavior.
- Does not own page spacing.
- A direct `<header>` or `<footer>` is the card's structural slot.
- Use `data-bleed` on a direct child to escape the card padding (full-width images, colored headers or footers).

```html
<div style="max-inline-size: 32rem">
  <article class="card stack">
    <header>
      <hgroup>
        <h3>Understanding Semantic HTML</h3>
        <p class="muted">A quick primer for new contributors</p>
      </hgroup>
    </header>

    <p>Using the right HTML tags improves both SEO and accessibility. Lean on landmarks and live lists.</p>

    <ul class="cluster" style="list-style: none; padding: 0; margin: 0; gap: 0.5rem" aria-label="Tags">
      <li><span class="badge primary soft secondary">HTML</span></li>
      <li><span class="badge soft primary">Accessibility</span></li>
      <li><span class="badge outline">5 min read</span></li>
    </ul>

    <footer>
      <time datetime="2026-06-12" class="muted">June 12, 2026</time>
      <button type="button" class="btn outline">Read more</button>
    </footer>
  </article>
</div>
```

```html
<div style="max-inline-size: 32rem">
  <article class="card stack">
    <img data-bleed src="https://picsum.photos/seed/actual-css-card/600/300" alt="Coastal cliffs at dusk" />
    <header>
      <h3>Coastal cliffs at dusk</h3>
    </header>
    <section aria-label="Summary">
      <p>A short caption that wraps across a few lines. The image bleeds to the card edges.</p>
    </section>
    <footer>
      <span class="badge primary soft">Photo</span>
      <button type="button" class="btn outline">View</button>
    </footer>
  </article>
</div>
```

```html
<article class="card stack" style="--card-max-inline-size: 24rem">
  <header data-bleed class="stack items-center text-center" style="background: var(--surface-subtle)">
    <hgroup>
      <h3>Team</h3>
      <p class="muted">For growing products</p>
    </hgroup>
    <p>
      <span style="font-size: 2rem; font-weight: var(--font-weight-strong); line-height: 1">$24</span>
      <span class="muted">/ user / month</span>
    </p>
  </header>

  <ul class="stack items-center" style="list-style: none; padding: 0">
    <li>Unlimited projects</li>
    <li>Up to 25 seats</li>
    <li>Shared workspaces</li>
    <li>Priority support</li>
  </ul>

  <footer data-bleed style="background: var(--surface-subtle); justify-content: center">
    <a class="btn primary" href="/billing">Upgrade</a>
  </footer>
</article>
```

```html
<section class="grid">
  <article class="card">
    <header>
      <h3>Components</h3>
    </header>
    <p>Buttons, alerts, dialogs — all opt-in.</p>
    <footer>
      <a class="btn outline" href="components.html">Browse</a>
    </footer>
  </article>

  <article class="card">
    <header>
      <h3>Layout</h3>
    </header>
    <p>Stack, cluster, grid, switcher, sidebar.</p>
    <footer>
      <a class="btn outline" href="layout.html">Browse</a>
    </footer>
  </article>

  <article class="card">
    <header>
      <h3>Patterns</h3>
    </header>
    <p>Actions, nav-list — small structural helpers.</p>
    <footer>
      <a class="btn outline" href="patterns.html">Browse</a>
    </footer>
  </article>
</section>
```

```html
<section class="grid gap-none">
  <article class="card">
    <header>
      <h3>Design tokens</h3>
    </header>
    <p>Semantic variables for color, shape, spacing, and motion.</p>
  </article>

  <article class="card">
    <header>
      <h3>Utilities</h3>
    </header>
    <p>Small layout helpers for local composition.</p>
  </article>

  <article class="card">
    <header>
      <h3>Runtime</h3>
    </header>
    <p>Optional JavaScript for progressive interactions.</p>
  </article>
</section>
```

```html
<section class="grid">
  <article class="card raised">
    <hgroup>
      <h3>Raised</h3>
      <p class="muted">Elevated surface with a soft shadow.</p>
    </hgroup>
  </article>

  <article class="card subtle">
    <hgroup>
      <h3>Subtle</h3>
      <p class="muted">Lower contrast against the page surface.</p>
    </hgroup>
  </article>

  <article class="card inverted stack">
    <hgroup>
      <h3>Inverted</h3>
      <p>Dark surface for emphasis. Text inherits the light surface color.</p>
    </hgroup>
    <button type="button" class="btn">Action</button>
  </article>

  <article class="card compact">
    <hgroup>
      <h3>Compact</h3>
      <p class="muted">Tighter padding for dense contexts.</p>
    </hgroup>
  </article>
</section>
```

## Drawer

> Modal side-sheet that overlays the page for navigation or filters.

- Use `dialog.drawer` for modal side-sheets that overlay the page.
- Use `command="show-modal"` and `commandfor="<id>"` to open the drawer without JavaScript.
- Use `form method="dialog"` for close buttons inside the drawer.
- Use `data-dialog-dismissible` and `closedby="any"` when backdrop click should close the drawer.
- Omit those attributes when the drawer requires an explicit action (e.g. a form with unsaved changes).
- Use `[data-side="end"]` for a right-side drawer.
- Permanent desktop sidebars belong in layout, not here.

```html
<button class="btn ghost"
        type="button"
        command="show-modal"
        commandfor="main-drawer"
        aria-label="Open navigation">
  <i class="ti ti-menu-2" aria-hidden="true"></i>
</button>

<dialog class="drawer"
        id="main-drawer"
        aria-label="Main navigation"
        closedby="any"
        data-dialog-dismissible>
  <header class="cluster" style="--cluster-justify: space-between">
    <strong>Menu</strong>

    <form method="dialog">
      <button class="btn ghost" type="submit" aria-label="Close navigation">
        <i class="ti ti-x" aria-hidden="true"></i>
      </button>
    </form>
  </header>

  <nav>
    <ul class="nav-list stack">
      <li><a href="#" aria-current="page">Home</a></li>
      <li><a href="#">Users</a></li>
      <li><a href="#">Settings</a></li>
      <li><a href="#">Logout</a></li>
    </ul>
  </nav>
</dialog>
```

### Non-dismissible drawer

For drawers with unsaved settings or critical actions, omit the dismiss attributes. Backdrop click shows a static indicator instead of closing. Escape key still works natively.

```html
<button class="btn"
        type="button"
        command="show-modal"
        commandfor="settings-drawer">
  Edit settings
</button>

<dialog class="drawer"
        id="settings-drawer"
        aria-label="Settings"
        data-side="end">
  <form method="dialog">
    <header class="cluster" style="--cluster-justify: space-between">
      <strong>Settings</strong>
      <button class="btn ghost"
              type="submit"
              aria-label="Close settings">
        <i class="ti ti-x" aria-hidden="true"></i>
      </button>
    </header>

    <div class="stack">
      <p>Unsaved changes will be lost if you close without saving.</p>
    </div>

    <footer class="cluster" style="--cluster-justify: end">
      <button class="btn" value="save">Save</button>
    </footer>
  </form>
</dialog>
```

Backdrop click dismissal and Escape are provided by the native dialog element when `closedby="any"` is set. Add `data-dialog-dismissible` when you want the optional runtime to wire the same behavior in browsers that need a small fallback. When both are omitted, clicking the backdrop briefly flashes the drawer instead of closing it — useful for drawers that should not be dismissed accidentally.

## Key

> Keyboard keys and shortcut tokens for app UI, command palettes, menus, and help text.

- Use `<kbd class="key">` outside prose.
- Plain `<kbd>` inside `.prose` gets the same visual treatment for authored content.
- `.shortcut` is a documented composition, not a component class. Compose multiple `.key` elements with text or layout utilities.
- Use short, familiar labels such as `Ctrl`, `Shift`, `Esc`, or `K`.

```html
<p>Press <kbd class="key">Esc</kbd> to close the panel.</p>

<div class="cluster" aria-label="Keyboard shortcut Control K">
  <kbd class="key">Ctrl</kbd>
  <kbd class="key">K</kbd>
</div>
```

In menus, keep the command label and shortcut in the same interactive item.

```html
<button type="button">
  <span>Search</span>
  <span class="cluster" aria-label="Keyboard shortcut Control K">
    <kbd class="key">Ctrl</kbd>
    <kbd class="key">K</kbd>
  </span>
</button>
```

## Meter

> Scalar measurement within a known range, not a progress indicator.

- Use native `<meter class="meter">`.
- Shares progress styling DNA.
- Represents a scalar measurement within a known range, not task completion.
- Use explicit bar height to avoid padding issues

```html{.stack}
<meter class="meter" value="0.8" min="0" max="1" low="0.3" high="0.7" optimum="1"></meter>
<meter class="meter" value="0.5" min="0" max="1" low="0.3" high="0.7" optimum="1"></meter>
<meter class="meter" value="0.2" min="0" max="1" low="0.3" high="0.7" optimum="1"></meter>
```

## Modal

> Centered modal overlay for focused tasks, confirmations, or forms, built on the native `<dialog>` element.

Modals use the platform-native `<dialog class="modal">` element with `commandfor` and `command` buttons.

Use `command="show-modal"` to open a modal dialog.

Use `command="request-close"` for cancel-style buttons so close requests go through the dialog’s cancel lifecycle.

Use `closedby="any"` as the no-JavaScript light-dismiss path. Add `data-dialog-dismissible` so the optional runtime can provide the same behavior in browsers that need a small fallback.

### Alert dialog

Use this shape when the dialog interrupts the flow and asks for a decision. It has no close icon and no light dismiss; the footer actions are the way out. With the optional runtime, backdrop clicks give a small static feedback instead of closing.

```html
<button class="btn"
        type="button"
        commandfor="delete-dialog"
        command="show-modal">
  Delete project
</button>

<dialog class="modal" id="delete-dialog">
  <form method="dialog">
    <header>
      <h3>Delete project?</h3>
      <p>This action cannot be undone.</p>
    </header>

    <div>
      <p>The project, saved reports, and connected automations will be removed permanently.</p>
    </div>

    <footer>
      <button class="btn outline"
              type="button"
              commandfor="delete-dialog"
              command="request-close">
        Cancel
      </button>

      <button class="btn danger"
              value="delete">
        Delete
      </button>
    </footer>
  </form>
</dialog>
```

### Information modal

Use this shape for contextual information or lightweight secondary content. It has no action button; the header close button dismisses the dialog.

```html
<button class="btn"
        type="button"
        commandfor="details-dialog"
        command="show-modal">
  View details
</button>

<dialog class="modal"
        id="details-dialog"
        closedby="any"
        data-dialog-dismissible>
  <div class="stack">
    <header class="cluster" style="--cluster-justify: space-between">
      <hgroup>
        <h3>Release details</h3>
        <p>Changes included in this version.</p>
      </hgroup>

      <button class="btn ghost"
              type="button"
              commandfor="details-dialog"
              command="request-close"
              aria-label="Close dialog">
        <i class="ti ti-x" aria-hidden="true"></i>
      </button>
    </header>

    <div>
      <p>The release improves dialog behavior, scroll handling, and progressive enhancement for modern browsers.</p>
      <p>There are no decisions to make here; the content can simply be dismissed when finished.</p>
    </div>
  </div>
</dialog>
```

### Scrollable modal

Use `modal scrollable` when the header and footer should stay visible while the dialog body scrolls. Modal dialogs also lock page scroll in browsers that support `:has()` and `:modal`; older browsers keep native dialog behavior.

```html
<button class="btn"
        type="button"
        commandfor="scroll-dialog"
        command="show-modal">
  Open scrollable modal
</button>

<dialog class="modal scrollable"
        id="scroll-dialog"
        closedby="any"
        data-dialog-dismissible>
  <form method="dialog">
    <header>
      <h3>Terms review</h3>
      <p>Review the full text before continuing.</p>
    </header>

    <div class="stack">
      <p>Actual CSS keeps long dialog content inside the dialog surface instead of letting it run past the viewport.</p>
      <p>Section 1. The service stores project settings, interface preferences, and theme choices so teams can keep a consistent working environment.</p>
      <p>Section 2. Administrators can invite users, remove inactive accounts, and review access periodically.</p>
      <p>Section 3. Billing changes may affect future invoices. Existing invoices remain available from the account area.</p>
      <p>Section 4. Export tools are provided for common formats. Large exports may take a few minutes to prepare.</p>
      <p>Section 5. Support requests should include relevant browser, operating system, and account context.</p>
      <p>Section 6. Experimental features can change or disappear before a stable release.</p>
      <p>Section 7. Continued use confirms acceptance of the current terms.</p>
    </div>

    <footer>
      <button class="btn outline"
              type="button"
              commandfor="scroll-dialog"
              command="request-close">
        Cancel
      </button>

      <button class="btn primary" value="accept">
        Accept
      </button>
    </footer>
  </form>
</dialog>
```

### Overlays inside modals

Flyouts and tooltips opened from inside a modal dialog are mounted inside the dialog so they stay in the same top-layer context.

```html
<button class="btn"
        type="button"
        commandfor="overlay-dialog"
        command="show-modal">
  Open modal overlays
</button>

<dialog class="modal"
        id="overlay-dialog"
        closedby="any"
        data-dialog-dismissible>
  <div class="stack">
    <header class="cluster" style="--cluster-justify: space-between">
      <hgroup>
        <h3>Modal overlays</h3>
        <p>Flyouts and tooltips remain above the dialog surface.</p>
      </hgroup>

      <button class="btn ghost"
              type="button"
              commandfor="overlay-dialog"
              command="request-close"
              aria-label="Close dialog">
        <i class="ti ti-x" aria-hidden="true"></i>
      </button>
    </header>

    <div class="cluster">
      <button class="btn"
              type="button"
              aria-expanded="false"
              aria-controls="dialog-actions-menu">
        Actions
      </button>

      <button class="btn outline"
              type="button"
              data-tooltip="Tooltip inside a dialog">
        Tooltip
      </button>
    </div>

    <menu class="flyout"
          id="dialog-actions-menu"
          hidden>
      <li><button type="button">Archive</button></li>
      <li><button type="button">Duplicate</button></li>
      <li><button type="button">Share</button></li>
    </menu>
  </div>
</dialog>
```

### JavaScript options

Add options directly on the dialog element. Without JavaScript, modern browsers still use the native dialog behavior; the runtime only adds fallback opening, focus restoration, light dismiss, and optional view transitions.

Available options:

* `data-dialog-dismissible` enables backdrop click dismissal.
* `data-dialog-modal="false"` opens with `show()` instead of `showModal()`.
* `data-dialog-view-transition` enables a view transition that morphs the dialog to/from its trigger. Only active when the browser supports `document.startViewTransition` and the user allows motion.
* `closedby="any"` is the no-JavaScript light-dismiss path. The runtime rewrites it to `closedby="closerequest"` where supported so dialog light-dismiss keeps the modal workflow intact — the same behavior, just stated in terms the platform understands.

### Legacy browsers and polyfills

Actual CSS does not bundle a dialog polyfill. In browsers without `HTMLDialogElement.showModal()` support, such as Firefox 97, the runtime still wires `commandfor` triggers and shows a native alert when a user tries to open the dialog. This is a deliberate failure mode: the action is acknowledged, but the framework does not pretend to provide modal focus trapping without platform or polyfill support.

To support those browsers, load a dialog polyfill and register each dialog before it is opened. The polyfill may load before or after the Actual CSS runtime; the runtime checks the target dialog when the trigger is used.

```js
import "actual-css/js";
import dialogPolyfill from "dialog-polyfill";

document.querySelectorAll("dialog").forEach((dialog) => {
  dialogPolyfill.registerDialog(dialog);
});
```

For conditional loading, register the polyfill before the first unsupported dialog open:

```js
import "actual-css/js";

if (!("HTMLDialogElement" in window) || !HTMLDialogElement.prototype.showModal) {
  const { default: dialogPolyfill } = await import("dialog-polyfill");

  document.querySelectorAll("dialog").forEach((dialog) => {
    dialogPolyfill.registerDialog(dialog);
  });
}
```

If dialogs are injected later, register those new dialog elements before their open trigger is used.

### Animation

The base CSS gives supporting browsers a small opening transition. Closing remains native unless `data-dialog-view-transition` is enabled and the browser supports the View Transition API.

The open dialog root intentionally ends at `transform: none`; fixed flyouts and tooltips mounted inside a modal dialog rely on viewport coordinates.

```css
dialog.modal {
  opacity: 0;
  overflow: visible;

  transition:
    opacity var(--duration),
    transform var(--duration);
}

dialog.modal > form,
dialog.modal > .stack {
  max-block-size: calc(100vh - 2rem);
  max-block-size: calc(100dvb - 2rem);
  overflow: auto;
  overscroll-behavior: contain;
}

dialog.modal[open] {
  opacity: 1;
  transform: none;
}

@starting-style {
  dialog.modal[open] {
    opacity: 0;
    transform: translateY(0.35rem) scale(0.98);
  }
}

dialog.modal::backdrop {
  background: var(--backdrop-fill);
  opacity: 0;
  transition: opacity var(--duration);
}

@supports (transition-behavior: allow-discrete) {
  dialog.modal {
    transition:
      opacity var(--duration),
      transform var(--duration),
      overlay var(--duration) allow-discrete,
      display var(--duration) allow-discrete;
  }

  dialog.modal::backdrop {
    transition:
      opacity var(--duration),
      overlay var(--duration) allow-discrete,
      display var(--duration) allow-discrete;
  }
}

dialog.modal[open]::backdrop {
  opacity: 1;
}

@supports selector(:has(dialog:modal)) {
  html:has(dialog:modal) {
    overflow: hidden;
    scrollbar-gutter: stable;
  }
}

@starting-style {
  dialog.modal[open]::backdrop {
    opacity: 0;
  }
}
```

### View transitions

Add `data-dialog-view-transition` to morph the dialog to/from its trigger using the View Transition API. The dialog appears to grow out of the trigger on open and shrink back into it on close, communicating the relationship between the two.

The effect is progressive: it only runs when the browser supports `document.startViewTransition` and the user has not requested reduced motion. Otherwise the dialog simply opens and closes with the baseline dialog transition.

```html
<button class="btn"
        type="button"
        commandfor="vt-dialog"
        command="show-modal">
  Open modal
</button>

<dialog class="modal"
        id="vt-dialog"
        data-dialog-view-transition
        data-dialog-dismissible>
  <form method="dialog">
    <header>
      <h3>Title</h3>
      <p>This dialog morphs to and from the trigger button.</p>
    </header>

    <footer>
      <button class="btn outline"
              type="button"
              commandfor="vt-dialog"
              command="request-close">
        Cancel
      </button>
      <button class="btn primary" value="confirm">Confirm</button>
    </footer>
  </form>
</dialog>
```

### Notes

Prefer native dialog behavior whenever possible. The framework runtime should not replace the platform modal system; it should only make dialogs declarative, animation-friendly, and consistent across supported browsers.

## Pagination

> Navigation controls to move between pages of content.

- Use a semantic `<nav>` landmark.
- Put `.pagination` on the ordered list.
- Use `aria-current="page"` for the current page.
- Put `.sm` or `.lg` on `.pagination` to change the density of its controls.
- Numeric links may use `aria-label="Page N"` for clearer screen reader output.
- Prefer text labels for Previous and Next. Icon-only controls need an accessible name.
- Page links can compose with `.btn` for button-like hit targets.

```html
<nav aria-label="Pagination">
  <ol class="pagination sm">
    <li><a href="?page=2" class="btn outline" rel="prev">Previous</a></li>
    <li><a href="?page=1" class="btn outline" aria-label="Page 1">1</a></li>
    <li><a href="?page=2" class="btn outline" aria-label="Page 2">2</a></li>
    <li><a href="?page=3" class="btn" aria-current="page" aria-label="Page 3">3</a></li>
    <li><a href="?page=4" class="btn outline" aria-label="Page 4">4</a></li>
    <li><a href="?page=5" class="btn outline" rel="next">Next</a></li>
  </ol>
</nav>
```

```html
<nav aria-label="Pagination">
  <ol class="pagination sm">
    <li><a href="?page=1" class="btn outline" rel="prev">Previous</a></li>
    <li><a href="?page=1" class="btn outline" aria-label="Page 1">1</a></li>
    <li><span class="btn ghost" aria-hidden="true">…</span></li>
    <li><a href="?page=7" class="btn outline" aria-label="Page 7">7</a></li>
    <li><a href="?page=8" class="btn" aria-current="page" aria-label="Page 8">8</a></li>
    <li><a href="?page=9" class="btn outline" aria-label="Page 9">9</a></li>
    <li><span class="btn ghost" aria-hidden="true">…</span></li>
    <li><a href="?page=20" class="btn outline" aria-label="Page 20">20</a></li>
    <li><a href="?page=9" class="btn outline" rel="next">Next</a></li>
  </ol>
</nav>
```

## Progress

> Indeterminate or determinate indicator of task completion.

- Use native `<progress class="progress">`.
- Shares meter styling DNA.
- Supports indeterminate progress by omitting `value`.
- Can be connected to a busy region with `aria-describedby`.
- Never self-close `<progress>`.

```html{.stack}
<progress class="progress" value="60" max="100"></progress>
<progress class="progress" value="30" max="100"></progress>
<progress class="progress" value="90" max="100"></progress>
<progress class="progress"></progress>

<section aria-busy="true" aria-describedby="upload-progress">
  <h2>Uploading files</h2>
  <progress class="progress" id="upload-progress" value="60" max="100">60%</progress>
</section>
```

## Spinner

> Loading indicator for actions or regions that may take noticeable time.

- Most actions do not need a spinner. Use `disabled` alone for fast actions or to prevent duplicate submissions.
- Use `aria-busy="true"` with a loading label for actions that are visibly in progress.
- Add `.spinner` only when the operation may take long enough that users need explicit loading feedback.
- The spinner uses `currentColor`, so it adapts to its context.
- Decorative spinners should be `aria-hidden="true"`.
- Use `role="status"` with accessible text when the loading state needs to be announced.
- Put a direct last-child `.spinner` inside a busy region to show a centered loading overlay. In buttons, spinners remain inline.

```html
<span class="spinner"></span>
<span class="spinner sm primary"></span>
<span class="spinner lg danger"></span>
```

```html
<button class="btn primary" type="submit" aria-busy="true" disabled>
  <span class="spinner" aria-hidden="true"></span>
  Saving…
</button>
```

```html
<article class="card" aria-busy="true" aria-label="Loading card content">
  <hgroup>
    <h3>Card Title</h3>
    <p class="muted">Card description goes here.</p>
  </hgroup>

  <p>This is the card content. It can contain any HTML.</p>

  <footer class="cluster">
    <button class="btn outline" disabled>Cancel</button>
    <button class="btn" disabled>Save</button>
  </footer>

  <span class="spinner lg" aria-hidden="true"></span>
</article>
```

```html
<div role="status">
  <span class="spinner" aria-hidden="true"></span>
  <span class="sr-only">Loading results</span>
</div>
```

## Skeleton

> Placeholder shapes for content that is loading.

- Use `.skeleton` for loading placeholders.
- Use `data-shape` for common placeholder forms: `text`, `title`, `avatar`, `box`.
- Put `role="status"` and accessible text on the loading region, not on every placeholder.
- Use layout utilities for placeholder arrangement.
- Only relevant for simple placeholders - use more structural solutions like phantom-ui for complex cases.

```html
<article class="card" role="status" aria-label="Loading profile">
  <div class="cluster">
    <div class="skeleton" data-shape="avatar" aria-hidden="true"></div>
    <div class="stack grow">
      <div class="skeleton" data-shape="title" aria-hidden="true"></div>
      <div class="skeleton" data-shape="text" aria-hidden="true"></div>
    </div>
  </div>
</article>
```

## Table

> Data table with caption and scope attributes, and an accessible scroll region for wide content.

- Use native `<table class="table">` inside a `.table-wrap` for surface, border, radius, and overflow.
- Use `<caption>`, `scope="col"`, and `scope="row"` for accessibility.
- Use `.text-end` for numeric columns and `.nowrap` for non-wrapping cells.
- For wide tables, make the wrapper an accessible scroll region with `role="region"`, `aria-labelledby`, and `tabindex="0"`.
- Tables stay content-first and neutral by default.

```html
<div class="table-wrap">
  <table class="table">
    <caption>Team members</caption>
    <thead>
      <tr>
        <th scope="col">Name</th>
        <th scope="col">Email</th>
        <th scope="col">Role</th>
        <th scope="col">Status</th>
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

```html
<div class="table-wrap" role="region" aria-labelledby="revenue-table" tabindex="0">
  <table class="table" style="--table-min: 64rem">
    <caption id="revenue-table">Revenue by month</caption>
    <thead>
      <tr>
        <th scope="col">Month</th>
        <th scope="col">Plan</th>
        <th scope="col" class="text-end">Revenue</th>
        <th scope="col" class="text-end">Churn</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>March 2026</td>
        <td>Team</td>
        <td class="text-end nowrap">$42,128</td>
        <td class="text-end nowrap">1.2%</td>
      </tr>
      <tr>
        <td>April 2026</td>
        <td>Team + Business</td>
        <td class="text-end nowrap">$48,902</td>
        <td class="text-end nowrap">0.9%</td>
      </tr>
      <tr>
        <td>May 2026</td>
        <td>Team + Business</td>
        <td class="text-end nowrap">$53,470</td>
        <td class="text-end nowrap">0.7%</td>
      </tr>
    </tbody>
  </table>
</div>
```

