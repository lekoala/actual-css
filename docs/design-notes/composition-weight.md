# Composition weight

What a page built with Actual pays, where that weight comes from, and which
reductions were measured and declined. Recorded so the question "can we drop
this JavaScript?" starts from these findings instead of a new audit.

Measure with `bun run report:composition` (CSS compositions, per-component CSS,
JS profiles, module weights, import-time cost). `--ref <manifest.json>` adds
another library from a local copy; the repository keeps no copy of one.

## The goal

The full bundle may stay rich. What must stay light is a simple page: one that
uses native dialogs, a few tabs and tooltips should not pay for context menus,
validation or Ajax. Lightness is judged on compositions, not on
`actual.full.css` or `actual.full.js`.

## What the weight is made of

Snapshot against Oat 0.8.0 at a matched scope, brotli; re-measure before
quoting.

| Scope                                     |    Oat |  Actual |
| ----------------------------------------- | -----: | ------: |
| CSS foundation (core)                     | 1.6 KB |  2.9 KB |
| CSS settings page                         | 3.9 KB |  9.3 KB |
| CSS matched scope (19 components)         | 6.3 KB | 14.2 KB |
| JS tab + dialog + tooltip + menu + status | 1.6 KB | 13.5 KB |

**CSS is about 2x, and structural.** Selectors weigh the same on both sides; the
difference is declarations, a third of them custom properties — the hook and
token contract that lets a theme restyle without new variants. `@supports`
fallbacks cost under 1 KB on a page, forced-colors repairs about 0.2 KB.
Several simple components (grid, spinner, table, status bar, tooltip) are as
light as Oat's or lighter. Keep the contract; use the per-component figures as
a check before enriching a component.

**JavaScript is about 8x, and behavioral.** It is not one heavy module but
behaviors Oat does not have. The shared pieces:

- `@lekoala/floating` (about 2.5 KB brotli), pulled by tooltip and flyout;
- `enhance.js` (about 1 KB), paid once per bundle, shared by every enhancement;
- `command.js` (about 0.6 KB), the `commandfor` router of dialog and status.

Import-time execution is negligible (a few milliseconds under 4x CPU
throttling for the full runtime). The cost is transfer, not startup.

## Decisions

### No dynamic imports

A lazy `import()` of the positioner or of rarely used behaviors was set aside:

- the CDN build is an IIFE without code splitting, so `import()` would not
  shrink the distributed file;
- `openSurface()` is synchronous (it opens, positions and reports whether it
  could), and an asynchronous load in that sequence changes the contract;
- the modules are already separable: each enhancement has its own entry
  point, so an application that needs only tabs imports only tabs.

If lazy loading ever returns, the precondition is that no module does
expensive work when imported, not a new split.

### Dialog: keep the runtime, document the native path

`dialog.js` is large because its responsibilities are real, not because it
duplicates the platform. Its interception of `commandfor` clicks is a
polyfill first: invoker commands arrived after the Minimal tier (see
[browser-support](browser-support.md)), so without the router the trigger does
nothing on part of the supported range. It also keeps one routing path on every
browser (no double execution) and is the hook `--show` and view transitions
need. Most of what Actual adds hangs on the dialog's own `cancel`, `close` and
`click` events, not on the interception.

Estimated share of `dialog.js` (about 2.5 KB of the 4.4 KB dialog profile):
wiring and lifecycle 26%, view transitions 17%, accessible name from the
heading 16%, controlled backdrop dismiss 10%, focus-return fallback 8%,
close-request and `actual:dialog-cancel` 7%, scroll lock, auto-open and
component ownership about 5% each. No cut above 0.5 KB exists without losing a
documented behavior.

A browser with invoker commands and `closedby` runs a `<dialog class="modal">`
with no Actual JavaScript at all: open, Escape, `request-close`, light dismiss
and focus return were verified with real input. The [Dialog page](../pages/components/dialog.md#without-javascript)
documents that path and what it gives up.

The scroll lock stays in JavaScript. `html:has(dialog:modal)` could trigger the
same `overflow: hidden` without the runtime, but it cannot know whether the page
had a classic scrollbar (`had-scrollbar`), so the page would shift sideways; a
second, CSS-only lock policy is not worth about 0.1 KB. It is offered to
applications as a documented one-line opt-in instead. Note that the objection
"locking the root is discouraged" applies equally to the current lock: moving
its trigger to `:has()` changes when it applies, not how it locks. Containing
scroll with `overscroll-behavior` on the dialog and its backdrop is a different
technique; `.modal` is not a scroll container (`overflow: visible`), so it
would need a geometry change, not two declarations.

### Tooltip: keep the runtime and the positioner

The tooltip profile is about 5.3 KB brotli: the positioner about 40%,
`tooltip.js` about 34%, `enhance.js` about 19%. Within `tooltip.js`, half is
interaction (hover and focus intent, show and hide delays, press and drag,
click toggle, Escape stack), then lifecycle and sharing 18%, positioning glue
12%, `aria-describedby` management 11%, transport and generated tips 9%.
Creation and wiring are already lazy (first hover or focus); what runs at
import is five delegated listeners and the enhancement registration.

A CSS-only tooltip (an attribute painted by a pseudo-element, as Oat does) was
not adopted: it is clipped by any `overflow` ancestor, stays below a modal
dialog's top layer, cannot flip or shift, and carries its text in an attribute
rather than a described element. It would be a different component, not a
lighter build of this one.

### Positioner: one engine

`@lekoala/floating` stays the single placement engine. The tooltip uses nearly
all of it: flip, shift, the arrow offset after a shift, the resolved side,
hiding when the trigger leaves its boundary, and tracking in viewport or
document coordinates. Dropping it from menus alone saves nothing on a page that
also shows a tooltip. Why CSS anchor positioning does not replace it, and what
a native menu probe showed, is in [css-anchor](css-anchor.md).

## Review triggers

- **Minimal reaches invoker commands** (`commandfor` in every Minimal engine):
  the router stops being a polyfill. A dialog without `--show`, view
  transitions or `data-dialog-*` options could then be left to the native
  command, if a per-tier no-double-execution test is written first (see
  `command.js`).
- **`closedby` in every Minimal engine:** the runtime's `closedby="none"`
  emulation and part of the backdrop handling become redundant.
- **A script-observable anchor-visibility signal:** see
  [css-anchor](css-anchor.md).
- **A component gains behavior:** check its marginal cost in
  `report:composition` against what it adds.

Raising Minimal for one of these follows invariant 4 of
[browser-support](browser-support.md): only for a concrete removal, measured
with the report before and after.
