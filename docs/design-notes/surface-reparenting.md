# Surface reparenting breaks inherited presentation context

Known defect, present on the current Minimal floor. Tracked separately from
Popover adoption on purpose: Popover is the likely cure, but the defect exists
now and needs to be understood on its own terms.

## What happens

`surface.js` moves an open surface out of its place in the document:

```text
getSurfaceRoot()   → nearest <dialog>, else body
mountSurface()     → root.append(panel)
restoreSurface()   → put it back once the exit transition ends
```

The move exists for good reasons — it escapes `overflow` clipping on any
ancestor and sidesteps `z-index` stacking. But it also takes the panel out of
every scope that reached it *by inheritance*. The panel is styled by one set of
ancestors while it is closed, and by a different set from the moment it becomes
visible.

Actual leans on inheritance deliberately: theme islands, density, `.inverted`,
and the custom properties an application scopes to its own containers all
travel that way. So this is not one bug about themes. It is the same bug in as
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

Every context breaks. Three consequences are worth stating plainly:

- The theme case is visible, not theoretical: a flyout inside a dark island
  turns light at the moment it opens.
- The density case is measurable: menu rows render 38px instead of the 32px the
  scope asked for.
- The dialog case shows the `getSurfaceRoot()` special case does not help. The
  panel does land inside the dialog, and still loses any scope sitting between
  that dialog and its trigger. Choosing a nearer root loses less context; it
  does not preserve it.

Locked by `tests/browser/surface-inherited-context.test.js`, whose assertions
describe the contract Actual owes and are marked `test.failing` until the
transport stops reparenting.

## Why the obvious repairs are wrong

**Copying `data-theme` onto the moved panel.** Fixes the one symptom that was
noticed and leaves the other four broken. It also turns an inherited contract
into an enumerated one, so every future scope has to be added to a list.

**Snapshotting custom properties before the move.** There is no bounded set to
snapshot — an application's own hooks are unknowable by definition, and
`getComputedStyle` cannot enumerate inherited custom properties portably. It
would also freeze values that should stay live.

**Mounting to a nearer root.** The dialog row above is the experiment: it
reduces the damage without addressing the cause.

The cause is that the panel is moved at all. The repair is a transport that
promotes the element without relocating it.

## The actual repair

A native popover renders in the top layer while staying exactly where the
author put it in the DOM. That removes the reason to reparent, and with it the
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
[platform-alignment](platform-alignment.md) for the responsibility split and
the criteria a component must meet before adopting Popover, and
[browser-support](browser-support.md) for which tier guarantees it.

That change is gated on Popover being available across Minimal. It is not
available there today, and adopting it behind a capability branch would keep
the reparenting code alive for the fallback path — so the defect would remain
for exactly the browsers the branch was written to serve.

## Until then

The honest interim position is a documented limitation, not a patch:

> A surface managed by `surface.js` is presented in the document's own context,
> not its trigger's. Do not rely on a scoped theme, density, or custom property
> reaching an anchored surface through inheritance.

Applications that need a scoped surface today have two workarounds, both of
which put the scope where the panel lands rather than where it starts: declare
the scope on an ancestor that survives the move (`body`, or the dialog), or
carry the scope on the panel element itself.

## Experiment

A branch has demonstrated the repair without changing any other contract:
[popover-manual-poc](popover-manual-poc.md) records what it measured, what it
refuted, and the checklist for the release that adopts it. Read that before
attempting this again — it also holds the negative results.

## Review trigger

Revisit when Popover is guaranteed across Minimal, when a further inherited
context is found to break, or if a transport that preserves DOM ancestry
becomes available by another route.
