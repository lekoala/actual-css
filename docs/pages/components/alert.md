# Alert

> Inline status messages for confirmations, warnings, and errors, with intents, icons, and action lists.

- Supports intent colors.
- Supports longer text and lists.
- Links inherit alert color by default.
- Alerts are soft by default. Use `.solid` or `.outline` when the message needs stronger or quieter emphasis.
- Use `<menu class="actions cluster">` for alert action lists.
- Use `role="alert"` only when the alert is injected dynamically and should be announced.
- Not a toast.
- Could have simple or complex html content.
- Alerts may include a decorative leading icon. Use `.alert-icon` on the icon element; the rest of the content flows into the remaining text column.
- Use `.sm` or `.lg` for density changes. The inline padding stays stable.
- Use `.alert-dismiss` for a compact dismiss button. It is a direct trailing child in standard alerts and lives inside `.alert-title` in admonitions. It uses the shared `--icon-close` mask and the `--dismiss` runtime command — no icon font or custom JS.

Because alerts are soft by default, adding `.soft` to an intent (`.alert.soft.primary`,
`.alert.soft.danger`, …) is a no-op: it already resolves to a soft version of that
intent. Reach for `.solid` (stronger) or `.outline` (quieter) when the emphasis
itself needs to change, not `.soft`.

## Class reference

| Class            | Kind        | Description                                                                       |
|------------------|-------------|-----------------------------------------------------------------------------------|
| `.alert`         | Component   | Inline status surface; soft by default.                                           |
| `.alert-icon`    | Composition | Decorative leading icon; pins to the first grid column.                           |
| `.alert-dismiss` | Modifier    | Compact dismiss button using the `--icon-close` mask and the `--dismiss` command. |
| `.callout`       | Variant     | Neutral panel with a thick accent border on the leading edge.                     |
| `.admonition`    | Variant     | Structured box with a tinted title bar and body on the page surface.              |
| `.alert-title`   | Composition | Admonition title bar; hosts the dismiss button.                                   |
| `.alert-body`    | Composition | Admonition body resting on the page surface.                                      |
| Shared intents   | Intent      | `.primary`, `.secondary`, `.success`, `.warning`, `.danger`.                      |
| Shared variants  | Variant     | `.solid` and `.outline` emphasis.                                                 |
| `.sm` / `.lg`    | Size        | Density; inline padding stays stable.                                             |

## Basic usage

```html demo
<div class="stack">
  <div class="alert success">
    <i class="ti ti-circle-check alert-icon" aria-hidden="true"></i>
    <div>Your changes have been saved. <a href="#">View activity</a>.</div>
  </div>

  <div class="alert warning" role="alert">
    <svg class="alert-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
    <div>Please review the <a href="#">failed checks</a> before continuing.</div>
  </div>

  <div class="alert">
    <svg class="alert-icon" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M5.255 5.786a.237.237 0 0 0 .241.247h.825c.138 0 .248-.113.266-.25.09-.656.54-1.134 1.342-1.134.686 0 1.314.343 1.314 1.168 0 .635-.374.927-.965 1.371-.673.489-1.206 1.06-1.168 1.987l.003.217a.25.25 0 0 0 .25.246h.811a.25.25 0 0 0 .25-.25v-.105c0-.718.273-.927 1.01-1.486.609-.463 1.244-.977 1.244-2.056 0-1.511-1.276-2.241-2.673-2.241-1.267 0-2.655.59-2.75 2.286m1.557 5.763c0 .533.425.927 1.01.927.609 0 1.028-.394 1.028-.927 0-.552-.42-.94-1.029-.94-.584 0-1.009.388-1.009.94"/></svg>
    <div>This is a default alert message.</div>
  </div>

  <div class="alert danger" role="alert">
    <strong>Error!</strong>
    <div>Something went wrong.</div>
  </div>

  <div class="alert danger" role="alert">
    I'm a simple error
  </div>

  <div class="alert danger" role="alert">
    I'm a simple error <a href="#">with a link and no joke</a>
  </div>
</div>
```

