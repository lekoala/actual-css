# Rich text

> A rich-text editor is not shipped by the framework — the native `<textarea>` stays the baseline. Enhance it with a dedicated engine, themed with Actual tokens.

Use a `<textarea>` while editing text, and a hosted editing engine as soon as
editing means a document (formatting, lists, links, mentions). The
[rich-text template](../../demo/templates/rich-text.html) enhances a textarea
with [@lekoala/rich-text](https://github.com/lekoala/rich-text) (Squire
underneath): the package generates the toolbar with its roving tabindex,
states, commands and lifecycle, while Actual maps its visual language onto the
package's `--rt-*` tokens. No adapter, no compatibility layer.

**Related terms:** rich text, richtext, WYSIWYG, HTML editor, formatted text, Squire, ProseMirror, Tiptap, text formatting, bold italic, mentions, slash commands.

## Theme bridge

The template loads the package JS and CSS from a CDN (`@0.1` caret range) and
declares one editor per field — Actual never builds toolbar buttons or calls
into the editing engine:

```html
<div class="field actual-rich-text">
  <label class="field-label" for="note">Team note</label>
  <rich-text id="note-editor">
    <textarea class="textarea" id="note" name="note" required placeholder="Write a note…"></textarea>
  </rich-text>
  <span class="field-help">Bold, italic, lists, quotes and links.</span>
</div>
```

```js
editor.options = {
  buttons, // Tabler icons as Nodes, never HTML strings
  requestLink, // an Actual <dialog> replacing window.prompt()
  suggestions, // static @people and /snippets providers
};
```

The bridge maps tokens; it does not restyle the editor's internals:

```css
.actual-rich-text .rt-shell {
  --rt-bg: var(--surface);
  --rt-fg: var(--text);
  --rt-border: var(--form-invalid-border, var(--control-border, var(--border)));
  --rt-focus: var(--form-invalid-border, var(--focus));
  --rt-toolbar-bg: var(--surface-subtle);
  --rt-button-pressed-bg: var(--state-selected);
  --rt-link: var(--primary);
  --rt-suggestion-bg: var(--surface-raised);
  --rt-suggestion-shadow: var(--shadow-popout);
}
```

The card in the template documents the full token map of this recipe. The
suggestion popover is a child of `.rt-shell`, so it inherits the tokens like
the rest of the editor.

One state escapes the token map: the package's `:hover` rule out-specifies its
`[aria-pressed="true"]` rule, so hovering an active button paints the hover
overlay under the pressed foreground. The bridge re-asserts the pressed
background and foreground on `[aria-pressed="true"]:hover`.

## Bridge contract

`@lekoala/rich-text` owns the editor UI semantics — progressive enhancement,
sanitization, toolbar behaviour and keyboard, links, `@mentions`, `/`
suggestions, form/reset/readonly/disabled integration, selection and undo
lifecycle. Actual owns presentation and composer chrome — tokens, visual
states, dialogs, attachments, send, `Ctrl/Cmd+Enter`.

Formatting buttons stay local to the editor instance. The stateless `command`
router never drives bold/italic: those depend on selection, schema and history,
which only the engine knows. Reserve `command` for the chrome around the
editor (attach, template, dictate, send).

A rich composer reuses `.composer` and `.composer-actions` for the outer
surface; the bridge only lifts the editor and toolbar into the composer grid
with `display: contents` and grid areas. `composer.css` itself never knows
about `.rt-*`. The plain-text [composer template](../../demo/templates/composer.html)
stays the canonical pattern when editing means text, not a document.

People lookup and templates are application concerns: the demo wires static
arrays into the package's suggestion seam, and the composer buttons type
`@`/`/` so the providers do the rest. Attachments stay composer-owned —
logged, never serialized into the HTML.

## Storage and sanitization

The form submits limited HTML, not engine state: portable, readable,
editor-independent, reversible. Sanitization is mandatory inside the package
and not configurable; the client-side sanitizer is a UI boundary, not the
persistence security boundary — sanitize again on the server before storing or
rendering untrusted content. An editor holding only the empty block serializes
to `""`, so native `required` keeps working.

If the product later needs truly structural content (custom document nodes,
annotations, collaboration), a schema-based engine becomes interesting — see
the [rich-text design note](https://github.com/lekoala/actual-css/blob/master/docs/design-notes/rich-text.md).

## Baseline traps

The textarea is the value owner and the no-JS fallback, holding raw HTML. Two
details keep it honest:

- Without the integration script the page remains a plain textarea — the link
  dialog wiring and the suggestion providers only exist once the package
  loads, and the composer falls back to plain-text send.
- `required` cannot sit usefully on a hidden textarea: mirror validity with
  `aria-invalid` on submit (the package emits `richtext:invalid` and focuses
  the editor when it is the form's first invalid control), and let the bridge
  re-own the danger hook from there.
