# Accordion

> Collapsible regions built on native details and summary, with optional exclusive groups via the name attribute.

- Use native `<details>` and `<summary>` for collapsible content.
- Use the `name` attribute for exclusive accordions.
- Supports any valid body element (`div`, `p`, `ul`, ...).
- Three container treatments: the default common shell, `.flush` (bare separators, for embedding inside an existing surface), and `.separated` (independent items).
- The end marker is a chevron that turns when open; its glyph, turn, color, and size are hooks.

```html demo
<div class="accordion">
  <details open>
    <summary>A paragraph body that is opened</summary>
    <p>This is a paragraph.</p>
  </details>

  <details>
    <summary>With a list</summary>
    <ul>
      <li>First item</li>
      <li>Second item</li>
    </ul>
  </details>

  <details>
    <summary>
      <i class="ti ti-settings" aria-hidden="true"></i>
      <span>With a custom icon</span>
    </summary>
    <div>
      <p>Any valid flow content can be used here.</p>
    </div>
  </details>
</div>
```

## Variants

The default builds one raised shell around the whole group. `.flush` and `.separated` only change that chrome — they are integration modes between the component and its container, not decorative skins.

- **`flush`** — the ambient box disappears and only the item separators remain, so the group sits edge to edge inside a surface that already exists: a card, a drawer, a page section. A FAQ list without a box inside a box.

```html demo
<div class="accordion flush">
  <details open>
    <summary>Flush keeps just the separators</summary>
    <p>No shell: embed the group in a card, drawer, or page section.</p>
  </details>

  <details>
    <summary>Edge to edge</summary>
    <p>The summary and panel follow the surrounding surface's own gutter.</p>
  </details>
</div>
```

- **`separated`** — each `<details>` becomes its own card, for groups of standalone items.

```html demo
<div class="accordion separated">
  <details open>
    <summary>Each item is its own card</summary>
    <p>Standalone items share the same gap, border, radius, and raised surface.</p>
  </details>

  <details>
    <summary>Still native details</summary>
    <p>Exclusive <code>name</code> groups and per-item icons work exactly as in the base component.</p>
  </details>
</div>
```

The accordion owns its disclosure marker; the trigger content belongs to the markup. Item accents, per-item shadows, an underlined trigger label, and alternative markers stay application recipes, not framework variants.

## Exclusive groups

```html demo
<div class="accordion">
  <details name="settings">
    <summary>This is grouped with the next one</summary>
    <p>Using the <code>name</code> attribute groups items like radio buttons.</p>
  </details>

  <details name="settings">
    <summary>This is grouped with the previous one</summary>
    <p>Only one item in the same named group can be open.</p>
  </details>
</div>
```

## Plus / close marker

Swap the glyph and the turn: a plus turned 45° reads as a close cross (plus
minus, expand collapse, + / ×).

```html demo
<div class="accordion" style="--accordion-marker-icon: var(--icon-plus); --accordion-marker-open-rotate: 45deg">
  <details open>
    <summary>Open: the plus has turned into a cross</summary>
    <p>The turn animates with the open state.</p>
  </details>

  <details>
    <summary>Closed: a plus</summary>
    <p>Any mask-ready icon token works as the glyph.</p>
  </details>
</div>
```

## CSS hooks

- `--accordion-radius` — outer corner radius.
- `--accordion-pad` — inset of the summary row and the panel. The panel relays it as `--surface-pad`, so a direct `.bleed` child of the panel reaches the item's sides and bottom corners (never the summary); `.flush` drops the inline half and the relay with it.
- `--accordion-marker-color` — color of the end marker; it reinforces to the summary text color on hover. In forced-colors mode the marker is pinned to `CanvasText` on the property itself, so an application override of the hook cannot leave a `Canvas`-remapped fill.
- `--accordion-marker-size` — edge length of the end marker.
- `--accordion-marker-icon` — the marker glyph, any mask image (`--icon-chevron`, `--icon-plus`, …).
- `--accordion-marker-open-rotate` — the marker's turn when open.

### Replacing the marker

The marker is a masked box: `--accordion-marker-color` fills it and the chevron
mask clips it to the glyph. A background, ring, or shadow set on it is clipped
to the same silhouette, so a decorated marker — a chevron inside a pill — has
to be a real element: hide the built-in one and put a
`<span class="marker" aria-hidden="true"></span>` at the end of the summary. The
pill is the span; the chevron is its pseudo-element, which reads the same color
hook, so the hover reinforcement carries over. The forced-colors pin does not
carry over through the hook — an application hook override at the same
specificity loads after the framework and would win the variable — so the
recipe repeats it on its own property:

```css
.accordion.custom-marker summary::after {
  display: none;
}

.accordion.custom-marker .marker {
  display: grid;
  place-items: center;
  margin-inline-start: auto;
  padding: var(--space-10);
  border-radius: 50%;
  background: var(--surface-subtle);
  transition: transform var(--duration);
}

.accordion.custom-marker .marker::before {
  content: "";
  inline-size: var(--accordion-marker-size);
  block-size: var(--accordion-marker-size);
  background-color: var(--accordion-marker-color);
  -webkit-mask: var(--accordion-marker-icon) center / contain no-repeat;
  mask: var(--accordion-marker-icon) center / contain no-repeat;
}

.accordion.custom-marker summary:hover .marker {
  --accordion-marker-color: currentColor;
}

.accordion.custom-marker details[open] .marker {
  transform: rotate(var(--accordion-marker-open-rotate));
}

@media (forced-colors: active) {
  .accordion.custom-marker .marker::before {
    background-color: CanvasText;
  }
}
```
