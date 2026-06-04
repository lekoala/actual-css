# Actual CSS

## Stack
Vanilla CSS, Node.js build scripts, Playwright visual regression.

## Core Architecture

**Universal variants.** Every component uses `.component intent variant size` — e.g., `.btn.primary.soft`, `.badge.primary.soft`. Never `.btn-primary`.

**Explicit foregrounds.** We set `--primary-fg` manually, not auto-computed from OKLCH. This keeps theming simple and predictable.

**CSS-only.** No consumer build step. The `dist/` files are committed for CDN usage.

**Progressive enhancement.** Modern CSS (`color-mix`, container queries) lives in `enhancements/` only. Baseline works without it.

## Code Conventions

- Components consume `--ui-*` variables from `variants.css`, then map to local `--component-*` variables. This separates variant logic from component styling.
- Use `:where()` for default values to keep specificity low. Override with explicit `.component.sm` rules.
- Never use `filter: brightness()` on transparent backgrounds (outline/ghost/link variants). Use `--hover-overlay` box-shadow for solid variants, and `--ui-hover-bg: var(--surface-subtle)` for transparent ones.

## Component Defaults

- **Buttons/badges:** Default to solid (filled background). 
- **Alerts:** Default to transparent with border. Add `.soft` for tinted background or `.solid` for filled background.
- **Avatars:** Support intent colors (`.avatar.primary`, `.avatar.success`).
- **Interactive elements:** Always implement `:hover`, `:focus-visible`, and `:disabled` states.

## Dev Workflow

Demos reference `src/` directly. No build step needed during iteration.

- `npm run dev` — watch mode for markdown → demo HTML regeneration
- `npm run build` — CI only: inlines CSS and generates `dist/` for CDN
- `npm run check` — linting (biome)
- `npm run check:css` — manual or CI: custom CSS checks (hardcoded colors, forbidden variants)
- `npm run test:visual` — milestones/PRs: Playwright visual regression

NEVER regenerate demos, update playwright or build dist files unless asked. Doing it on each request
is a waste of time.
