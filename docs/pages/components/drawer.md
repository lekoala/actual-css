# Drawer

> Modal side-sheet that overlays the page for navigation or filters.

## Class reference

| Class | Kind | Description |
|---|---|---|
| `.drawer` | Component | Modal side-sheet built on the native `<dialog>` element. |
| `.dialog-close` | Component | Icon-only close button for the drawer header (shared with Dialog). |

## Usage

- Use `dialog.drawer` for modal side-sheets that overlay the page.
- Use `command="show-modal"` and `commandfor="<id>"` to open the drawer without JavaScript.
- Use `form method="dialog"` for close buttons inside the drawer.
- Use `data-dialog-dismissible` and `closedby="any"` when backdrop click should close the drawer.
- Omit those attributes when the drawer requires an explicit action (e.g. a form with unsaved changes).
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
      <button class="dialog-close" type="submit" aria-label="Close navigation"></button>
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

For drawers with unsaved settings or critical actions, omit the dismiss
attributes. Backdrop click shows a static indicator instead of closing. Escape
key still works natively.

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
        data-side="end">
  <form method="dialog">
    <header>
      <strong>Settings</strong>
      <button class="dialog-close" type="submit" aria-label="Close settings"></button>
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

Backdrop click dismissal and Escape are provided by the native dialog element
when `closedby="any"` is set. Add `data-dialog-dismissible` when you want the
optional runtime to wire the same behavior. When both are omitted, clicking the
backdrop briefly flashes the drawer instead of closing it — useful for drawers
that should not be dismissed accidentally.

## CSS hooks

- `--drawer-size` — panel width.
- `--drawer-pad` — panel padding.
