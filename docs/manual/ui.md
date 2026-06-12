# UI

UI components are interactive patterns that need JavaScript or modern platform behavior to be complete. They follow the same principles as static components: semantic markup first, small class API, shared tokens, and progressive enhancement.

- CSS owns layout, surfaces, state styling, and transitions.
- JavaScript owns open/closed state, ARIA synchronization, focus management, keyboard behavior, and dismissal.
- Prefer native platform features when they fit, with small helpers where browser support or ergonomics need it.
- Keep behavior optional when possible. Markup should remain understandable without JavaScript.
- Use shared button classes and variants for triggers.
- Do not add toasts. Use alerts, status regions, dialogs, or inline validation instead.

## Dropdown

- Use `.dropdown` for the positioned root.
- Use a button trigger for actions and disclosure.
- JavaScript updates `aria-expanded`, `hidden`, focus, and dismissal.
- Support Escape, outside click, focus return, and keyboard navigation.
- Use `role="menu"` only for application action menus. Navigation lists should stay navigation lists.
- Popover-based dropdowns can be a modern enhancement, not the only path.

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

Navigation dropdowns are not menus in the ARIA application-menu sense.

```html
<nav aria-label="Main navigation">
  <ul>
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

    <li><a href="/about">About</a></li>
    <li><a href="/contact">Contact</a></li>
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

  <section role="tabpanel" id="panel-general" aria-labelledby="tab-general">
    General content
  </section>
  <section role="tabpanel" id="panel-security" aria-labelledby="tab-security" hidden>
    Security content
  </section>
  <section role="tabpanel" id="panel-billing" aria-labelledby="tab-billing" hidden>
    Billing content
  </section>
</div>
```

```html
<nav aria-label="Account sections">
  <ul class="tabs">
    <li><a class="tab primary" href="/account" aria-current="page">Profile</a></li>
    <li><a class="tab" href="/account/security">Security</a></li>
    <li><a class="tab" href="/account/billing">Billing</a></li>
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

- Use `aria-describedby` to connect the trigger to the tooltip.
- Tooltips are supplemental. Do not put required information or interactive controls inside them.
- Show on hover and focus. Hide on Escape, blur, pointer leave, or scroll when appropriate.
- JavaScript can generate tooltip elements from `data-tooltip`.
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
