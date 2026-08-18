# Sidebar Layout

Two-column layout where one side has a preferred width and the other takes the remaining space.

Use `.sidebar-layout` for two-column layouts where the aside should align to the top of the content, stay sticky, or keep a predictable declared width.

Wrap it in `.container-query` to make the switch depend on the container width. Below 64rem the columns stack; at and above it the aside takes `--sidebar-layout-size` and the content takes the remaining space. Older browsers use the viewport fallback.

```html demo
<div class="container-query">
  <div class="sidebar-layout" style="--sidebar-layout-size: 18rem">
    <article class="stack">
      <h1>Long-form article</h1>
      <p>Article body that benefits from a sticky table of contents.</p>
    </article>

    <aside class="stack">
      <h3>On this page</h3>
      <ol class="list-reset">
        <li><a class="link-muted" href="#">Section</a></li>
      </ol>
    </aside>
  </div>
</div>
```

Tune the side width with `--sidebar-layout-size`.