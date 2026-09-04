# POC: native popover as the surface transport

A record of an experiment, not a plan of record. It exists so the reasoning
outlives the branch that produced it — including the parts that came out
negative, which are the ones a future attempt would otherwise repeat.

Question asked: can `popover="manual"` replace the DOM reparenting in
`surface.js` without changing anything else?

Answer: yes, and the branch demonstrates it. What blocks shipping is not the
architecture; it is the browser contract. See
[browser-support](browser-support.md).

## Branch

`poc/popover-manual-surfaces`, four commits on top of `0f4f8b7`:

| SHA       | Step                                              |
| --------- | ------------------------------------------------- |
| `bf1e53d` | Pass 1 — manual transport, reparenting removed    |
| `4d598dd` | Extract the popover test stub, cut to the minimum |
| `ececcd6` | Pass 2 — keep a runtime scrim, fix its placement  |
| `27b34f1` | Finish as a transparent migration                 |

## What the transport actually needs

Derived from the branch, not from a compatibility badge. The distinction between
the two contracts matters: they fail differently, and only the first gates the
runtime.

```text
JS requirement (gates the runtime)
----------------------------------
popover="manual"
showPopover()
hidePopover()
top-layer promotion + closed-state display:none

CSS enhancement (already @supports-gated, degrades)
---------------------------------------------------
:popover-open
overlay
transition-behavior: allow-discrete
@starting-style
```

The runtime never reads `:popover-open`. It was removed from `isSurfaceOpen()`
and from the `autoUpdate` guard because a partially-implemented selector engine
answers `false` rather than throwing, which is a silent wrong answer (see the
happy-dom finding below). `.is-open` is the single state the runtime writes and
reads, and the class the CSS keys on.

Two capabilities that are *not* required, which matters because both are newer
than Popover and would have pushed the floor much higher:

- `overlay` / `allow-discrete` — the exit fade. Gated; without it the exit is
  instant and correct.
- `::backdrop` — proved unusable, see below.

## Findings

**happy-dom implements no Popover element API.** Version 20.11 has the invoker
attributes (`popoverTargetElement`, `popoverTargetAction` on button and input)
but not `showPopover` / `hidePopover` / `togglePopover`, and
`matches(":popover-open")` answers `false` rather than throwing. The silent
false is the dangerous half: reading the pseudo-class in `isSurfaceOpen()` made
all 647 unit tests see "never open". Resolved by reading `.is-open` only, plus
two no-op stubs in `tests/helpers/popover-stub.js`. Transport behavior moved to
the browser layer, which is where it belonged.

**`::backdrop` cannot replace the sheet scrim.** Negative result, measured, and
the one most likely to be re-attempted. The native backdrop is painted for a
manual popover, covers the viewport, and does inherit custom properties from
its originating element — a scoped `--backdrop-fill` on an ancestor of the
panel resolved into it, which a body-level div cannot do. But the UA sets
`pointer-events: none` on an open popover's backdrop and it is not overridable
from author CSS: both `pointer-events: auto` and `pointer-events: auto
!important` computed as `none`, since a UA `!important` outranks an author one.
Measured with a real CDP click on the scrim, the element behind it received the
click and its handler fired. The scrim has two jobs — painting, and absorbing
the pointer — and the platform only offers the first, so it stays an Actual
element.

**The scrim's placement, not the scrim, was what pass 1 broke.**
`menu.before(backdrop)` put it beside a panel that no longer moves, stranding
it inside the author's container. It goes to the document root instead, which
reproduces exactly where it landed before. This is the one fragment of
`getSurfaceRoot()` that survives, and it is not the reparenting the transport
removed: the scrim is runtime-created, has no author identity, and nothing
inherited to preserve.

**A surface inside a modal dialog works.** This was the open question, since a
modal dialog inerts the rest of the document — which is why the old transport
moved the panel into the dialog. Measured: the panel is promoted above the
dialog, stays in the dialog subtree and in its own host element, wins the hit
test, and takes focus.

**`aria-expanded` is computed natively for a `popovertarget` invoker** —
`expanded: false` closed, `true` open, on the AX tree. Deliberately not
exploited: the public contract is `aria-controls`, so `popovertarget` would be
a markup migration for adopters rather than an internal transport detail, and
`linkedTriggers()` supports several triggers per panel where `popovertarget`
covers one.

## Measurements

| Measure                   | `master` |             POC |
| ------------------------- | -------: | --------------: |
| `surface.js` code lines   |      358 |         **337** |
| `surface.js` total lines  |      431 |             436 |
| Transport concepts        |        4 |           **1** |
| Inherited contexts broken |      3/3 |         **0/3** |
| Unit tests                |      647 | **650**, 0 fail |
| Browser tests             |       50 |  **55**, 0 fail |
| JS full, brotli           |  16.1 KB |     **16.0 KB** |
| Public contracts changed  |        — |        **none** |

Removed: `mountedSurfaces`, `getSurfaceRoot()`, `mountSurface()`,
`restoreSurface()`, `disconnectSurface`'s `{ restore }` option, and the
`[popover]` conflict warning — the runtime is that owner now.

The total line count *grows* by five. The 21 fewer code lines are outweighed by
added comments. "Remove more than you add" is a signal, not a rule: what leaves
is a concept — a component no longer has to leave its place in the DOM to be
painted above the page — plus a defect with no generic repair and three
transport abstractions.

