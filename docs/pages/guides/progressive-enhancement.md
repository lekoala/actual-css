# The JavaScript Runtime

> The optional JavaScript runtime that progressively enhances Actual's semantic markup — self-registering side-effect modules, the `enhance()` DOM lifecycle, stateless command routing, and the floating and surface contracts for custom widgets.

Actual's JavaScript modules are optional. Importing `actual-css/js/full`
registers the full runtime — every built-in enhancer, including
validation and status. Importing `actual-css/js` registers only the enhancement
manifest loader; importing a specific module registers only that behavior. The
runtime does not require `DOMContentLoaded` or manual init calls, and it never
touches `window`: there is no global object to call into.

## Browser support

The runtime targets the **Minimal** browser tier. Browsers in the Degraded tier
may still run some enhancements, but JavaScript behavior below Minimal is
unsupported — it is not tested, documented as supported, or preserved when the
runtime evolves. The runtime assumes the modern platform primitives available
across Minimal and ships no compatibility layer or polyfill.

| Tier        | Firefox  | Safari  | Chromium |
| ----------- | -------- | ------- | -------- |
| Degraded    | 78+      | 14+     | 88+      |
| **Minimal** | **125+** | **17+** | **116+** |
| Recommended | 129+     | 17.5+   | 123+     |

The floor is set by the native manual Popover transport (`popover="manual"`,
`showPopover()`, `hidePopover()`), which interactive surfaces use to promote a
panel to the top layer without moving it in the DOM. The tier definitions live
in the browser-support design note.

## Overview

All JS modules are side-effect modules: importing them registers behavior
automatically. There is no init call, public global object, or configuration.
This keeps imports declarative and tree-shakeable.

```js
import "actual-css/js";
import "actual-css/js/dialog";
import "actual-css/js/filter";
import "actual-css/js/mask";
```

Components with a real element lifecycle use the shared `enhance()` helper:
initial matching elements are connected, inserted matching elements are connected
later, and removed elements run cleanup. Declarative `command` / `commandfor`
actions use a single delegated click listener instead; triggers and targets are
never tracked.

`enhance()` observes DOM insertions and removals, not attribute changes. If an
already-connected element receives a behavior attribute later, call the returned
`refresh(node)` handle. Behavior attributes are setup-time contracts: removing
one does not disconnect an active behavior. If an application needs a live
enable/disable switch, keep that state inside its enhancer and clean it up when
the element leaves the DOM.

Modules are safe to import during SSR — registration is a no-op when there is no
DOM. The runtime remains active until the page unloads; there is no teardown
handle, and cleanup happens per element when an element leaves the DOM.

## The full runtime

Loading `dist/actual.full.js` as a plain `<script>` (no `type="module"`, no
bundler, no `import`) gets the full runtime. Static HTML that needs to trigger
something from its own inline `<script>` dispatches the module's public event
instead of calling into a global — `actual:status` for the status bar, for
example:

```html
<script src="actual.full.js"></script>
<script>
  document.dispatchEvent(new CustomEvent("actual:status", {
    bubbles: true,
    detail: { message: "Saved.", intent: "success" },
  }));
</script>
```

| Module                             | Behavior                                                    |
| ---------------------------------- | ----------------------------------------------------------- |
| `actual-css/js/flyout`             | Trigger → panel positioning and open/close (token `flyout`) |
| `actual-css/js/context-menu`       | Context menus on `data-context-menu`                        |
| `actual-css/js/focus-group`        | Reusable roving-focus controller; no automatic discovery    |
| `actual-css/js/dialog`             | Native `<dialog>` behavior, focus management, dismissal     |
| `actual-css/js/dismiss`            | The generic `--dismiss` command                             |
| `actual-css/js/tab`                | Tab panels and arrow-key navigation (token `tabs`)          |
| `actual-css/js/tooltip`            | Tooltips on `data-tooltip`                                  |
| `actual-css/js/scrollspy`          | Scroll-driven nav highlighting (token `scrollspy`)          |
| `actual-css/js/filter`             | Input value filtering on `data-filter`                      |
| `actual-css/js/mask`               | Input masks on `data-mask`                                  |
| `actual-css/js/password`           | Password reveal toggle                                      |
| `actual-css/js/validation`         | Form validation (token `validation`)                        |
| `actual-css/js/status`             | Singleton status bar on `[data-status][role="status"]`      |
| `actual-css/js/enhancement-loader` | Declared enhancement manifests                              |

