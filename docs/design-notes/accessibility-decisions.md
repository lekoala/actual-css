# Accessibility decisions

## Guarantees

Actual CSS makes the accessible path the default where CSS and small runtime enhancers can help.

- Visible `:focus-visible` styles on interactive components.
- Native elements first: `button`, `a`, `details`, `dialog`, form controls.
- Reduced motion support through shared duration tokens and the reset.
- Forced-colors support on controls and visual state indicators.
- DOM tests for enhancer lifecycle, focus, attributes, and keyboard behavior.

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
