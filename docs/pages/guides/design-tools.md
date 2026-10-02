# Design tools (Figma, Penpot)

`actual-css design` exports a theme to design tools: its tokens for Figma and Penpot, and a Penpot plugin that builds Button, Input, Badge, Alert and Card bound to those tokens. Use it to hand designers the same palette, scale and components the code ships — a design kit, a UI kit, a Figma or Penpot library generated from your theme.

```sh
bunx --bun actual-css design --theme src/theme.css --out design/
```

`--theme` is a file declaring one `[data-theme="…"]` block (see [Theming](../foundations/theming.md)); without it the default theme is exported. The command needs Bun, and `--bun` makes `bunx` run it under Bun instead of the CLI's Node shebang: it reads the theme in headless Chrome, so every `light-dark()`, `color-mix()` and `var()` chain resolves exactly as the browser paints it.

## What is exported

| File                                          | Content                              |
| --------------------------------------------- | ------------------------------------ |
| `figma/foundations.tokens.json`               | spacing, radius, borders, type sizes |
| `figma/light.tokens.json`, `dark.tokens.json` | colors, one file per scheme          |
| `penpot/tokens.json`                          | all tokens, as sets and themes       |
| `penpot/plugin/`                              | the plugin and component spec        |

Token names are the CSS names without `--`: `surface-raised` in the design tool is `var(--surface-raised)` in code. A scheme exists when the theme declares it: `color-scheme: light dark` exports both, anything else one. Lengths are exported in px, with the CSS value kept in `$extensions["actual-css"]`.

Colors no theme token paints — the soft fills and borders of `.soft` — are exported as recipe tokens named `<variant>-<intent>-<role>` (`soft-danger-bg`, `soft-danger-border`, `soft-danger-fg`), next to the theme colors so they switch with the scheme. Font stacks, line heights, shadows, motion and z-index have no design-tool equivalent and are not exported.

## Figma

Import each file from the Variables panel. Figma makes one collection per file: import `light`, then add `dark` to that collection as a second mode (a paid-plan feature; the free plan allows one mode per collection).

## Penpot

1. Tokens tab → Tools → Import `penpot/tokens.json`. It replaces the file's tokens.
2. Serve `penpot/plugin/` over http with CORS, and add its `manifest.json` URL in the plugin manager (`Ctrl + Alt + P`).
3. Run **Build components**.

The components are built on their own page, "Actual CSS components"; drag instances from Assets onto any page. Each is a variant set whose properties are the classes an author stacks — `Intent`, `Variant` and `Size` on Button and Badge, `Intent` and `Variant` on Alert, `Size` on Input — defaulting to the bare class (`.btn`, `.badge`). Fills, borders and text colors are bound to tokens, so switching the Penpot theme between Light and Dark repaints every variant. Radius, padding, height and type are the measured values: run the export again after changing them in the theme.

The components are measured, not modelled: the browser renders the classes and the plugin replays the result, so a theme's own radius or padding shows up without configuration. States (hover, focus, disabled) stay a code concern.
