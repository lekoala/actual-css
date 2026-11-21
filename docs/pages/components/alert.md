# Alert

> Inline status messages for confirmations, warnings, and errors, with intents, icons, and action lists.

```html demo
<div class="stack">
  <div class="alert surface">
    <i class="ti ti-info-circle alert-icon" aria-hidden="true"></i>
    <div><strong>New message.</strong> 12 unread. <a href="#">Open inbox</a>.</div>
  </div>

  <div class="alert success">
    <i class="ti ti-circle-check alert-icon" aria-hidden="true"></i>
    <div>Your changes have been saved. <a href="#">View activity</a>.</div>
  </div>

  <div class="alert warning">
    <svg class="alert-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
    <div>Please review the <a href="#">failed checks</a> before continuing.</div>
  </div>

  <div class="alert">
    <svg class="alert-icon" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M5.255 5.786a.237.237 0 0 0 .241.247h.825c.138 0 .248-.113.266-.25.09-.656.54-1.134 1.342-1.134.686 0 1.314.343 1.314 1.168 0 .635-.374.927-.965 1.371-.673.489-1.206 1.06-1.168 1.987l.003.217a.25.25 0 0 0 .25.246h.811a.25.25 0 0 0 .25-.25v-.105c0-.718.273-.927 1.01-1.486.609-.463 1.244-.977 1.244-2.056 0-1.511-1.276-2.241-2.673-2.241-1.267 0-2.655.59-2.75 2.286m1.557 5.763c0 .533.425.927 1.01.927.609 0 1.028-.394 1.028-.927 0-.552-.42-.94-1.029-.94-.584 0-1.009.388-1.009.94"/></svg>
    <div>This is a default alert message.</div>
  </div>

  <div class="alert danger">
    <strong>Couldn't save the draft.</strong>
    <div>The connection dropped. Your changes are kept on this device.</div>
  </div>

  <div class="alert danger">
    Your session expired. <a href="#">Sign in again</a>.
  </div>
</div>
```

## Usage

**Related terms:** banner, callout, notice, inline notification, install prompt, trailing action.

- Place an alert near the content it concerns and keep it visible while the
  information is relevant or the user can act on it.
- Use a [status bar](../enhancements/status-bar.md) for brief confirmations
  such as “Copied,” a [dialog](dialog.md) when a decision is required to
  continue, and [field validation](../forms/validation.md) for errors the user
  can fix in a specific field.
- Reserve `role="alert"` for urgent, dynamically updated text. Use
  `role="status"` for polite announcements. Notices that are present as part
  of the page content can use ordinary markup.
- Use `.surface` for neutral chrome with intent in the ink, or `.solid` and
  `.outline` to change the emphasis. Use `.compact` or `.spacious` to adjust
  block padding while keeping the inline padding.

## Class reference

| Class            | Kind        | Description                                     |
| ---------------- | ----------- | ----------------------------------------------- |
| `.alert`         | Component   | Inline status surface; soft by default.         |
| `.alert-icon`    | Composition | Decorative leading icon, in the first column.   |
| `.close`         | Composition | Dismiss button, in the last column.             |
| `.alert-title`   | Composition | Admonition title bar; hosts the dismiss button. |
| `.alert-body`    | Composition | Admonition body on the page surface.            |
| `.callout`       | Variant     | Leading-edge flag; owns the border geometry.    |
| `.admonition`    | Variant     | Tinted title bar, body on the page surface.     |
| Shared intents   | Intent      | `.primary`, `.secondary`, `.success`, …         |
| Shared variants  | Variant     | `.solid`, `.outline`, `.surface`.               |
| Density contexts | Density     | Descendant rhythm; inline padding stays stable. |

## Anatomy

```text
.alert
├── .alert-icon        (optional)
├── content            any HTML, one or more blocks
└── .close             (optional)

.alert.admonition
├── .alert-title
│   ├── icon           (optional)
│   ├── title text
│   └── .close         (optional)
└── .alert-body
    └── content        any HTML
```

