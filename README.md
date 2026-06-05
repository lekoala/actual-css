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
npm run verify
```

Open `demo/index.html` in your browser.

## Dev Loop

Use the fast loop during normal development:

```bash
npm run verify
```

Run the full gate only for milestones, CI, or when you explicitly need build and visual proof:

```bash
npm run verify:ci
```

## Discovery

Use the curated repo map before broad search:

```bash
npm run map
# 1. Read docs/PROJECT_MAP.md
# 2. Open the owning CSS file and read its local contract header
# 3. Read docs/components only when public usage details matter
# 4. Use targeted search only if the map is insufficient
```

`docs/PROJECT_MAP.md` is generated from repo conventions. Regenerate it with `npm run map` when structure changes, then step into the owning CSS file and its local contract header.

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

- `AGENTS.md` — agent operating rules for this repo
- `ARCHITECTURE.md` — contributor architecture and routing rules
- `QUALITY.md` — lean verification loop and completion policy
- `docs/PROJECT_MAP.md` — generated repo discovery map
- `docs/agent-project-guide.md` — reusable project-agnostic guide for agent-friendly engineering
- `docs/spec.md` — technical specification
- `docs/ai.md` — usage guide for AI agents
- `docs/llms.txt` — component reference
- `docs/recipes.md` — copyable product UI recipes
- `docs/components/` — per-component docs
