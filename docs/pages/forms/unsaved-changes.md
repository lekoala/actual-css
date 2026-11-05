# Unsaved Changes

> Track whether a form holds data that differs from what was last saved.

**Related terms:** dirty form, modified form, unsaved edits, leave page warning, discard changes.

## Dirty state

Opt in with `data-enhance="dirty"` on the form. While the data it would submit
differs from its baseline, the form carries `data-dirty`. The baseline is the
data present when the form is enhanced.

```html demo
<form class="stack" data-enhance="dirty">
  <label class="field">
    <span class="field-label">Name</span>
    <input class="input" name="name" value="Alice" />
  </label>
  <div class="cluster form-actions">
    <button class="btn primary" type="submit">Save</button>
    <button class="btn neutral outline" type="reset">Reset</button>
  </div>
</form>
```

Style the state from application CSS, for example a hint shown only while there
is something to save:

```css
form:not([data-dirty]) .save-hint { visibility: hidden; }
```

The comparison covers what a submission would send: disabled and unnamed
controls do not count, controls associated through `form="…"` and
form-associated custom elements do. Add `data-dirty-ignore` to a control to
leave its name out, such as a CSRF token. Files compare by name, size and
modification time.

Each comparison fires the form's `formdata` event. An entry a listener adds
there counts too, so a volatile one (a nonce) keeps the form dirty: give it the
name of a hidden `data-dirty-ignore` input.

`actual:dirty-change` bubbles from the form after each transition, with
`{ form, dirty }`. It reports the state and cannot be canceled.

The module is part of the full runtime and importable on its own as
`actual-css/js/dirty`. It works alongside `validation` and never submits the
form or blocks navigation.

## After saving

A native submission reloads the page and the new form starts clean. When the
form stays on the page, tell the module what was saved:

```js
import { FormDirty } from "actual-css/js/dirty";

const snapshot = FormDirty.capture(form); // when the request starts
// … request succeeds …
FormDirty.markClean(form, snapshot);
```

Passing the snapshot keeps edits made during the request dirty. Without one,
`markClean()` accepts the current data. A failed or rejected save should not
call it.

Edits through events update the state on their own. After setting values or
adding controls from code, call `FormDirty.refresh(form)`. A widget with no
form control of its own (a canvas, a sortable list) marks the form dirty by
writing its state to a hidden input, then calling `refresh()`.

Reset restores the HTML default values, which are the baseline only until the
first `markClean()`. A removed and reinserted form keeps its baseline. A form
replaced by new server markup starts a new one, even when the save failed.

The [Ajax forms recipe](../guides/progressive-enhancement.md#ajax-forms) wires
the snapshot for you.

## Autosave

Save a `form[data-autosave]` after a pause in typing, without a submit
button. The form keeps its `action` and `method`, so it still saves without
JavaScript.

```html
<form class="stack" action="/notes" method="post" data-enhance="dirty" data-autosave>
  <label class="field">
    <span class="field-label">Notes</span>
    <textarea class="input" name="notes" required></textarea>
  </label>
  <p class="muted" aria-hidden="true">
    <span data-autosave-when="dirty">Saving…</span>
    <span data-autosave-when="clean">All changes saved</span>
  </p>
  <noscript><button class="btn primary" type="submit">Save</button></noscript>
</form>
```

```css
form[data-dirty] [data-autosave-when="clean"],
form:not([data-dirty]) [data-autosave-when="dirty"] { display: none; }
```

```js
import { FormDirty } from "actual-css/js/dirty";
import { status } from "actual-css/js/status";

const DELAY = 1500; // idle time before saving
const timers = new WeakMap();

const schedule = (form) => {
  clearTimeout(timers.get(form));
  timers.set(form, setTimeout(() => save(form), DELAY));
};

async function save(form) {
  if (!form.hasAttribute("data-dirty")) return;
  if (form.getAttribute("aria-busy") === "true") return; // the running save reschedules
  // checkValidity() stays silent; requestSubmit() would show errors mid-typing.
  if (!form.checkValidity()) return;

  const snapshot = FormDirty.capture(form);
  form.setAttribute("aria-busy", "true");
  try {
    const response = await fetch(form.action, { method: form.method, body: new FormData(form) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    FormDirty.markClean(form, snapshot);
    if (form.hasAttribute("data-dirty")) schedule(form); // typed during the request
  } catch {
    status("Changes not saved. Check your connection.", { intent: "danger" });
  } finally {
    form.removeAttribute("aria-busy");
  }
}

document.addEventListener("input", ({ target }) => {
  if (target.form?.matches("[data-autosave]")) schedule(target.form);
});
```

- Edits made during a request stay dirty and trigger the next save.
- Invalid data is never saved. The form stays dirty until it becomes valid.
- A failed save is not retried in a loop. The next edit tries again, and the
  warning below still protects the page.
- The status bar reports failures only. Announcing every successful save
  would interrupt screen readers at each pause; the inline state is hidden
  from them for the same reason.

## Warning before leaving

The module does not guard navigation. This recipe asks for confirmation when
the page unloads with a dirty form, except the one being submitted natively:

```js
let lastSubmit = null;
// Read at unload time, once every submit listener has had its say: a
// canceled submission (validation, Ajax), a dialog close or a submission into
// another window or frame does not leave.
const leavesBySubmit = (form) => {
  if (lastSubmit?.target !== form || lastSubmit.defaultPrevented) return false;
  const { submitter } = lastSubmit;
  const method = submitter?.getAttribute("formmethod") || form.method;
  const target = submitter?.getAttribute("formtarget") || form.target;
  if (target && !["_self", "_top", "_parent"].includes(target)) return false;
  return method.toLowerCase() !== "dialog";
};
const guard = (event) => {
  for (const form of document.querySelectorAll("form[data-dirty]")) {
    if (leavesBySubmit(form)) continue;
    event.preventDefault();
    event.returnValue = true; // Chromium before 119
    return;
  }
};

document.addEventListener("submit", (event) => { lastSubmit = event; });
addEventListener("pageshow", () => { lastSubmit = null; });

// Register only while needed: some browsers skip the back/forward cache for
// pages that listen to beforeunload.
document.addEventListener("actual:dirty-change", () => {
  if (document.querySelector("form[data-dirty]")) addEventListener("beforeunload", guard);
  else removeEventListener("beforeunload", guard);
});
```

`beforeunload` covers reloads, closing the tab and full-page navigation.
Navigation inside the page (a client router, a region swap) does not fire it:
guard it in that router. Mobile browsers may skip the prompt when the page is
discarded in the background. A submission answered with a download keeps the
page, but the recipe cannot tell in advance: that form stays unguarded until
the next submission.
