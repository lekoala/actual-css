# Actual CSS

Plain CSS component framework with semantic classes, universal variants, small tokens, strong themes, and progressive enhancements.

## Quick start

```html
<link rel="stylesheet" href="dist/actual.css">
<button class="btn primary soft">Save</button>
```

## Install

```bash
npm install
npm run build
npm run check
npm run serve
```

Open `http://127.0.0.1:4173`.

## Visual tests

```bash
npx playwright install
npm run test:visual
```

## Principles

- One unlayered CSS file, no consumer build step.
- Semantic classes: `.btn.primary.soft`, not `.btn-primary`.
- Small public token API, explicit theming with `[data-theme]`.
- Modern CSS only as centralized progressive enhancement.

## Docs

- `docs/SPEC.md` — technical specification
- `docs/AI.md` — usage guide for AI agents
- `docs/llms.txt` — component reference
- `docs/components/` — per-component docs
