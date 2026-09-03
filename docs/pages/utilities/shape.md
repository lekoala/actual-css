# Shape Helpers

Rare shape utilities for cases that must be perfectly round or square.

## Class reference

| Class     | Kind    | Description                                         |
| --------- | ------- | --------------------------------------------------- |
| `.circle` | Utility | Forces a perfectly round shape via `--radius-full`. |

Shape utilities should be rare because shape is mostly theme-level.

Use `.circle` only when an element must be perfectly round.

```html demo
<img class="circle" src="https://i.pravatar.cc/48?img=5" alt="Jane Doe" width="48" height="48" />
```

```css
.circle {
  border-radius: var(--radius-full);
}
```

Do not add `.rounded-sm`, `.rounded-lg`, `.square`, or `.pill` unless repeated real use proves they are needed.
