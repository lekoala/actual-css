# List

Lists stay native by default. Compose visual list rows from existing primitives.

Use `.list-reset` only when markers are not part of the content. Combine `.stack`, `.media`, `.cluster`, spacing helpers, and local styles for application-style rows.

```html demo
<figure class="stack">
  <figcaption><strong>Most played songs this week</strong></figcaption>

  <ul class="list-reset stack gap-none">
    <li class="media items-center py" style="border-block-end: var(--border-width) solid var(--border)">
      <div class="avatar">
        <img src="https://i.pravatar.cc/48?img=5" alt="Dio Lupa" />
      </div>
      <div class="cluster">
        <div class="stack grow" style="--gap: var(--space-10)">
          <strong>Dio Lupa</strong>
          <span class="muted">Remaining Reason</span>
        </div>
        <span class="muted">3:45</span>
      </div>
    </li>

    <li class="media items-center py" style="border-block-end: var(--border-width) solid var(--border)">
      <div class="avatar">
        <img src="https://i.pravatar.cc/48?img=10" alt="Astral Planes" />
      </div>
      <div class="cluster">
        <div class="stack grow" style="--gap: var(--space-10)">
          <strong>Astral Planes</strong>
          <span class="muted">Neon Drift</span>
        </div>
        <span class="muted">4:12</span>
      </div>
    </li>
  </ul>
</figure>
```

Keep semantic lists unstyled when the markers carry meaning.