# Modular imports

Actual ships one minimal core (`actual-css`) and one all-in entrypoint
(`actual-css/full`); everything else is composed from the family manifests
under `src/css/`.

## The two entrypoints

```css
@import "actual-css";        /* minimal core only */
@import "actual-css/full";   /* every shipped functional family */
```

`actual-css` is the minimal core: reset, tokens, theme, document defaults,
intents, universal variants, generic focus, and generic print. It contains no
forms, layout, typography module, component, effect, or utility bundle.

`actual-css/full` starts from the core and adds every family in cascade order:
typography, layout, forms, components, effects, utilities.

## Family manifests

Each family is a directory under `src/css/` with an `index.css` manifest:

| Family | Manifest import | Modules |
|---|---|---|
| Core | `actual-css/css` | reset, tokens, theme, base, intents, variants, focus, print |
| Layout | `actual-css/css/layout` | stack, cluster, center, frame, media, switcher, sidebar-layout, grid, scroller, scroll-snap, topbar, container-query, app-shell |
| Typography | `actual-css/css/typography` | prose, overline, fluid |
| Forms | `actual-css/css/forms` | native controls; `actual-css/css/forms/all` for the complete family (input-icon, switch, range, choice-card, custom-select, floating-field, otp) |
| Components | `actual-css/css/components` | button, card, badge, alert, dialog, drawer, flyout, menu, tab, tooltip, chat, fab, join, … |
| Effects | `actual-css/css/effects` | aura |
| Utilities | `actual-css/css/utilities` | base, extra |

Import a single module with its domain path when a project only needs that
piece:

```css
@import "actual-css/css/forms/otp";
@import "actual-css/css/components/chat";
@import "actual-css/css/effects/aura";
@import "actual-css/css/layout/scroller";
@import "actual-css/css/typography/fluid";
@import "actual-css/css/utilities/extra";
```

## Migrating from 0.3

In 0.3 the bare `actual-css` import shipped the all-in experience, and the
`optional` family carried the less-common modules. In 0.4:

- `actual-css` is the minimal core.
- `actual-css/full` preserves the 0.3 all-in behavior.
- The `optional` family is gone. Its modules live in their domain.

| 0.3 path | 0.4 path |
|---|---|
| `actual-css/css/optional/otp` | `actual-css/css/forms/otp` |
| `actual-css/css/optional/floating-field` | `actual-css/css/forms/floating-field` |
| `actual-css/css/optional/chat` | `actual-css/css/components/chat` |
| `actual-css/css/optional/fab` | `actual-css/css/components/fab` |
| `actual-css/css/optional/aura` | `actual-css/css/effects/aura` |
| `actual-css/css/optional/scroller` | `actual-css/css/layout/scroller` |
| `actual-css/css/optional/scroll-snap` | `actual-css/css/layout/scroll-snap` |
| `actual-css/css/optional/layout-extra` | `actual-css/css/layout/topbar` |
| `actual-css/css/optional/typography-fluid` | `actual-css/css/typography/fluid` |
| `actual-css/css/optional/utilities-extra` | `actual-css/css/utilities/extra` |
| `actual-css/css/optional` (bundle) | `actual-css/full` |

Component-prefixed custom properties documented on each page are author hooks.
Color and sizing otherwise stay with the existing intent, variant, control,
and button APIs.
