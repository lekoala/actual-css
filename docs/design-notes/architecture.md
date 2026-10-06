# Architecture

How to decide what belongs in Actual, and where. The rules an application
author follows are in [Philosophy](../pages/foundations/philosophy.md) and
[Building with Actual CSS](../pages/guides/integrating-actual-css.md); naming is
in [Naming conventions](naming.md), behavior in
[Enhancement contract](enhancement-contract.md).

The test for where a rule goes: if it changes how someone writes their
application CSS, it belongs in the guide; if it only decides how Actual is
built, it belongs here.

## Ownership

- **A component owns its intrinsic anatomy, not page composition.** Padding,
  surface, slots and states are the component's; outer margins and sibling
  spacing are not.
- **A layout primitive on a component replaces its default layout without
  specificity tricks.** The component's own box layout sits in `:where()`
  (`.card`, its header and footer slots). `components/` loads after `layout/`,
  so a plain class declaration would win on source order and flatten
  `class="card media"` into a column.
- **Structural anatomy never lends a class's weight to a bare element.**
  `:where(dialog).modal > :where(form, .stack)`, not `> :is(form, .stack)`,
  which would give `<form>` the specificity of `.stack`.

## Utilities

A utility makes one reusable adjustment. A class that sets a surface, a border,
padding and type together has become a component, whatever file it lives in.

## Abstraction

- **Duplication beats an abstraction that couples unrelated components.** Every
  file under `components/` is a public export (`actual-css/css/components/*`).
  A shared file imported only by the index would break a single-component
  import, so `.modal` and `.drawer` each keep the declarations they share.
- **No generic primitive because two examples look alike.** A primitive names a
  relationship that recurs across unrelated applications. When the existing
  answer was hard to find, improve the docs instead.
- **Bytes do not justify specificity.** A selector is not merged or raised to
  save a few compressed bytes when it changes who can override it.

## Tokens

A value derived from an overridable token is computed on the element that uses
it, never as an alias on `:root`: an inherited custom property arrives already
computed, so an override on a theme island or a region would not reach it. The
generic focus line (`focus.css`) and the dialog and drawer focus reserves
follow this rule.

## Decoration

A decorative cue must not dictate geometry, focus or scroll behavior. Scrolling
strips have no shared edge fade: its mask set their scroll-padding and focus
reserve, and repeated what a clipped item and the scrollbar already show. The
strips reserve only their focus line. `.tabs` is the exception: it hides its
scrollbar, so its fade is the cue, and the fade spans the strip's existing
scroll-padding instead of setting it.

A strip that loads on a current item starts scrolled to it through
`scroll-initial-target`, not a runtime: one declaration on the item replaces a
module, its opt-in token and its wait for parsing. Engines without the
property start at the first item, which the fade or the scrollbar already
says is not all. `.pagination` does not scroll at all: it wraps, because a
click on a page navigates instead of moving the strip, so a scrolling row hid
pages the mouse could not reach.
