/*
 * Brings a target into view inside one horizontal scrollport — internal, not
 * a package export. Tabs call it at connect, so a selected tab rendered
 * off-screen starts visible, and on every selection.
 *
 * Contract:
 * - Scrolls `container` only. scrollIntoView() would also scroll ancestors and
 *   the page, so a strip below the fold would yank the reader down to it.
 * - Horizontal, nearest only: a target already visible stays put; one that
 *   overflows a single edge moves the minimum to show that edge; one wider
 *   than the visible area that covers it on both sides stays put too.
 * - The visible area is the scrollport minus its computed scroll-padding, the
 *   native vocabulary also honoured by focus scrolling: a component that
 *   keeps an edge clear (a strip's focus line) declares it there, not here.
 * - The delta comes from physical rects and goes through scrollBy(), so RTL
 *   needs no scrollLeft sign convention.
 * - Rects are in transformed pixels; clientWidth, scroll-padding and scrollBy()
 *   are in layout pixels. The strip's own scale converts between them, so a
 *   strip under transform: scale() reveals the same item. Rotation is out of
 *   scope.
 * - Inline axis only: the block scroll position is left as it is. Callers are
 *   one-row strips whose block axis does not scroll.
 * - Requires a laid-out, visible container and target. A strip hidden at
 *   connect (inside a closed dialog or drawer) or a target without a box (a
 *   current link inside a closed flyout) gets a no-op, not a deferred retry.
 */

// Sub-pixel layout must not read as overflow and nudge an aligned strip.
const TOLERANCE = 1;

// scroll-padding computes to `auto`, a length, or a percentage of the
// scrollport; auto adds no inset. A calc() mixing the two reads as none.
const inset = (value, scrollport) =>
  value.endsWith("%")
    ? (Number.parseFloat(value) * scrollport) / 100
    : Number.parseFloat(value) || 0;

export function ensureInlineVisible(container, target) {
  const width = container?.clientWidth;
  if (!width || !target?.getClientRects().length) return;
  const style = getComputedStyle(container);
  const box = container.getBoundingClientRect();
  const scale = box.width / container.offsetWidth || 1;
  const start = box.left + (container.clientLeft + inset(style.scrollPaddingLeft, width)) * scale;
  const end =
    box.left + (container.clientLeft + width - inset(style.scrollPaddingRight, width)) * scale;
  const rect = target.getBoundingClientRect();
  const before = rect.left < start - TOLERANCE;
  const after = rect.right > end + TOLERANCE;
  if (before === after) return;
  const delta = before ? rect.left - start : rect.right - end;
  // A placement, not a transition: it must not animate under scroll-behavior: smooth.
  container.scrollBy({ left: delta / scale, behavior: "instant" });
}
