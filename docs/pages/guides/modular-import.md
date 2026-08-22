# Modular imports

Actual CSS ships one minimal core (`actual-css`) and one all-in entrypoint (`actual-css/full`). Projects can also compose the framework from family manifests or individual modules.

## Entrypoints

```css
@import "actual-css";        /* minimal core */
@import "actual-css/full";   /* complete framework */
```

`actual-css` contains the shared baseline: reset, tokens, theme, document defaults, intents, universal variants, focus, and print.

It contains no typography, layout, forms, components, effects, or utilities.

`actual-css/full` starts from the core and adds every family in cascade order:

```text
core → typography → layout → forms → components → effects → utilities
```

### Focus is a core invariant

The core provides a visible `:focus` outline as the compatibility baseline. Modern browsers limit it to `:focus-visible`, hiding the pointer-focus outline.

Components may enhance or replace that treatment in interactive states, but their base styles must not cancel the shared fallback.

When an interactive state replaces the outline, it must preserve a visible focus indicator in forced-colors, either with an outline-based fallback or by keeping the replacement out of forced-colors.

## Family manifests

| Family           | Import                      | Contents                                                                                                                        |
| ---------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Core             | `actual-css/css`            | reset, tokens, theme, base, intents, variants, focus, print                                                                     |
| Typography       | `actual-css/css/typography` | prose, overline, fluid                                                                                                          |
| Layout           | `actual-css/css/layout`     | stack, cluster, center, frame, media, switcher, sidebar-layout, grid, scroller, scroll-snap, topbar, container-query, app-shell |
| Forms            | `actual-css/css/forms`      | native control baseline                                                                                                         |
| Forms (complete) | `actual-css/css/forms/all`  | base plus input-icon, switch, range, choice-card, custom-select, floating-field, otp                                            |
| Components       | `actual-css/css/components` | buttons, surfaces, overlays, feedback, navigation, data and composed controls                                                   |
| Effects          | `actual-css/css/effects`    | aura                                                                                                                            |
| Utilities        | `actual-css/css/utilities`  | base and extra utilities                                                                                                        |

Individual modules can be imported through their domain path:

```css
@import "actual-css/css/forms/otp";
@import "actual-css/css/components/chat";
@import "actual-css/css/effects/aura";
@import "actual-css/css/layout/scroller";
@import "actual-css/css/typography/fluid";
@import "actual-css/css/utilities/extra";
```

## Use your existing CSS pipeline

Actual CSS is plain CSS and does not require its own build tool.

If a project already uses Vite, PostCSS, Webpack, Parcel, Lightning CSS, or another CSS pipeline, keep using it and import the Actual CSS package exports directly.

For example:

```css
@import "actual-css/css";
@import "actual-css/css/layout";
@import "actual-css/css/forms/all";
@import "actual-css/css/components/button";
@import "actual-css/css/components/card";

@import "./theme.css";
@import "./app.css";
```

The consuming pipeline remains responsible for features such as asset handling, URL rebasing, source maps, CSS Modules, import modifiers, transpilation, and browser targeting.

Actual CSS intentionally does not require a particular bundler or transpiler.

## Optional CLI bundler

For projects without a CSS pipeline, Actual CSS includes a small zero-dependency import flattener:

```sh
npx actual-css bundle src/app.css --out public/app.css
```

or:

```sh
bunx actual-css bundle src/app.css --out public/app.css
```

Add `--minify` for lightweight whitespace/comment minification:

```sh
npx actual-css bundle src/app.css --out public/app.css --minify
```

The CLI resolves and inlines:

```css
@import "./local.css";
@import "actual-css/css/layout";
@import "actual-css/css/components/card";
```

It deliberately does **not** transpile CSS. Modern syntax such as nesting, `@container`, `@scope`, `:has()`, `color-mix()`, `light-dark()`, and media-query range syntax is preserved for the browser.

The CLI is a simple flattener, not a general-purpose CSS build pipeline.

### Limitations

Local and package imports may be plain imports, or carry a layer modifier:

```css
@import "./local.css";
@import "./local.css" layer(components);
@import "./local.css" layer;
```

A layered import is flattened into the block it stands for, so `@import "actual-css/css" layer(actual)` becomes `@layer actual { … }`. A layer declared inside the imported file becomes a sublayer of that wrapper, exactly as the import did.

Conditional modifiers are not flattened:

```css
@import "./local.css" supports(display: grid);
@import "./local.css" screen;
@import "./local.css" layer(components) supports(display: grid);
```

Use an existing CSS pipeline when these features are required.

One further case is refused rather than guessed: a remote import inside a layered subtree, because hoisting it before ordinary rules would move it out of its layer.

The CLI also does not process or rebase asset URLs such as:

```css
background-image: url("../images/card.svg");
```

Those paths remain exactly as written, so projects with relative assets should generally let their existing build pipeline handle CSS imports.

Remote and absolute imports are preserved rather than fetched and are moved before ordinary rules so they remain valid CSS.

## Cascade layers

Actual CSS can participate in a project-owned cascade layer:

```css
@layer actual;

@import "actual-css/full" layer(actual);
```

Or, when composing families:

```css
@layer actual;

@import "actual-css/css" layer(actual);
@import "actual-css/css/typography" layer(actual);
@import "actual-css/css/layout" layer(actual);
@import "actual-css/css/forms/all" layer(actual);
@import "actual-css/css/components" layer(actual);
```

`actual-css/css/layer` also exposes the minimal core wrapped in `@layer actual`.

All of these recipes flatten with `actual-css bundle`: the CLI understands layer modifiers, so a public entrypoint of the framework is never something its own bundler has to refuse.

## Custom properties

Component-prefixed custom properties documented on component pages are author hooks.

Color and sizing otherwise stay within the shared intent, variant, control, and button APIs.
