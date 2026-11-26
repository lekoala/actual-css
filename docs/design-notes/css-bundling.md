# CSS bundling

Why `src/tooling/css-bundle.js` is a pass-through flattener, what Bun's CSS
bundler does with the same input, and what would have to change before it can
replace the current path.

## Current path

`inlineImports()` resolves the `@import` graph and rebases relative `url()`
references; `minifyCss()` strips comments and collapses whitespace. Neither
function parses or reprints CSS. The contract is tested in
`tests/css-bundle.test.js`: `@layer`, `@scope`, nesting, `@container`,
`light-dark()`, `color-mix()`, `oklch(from …)`, and media ranges survive
verbatim.

The build uses this path for `dist/actual.full.css`, `dist/actual.full.min.css`,
the demo themes bundle, and the public `actual-css bundle` command. The same
helpers feed the size, contrast, and design-export reports.

## Why not `target: "browser"`

Bun lowers CSS against a fixed browser set when the bundle targets browsers.
Measured on the full framework with Bun 1.4.6 canary:

- `oklch()` gains hex, `display-p3`, and `lab` fallbacks;
- media ranges become `min-width`;
- `inset-inline` becomes `left`/`right`;
- nesting is flattened;
- `light-dark()` keeps its syntax in canary but was polyfilled in 1.4.5.

The minified bundle grows from 167 KB to 227 KB (24.9 KB Brotli). Actual ships
modern CSS deliberately and uses `@supports` for degradation; a fixed old
target set is not the artifact this package wants.

## `target: "bun"` is the viable alternative

`target: "bun"` has no browser target, so structural lowering is skipped. On
Bun 1.4.6 canary it bundles the full framework and preserves `oklch()`,
`light-dark()`, `color-mix()`, media ranges, `inset-inline`, and nesting.

| Input  | Current minifier | Bun `target: "bun"` |
| ------ | ---------------: | ------------------: |
| Raw    |        167,485 B |           149,729 B |
| Brotli |         23,155 B |            22,932 B |
| Gzip   |         28,074 B |            27,155 B |

The raw size falls by 11 %, but Brotli falls by under 1 %. Size is not the
reason to switch; replacing the custom flattener with a maintained bundler
would be.

## What Bun still changes

`minify: false` is not lossless. On both 1.4.5 and canary, Bun rewrites values
during parse and print:

- `blue` becomes `#00f`;
- a static `color-mix()` becomes an `oklab()` literal;
- `0px` becomes `0` (time, angle, and percentage zeros are preserved);
- the same static `color-mix()` inside a custom property is folded;
- adjacent rules are merged (1,232 blocks instead of 1,247).

`@supports` conditions and selectors are not rewritten; declarations inside the
block are. For this framework the current impact is small: every `color-mix()`
declaration uses `var()` or `currentColor`, so none is folded in the full
bundle (`color-mix(` count is 76 in both outputs). `blue` and `0px` normalize to
equivalent values, and the `light-dark()` and `oklch()` counts are unchanged.

The relevant support difference is `oklab()` versus `color-mix()`: Safari supports
`oklab()` from 15.4 and `color-mix()` from 16.2; Chrome (111) and Firefox (113)
match. Minimal starts at Safari 17, so the folded form only changes Degraded
Safari 15.4–16.1, where it widens an enhancement rather than breaking a
supported tier.

Bun also has no per-browser CSS target: `bun build --help` has no
`--css-target`, and `Bun.build({ cssTarget: "esnext" })` is accepted but
ignored. This is not a blocker for Actual because the package never lowers, but
it rules out a browser-target build.

## Parser status

Bun 1.4.5 stable cannot parse:

```css
@supports selector([aria-busy="true"]:has(> .spinner:last-child)) {
  .busy { color: red; }
}
```

The shape appears at `src/css/components/busy.css:29` and again in the compound
condition at `src/css/components/busy.css:73`. The failure is in `selector()`
with an attribute selector followed by a pseudo-class, pseudo-element, or
combinator; it is not target-specific.

Bun 1.4.6 canary parses both forms and builds `actual.full.css` under
`target: "bun"`, `"node"`, and `"browser"`. Treat this as a canary result: do not
switch until a stable release carries the parser fix.

Measurements above use Bun 1.4.5 stable (`a7733435c`) and 1.4.6 canary
(`0966e99d8`) on Windows x64, 2026-11-26.

## Decision

Keep `src/tooling/css-bundle.js`. It is deterministic, dependency-free, and
preserves the authored CSS; Bun's advantage after compression is under 1 %
Brotli, while it drops the pass-through contract and still lacks a CSS target.

Revisit when all of these hold:

1. A stable Bun release parses the full framework.
2. A `target: "bun"` build passes the browser suite and the visual checks.
3. The CLI's layer-import and `url()` rebasing behavior is either covered by
   Bun or accepted as a regression.
4. The pass-through tests are updated deliberately, not deleted to make the
   switch pass.

Measure with `bunx bun@canary` and
`Bun.build({ target: "bun", minify: true, write: false })`; keep `write: false`
so the comparison does not touch `dist/`.
