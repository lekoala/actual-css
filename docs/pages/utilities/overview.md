# Utilities

Utilities are a small escape hatch for common single-purpose needs. They should support composition, not become the primary way to build UI.

- Prefer semantic HTML, components, and layout primitives first.
- Add utilities only when the rule is broadly useful and unlikely to become a component.
- Keep utility names stable, boring, and few.
- Utilities should use logical properties where relevant.

## Non-Goals

> Utilities deliberately excluded to keep the surface small and intentional.

- No display scale such as `.block`, `.flex`, `.grid` — use layout primitives.
- No color scales such as `.text-primary` or `.bg-success` — intent colors belong to components and state.
- No breakpoint utility variants — use container queries or layout primitives.
- No utility variants for hover, focus, dark mode, or arbitrary selectors — use component states.
- No full spacing scale with every step and direction — the 17 spacing helpers across the core and extra utilities cover the most common escape hatches.