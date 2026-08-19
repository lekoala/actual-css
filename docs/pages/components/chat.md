# Chat

> **Optional** — import `actual-css/css/optional/chat` or `actual-css/css/optional/index`.

Chat lays out message metadata, an optional avatar, and a content-sized bubble
at either edge of a conversation.

```html demo
<div class="stack" aria-label="Conversation">
  <div class="chat chat-start">
    <div class="chat-avatar avatar sm" role="img" aria-label="Thomas">
      <span aria-hidden="true">T</span>
    </div>
    <div class="chat-header">
      Thomas <time datetime="2026-08-18T21:30">21:30</time>
    </div>
    <div class="chat-bubble">Are we still shipping today?</div>
    <div class="chat-footer">Delivered</div>
  </div>

  <div class="chat chat-end">
    <div class="chat-header">You</div>
    <div class="chat-bubble primary">Yes, the checks are green.</div>
  </div>
</div>
```

Use `.chat-start` and `.chat-end` for logical inline placement, so the layout
also follows right-to-left writing direction. The avatar is optional. Bubble
colors compose with intents and shared variants: `.primary`, `.primary.soft`,
and `.primary.outline` all work without chat-specific color classes.

For a live conversation, put an appropriate live-region or `role="log"` on the
conversation container according to the product's announcement needs. Do not
put `role="log"` on individual messages.

## Class reference

| Class | Description |
|---|---|
| `.chat` | Message row grid. |
| `.chat-start` / `.chat-end` | Logical inline placement. |
| `.chat-avatar` | Avatar grid slot; compose it with `.avatar`. |
| `.chat-header` / `.chat-footer` | Muted message metadata. |
| `.chat-bubble` | Content-sized message surface. |

## CSS hooks

- `--chat-gap` — gap between the avatar and message content.
- `--chat-max-size` — maximum inline size of a bubble.