## Acceptance criterion

> A transport migration may change assertions about transport markers, but must
> not require changing behavioral assertions.

This is stricter and more useful than "no public API change". The 57
`hidden → .is-open` edits qualify: they replace observing a mechanism with
observing the lifecycle that owns it. If a future attempt has to modify an
assertion about focus, dismissal, positioning or events to make the transport
pass, it is no longer a transport swap and the claim does not hold.

## Go / no-go: WebKit verification

Every measurement in this note was taken on Chromium — the browser test harness
hardcodes `backend: "chrome"`. The floor's most notable step is Safari 17, so
the transport has no measured evidence on the engine the raise actually buys.
This is the one open technical gate on the migration, and the only item on the
checklist below that is not already demonstrated.

A permanent WebKit matrix is disproportionate for a decision taken once. One
manual pass on a real Safari at the chosen floor, recorded here, is enough:

```text
1. showPopover() / hidePopover() in manual mode
2. a closed panel is genuinely invisible and unfocusable
3. the DOM parent is unchanged before, during and after opening
4. inherited theme, density and custom properties survive opening
5. a surface inside <dialog open> and inside a modal dialog
6. reopening during the exit transition
7. a context menu at pointer coordinates
8. the sheet scrim covers and intercepts the click
```

Record the result in this section:

```text
Verified manually on:
  Safari __._ / macOS __
  iOS Safari __._ / iOS __      (if reachable)
Date: ____-__-__
Scenarios: _/8 passed
```

Scenario 5 deserves the most attention. On Chromium the native top layer solved
cleanly the problem that motivated `getSurfaceRoot()` in the first place — a
modal dialog inerts the rest of the document — and that result is what makes
the transport worth making mandatory. Scenario 2 is the second: the old
transport used `[hidden]`, which `isElementVisible()` reads in its first
branch, and the migration shifts the guard onto `checkVisibility()` with
`getClientRects()` behind it. Which branch actually runs depends on what the
bottom of the new floor implements, and the third has never been exercised.

## Changelog framing for the raise

State what stops working before what it buys, with versions named. Something
along these lines:

> **JavaScript browser floor raised** to Safari 17+, Firefox 125+ and
> Chromium 116+. Interactive surfaces now use the native manual Popover
> transport (`popover`, `showPopover()`, `hidePopover()`) instead of
> physically reparenting author DOM. This preserves inherited themes, density
> and application custom properties while leaving Actual's dismissal, focus
> and positioning contracts unchanged.
>
> Browsers below this JavaScript floor no longer receive the supported full
> Actual runtime. Core HTML/CSS degradation remains governed separately by the
> Degraded tier.

Not "Popover is now required": that reads as a dependency on the whole API
family, when the requirement is the four primitives listed above.

## Migration checklist

For the release that raises Minimal. Items 4–7 are scaffolding built for a floor
that will no longer exist; a gate outliving its reason is silent dead weight, so
they belong here rather than being found later.

1. Pass the WebKit verification above and record it. This is the go/no-go.
2. Raise Minimal to the required subset above. The justification is the defect
   and the transparent migration, not a download count: npm figures conflate
   CI, bots, caches and the author, and say nothing about the end browser.
3. Delete the `Intermediate` tier. It is not merely less useful — with a new
   Minimal above it on all three engines it is arithmetically absorbed, so its
   features become floor-guaranteed and no information is lost.
4. Reclassify those features (`color-mix()`, `oklch()/oklab()`, `dvh/svh/lvh`,
   `scrollbar-gutter`, `scrollbar-width`, `scrollbar-color`) as Minimal
   baseline and drop their `check-compat` entries.
5. Remove the `@supports selector(:popover-open)` gates in `flyout.css` and
   `tooltip.css`.
6. Remove the two `popover` entries from `check-compat`'s feature table.
7. Remove the associated `compat-ok:` pragmas, and `hasPragma()` itself if
   nothing else consumes it.
8. Move `surface.js` to the manual transport, with no fallback branch.
9. Drop `test.failing` from the reparenting tests in
   `tests/browser/surface-inherited-context.test.js`, keeping the assertions.
10. Update [surface-reparenting](surface-reparenting.md) from a known limitation
   to resolved.

Steps 8 and 9 are linked but not enforced. The `test.failing` markers guarantee
that step 8 becomes unavoidable — they turn red as unexpected passes the moment
the transport changes — but nothing forces step 9. The test file points at the
note, and the note points back here; that is as far as documentation can close
the loop.

## What was deliberately left out

Not attempted, and not because it looked hard:

- **`popover="auto"`.** It cannot express `data-flyout-auto-close`, whose
  default closes on an inside click; native light-dismiss closes on outside
  clicks only, and `false` is inexpressible altogether. Adopting it would be a
  behavior change to the component, not a transport swap.
- **Nested surfaces.** `openSurface()` closes every other open surface in the
  document; the runtime is strictly flat and the transport change does not
  alter that. Nesting is a separate feature decision, and the choice between
  extending Actual's own stack and adopting the native one is functional before
  it is technical.
- **`popover="hint"`, interest invokers, CSS anchor positioning.** Watch.
- **Further deletion for its own sake.** The branch's value is that it changes
  the transport and nothing else. Broadening it would cost exactly the property
  that makes it usable as a migration.
