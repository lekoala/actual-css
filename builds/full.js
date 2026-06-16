import { initDropdowns } from "../src/js/dropdown.js";
import { initTabs } from "../src/js/tab.js";
import { initTooltips } from "../src/js/tooltip.js";
import { initScrollspy } from "../src/js/scrollspy.js";

document.addEventListener("DOMContentLoaded", () => {
  initDropdowns();
  initTabs();
  initTooltips();
  initScrollspy();
});
