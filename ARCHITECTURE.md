# Architecture

This file defines contributor routing. Use it to decide where a fix belongs before editing code.

## Class Grammar

```txt
.component intent variant size
```

Examples: `.btn.primary.soft`, `.badge.success.outline`, `.avatar.neutral`, `.alert.warning.soft`.

## Layers

1. `src/tokens.css`: public semantic tokens and default surfaces.
2. `src/themes.css` and `src/themes/*.css`: theme definitions and theme-specific token overrides.
3. `src/intents.css`: maps intent classes to shared intent variables.
4. `src/variants.css`: shared variant behavior and shared control sizing.
5. `src/layout.css`: compositional layout primitives.
6. `src/components/*.css`: component-local geometry, typography, and interaction.
7. `src/enhancements/*.css`: progressive enhancement only. Baseline behavior must work without these files.
8. `demo/` and `styles/demo.css`: showcase only. Never required for framework behavior.

## Routing Rules

- Wrong token, surface, radius, or focus color: edit `tokens.css` or the owning theme.
- Wrong intent meaning across multiple components: edit `intents.css`.
- Wrong shared variant behavior, hover treatment, or control sizing: edit `variants.css`.
- Wrong layout primitive behavior: edit `layout.css`.
- Wrong geometry or interaction for one component: edit that component file.
- Enhancement-only issue: keep the baseline in `src/` and the progressive version in `src/enhancements/`.
- Demo-only presentation issue: keep it in demo files, not framework files.

## Local Contracts

- Component-specific invariants live in the header comment of the owning CSS file.
- Keep local contracts short: contract bullets, ownership, and non-ownership only.
- Use separate docs for public usage or cross-cutting architecture, not for per-component contract duplication.

## Source Of Truth

- Keep source of truth as close as possible to the thing it governs.
- Component-specific contracts belong in the owning CSS file.
- Cross-cutting rules belong in architecture and quality docs.
- Generated maps are derived views. Do not edit them manually or treat them as primary truth.
- Avoid separate files that only restate information already present in code, docs, or conventions.

## Core Rules

### Components Consume Shared Semantic Variables

Rule:
Components consume shared semantic variables. Do not duplicate palette values in component CSS.

Reason:
Themes and intent files own color decisions. Components should describe local structure and map to shared variables. Duplicating palette values makes theme changes drift and causes inconsistent dark-mode and variant behavior.

Allowed exceptions:
- Truly component-local non-theme constants, such as geometry or internal opacity values.
- Temporary debug or demo-only styles, if clearly isolated outside framework source.

### Foreground Tokens Stay Explicit

Rule:
Keep explicit foreground tokens such as `--primary-fg`. Do not auto-compute contrast at the component layer.

Reason:
Contrast decisions belong to theme and intent design, not component behavior. Component-level contrast logic creates inconsistent results across browsers, variants, and transparent surfaces.

Allowed exceptions:
- Experimental contrast logic may live in the theme or intent layer if documented in shared docs and covered by tests.
- Components may consume computed foreground variables, but should not define the computation.

### Defaults Use Low Specificity

Rule:
Use `:where()` for defaults when practical to keep specificity low.

Reason:
Framework defaults should stay easy to override. Low specificity keeps the framework composable with local application CSS and avoids escalation into forceful selectors.

Allowed exceptions:
- State selectors and explicit modifiers may use normal specificity when that keeps the cascade clearer.
- Skip `:where()` when it makes selector behavior harder to understand.

### Avoid Forceful Or Legacy APIs

Rule:
Avoid `!important`, ID selectors, and component-specific variant APIs such as `.btn-primary`.

Reason:
The framework should remain composable and consistent. Forceful selectors are hard to override, and component-specific variant APIs duplicate the shared intent and variant system.

Allowed exceptions:
- `!important` only for documented override utilities whose purpose is explicit.
- Compatibility aliases may exist only if intentionally supported, documented, and mapped back to the shared system.

### Transparent Hover States Use Shared Variables

Rule:
Do not use `filter: brightness()` for transparent variant hover states. Use shared hover variables instead.

Reason:
`filter: brightness()` affects the full rendered element, including text and icons, and behaves poorly with transparency. Shared hover variables keep background, border, foreground, and theme behavior controllable.

Allowed exceptions:
- None in framework source unless a specific effect intentionally requires filtering and is explicitly documented.

## Component Taxonomy

- Action: `button`, `badge`. Intents required. Standard variants required. Default variant is solid.
- Feedback: `alert`. Intents required. Standard variants required. Default variant is transparent with border.
- Surface: `card`, `dialog`. No intents. Use surface modifiers only.
- Input: `forms`, `switch`. Intents only for functional validation or status.
- Navigation: `navigation`, `dropdown`, `accordion`, `join`. Intents only when they communicate active or selected state.
- Data: `data`, `divider`, `skeleton`. No decorative intents.
- Decoration: `avatar`, `indicator`, `status`, `spinner`. Optional tint only.

## Default Behaviors

- Buttons and badges default to filled backgrounds.
- Alerts default to transparent with border, then add `.soft` or `.solid` when needed.
- Interactive components implement `:hover`, `:focus-visible`, and disabled or inert states when applicable.
- Demos reference `src/` directly. Build output exists for distribution, not day-to-day development.
