# Ajax Submission

> Submit a form with `fetch` and show the server's HTML answer in place.

**Related terms:** ajax form, async submit, fetch form, submit without reload, remote form.

## Usage

Opt in with `data-enhance="ajax"` on a form whose `action` and `method` work
without JavaScript. With `data-ajax-target`, the HTML answer replaces the
target's content.

```html
<form class="stack" action="/contact" method="post"
      data-enhance="validation ajax" data-ajax-target="#contact-feedback">
  <label class="field">
    <span class="field-label">Email</span>
    <input class="input" type="email" name="email" required />
  </label>
  <div class="cluster form-actions">
    <button class="btn primary" type="submit">Send</button>
  </div>
</form>
<div id="contact-feedback" role="status"></div>
```

The request carries what a native submission would: the submitter's name and
value, its `formaction`, `formmethod` and `formenctype`, files as multipart or
by name when URL-encoded, and `GET` data as the query string. It sends
`X-Requested-With: XMLHttpRequest`, so the server can answer with a fragment
instead of a page.

The browser keeps the submissions the module cannot reproduce:
`method="dialog"`, `enctype="text/plain"`, a `target`, `formtarget` or
`<base target>` other than `_self`, and an `action` on another origin.
`form.submit()` bypasses the module too; use `form.requestSubmit()`.

## Request state

While a request runs, the form and its submitter carry `aria-busy="true"`,
which picks up the [busy button](../components/button.md) styles. Add a
`.spinner` inside the button for a visible indicator, or as the form's last
child for a [busy overlay](../components/spinner.md#busy-state) that fades in
only when the request is slow; give the element `aria-busy="false"` so the
spinner stays hidden at rest, the module restores it after each request.
Further submissions are
ignored until the answer arrives; a submission left to the browser, such as a
dialog's cancel button, still goes through. Removing the form aborts its
request.

To cancel a submission, call `preventDefault()` on its `submit` event from a
listener on the form. The `validation` enhancer does so for an invalid form.

## Responses

The target is updated when the response is `text/html` with a 2xx or `422`
status, the usual status for server-rendered errors. Any other answer leaves
it alone. The answer is read as UTF-8. The target may contain the form: a
server that re-renders the whole form with its errors replaces it, and the new
form is enhanced again. A CSRF token in a hidden field is sent like any other
field; when the server issues a new token per submission, re-render the form
with the answer, or the next submission sends a spent token. A redirect, such as post/redirect/get, navigates the
page; `fetch` has already followed it, so the destination loads twice.

Every response reaches `actual:ajax-response` with
`{ form, submitter, response }`, after the target update or before a redirect
navigates; check `response.ok`. A network failure reaches `actual:ajax-error`
with `{ form, submitter, error }`. `actual:ajax-start` marks the beginning of
a request. The events bubble from the form, or from the document when the
update replaced it; listen on the document. None of them can be canceled.

```js
document.addEventListener("actual:ajax-response", ({ detail }) => {
  if (detail.response.ok) detail.form.reset();
});
```

## With unsaved changes

The module never decides that a response means "saved". With
[Unsaved Changes](unsaved-changes.md), clear the dirty state from the
application, using the data that was sent:

```js
import { FormDirty } from "actual-css/js/dirty";

const sent = new WeakMap();
document.addEventListener("actual:ajax-start", ({ detail }) => {
  sent.set(detail.form, FormDirty.capture(detail.form));
});
document.addEventListener("actual:ajax-response", ({ detail }) => {
  if (detail.response.ok) FormDirty.markClean(detail.form, sent.get(detail.form));
});
```

Edits made during the request stay dirty.

## Beyond one form

The module answers one submission with one target. Navigation, history, DOM
morphing and coordinated region updates belong to a dedicated library.
