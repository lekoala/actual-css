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
- JavaScript owns roving `tabindex`, `aria-selected`, `hidden`, and keyboard behavior.
- Left/Right select tabs and wrap at the ends. Home/End jump to first/last. Down moves focus into the selected panel.
- A tab list needs both `.tabs` and `role="tablist"`; `.tab` styles each trigger.
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

## CSS hooks

- `--tab-gap` — space between an icon and the label text (default `0.375em`).
