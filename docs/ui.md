# UI

UI components are interactive patterns that need JavaScript or modern platform behavior to be complete. They follow the same principles as static components: semantic markup first, small class API, shared tokens, and progressive enhancement.

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

Enhancer modules self-register when imported. They do not require init calls and should stay safe to import independently.

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
- Use `<menu class="flyout">` with `<li>` items.
- Items are regular `<button>` or `<a>` elements.
- Use `.sm` or `.lg` for density changes.
- Add `role="menu"` / `role="menuitem"` only when you intentionally need the ARIA menu pattern and roving arrow-key behavior.

### Nav panel
- A panel of *links* to other pages: product categories, docs sections.
- Items are regular `<a href>` links, not `role="menuitem"`.
- No arrow-key navigation, no `role="menu"`.
- Just a toggle with outside-click and Escape dismissal.

```html
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
```

```html
<nav aria-label="Main navigation">
  <ul class="list-reset cluster">
    <li>
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
        <section aria-labelledby="products-design" class="px py-sm">
          <h3 id="products-design">Design</h3>
          <ul>
            <li><a href="/figma">Figma integration</a></li>
            <li><a href="/tokens">Design tokens</a></li>
          </ul>
        </section>

        <section aria-labelledby="products-dev" class="px py-sm">
          <h3 id="products-dev">Development</h3>
          <ul>
            <li><a href="/components">Components</a></li>
            <li><a href="/api">API</a></li>
          </ul>
        </section>

        <footer class="px py-sm">
          <a href="/pricing" class="btn primary">See pricing</a>
        </footer>
      </div>
    </li>

    <li><a href="/about" class="btn ghost">About</a></li>
    <li><a href="/contact" class="btn ghost">Contact</a></li>
  </ul>
</nav>
```

### Context menu

The same flyout can be opened from a visible button and a contextual target. Prefer shipping both so desktop users get right click and mobile users still have a discoverable trigger.

Add `data-context-menu-scope` when the flyout should stay inside a specific region. Empty or `self` constrains to the target itself, `parent` constrains to the parent, and a selector constrains to the closest matching ancestor or first matching element.

Long press is opt-in with `data-context-menu-long-press`. Empty uses the default delay; a number sets the delay in milliseconds.

```html
<div class="card stack gap-sm"
     data-context-menu="file-actions"
     data-context-menu-scope="self"
     data-context-menu-long-press
     tabindex="0"
     style="min-block-size: 12rem;">
  <div class="cluster justify-between items-center">
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

Links:
- https://oat.ink/components/#menu
- https://daisyui.com/components/menu/
- https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/
- https://github.com/lekoala/pure-context-menu
- https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/popover
- https://v6-dev--twbs-bootstrap.netlify.app/docs/6.0/components/menu/
- https://getbootstrap.com/docs/5.3/components/popovers/#overview

## Tabs

> In-place panel switcher using real tab semantics, with roving tabindex and arrow-key navigation.

- Use real tab semantics when panels switch in place.
- Use normal links and `aria-current="page"` for page navigation that only looks like tabs.
- JavaScript owns roving `tabindex`, `aria-selected`, `hidden`, and keyboard behavior.
- Left/Right select tabs and wrap at the ends. Home/End jump to first/last. Down moves focus into the selected panel.
- `.tabs` styles the tab list. `.tab` styles each trigger.

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

Links:
- https://www.makethingsaccessible.com/guides/responsive-and-accessible-tabbed-interfaces/
- https://www.w3.org/WAI/ARIA/apg/patterns/tabs/
- https://uiterms.com/tabs/
- https://m3.material.io/components/tabs/accessibility
- https://css-tricks.com/pure-css-tabs-with-details-grid-and-subgrid/
- https://basecoatui.com/components/tabs/
- https://daisyui.com/components/tab/
- https://inclusive-components.design/tabbed-interfaces/

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
     style="--tooltip-bg: linear-gradient(135deg, oklch(0.45 0.22 280), oklch(0.5 0.2 10));
            --tooltip-fg: white;
            padding: 0.4em 0.8em;
            font-weight: var(--font-weight-medium);">
  Custom gradient tooltip → arrow matches
</div>
```

Links:
- https://oat.ink/components/#tooltip
- https://picocss.com/docs/tooltip
- https://uiterms.com/tooltip/
- https://vispero.com/resources/using-the-html-title-attribute-updated/
- Modern tooltips: https://codepen.io/lekoalabe/pen/JoPNWpX
- https://m3.material.io/components/tooltips/overview
- https://basecoatui.com/components/tooltip/
- https://daisyui.com/components/tooltip/

## Scrollspy

> Navigation that highlights the active section of a long page as the user scrolls.

- Use regular document landmarks and anchor links.
- JavaScript updates `aria-current="true"` or `aria-current="location"` on the active link.
- Prefer `IntersectionObserver` with a small fallback that leaves links usable.
- CSS styles the current state; it should not depend on scroll JavaScript to make navigation usable.

```html
<nav class="scrollspy" aria-label="Page sections">
  <ol>
    <li><a href="#overview" aria-current="location">Overview</a></li>
    <li><a href="#tokens">Tokens</a></li>
    <li><a href="#components">Components</a></li>
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

Links:
- https://getbootstrap.com/docs/5.3/components/scrollspy/
- https://una.im/scroll-target-group/
- https://www.sarasoueidan.com/blog/css-scrollspy/
