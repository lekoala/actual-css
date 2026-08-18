# Frame

Media container that holds a stable aspect ratio for images, video, or embeds.

```html demo
<figure class="frame">
  <img src="https://picsum.photos/seed/actual-css-frame/1600/900" alt="Preview placeholder" width="1600" height="900" />
</figure>
```

```css
.frame {
  aspect-ratio: var(--frame-ratio, 16 / 9);
  overflow: hidden;
}

.frame > :where(img, video, iframe) {
  inline-size: 100%;
  block-size: 100%;
  object-fit: cover;
}
```

Use local variables for common ratios.

```css
.avatar-preview {
  --frame-ratio: 1;
}
```