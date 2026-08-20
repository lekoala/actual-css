# Layout Overview

Layout provides a small set of composable building blocks for common page, app, and content structure. It is not a utility-first framework and it is not a twelve-column grid system.

- Layout classes compose components; components do not own page spacing.
- Use custom properties to tune a layout instance.
- Prefer intrinsic and container-friendly behavior over breakpoint-heavy APIs.
- Keep class names semantic enough to remember and generic enough to reuse.
- Add a new layout primitive only when a pattern appears often and is awkward to express with existing primitives.

See [Choosing a layout](./choosing.md) for the distinctions between responsive
collections, fixed structural grids, all-or-nothing peer regions, and sidebars.

## Spacing tokens

Layout shares the global spacing surface and exposes a small set of gap and rhythm tokens.

```css
:root {
  --gap: 0.75rem;
  --space-10: 0.25rem;
  --space-20: 0.5rem;
  --space-30: 0.75rem;
  --space-40: 1rem;
  --space-50: 1.5rem;
  --space-60: 2rem;
}
```

Most layout primitives read `--gap` and allow local overrides.

```css
.settings-form {
  --gap: var(--space-50);
}
```

Prefer a local custom property over adding many one-off utility classes. Use inline styles only for demos, prototypes, or truly dynamic values.

There are no `.gap-sm` / `.gap-md` / `.gap-lg` density variants on the core layout primitives; set `--gap` locally when only spacing should change. The optional `utilities-extra.css` layer ships those gap utilities for row/column containers.
