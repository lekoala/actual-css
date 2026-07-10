# JavaScript

## Overview

> Small progressive enhancers that attach to semantic HTML and clean themselves up when the DOM changes.

Actual's JavaScript modules are optional. Importing `actual-css/js` registers the
complete default runtime — every built-in enhancer, including validation and
status; importing a specific module registers only that behavior.

```js
import "actual-css/js";
import "actual-css/js/dialog";
import "actual-css/js/filter";
import "actual-css/js/mask";
```

The runtime does not require `DOMContentLoaded` or manual init calls. Components
with a real element lifecycle use the shared `enhance()` helper: initial matching
elements are connected, inserted matching elements are connected later, and
removed elements run cleanup. Declarative `command` / `commandfor` actions use a
single delegated click listener instead; triggers and targets are never tracked.

`enhance()` observes DOM insertions and removals, not attribute changes. If an
already-connected element receives a behavior attribute later, call the returned
`refresh(node)` handle. Behavior attributes are setup-time contracts: removing
one does not disconnect an active behavior. If an application needs a live
enable/disable switch, keep that state inside its enhancer and clean it up when
the element leaves the DOM.

### Side-effect modules

All JS modules are side-effect modules: importing them registers behavior
automatically. There is no init call, public global object, or configuration.
This keeps imports declarative and tree-shakeable.

```js
import "actual-css/js";        // complete default runtime (all enhancers)
import "actual-css/js/dialog"; // single feature
```

Use `actual-css/js` for demos, playgrounds, and smoke tests where one import
enables every built-in behavior. Production apps can import individual modules
such as `actual-css/js/validation` or `actual-css/js/status` when only those
are needed.

