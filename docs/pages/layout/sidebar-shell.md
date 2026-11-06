# Sidebar Shell

> A persistent sidebar beside the main region on a wide screen, each scrolling on its own; a drawer on a phone.

**Related terms:** admin layout, dashboard shell, persistent sidebar, side navigation, app frame.

`.sidebar-shell` takes two direct children: an `aside`, the side region, and
one other element, the main region. From `64rem`, they sit side by side at the
height of the viewport and each scrolls on its own, so the sidebar stays put
while the content scrolls. Below `64rem`, the `aside` is hidden and the
document scrolls as any page does; the page offers the same navigation in a
[drawer](../components/drawer.md).

```html demo
<div class="sidebar-shell" style="--viewport-block: 14rem; --sidebar-shell-size: 12rem">
  <aside class="stack" aria-label="Primary" style="padding: var(--space-40); border-inline-end: var(--border-width) solid var(--border)">
    <strong>Product</strong>
    <nav aria-label="Primary">
      <ul class="nav-list">
        <li><a class="nav-link" href="#overview" aria-current="page">Overview</a></li>
        <li><a class="nav-link" href="#orders">Orders</a></li>
        <li><a class="nav-link" href="#customers">Customers</a></li>
        <li><a class="nav-link" href="#settings">Settings</a></li>
      </ul>
    </nav>
  </aside>
  <main class="stack" style="padding: var(--space-40)">
    <h2>Overview</h2>
    <p>The main region scrolls; the sidebar beside it does not move.</p>
    <p>Orders, revenue and recent activity would follow here.</p>
    <p>Keep scrolling: the content is taller than the shell.</p>
    <p>The sidebar keeps its place.</p>
    <p>Each region has its own scrollbar.</p>
    <p>The page itself does not scroll.</p>
    <p>End of the content.</p>
  </main>
</div>
```

The demo sets `--viewport-block` to fit the page; an application leaves it to
the viewport. The `aside` keeps its own `display`, so `.stack` lays it out.
Put the topbar inside the main region: it then spans the content column only.

## Drawer on a phone

Keep the drawer outside the shell and open it from a button that only the
narrow layout shows. A drawer left open when the window widens past `64rem`
would sit over the sidebar it mirrors; close it from the page:

```html
<script>
  const wide = matchMedia("(width >= 64rem)");
  wide.addEventListener("change", () => {
    if (wide.matches) document.getElementById("main-drawer").close();
  });
</script>
```

[App](../../demo/templates/app.html) composes the shell, its drawer and this
script.

## Hooks

- `--sidebar-shell-size` — width of the side region.

The breakpoint is a literal `64rem`: a custom property cannot sit in a media
condition. For another breakpoint, copy the two media rules of
`sidebar-shell.css` into the application.
