# File upload

> An upload widget is not shipped by the framework — the native `.file` input stays the baseline. Compose Dropzone's rows from Actual components, or theme FilePond with Actual tokens.

The native input is the default: it submits with the form and needs no
JavaScript. Reach for an uploader when the product needs drag and drop,
previews, progress, or asynchronous and chunked uploads.

**Related terms:** file upload, uploader, file input, drag and drop, drop zone, dropzone, attachments, upload progress, file preview, FilePond.

## Native baseline

```html demo
<label class="field">
  <span class="field-label">Profile picture</span>
  <input class="file" type="file" accept="image/*" />
</label>
```

See [Controls](controls.md#file) for what `.file` styles.

## Dropzone: rows from Actual components

The [file upload template](../../demo/templates/file-upload.html) puts the
native input, [Dropzone](https://docs.dropzone.dev/) and FilePond side by side.
Dropzone owns drop, queue and requests; its stylesheet is not loaded. Its
`previewTemplate` is plain markup, so each file renders as a `.list-item`, and
Dropzone fills the `data-dz-*` slots:

```html
<template id="upload-row">
  <li class="list-item">
    <span class="avatar"><span data-dz-ext aria-hidden="true"></span><img data-dz-thumbnail alt="" hidden></span>
    <span class="list-item-content">
      <strong class="list-item-title truncate" data-dz-name></strong>
      <span class="list-item-text" data-dz-size></span>
      <span class="list-item-text"><span class="danger intent-color" data-dz-errormessage></span></span>
      <progress class="progress" value="0" max="100" data-dz-uploadprogress></progress>
    </span>
    <button class="close" type="button" aria-label="Remove file" data-dz-remove></button>
  </li>
</template>
```

```js
const dropzone = new Dropzone(zone, {
  url: "/upload",
  clickable: zone.querySelector("button"), // a real button, not the whole zone
  previewsContainer: "#upload-list", // a <ul class="list">
  previewTemplate: document.getElementById("upload-row").innerHTML,
});
dropzone.on("success", (file) => file.previewElement.querySelector("progress").classList.add("success"));
```

Dropzone sets the value of a `<progress>` slot, so `.progress` works as is.
Outcomes take intent classes from event listeners rather than styling
Dropzone's `dz-success` and `dz-error` classes. The thumbnail starts
`hidden` and a `thumbnail` listener reveals it; until then the avatar shows
the file extension.

The drop target is the one piece left to draw: a dashed `--border-control`
outline on `--surface-subtle`, with a `.dz-drag-hover` rule (Dropzone writes
the class while files hover the zone). Put a native `.file` input in the zone
for the no-JavaScript case and remove it at init, as the template does:
Dropzone appends its own hidden input to `<body>`.

## FilePond: theme bridge

[FilePond v5](https://v5.filepond.com/) is a `<file-pond>` web component that
wraps a native input and renders its own UI in a shadow root. Its
`--default-*` properties inherit into that root, so the bridge is one rule:

```html
<div class="field">
  <label class="field-label" for="attachments">Attachments</label>
  <file-pond>
    <input class="file" id="attachments" type="file" name="attachments" multiple>
  </file-pond>
</div>
```

```css
file-pond {
  --default-color: var(--text);
  --default-background-color: var(--surface-subtle);
  --default-accent-color: var(--primary);
  --default-accent-color-text: var(--primary-fg);
  --default-border: var(--border-width) solid var(--border-control);
  --default-border-radius: var(--radius);
  --default-padding: var(--space-40);
  --outline: var(--focus-ring-width) solid var(--focus);
  display: block;
}
```

```js
import { defineFilePond } from "filepond";
import { locale } from "filepond/locales/en-gb.js";

defineFilePond({ locale });
```

FilePond reads `color-scheme` for everything the map leaves out, so light,
dark and `data-theme` islands need no second rule. Font and line height
inherit from the page. `--outline` is not documented by FilePond: it is the
property every focus-visible outline inside the component reads, and mapping
it gives the browse button and entry buttons the framework focus line. The
host is `inline-block` by default; `display: block` makes the drop area span
its field. For deeper changes, FilePond exposes `::part()` hooks and a
template API; the template does not need them.

FilePond v5 is in beta: pin an exact version (`npm install filepond@beta`).

Both bridges stay in docs/demo — they are recipes, not package API.

## Which one?

- A form that posts a few files: native `.file`.
- Drag and drop, previews and progress in your own markup: Dropzone with an Actual `previewTemplate`.
- A complete uploader UI (media previews, image editing, camera, chunked uploads): FilePond on the token bridge.
