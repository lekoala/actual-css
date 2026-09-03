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
// This set is intentionally iterable so pagehide also covers closed shadow
// roots. Entries leave the set as soon as their input is masked again.
const revealed = new Set();
const submitRoots = new WeakSet();

function resolvePasswordInput(trigger) {
  const target = targetFor(trigger);
  const isPassword =
    target?.localName === "input" && (target.type === "password" || revealed.has(target));
  return isPassword ? target : null;
}

function linkedTriggers(input) {
  if (!input.id) return [];
  return input
    .getRootNode()
    .querySelectorAll(`${TRIGGER_SELECTOR}[commandfor="${CSS.escape(input.id)}"]`);
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

function handleSubmit(event) {
  if (event.defaultPrevented) return;
  for (const element of event.target.elements ?? []) {
    if (revealed.has(element)) setRevealed(element, false);
  }
}

function watchSubmitRoot(input) {
  const root = input.getRootNode();
  if (submitRoots.has(root)) return;
  submitRoots.add(root);
  root.addEventListener("submit", handleSubmit);
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
    const reveal = input.type === "password";
    if (reveal) watchSubmitRoot(input);
    setRevealed(input, reveal);
  },
});

if (typeof document !== "undefined") {
  submitRoots.add(document);
  document.addEventListener("submit", handleSubmit);

  document.defaultView?.addEventListener("pagehide", () => {
    for (const input of revealed) {
      // Opportunistic housekeeping: an input removed from the DOM before
      // navigation no longer needs reverting and can leave the set.
      if (!input.isConnected) {
        revealed.delete(input);
        continue;
      }
      setRevealed(input, false);
    }
  });
}
