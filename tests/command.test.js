import { afterEach, expect, test } from "bun:test";
import { commandSelector, registerCommands, targetFor } from "../src/js/command.js";
import { cleanupDOM, click, setupDOM } from "./helpers/dom.js";

afterEach(() => {
  cleanupDOM();
});

test("all commands in a document share one delegated click listener", () => {
  setupDOM(`
    <div id="first"></div>
    <div id="second"></div>
    <button commandfor="first" command="--first"></button>
    <button commandfor="second" command="--second"></button>
  `);
  const nativeAddEventListener = document.addEventListener;
  let clickListeners = 0;
  document.addEventListener = function addEventListener(type, ...args) {
    if (type === "click") clickListeners++;
    return nativeAddEventListener.call(this, type, ...args);
  };

  const handled = [];
  const first = registerCommands("--first", {
    handle: (_event, _trigger, target) => handled.push(target.id),
  });
  const second = registerCommands("--second", {
    handle: (_event, _trigger, target) => handled.push(target.id),
  });

  click(document.querySelector('[command="--first"]'));
  click(document.querySelector('[command="--second"]'));

  expect(clickListeners).toBe(1);
  expect(handled).toEqual(["first", "second"]);

  first.disconnect();
  second.disconnect();
});

test("new triggers and targets work immediately without a scan", () => {
  setupDOM("<main></main>");
  let handledTarget = null;
  registerCommands("--dynamic", {
    handle: (_event, _trigger, target) => {
      handledTarget = target;
    },
  });

  document.querySelector("main").innerHTML = `
    <div id="late"></div>
    <button commandfor="late" command="--dynamic"><span>Run</span></button>
  `;
  click(document.querySelector("span"));

  expect(handledTarget).toBe(document.getElementById("late"));
});

test("the target is resolved again for every action", () => {
  setupDOM(`
    <div id="first"></div>
    <div id="second"></div>
    <button commandfor="first" command="--resolve"></button>
  `);
  const targets = [];
  registerCommands("--resolve", {
    handle: (_event, _trigger, target) => targets.push(target),
  });
  const trigger = document.querySelector("button");

  click(trigger);
  trigger.setAttribute("commandfor", "second");
  click(trigger);
  document
    .getElementById("second")
    .replaceWith(document.createRange().createContextualFragment('<div id="second"></div>'));
  click(trigger);

  expect(targets[0].id).toBe("first");
  expect(targets[1].id).toBe("second");
  expect(targets[2]).toBe(document.getElementById("second"));
  expect(targets[2]).not.toBe(targets[1]);
});

test("an already canceled click does not run its command", () => {
  setupDOM('<div id="target"></div><button commandfor="target" command="--action"></button>');
  let calls = 0;
  const trigger = document.querySelector("button");
  trigger.addEventListener("click", (event) => event.preventDefault());
  registerCommands("--action", { handle: () => calls++ });

  click(trigger);

  expect(calls).toBe(0);
});

function dispatchClick(element) {
  const event = new MouseEvent("click", { bubbles: true, cancelable: true });
  element.dispatchEvent(event);
  return event;
}

test("a routed command cancels the click before its handler runs", () => {
  setupDOM('<div id="target"></div><button commandfor="target" command="--cancel"></button>');
  let preventedInHandler = null;
  registerCommands("--cancel", {
    handle: (event) => {
      preventedInHandler = event.defaultPrevented;
    },
  });

  expect(dispatchClick(document.querySelector("button")).defaultPrevented).toBe(true);
  expect(preventedInHandler).toBe(true);
});

test("an unknown command or an unresolved target leaves the click alone", () => {
  setupDOM(`
    <div id="target"></div>
    <button id="unknown" commandfor="target" command="--unknown"></button>
    <button id="missing" commandfor="nowhere" command="--known"></button>
  `);
  registerCommands("--known", { handle() {} });

  expect(dispatchClick(document.getElementById("unknown")).defaultPrevented).toBe(false);
  expect(dispatchClick(document.getElementById("missing")).defaultPrevented).toBe(false);
});

test("the click is canceled even when the handler throws", () => {
  setupDOM('<div id="target"></div><button commandfor="target" command="--throws"></button>');
  registerCommands("--throws", {
    handle() {
      throw new Error("handler failure");
    },
  });
  const event = new MouseEvent("click", { bubbles: true, cancelable: true });

  try {
    document.querySelector("button").dispatchEvent(event);
  } catch {
    // Some DOM implementations rethrow listener errors from dispatchEvent.
  }

  expect(event.defaultPrevented).toBe(true);
});

test("command names must be native keywords or custom -- commands", () => {
  expect(() => registerCommands("dismiss", { handle() {} })).toThrow(TypeError);
  expect(() => registerCommands("show", { handle() {} })).toThrow(TypeError);
  expect(() => commandSelector(["--ok", "nope"])).toThrow(TypeError);
});

// Asserted on the string: happy-dom ignores the attribute selector `i` flag.
test("commandSelector matches native keywords case-insensitively, custom ones exactly", () => {
  expect(commandSelector(["SHOW-MODAL", "--Action"])).toBe(
    'button[commandfor]:is([command="show-modal" i], [command="--Action"])',
  );
});

test("native command names are ASCII case-insensitive", () => {
  setupDOM('<div id="target"></div><button commandfor="target" command="SHOW-MODAL"></button>');
  let handledCommand = null;
  registerCommands("show-modal", {
    handle: (_event, _trigger, _target, command) => {
      handledCommand = command;
    },
  });

  click(document.querySelector("button"));

  expect(handledCommand).toBe("show-modal");
});

test("custom command names remain case-sensitive", () => {
  setupDOM('<div id="target"></div><button commandfor="target" command="--ACTION"></button>');
  let calls = 0;
  registerCommands("--action", { handle: () => calls++ });

  click(document.querySelector("button"));

  expect(calls).toBe(0);
});

test("disconnect removes only its command registration", () => {
  setupDOM('<div id="target"></div><button commandfor="target" command="--once"></button>');
  let calls = 0;
  const registration = registerCommands("--once", {
    handle: () => calls++,
  });

  click(document.querySelector("button"));
  registration.disconnect();
  registration.disconnect();
  click(document.querySelector("button"));

  expect(calls).toBe(1);
});

test("duplicate command ownership fails fast", () => {
  setupDOM();
  registerCommands("--owned", { handle() {} });

  expect(() => registerCommands("--owned", { handle() {} })).toThrow(
    'Command "--owned" is already registered',
  );
});

test("commands resolve within their shadow root", () => {
  setupDOM("<div id=host></div>");
  const shadow = document.getElementById("host").attachShadow({ mode: "open" });
  shadow.innerHTML = `
    <div id="target"></div>
    <button commandfor="target" command="--shadow"><span>Run</span></button>
  `;
  let handledTarget = null;
  registerCommands("--shadow", {
    resolve: targetFor,
    handle: (_event, _trigger, target) => {
      handledTarget = target;
    },
  });

  shadow
    .querySelector("span")
    .dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, composed: true }));

  expect(handledTarget).toBe(shadow.getElementById("target"));
});
