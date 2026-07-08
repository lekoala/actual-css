/*
 * Actual CSS - JavaScript runtime.
 *
 * Each module self-registers via observer: importing the default runtime
 * enables common behaviors. No DOMContentLoaded ceremony, no init calls.
 * Injected content wires automatically; removal cleans up automatically.
 *
 * This entry also exposes a `window.actual` global, so a plain
 * `<script src="actual.js"></script>` (no bundler, no import) can still call
 * the programmatic API — e.g. `actual.status("Saved.")` in demos and
 * playgrounds. Granular imports like `actual-css/js/status` stay
 * global-free.
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
import status from "./status.js";

if (typeof window !== "undefined") {
  window.actual = { status };
}
