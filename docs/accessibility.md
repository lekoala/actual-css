# Accessibility

Actual CSS makes the accessible path the default where CSS and small runtime enhancers can help.

## Guarantees

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

Happy DOM tests validate orchestration, not pixels or real browser layout.
