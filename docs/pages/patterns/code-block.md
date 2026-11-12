# Code block with copy button

Add a copy button to a code block with `.btn`, native code markup and the `enhance()` lifecycle.

```html
<div class="code-block">
  <pre><code>npm install actual-css</code></pre>
  <button class="btn sm ghost" data-copy>Copy</button>
</div>
```

```css
.code-block { position: relative; }
.code-block > [data-copy] {
  position: absolute;
  inset-block-start: var(--space-20);
  inset-inline-end: var(--space-20);
}
```

```js
import enhance from "actual-css/js/enhance";

enhance({
  "[data-copy]": (button) => {
    const controller = new AbortController();
    button.addEventListener("click", async () => {
      const code = button.closest(".code-block")?.querySelector("code");
      if (code) await navigator.clipboard.writeText(code.textContent);
    }, { signal: controller.signal });
    return () => controller.abort();
  },
});
```

No core JS, no syntax highlighter — the recipe is the documentation.
