# Actual CSS

Plain CSS component framework with semantic classes, universal variants, small tokens, strong themes, and progressive enhancements.

## Quick start

```html
<link rel="stylesheet" href="dist/actual.css">
<button class="btn primary soft">Save</button>
```

Optional named themes, including themes that override shape tokens, ship as separate files:

```html
<link rel="stylesheet" href="dist/actual.css">
<link rel="stylesheet" href="dist/themes/dark.css">
<html data-theme="dark">
```

## Install

```bash
npm install
npm run build
npm run check
```

Open `demo/index.html` in your browser.

## Visual tests

```bash
npx playwright install
npm run test:visual
```

## Principles

- One unlayered base CSS file, no consumer build step.
- Semantic classes: `.btn.primary.soft`, not `.btn-primary`.
- Small public token API, opt-in explicit themes with `[data-theme]`.
- Modern CSS only as centralized progressive enhancement.

## Docs

- `docs/spec.md` — technical specification
- `docs/ai.md` — usage guide for AI agents
- `docs/llms.txt` — component reference
- `docs/recipes.md` — copyable product UI recipes
- `docs/components/` — per-component docs