The enhancement loader reads its manifests from `data-enhance-modules` or the
`Enhance-Modules` header.

Use `actual-css/js/full` for demos, playgrounds, and smoke tests where one import
enables every built-in behavior. Production apps can import individual modules
such as `actual-css/js/validation` or `actual-css/js/status` when only those are
needed.

## Using the runtime with another CSS framework

The JS is designed to run on its own, without Actual's stylesheet.

- **`data-enhance` tokens** register root-controller behaviors. The runtime
  discovers components through `data-enhance="tabs"`, `data-enhance="flyout"`,
  `data-enhance="scrollspy"`, and `data-enhance="validation"` — no Actual
  presentation class needed. Self-describing attributes (`data-mask`,
  `data-tooltip`, `data-context-menu`) stay framework-neutral by construction.
- **`selectors.js`** lists the state classes the runtime *writes* (`is-open`,
  `was-validated`, `is-sheet`, …). Edit this file (or alias it in a bundler) to
  match a different CSS framework's state vocabulary. It is a read-side-only
  adapter — it does not bridge CSS class names to JS initialization.
- **One documented exception:** validation reads `.field-error` (or its alias
  `[data-field-error]`) and the optional `.field` ancestor to connect error
  slots and toggle danger state. Both are read-side presentation adapters that
  degrade to no-op under foreign CSS — `aria-invalid`, focus management, custom
  rules, and server errors all keep working without them.
- **status.js** uses `[data-status][role="status"]` — semantics, not a class.
  Its `intent` option applies whatever class names the caller passes, so
  `.danger`, `.success`, and the rest of intents.css are never hardcoded.

## The runtime as a primitive kit

For building custom widgets (select, tags, date picker) on Actual's primitives,
see the widget-primitives design note. Every Actual runtime primitive subpath is
published in `package.json#exports`:

| Subpath                 | Purpose                                                          |
| ----------------------- | ---------------------------------------------------------------- |
| `actual-css/js/enhance` | DOM lifecycle engine: `enhance()`, `registerEnhancement`, tokens |
| `actual-css/js/escape`  | Per-document LIFO Escape dismissal stack                         |
| `actual-css/js/events`  | The `actual:*` event name constants                              |
| `actual-css/js/focus`   | Focusable-item lookup and helpers                                |
| `actual-css/js/keys`    | Roving-focus item navigation helpers                             |
| `actual-css/js/menu`    | Menu keyboard/click wiring, item vocabulary                      |
| `actual-css/js/surface` | Surface lifecycle (`openSurface`, `closeSurface`, …)             |

The exports map is explicit — it *is* the statement of what is public.

## Floating contract

`floating` is a positioning-only primitive with zero CSS dependency: no
`classList`, no `selectors.js` import, no Actual class anywhere. `reposition()`
computes and writes inline `left`/`top`, `data-placement`,
`--available-height`, and `--arrow-x`/`--arrow-y` on the floating element. The
caller owns the floating element's presentation entirely.

```js
import { autoUpdate, reposition, repositionAt } from "@lekoala/floating";

const stop = autoUpdate(trigger, float, () => {
  reposition(trigger, float, { placement: "bottom-start", distance: 4 });
});
```

Options passed to `reposition()`:

| Option         | Default          | Contract                                     |
| -------------- | ---------------- | -------------------------------------------- |
| `placement`    | `"bottom-start"` | Preferred side and alignment                 |
| `distance`     | `0`              | Gap from the reference element               |
| `flip`         | `true`           | Flip when the preferred side is out of view  |
| `shift`        | `true`           | Shift along the cross axis to stay in bounds |
| `shiftPadding` | `4`              | Minimum space kept from the boundary         |
| `scope`        | viewport         | Boundary element for overflow decisions      |

`placement` takes a `-start` or `-end` alignment suffix.

