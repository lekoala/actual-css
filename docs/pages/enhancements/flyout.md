# Flyout

> Positioned surface attached to a trigger, commonly used for action lists and small panels.

## Class reference

| Class | Kind | Description |
|---|---|---|
| `.flyout-trigger` | Composition | Positioning wrapper for a trigger and its panel; gives the flyout a local absolute-position fallback before JavaScript positions it. |
| `.stretch` | Modifier | Stretches a `.flyout-trigger` to span its container, e.g. the last row of a full-width sidebar nav list. |
| `.flyout` | Component | Floating action or nav surface, positioned by JavaScript. |
| `.menu` | Component | Action-list primitive with strict `.menu > li > .menu-item` anatomy. |
| `.menu-item` | Component | One action row; participates in roving focus. |
| `.menu-item-icon` | Slot | Fixed leading column for a decorative icon. |
| `.menu-item-text` | Slot | Flexible label column; truncates when the row is constrained. |
| `.menu-item-end` | Slot | Trailing metadata such as a shortcut, badge, or status. |
| `.menu-label` | Variant | Muted section heading inside a menu; not interactive. |
| `.menu-separator` | Variant | Divider between menu groups (`<hr role="separator">`). |
| `.sm` / `.lg` | Variant | Compact or large density. |

## Usage

Flyout and context menu share one action-surface runtime:

- Flyout = a visible trigger opens a surface.
- Context menu = right click or a keyboard context action opens that same surface.
- Sheet = mobile presentation mode of that same surface.

### Trigger wiring

The runtime resolves the panel from the trigger, so the wiring is part of the
contract:

- Put `data-enhance="flyout"` on the **trigger** (the button, link, or other
  clickable element), never on a wrapper around it.
- The trigger references its panel with `aria-controls="…"` and the panel owns
  the matching `id`. The runtime reads `aria-controls` to find the panel — a
  trigger without the pairing never opens anything.
- Wrap the trigger and panel in `.flyout-trigger`. It is the positioning
  context for the no-JS fallback: without it the panel lays out against the
  nearest positioned ancestor (or the page edge) instead of under the trigger.
- Start the panel with `hidden` so it does not flash open before the runtime
  hides and positions it.

```html
<div class="flyout-trigger">
  <button data-enhance="flyout"
          aria-expanded="false"
          aria-controls="my-panel">
    Menu
  </button>
  <div class="flyout" id="my-panel" hidden>…</div>
</div>
```

Use `data-flyout-mobile` on the flyout to control mobile behavior:

- `auto` is the default. It keeps the surface anchored on desktop and switches to a bottom sheet on coarse pointers below the breakpoint.
- `sheet` always uses the sheet presentation.
- `anchored` always uses floating positioning.
- `none` disables the mobile transformation.

`data-flyout-breakpoint` only matters for `auto`. Prefer the built-in tokens
(`sm`, `md`, `lg`) and use raw pixel values only as an escape hatch, for example
`data-flyout-breakpoint="640"`.

Use `data-flyout-placement` for the preferred anchored placement. It accepts the
placement strings supported by the floating runtime, such as `bottom-start`,
`bottom-end`, `top-start`, `right`, or `left`.

Use `data-flyout-distance` for the trigger gap in pixels. The default is `4`.

Use `data-flyout-auto-close` when the default click dismissal behavior is not
right. Escape still follows the shared surface lifecycle.

- `true` is the default. Clicks inside or outside close the flyout.
- `inside` closes on inside clicks only.
- `outside` closes on outside click only.
- `false` disables automatic click closing.

These values follow Bootstrap's auto-close vocabulary. They apply to action
menus and rich panels alike. Add `data-flyout-close` to a control inside the
flyout when that specific control must close it regardless of the automatic
policy. This is useful for an Apply or Done action in an `outside` or `false`
panel. The trigger and Escape continue to close the flyout in every mode.

