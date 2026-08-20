# Scripts

Development tooling. Every script runs with `bun` and is wired to an npm
script in `package.json`; `bun run build:all` chains the full pipeline
(build, checks, tests, size report) and is what `prepublishOnly` runs.

| npm script | file | purpose |
| --- | --- | --- |
| `build:docs` / `watch:docs` | `build-docs.js` | Build the static documentation site in `site/` from `docs/pages/` + `docs/navigation.json`. Requires `dist/` (runs `build:dist` + `build:js` first in `build:all`). |
| `build:dist` | `build-dist.js` | Build the CSS bundles in `dist/`. |
| `build:js` | `build-js.js` | Bundle `src/js/` into `dist/actual.js` (loader only) and `dist/actual.full.js` (full runtime); no sourcemap; byte-deterministic across rebuilds. |
| `build:size` | `build-size.js` | Write `size-report.json` (per-file, minified, brotli). |
| `check:docs` | `check-docs.js` | Structural checks for the docs site: page/IA consistency, fence contract, internal links + anchors, and that referenced `src/css` / `src/js` files exist. |
| `check:compat` | `check-compat.js` | Capability floor audit: flags unguarded above-Minimal structural CSS. |
| `check:reserved` | `check-reserved.js` | Compare compiled class names against `reserved-classes.json`. |
| `check:links` | `check-doc-links.js` | Validate doc links and `actual-css` entrypoints against `package.json#exports`. |
| `check:templates` | `check-templates.js` | Sanity-check the demo template pages. |
| `check:sync` | `check-sync.js` | Verify files that must stay in sync with each other. |
| `shot:page` | `page-shot.js` | Full-page screenshot of any page in headless Chrome. |
| `shot:forced` | `forced-colors-shot.js` | Same, with forced-colors emulation (DevTools pipeline). |
| `probe` | `probe.js` | Run a JS program inside a headless-Chrome page and print its return value as JSON. |

## Visual checks

`shot:page` renders a page in headless Chrome and saves a full-page PNG —
the quickest way to verify a layout or component change actually looks right,
especially for generated pages that compose primitives (a markup mistake there
passes every text-based check and only shows up visually).

```sh
# default page (kitchen sink) → tmp/page-shot.png
bun run shot:page

# a docs page
bun run shot:page site/components/button.html

# dark scheme, custom output
bun run shot:page site/index.html --scheme dark --out tmp/home-dark.png
```

`shot:forced` captures the same kind of screenshot with forced-colors
emulated through the DevTools protocol (a plain `--forced-colors` CLI flag
does not trigger it). Use it after touching focus styles, outlines, or any
`forced-colors` media query:

```sh
bun run shot:forced demo/templates/kitchen-sink.html --scheme dark
```

Both scripts share their browser plumbing in `utils/browser.js` (`capture()`
with media emulation and a `beforeShot` hook), so a new screenshot script only
describes its emulation and output. Browser work runs on Bun.WebView with the
Chrome backend: Bun locates Chrome/Chromium/Edge automatically (override with
the `BUN_CHROME_PATH` env variable or `backend.path`). After a docs or template
change, run the relevant build first so the generated pages are current before
you screenshot them.

Real-browser tests are authoritative on the Linux CI runner. They run locally
whenever a Chrome-family binary is available (Bun auto-detects it), and skip
gracefully otherwise, so the remaining test suite still runs by default.

```sh
bun test tests/browser
```

`probe` is the "measure without looking" counterpart: it runs a program in the
page and prints the return value as JSON, which is handy for assertions that
only need numbers (a rect, a computed style, a class list). The program runs
as the body of an async function, so it can click and `await sleep(...)` before
`return`-ing its result.

```sh
# open the search dialog, wait for it to settle, return the close button rect
bun run probe site/index.html --expr "document.querySelector('[data-docs-search]').click(); await sleep(400); return document.getElementById('docs-search-dialog').querySelector('.dialog-close').getBoundingClientRect();"

# or keep the program in tmp/ when it gets long
bun run probe --url site/index.html --script tmp/search-probe.js
```
