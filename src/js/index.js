/*
 * Actual CSS - JavaScript runtime.
 *
 * Each module self-registers via observer: importing the default runtime
 * enables common behaviors. No DOMContentLoaded ceremony, no init calls.
 * Injected content wires automatically; removal cleans up automatically.
 */

import "./flyout.js";
import "./context-menu.js";
import "./dialog.js";
import "./tab.js";
import "./tooltip.js";
import "./scrollspy.js";
import "./filter.js";
import "./mask.js";
import "./validation.js";
import "./status.js";
