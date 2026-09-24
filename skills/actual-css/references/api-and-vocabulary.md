# API and vocabulary

## Source of truth

Use the installed version rather than guessing from names:

- `components.json` — component classes, hooks, states, CSS/JS imports, enhancement tokens.
- `reserved-classes.json` — whether Actual CSS owns a class name.
- `package.json#exports` — supported package entrypoints.
- CSS/JS source — exact behavior and defaults.
- docs / `llms.txt` — intended usage and framework map.

`components.json` is an index, not a replacement for component documentation or source.

## Class grammar

```text
.component [intent] [variant] [size] [modifier]
```

Typical intent/variant composition looks like:

```html
<button class="btn primary outline lg">Publish</button>
<span class="badge success soft">Online</span>
```

Do not infer API from plausible names.

Actual CSS intentionally does not provide:

- compound intent classes such as `.btn-primary`;
- Tailwind-style breakpoint/state prefixes;
- arbitrary-value utilities;
- a generic spacing scale such as `mt-4` / `p-2`;
- author-facing `is-*` state conventions;
- a generic presentation class just because an internal JS primitive has that name.

Before introducing a generic application class (`stacked`, `actions`, `flush`, `muted`, etc.), check the reserved namespace. If Actual owns the name, use its documented meaning or choose a product-specific application name.

## CSS imports

Common aggregate entrypoints:

```css
@import "actual-css";      /* minimal core */
@import "actual-css/full"; /* complete framework */

@import "actual-css/css";
@import "actual-css/css/typography";
@import "actual-css/css/layout";
@import "actual-css/css/forms";
@import "actual-css/css/forms/all";
@import "actual-css/css/components";
@import "actual-css/css/effects";
@import "actual-css/css/utilities";
```

Individual modules are available through domain paths when exported, for example:

```css
@import "actual-css/css/layout/grid";
@import "actual-css/css/components/button";
@import "actual-css/css/components/card";
```

The minimal core intentionally excludes the functional families above.

Forms have two aggregate entrypoints:

- `forms` = native-control baseline.
- `forms/all` = complete forms family.

## JavaScript imports

Import only the behavior the application intends to use, or deliberately choose the full runtime.

Examples:

```js
import "actual-css/js/flyout";
import "actual-css/js/tooltip";
import "actual-css/js/validation";
```

Do not assume `actual-css/js` means "all enhancers". Check the current exports.

## Lookup helper

```sh
node <skill>/scripts/inspect-actual-css.mjs button
node <skill>/scripts/inspect-actual-css.mjs --class flyout
node <skill>/scripts/inspect-actual-css.mjs --exports
node <skill>/scripts/inspect-actual-css.mjs --enhancements
```
