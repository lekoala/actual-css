/*
 * Password — show/hide toggle for password inputs.
 *
 * Declarative, through the command invoker pattern:
 *
 *   <div class="join">
 *     <input class="input" type="password" id="pw" autocomplete="current-password">
 *     <button class="btn outline" type="button" commandfor="pw"
 *             command="--password-toggle" aria-controls="pw"
 *             aria-label="Show password" aria-pressed="false"></button>
 *   </div>
 *
 * The module flips the input between type="password" and type="text" and
 * mirrors the state on every linked trigger through aria-pressed (styled by
 * .btn[aria-pressed="true"]). Keep the trigger label stable — aria-pressed
 * already announces the state, so a label that flips to "Hide" reads as a
 * double negation to screen readers.
 *
 * A revealed value does not survive navigation: a non-canceled form submit and
 * pagehide (bfcache) both revert the input to type="password", so returning to
 * the page cannot land on a readable password. A canceled submit (validation,
 * ajax) keeps the value revealed — nothing navigated away.
 */
import { commandSelector, registerCommands, targetFor } from "./command.js";

const PASSWORD_COMMANDS = ["--password-toggle"];
const TRIGGER_SELECTOR = commandSelector(PASSWORD_COMMANDS);

// Inputs currently revealed by this module — the only ones ever reverted.
const revealed = new WeakSet();

function resolvePasswordInput(trigger) {
  const target = targetFor(trigger);
  const isPassword =
    target?.localName === "input" && (target.type === "password" || revealed.has(target));
  return isPassword ? target : null;
}

function linkedTriggers(input) {
  if (!input.id) return [];
  return input.ownerDocument.querySelectorAll(
    `${TRIGGER_SELECTOR}[commandfor="${CSS.escape(input.id)}"]`,
  );
}

function setRevealed(input, reveal) {
  input.type = reveal ? "text" : "password";
  if (reveal) {
    revealed.add(input);
  } else {
    revealed.delete(input);
  }
  for (const trigger of linkedTriggers(input)) {
    trigger.setAttribute("aria-pressed", String(reveal));
  }
}

registerCommands(PASSWORD_COMMANDS, {
  resolve: resolvePasswordInput,
  prepare: (trigger, input) => {
    trigger.setAttribute("aria-controls", input.id);
    if (!trigger.hasAttribute("aria-pressed")) {
      trigger.setAttribute("aria-pressed", "false");
    }
  },
  handle: (event, _trigger, input) => {
    event.preventDefault();
    setRevealed(input, input.type === "password");
  },
});

if (typeof document !== "undefined") {
  document.addEventListener("submit", (event) => {
    if (event.defaultPrevented) return;
    for (const el of event.target.elements ?? []) {
      if (revealed.has(el)) setRevealed(el, false);
    }
  });

  window.addEventListener("pagehide", () => {
    for (const trigger of document.querySelectorAll(`${TRIGGER_SELECTOR}[aria-pressed="true"]`)) {
      const input = targetFor(trigger);
      if (input && revealed.has(input)) setRevealed(input, false);
    }
  });
}
