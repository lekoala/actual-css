# Rich text: three levels and why Squire demos it

Editing text and editing a document are different problems with different
costs. Actual draws the line at the document boundary, in three levels:

```text
1. TEXTAREA (native)
   text, autosize, actions row, caret suggestions, slash commands
   → the composer pattern: demo/templates/composer.html

2. HOSTED HTML ENGINE (integration)
   bold / italic / lists / links / quote, undo, paste cleanup
   → the rich-text recipe: demo/templates/rich-text.html + Squire

3. STRUCTURED DOCUMENT ENGINE (integration, heavier)
   schema, mentions as data, annotations, collaborative state
   → no demo; the bridge contract from level 2 applies unchanged
```

Level 1 stays a real `<textarea>`: form value, IME, undo, mobile,
accessibility, validation. `contenteditable="plaintext-only"` buys nothing over
it and loses the native form control, so the framework does not use it. The
Markdown round-trip some engines offer is still beta upstream and is not the
storage contract.

## Why Squire for the level-2 demo

The demo exists to prove the bridge (toolbar, `aria-pressed`, focus group,
surface, tokens), not the engine. Squire keeps the demo about Actual:

- No dependency graph: one ESM file, so no bundler, no import map, no
  duplicate-instance failure mode. The spike was reduced to confirming two
  pinned ESM files load.
- DOM-style API (`pathChange`, `undoStateChange`, `hasFormat`) that maps
  directly onto toolbar state, instead of engine-specific extension plumbing
  leaking into the recipe.
- HTML as source of truth, which matches the storage decision (limited HTML +
  server sanitization) and keeps the engine choice reversible: adopting Squire
  today does not close the door on a schema engine tomorrow.

Two Squire specifics the recipe depends on: `blockTag: "P"` (the default block
is `DIV`), and normalizing the empty document (`<p><br></p>` and siblings) to
`""`. The ESM build also requires DOMPurify present at construction, so the
demo pins both files — the client allowlist doubles as the sanitizer
configuration, and the server enforces the same list.

## What was deliberately not demoed

- A second engine demo would prove nothing more about the bridge, and one
  candidate changes fundamental choices between minor versions — a pinned demo
  would rot. Spikes belong in `tmp/`, not `demo/`.
- Caret suggestions (`/`, `@`) stay a textarea-level improvement. Squire's
  cursor helpers only work inside Squire and must not promote slash commands
  to level 2.
- Syntax highlighting inside inputs is a search-DSL concern, not a composer
  concern; layering it onto a textarea rebuilds a fake rich editor.
