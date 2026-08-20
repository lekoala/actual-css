# Overflow

Explicit overflow handling for content that may exceed its container.

## Class reference

| Class | Kind | Description |
|---|---|---|
| `.overflow-auto` | Utility | Enables scrolling when content exceeds the container. |
| `.overflow-hidden` | Utility | Clips overflowing content. Optional layer. |
| `.overflow-clip` | Utility | Clips overflowing content without a scroll container. Optional layer. |
| `.overflow-x-auto` | Utility | Horizontal scrolling only. Optional layer. |
| `.overflow-y-auto` | Utility | Vertical scrolling only. Optional layer. |

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

The extra utilities extend the same concern with axis-specific and clipping variants. For quiet, custom scrollbar chrome instead of the native OS scrollbar, pair `.overflow-auto` with `.scroller` on the Sizing And Wrapping page.