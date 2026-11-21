# Form actions

> `.form-actions` is the role of the `.cluster` row that closes a form. It may
> live inside or outside the `<form>` (see Detached Actions) and has an opt-in
> sticky variant (see Sticky Actions).

`.cluster` owns the row: flex, wrap and gap. `.form-actions` adds the alignment
policy for form actions and the sticky behaviour. The space before the row
belongs to the parent layout: put `.stack` on the form.

```html demo
<form class="stack" novalidate>
  <label class="field">
    <span class="field-label">Project name</span>
    <input class="input" type="text" value="Atlas" />
  </label>

  <div class="cluster form-actions">
    <button type="button" class="btn outline">Cancel</button>
    <button type="submit" class="btn primary">Save changes</button>
  </div>
</form>
```

## CSS hooks

- `--form-actions-justify` — main-axis distribution (`justify-content`).
- `--form-actions-align` — cross-axis alignment (`align-items`).

Both are inherited role hooks: set them on a page or container to align every
form action row inside it, without touching other clusters. Below, the
container right-aligns the form actions while the tag row, also a `.cluster`,
keeps its start alignment.

```html demo
<section class="stack" style="--form-actions-justify: flex-end">
  <div class="cluster">
    <span class="badge">Draft</span>
    <span class="badge">Internal</span>
  </div>

  <form class="stack" novalidate>
    <label class="field">
      <span class="field-label">Release title</span>
      <input class="input" type="text" value="Autumn update" />
    </label>

    <div class="cluster form-actions">
      <button type="button" class="btn outline">Cancel</button>
      <button type="submit" class="btn primary">Publish</button>
    </div>
  </form>
</section>
```

In application CSS, the same policy is one declaration on the region:

```css
.checkout {
  --form-actions-justify: flex-end;
}
```

On a form action row, use the hooks above rather than `--cluster-justify` /
`--cluster-align`: the role writes those from its own hooks. For one row, a
`.justify-content-*` / `.items-*` utility also works.
A split pair keeps the dismissive action at the leading edge and the committing
one at the trailing edge:

```html demo
<form class="stack" novalidate>
  <label class="field">
    <span class="field-label">Display name</span>
    <input class="input" type="text" value="Jane Doe" />
  </label>

  <div class="cluster form-actions justify-content-space-between">
    <button type="button" class="btn outline">Cancel</button>
    <button type="submit" class="btn primary">Save</button>
  </div>
</form>
```

## Full-width submit

A button and a field share `--control-pad-x`, so a button at its own width
under a field already sets its label on the field's text line. A button
stretched to the column keeps that line only with its label at the start; an
icon after it goes to the far end. Centered stays the default everywhere else.

```html demo
<form class="stack" novalidate>
  <label class="field">
    <span class="field-label">Hostname</span>
    <input class="input" type="text" value="baremetal.example.com" />
  </label>

  <button type="submit"
          class="btn primary"
          style="inline-size: 100%; justify-content: space-between; text-align: start">
    Create resource
    <i class="ti ti-plus" aria-hidden="true"></i>
  </button>
</form>
```

> The sticky variant adds `--form-actions-sticky-block-offset`,
> `--form-actions-sticky-padding`, and `--form-actions-sticky-inline-offset` —
> see Sticky Actions.
