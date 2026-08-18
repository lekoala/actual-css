# Avatar

> Initials or image representing a person or entity, composable with a status dot.

- Supports initials and images.
- Can be an inert element, link, or button when the link/button has a real destination or action.
- Stack avatars with `.avatar-stack` for overlapping group displays.
- A status dot attaches as an empty `.badge` child; the badge carries an `aria-label` so the dot conveys its meaning to assistive tech.
- Does not support shape modifiers as public API. Shape is theme-level.
- Sizes can be adjusted with CSS variables and optional `.sm` or `.lg`.
- Background is an exposed css variable (and can use `data-tone`).

## Class reference

| Class | Kind | Description |
|---|---|---|
| `.avatar` | Component | Initials or image in a circular box; works on `div`, `a`, and `button`. |
| `.avatar-stack` | Composition | Overlapping avatar group. |
| `.badge:empty` (inside `.avatar`) | Composition | Status dot at the bottom-end corner; give it an `aria-label`. |
| `.sm` / `.lg` | Size | Density; also rescales the whole `.avatar-stack`. |

## Basic usage

```html demo
<div class="avatar" role="img" aria-label="John Doe, online">
  <span aria-hidden="true">JD</span>
  <span class="badge success" aria-label="Online"></span>
</div>

<div class="avatar lg" role="img" aria-label="John Doe, online">
  <span aria-hidden="true">JD</span>
  <span class="badge success" aria-label="Online"></span>
</div>

<div class="avatar sm" role="img" aria-label="John Doe, errors">
  <span aria-hidden="true">JD</span>
  <span class="badge danger" aria-label="2 errors"></span>
</div>
```

The avatar keeps the same visual box across semantics — as a link or button it
gains hover and pressed feedback.

```html demo
<a href="#" class="avatar">
  <img src="https://mockmind-api.uifaces.co/content/human/219.jpg" alt="Jane Doe" />
</a>

<div class="flyout-trigger">
  <button type="button"
          class="avatar"
          data-enhance="flyout"
          aria-haspopup="menu"
          aria-expanded="false"
          aria-controls="profile-menu"
          id="profile-trigger"
          aria-label="Jane Doe, open profile menu">
    <img src="https://mockmind-api.uifaces.co/content/human/219.jpg" alt="" />
  </button>
  <menu class="flyout menu" id="profile-menu" aria-labelledby="profile-trigger" hidden>
    <li><a class="menu-item" href="#profile">View profile</a></li>
    <li><button class="menu-item" type="button">Sign out</button></li>
  </menu>
</div>
```

## Avatar stack

```html demo
<div class="avatar-stack" role="group" aria-label="Team members">
  <div class="avatar" role="img" aria-label="John Doe" style="--avatar-bg:#E5EEE4">
    <span aria-hidden="true">JD</span>
  </div>
  <div class="avatar" role="img" aria-label="Jane Doe" style="--avatar-bg:#F6F4E8">
    <span aria-hidden="true">JD</span>
  </div>
  <div class="avatar" role="img" aria-label="99 more team members" style="--avatar-bg:#744577;" data-tone="dark">
    <span aria-hidden="true">+99</span>
  </div>
</div>
```

## CSS hooks

- `--avatar-size` — inline and block size.
- `--avatar-radius` — corner radius; set a smaller value for squared avatars.
- `--avatar-bg` — background; `data-tone` adjusts the derived foreground.
- `--avatar-stack-size` — stack-scoped size that each avatar falls back to.
- `--avatar-stack-overlap` — how far stacked avatars overlap.
- `--avatar-stack-ring` — separating ring width inside `.avatar-stack`.

Prefer intents for avatar colors. Inside `.avatar-stack`, `--avatar-size` falls
back to a stack-scoped value so the whole group resizes together with `.sm`/`.lg`;
set `--avatar-size` on an individual avatar to opt one out.
`--avatar-stack-overlap` is derived from `--avatar-stack-size`, not `--avatar-size`.
