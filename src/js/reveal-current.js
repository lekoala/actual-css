/*
 * Reveal current — starts an overflowing strip on its current item.
 *
 * The `reveal-current` enhancement token is the opt-in, on the element that
 * scrolls:
 *
 *   <ol class="breadcrumb" data-enhance="reveal-current">…</ol>
 *   <ol class="steps steps-horizontal" data-enhance="reveal-current">…</ol>
 *   <ol class="pagination" data-enhance="reveal-current">…</ol>
 *
 * A one-row strip that does not fit scrolls, and its current item — the
 * breadcrumb's page, the flow's step, the selected page number — may render
 * off-screen at rest. At connect the strip scrolls just enough to show the
 * first rendered `aria-current` item clear of its scroll-padding (.scroller
 * declares its fade there). A current item without a box (a responsive
 * duplicate, a link in a closed flyout) is skipped, not taken as the target
 * of a no-op. One placement, no observer: later resizes and
 * scrolling stay the reader's. Without this module the strip still scrolls;
 * it only starts at its first item.
 */

import { registerEnhancement } from "./enhance.js";
import { ensureInlineVisible } from "./inline-visible.js";

registerEnhancement("reveal-current", (strip) => {
  const current = [...strip.querySelectorAll('[aria-current]:not([aria-current="false"])')].find(
    (item) => item.getClientRects().length,
  );
  ensureInlineVisible(strip, current);
});
