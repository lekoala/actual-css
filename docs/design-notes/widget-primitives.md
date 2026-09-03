# Widget primitives

The JS runtime doubles as a primitive kit for building custom widgets.

## Primitives

| Need                               | Primitive     | Import                      |
| ---------------------------------- | ------------- | --------------------------- |
| Discovery, lifecycle, cleanup      | `enhance`     | `actual-css/js/enhance`     |
| Per-document LIFO Escape dismissal | `escape`      | `actual-css/js/escape`      |
| Positioning, flip and shift        | `floating`    | `@lekoala/floating`         |
| Open/close, sheet, backdrop, focus | `surface`     | `actual-css/js/surface`     |
| Directional item lookup            | `keys`        | `actual-css/js/keys`        |
| Menu-item vocabulary               | `menu`        | `actual-css/js/menu`        |
| Focusable lookup, visibility       | `focus`       | `actual-css/js/focus`       |
| One remembered tab stop            | `focus-group` | `actual-css/js/focus-group` |
| Caret-safe value rewriting         | `input`       | `actual-css/js/input`       |
| Character policies                 | `filter`      | `actual-css/js/filter`      |
| Event namespace                    | `events`      | `actual-css/js/events`      |
| Declarative triggers               | `command`     | `actual-css/js/command`     |
| State classes the runtime writes   | `selectors`   | `actual-css/js/selectors`   |

The named exports each module carries:

- `enhance` — `enhance`, `registerEnhancement`
- `escape` — `registerEscapeDismissal`
- `floating` — `autoUpdate`, `reposition`, `repositionAt`, plus
  `--available-height` and `data-placement`
- `keys` — `itemForKey`, `firstItem`, `lastItem`, `nextItem`, with edge,
  wrapping and RTL handling
- `focus-group` — `connectFocusGroup`
- `input` — `onTextInput`, `setCaret`, `dispatchInput`
- `events` — `EVENTS`, `ACTUAL_EVENT_PREFIX`
- `command` — `registerCommands`
- `selectors` — `CLASSES`

`surface` also owns outside-click and Escape dismissal, and focus restore.
`menu` filters to usable items.

## Focus group

`connectFocusGroup(root, options)` gives a composite one remembered tab stop and
Arrow/Home/End navigation. The consumer supplies `getItems()` because candidate
discovery and disabled semantics belong to the widget, not to the controller.
The controller updates only `tabindex` and focus; it does not activate controls
or write ARIA and application state.

```js
import { connectFocusGroup } from "actual-css/js/focus-group";

const focusGroup = connectFocusGroup(toolbar, {
  getItems: () => toolbar.querySelectorAll(":scope > button:not(:disabled)"),
  orientation: "horizontal",
  wrap: false,
  signal,
});

// Call this after changing which controls belong to the group.
focusGroup.sync();
```

Candidates are re-read when focus or keyboard input occurs. A consumer that
changes the candidate list calls `focusGroup.sync()` explicitly; the primitive
does not observe the subtree. A plain `sync()` preserves the remembered item
when possible; `sync(item)` explicitly makes an item the group's tab stop.
Horizontal navigation follows the root's effective text direction.
`focusGroup.disconnect()` removes its listeners and restores authored
`tabindex` values. This is a JavaScript responsibility primitive, not a
`focusgroup` attribute or enhancement token.

`menu` consumes this primitive only for `[role="menu"]`. Plain `.menu` action
lists retain normal tab stops and use the menu layer's lighter directional
focus behavior.

## Compositions

### Custom select — A. Owns its popup

```
enhance
floating
keys
```

Full control. Everything re-implemented. Use when the widget must own dismissal (e.g.
an inline autocomplete that should survive an outside click).

### Custom select — B. Reuses the surface lifecycle

```
enhance
surface   (Escape, outside click, focus restore, sheet mode)
floating
keys
```

Less code. Inherits the runtime's dismissal semantics and mobile sheet. Use for
anything that behaves like a popup.

> A `[role="listbox"]` surface with `[role="option"]` children gets no key handling and
> no click-autoclose from `surface.js` — that is the extension seam. `[role="option"]`
> is deliberately not in the menu-item vocabulary.

### Tags input

```
enhance + input + keys + filter (optional character policy)
```

No floating, no surface.

### Date picker

```
enhance + surface + floating + keys + events
```

A calendar popup wants Escape/outside-click/sheet. `actual:surface-open` to veto or
decorate.

## What "no Actual class" actually promises

> No Actual presentation or component class is required in authored markup for behavior to
> work. Runtime state classes are still written by the primitives, and remapping them is
> what `selectors.js` is for.

Concretely: no `.flyout`, `.tabs`, `.field`, `.btn`, `.needs-validation`, `.status-bar`
anywhere in the author's HTML — while `.is-open` may appear in the author's *CSS*, as a
state to style or ignore.

## Honest gaps

- No typeahead helper — filter, debounce, render are author concerns.
- No `aria-activedescendant` helper — the author manages the composite-widget pattern.
- No virtual-list support.
- No `<select>` replacement in core — the deliverable is the *surface*, not the widget.
  `<select data-enhance="select">` is the intended shape for an external package.