`@lekoala/floating` is the standalone positioning dependency used by the
runtime. `autoUpdate(reference, float, callback)` batches scroll, resize, and
element-resize callbacks per document and returns a stop handle; it observes
both the reference and floating element while the surface is open. Pass `null`
as the reference for point-positioned surfaces. It does not keep a closed or
hidden element positioned. `repositionAt(x, y, float, opts)` positions relative
to a fixed point — used by context menus.

A third-party widget importing only `@lekoala/floating` with no Actual stylesheet
must be able to position a listbox under an input — that is the test.

## Surface contract

`surface` has documented presentation coupling. A foreign consumer must supply
or account for:

```css
.my-panel          { position: absolute; }
.my-panel[popover] { inset: auto; margin: 0; }
.my-panel[popover]:not(:popover-open) { display: none; }
/* surface.js sets position: fixed + inline left/top on open —
   do not override with !important */
/* no z-index: an open panel is promoted to the top layer, where
   numbers do not apply — see Layering in foundations/tokens */
/* .is-open / .is-sheet / .surface-backdrop are written by surface.js
   — style or ignore them */
/* --surface-anchor-width is set while an open surface is positioned */
/* data-actual-surface is written by surface.js for teardown
   — never select on it */
```

Three non-obvious requirements:

1. `surface.js` writes `popover="manual"` and removes `hidden`: the panel is
   promoted to the top layer where it stands, never reparented, and the closed
   state belongs to the platform. `.is-open` is the state the runtime writes
   and the only one to key styles on.
2. A panel that declares its own `display` must restore `display: none` for the
   closed popover. An author declaration outranks the UA origin whatever the
   specificity, so a bare `display: grid` leaves a closed panel painted at its
   static position.
3. The open state switches to `position: fixed` with measured inline
   coordinates, and the UA's own `inset` / `margin` must be cleared.

Lifecycle: `prepareSurface` → `openSurface` → `closeSurface` →
`disconnectSurface`. `retainSurface(panel)` reference-counts a surface shared by
several triggers and returns a release function; `isSurfaceOpen` and
`getSurfaceAutoClose` read current state. The separate `escape` primitive adds
visible dismissable UI to the shared per-document Escape stack.

`openSurface(menu, opts)` dispatches a cancelable `actual:surface-open` event —
widgets can veto or decorate opens, and context menus inject their own
`source`/`restoreFocusTo` through it.

| Option            | Default          | Contract                                    |
| ----------------- | ---------------- | ------------------------------------------- |
| `trigger`         | —                | Anchoring element, and focus-restore target |
| `source`          | —                | Alternate anchor when there is no trigger   |
| `x`, `y`          | —                | Position at a fixed viewport point          |
| `placement`       | `"bottom-start"` | Preferred placement                         |
| `distance`        | `4`              | Gap between anchor and surface              |
| `flip`            | `true`           | Flip when the preferred side is hidden      |
| `shift`           | `true`           | Shift to stay within the boundary           |
| `shiftPadding`    | `4`              | Minimum space kept from the boundary        |
| `scope`           | viewport         | Boundary element                            |
| `mobile`          | `"auto"`         | Sheet behavior                              |
| `breakpoint`      | `768`            | Max viewport width for an automatic sheet   |
| `autoClose`       | `"outside"`      | Which clicks close the surface              |
| `dismissOnScroll` | `false`          | Close on a scroll the user just started     |
| `restoreFocusTo`  | `trigger`        | Element focused on close                    |

`x`, `y` replace the anchor entirely, which is what a context menu needs.
`mobile` takes `"auto"`, `"sheet"`, `"none"` or `"anchored"`.

`autoClose` takes `"true"` to close on inside and outside clicks, `"inside"` or
`"outside"` to limit it to one side, and `"false"` to disable automatic click
closing; an invalid value reads as `"true"`.

`dismissOnScroll` only fires when the scroll follows a new user input — the
scroll that opening or focusing causes is ignored. `restoreFocusTo` falls back
to `source` when there is no `trigger`.

The click policy belongs to the surface rather than to a particular menu
anatomy. The generic primitive defaults to outside-click dismissal; flyout and
context-menu choose `"true"` as their component default. A descendant carrying
`data-flyout-close` closes its surface regardless of that policy. A custom
widget that owns selection without dismissing — such as a combobox listbox —
can keep the primitive default or open with `autoClose: "false"`.

