# UI

UI components need JavaScript or modern platform behavior to be complete. They follow the same principles as every component: semantic markup first, small class API, shared tokens, and progressive enhancement.

- CSS owns layout, surfaces, state styling, and transitions.
- JavaScript owns open/closed state, ARIA synchronization, focus management, keyboard behavior, and dismissal.
- Prefer native platform features when they fit, with small helpers where browser support or ergonomics need it.
- Keep behavior optional when possible. Markup should remain understandable without JavaScript.
- Use shared button classes and variants for triggers.
- Do not add toasts. Use alerts, status regions, dialogs, or inline validation instead.

## JavaScript Modules

The full runtime is `actual-css/js`. Each enhancer is also importable on its own for projects that use custom components or want a smaller behavior surface:

```js
import "actual-css/js/dialog";
import "actual-css/js/flyout";
import "actual-css/js/tooltip";
```

Enhancer modules self-register when imported. They do not require init calls and
are safe to import during server-side rendering: outside a browser, registration
is a no-op until the module is loaded again with a DOM.

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

Use `modal scrollable` when the header and footer should stay visible while the dialog body scrolls. Modal dialogs lock page scroll through `:has()` and `:modal` in modern CSS, and through the runtime-managed `html.has-modal-open` hook when the optional dialog helper opens the modal.

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

The base CSS gives supporting browsers small enter and exit transitions. Exit motion relies on `transition-behavior: allow-discrete` so the native dialog can remain in the top layer while `display` and `overlay` transition out. Browsers without that support keep native close behavior.

The open dialog root intentionally ends at `transform: none`; fixed flyouts and tooltips mounted inside a modal dialog rely on viewport coordinates.

#### View transition

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

## Flyout

> Positioned surface attached to a trigger, commonly used for action lists and small panels.

Flyout and context menu share one action-surface runtime:

- Flyout = a visible trigger opens a surface.
- Context menu = right click or a keyboard context action opens that same surface.
- Sheet = mobile presentation mode of that same surface.

Use `data-flyout-mobile` on the flyout to control mobile behavior:

- `auto` is the default. It keeps the surface anchored on desktop and switches to a bottom sheet on coarse pointers below the breakpoint.
- `sheet` always uses the sheet presentation.
- `anchored` always uses floating positioning.
- `none` disables the mobile transformation.

`data-flyout-breakpoint` only matters for `auto`. Prefer the built-in tokens (`sm`, `md`, `lg`) and use raw pixel values only as an escape hatch, for example `data-flyout-breakpoint="640"`.

Use `data-flyout-placement` for the preferred anchored placement. It accepts the placement strings supported by the floating runtime, such as `bottom-start`, `bottom-end`, `top-start`, `right`, or `left`.

Use `data-flyout-distance` for the trigger gap in pixels. The default is `4`.

Use `data-flyout-auto-close` when the default click dismissal behavior is not right. Escape still follows the shared surface lifecycle.

- `true` is the default. Action items close on activation and outside clicks close the flyout.
- `inside` closes on action item activation only.
- `outside` closes on outside click only.
- `false` disables automatic click closing.

Flyout covers two distinct patterns:

### Action list
- A list of *actions* the user can take: sign out, copy, delete.
- Wrap the trigger and flyout in `.flyout-trigger` when the flyout should have a local absolute-position fallback before JavaScript positions it. Add `.stretch` when the trigger must span its container, such as the last row of a full-width sidebar nav list.
- Use `<menu class="flyout">` with `<li>` items.
- Items are regular `<button>` or `<a>` elements.
- Use `.sm` or `.lg` for density changes.
- Direct action items get roving arrow-key focus.
- Add `role="menu"` / `role="menuitem"` only when you intentionally need the ARIA menu pattern.

### Nav panel
- A panel of *links* to other pages: product categories, docs sections.
- Items are regular `<a href>` links, not `role="menuitem"`.
- No arrow-key navigation, no `role="menu"`.
- Just a toggle with outside-click and Escape dismissal.
- Use grid utilities, such as `.grid-3`, for wider multi-column flyouts.

