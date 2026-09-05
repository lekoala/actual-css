# Surface reparenting broke inherited presentation context

Resolved. The record is kept because the defect had no generic repair, three of
the obvious ones look right and are wrong, and the transport that fixed it is
the reason the JavaScript floor sits where it does.

## What used to happen

`surface.js` moved an open surface out of its place in the document:

```text
getSurfaceRoot()   → nearest <dialog>, else body
mountSurface()     → root.append(panel)
restoreSurface()   → put it back once the exit transition ends
```

The move existed for good reasons — it escaped `overflow` clipping on any
ancestor and sidestepped `z-index` stacking. But it also took the panel out of
every scope that reached it *by inheritance*. The panel was styled by one set of
ancestors while closed, and by a different set from the moment it became
visible.

Actual leans on inheritance deliberately: theme islands, density, `.inverted`,
and the custom properties an application scopes to its own containers all
travel that way. So this was not one bug about themes. It was the same bug in as
many forms as there are inherited contexts.

## Measured

Chrome, one `.flyout` per scope, values read off the panel before and after the
click that opens it:

| Scope                     | Closed                                   | Open                 |
| ------------------------- | ---------------------------------------- | -------------------- |
| `[data-theme="dark"]`     | `background: rgb(30, 26, 35)`            | `rgb(255, 255, 255)` |
| `.sm`                     | `--control-size: 2rem`                   | `2.375rem`           |
| `.inverted`               | `--ui-fg: light-dark(hsl(0 0% 100%), …)` | *(unset)*            |
| app-scoped `--app-accent` | `rgb(1, 2, 3)`                           | *(unset)*            |
| `.sm` inside a `<dialog>` | `--control-size: 2rem`                   | `2.375rem`           |

Every context broke. Three consequences were worth stating plainly:

- The theme case was visible, not theoretical: a flyout inside a dark island
  turned light at the moment it opened.
- The density case was measurable: menu rows rendered 38px instead of the 32px
  the scope asked for.
- The dialog case showed the `getSurfaceRoot()` special case did not help. The
  panel did land inside the dialog, and still lost any scope sitting between
  that dialog and its trigger. Choosing a nearer root loses less context; it
  does not preserve it.

`tests/browser/surface-inherited-context.test.js` holds those assertions and
now passes against the shipped transport.

## Why the obvious repairs are wrong

Still wrong, and still tempting — this section is the reason the note is kept.

**Copying `data-theme` onto the moved panel.** Fixes the one symptom that was
noticed and leaves the other four broken. It also turns an inherited contract
into an enumerated one, so every future scope has to be added to a list.

**Snapshotting custom properties before the move.** There is no bounded set to
snapshot — an application's own hooks are unknowable by definition, and
`getComputedStyle` cannot enumerate inherited custom properties portably. It
would also freeze values that should stay live.

**Mounting to a nearer root.** The dialog row above is the experiment: it
reduces the damage without addressing the cause.

The cause was that the panel was moved at all. The repair is a transport that
promotes the element without relocating it.

## The repair, as shipped

A native popover renders in the top layer while staying exactly where the
author put it in the DOM. That removed the reason to reparent, and with it the
whole mechanism:

```text
mountedSurfaces
getSurfaceRoot()
mountSurface()
restoreSurface()
```

`popover="manual"` is the mode that fits: it supplies the top layer and nothing
else, so `surface.js` keeps its dismissal policy, Escape ordering, focus
restoration and placement orchestration unchanged. See
[platform-alignment](platform-alignment.md) for the responsibility split, and
[browser-support](browser-support.md) for the floor it requires.

One fragment of the old mechanism survives, and it is not reparenting: the
sheet scrim is still appended to the document root, because a runtime-created
`fixed` div cannot escape an ancestor's overflow or stacking context on its own
and the native `::backdrop` cannot absorb a pointer. The scrim has no author
identity and nothing inherited to preserve.

Adopting it behind a capability branch was rejected rather than overlooked: the
fallback path *is* the defect, so a branch would have kept the bug alive for
exactly the browsers it was written to serve. Raising the floor was the cheaper
half of the decision.

## The contract now

> A surface managed by `surface.js` is presented in its trigger's context. A
> scoped theme, density, or custom property reaches an anchored surface through
> inheritance, open or closed.

The two workarounds this note used to recommend — declaring the scope on `body`
or on the panel itself — are no longer needed and can be removed from
application code.

`tooltip.js` reached the same contract later, and for the same reason: it moved
an explicit tooltip to the dialog or the body on first hover, which is this
defect in a second component. An explicit tooltip now stays where it was
written and inherits accordingly.

A generated tooltip (`data-tooltip="text"`) is deliberately outside the
contract. Actual creates that element, so Actual places it, and it goes to
document level rather than beside the trigger — a generated sibling would take
`.join > :last-child` from a trigger that ends a group, since structural
pseudo-classes are DOM-based and `position: fixed` does not exempt an element
from them. The shorthand therefore promises no inheritance; the explicit form
is the one to use when local context matters.

## Experiment

[popover-manual-poc](popover-manual-poc.md) records what the branch measured,
what it refuted, and the checklist the migration followed. Read that before
touching the transport again — it holds the negative results, `::backdrop`
included.

## Review trigger

Revisit if a further inherited context is found to break, or if a transport
that promotes without the top layer becomes available by another route.
