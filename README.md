# Actual CSS

Plain CSS component framework with semantic classes, universal variants, small tokens, strong themes, and progressive enhancements.

## Quick start

```html
<link rel="stylesheet" href="dist/actual.css">
<button class="btn primary soft">Save</button>
```

## What is included

- One official unlayered CSS build: `dist/actual.css`.
- Modular source CSS in `src/`.
- Production-MVP components: button, badge, alert, card, forms, navigation, tabs, breadcrumb, pagination, table, progress/meter, toast, accordion, skeleton, avatar, dialog, switch.
- Universal intent/variant grammar: `.btn.primary.soft`, `.badge.success.outline`, `.alert.warning`.
- Nine themes: `light`, `dark`, `dim`, `corporate`, `forest`, `ocean`, `sunset`, `lavender`, `mono`.
- Layout primitives: `.center`, `.stack`, `.cluster`, `.grid`, `.sidebar`.
- Oat-style dashboard kitchen-sink demo in `demo/index.html`.
- AI docs: `docs/AI.md`, `docs/llms.txt`, and component docs.
- CSS quality check script.
- Playwright visual regression test scaffold.

## Develop

```bash
npm install
npm run build
npm run check
npm run serve
```

Open `http://127.0.0.1:4173` after running the server.

## Visual tests

```bash
npx playwright install
npm run test:visual
```

The visual test scaffold snapshots the kitchen-sink demo at desktop and narrow viewport sizes.

## Principles

- Plain CSS, no consumer build step.
- One official unlayered CSS contract.
- Semantic classes: `.btn.primary.soft`, not `.btn-primary`.
- Small public token API.
- Explicit theming with `[data-theme]`.
- Modern CSS only as centralized progressive enhancement.
- Mobile-first baseline; container queries only enhance.


## v5 demo expansion notes

- The demo now broadly mirrors an Oat-style product dashboard: sticky navigation, theme switcher, metrics, tabs, activity feed, server status, order table, pagination, dialog, toasts, FAQ accordion, skeletons, account settings form, and theme swatches.
- Added lightweight CSS components for navigation, data display, and feedback patterns while keeping the framework JS-free. The small script in `demo/index.html` is demo-only for theme switching and native dialog opening.

## v4 correction notes

- `.btn.sm` and `.btn.lg` are explicitly defined in `components/button.css` so button sizes do not depend on import order or `:where()` specificity.
- Button hover states no longer use `filter: brightness(...)`; hover behavior is variant-aware.
- `.card-body` is a real card subpart in `components/card.css`. Container queries only enhance `.card-body.with-media` when supported.

### v6 polish notes

- Intent avatars now support `.avatar.primary`, `.avatar.success`, etc.
- Switch controls include hover, focus, checked, and disabled states.
- Tabs include visible keyboard focus styling.
- Native dialogs include a subtle open/backdrop animation with reduced-motion handling.
