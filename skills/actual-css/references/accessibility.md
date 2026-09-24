# Accessibility and runtime assumptions

## Accessible defaults

- Prefer native interactive elements.
- Preserve visible keyboard focus.
- Name icon-only controls.
- Do not rely on color alone to communicate state.
- Connect form help/errors to controls.
- Keep persistent or critical information out of tooltip/status-only UI.
- Respect reduced motion and forced colors in custom states.

## Focus

Actual's core provides a focus baseline. Components may enhance it, but application styling must not remove visible keyboard focus without an equivalent accessible treatment.

When replacing focus visuals, consider forced-colors behavior as well as normal color modes.

## Roles and keyboard behavior

Do not claim an ARIA role only because it sounds semantically close. Roles such as toolbar, menu, tablist, listbox, or grid imply interaction and keyboard expectations.

Prefer native semantics where they fit, and only add ARIA needed to express behavior that native HTML does not already convey.

## Interactive states

For custom treatment of controls, consider relevant states such as:

```text
rest
hover
active / pressed
focus-visible
disabled
selected / current / expanded
```

Do not make hover the only indication that something is interactive.

## Browser policy

Read the installed Actual CSS browser-support documentation for exact supported versions. Do not add legacy compatibility wrappers merely from habit.

Actual's runtime intentionally relies on modern platform primitives when they are within its documented JavaScript support floor. Project-specific browser requirements can be stricter and belong in `PROJECT.md`.
