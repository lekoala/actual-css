# Accordion

> Collapsible regions built on native details and summary, with optional exclusive groups via the name attribute.

- Use native `<details>` and `<summary>` for collapsible content.
- Use the `name` attribute for exclusive accordions.
- Supports any valid body element (`div`, `p`, `ul`, ...).
- Three container treatments: the default common shell, `.flush` (bare separators, for embedding inside an existing surface), and `.separated` (independent items).
- The toggle marker color is customizable with `--accordion-marker-color`; it reinforces to the summary text color on hover, and the marker icon comes from the shared `--icon-chevron` token.

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

## Custom markers

The end marker is a shared token-based chevron; swapping it for a local icon is a demo concern, not part of the base API.

```html
<div class="accordion accordion-demo">
  <details open>
    <summary>
      <span class="accordion-demo-icon" aria-hidden="true"></span>
      <span>Custom marker at the start</span>
    </summary>
    <p>This demo swaps the default end marker for a local plus/minus icon.</p>
  </details>

  <details>
    <summary>
      <span class="accordion-demo-icon" aria-hidden="true"></span>
      <span>Another item</span>
    </summary>
    <p>The icon belongs to the example, not the base accordion API.</p>
  </details>
</div>
```

## CSS hooks

- `--accordion-radius` — outer corner radius.
- `--accordion-marker-color` — color of the end marker; it reinforces to the summary text color on hover, and forced-colors mode overrides it to `CanvasText`.