Extension seam: a `[role="listbox"]` surface with `[role="option"]` children
gets no menu keyboard handling or inside-click dismissal by default.
`[role="option"]` is deliberately not in the menu-item vocabulary — a combobox
reuses the surface lifecycle while retaining full control of its own keyboard
and selection.

## Events

The runtime dispatches a small set of public `actual:*` events. All are
listenable on the document; cancelable events veto the associated action when
`preventDefault()` is called.

| Event                  | Dispatch                       | `detail`                             |
| ---------------------- | ------------------------------ | ------------------------------------ |
| `actual:surface-open`  | before a surface opens         | `{ surface, options }`               |
| `actual:context-menu`  | before a context menu opens    | `{ menu, context, origin, trigger }` |
| `actual:status`        | status module, or any code     | `{ message, intent, duration }`      |
| `actual:invalid`       | after a submit was blocked     | `{ form, firstInvalid, message }`    |
| `actual:dialog-cancel` | before a native cancel close   | `{ dialog, sourceEvent }`            |
| `actual:dismiss`       | after `--dismiss` hid a target | `{ trigger }`                        |

`actual:surface-open`, `actual:context-menu` and `actual:dialog-cancel` are
cancelable. `actual:status` both shows and clears the status bar — omit
`message` to clear it.

## Extending the runtime

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

The default resolver `targetFor(trigger)` looks up `commandfor` by ID in the
trigger's document or shadow root. Supply `resolve(trigger)` to validate or
replace that lookup. An optional idempotent `prepare(trigger, target, command)`
callback runs directly before `handle`; built-in behaviors use it for
target-derived semantics. `commandSelector(commands)` builds the matching button
selector. The returned handle has an idempotent `disconnect()` method for
applications that unload the module owning the command.

### Dismiss command

The runtime includes a generic `--dismiss` command for hiding any resolved
target. It prevents the trigger's default action, sets `hidden`, and emits a
bubbling `actual:dismiss` event with the trigger in `event.detail.trigger`.

```html demo
<section id="notice" class="alert">
  <p>Changes saved.</p>
  <button type="button" commandfor="notice" command="--dismiss">
    Dismiss
  </button>
</section>
```

Listen for `actual:dismiss` when application code needs to remove persisted
state or perform another action after the target is hidden.

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

### Named behavior registration

Use `registerEnhancement()` when author markup opts in with a `data-enhance`
token instead of an app-specific attribute. A third-party behavior registers
exactly like a built-in one:

```js
import { registerEnhancement } from "actual-css/js/enhance";

registerEnhancement("autosubmit", (form) => {
  const controller = new AbortController();

  form.addEventListener("change", () => form.requestSubmit(), {
    signal: controller.signal,
  });

  return () => controller.abort();
});
```

```html
<form data-enhance="validation autosubmit">
```

`enhancementSelector(name)` returns the matching `[data-enhance~="name"]`
selector (names must match `[a-z][a-z0-9-]*`), and `hasEnhancement(el, name)`
tests it. No core module list is modified — the regression test in
`tests/enhance.test.js` proves the shape.

A name is owned once per root: a second `registerEnhancement("autosubmit", …)`
on the same root throws, and `disconnect()` releases the name so it can be
registered again. A custom root passed as the third argument must be disposed
by its owner; the default `document.documentElement` root is not affected.

### Enhancement manifests

The enhancement-loader lets a server (or static HTML) declare document-wide
enhancement modules that are imported lazily. A manifest is a JSON object
mapping enhancement names to module URLs, declared in a script block or an
HTTP header. `index.js` wires `watchEnhancementManifests()` into the default
runtime.

```html
<script type="application/json" data-enhance-modules>
  { "autosubmit": "/js/autosubmit.js" }
</script>
```

```js
import { loadEnhancement, loadEnhancements, loadResponse } from "actual-css/js/enhancement-loader";

await loadEnhancements(); // every manifest block in the document
await loadEnhancement("autosubmit", "/js/autosubmit.js");
const response = await fetch("/...");
await loadResponse(response); // Enhance-Modules header
```

