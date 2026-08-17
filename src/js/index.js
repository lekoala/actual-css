/*
 * Actual CSS - JavaScript runtime.
 *
 * Each module self-registers via observer: importing the default runtime
 * enables common behaviors. No DOMContentLoaded ceremony, no init calls.
 * Injected content wires automatically; removal cleans up automatically.
 *
 * A plain `<script src="actual.js"></script>` (no bundler, no import) still
 * gets the full runtime, including declarative triggers like status's
 * `command="--status"` and the `actual:status` event — no global needed to
 * drive them from other inline scripts either.
 */

import "./flyout.js";
import "./context-menu.js";
import "./dialog.js";
import "./dismiss.js";
import "./tab.js";
import "./tooltip.js";
import "./scrollspy.js";
import "./filter.js";
import "./mask.js";
import "./password.js";
import "./validation.js";
import "./status.js";
import { watchEnhancementManifests } from "./enhancement-loader.js";

watchEnhancementManifests();
