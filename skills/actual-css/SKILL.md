---
name: actual-css
description: Build and review application UI with Actual CSS. Use when choosing Actual CSS imports, classes, layout primitives, theme tokens, component hooks, forms, progressive enhancements, accessibility behavior, or when deciding whether CSS/JS belongs in Actual CSS or application code.
---

# Actual CSS

Use Actual CSS as a **UI vocabulary and behavior kit**, not as a stylesheet to fight.

The target is not zero application CSS. The target is:

> no duplicated framework behavior, no invented Actual API, and no palette literals scattered outside the theme/token layer.

## Start from the installed API

Actual CSS may evolve between releases. Resolve uncertain API from the version used by the current project, in this order:

1. `actual-css/components.json` — component index: classes, public hooks, states, CSS/JS imports, enhancement tokens.
2. `actual-css/reserved-classes.json` — framework-owned class namespace.
3. `actual-css/package.json#exports` — canonical package entrypoints.
4. `actual-css/src/css/` and `actual-css/src/js/` — exact selectors, defaults, state ownership, and runtime behavior.
5. `actual-css/docs/` and `actual-css/llms.txt` — intended usage and concise architecture guidance.

If this skill was copied into a consuming project, the installed package wins over examples or summaries in this skill.

Use the bundled inspector when useful:

```sh
node <skill>/scripts/inspect-actual-css.mjs --source
node <skill>/scripts/inspect-actual-css.mjs button
node <skill>/scripts/inspect-actual-css.mjs --class compact
node <skill>/scripts/inspect-actual-css.mjs --exports
node <skill>/scripts/inspect-actual-css.mjs --enhancements
```

If `PROJECT.md` exists beside this file, read it after resolving the Actual CSS API. It contains application-specific choices, not framework API.

## Decision order

Before writing application CSS, ask in this order:

1. **Theme** — can semantic tokens express the visual requirement?
2. **Layout relationship** — does an Actual layout primitive express how the children relate?
3. **Component** — is there already a component or pattern for the structure?
4. **Public hook** — can a documented custom property tune it?
5. **Utility** — does an existing small utility express the adjustment?
6. **Application CSS** — is the remaining requirement genuinely product-specific?

Use Actual for generic structure and behavior. Use application CSS for product identity, unusual geometry, bespoke animation, and product-specific composition.

Do not preserve incidental mockup pixels by default. Resolve designs toward the system first.

## Public class grammar

Actual CSS intentionally uses unprefixed global classes:

```text
.component [intent] [variant] [size] [modifier]
```

Example:

```html
<button class="btn primary outline lg">Publish</button>
<span class="badge success soft">Online</span>
<section class="card raised stack">...</section>
```

Rules:

- Compose intents and variants; do not invent `.btn-primary`-style compounds.
- `.sm` / `.lg` are size modifiers; `.compact` / `.spacious` are density contexts.
- Undocumented `is-*` classes are runtime state, not author API.
- Component-specific modifiers only mean what their component documents.
- Do not invent breakpoint/state utility syntax or arbitrary-value utilities.
- Do not recreate a generic spacing scale; use layout rhythm, density, hooks, or local CSS.
- Before introducing a generic-looking application class, check `reserved-classes.json`.

See `references/api-and-vocabulary.md`.

## Imports

Use the smallest package surface consistent with the project's policy.

```css
@import "actual-css";              /* minimal core */
@import "actual-css/full";         /* complete framework */

@import "actual-css/css";          /* source core */
@import "actual-css/css/layout";
@import "actual-css/css/forms/all";
@import "actual-css/css/components/button";
```

Forms are intentionally split:

- `actual-css/css/forms` — native-control baseline.
- `actual-css/css/forms/all` — complete forms family.

The minimal core does not imply that layout, forms, components, typography, effects, or utilities are loaded.

Import JavaScript behavior independently when possible:

```js
import "actual-css/js/flyout";
import "actual-css/js/tooltip";
import "actual-css/js/validation";
```

Check the installed package exports before assuming an entrypoint exists.

See `references/api-and-vocabulary.md`.

## Layout and theming

Choose layout from the **relationship between children**, not from the number of columns visible in one mockup:

```text
vertical flow                         -> .stack
wrapping inline peers                 -> .cluster
responsive repeated items             -> .grid
known equal peer density              -> .grid-N
peers that switch together            -> .switcher
main content + secondary region       -> .sidebar-layout
fixed media + flexible content        -> .media
explicit shared 12-column placement   -> .column-layout
custom exact tracks                   -> .grid + --grid-columns
```

