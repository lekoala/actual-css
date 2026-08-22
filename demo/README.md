# Demo

Hand-authored example sources:

- `styles/` for demo-only CSS.
- `templates/` for standalone static HTML examples (kitchen sink, keyboard
  controls, surface contracts, dashboard, app, marketing, blog, blocks, density).
- `sites/` for multi-page sites built on Actual CSS:
  - `admini/` — a recreation of the [admini](https://github.com/lekoala/admini) Bootstrap 5 admin template - dashboard, tables, forms, settings, login, and 404. Each page is self-contained (no shared-layout mechanism yet); the sidebar/topbar block is identical across pages and delimited with `<!-- admini-shell:. -->` comments so it can be extracted behind htmx/Turbo/etc. later.
- `preview.svg` for the demo preview image.

These examples are featured on the documentation site
(`site/examples/overview.html`), which is the entry point to the project.
`index.html` redirects there.
