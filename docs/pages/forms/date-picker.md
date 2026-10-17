# Date picker

> A JavaScript date picker is not shipped by the framework — the native `<input type="date">` stays the baseline. Use `data-mask` for a fixed text shape, or theme an external picker with Actual tokens.

The native control is the default: a real calendar, no JavaScript, and an ISO
`yyyy-mm-dd` value whatever the platform displays. Reach for an external picker
only when the product needs a shape the native control cannot express — a month
grid for a range, a typed constraint, a styled calendar.

**Related terms:** date field, datepicker, calendar, native date, date input, masked date, input mask, date range.

## Native baseline

```html demo
<label class="field">
  <span class="field-label">Start date</span>
  <input class="input" type="date" />
</label>
```

## Masked text field

`data-mask` structures a plain text field to a fixed shape and the `date` rule
validates meaning. The mask enforces shape, not validity, so `2026-13-40` needs
the rule (or server validation).

```html demo
<label class="field">
  <span class="field-label">Date</span>
  <input class="input" data-mask="9999-99-99" inputmode="numeric" autocomplete="off" placeholder="yyyy-mm-dd" />
</label>
```

## Theme bridge

The [date fields template](../../demo/templates/date-fields.html) puts the native
control, the masked field and
[`@lekoala/date-picker`](https://github.com/lekoala/date-picker) side by side, the
picker skinned entirely with Actual tokens.

```html
<label class="field">
  <span class="field-label">Booking date</span>
  <date-picker value="2026-09-25" open-on-focus="false">
    <input class="input" name="date">
  </date-picker>
</label>
```

```css
date-picker,
date-calendar {
  --dp-bg: var(--surface-raised);
  --dp-fg: var(--text);
  --dp-muted: var(--text-muted);
  --dp-border: var(--border);
  --dp-hover: var(--surface-subtle);
  --dp-accent: var(--primary);
  --dp-accent-fg: var(--primary-fg);
  --dp-radius: var(--radius);
  --dp-focus: var(--focus);
  --dp-focus-width: var(--focus-ring-width);
  /* Trigger glyph on the select chevron axis. */
  --dp-picker-button-size: calc(var(--control-pad-x) * 2 + 1em + var(--border-width) * 2);
}

.dp-picker-panel[popover] {
  box-shadow: var(--shadow-popout);
}
```

The picker draws focus as an inset line, like the core, so `--dp-focus` and
`--dp-focus-width` are the whole focus mapping; the field itself is a plain
`.input` and keeps the core outline. The panel has no shadow token, so it takes
`--shadow-popout` directly. It opens as a popover, in the top layer,
so inside a modal, even in a scrolling body, it is neither clipped nor stacked
under the dialog. The calendar popup is its own
element, so the `--dp-*` map is declared on `date-picker`/`date-calendar` rather
than inherited from a wrapper.
As with the combobox, the bridge stays in docs/demo — it is a recipe, not package
API, and pins no widget version.

## Which one?

- A plain date the platform can collect: native `<input type="date">`.
- A fixed text format that must survive as typed text: `data-mask` plus the `date` rule.
- A calendar, range, or constraint the native control cannot express: an external picker on the token bridge.