## Content and actions

- Lead with the outcome or problem. Add a title when it helps scanning and use
  the body for what happened or what the user can do next.
- Name the next action directly, such as “Update billing.” Group multiple
  actions in a `<menu class="cluster">`.
- Place a title and description as siblings to use the alert's own spacing.
  Use `.prose` for several paragraphs or `.stack` for a group with its own gap.

```html demo
<div class="alert danger">
  <i class="ti ti-alert-triangle alert-icon" aria-hidden="true"></i>

  <div class="stack">
    <div class="stack" style="--gap: var(--space-10)">
      <strong>Payment failed.</strong>
      <p>Check your billing details or try another card.</p>
    </div>

    <menu class="cluster">
      <li><a class="btn danger sm" href="/billing">Update billing</a></li>
      <li><a href="/support">Contact support</a></li>
    </menu>
  </div>
</div>
```

## Trailing action

The grid pins `.alert-icon` and `.close` to the outer columns. A
trailing link or button is content, not anatomy, so it lives in the text column:
wrap the row in a `.cluster` and push the two ends apart. Same recipe as any
split / spread row — there is no `.alert-action` class. The action sits before
`.close` on a wide alert and wraps under the message on a narrow one.

The alert aligns its columns to the block start, so a multi-line message keeps
its icon and `.close` on the first line. A trailing control makes that line
taller than its text and pushes the text down. On a one-line message, add
`.items-center` to put the icon, the text and the button on one center. When
the message can wrap, add `.items-baseline` instead: it keeps the icon and
`.close` on the first line of text, where `.items-center` would center them on
the whole block.

```html demo
<div class="stack">
  <div class="alert surface items-center">
    <i class="ti ti-info-circle alert-icon" aria-hidden="true"></i>
    <div class="cluster justify-content-space-between">
      <strong>New message!</strong>
      <a class="btn sm outline" href="#">Open</a>
    </div>
  </div>

  <div class="alert primary items-baseline" id="install-alert">
    <i class="ti ti-download alert-icon" aria-hidden="true"></i>
    <div class="cluster justify-content-space-between">
      <p><strong>Recommended</strong> · Install the desktop app for notifications and offline access.</p>
      <a class="btn sm" href="#">Install app</a>
    </div>
    <button class="close" type="button" commandfor="install-alert" command="--dismiss" aria-label="Dismiss"></button>
  </div>
</div>
```

## Variants

```html demo
<div class="stack">
  <div class="alert surface">
    I'm a surface alert — theme chrome, intent in the ink
  </div>

  <div class="alert danger outline">
    I'm an outline error <a href="#">with a link</a>
  </div>

  <div class="alert danger solid">
    I'm a solid error <a href="#">with a link</a>
  </div>
</div>
```

## Dismiss