## Content and actions

```html demo
<div class="alert danger" role="alert">
  <i class="ti ti-alert-triangle alert-icon" aria-hidden="true"></i>

  <div class="stack">
    <div class="stack" style="--gap: var(--space-10)">
      <strong>Payment failed.</strong>
      <p>Check your billing details or try another card.</p>
    </div>

    <menu class="actions cluster">
      <li><a class="btn danger sm" href="/billing">Update billing</a></li>
      <li><a href="/support">Contact support</a></li>
    </menu>
  </div>
</div>
```

## Variants

```html demo
<div class="stack">
  <div class="alert danger sm" role="alert">
    I'm a small error
  </div>

  <div class="alert danger lg" role="alert">
    I'm a large error
  </div>

  <div class="alert danger outline" role="alert">
    I'm an outline error <a href="#">with a link</a>
  </div>

  <div class="alert danger solid" role="alert">
    I'm a solid error <a href="#">with a link</a>
  </div>
</div>
```

## Dismiss

Use `.alert-dismiss` to let a user remove an inline alert. The button is transparent at rest with a muted glyph; it works with any intent because it uses `currentColor` and reduced opacity. It relies on the runtime `--dismiss` command — no custom script.

```html demo
<div class="alert warning" id="warning-alert">
  <i class="ti ti-alert-triangle alert-icon" aria-hidden="true"></i>
  <div>
    <strong>Warning</strong>
    <p>Something needs your attention.</p>
  </div>
  <button
    class="alert-dismiss"
    type="button"
    commandfor="warning-alert"
    command="--dismiss"
    aria-label="Dismiss alert"
  ></button>
</div>
```

In an admonition, place `.alert-dismiss` inside `.alert-title`; it rides the inline end of the title bar:

```html
<div class="alert admonition warning" id="notice">
  <div class="alert-title">
    <span>Warning</span>
    <button
      class="alert-dismiss"
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

Use `.callout` for a neutral panel with a thick accent border on the leading edge. Intent classes tint the border color.

```html demo
<div class="stack">
  <div class="alert callout">
    <strong>Note</strong>
    <p>This is a callout — a neutral panel with a thick accent border on the leading edge.</p>
  </div>

  <div class="alert warning callout" role="alert">
    <strong>Heads up</strong>
    <p>The border color follows the intent. No other borders are drawn.</p>
  </div>
</div>
```

## Admonition

An admonition is a structured box with a tinted title bar, an optional icon, and body content on the page surface — like the `!!! note` callouts in mkdocs. Use `.alert-title` for the header and `.alert-body` for the content. Intent classes tint the title bar background and the border.

```html demo
<div class="stack">
  <div class="alert admonition">
    <div class="alert-title">
      <i class="ti ti-info-circle" aria-hidden="true"></i>
      Note
    </div>
    <div class="alert-body">
      <p>An admonition with a tinted title bar. The body rests on the page background.</p>
    </div>
  </div>

  <div class="alert warning admonition">
    <div class="alert-title">
      <i class="ti ti-alert-triangle" aria-hidden="true"></i>
      Warning
    </div>
    <div class="alert-body">
      <p>The intent tints the title bar, the border, and the body uses <code>var(--surface)</code>.</p>
    </div>
  </div>
</div>
```

## CSS hooks

- `--alert-pad-inline` — inline padding. Stays stable across `.sm`/`.lg`.
- `--alert-pad-block` — block padding.
- `--alert-font-size` — base font size.
- `--alert-icon-size` — size of a leading `.alert-icon`.
- `--alert-dismiss-size` — inline and block size of the `.alert-dismiss` button.
- `--alert-dismiss-icon-size` — size of the dismiss glyph.
- `--alert-radius` — corner radius, when the default `--radius-lg` does not fit.
- `--alert-border-inline-start-color` / `--alert-border-inline-start-width` — extension points for a callout-style colored flag on the leading edge instead of a uniform border.

Prefer intents and shared variants for alert colors rather than overriding the
internal color plumbing directly.
