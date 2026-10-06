# Tabs

> In-place panel switcher using real tab semantics, with roving tabindex and arrow-key navigation.

## Class reference

| Class      | Kind      | Description                                  |
| ---------- | --------- | -------------------------------------------- |
| `.tabs`    | Component | Tab strip; pairs with `role="tablist"`.      |
| `.tab`     | Component | One tab trigger; pairs with `role="tab"`.    |
| `.primary` | Intent    | Tints the selected tab's indicator and text. |

## Usage

- Use real tab semantics when panels switch in place.
- Use normal links and `aria-current="page"` for page navigation that only looks like tabs.
- On that link variant, `aria-current="page"` gets the same color and
  underline treatment as `aria-selected="true"` on a widget tab; `primary`
  tints it. A flyout trigger takes `"true"` (see below); any other value is
  inert.
- Tab selection never changes text metrics: the active tab keeps the shared
  weight and is marked by color and the indicator line.
- JavaScript owns roving `tabindex`, `aria-selected`, `hidden`, and keyboard behavior.
- Left/Right select tabs and wrap at the ends. Home/End jump to first/last. Down moves focus into the selected panel.
- A tab list needs both `.tabs` and `role="tablist"`; `.tab` styles each trigger.
  A tab belongs to its closest `role="tablist"`. `data-enhance="tabs"` on an
  element without that role wires nothing and warns in the console.
- Naming follows the container/item convention (like `menu` / `menu-item`):
  `.tabs` is the strip, `.tab` is one trigger. The JS module
  (`actual-css/js/tab`) is named for the file; the behavior token
  (`data-enhance="tabs"`) is named for what it wires.
- A `.tab` with an icon uses `--tab-gap` (default `0.375em`) for the space between icon and label.
- A tab that is `hidden`, `disabled`, `aria-disabled`, or has no panel is skipped
  by the arrow keys. An application filtering a tab strip only has to set
  `hidden`; deciding what to show when the selected tab is filtered out is the
  application's call.

```html demo
<div class="tabs" data-enhance="tabs" role="tablist" aria-label="Settings">
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
```

For navigation that only looks like tabs, keep it a plain link list — no
JavaScript involved:

```html demo
<nav aria-label="Account sections">
  <ul class="tabs">
    <li><a class="tab primary" href="#account" aria-current="page">Profile</a></li>
    <li><a class="tab" href="#security">Security</a></li>
    <li><a class="tab" href="#billing">Billing</a></li>
  </ul>
</nav>
```

## Equal-width tabs

To make a few tabs share the strip's width (segmented, full-width, fill), set
`--tab-flex: 1 1 0` on the strip. `.switcher` does not apply here: a tab strip
never wraps, so it could never stack.

```html demo
<nav aria-label="Pricing sections">
  <ul class="tabs" style="--tab-flex: 1 1 0">
    <li><a class="tab primary" href="#reasons" aria-current="page">Reasons</a></li>
    <li><a class="tab" href="#rates">Rates</a></li>
  </ul>
</nav>
```

## Too many tabs

A horizontal strip is one row and never wraps, nor does a label: a second line
would not match the Left/Right keys and reads as a nested level. When the tabs
do not fit (narrow screen, mobile, long translations), the strip scrolls
horizontally without a scrollbar; the edges it can still scroll toward fade
out. Selecting or focusing the tab clipped at the edge scrolls it into view
with the next one peeking, so a click, the arrow keys or a swipe move along the
strip. A tab selected in the markup starts in view too, when the strip is
visible at connect, and so does the current link tab (or flyout trigger),
without the runtime; the placement moves the strip only, never the page. A
vertical strip (`aria-orientation="vertical"`) keeps wrapping its labels.

Scrolling is the fallback, not a responsive design. If a strip regularly
overflows, shorten the labels, group sections, or switch to a vertical rail.

## Tab with a flyout

In navigation tabs, a `.tab` can be a [flyout](flyout.md) trigger for a group of
pages. The link to the current page inside its panel carries
`aria-current="page"`. The trigger is not a page, so it takes
`aria-current="true"` while its panel holds the current page: the section is
the current item of the strip. This is the only place a `.tab` takes `true`.

```html demo
<nav aria-label="Account">
  <ul class="tabs">
    <li><a class="tab" href="#profile">Profile</a></li>
    <li><a class="tab" href="#security">Security</a></li>
    <li class="flyout-trigger">
      <button class="tab"
              type="button"
              data-enhance="flyout"
              aria-current="true"
              aria-expanded="false"
              aria-controls="billing-menu">
        Billing <i class="ti ti-chevron-down" aria-hidden="true"></i>
      </button>
      <ul class="flyout menu" id="billing-menu" hidden>
        <li><a class="menu-item" href="#invoices" aria-current="page">Invoices</a></li>
        <li><a class="menu-item" href="#payment">Payment methods</a></li>
      </ul>
    </li>
  </ul>
</nav>
```

Do not put a flyout trigger in a `role="tablist"`: a tablist holds only
`role="tab"` items, and the arrow keys of the two widgets collide.

## CSS hooks

- `--tab-flex` — flex of each item; set `1 1 0` on the strip for equal-width tabs
  (segmented, fill the width). A strip that cannot fit its labels still scrolls.
- `--tab-gap` — space between an icon and the label text (default `0.375em`).