Add a [`.close`](close.md) button to let a user remove an inline alert. Give
the alert an `id` and point the button at it with `commandfor` and
`command="--dismiss"`. The runtime sets `hidden` and moves focus to a nearby
control when focus would otherwise be lost. See
[Dismiss command](../guides/progressive-enhancement.md#dismiss-command).

```html demo
<div class="alert warning" id="warning-alert">
  <i class="ti ti-alert-triangle alert-icon" aria-hidden="true"></i>
  <strong>Warning</strong>
  <p>Something needs your attention.</p>

  <button
    class="close"
    type="button"
    commandfor="warning-alert"
    command="--dismiss"
    aria-label="Dismiss alert"
  ></button>
</div>
```

In an admonition, place `.close` inside `.alert-title`; it rides the inline end of the title bar:

```html
<div class="alert admonition warning" id="notice">
  <div class="alert-title">
    <span>Warning</span>
    <button
      class="close"
      type="button"
      commandfor="notice"
      command="--dismiss"
      aria-label="Dismiss alert"
    ></button>
  </div>
  <div class="alert-body">...</div>
</div>
```

## Callout

`.callout` is a **leading-edge flag treatment**: it owns the border geometry and
nothing else, so the surface and the ink keep coming from the alert's own intent
and treatment. Bare is the soft panel, `.surface` the page surface, `.solid` a
filled one — and `.outline` has no fill and no other side, since the flag *is*
the border.

```html demo
<div class="stack">
  <div class="alert callout">
    <strong>Note</strong>
    <p>A neutral panel with a thick accent flag on the leading edge.</p>
  </div>

  <div class="alert warning callout">
    <strong>Heads up</strong>
    <p>The intent tints the panel and the flag together.</p>
  </div>

  <div class="alert success callout surface">
    <strong>On the page surface</strong>
    <p>The flag keeps the intent, the panel drops the tint.</p>
  </div>
</div>
```

Tune the flag with `--alert-border-inline-start-width` and
`--alert-border-inline-start-color`; `--alert-radius: 0` turns it into a
full-bleed notice.

```html demo
<div class="alert danger callout" style="--alert-radius: 0">
  <i class="ti ti-user-x alert-icon" aria-hidden="true"></i>
  <div>Your request to join the team is denied.</div>
</div>
```

## Admonition

An admonition is a structured box with a tinted title bar, an optional icon, and body content on the page surface — like the `!!! note` callouts in mkdocs. Use `.alert-title` for the header and `.alert-body` for the content. An icon in the title takes `.alert-icon`, so `--alert-icon-nudge` reaches it too. Intent classes tint the title bar background and the border; shared variants paint the title bar, so `.solid` fills it — and keeps the body's frame neutral — for a notification that needs to stand out.

```html demo
<div class="stack">
  <div class="alert admonition">
    <div class="alert-title">
      <i class="ti ti-info-circle alert-icon" aria-hidden="true"></i>
      Note
    </div>
    <div class="alert-body">
      <p>An admonition with a tinted title bar. The body rests on the page background.</p>
    </div>
  </div>

  <div class="alert warning admonition">
    <div class="alert-title">
      <i class="ti ti-alert-triangle alert-icon" aria-hidden="true"></i>
      Warning
    </div>
    <div class="alert-body">
      <p>The intent tints the title bar, the border, and the body uses <code>var(--surface)</code>.</p>
    </div>
  </div>

  <div class="alert success admonition solid">
    <div class="alert-title">
      <i class="ti ti-circle-check alert-icon" aria-hidden="true"></i>
      Saved
    </div>
    <div class="alert-body">
      <p>A solid title bar for an action response.</p>
    </div>
  </div>
</div>
```

## CSS hooks

- `--alert-pad-inline` — inline padding. Stays stable across density contexts.
- `--alert-pad-block` — block padding.
- `--alert-font-size` — base font size. Keep it in `rem` or `px`: the icon offset is a `calc()` evaluated on the icon, where an `em` would resolve against the icon's size.
- `--alert-line-height` — the alert's line box. The icon offset is derived from it, so change the rhythm here rather than with `line-height`.
- `--alert-icon-size` — size of a leading `.alert-icon`. Set it from the text (`calc(var(--alert-font-size) * 1.25)`) when the icon should scale with the type.
- `--alert-icon-nudge` — local correction to the icon's centring on the first line box, for an off-centre glyph or a theme tile larger than `--alert-icon-size`. An `em` here follows the icon size; the correction does not move the close button.
- `--close-size` / `--close-icon-size` — the alert declares compact values for its `.close`; set them on the alert to change them.
- `--alert-radius` — corner radius, when the default `--radius-lg` does not fit.
- `--alert-border-inline-start-color` / `--alert-border-inline-start-width` — extension points for a callout-style colored flag on the leading edge instead of a uniform border.

Prefer intents and shared variants for alert colors rather than overriding the
internal color plumbing directly.
