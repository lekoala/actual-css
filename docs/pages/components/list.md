# List

> Repeated application rows with optional leading and trailing regions.

Use `.list` when a collection repeatedly needs leading content, flexible text,
and trailing metadata or controls. Use `.media` for a single two-part
media/content relationship, `.nav-list` for navigation structure, and native
list markers when order or bullets carry meaning.

```html demo
<ul class="list">
  <li class="list-item">
    <span class="avatar sm"><abbr>AM</abbr></span>
    <span class="list-item-content">
      <strong class="list-item-title">Ada Morgan</strong>
      <span class="list-item-text">Design systems · Brussels</span>
    </span>
    <span class="badge success">Online</span>
  </li>
  <li class="list-item">
    <input class="check" type="checkbox" aria-label="Select quarterly review">
    <span class="list-item-content">
      <strong class="list-item-title">Quarterly review</strong>
      <span class="list-item-text">Due tomorrow</span>
    </span>
    <time class="list-item-trailing" datetime="09:30">09:30</time>
  </li>
</ul>
```

Leading and trailing content are unconstrained: avatars, native choices,
badges, text, switches, and buttons retain their own component sizing.
`.list-item-content` has no minimum content floor, so supporting text and long
tokens wrap instead of widening the page.

Both outer regions are optional, and an absent one costs neither space nor a
gap: `.list-item-content` always takes the row's free space and
`.list-item-trailing` always sits on the end edge, whether the row has a
leading region or not. A settings row — a label, a description, and one
control on the end edge — is the two-region form.

Regions center on the row. When supporting text runs to three lines or more,
add `.items-start` to the row, or to the `.list` for every row, so the leading
avatar and the trailing control stay on the title line instead of floating
mid-paragraph (top-align, align to first line).

```html demo
<ul class="list">
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

For a navigable row, keep the list semantics and put `.list-item` on the link:

```html demo
<ul class="list">
  <li>
    <a class="list-item" href="#profile">
      <span class="avatar sm" aria-hidden="true"><i class="ti ti-user" aria-hidden="true"></i></span>
      <span class="list-item-content">
        <strong class="list-item-title">Profile</strong>
        <span class="list-item-text">Name, photo, and contact details</span>
      </span>
      <i class="ti ti-chevron-right list-item-trailing" aria-hidden="true"></i>
    </a>
  </li>
</ul>
```

Do not attach click JavaScript to the entire row. Use a link for navigation and
a button or native control for actions.

In a master/detail navigation, mark the current row with `aria-current` on its
link, using the value that matches the semantics (`page`, `location`, …).
`aria-current="false"` or an empty value leaves a row inactive. The [Workspaces example](../examples/overview.md)
shows a current row with trailing actions and a flyout. Navigable rows usually
want a non-zero `--list-item-pad-inline`: without that gutter, the current
indicator touches the leading region and the trailing touches the row edge.

### Hooks

- `--list-item-min-size` controls the row's minimum touch height.
- `--list-item-pad-block` and `--list-item-pad-inline` control row padding.
- `--list-item-gap` controls spacing between the regions a row actually has.
- `--list-divider` controls the leading and inter-row dividers. The final row
  deliberately has no trailing divider.
