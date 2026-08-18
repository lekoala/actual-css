# Topbar

Sticky, frosted top bar shell for app/dashboard layouts with a persistent sidebar.

> **Optional** — import `actual-css/css/optional/layout-extra` or `actual-css/css/optional/index`.

Use `.topbar` for the structural shell of an app-shell header: sticky positioning, stacking, and a frosted background. Row content — search, breadcrumb, actions — stays local to the page.

```html demo
<header class="topbar">
  <button class="btn neutral ghost" type="button" aria-label="Open navigation">
    <i class="ti ti-menu-2" aria-hidden="true"></i>
  </button>
  <ol class="breadcrumb" aria-label="Breadcrumb">
    <li><a href="#">Overview</a></li>
    <li aria-current="page">Accounts</li>
  </ol>
  <div class="grow"></div>
  <span class="avatar sm"><abbr>LW</abbr></span>
</header>
```

This is for the app-shell topbar specifically — a structural need that recurs unchanged across app UIs regardless of brand. It is not for marketing or editorial site headers, which are one-off visual identity per page.