The `Enhance-Modules` HTTP header carries the same JSON object. Loaded modules
register on the default document root and must export a default function. An
optional exported `prepare()` runs first for asynchronous setup and receives
`{ resolve, loadScript, loadStyle }`:

```js
// autosubmit.js — declared module
export async function prepare({ resolve, loadStyle }) {
  await loadStyle(resolve("./autosubmit.css"));
}

export default function autosubmit(form, { config, signal, emit }) {
  const max = config.max ?? 3; // from data-enhance-config

  form.addEventListener("change", () => form.requestSubmit(), { signal });
}
```

```html
<form data-enhance="autosubmit"
      data-enhance-config='{ "max": 3 }'>
```

`data-enhance-config` is parsed with `parseConfig`: strict JSON first, with a
tiny relaxed subset (unquoted keys, single-quoted strings) as a fallback. The
connect function receives the element plus `{ config, signal, emit }`; `emit`
dispatches `actual:<name>:<type>` events. Connect must be synchronous and may
return a cleanup function or nothing; the loader owns the AbortController.

`loadScript(url)` and `loadStyle(url)` are public helpers for non-ESM assets.
Names are reserved once per manifest set — redeclaring a name from a different
URL throws, and duplicate declarations share one import promise. The
`__`-prefixed exports are test hooks, not public API.

## Lifecycle rules

- Keep selectors opt-in.
- Return cleanup for every listener, observer, timer, or pending controller.
- Prefer one `AbortController` per owned lifecycle; abortable event listeners
  are the standard cleanup mechanism for enhancer-owned listeners.
- Make the unenhanced HTML useful first, then add behavior.
- Dispatch a custom event when app code may need to react.
- Keep modules safe to import without a DOM.

## Toggle button groups

Actual styles `.btn[aria-pressed="true"]`; application code should update the
attribute. Use grouped buttons when the state belongs to the current page, not
for navigation between pages.

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

## Custom text filters

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
<input class="input" inputmode="decimal" data-app-filter="currency" autocomplete="off" />
<input class="input" inputmode="numeric" data-app-filter="time" autocomplete="off" />
```

## Textarea autogrow

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

## Ajax forms

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

## Form validation

`actual-css/js/validation` is part of the full runtime and also importable on
its own — it is an enhancer, not a validation framework. Forms opt in with the
`data-enhance="validation"` token (`.needs-validation` is a presentation class
for CSS-only `:user-invalid` feedback and does not by itself register the
behavior). Native HTML constraint validation runs first, then the enhancer adds
`aria-invalid="true"` to invalid fields on submit, focuses the first invalid
field, and dispatches a bubbling `actual:invalid` event with
`{ form, firstInvalid, message }`. Valid fields are not marked automatically.

```html demo
<form class="needs-validation" data-enhance="validation"
      data-validation-message="Please check the fields.">
  <input class="input" name="email" type="email" required
         aria-describedby="email-error" />
  <span class="field-error" id="email-error">Enter a valid email.</span>
  <button class="btn primary" type="submit">Submit</button>
</form>

<div class="status-bar" data-status role="status" aria-live="polite" aria-atomic="true"></div>
```

The status bar auto-wires to `actual:invalid`: the form's
`data-validation-message` appears with the `danger` intent, no manual listener.
To handle the summary yourself instead, omit the status import and listen for
the event:

```js
document.addEventListener("actual:invalid", (event) => {
  const { firstInvalid, message } = event.detail;
  // route message to your own surface
});
```

Custom rules go in `data-validation-rules` and resolve through
`FormValidator.registerRule`. Built-in rules are `same`, `number`, `digits`,
`alnum`, and `date`. The library never performs network validation; server
errors flow back through `FormValidator.setErrors(form, { name: message })` and
`FormValidator.clearFieldError(field)`.

```js
import { FormValidator } from "actual-css/js/validation";

FormValidator.registerRule("slug", (value) =>
  value.length === 0 || /^[a-z0-9-]+$/.test(value)
);

// after an AJAX submit the server reports field errors
FormValidator.setErrors(form, { email: "Already taken" });
```
