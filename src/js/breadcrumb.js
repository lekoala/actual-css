/*
 * Breadcrumb — starts an overflowing trail on its current item.
 *
 * The `breadcrumb` enhancement token is the opt-in, on the scrolling list:
 *
 *   <ol class="breadcrumb" data-enhance="breadcrumb">…</ol>
 *
 * A trail that does not fit scrolls, and its current page — the item a reader
 * needs most — sits at the inline end, off-screen at rest. At connect the
 * list scrolls just enough to show the `aria-current="page"` item clear of
 * the end fade (declared as scroll-padding in breadcrumb.css). One placement,
 * no observer: later resizes and scrolling stay the reader's. Without this
 * module the trail still scrolls; it only starts at the root.
 */

import { registerEnhancement } from "./enhance.js";
import { ensureInlineVisible } from "./inline-visible.js";

registerEnhancement("breadcrumb", (list) => {
  ensureInlineVisible(list, list.querySelector('[aria-current="page"]'));
});
