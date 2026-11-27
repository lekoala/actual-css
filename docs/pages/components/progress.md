# Progress

> Indeterminate or determinate indicator of task completion.

```html demo
<div class="stack">
  <progress class="progress" aria-label="Upload progress" value="60" max="100"></progress>
  <progress class="progress" aria-label="Download progress" value="30" max="100"></progress>
  <progress class="progress" aria-label="Export progress" value="90" max="100"></progress>
  <progress class="progress" aria-label="Preparing report"></progress>

  <section aria-busy="true" aria-describedby="upload-progress">
    <h2 id="upload-label">Uploading files</h2>
    <progress class="progress" id="upload-progress" aria-labelledby="upload-label"
              value="60" max="100">60%</progress>
  </section>
</div>
```

## Usage

- Use `<progress class="progress">` for task completion and a [meter](meter.md)
  for a measurement within a fixed range, such as current disk usage.
- Set `value` and `max` when work completed can be measured. Omit `value`
  while the amount is unknown, or use a [spinner](spinner.md) when a compact
  pending indicator is enough.
- Name the task with a `<label>`, `aria-labelledby` or `aria-label`.
  For a busy region, point its `aria-describedby` at the progress bar.

## CSS hooks

- `--progress-track` — unfilled track color.
- `--progress-value` — filled bar color. Prefer an intent class over setting this directly.
- `--bar-height` — bar thickness, shared with `.meter`.
- `--bar-radius` — corner of the track and the value, shared with `.meter`; `0` squares the bar.
- `--progress-border` — a full `border` shorthand around the track, unset by default. The edge
  sits inside `--bar-height`.

`.sm` / `.lg` are intentionally not supported: a bar keeps its inline size and only changes
thickness, and a design asks for a 4px or a 12px bar, not for a "small" one. Set the hook
on the element, or better, on an application class.

```css
.upload-progress {
  --bar-height: 0.375rem;
}
```