Do not choose `.app-layout` merely because the product is an application; it is a specific viewport shell with internal scrolling and adaptive navigation.

Prefer documented public hooks over replacement rules. Keep palette literals in the theme/token layer and derive decorative colors from semantic tokens.

Treat state-owned, derived, relay, runtime-written, or undocumented custom properties as internal unless the docs explicitly expose them.

See `references/layout-and-theming.md`.

## Forms

Prefer native input semantics first. Actual CSS enhances them; it does not replace domain validation.

- `inputmode` is a keyboard hint, not filtering.
- `data-filter` explicitly rewrites values; an empty `data-filter` does nothing.
- `data-mask` enforces shape, not domain validity.
- Do not mask telephone numbers by default. Normalize and validate authoritative phone semantics on the server.
- Native HTML validation remains the baseline; `data-enhance="validation"` adds state/focus behavior and small custom rules.
- Connect inline help/errors with `aria-describedby`; synchronize invalid state with `aria-invalid`.

See `references/forms.md`.

## Progressive enhancement

Keep four concerns separate:

```text
class          = presentation
HTML / ARIA    = semantics
data-enhance   = controller opt-in
data-*         = feature configuration or leaf opt-in
```

`data-enhance` is not a prefix for every JavaScript feature. Verify the installed enhancement vocabulary rather than inventing a token.

Leaf behaviors can be self-describing through attributes such as `data-tooltip`, `data-mask`, `data-filter`, or `data-context-menu`. Native `<dialog>` is its own semantic opt-in.

CSS must not depend on `data-enhance` or runtime transport markers.

For application-specific widgets, reuse Actual's JS primitives for lifecycle, surfaces, focus, keyboard navigation, input rewriting, and events before recreating those policies.

See `references/enhancements.md`.

## Surface ownership

A floating surface must have one lifecycle owner.

When Actual manages a surface or tooltip, application code must not compete for its Popover lifecycle or runtime positioning. Do not reparent managed surfaces to `body` as a workaround; the native top-layer transport is specifically used to preserve authored DOM context and inheritance.

Use a flyout/dialog for interactive floating content. Tooltips are supplemental, non-interactive content.

See `references/enhancements.md`.

## Accessibility

- Prefer native `button`, `a`, `details`, `dialog`, and form controls.
- Preserve visible keyboard focus.
- Name icon-only controls.
- Do not communicate state with color alone.
- Match ARIA roles with the keyboard behavior they require.
- Keep persistent or critical information out of tooltip/status-only UI.
- Consider reduced motion and forced colors for custom interactive states.

See `references/accessibility.md`.

## Project customization

This starter describes **Actual CSS itself**. A consuming application should add its local choices in `PROJECT.md`, not rewrite framework facts.

Useful project-specific additions include:

- loaded CSS families/modules;
- loaded JS enhancers;
- theme root and brand tokens;
- page-shell conventions;
- server-side component/template wrappers already available;
- application class naming rules;
- stricter browser-support requirements;
- product-specific composition conventions.

Start from `PROJECT.md.example`.

Project rules may narrow how Actual CSS is used, but must not invent or redefine Actual CSS public API.

## Task index

Use the smallest reference that answers the question:

- classes, components, imports, manifests -> `references/api-and-vocabulary.md`
- tokens, hooks, layout, custom CSS -> `references/layout-and-theming.md`
- fields, filtering, masks, validation -> `references/forms.md`
- flyouts, tooltips, dialogs, custom JS widgets -> `references/enhancements.md`
- focus, ARIA, browser/runtime assumptions -> `references/accessibility.md`
- final consumer review -> `references/review-checklist.md`

## Completion check

Before considering an Actual CSS UI change complete:

- No invented Actual class, variant, hook, enhancement token, or package export.
- Existing framework layout/component behavior was not reimplemented unnecessarily.
- Public hooks were considered before replacement CSS.
- Palette literals remain centralized in the theme/token layer unless genuinely product-specific and derived appropriately.
- Semantic HTML and ARIA do not depend on CSS class names.
- JavaScript behavior and presentation stay decoupled.
- Focus and relevant disabled/current/selected/expanded states remain accessible.
- The implementation matches the Actual CSS version actually used by the project.
