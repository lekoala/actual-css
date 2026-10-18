# Diagrams

> The framework draws no diagrams. Render Mermaid text with an external engine such as Pele and theme it with Actual tokens.

A diagram is a drawing to look at: a chronology, a schedule, a process. For
content a reader scans, follows links from or acts on, stay in HTML.

- Events with links or actions in them: [Timeline](timeline.md).
- Progress through the steps of a flow: [Steps](steps.md).
- A timeline chart, Gantt chart, flowchart or any other Mermaid diagram: an
  external engine on the token bridge below.

**Related terms:** chart, Mermaid, Gantt, flowchart, sequence diagram, mind
map, roadmap, timeline chart, org chart, diagram library.

## Pele on Actual tokens

[Pele](https://pele.run/) renders Mermaid text to SVG with no runtime
dependency, and reads its colors, fonts and radius from `--pele-*` custom
properties on the SVG or any ancestor. The
[diagrams template](../../demo/templates/diagrams.html) wraps it in a small
`<pele-diagram>` web component:

```html
<pele-diagram>
  <script type="text/plain">
    flowchart LR
      A[Request] --> B{Slot free?}
      B -- Yes --> C[Confirm]
  </script>
</pele-diagram>
```

The component, in
[`demo/scripts/pele-diagram.js`](../../demo/scripts/pele-diagram.js), is an
example to copy, not Actual CSS API. It loads `pele/lazy` from a CDN, which
fetches each diagram type on first use, and mounts the source found in its
`text/plain` script. Zoom is off; the boolean `zoom` attribute turns on
Pele's automatic zoom controls for one diagram.

```css
pele-diagram {
  --pele-bg: var(--surface-opaque);
  --pele-fg: var(--text);
  --pele-muted: var(--text-muted);
  --pele-line: var(--text-muted);
  --pele-surface: var(--surface-subtle);
  --pele-surface-alt: var(--surface-raised);
  --pele-border: var(--border);
  --pele-accent: var(--primary);
  --pele-critical: var(--danger);
  --pele-error: var(--danger);
  --pele-font: var(--font-sans);
  --pele-font-mono: var(--font-mono);
  --pele-radius: var(--radius);

  display: block;
  min-inline-size: 0;
}

@supports (color: oklch(from red l c h)) {
  pele-diagram {
    --diagram-series: var(
      --primary-soft-fg,
      color-mix(in oklab, var(--text), var(--primary) var(--soft-fg-mix))
    );
    --pele-series-1: var(--diagram-series);
    --pele-series-2: oklch(from var(--diagram-series) l c calc(h + 135));
    --pele-series-3: oklch(from var(--diagram-series) l c calc(h + 270));
    --pele-series-4: oklch(from var(--diagram-series) l c calc(h + 45));
    --pele-series-5: oklch(from var(--diagram-series) l c calc(h + 180));
    --pele-series-6: oklch(from var(--diagram-series) l c calc(h + 315));
    --pele-series-7: oklch(from var(--diagram-series) l c calc(h + 90));
    --pele-series-8: oklch(from var(--diagram-series) l c calc(h + 225));
  }
}
```

Colors resolve at paint time, so a theme or light/dark switch restyles a
mounted diagram without a re-render; a font change needs the mounted
diagram's `refresh()`.

- `--pele-bg` is opaque because Pele also writes series labels and edge-label
  plates in it.
- Series colors (timeline sections, pie slices, kanban lanes) are categories,
  so they turn one hue rather than borrow intents, which would read as
  status. The base is the soft primary ink, readable against the surface, and
  Pele writes the series labels in `--pele-bg`.
- The `@supports` guard is required: a custom property accepts any value, so
  an engine without relative colors would receive an invalid fill. Without
  it, Pele keeps its own series palette.

The bridge stays in docs and the demo, like the
[combobox](../forms/combobox.md) and [date picker](../forms/date-picker.md)
ones: Actual CSS does not depend on Pele. The template pins the version the
bridge was checked against.
