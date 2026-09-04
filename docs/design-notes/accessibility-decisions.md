# Accessibility decisions

## Guarantees

Actual CSS makes the accessible path the default where CSS and small runtime enhancers can help.

- Visible `:focus-visible` styles on interactive components.
- Native elements first: `button`, `a`, `details`, `dialog`, form controls.
- Reduced motion support through shared duration tokens and the reset.
- Forced-colors support on controls and visual state indicators.
- DOM tests for enhancer lifecycle, focus, attributes, and keyboard behavior.

## Linters that reject ARIA patterns

Measured on Biome 2.5.6, in HTML and JSX alike.

`a11y/noNoninteractiveElementToInteractiveRole` reports `<menu role="menu">`,
and its fix removes the role, which dismantles the composite. It is a port of
`jsx-a11y/no-noninteractive-element-to-interactive-role` that dropped the source
rule's default allowlist, so every ARIA composite built on a list is reported —
`menu`, `listbox`, `tablist`, `menubar`, `tree`, `grid` — even though the source
documents `<ul role="menu">` as valid. Switch the rule off; a per-element
suppression would sit above every menu in the markup.

`a11y/useSemanticElements` reports `role="group"` on `.join` and
`.avatar-stack`, suggesting `<fieldset>`. `<fieldset>` groups form controls
under a `<legend>`; ARIA's `group` is any labelled set of related objects. This
rule stays on — it correctly catches `<div role="navigation">`,
`<div role="button">`, `<div role="separator">` — so suppress it on the wrapper
instead. A wrapper with no label to give should drop the role rather than
suppress the rule.

Two decisions these findings settled:

- `.join` keeps `role="group"` rather than `role="toolbar"`, which the rule does
  not report. Toolbar owes arrow-key navigation with a roving tabindex, and
  claiming the role without the behaviour is worse than the false positive.
- `.menu-separator` is a plain `<hr>`. The `role="separator"` these docs used to
  show is implied by the element, and `a11y/noRedundantRoles` was right to
  reject it. Nothing in the CSS or the runtime read it.

Only the menu container is ever reported: `role="menuitem"` sits on a `<button>`
or `<a>`, never on the `<li>`, and an interactive element is a legitimate role
host. Tabs put `role="tablist"` on a `<div>`, so they are unaffected.

## Author Responsibilities

- Name icon-only buttons.
- Use the ARIA attributes shown in examples.
- Keep form errors inline and connected with `aria-describedby`.
- Do not put critical information only in a transient notification.

## Interactive states

- Interactive controls must be identifiable at rest, either by their own styling or by clear surrounding context.
- Interactive states are: rest, hover, active / pressed, focus-visible, disabled, selected / current / expanded (when applicable).
- Do not rely on hover alone to reveal interactivity.
- Do not use color alone to communicate state.
- Use structure, border, background, iconography, and spacing consistently.
- Select controls stay quieter than text inputs: hover uses a subtle surface change, while focus-visible and open states use a soft ring in normal color modes.
- Forced-colors keeps strong outlines for select focus/open states, high-contrast option hover/focus states, and a selected checkmark that inherits the option text color unless the option is highlighted.
- Global Escape handlers only prevent default when Actual has a visible managed surface to close.
- Prefer explicit `data-filter` values in examples and docs. Empty `data-filter`
  does not infer behavior from `inputmode`: keyboard hints and destructive value
  filtering remain separate contracts.
