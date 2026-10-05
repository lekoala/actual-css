/*
 * Reveal current — starts an overflowing strip on its current item.
 *
 * The `reveal-current` enhancement token is the opt-in, on the element that
 * scrolls:
 *
 *   <ol class="steps steps-horizontal" data-enhance="reveal-current">…</ol>
 *   <ol class="pagination" data-enhance="reveal-current">…</ol>
 *
 * A one-row strip that does not fit scrolls, and its current item — the
 * flow's step, the selected page number, the current link tab — may render
 * off-screen at rest. At connect, once the document is parsed so the current
 * item exists, the strip scrolls just enough to show the
 * first rendered `aria-current` item ("page", "step", or "true" on a flyout
 * tab) clear of its scroll-padding (the strip
 * reserves its focus line there). A current item without a box (a responsive
 * duplicate, a link in a closed flyout) is skipped, not taken as the target
 * of a no-op. One placement, no observer: later resizes and scrolling stay
 * the reader's. Without this module the strip still scrolls; it only starts
 * at its first item.
 */

import { registerEnhancement } from "./enhance.js";
import { ensureInlineVisible } from "./inline-visible.js";
import { afterParse } from "./parsed.js";

registerEnhancement("reveal-current", (strip) =>
  afterParse(strip, () => {
    // The values the strips paint: a page (pagination, link tabs), a step, or
    // the flyout tab whose panel holds the current page ("true"). That page's
    // link sits in a closed panel without a box, so the trigger is the target.
    const current = [
      ...strip.querySelectorAll(
        '[aria-current="page"], [aria-current="step"], [aria-current="true"]',
      ),
    ].find((item) => item.getClientRects().length);
    ensureInlineVisible(strip, current);
  }),
);