```html
<div class="flyout-trigger">
  <button class="btn outline"
          type="button"
          aria-expanded="false"
          aria-controls="account-actions"
          id="account-flyout-trigger">
    Account
    <i class="ti ti-chevron-down" aria-hidden="true"></i>
  </button>

  <menu class="flyout sm"
        id="account-actions"
        aria-labelledby="account-flyout-trigger"
        hidden>
    <li><button type="button">Profile</button></li>
    <li><button type="button">Settings</button></li>
    <li><hr /></li>
    <li><button class="danger" type="button">Sign out</button></li>
  </menu>
</div>
```

```html
<nav aria-label="Main navigation">
  <ul class="list-reset cluster">
    <li class="flyout-trigger">
      <button class="btn ghost"
              type="button"
              aria-expanded="false"
              aria-controls="products-panel">
        Products
        <i class="ti ti-chevron-down" aria-hidden="true"></i>
      </button>

      <div class="flyout"
           id="products-panel"
           aria-label="Products"
           data-flyout-mobile="auto"
           hidden>
        <section aria-labelledby="products-design">
          <h3 id="products-design">Design</h3>
          <ul>
            <li><a href="/figma">Figma integration</a></li>
            <li><a href="/tokens">Design tokens</a></li>
          </ul>
        </section>

        <section aria-labelledby="products-dev">
          <h3 id="products-dev">Development</h3>
          <ul>
            <li><a href="/components">Components</a></li>
            <li><a href="/api">API</a></li>
          </ul>
        </section>

        <footer>
          <a href="/pricing" class="btn primary">See pricing</a>
        </footer>
      </div>
    </li>

    <li><a href="/about" class="btn ghost">About</a></li>
    <li><a href="/contact" class="btn ghost">Contact</a></li>
  </ul>
</nav>
```

### Mega menu

Use `class="flyout grid-3"` when a nav panel needs multiple link groups. Keep links regular anchors and let the panel collapse to a one-column sheet on mobile with `data-flyout-mobile="auto"`.

```html
<nav aria-label="Product navigation">
  <ul class="list-reset cluster">
    <li class="flyout-trigger">
      <button class="btn ghost"
              type="button"
              aria-expanded="false"
              aria-controls="product-mega-menu">
        Platform
        <i class="ti ti-chevron-down" aria-hidden="true"></i>
      </button>

      <div class="flyout grid-3"
           id="product-mega-menu"
           aria-label="Platform"
           data-flyout-mobile="auto"
           style="--flyout-inline-size: 42rem; --flyout-max-inline-size: 42rem"
           hidden>
        <section aria-labelledby="mega-design">
          <h3 id="mega-design">Design</h3>
          <ul>
            <li><a href="/figma">Figma integration</a></li>
            <li><a href="/tokens">Design tokens</a></li>
            <li><a href="/handoff">Developer handoff</a></li>
          </ul>
        </section>

        <section aria-labelledby="mega-develop">
          <h3 id="mega-develop">Development</h3>
          <ul>
            <li><a href="/components">Components</a></li>
            <li><a href="/api">API</a></li>
            <li><a href="/changelog">Changelog</a></li>
          </ul>
        </section>

        <section aria-labelledby="mega-operate">
          <h3 id="mega-operate">Operate</h3>
          <ul>
            <li><a href="/analytics">Analytics</a></li>
            <li><a href="/security">Security</a></li>
            <li><a href="/support">Support</a></li>
          </ul>
        </section>

        <footer class="cluster"
                style="grid-column: 1 / -1; --cluster-justify: flex-end; border-block-start: var(--border-width) solid var(--border)">
          <a href="/pricing" class="btn primary">See pricing</a>
        </footer>
      </div>
    </li>
  </ul>
</nav>
```

### Context menu

Put `data-context-menu` on the smallest unit the actions operate on: a file row, card, or canvas item. Several units may reference the same `<menu class="flyout">`. A normal flyout trigger inside that unit opens the same menu through the same context-aware path.

Before opening, the context element dispatches the cancelable `actual:context-menu` event. Its `detail` contains the shared `menu`, the owning `context`, the exact `origin`, and the opening `trigger` (`pointer`, `touch`, `keyboard`, or `button`). Use it to tailor the static menu to the selected item, or cancel the event to keep it closed. `contextFor(menu)` from `actual-css/js/context-menu` returns that detail while handling a menu action.

Add `data-context-menu-scope` only when the flyout should stay inside a specific region. Empty or `self` constrains to the target itself, `parent` constrains to the parent, and a selector constrains to the closest matching ancestor or first matching element. The scope also constrains the available height, so omit it when the menu is allowed to escape the card or list item.

