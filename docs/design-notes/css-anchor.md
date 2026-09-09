# CSS anchor positioning

Placement stays in JavaScript. This note records why, so the question is not
reopened on browser-support figures alone.

## What owns placement today

`@lekoala/floating` positions every anchored surface. `surface.js` calls
`reposition()` for an element anchor and `repositionAt()` for a pointer
coordinate, both inside an `autoUpdate()` loop.

The positioner is not only a placement engine. It writes outputs the components
read as ordinary CSS:

```text
left / top              the placement itself
data-placement          resolved side, after flip
--arrow-x / --arrow-y   arrow offset along the panel edge
--available-height      space left for the panel
```

`tooltip.css` draws its arrow from `data-placement` and `--arrow-x/-y`;
`flyout.css` caps its panel with `--available-height`. Replacing the engine
means replacing those, not only the coordinates.

## The blocker is not support

Support is the obvious gate and the wrong one. The blocking output is the one
that is not CSS at all — the positioner's return value:

```js
if (!positionSurface(menu)) closeSurface(menu);   // surface.js
```

`reposition()` returns `false` when positioning cannot be performed: a hidden
floating element, a missing reference rect, an anchor outside the boundary, or
a document with no browsing context. `surface.js` runs that check on every
`autoUpdate` tick, so an anchor that leaves its boundary **closes** the surface.

CSS anchor positioning offers no equivalent signal. `position-try-fallbacks`
re-places the box and `position-visibility` can hide it, but hiding is not
closing: no event fires, `.is-open` stays set, focus is never restored, and the
Escape stack keeps an entry for a panel the user can no longer see.

This is the boundary the manual Popover transport was adopted on, in the other
direction — a capability takes one responsibility without being handed the
neighbouring one. See [platform-alignment](platform-alignment.md).

## The pointer-coordinate case

Context menus open at `clientX`/`clientY`, not at a DOM element
(`context-menu.js` stores the point, `surface.js` passes it to
`repositionAt()`). Anchor positioning anchors to elements, so this path needs a
script layer whatever happens to the element-anchored one. Adoption would split
the positioner in two rather than delete it.

## The one output with a declarative equivalent

`--surface-anchor-width` is measured from the trigger's rect on every
reposition, solely so a flyout can match its trigger's width. `anchor-size()`
expresses that relationship directly and would remove both the measurement and
the property.

It is not free either: the panel would need an `anchor-name` on its trigger and
a `position-anchor` written at runtime, which is the same plumbing the
positioner already does. Worth doing only alongside a wider move, not as a
standalone saving.

## What would unblock the move

One of:

- a script-observable anchor-visibility signal, so the lifecycle keeps its
  close decision while CSS takes the geometry; or
- a deliberate contract change — an out-of-view surface hides instead of
  closing. That is a component decision, not a transport swap, and it has the
  same shape as the `popover="auto"` rejection in
  [popover-manual-poc](popover-manual-poc.md). It has been taken for tooltips,
  which have no focus restoration, event or Escape entry to lose — see
  [tooltip-coordinate-space](tooltip-coordinate-space.md).

Browser support is a precondition for either, never the trigger on its own.

## Review trigger

Revisit when a script-observable anchor-visibility signal appears, or when a
project need makes hide-instead-of-close the wanted behavior.
