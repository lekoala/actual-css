/*
 * Brings a target into view inside one horizontal scrollport — internal, not
 * a package export. Strips (tabs, reveal-current) call it once at connect so
 * a selected or current item rendered off-screen starts visible.
 *
 * Contract:
 * - Scrolls `container` only. scrollIntoView() would also scroll ancestors and
 *   the page, so a strip below the fold would yank the reader down to it.
 * - Horizontal, nearest only: a target already visible stays put; one that
 *   overflows a single edge moves the minimum to show that edge; one wider
 *   than the visible area that covers it on both sides stays put too.
 * - The visible area is the scrollport minus its computed scroll-padding, the
 *   native vocabulary also honoured by focus scrolling: a component that
 *   masks an edge (the breadcrumb fade) declares it there, not here.
 * - The delta comes from physical rects and goes through scrollBy(), so RTL
 *   needs no scrollLeft sign convention.
 * - Requires a laid-out, visible container and target. A strip hidden at
 *   connect (inside a closed dialog or drawer) or a target without a box (a
 *   current link inside a closed flyout) gets a no-op, not a deferred retry.
 */

// Sub-pixel layout must not read as overflow and nudge an aligned strip.
const TOLERANCE = 1;

// scroll-padding computes to `auto` or a length; auto adds no inset here.
const inset = (value) => Number.parseFloat(value) || 0;

export function ensureInlineVisible(container, target) {
  if (!container?.clientWidth || !target?.getClientRects().length) return;
  const style = getComputedStyle(container);
  const box = container.getBoundingClientRect();
  const left = box.left + container.clientLeft + inset(style.scrollPaddingLeft);
  const right =
    box.left + container.clientLeft + container.clientWidth - inset(style.scrollPaddingRight);
  const rect = target.getBoundingClientRect();
  const before = rect.left < left - TOLERANCE;
  const after = rect.right > right + TOLERANCE;
  if (before === after) return;
  // Initial placement, so it must not animate under scroll-behavior: smooth.
  container.scrollBy({ left: before ? rect.left - left : rect.right - right, behavior: "instant" });
}
