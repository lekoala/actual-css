/*
 * Dismiss command — the generic `--dismiss` action. Hides the resolved target
 * and emits the bubbling `actual:dismiss` event.
 */

import { registerCommands } from "./command.js";
import { EVENTS } from "./events.js";

registerCommands("--dismiss", {
  handle(event, trigger, target) {
    event.preventDefault();
    target.hidden = true;
    target.dispatchEvent(
      new CustomEvent(EVENTS.dismiss, {
        bubbles: true,
        detail: { trigger },
      }),
    );
  },
});
