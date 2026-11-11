# List

> Repeated application rows with optional leading and trailing regions.

Use `.list` when a collection repeatedly needs leading content, flexible text,
and trailing metadata or controls. Use `.media` for a single two-part
media/content relationship, `.nav-list` for navigation structure, and native
list markers when order or bullets carry meaning.

A bare `.list` is intentionally surface-less: it draws the leading and
inter-row dividers and lets a card, drawer, or page section own the background.
Add `.grouped` when the rows stand on their own.

## Grouped

`.list.grouped` paints the raised surface, border, and rounded shell, adds the
inline gutter a standalone list needs, and rounds the first and last rows so a
hover or current fill stays inside the shell. Keep the bare `.list` when an
existing surface already frames the rows.

```html demo
<ul class="list grouped" style="max-inline-size: 34rem">
  <li class="list-item">
    <i class="ti ti-device-laptop muted" aria-hidden="true"></i>
    <span class="list-item-content">
      <strong class="list-item-title">Work laptop · Firefox</strong>
      <span class="list-item-text">Brussels, BE · 12 minutes ago</span>
    </span>
    <span class="badge success">Current session</span>
  </li>
  <li class="list-item">
    <i class="ti ti-device-mobile muted" aria-hidden="true"></i>
    <span class="list-item-content">
      <strong class="list-item-title">Phone · Safari</strong>
      <span class="list-item-text">Ghent, BE · 3 hours ago</span>
    </span>
    <button class="btn surface sm"
            type="button"
            style="--btn-radius: var(--radius-full)">End session</button>
  </li>
  <li class="list-item">
    <i class="ti ti-device-tablet muted" aria-hidden="true"></i>
    <span class="list-item-content">
      <strong class="list-item-title">Tablet · Safari</strong>
      <span class="list-item-text">Antwerp, BE · yesterday</span>
    </span>
    <button class="btn surface sm"
            type="button"
            style="--btn-radius: var(--radius-full)">End session</button>
  </li>
</ul>
```

The end-session actions are `.btn surface sm` with
`--btn-radius: var(--radius-full)`: a neutral pill with the theme's muted border
and the normal text color, rather than `.outline`'s currentColor edge.

Leading and trailing content are unconstrained: avatars, native choices,
badges, text, switches, and buttons retain their own component sizing. In a
narrow row, the trailing region moves under the content rather than breaking a
word of the title; supporting text still wraps beside it, and a token longer
than the row breaks instead of widening the page. A `.truncate` line inside
`.list-item-content` gives up its width, so it ellipsizes next to the trailing
region (wrap, responsive row, overflow).

Both outer regions are optional, and an absent one costs neither space nor a
gap: `.list-item-content` always takes the row's free space and
`.list-item-trailing` always sits on the end edge, whether the row has a
leading region or not. A settings row — a label, a description, and one
control on the end edge — is the two-region form.

```html demo
<ul class="list grouped" style="max-inline-size: 34rem">
  <li class="list-item">
    <label class="list-item-content" for="row-memory">
      <span class="list-item-title">Memory</span>
      <span class="list-item-text">Remember details across conversations.</span>
    </label>
    <span class="list-item-trailing">
      <input class="switch" type="checkbox" role="switch" id="row-memory" checked>
    </span>
  </li>
  <li class="list-item">
    <label class="list-item-content list-item-title" for="row-theme">Theme</label>
    <span class="list-item-trailing">
      <select class="select sm fit" id="row-theme">
        <option>System</option>
        <option>Light</option>
        <option>Dark</option>
      </select>
    </span>
  </li>
</ul>
```

Regions center on the row. When supporting text runs to three lines or more,
add `.items-start` to the row, or to the `.list` for every row, so the leading
avatar and the trailing control stay on the title line instead of floating
mid-paragraph (top-align, align to first line).

## Row actions

Do not attach click JavaScript to the entire row. Use a link for navigation and
a button or native control for actions. Put row actions in the trailing region:
a single control, or a `.flyout-trigger` around a `⋯` button when the row has
several. The trigger stays a normal button and the menu keeps the
`.menu > li > .menu-item` anatomy; [Flyout](../enhancements/flyout.md) owns the
wiring.

```html demo
<ul class="list grouped" style="max-inline-size: 34rem">
  <li class="list-item">
    <span class="avatar sm"><abbr>NL</abbr></span>
    <span class="list-item-content">
      <strong class="list-item-title">Nadia Laurent</strong>
      <span class="list-item-text">nadia@example.com</span>
    </span>
    <div class="list-item-trailing cluster">
      <span class="badge soft primary">Owner</span>
      <div class="flyout-trigger">
        <button class="btn ghost sm"
                type="button"
                data-enhance="flyout"
                aria-expanded="false"
                aria-controls="member-actions"
                aria-label="Actions for Nadia Laurent">
          <i class="ti ti-dots" aria-hidden="true"></i>
        </button>
        <menu class="flyout sm menu" id="member-actions" hidden>
          <li><button class="menu-item" type="button">Manage access</button></li>
          <li><button class="menu-item" type="button">Copy invite link</button></li>
          <hr class="menu-separator">
          <li><button class="menu-item danger" type="button">Remove member</button></li>
        </menu>
      </div>
    </div>
  </li>
  <li class="list-item">
    <span class="avatar sm"><abbr>TR</abbr></span>
    <span class="list-item-content">
      <strong class="list-item-title">Tomás Rivera</strong>
      <span class="list-item-text">tomas@example.com</span>
    </span>
    <span class="badge">Editor</span>
  </li>
  <li class="list-item">
    <span class="avatar sm"><abbr>IO</abbr></span>
    <span class="list-item-content">
      <strong class="list-item-title">Ines Okafor</strong>
      <span class="list-item-text">ines@example.com</span>
    </span>
    <span class="badge">Viewer</span>
  </li>
</ul>
```

## Navigation

For a navigable row, keep the list semantics and put `.list-item` on the link:

```html demo
<ul class="list grouped" style="max-inline-size: 34rem">
  <li>
    <a class="list-item" href="#notifications">
      <span class="avatar sm" aria-hidden="true"><i class="ti ti-bell" aria-hidden="true"></i></span>
      <span class="list-item-content">
        <strong class="list-item-title">Notifications</strong>
        <span class="list-item-text">Email, push, and digest settings</span>
      </span>
      <i class="ti ti-chevron-right list-item-trailing" aria-hidden="true"></i>
    </a>
  </li>
</ul>
```

Mark the current row on its link with `aria-current="page"` when the row opens
a page, or `aria-current="true"` when it is the current item of a master/detail
view (a conversation, a thread, a record) that is not a page of its own. Any
other value is inert. The [Workspaces example](../examples/overview.md) shows a
current row with trailing actions and a flyout. Navigable rows usually want a
non-zero `--list-item-pad-inline`: without that gutter, the current indicator
touches the leading region and the trailing touches the row edge. `.grouped`
sets that gutter already.

## Hooks

- `--list-item-min-size` controls the row's minimum touch height.
- `--list-item-pad-block` and `--list-item-pad-inline` control row padding.
  `.grouped` raises the inline padding to a standalone surface's gutter; set
  the hook on the list to choose another.
- `--list-item-gap` controls spacing between the regions a row actually has.
- `--list-divider` controls the inter-row dividers, and the leading divider on
  a bare list. `.grouped` replaces that leading divider with its shell border.
  The final row deliberately has no trailing divider.
- `--list-radius` controls the corner radius of the `.grouped` shell.
