# Widget primitives

The JS runtime doubles as a primitive kit for building custom widgets. This page
inventories what is available and how to compose them. It is written **before** the
code moves so the outcome is a target, not a rationalization.

## Primitives

| Need | Primitive | State after 0.2 |
|------|-----------|-----------------|
| Opt-in discovery + lifecycle + cleanup | `enhance`, `registerEnhancement` | Track A Step 2 |
| Positioning, flip/shift, `--available-height`, `data-placement` | `floating` (`track`, `reposition`, `repositionAt`) | Already class-free, no change |
| Open/close, sheet on mobile, backdrop, outside-click, Escape, focus restore | `surface` | Contract documented (A/5b) + exported (D12) |
| Roving focus over a list | `keys` (`firstItem`, `lastItem`, `nextItem`) | Exported (D12) |
| Menu-item vocabulary, usable-item filtering | `menu` | Declassed (D11) + exported |
| Focusable lookup, visibility | `focus` | Exported |
| Caret-safe value rewriting | `input` (`onTextInput`, `setCaret`, `dispatchInput`) | Already exported |
| Character policies | `filter` | Already exported |
| Event namespace | `events` (`EVENTS`, `ACTUAL_EVENT_PREFIX`) | Exported |
| Declarative triggers | `command` (`registerCommands`) | Already exported |
| State classes the runtime writes | `selectors` (`CLASSES`) | Rescoped in A/Step 4 |

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
