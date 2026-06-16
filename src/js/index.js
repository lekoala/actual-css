/*
 * Actual CSS — JavaScript runtime.
 *
 * A single delegated event system initializes all interactive components
 * on DOMContentLoaded. Zero setup required from consumers: include the
 * CSS, include this JS, write semantic HTML with ARIA attributes.
 */

import { initDropdowns } from "./dropdown.js";
import { initTabs } from "./tab.js";
import { initTooltips } from "./tooltip.js";
import { initScrollspy } from "./scrollspy.js";

document.addEventListener("DOMContentLoaded", () => {
  initDropdowns();
  initTabs();
  initTooltips();
  initScrollspy();
});
