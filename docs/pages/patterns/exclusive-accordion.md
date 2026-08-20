# Exclusive Accordion

Browsers that support the `name` attribute on `<details>` get native exclusive accordions — no JS engine needed. Omit `name` to allow several open at once.

```html demo
<details name="faq" open>
  <summary>What is this?</summary>
  <p>A CSS framework.</p>
</details>
<details name="faq">
  <summary>Does it need JS?</summary>
  <p>Only the progressive enhancers you import.</p>
</details>
```

Not shipping an accordion JS engine is a design decision, not a gap.
