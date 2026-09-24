# Consumer review checklist

## Vocabulary and imports

- Every framework-looking class exists in the installed Actual CSS version.
- Intent/variant composition is used instead of invented compound names.
- Runtime `is-*` state is not authored as application API.
- The project imports the family/module that owns the markup it uses.
- `forms` vs `forms/all` is intentional.
- JS imports match the behavior actually enabled.

## CSS ownership

- Application CSS is not recreating an existing layout/component/focus behavior unnecessarily.
- Public hooks were considered before replacement CSS.
- Palette values remain centralized in theme/token definitions.
- `--gap` is only rebound when inherited rhythm should change.
- Component-scoped hooks are not read elsewhere without an intentional fallback.

## Layout

- Primitive choice follows child relationships, not a single mockup's item count.
- `.app-layout` is used only for its actual shell contract.
- Exact track needs use the appropriate grid hook before a new generic primitive is invented.

## Forms

- `inputmode` is not treated as validation/filtering.
- `data-filter` is used only when destructive rewriting is intended.
- Masks are not mistaken for semantic validity.
- Server/application validation remains authoritative for domain rules.
- Help/errors and invalid state are connected accessibly.

## Enhancements

- Presentation, semantics, behavior opt-in, and configuration remain separate.
- Enhancement tokens and feature attributes are documented by the installed version.
- Application code does not fight Actual for Popover or positioning ownership.
- Interactive floating content is not placed in a tooltip.

## Accessibility

- Keyboard focus remains visible.
- Icon-only controls are named.
- Disabled/current/selected/expanded semantics match visible state.
- Keyboard behavior matches claimed ARIA roles.
- Custom states consider forced colors and reduced motion where relevant.

## Version safety

When uncertain, inspect the installed manifests, package exports, source, and docs instead of extrapolating from this starter skill.
