# Mark sweep

Mark Sweep wipes a highlight in behind a phrase the first time it enters the viewport, using the same colors as `<mark>`.

> **Module** — import `actual-css/css/effects/mark-sweep` and `actual-css/js/in-view`, or the `actual-css/css/effects` and `actual-css/js/full` bundles.

```html demo
<p>Ship the <mark class="mark-sweep" data-enhance="in-view">small parts</mark> that carry the interface.</p>
```

**Related terms:** highlighter, marker, text highlight, annotation, highlight on scroll.

`<mark>` means the phrase is relevant in its context. Keep it for that meaning; use `.mark-sweep` when the highlight is decoration and the text is an ordinary span.

At rest the phrase carries the full highlight, so no JavaScript, reduced motion, and print all show the same readable text. `data-enhance="in-view"` adds `is-pending` while the phrase waits off screen; the sweep then grows the background from the reading direction's start edge. The transition is declared on the base state, so it is defined when the class is removed.

## Usage

Try the [Appearance effects catalogue](../../demo/templates/appearance.html#mark)
to replay highlights in theme colors and both reading directions.

- Load the runtime with `actual-css/js/full`, or register only `actual-css/js/in-view`.
- Put the token and class on the phrase itself, not on the surrounding paragraph: the observer measures the highlighted box.
- The sweep is one-shot. Use it for a few phrases per page; a paragraph where every other word sweeps reads as an effect demo, not as writing.
- The base `<mark>` pair comes from the theme. An intent class on the same element gives the sweep a soft tint with theme text: `.primary`, `.secondary`, `.success`, `.warning`, `.danger`, or `.neutral`. The tint uses `--soft-bg-mix`; without `color-mix()`, the theme highlight pair remains.
- Forced colors replaces the sweep with the system `Mark` / `MarkText` pair, so the phrase stays distinct on both `<mark>` and `<span>`.

See [In view](../enhancements/in-view.md) for trigger margins, pending state,
and immediate appearance on keyboard focus.

```html demo
<p>
  A <mark class="mark-sweep warning" data-enhance="in-view">deadline</mark> is a fact;
  an <mark class="mark-sweep primary" data-enhance="in-view">idea worth keeping</mark>
  is a decision.
</p>
```

### Hooks

- `--mark-sweep-duration` — time for the highlight to cross the phrase.
- `--mark-bg`, `--mark-fg` — the highlight pair, shared with base `<mark>`; set them on a theme or on an element for a local color. Keep the text legible against both the highlight and the uncovered surface during the sweep.
