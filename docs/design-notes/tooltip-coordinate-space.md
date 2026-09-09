# Tooltip coordinate space, and what an unpositionable tip means

Two changes to `tooltip.js`, both consequences of one question: what a floating
element's coordinates are relative to, and what it means when there are none.

## The lag

Scrolling is asynchronous. The compositor can move the page before any script
runs, so a `position: fixed` element written from JavaScript is always one frame
behind the content it is attached to. `autoUpdate()` coalesces to a frame by
design, which is correct for the work and still visible as a wobble on touch
devices, where scrolling is driven off the main thread.

`@lekoala/floating` 0.2.0 adds `coordinateSpace: "document"`: the same viewport
measurement, written as `left`/`top` plus the page scroll, for an absolutely
positioned box whose containing block is the initial one. The browser then
carries the element with the page and there is nothing to correct.

Two candidates were rejected before this one:

- **Popper's `strategy: "absolute"`.** Relative to a *containing block*, not to
  the reference — which means resolving the offset parent, its borders, its
  scroll offsets, its transforms, and its own nested scrollers. That is the
  machinery `floating` exists without.
- **Repositioning synchronously on scroll** instead of at the next frame.
  Cheaper to write, and it only shortens the lag; it cannot remove it, because
  the scroll that moved the page never reached the main thread in time.

## The containing block is not a problem here

Document coordinates assume the initial containing block. A tip is an open
popover, so it is in the top layer, where an absolutely positioned box resolves
against the initial containing block whatever its ancestors do. Measured in
Chrome, writing viewport point `(200, 300)` in document coordinates at
`scrollY: 640` and reading the resulting rect back:

| Ancestor of the tip  | Rect      |
| -------------------- | --------- |
| `position: relative` | `200,300` |
| `transform`          | `200,300` |
| `filter`             | `200,300` |
| `contain: paint`     | `200,300` |
| `dialog` (`show()`)  | `200,300` |
| `dialog` (modal)     | `200,300` |

So where the tip lives never enters into it, and the placement contract — an
explicit tip stays where the author wrote it, a generated one goes to the
dialog subtree or the body — is untouched.

## The trigger is the problem

Document coordinates are only right while the *trigger* scrolls with the page.
Against a trigger that does not, the browser carries the tip away on every
scroll and the next frame snaps it back: a worse artefact than the lag it
removes, and a real one — `.fab`, `.status-bar` and `.drawer` are fixed,
`.navbar`, `.topbar`, `.app-nav` and `.form-actions` are sticky.

`isViewportAnchored()` therefore walks up from the trigger for a computed
`fixed` or `sticky`, and separately asks for `dialog:modal, :popover-open`,
which the walk cannot see: a modal dialog computes `position: absolute` and is
laid out against the viewport by the top layer. Sticky counts even while
unstuck, because nothing in the DOM changes when it becomes stuck.

The modal case is the one worth naming, because a modal dialog does **not**
stop the page from scrolling behind it — measured, wheel included. A trigger
inside one is as viewport-anchored as a fixed bar, and keeps `position: fixed`.

## What document coordinates cost

An absolutely positioned box in the top layer joins the document's scrollable
overflow; a fixed one never does. The scrollable height becomes the greater of
the content's own bottom and the tip's, and the threshold is exact: walking a
20px tip down a 2000px document in Chrome, `scrollHeight` reads 2000 for every
tip bottom through 2000, and the tip's own bottom from 2001 on.

So a tip that overflows the content raises the scroll maximum while it is up,
and hiding it clamps back any position only that tip made reachable: the page
appears to jump upwards on every show and hide. Worth remembering if something
like it ever shows up, because nothing here defends against it — placement
does. Flip and shift put the tip inside the viewport, which at any scroll
position is inside the document, and only overflow the engine explicitly
accepts, for a tip it could not fit, can pass the end of the content. The
demote/promote path needs nothing either: the document does not change size
while a tip is down, so the coordinates it comes back up with are still inside
it.

## `false` is a geometry answer

`reposition()` returns `false` when it cannot place the element, an anchor
outside the boundary included. `tooltip.js` used to read that as the end of the
interaction and call `hideTip()`, which stopped position tracking.

On a touch device that loses the tooltip for good: tap a trigger, it takes
focus and the tip appears; scroll the trigger past the boundary and the tip is
torn down; scroll back and nothing is watching any more. Tapping again does not
help either — the trigger is already focused, so no `focusin` fires, and a
repeat tap on the same element fires no `mouseover`.

So the runtime now keeps two states. `wanted` is what the interaction asks for
and only `hideTip()` clears it; `visible` is what is promoted. An
unpositionable tip is demoted and stays tracked, and the next tick that can
place it brings it back up.

`floating` was deliberately left out of this: no `{ positioned, reason }`
return, no option. Its README already documents the pattern — a failed
positioning may be temporary without `autoUpdate()` being stopped.

## Surfaces are not tooltips

`surface.js` still closes on `false`, and that stays a separate decision. A
flyout close restores focus, fires an event and releases an Escape entry;
hiding one while its trigger is off-boundary would leave a panel the user
cannot see holding all three. The prerequisite named in
[css-anchor](css-anchor.md) — "an out-of-view surface hides instead of closing"
— is a component decision, and it has been taken for tooltips only.
