# Progress

> Indeterminate or determinate indicator of task completion.

- Use native `<progress class="progress">`.
- Shares meter styling DNA.
- Supports indeterminate progress by omitting `value`.
- Can be connected to a busy region with `aria-describedby`.
- Never self-close `<progress>`.

```html demo
<div class="stack">
  <progress class="progress" value="60" max="100"></progress>
  <progress class="progress" value="30" max="100"></progress>
  <progress class="progress" value="90" max="100"></progress>
  <progress class="progress"></progress>

  <section aria-busy="true" aria-describedby="upload-progress">
    <h2>Uploading files</h2>
    <progress class="progress" id="upload-progress" value="60" max="100">60%</progress>
  </section>
</div>
```

## CSS hooks

- `--progress-track` — unfilled track color.
- `--progress-value` — filled bar color. Prefer an intent class over setting this directly.
- `--bar-height` — bar thickness, shared with `.meter`.
