# Structured Lists

Use native lists plus layout primitives for rich content rows. Reset list chrome only when markers are not part of the content.

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
        <button class="btn ghost" type="button" aria-label="Play">
          <i class="ti ti-player-play" aria-hidden="true"></i>
        </button>
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
        <button class="btn ghost" type="button" aria-label="Play">
          <i class="ti ti-player-play" aria-hidden="true"></i>
        </button>
      </div>
    </li>
  </ul>
</figure>
```

Use `.actions` for action controls and `.nav-list` for navigation links. For structured content items, compose `.list-reset`, `.stack`, `.cluster`, `.media`, and components directly.

`.media` is a two-slot object: it lays out exactly two children — the leading element and one content column. Trailing metadata and actions belong inside the content column (nest a `.cluster` and put `.grow` on the flexible part), never as extra row children: additional children silently wrap onto a second grid row.
