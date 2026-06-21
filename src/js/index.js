/*
 * Actual CSS — JavaScript runtime.
 *
 * Each module self-registers via observer: importing the runtime enables
 * all behaviors. No DOMContentLoaded ceremony, no init calls. Include
 * the CSS, include this JS, write semantic HTML with ARIA attributes.
 * Injected content wires automatically; removal cleans up automatically.
 */

import "./dropdown.js";
import "./context-menu.js";
import "./tab.js";
import "./tooltip.js";
import "./scrollspy.js";
