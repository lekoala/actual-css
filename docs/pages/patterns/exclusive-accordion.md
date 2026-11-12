# Exclusive accordion

Keep one accordion panel open at a time with native `<details>` groups, without a JavaScript engine.

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

Browsers that support the `name` attribute on `<details>` enforce the group.
Omit `name` to allow several panels open at once.
