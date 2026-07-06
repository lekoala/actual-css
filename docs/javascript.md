# JavaScript

## Overview

> Small progressive enhancers that attach to semantic HTML and clean themselves up when the DOM changes.

Actual's JavaScript modules are optional. Importing `actual-css/js` registers the
full runtime; importing a specific module registers only that behavior.

```js
import "actual-css/js";
import "actual-css/js/dialog";
import "actual-css/js/filter";
import "actual-css/js/mask";
```

The runtime does not require `DOMContentLoaded` or manual init calls. Each module
uses the shared `enhance()` lifecycle helper: initial matching elements are
connected, inserted matching elements are connected later, and removed elements
run cleanup.

`enhance()` observes DOM insertions and removals, not attribute changes. If an
already-connected element receives a behavior attribute later, call the returned
`refresh(node)` handle or reinsert the element.

## Extending The Runtime

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
