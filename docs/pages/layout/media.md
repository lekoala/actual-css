# Media Object

Fixed-width leading element (avatar, icon, image) paired with flexible trailing content.

`.media` is the media object: a grid with `auto minmax(0, 1fr)` columns. Use it for author cards, comments, meta rows, and any composition that pairs a small leading element with a flexible content block. The trailing column takes the remaining space and never overflows.

Give `.media` exactly two children. Trailing metadata or actions go inside the content column — nest a `.cluster` and put `.grow` on the flexible part — never as additional children, which silently wrap onto a second grid row.

Add `.items-center` to align the leading element with short trailing content. For multi-line content, the default `align-items: start` is more comfortable.

```html demo
<article class="card media">
  <span class="avatar"><abbr>AM</abbr></span>
  <div class="stack gap-none">
    <strong>Ada Meridian</strong>
    <p class="muted">Senior designer working on design systems.</p>
  </div>
</article>
```

```html demo
<div class="media items-center">
  <span class="avatar"><abbr>AM</abbr></span>
  <span>Ada Meridian</span>
</div>
```

The media object is the underlying pattern of `.blog-author`, `.blog-comment`, and similar compositions in templates. Components can adopt it instead of repeating the grid rule.