Long press is opt-in with `data-context-menu-long-press`. Empty uses the default delay; a number sets the delay in milliseconds.

```html
<div class="card stack"
     data-context-menu="file-actions"
     data-context-menu-long-press
     tabindex="0"
     style="min-block-size: 12rem;">
  <div class="cluster justify-content-space-between items-center">
    <strong>File.pdf</strong>
    <button class="btn ghost"
            type="button"
            aria-expanded="false"
            aria-controls="file-actions"
            id="file-actions-trigger">
      More
    </button>
  </div>
  <p class="text-sm text-muted">Right click inside the card, press the context-menu key, or long press on touch.</p>

  <menu class="flyout"
        id="file-actions"
        aria-labelledby="file-actions-trigger"
        hidden>
    <li><button type="button">Open</button></li>
    <li><button type="button">Rename</button></li>
    <li><hr /></li>
    <li><button class="danger" type="button">Delete</button></li>
  </menu>
</div>
```

## Tabs

> In-place panel switcher using real tab semantics, with roving tabindex and arrow-key navigation.

- Use real tab semantics when panels switch in place.
- Use normal links and `aria-current="page"` for page navigation that only looks like tabs.
- JavaScript owns roving `tabindex`, `aria-selected`, `hidden`, and keyboard behavior.
- Left/Right select tabs and wrap at the ends. Home/End jump to first/last. Down moves focus into the selected panel.
- A tab list needs both `.tabs` and `role="tablist"`; `.tab` styles each trigger.

```html
<div class="tabset">
  <div class="tabs" role="tablist" aria-label="Settings">
    <button class="tab primary"
            type="button"
            role="tab"
            aria-selected="true"
            aria-controls="panel-general"
            id="tab-general">
      General
    </button>
    <button class="tab"
            type="button"
            role="tab"
            aria-selected="false"
            aria-controls="panel-security"
            id="tab-security"
            tabindex="-1">
      Security
    </button>
    <button class="tab"
            type="button"
            role="tab"
            aria-selected="false"
            aria-controls="panel-billing"
            id="tab-billing"
            tabindex="-1">
      Billing
    </button>
  </div>

  <section role="tabpanel" id="panel-general" aria-labelledby="tab-general" tabindex="-1" class="py">
    General content
  </section>
  <section role="tabpanel" id="panel-security" aria-labelledby="tab-security" tabindex="-1" hidden class="py">
    Security content
  </section>
  <section role="tabpanel" id="panel-billing" aria-labelledby="tab-billing" tabindex="-1" hidden class="py">
    Billing content
  </section>
</div>
```

```html
<nav aria-label="Account sections">
  <ul class="tabs">
    <li><a class="tab primary" href="#account" aria-current="page">Profile</a></li>
    <li><a class="tab" href="#security">Security</a></li>
    <li><a class="tab" href="#billing">Billing</a></li>
  </ul>
</nav>
```

## Tooltip

> Supplemental label for a trigger, shown on hover and focus, hidden on dismissal.

- Use `data-tooltip` on the trigger. With text (`data-tooltip="Help"`), the tooltip element is generated. Empty (`data-tooltip`) marks an explicit tooltip connected via `aria-describedby`.
- Tooltips are supplemental. Do not put required information or interactive controls inside them.
- Show on hover and focus. Hide on Escape, blur, pointer leave, or scroll when appropriate.
- JavaScript can generate tooltip elements from `data-tooltip`.
- Use `data-tooltip-placement` to set the preferred placement (default `top`).
- The arrow inherits the tooltip background — custom gradients carry through automatically.
- Avoid relying on the native `title` attribute as the primary implementation.

```html
<button class="btn ghost"
        type="button"
        data-tooltip
        aria-describedby="tooltip-save"
        aria-label="Save">
  <i class="ti ti-device-floppy" aria-hidden="true"></i>
</button>

<div class="tooltip" role="tooltip" id="tooltip-save" hidden>
  Save changes
</div>
```

```html
<button class="btn" type="button" data-tooltip="Save changes">
  Save
</button>
```

### Positioning

Set `data-tooltip-placement` to control where the tooltip appears relative to its trigger. The arrow follows the placement automatically.

