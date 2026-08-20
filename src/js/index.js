/*
 * Actual CSS - JavaScript runtime, core entry.
 *
 * This entry only starts the enhancement manifest loader. Built-in behaviors
 * (dialogs, menus, tabs, validation, ...) ship in the full bundle entry
 * (src/js/full.js). Use this module for pages that only need progressive
 * enhancement via enhancement manifests.
 */

import { watchEnhancementManifests } from "./enhancement-loader.js";

watchEnhancementManifests();
