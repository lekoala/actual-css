# Accordion

> Collapsible regions built on native details and summary, with optional exclusive groups via the name attribute.

- Use native `<details>` and `<summary>` for collapsible content.
- Use the `name` attribute for exclusive accordions.
- Supports any valid body element (`div`, `p`, `ul`, ...).
- The toggle marker color is customizable with `--accordion-marker-color`; the marker icon comes from the shared `--icon-chevron` token.

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
- `--accordion-marker-color` — color of the end marker; forced-colors mode overrides it to `CanvasText`.
