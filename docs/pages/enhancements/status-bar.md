# Status Bar

> Singleton floating area for short, non-critical, transient feedback.

A status bar is a single live region, not a stacked toaster. New messages
replace the previous one. Keep one element in the HTML, styled with
`.status-bar` and carrying the `[data-status][role="status"]` contract that the
runtime targets, empty by default.

- JavaScript only updates its text content; it shows when non-empty and hides when empty, while staying available as a live region.
- Use it for transient status (`Saved.`, `Reconnected.`, `Copied.`). Critical, persistent, or actionable information belongs in `.alert`, inline messages, or dialogs.
- Intents: `danger`, `success`, `warning`, `neutral`. The default (no intent) is a neutral dark pill.

The runtime auto-wires the status bar to Actual's form validation: a form that
fails to submit shows its `data-validation-message` in the status bar with the
`danger` intent. No target in the DOM means the call is a no-op, so the markup
stays optional.

```html demo
<form class="needs-validation" data-enhance="validation" data-validation-message="Please check the highlighted fields.">
  <label class="field">
    <span class="field-label">Email</span>
    <input class="input" type="email" name="email" required
           aria-describedby="sb-email-error" />
    <span class="field-error" id="sb-email-error" role="alert">Enter a valid email.</span>
  </label>
  <div class="form-actions">
    <button class="btn primary" type="submit">Submit</button>
  </div>
</form>
```

Submitting the empty form blocks submission and shows `data-validation-message`
in the status bar below — no JavaScript required beyond the runtime.

```html demo
<div class="cluster">
  <button class="btn" type="button" commandfor="sb-status" command="--status"
          aria-controls="sb-status"
          data-status-message="Saved." data-status-intent="success">Show success</button>
  <button class="btn" type="button" commandfor="sb-status" command="--status"
          aria-controls="sb-status"
          data-status-message="Could not save." data-status-intent="danger"
          data-status-duration="6000">Show danger</button>
  <button class="btn outline" type="button" commandfor="sb-status" command="--status-clear"
          aria-controls="sb-status">Clear</button>
</div>

<div class="status-bar" data-status id="sb-status" role="status" aria-live="polite" aria-atomic="true"></div>
```

No script required beyond the runtime: `command="--status"` reads its message
from `data-status-message` (plus optional `data-status-intent` /
`data-status-duration`), `command="--status-clear"` empties the bar.
`commandfor` must match the status bar's own `id`.

For dynamic messages — a fetch response, a computed value — dispatch the same
event the commands use under the hood:

```js
document.dispatchEvent(new CustomEvent("actual:status", {
  bubbles: true,
  detail: { message: "Saved.", intent: "success" },
}));
```

## CSS hooks

- `--status-bg` — bar background.
- `--status-fg` — bar text color.

Prefer an intent class over setting these directly.
