# Utilities

Utilities are a small escape hatch for common single-purpose needs. They should support composition, not become the primary way to build UI.

- Prefer semantic HTML, components, and layout primitives first.
- Add utilities only when the rule is broadly useful and unlikely to become a component.
- Keep utility names stable, boring, and few.
- Utilities should use logical properties where relevant.

## Two layers

Utilities ship in two modules, and the split is about **naming and curation**,
not about opting in. Importing `actual-css/css/utilities` — or
`actual.full.css` — gives you both.

| Module    | Import                           | Naming                             |
| --------- | -------------------------------- | ---------------------------------- |
| **Base**  | `actual-css/css/utilities/base`  | Compact names, frequent operations |
| **Extra** | `actual-css/css/utilities/extra` | Explicit property/value names      |

Base is the curated set, and it is where a short name is allowed: `.px`, `.py`,
`.mbs`, `.gap-none`. Extra spells out the property and the value — `.gap-sm`,
`.overflow-x-auto`, `.justify-content-center` — and never gives a base utility
a second spelling.

Reach for base first. Extra exists so an explicit one-off does not have to
become a new short name, which is the pressure that grows a utility surface.

Extra utilities are concentrated in flex, overflow and spacing; those pages
list the two layers as separate tables. Every other utility page is base only.

## Non-Goals

> Utilities deliberately excluded to keep the surface small and intentional.

- No display scale such as `.block`, `.flex`, `.grid` — use layout primitives.
- No color scales such as `.text-primary` or `.bg-success` — intent colors belong to components and state.
- No breakpoint utility variants — use container queries or layout primitives.
- No utility variants for hover, focus, dark mode, or arbitrary selectors — use component states.
- No full spacing scale with every step and direction — the 17 spacing helpers across the core and extra utilities cover the most common escape hatches.
