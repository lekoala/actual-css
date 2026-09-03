# Overflow

Explicit overflow handling for content that may exceed its container.

## Class reference

Base utilities:

| Class            | Description                                           |
| ---------------- | ----------------------------------------------------- |
| `.overflow-auto` | Enables scrolling when content exceeds the container. |

Extra utilities:

| Class              | Description                                           |
| ------------------ | ----------------------------------------------------- |
| `.overflow-hidden` | Clips overflowing content.                            |
| `.overflow-clip`   | Clips overflowing content without a scroll container. |
| `.overflow-x-auto` | Horizontal scrolling only.                            |
| `.overflow-y-auto` | Vertical scrolling only.                              |

Use `.overflow-auto` when content may overflow its container, especially tables and code-like regions.

```html demo
<div class="overflow-auto">
  <table class="table">
    <caption>Team members</caption>
    <thead>
      <tr>
        <th>Name</th>
        <th>Role</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Alice Johnson</td>
        <td>Admin</td>
      </tr>
    </tbody>
  </table>
</div>
```

```css
.overflow-auto {
  overflow: auto;
}
```

The extra utilities extend the same concern with axis-specific and clipping variants. To give the native scrollbar the theme's density and colour, pair `.overflow-auto` with `.scroller` on the Sizing And Wrapping page.
