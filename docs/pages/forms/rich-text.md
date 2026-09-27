# Rich text

> A rich-text editor is not shipped by the framework — the native `<textarea>` stays the baseline. Theme an external editor with Actual tokens instead.

Use a `<textarea>` while editing text, and a hosted editing engine as soon as
editing means a document (formatting, lists, links). The
[rich-text template](../../demo/templates/rich-text.html) hosts
[Squire](https://github.com/fastmail/Squire) inside Actual markup: the toolbar
is a `.cluster` with `role="toolbar"`, pressed buttons reuse the `.btn`
`aria-pressed` contract, and the editing surface mirrors `.input` focus and
danger states. No adapter, no compatibility layer.

**Related terms:** rich text, richtext, WYSIWYG, HTML editor, formatted text, Squire, ProseMirror, Tiptap, text formatting, bold italic.

## Theme bridge

The template pins `squire-rte` and `dompurify` as ESM files from a CDN and
registers the editor as a third-party `registerEnhancement("rich-text")`, on
the same lifecycle as built-in behaviors. The control mirrors `.input`, the
surface takes the inset focus outline, and `aria-pressed` on toolbar buttons
comes from the framework:

```html
<div class="field actual-richtext">
  <span class="field-label" id="note-label">Team note</span>
  <div class="cluster rich-toolbar" role="toolbar" aria-label="Formatting">
    <div class="join">
      <button class="btn neutral outline icon-only sm" type="button" aria-label="Bold">
        <i class="ti ti-bold" aria-hidden="true"></i>
      </button>
      <button class="btn neutral outline icon-only sm" type="button" aria-label="Italic">
        <i class="ti ti-italic" aria-hidden="true"></i>
      </button>
    </div>
  </div>
  <textarea class="textarea" name="note" data-enhance="rich-text" rows="8"></textarea>
</div>
```

The strip sits directly on the surface: the joins drop their bottom corners
and the editor its top border, so toolbar and document read as one block. The
icons come from the Tabler webfont, pinned like the engine scripts.

The card in the template documents the full token map of this recipe.

## Bridge contract

Actual owns the visual language; the engine owns the document. Actual provides
surface, border, radius, inset focus outline, danger state, and the contrast
contracts those tokens carry. The engine provides the document, selection,
undo/redo, paste handling, keyboard shortcuts, and formatting state. The bridge
CSS stays in docs/demo — it is a recipe, not package API, so no
`actual-richtext.css` ships with the framework and no engine version is pinned
by it. The contract is engine-independent: the same recipe would hold for any
headless editing engine.

Formatting buttons stay local to the editor instance. The stateless `command`
router never drives bold/italic: those depend on selection, schema and history,
which only the engine knows. Reserve `command` for the chrome around the
editor (attach, template, dictate, send).

## Storage and sanitization

The form submits limited HTML, not engine state: portable, readable,
editor-independent, reversible. Squire has no schema, so the allowlist is
configuration, in two places that must match:

- client: `sanitizeToDOMFragment` with DOMPurify and a minimal tag list;
- server: the same allowlist, enforced again on receipt.

Choosing HTML over structured JSON keeps the storage decoupled from the
engine. If the product later needs truly structural content (mentions,
templates as data, annotations), a schema-based engine becomes interesting —
see the [rich-text design note](https://github.com/lekoala/actual-css/blob/master/docs/design-notes/rich-text.md).

## Baseline traps

The textarea is the value owner and the no-JS fallback, holding raw HTML. Four
details keep it honest:

- Empty documents submit as `""`, never `<p><br></p>` — normalize on flush.
- `required` cannot sit on a hidden textarea: the submit blocks on an
  unfocusable control. Mirror validity on the editor instead (check emptiness
  on submit, set `aria-invalid`, focus the editable).
- `<label for>` points at the hidden textarea: report `aria-labelledby` on the
  editable element as well.
- Flush the final value before `destroy()` in the enhancement cleanup, so
  submit never reads stale HTML.
