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

## Warning before leaving

The module does not guard navigation. This recipe asks for confirmation when
the page unloads with a dirty form, except the one being submitted natively:

```js
let lastSubmit = null;
// Read at unload time, once every submit listener has had its say: a
// canceled submission (validation, Ajax) or a dialog close does not leave.
const leavesBySubmit = (form) => {
  if (lastSubmit?.target !== form || lastSubmit.defaultPrevented) return false;
  const method = lastSubmit.submitter?.getAttribute("formmethod") || form.method;
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
discarded in the background.
