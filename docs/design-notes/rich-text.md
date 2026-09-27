# Rich text: three levels and why a package demos level 2

Editing text and editing a document are different problems with different
costs. Actual draws the line at the document boundary, in three levels:

```text
1. TEXTAREA (native)
   text, autosize, actions row, plain-text caret helpers
   → the composer pattern: demo/templates/composer.html

2. HOSTED RICH-TEXT PACKAGE (integration)
   bold / italic / lists / links / quote, undo, paste cleanup,
   structured @mentions, / snippets
   → the rich-text recipe: demo/templates/rich-text.html + @lekoala/rich-text

3. STRUCTURED DOCUMENT ENGINE (integration, heavier)
   custom document nodes, annotations, collaborative state
   → no demo; the bridge contract from level 2 applies unchanged
```

Level 1 stays a real `<textarea>`: form value, IME, undo, mobile,
accessibility, validation. `contenteditable="plaintext-only"` buys nothing over
it and loses the native form control, so the framework does not use it. The
Markdown round-trip some engines offer is still beta upstream and is not the
storage contract.

## Why a package for the level-2 demo

The demo exists to prove the bridge (tokens, pressed states, focus, invalid,
composer chrome), not the engine. Owning the toolbar, sanitizer, roving focus
and lifecycle inside the demo meant Actual did involuntarily much of the
editor's job. Extracting that into `@lekoala/rich-text` restored the boundary:

```text
Actual CSS         presentation, tokens, composer chrome, dialogs, validation
@lekoala/rich-text textarea enhancement, Squire, sanitization, toolbar
                   semantics + keyboard, links, mentions, suggestions,
                   form/reset/readonly/disabled, lifecycle
application        people lookup, templates, attachments, dictation, send
```

`@lekoala/rich-text` owns the editor UI semantics; Actual owns its visual
language. Squire is an implementation detail of the integration package: it
owns selection, editing, paste normalisation and undo/redo, while the package
owns the product-facing contract around it (progressive enhancement of a real
`<textarea>`, mandatory sanitization, accessible generated UI, lifecycle and
cleanup). HTML stays the source of truth, which keeps the storage decoupled
and the engine choice reversible.

## What was deliberately not demoed

- A second engine demo would prove nothing more about the bridge, and one
  candidate changes fundamental choices between minor versions — a pinned demo
  would rot. Spikes belong in `tmp/`, not `demo/`.
- Plain-text caret helpers stay a textarea-level improvement at level 1.
  Structured `@mentions` live at level 2 because they are sanitized, atomic
  entities inserted as HTML — the demo's Snippet/Mention buttons reuse the
  same suggestion seam as `/` and `@`, so one capability keeps two surfaces
  without duplicating its logic.
- Syntax highlighting inside inputs is a search-DSL concern, not a composer
  concern; layering it onto a textarea rebuilds a fake rich editor.
