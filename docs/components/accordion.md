# Accordion

Collapsible content sections.

## Default

Default accordion.

```html .list
<div class="accordion">
  <details open>
    <summary>First item</summary>
    <div class="accordion-body">Content here.</div>
  </details>
  <details>
  <summary>Second item</summary>
    <div class="accordion-body">More content.</div>
  </details>
</div>
```

## Paragraphs

```html .list
<div class="accordion">
  <details>
    <summary>Section 1: The Basics</summary>
    <p>This content is hidden by default and expands when clicked.</p>
  </details>
  <details>
    <summary>Section 2: Advanced Usage</summary>
    <p>You can include any HTML elements here, including lists or images.</p>
  </details>
</div>
```

## List content

```html .list
<div class="accordion">
  <details>
    <summary>System configuration</summary>
    <ul>
      <li>200GB RAM</li>
      <li>4PB storage</li>
    </ul>
  </details>
  <details>
    <summary>Recommended settings</summary>
    <ul>
      <li>Extreme mode: on</li>
      <li>Raytracing: enabled</li>
    </ul>
  </details>
  <details>
    <summary>Other details</summary>
    <ul>
      <li>Material: Faux Leather, Metal</li>
      <li>Item Weight: 10.2Kg</li>
    </ul>
  </details>
</div>
```

## Accessibility

- Use `<details>` for native disclosure.
