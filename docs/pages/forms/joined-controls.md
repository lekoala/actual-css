# Joined Controls

> Use `.join` when controls need to be visually joined into a single unit.

**Related terms:** segmented control, button group, input group.

## Class reference

| Class         | Kind        | Description                                 |
| ------------- | ----------- | ------------------------------------------- |
| `.join`       | Composition | Joins adjacent controls into a single unit. |
| `.join-addon` | Composition | Static prefix or suffix content.            |

Add `.join` to the wrapper that groups the controls. Use `.join-addon` for static prefix/suffix content such as currency symbols, units, or protocol text. Action buttons inside the group should use `.btn`. The wrapper should still carry `role="group"` with a label for accessibility.

When composing source files manually, import `components/join.css` after the controls it groups. `.join` writes child border-radius longhands directly so joined corners win at equal specificity.

```html demo
<div class="field">
  <label class="field-label" id="amount-label" for="amount">Amount</label>
  <div class="join" role="group" aria-labelledby="amount-label">
    <span class="join-addon">$</span>
    <input class="input" id="amount" name="amount" inputmode="decimal" />
    <button class="btn outline" type="button">Clear</button>
  </div>
  <span class="field-help">Enter the invoice total before tax.</span>
</div>
```

`.join` handles border-radius and border collapsing between adjacent children. It works with any direct child — `.input`, `.btn`, `.select`, or `.join-addon`.
When an `.input`, `.textarea`, or `.select` receives keyboard-relevant focus,
the focus ring surrounds the complete joined field. Attached buttons keep their
own focus indicator when reached directly, so the actionable segment remains
identifiable.

## Linting `role="group"`

Biome's `a11y/useSemanticElements` reports the wrapper and offers `<fieldset>`
as the replacement. That is the only element it suggests, and it does not fit:
`<fieldset>` groups form controls under a `<legend>`, while ARIA's `group` is
any labelled set of related objects. Suppress it on the element:

```html
<!-- biome-ignore lint/a11y/useSemanticElements: ARIA group has no HTML
     equivalent here; fieldset expects form controls under a legend. -->
<div class="join" role="group" aria-label="Date navigation">
```

Unlike the menu rule in
[flyout](../enhancements/flyout.html#linting-rolemenu), do not switch this one
off globally: it correctly catches `<div role="navigation">`,
`<div role="button">` and `<div role="separator">`. And drop `role="group"`
rather than suppressing it when the wrapper has no label to give — an unnamed
group adds a boundary and nothing else.

## CSS hooks

- `--join-radius` — outer corner radius of the joined group. The per-corner
  values of each child are derived from it.
