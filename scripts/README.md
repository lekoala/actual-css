# Scripts

Development tooling. Every script runs with `bun` and is wired to an npm
script in `package.json`; `bun run build:all` chains the full pipeline
(build, checks, tests, size report) and is what `prepublishOnly` runs.

| npm script | file | purpose |
| --- | --- | --- |
| `build:demo` / `watch:demo` | `build-demo.js` | Generate `demo/generated/` pages from the docs and `demo/templates/`. |
| `build:dist` | `build-dist.js` | Build the CSS bundles in `dist/`. |
| `build:js` | `build-js.js` | Bundle `src/js/` into `dist/actual.js` (+ sourcemap). |
| `build:size` | `build-size.js` | Write `size-report.json` (per-file, minified, brotli). |
| `check:reserved` | `check-reserved.js` | Compare compiled class names against `reserved-classes.json`. |
| `check:links` | `check-doc-links.js` | Validate doc links and `actual-css` entrypoints against `package.json#exports`. |
| `check:templates` | `check-templates.js` | Sanity-check the demo template pages. |
| `check:sync` | `check-sync.js` | Verify files that must stay in sync with each other. |
| `shot:page` | `page-shot.js` | Full-page screenshot of any page in headless Chrome. |
| `shot:forced` | `forced-colors-shot.js` | Same, with forced-colors emulation (DevTools pipeline). |

## Visual checks

`shot:page` renders a page in headless Chrome and saves a full-page PNG —
the quickest way to verify a layout or component change actually looks right,
especially for generated demo pages that compose primitives (a markup mistake
there passes every text-based check and only shows up visually).

```sh
# default page (kitchen sink) → tmp/page-shot.png
bun run shot:page

# a specific generated demo page
bun run shot:page demo/generated/patterns/structured-lists.html

# dark scheme, custom output
bun run shot:page demo/admini/login.html --scheme dark --out tmp/login-dark.png
```

`shot:forced` captures the same kind of screenshot with forced-colors
emulated through the DevTools protocol (a plain `--forced-colors` CLI flag
does not trigger it). Use it after touching focus styles, outlines, or any
`forced-colors` media query:

```sh
bun run shot:forced demo/templates/kitchen-sink.html --scheme dark
```

Both scripts look up Chrome in the standard install locations; set the
`CHROME` env variable to point at another Chromium binary. After a docs or
template change, run `bun run build:demo` first so the generated pages are
current before you screenshot them.
