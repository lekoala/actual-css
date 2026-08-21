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

`overflow: hidden` is what makes the frame a media frame: it clips the media to
the ratio and its corners. Floating decorations (badges, live dots, captions
that overhang) therefore cannot live inside the frame — they are clipped too.
Place them in a sibling or wrapper around the frame instead.