```html
<div class="flyout"
     id="filters"
     data-flyout-auto-close="outside"
     hidden>
  <label><input type="checkbox"> Available only</label>
  <button type="button" data-flyout-close>Done</button>
</div>
```

Flyout covers two distinct patterns, detected by the `<menu>` element or
`.menu` class on the panel:

## Action list

A list of *actions* the user can take: sign out, copy, delete.

- Flyout triggers are opt-in: add `data-enhance="flyout"` to the trigger.
- Wrap the trigger and flyout in `.flyout-trigger` when the flyout should have a local absolute-position fallback before JavaScript positions it. Add `.stretch` when the trigger must span its container, such as the last row of a full-width sidebar nav list.
- Use `<menu class="flyout menu">` with strict anatomy: `.menu > li > .menu-item`. Items must carry the `.menu-item` class to participate in roving focus — keyboard navigation (ArrowUp/Down, Home, End) cycles through them, and Enter/Space activates and closes the menu.
- Use `.menu-label` on a `li` for a muted section heading inside a menu (e.g. a group title before its items). It is non-interactive and does not participate in roving focus. Use `.menu-separator` (`<hr role="separator">`) between groups.
- Items are regular `<button>` or `<a>` elements.
- Use `.sm` or `.lg` for density changes.
- Add `role="menu"` / `role="menuitem"` only when you intentionally need the ARIA menu pattern.

```html demo
<div class="flyout-trigger">
  <button class="btn outline"
          type="button"
          data-enhance="flyout"
          aria-expanded="false"
          aria-controls="account-actions"
          id="account-flyout-trigger">
    Account
    <i class="ti ti-chevron-down" aria-hidden="true"></i>
  </button>

  <menu class="flyout sm menu"
        id="account-actions"
        aria-labelledby="account-flyout-trigger"
        hidden>
    <li><button class="menu-item" type="button">Profile</button></li>
    <li><button class="menu-item" type="button">Settings</button></li>
    <hr class="menu-separator" role="separator">
    <li><button class="menu-item danger" type="button">Sign out</button></li>
  </menu>
</div>
```

### Rich items and selection state

Wrap rich item content in the three optional slots when a menu needs aligned
icons or trailing metadata. Keep decorative icons hidden from assistive
technology. Plain text directly inside `.menu-item` remains valid for simple
actions.

```html
<li>
  <button class="menu-item" type="button" role="menuitem">
    <span class="menu-item-icon" aria-hidden="true">…</span>
    <span class="menu-item-text">Duplicate</span>
    <span class="menu-item-end"><kbd>⌘D</kbd></span>
  </button>
</li>
```

Use `role="menuitemcheckbox"` for independent options and
`role="menuitemradio"` for an exclusive choice. Put `aria-checked` on the menu
item itself; do not nest a checkbox, radio, or switch inside it. The runtime
recognizes all three menu-item roles for keyboard activation and the CSS draws
their state indicator. The application remains responsible for updating
`aria-checked`, just as it owns the state behind the command.

```html
<li>
  <button class="menu-item"
          type="button"
          role="menuitemcheckbox"
          aria-checked="true">
    <span class="menu-item-text">Show weekends</span>
  </button>
</li>
```

Badges and shortcuts are passive trailing metadata. If a trailing pin, switch,
or button is independently interactive, use a rich flyout panel with normal
Tab navigation instead of `role="menu"`: a menu item must remain one command.

## Nav panel

A panel of *links* to other pages: product categories, docs sections. Nav panels
can be multi-column with `<section>` / `<ul>` groups.

- Items are regular `<a href>` links, not `role="menuitem"`.
- No roving focus — ArrowDown/Enter open the panel and focus the first focusable descendant. Tab from an open trigger also enters the panel. There is no arrow-key navigation between items inside.
- Just a toggle with outside-click and Escape dismissal.
- Use grid utilities, such as `.grid-3`, for wider multi-column flyouts.

