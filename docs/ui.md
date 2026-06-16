# UI

UI components are interactive patterns that need JavaScript or modern platform behavior to be complete. They follow the same principles as static components: semantic markup first, small class API, shared tokens, and progressive enhancement.

- CSS owns layout, surfaces, state styling, and transitions.
- JavaScript owns open/closed state, ARIA synchronization, focus management, keyboard behavior, and dismissal.
- Prefer native platform features when they fit, with small helpers where browser support or ergonomics need it.
- Keep behavior optional when possible. Markup should remain understandable without JavaScript.
- Use shared button classes and variants for triggers.
- Do not add toasts. Use alerts, status regions, dialogs, or inline validation instead.

## Dropdown

> Positioned menu attached to a trigger, with full keyboard, focus, and ARIA support.

Dropdown covers two distinct patterns:

### App menu
- A list of *actions* the user can take — sign out, copy, delete.
- Items are `<button role="menuitem">`.
- Arrow keys navigate between items. Home/End jump to first/last.
- Uses `aria-haspopup="menu"` and `role="menu"`.

### Nav panel
- A panel of *links* to other pages — product categories, docs sections.
- Items are regular `<a href>` links, not `role="menuitem"`.
- No arrow-key navigation, no `role="menu"`.
- Just a toggle with outside-click and Escape dismissal.

```html
<div class="dropdown">
  <button class="btn outline"
          type="button"
          aria-haspopup="menu"
          aria-expanded="false"
          aria-controls="account-menu"
          id="account-menu-trigger">
    Account
    <i class="ti ti-chevron-down" aria-hidden="true"></i>
  </button>

  <div class="dropdown-menu"
       role="menu"
       id="account-menu"
       aria-labelledby="account-menu-trigger"
       hidden>
    <button class="btn link" type="button" role="menuitem">Profile</button>
    <button class="btn link" type="button" role="menuitem">Settings</button>
    <hr role="separator" />
    <button class="btn link danger" type="button" role="menuitem">Sign out</button>
  </div>
</div>
```

```html
<nav aria-label="Main navigation">
  <ul class="list-reset cluster">
    <li class="dropdown">
      <button class="btn ghost"
              type="button"
              aria-expanded="false"
              aria-controls="products-panel">
        Products
        <i class="ti ti-chevron-down" aria-hidden="true"></i>
      </button>

      <div class="dropdown-menu"
           id="products-panel"
           aria-label="Products"
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

Links:
- https://picocss.com/docs/dropdown
- https://oat.ink/components/#dropdown
- https://daisyui.com/components/dropdown/
- https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/
- https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/popover

## Tabs

> In-place panel switcher using real tab semantics, with roving tabindex and arrow-key navigation.

- Use real tab semantics when panels switch in place.
- Use normal links and `aria-current="page"` for page navigation that only looks like tabs.
- JavaScript owns roving `tabindex`, `aria-selected`, `hidden`, and keyboard behavior.
- Support Left/Right, Home/End, Enter/Space when activation is manual.
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

  <section role="tabpanel" id="panel-general" aria-labelledby="tab-general" class="py">
    General content
  </section>
  <section role="tabpanel" id="panel-security" aria-labelledby="tab-security" hidden class="py">
    Security content
  </section>
  <section role="tabpanel" id="panel-billing" aria-labelledby="tab-billing" hidden class="py">
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

## Tooltip

> Supplemental label for a trigger, shown on hover and focus, hidden on dismissal.

- Use `aria-describedby` to connect the trigger to the tooltip.
- Tooltips are supplemental. Do not put required information or interactive controls inside them.
- Show on hover and focus. Hide on Escape, blur, pointer leave, or scroll when appropriate.
- JavaScript can generate tooltip elements from `data-tooltip`.
- Use `data-tooltip-placement` to set the preferred placement (default `top`).
- The arrow inherits the tooltip background — custom gradients carry through automatically.
- Avoid relying on the native `title` attribute as the primary implementation.

```html
<button class="btn ghost"
        type="button"
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
