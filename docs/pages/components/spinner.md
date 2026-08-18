# Spinner

> Loading indicator for actions or regions that may take noticeable time.

- Most actions do not need a spinner. Use `disabled` alone for fast actions or to prevent duplicate submissions.
- Use `aria-busy="true"` with a loading label for actions that are visibly in progress.
- Add `.spinner` only when the operation may take long enough that users need explicit loading feedback.
- The spinner uses `currentColor`, so it adapts to its context.
- Decorative spinners should be `aria-hidden="true"`.
- Use `role="status"` with accessible text when the loading state needs to be announced.
- Put a direct last-child `.spinner` inside a busy region to show a centered loading overlay. In buttons, spinners remain inline.

## Class reference

| Class | Kind | Description |
|---|---|---|
| `.spinner` | Component | Circular loading indicator using `currentColor`. |
| `.sm` / `.lg` | Size | Smaller (`0.75em`) or larger (`2rem`) spinner. |
| Shared intents | Intent | `.primary`, `.secondary`, `.success`, `.warning`, `.danger` color. |

## Basic usage

```html demo
<span class="spinner"></span>
<span class="spinner sm primary"></span>
<span class="spinner lg danger"></span>
```

In buttons, the spinner stays inline and inherits the button size.

```html demo
<button class="btn primary" type="submit" aria-busy="true" disabled>
  <span class="spinner" aria-hidden="true"></span>
  Saving…
</button>
```

A direct last-child `.spinner` in a busy container becomes a centered overlay.

```html demo
<article class="card" aria-busy="true" aria-label="Loading card content">
  <hgroup>
    <h3>Card Title</h3>
    <p class="muted">Card description goes here.</p>
  </hgroup>

  <p>This is the card content. It can contain any HTML.</p>

  <footer class="cluster">
    <button class="btn outline" disabled>Cancel</button>
    <button class="btn" disabled>Save</button>
  </footer>

  <span class="spinner lg" aria-hidden="true"></span>
</article>
```

Announce the loading state when it needs to be spoken.

```html demo
<div role="status">
  <span class="spinner" aria-hidden="true"></span>
  <span class="sr-only">Loading results</span>
</div>
```

Size follows the font (`1em`); use `.sm` / `.lg` rather than sizing it directly.

## Busy state

A container-wide loading state that keeps the underlying content in place. It is
driven by `aria-busy="true"` plus a direct last-child `.spinner` — there is no
separate `.busy` class. The spinner is shown as a centered overlay over a faded
surface; buttons keep their spinners inline instead (see Button).

- Set `aria-busy="true"` on the container and add `<span class="spinner" aria-hidden="true"></span>` as its last direct child.
- The overlay uses `--busy-overlay-bg`; components like `.card.inverted` already compose with it.
- Decorative spinners stay `aria-hidden="true"`; announce progress on the region with `role="status"` and a label when needed.

```html demo
<article class="card" aria-busy="true" aria-label="Loading card content">
  <h3>Card Title</h3>
  <p>This is the card content.</p>
  <span class="spinner" aria-hidden="true"></span>
</article>
```

## CSS hooks

- `--spinner-track` — the ring color.
- `--spinner-value` — the moving gap; swap the two for an inverted spinner.
- `--busy-overlay-bg` — background of the busy overlay. Components such as
  `.card.inverted` override it to blend with their surface.