```html demo
<nav aria-label="Main navigation">
  <ul class="list-reset cluster">
    <li class="flyout-trigger">
      <button class="btn ghost"
              type="button"
              data-enhance="flyout"
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

## Mega menu

Use `class="flyout grid-3"` when a nav panel needs multiple link groups. Keep
links regular anchors and let the panel collapse to a one-column sheet on mobile
with `data-flyout-mobile="auto"`.

```html demo
<nav aria-label="Product navigation">
  <ul class="list-reset cluster">
    <li class="flyout-trigger">
      <button class="btn ghost"
              type="button"
              data-enhance="flyout"
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

## Context menu

Context menus use the same `.menu > li > .menu-item` presentation primitive as
action-list flyouts.

Put `data-context-menu` on the smallest unit the actions operate on: a file row,
card, or canvas item. Several units may reference the same
`<menu class="flyout">`. An explicit trigger button inside the unit, marked with
`data-context-menu-trigger` and `aria-controls`, opens the menu through the same
context-aware path — its `aria-controls` must match the `data-context-menu` id
of the host.

Before opening, the context element dispatches the cancelable
`actual:context-menu` event. Its `detail` contains the shared `menu`, the owning
`context`, the exact `origin`, and the opening `trigger` (`pointer`, `touch`,
`keyboard`, or `button`). Use it to tailor the static menu to the selected item,
or cancel the event to keep it closed. `contextFor(menu)` from
`actual-css/js/context-menu` returns that detail while handling a menu action.

Add `data-context-menu-scope` only when the flyout should stay inside a specific
region. Empty or `self` constrains to the target itself, `parent` constrains to
the parent, and a selector constrains to the closest matching ancestor or first
matching element. The scope also constrains the available height, so omit it
when the menu is allowed to escape the card or list item.

Long press is opt-in with `data-context-menu-long-press`. Empty uses the default
delay; a number sets the delay in milliseconds.

```html demo
<div class="card stack"
     id="file-card"
     data-context-menu="file-actions"
     data-context-menu-long-press
     tabindex="0"
     style="min-block-size: 12rem;">
  <div class="cluster justify-content-space-between items-center">
    <strong>File.pdf</strong>
    <button class="btn ghost"
            type="button"
            data-context-menu-trigger
            aria-controls="file-actions"
            id="file-actions-trigger">
      More
    </button>
  </div>
  <p class="text-sm text-muted">Right click a detail below, press the context-menu key, or use More.</p>
  <div class="cluster">
    <span class="badge" data-context-item="File name">File.pdf</span>
    <span class="badge" data-context-item="Owner">Design team</span>
  </div>
  <output id="context-result" class="text-sm text-muted" aria-live="polite">No context selected.</output>

  <menu class="flyout menu"
        id="file-actions"
        aria-labelledby="file-actions-trigger"
        hidden>
    <li><button class="menu-item" type="button">Open</button></li>
    <li><button class="menu-item" type="button">Rename</button></li>
    <hr class="menu-separator" role="separator">
    <li><button class="menu-item danger" type="button">Delete</button></li>
  </menu>
</div>

<script>
  const card = document.getElementById("file-card");
  const result = document.getElementById("context-result");

  card.addEventListener("actual:context-menu", (event) => {
    const item = event.detail.origin.closest?.("[data-context-item]");
    const label = item?.dataset.contextItem ?? "the card";
    result.textContent = `Menu opened for ${label} (${event.detail.trigger}).`;
  });
</script>
```

## CSS hooks

- `--flyout-inline-size` — panel width.
- `--flyout-max-inline-size` — panel width cap.
- `--menu-item-size` — minimum row height of `.menu-item`.
- `--menu-item-icon-size` — shared leading-column width for icons and checked-state indicators.

`--available-height` and `--surface-anchor-width` are written by the positioner
at runtime, not set by the author. See the JavaScript runtime documentation.
