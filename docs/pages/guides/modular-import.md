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

In 0.3 the bare `actual-css` import shipped the standard framework, but
**excluded** the `optional` family; the all-in bundle was the separate
`actual-css/css/actual.full` entrypoint. In 0.4 the framework is reorganized
into the core + families model:

- `actual-css` is the minimal core.
- `actual-css/full` is the closest successor to 0.3's `actual.full.css`
  (the all-in bundle), not to the 0.3 bare import — it is slightly wider,
  because the former `optional/` modules now ship with the full bundle.
- The `optional` family is gone. Its modules live in their domain.

### Entrypoint map

| 0.3 | 0.4 |
|---|---|
| `actual-css` | `actual-css/full` for a simple migration (slightly wider than the 0.3 bare import), or `actual-css/css` for the new minimal core |
| `actual-css/css/actual.full` | `actual-css/full` or `actual-css/css/full` |
| `actual-css/js` | `actual-css/js/full` to keep the built-in behaviors (see below) |
| `actual-css/css/forms` | `actual-css/css/forms/all` for the same coverage |
| `actual-css/css/grid` | `actual-css/css/layout/grid` |
| `actual-css/css/prose` | `actual-css/css/typography/prose` |
| `actual-css/css/optional` (bundle) | `actual-css/full` |
| the root core files (`reset`, `tokens`, `theme`, `base`, `intents`, `variants`, `focus`, `print`) | no longer exported individually; compose the core atomically via `actual-css/css` |

The distributed bundle names changed too: `actual.min.css` is now the minimal
core (in 0.3 it was the standard framework), the full CSS is
`actual.full.min.css`, and the full JavaScript runtime is `actual.full.js`
(in 0.3 it was `actual.js`). The `dist/optional*.css` bundles no longer exist.

### Same import path, changed semantics

These specifiers still resolve, but they mean something different now — the
easiest breaking change to miss:

| Path | 0.3 | 0.4 |
|---|---|---|
| `actual-css` | the standard framework (all but `optional/`) | the minimal core |
| `actual-css/js` | the full runtime (flyout, dialog, tabs, validation, status, …) | only the enhancement-manifest loader; the built-ins move to `actual-css/js/full` |
| `actual-css/css/forms` | the complete Forms family | the native-controls base (`forms/base.css`) |
| `actual-css/css/layout` | one layout file | the layout family manifest |
| `actual-css/css/utilities` | the utility leaf | the utilities family: base plus the former `utilities-extra` |
| `actual-css/css/components` | the component manifest | the same, plus chat, fab, and join; overline now lives in `actual-css/css/typography/overline` |
| `actual-css/css/layer` | the standard framework wrapped in `@layer actual` | only the core wrapped in `@layer actual`; layer the families yourself with the full-layer recipe |

### Former optional modules

The `optional` family is gone; each module moved to its domain:

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

Component-prefixed custom properties documented on each page are author hooks.
Color and sizing otherwise stay with the existing intent, variant, control,
and button APIs.