```html
<p>
  <button class="btn outline" type="button" data-tooltip="Above the button" data-tooltip-placement="top">Top</button>
  <button class="btn outline" type="button" data-tooltip="To the right" data-tooltip-placement="right">Right</button>
  <button class="btn outline" type="button" data-tooltip="Below the button" data-tooltip-placement="bottom">Bottom</button>
  <button class="btn outline" type="button" data-tooltip="To the left" data-tooltip-placement="left">Left</button>
</p>
```

### Custom styling

Override `--tooltip-bg` and `--tooltip-fg` on the tooltip element to change the background and text color. The arrow picks up `background: inherit` so gradients and solid colors both work.

```html
<button class="btn primary" type="button"
        data-tooltip
        aria-describedby="tip-grad"
        data-tooltip-placement="right">
  Hover for gradient
</button>

<div class="tooltip" role="tooltip" id="tip-grad" hidden
     style="background-color: #5b2d9e;
            --tooltip-bg: linear-gradient(135deg, oklch(0.45 0.22 280), oklch(0.5 0.2 10));
            --tooltip-fg: white;
            padding: 0.4em 0.8em;
            font-weight: var(--font-weight-medium);">
  Custom gradient tooltip → arrow matches
</div>
```

Note: added bonus, this is a long tooltip. If you don't have enough space to display
it, it will automatically be moved to top/bottom instead

## Scrollspy

> Behavior hook for navigation that marks the active section while the page scrolls.

Scrollspy is a behavior hook, not a visual component. It marks a navigation
region for the JavaScript enhancement. Pair it with `.nav-list` and `.nav-link`,
or style `[aria-current]` yourself.

- `.scrollspy` marks the region for JS detection. It does not add visual styles.
- `.nav-list` and `.nav-link` provide the visible list and active link styling.
- The JS enhancer uses `IntersectionObserver` to toggle `aria-current="location"`
  on the active link. Without JavaScript, the links remain regular anchor links.
- The same markup also works with the CSS-native scroll markers path (see below).

```html
<nav class="scrollspy" aria-label="Page sections">
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

### Native scroll markers

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

## Status Bar

> Singleton floating area for short, non-critical, transient feedback.

- A status bar is a single live region, not a stacked toaster. New messages replace the previous one.
- Keep one element in the HTML, empty by default. JavaScript only updates its text content; it shows when non-empty and hides when empty, while staying available as a live region.
- Use it for transient status (`Saved.`, `Reconnected.`, `Copied.`). Critical, persistent, or actionable information belongs in `.alert`, inline messages, or dialogs.
- Intents: `danger`, `success`, `warning`, `neutral`. The default (no intent) is a neutral dark pill.

```html
<form class="needs-validation" data-validation-message="Please check the highlighted fields.">
  <label class="field">
    <span class="field-label">Email</span>
    <input class="input" type="email" name="email" required
           aria-describedby="sb-email-error" />
    <span class="field-error" id="sb-email-error" role="alert">Enter a valid email.</span>
  </label>
  <div class="form-actions">
    <button class="btn primary" type="submit">Submit</button>
  </div>
</form>
```

Submitting the empty form blocks submission and shows `data-validation-message` in the status bar below — no JavaScript required beyond the runtime.

```html
<div class="cluster">
  <button class="btn" type="button" commandfor="sb-status" command="--status"
          data-status-message="Saved." data-status-intent="success">Show success</button>
  <button class="btn" type="button" commandfor="sb-status" command="--status"
          data-status-message="Could not save." data-status-intent="danger"
          data-status-duration="6000">Show danger</button>
  <button class="btn outline" type="button" commandfor="sb-status" command="--status-clear">Clear</button>
</div>

<div class="status-bar" data-status id="sb-status" role="status" aria-live="polite" aria-atomic="true"></div>
```

No script required beyond the runtime: `command="--status"` reads its message from `data-status-message` (plus optional `data-status-intent` / `data-status-duration`), `command="--status-clear"` empties the bar. `commandfor` must match the status bar's own `id`.

For dynamic messages — a fetch response, a computed value — dispatch the same event the commands use under the hood:

```js
document.dispatchEvent(new CustomEvent("actual:status", {
  bubbles: true,
  detail: { message: "Saved.", intent: "success" },
}));
```

The runtime auto-wires the status bar to Actual's form validation: a form that fails to submit shows its `data-validation-message` in the status bar with the `danger` intent. No target in the DOM means the call is a no-op, so the markup stays optional.
