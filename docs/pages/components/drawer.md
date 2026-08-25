# Drawer

> Modal side-sheet that overlays the page for navigation or filters.

**Related terms:** off-canvas, side panel, side sheet, navigation drawer.

## Class reference

| Class           | Kind      | Description                                                |
|-----------------|-----------|------------------------------------------------------------|
| `.drawer`       | Component | Modal side-sheet built on the native `<dialog>` element.   |
| `.drawer-close` | Component | Icon-only close button that sits inside the drawer header. |

## Usage

- Use `dialog.drawer` for modal side-sheets that overlay the page.
- Use `command="show-modal"` and `commandfor="<id>"` to open the drawer without JavaScript.
- Use `form method="dialog"` for close buttons inside the drawer.
- Use `data-dialog-dismissible` when backdrop click should close the drawer. It
  only gates backdrop click: Escape and the close button always close.
- Use `closedby="none"` when the drawer must not be dismissed by the user at all
  (e.g. a form with unsaved changes): no backdrop close and no Escape close.
- Use `[data-side="end"]` for a right-side drawer.
- Permanent desktop sidebars belong in layout, not here.

```html demo
<button class="btn ghost"
        type="button"
        command="show-modal"
        commandfor="main-drawer"
        aria-haspopup="dialog"
        aria-controls="main-drawer"
        aria-label="Open navigation">
  <i class="ti ti-menu-2" aria-hidden="true"></i>
</button>

<dialog class="drawer"
        id="main-drawer"
        aria-label="Main navigation"
        closedby="any"
        data-dialog-dismissible>
  <header>
    <strong>Menu</strong>

    <form method="dialog">
      <button class="drawer-close" type="submit" aria-label="Close navigation"></button>
    </form>
  </header>

  <nav>
    <ul class="nav-list stack">
      <li><a href="#" aria-current="page">Home</a></li>
      <li><a href="#">Users</a></li>
      <li><a href="#">Settings</a></li>
      <li><a href="#">Logout</a></li>
    </ul>
  </nav>
</dialog>
```

## Non-dismissible drawer

For drawers with unsaved settings or critical actions, use `closedby="none"` so
the user cannot dismiss the drawer by accident: backdrop click shows a static
indicator instead of closing, and Escape does nothing. Only the explicit footer
actions and the close button can close the drawer.

```html demo
<button class="btn"
        type="button"
        command="show-modal"
        commandfor="settings-drawer"
        aria-haspopup="dialog"
        aria-controls="settings-drawer">
  Edit settings
</button>

<dialog class="drawer"
        id="settings-drawer"
        aria-label="Settings"
        data-side="end"
        closedby="none">
  <form method="dialog">
    <header>
      <strong>Settings</strong>
      <button class="drawer-close" type="submit" aria-label="Close settings"></button>
    </header>

    <div class="stack">
      <p>Unsaved changes will be lost if you close without saving.</p>
    </div>

    <footer class="cluster" style="--cluster-justify: end">
      <button class="btn" value="save">Save</button>
    </footer>
  </form>
</dialog>
```

Backdrop click dismissal and Escape come from the native dialog element and
follow its `closedby` value. Add `data-dialog-dismissible` when you want the
optional runtime to take over backdrop click and close with the drawer's
transition; the runtime rewrites `closedby="any"` to `closedby="closerequest"`
so the two never double-handle. Without `data-dialog-dismissible`, a native
`closedby="any"` dialog keeps its own light dismiss, and dialogs without
light dismiss briefly flash instead of closing when the backdrop is clicked —
useful for drawers that should not be dismissed accidentally.

## CSS hooks

- `--drawer-size` — panel width.
- `--drawer-pad` — panel padding.
- `--control-size` — size of the `.drawer-close` button. The drawer header
  reserves `calc(var(--control-size) + var(--space-30))` on its inline end so
  the title never runs under the close.
