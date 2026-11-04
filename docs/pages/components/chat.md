# Chat

> **Module** — import `actual-css/css/components/chat` or `actual-css/css/components`.

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

The avatar sits beside the last line by default, as in messaging. For a long
message with a footer — an assistant answer, a comment with its actions — set
`--chat-avatar-align: start` to keep it beside the header.

```html demo
<div class="chat chat-start" style="--chat-avatar-align: start">
  <div class="chat-avatar avatar sm" role="img" aria-label="Assistant">
    <span aria-hidden="true">A</span>
  </div>
  <div class="chat-header">Assistant <time datetime="2026-08-18T21:31">21:31</time></div>
  <div class="chat-bubble">
    Three invoices are overdue. The largest, INV-2041, is 47 days late; I drafted a
    reminder for it and left the other two for review.
  </div>
  <div class="chat-footer">Sources: Invoices, Customer contacts</div>
</div>
```

For a live conversation, put an appropriate live-region or `role="log"` on the
conversation container according to the product's announcement needs. Do not
put `role="log"` on individual messages.

For the message input itself, keep a native `<textarea>` inside a surface with
an actions row — see the [composer template](../../demo/templates/composer.html).
Formatting needs a hosted editor instead — see the
[rich-text template](../../demo/templates/rich-text.html).

## Class reference

| Class                           | Description                                  |
| ------------------------------- | -------------------------------------------- |
| `.chat`                         | Message row grid.                            |
| `.chat-start` / `.chat-end`     | Logical inline placement.                    |
| `.chat-avatar`                  | Avatar grid slot; compose it with `.avatar`. |
| `.chat-header` / `.chat-footer` | Muted message metadata.                      |
| `.chat-bubble`                  | Content-sized message surface.               |

## CSS hooks

- `--chat-gap` — gap between the avatar and message content.
- `--chat-max-size` — maximum inline size of a bubble.
- `--chat-avatar-align` — the avatar's block alignment: `end` (default) beside
  the last line, `start` beside the header for long messages with a footer.