Loading the built `dist/actual.js` as a plain `<script>` (no `type="module"`,
no bundler, no `import`) gets the full runtime — declarative triggers such as
status's `command="--status"` work immediately. Modules never touch `window`;
there is no global to call into. Static HTML that needs to trigger something
from its own inline `<script>` dispatches the module's public event instead
(see `actual-css/js/status`'s `actual:status`, for example):

```html
<script src="actual.js"></script>
<script>
  document.dispatchEvent(new CustomEvent("actual:status", {
    bubbles: true,
    detail: { message: "Saved.", intent: "success" },
  }));
</script>
```

Modules are safe to import during SSR — registration is a no-op when there is no
DOM. The runtime remains active until the page unloads. There is no teardown
handle; cleanup is per-element when an element leaves the DOM.

## Extending The Runtime

### Stateless commands

Use `registerCommands()` for a target-oriented action that can be fully resolved
when it happens. The command router keeps one handler per command name and one
click listener per document; it does not scan, observe, or retain buttons and
targets. Injected markup, changed `commandfor` values, and replacement targets
therefore work immediately.

Custom command names start with `--`, following the native invoker convention.
Keep accessibility state that must exist before interaction in the HTML itself.

```html
<button type="button" commandfor="details" command="--toggle-hidden"
        aria-controls="details">Toggle details</button>
<section id="details" hidden>Details…</section>
```

```js
import { registerCommands } from "actual-css/js/command";

registerCommands("--toggle-hidden", {
  handle(event, trigger, target) {
    event.preventDefault();
    target.hidden = !target.hidden;
    trigger.setAttribute("aria-expanded", String(!target.hidden));
  },
});
```

The default resolver looks up `commandfor` by ID in the trigger's document or
shadow root. Supply `resolve(trigger)` to validate or replace that lookup.
An optional idempotent `prepare(trigger, target, command)` callback runs directly
before `handle`; built-in behaviors use it for target-derived semantics.
The returned handle has an idempotent `disconnect()` method for applications
that unload the module owning the command.

### Stateful enhancers

Use `enhance()` for project-specific behavior. It accepts a selector map where
each function receives the matched element and may return a cleanup function.

```js
import enhance from "actual-css/js/enhance";

enhance({
  "[data-copy]": (button) => {
    const controller = new AbortController();

    button.addEventListener("click", async () => {
      const target = document.querySelector(button.dataset.copy);
      if (!target) return;
      await navigator.clipboard.writeText(target.textContent ?? "");
    }, { signal: controller.signal });

    return () => controller.abort();
  },
});
```

Prefer explicit app attributes such as `data-copy`, `data-autogrow`, or
`data-ajax`. Actual's built-in attributes are intentionally small contracts; app
behavior can be richer without overloading them.

## Lifecycle Rules

- Keep selectors opt-in.
- Return cleanup for every listener, observer, timer, or pending controller.
- Use `AbortController` for event listeners whenever possible.
- Make the unenhanced HTML useful first, then add behavior.
- Dispatch a custom event when app code may need to react.
- Keep modules safe to import without a DOM.

## Toggle Button Groups

Actual styles `.btn[aria-pressed="true"]`; application code should update the attribute. Use grouped buttons when the state belongs to the current page, not for navigation between pages.

```html
<div class="join" role="group" aria-label="Text style" data-toggle-group>
  <button class="btn outline" type="button" aria-pressed="false">Bold</button>
  <button class="btn outline" type="button" aria-pressed="false">Italic</button>
  <button class="btn outline" type="button" aria-pressed="false">Underline</button>
</div>

<div class="join" role="group" aria-label="Alignment" data-toggle-group="single">
  <button class="btn outline" type="button" aria-pressed="true">Left</button>
  <button class="btn outline" type="button" aria-pressed="false">Center</button>
  <button class="btn outline" type="button" aria-pressed="false">Right</button>
</div>
```

```js
import enhance from "actual-css/js/enhance";

enhance({
  "[data-toggle-group]": (group) => {
    const controller = new AbortController();

    group.addEventListener("click", (event) => {
      if (!(event.target instanceof Element)) return;

      const button = event.target.closest("button[aria-pressed]");
      if (!button || !group.contains(button)) return;

      if (group.dataset.toggleGroup === "single") {
        for (const item of group.querySelectorAll("button[aria-pressed]")) {
          item.setAttribute("aria-pressed", String(item === button));
        }
        return;
      }

      const pressed = button.getAttribute("aria-pressed") === "true";
      button.setAttribute("aria-pressed", String(!pressed));
    }, { signal: controller.signal });

    return () => controller.abort();
  },
});
```

## Custom Text Filters

`data-filter` is intentionally limited to Actual's built-in filters. For domain
rules such as currency, signed numbers, product codes, or time ranges, create an
app-specific filter attribute.

Use the input helpers when you need the same composition and caret behavior as
Actual's built-in filters.

```js
import enhance from "actual-css/js/enhance";
import { dispatchInput, onTextInput, selectionStart, setCaret } from "actual-css/js/input";

const filters = {
  currency(value) {
    const normalized = value.replace(/,/g, ".");
    const [whole, decimals = ""] = normalized.replace(/[^0-9.]/g, "").split(".");
    return decimals ? `${whole}.${decimals.slice(0, 2)}` : whole;
  },
  time(value) {
    const digits = value.replace(/\D/g, "").slice(0, 4);
    return digits.length > 2 ? `${digits.slice(0, 2)}:${digits.slice(2)}` : digits;
  },
};

enhance({
  "input[data-app-filter]": (input) => {
    const filter = filters[input.dataset.appFilter];
    if (!filter) return;

    const controller = new AbortController();
    let filtering = false;

    onTextInput(input, () => {
      if (filtering) return;

      const caret = selectionStart(input);
      const previous = input.value;
      const next = filter(previous);
      if (next === previous) return;

      input.value = next;
      setCaret(input, filter(previous.slice(0, caret)).length);

      try {
        filtering = true;
        dispatchInput(input);
      } finally {
        filtering = false;
      }
    }, controller.signal);

    return () => controller.abort();
  },
});
```

```html
<input inputmode="decimal" data-app-filter="currency" autocomplete="off" />
<input inputmode="numeric" data-app-filter="time" autocomplete="off" />
```

## Textarea Autogrow

Textarea autogrow is a good fit for a small local enhancer because product needs
vary: minimum rows, maximum height, scroll behavior, and resize handles are all
app decisions.

```js
import enhance from "actual-css/js/enhance";

enhance({
  "textarea[data-autogrow]": (textarea) => {
    const controller = new AbortController();

    function resize() {
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    }

    textarea.addEventListener("input", resize, { signal: controller.signal });
    resize();

    return () => {
      controller.abort();
      textarea.style.height = "";
    };
  },
});
```

## Ajax Forms

Keep the native form as the baseline: set `action`, `method`, fields, and submit
buttons normally. The enhancer can intercept submission only when JavaScript is
available.

```js
import enhance from "actual-css/js/enhance";

enhance({
  "form[data-ajax]": (form) => {
    const controller = new AbortController();

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const submitter = event.submitter;
      const data = new FormData(form, submitter);
      const response = await fetch(form.action, {
        method: form.method || "GET",
        body: form.method.toUpperCase() === "GET" ? null : data,
        signal: controller.signal,
      });

      form.dispatchEvent(new CustomEvent("actual:ajax", {
        bubbles: true,
        detail: { response },
      }));
    }, { signal: controller.signal });

    return () => controller.abort();
  },
});
```

For htmx-like fragment swaps, keep the first version narrow: one trigger, one
target, one swap rule. If the behavior grows into history management, out-of-band
swaps, request queues, and event policies, use a dedicated library.

```js
import enhance from "actual-css/js/enhance";

enhance({
  "[data-get][data-target]": (trigger) => {
    const controller = new AbortController();

    trigger.addEventListener("click", async () => {
      const target = document.querySelector(trigger.dataset.target);
      if (!target) return;

      const response = await fetch(trigger.dataset.get, {
        signal: controller.signal,
      });
      target.innerHTML = await response.text();
    }, { signal: controller.signal });

    return () => controller.abort();
  },
});
```

## Form Validation

`actual-css/js/validation` is part of the default runtime (`actual-css/js`)
and also importable on its own — it is an enhancer, not a validation framework.
Forms opt in with `.needs-validation`; the behavior registers automatically when
the runtime loads. Native HTML constraint validation runs first, then the
enhancer adds `aria-invalid="true"` to invalid fields on submit,
focuses the first invalid field, and dispatches a bubbling `actual:invalid`
event with `{ form, firstInvalid, message }`. Valid fields are not marked
automatically.

```html
<form class="needs-validation" data-validation-message="Please check the fields.">
  <input class="input" name="email" type="email" required
         aria-describedby="email-error" />
  <span class="field-error" id="email-error">Enter a valid email.</span>
</form>

<div class="status-bar" data-status role="status" aria-live="polite" aria-atomic="true"></div>
```

The status bar auto-wires to `actual:invalid`: the form's `data-validation-message`
appears with the `danger` intent, no manual listener. To handle the summary
yourself instead, omit the status import and listen for the event:

```js
document.addEventListener("actual:invalid", (event) => {
  const { firstInvalid, message } = event.detail;
  // route message to your own surface
});
```

Custom rules go in `data-validation-rules` and resolve through
`FormValidator.registerRule`. The library never performs network validation;
server errors flow back through `FormValidator.setErrors(form, { name: message })`
and `FormValidator.clearFieldError(field)`.

```js
import { FormValidator } from "actual-css/js/validation";

FormValidator.registerRule("slug", (value) =>
  value.length === 0 || /^[a-z0-9-]+$/.test(value)
);

// after an AJAX submit the server reports field errors
FormValidator.setErrors(form, { email: "Already taken" });
```
