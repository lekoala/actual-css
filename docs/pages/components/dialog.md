# Dialog

> Centered modal overlay for focused tasks, confirmations, or forms, built on the native `<dialog>` element.

**Related terms:** modal, alert dialog, confirmation dialog.

## Class reference

| Class                  | Kind        | Description                                    |
| ---------------------- | ----------- | ---------------------------------------------- |
| `.modal`               | Component   | Centered surface on the native `<dialog>`.     |
| `.scrollable`          | Variant     | Header and footer stay while the body scrolls. |
| `.dialog-confirmation` | Variant     | Message above a full-width action band.        |
| `.dialog-icon`         | Component   | Circular intent-aware icon well.               |
| `.close`               | Composition | Icon-only close button, at the top end.        |

## Anatomy

`.modal` is the outer surface and deliberately has no inner padding. Wrap its
content in a direct `<form>` or `.stack`; that wrapper owns the padding, rhythm,
and overflow. Put `.stack` on the wrapper, never on `dialog.modal` itself.

For a header band, place `<header>` directly under `dialog.modal`, before the
body wrapper. Put a flexible `.media` title region first and a `.cluster` of
controls second. The title has the close control's minimum height; its leading
icon and every trailing control share the same center axis. A wrapped title
simply makes the row taller.

A direct `dialog > header` is dialog chrome and forms a distinct header band.
Put an ordinary content heading inside the padded `form` or `.stack` instead.

Keep a corner [`.close`](close.md) as a direct child of the dialog and put the
title in the wrapper's direct `<header>`. The button then stays outside the
content flow while the header reserves enough inline space to keep its title
clear.

A `.close` placed as a direct child of the chrome header is still the corner
overlay. That header reserves the same inline room for it, never below its own
`--modal-pad`, so a wrapping title stays clear either way.

Add `.bleed` to that header when it should form a full-width band. It reaches
the dialog edges, keeps the modal's inner padding, and can take a surface token
such as `background: var(--surface-subtle)`.

## Usage

Modals use the platform-native `<dialog class="modal">` element with `commandfor` and `command` buttons.

Use `command="show-modal"` to open a modal dialog, or `command="--show"` to open
it non-modally.

Add `aria-haspopup="dialog"` and `aria-controls="<id>"` to opening buttons so
their semantics are present before either native or framework JavaScript runs.
The command runtime is stateless and does not pre-scan triggers.

Use `command="request-close"` for cancel-style buttons so close requests go
through the dialog's cancel lifecycle.

Use `closedby="any"` as the no-JavaScript light-dismiss path: the native dialog
closes on backdrop click and Escape. Add `data-dialog-dismissible` so the
optional runtime takes over backdrop click and closes with the dialog's
transition; it rewrites `closedby="any"` to `closedby="closerequest"` so the
native dialog and the runtime never double-handle. `data-dialog-dismissible`
only gates backdrop click — Escape and explicit close requests always close,
unless the application cancels the `actual:dialog-cancel` event.

## Alert dialog

Use this shape when the dialog interrupts the flow and asks for a decision. It
has no close icon and no light dismiss; the footer actions are the way out.
`closedby="none"` keeps Escape and backdrop clicks from closing it, so a
critical confirmation cannot be dismissed accidentally. With the optional
runtime, backdrop clicks give a small static feedback instead of closing.

```html demo
<button class="btn"
        type="button"
        commandfor="delete-dialog"
        command="show-modal"
        aria-haspopup="dialog"
        aria-controls="delete-dialog">
  Delete project
</button>

<dialog class="modal" id="delete-dialog" closedby="none">
  <form method="dialog">
    <header>
      <h3>Delete project?</h3>
      <p>This action cannot be undone.</p>
    </header>

    <div>
      <p>The project, saved reports, and connected automations will be removed permanently.</p>
    </div>

    <footer>
      <button class="btn outline" value="cancel">Cancel</button>

      <button class="btn danger"
              value="delete">
        Delete
      </button>
    </footer>
  </form>
</dialog>
```

For a compact destructive confirmation with a leading status icon, compose
`dialog-confirmation` with the media object. The icon well accepts the shared
intent and emphasis classes; `dialog-icon danger soft` creates the tinted red
circle while keeping the glyph centered. The footer becomes a separate action
band without changing the semantics of the form or its buttons.

```html demo
<button class="btn danger"
        type="button"
        commandfor="deactivate-dialog"
        command="show-modal"
        aria-haspopup="dialog"
        aria-controls="deactivate-dialog">
  Deactivate account
</button>

<dialog class="modal dialog-confirmation"
        id="deactivate-dialog"
        closedby="none"
        style="--modal-size: 40rem">
  <form method="dialog">
    <div class="media">
      <span class="dialog-icon danger soft" aria-hidden="true">
        <i class="ti ti-alert-triangle"></i>
      </span>

      <header>
        <h3>Deactivate account</h3>
        <p class="muted">Are you sure you want to deactivate your account? All of your data will be permanently removed. This action cannot be undone.</p>
      </header>
    </div>

    <footer>
      <button class="btn outline" value="cancel">Cancel</button>
      <button class="btn danger" value="deactivate">Deactivate</button>
    </footer>
  </form>
</dialog>
```

For a trailing illustration, use a direct `<header>` as the message region and
compose it as a non-wrapping split cluster. `.grow` keeps the text column
flexible while `.dialog-icon` stays at the inline end. The confirmation variant
pads either this header or the leading-icon `.media` shape above.

Use the same anatomy in a `.card` instead when the surface belongs in page
content and does not need modal focus or a backdrop.

```html demo
<button class="btn"
        type="button"
        commandfor="customize-dialog"
        command="show-modal"
        aria-haspopup="dialog"
        aria-controls="customize-dialog">
  Customize workspace
</button>

<dialog class="modal dialog-confirmation"
        id="customize-dialog"
        closedby="none"
        aria-labelledby="customize-dialog-title">
  <form method="dialog">
    <header class="cluster"
            style="--cluster-align: start; --cluster-justify: space-between; --cluster-wrap: nowrap">
      <hgroup class="grow">
        <h3 id="customize-dialog-title">Make this workspace your own</h3>
        <p class="muted">Choose colors and defaults now, or continue with the current settings.</p>
      </hgroup>

      <span class="dialog-icon success soft" aria-hidden="true">
        <i class="ti ti-check"></i>
      </span>
    </header>

    <footer>
      <button class="btn primary" value="customize">Customize</button>
      <button class="btn ghost" value="later">Later</button>
    </footer>
  </form>
</dialog>
```

## Information modal

Use this shape for contextual information or lightweight secondary content. It
has no action button; the header close button dismisses the dialog.

```html demo
<button class="btn"
        type="button"
        commandfor="details-dialog"
        command="show-modal"
        aria-haspopup="dialog"
        aria-controls="details-dialog">
  View details
</button>

<dialog class="modal"
        id="details-dialog"
        closedby="any"
        data-dialog-dismissible>
  <button class="close"
          type="button"
          commandfor="details-dialog"
          command="request-close"
          aria-controls="details-dialog"
          aria-label="Close dialog"></button>

  <div class="stack">
    <header>
      <hgroup>
        <h3>Release details</h3>
        <p>Changes included in this version.</p>
      </hgroup>
    </header>

    <div>
      <p>The release improves dialog behavior, scroll handling, and progressive enhancement for modern browsers.</p>
      <p>There are no decisions to make here; the content can simply be dismissed when finished.</p>
    </div>
  </div>
</dialog>
```

## Action modal

Use this shape when contextual information leads to one non-destructive next
step, such as reviewing a setup before continuing. Unlike an alert dialog, it
can be dismissed without choosing the action; unlike an information modal, it
has a primary action in a footer.

Use `.dialog-icon` with the media object for a leading title icon. An `.alert`
belongs in the body only when the dialog contains a distinct status message;
the dialog title itself is not an alert.

```html demo
<button class="btn primary"
        type="button"
        commandfor="setup-dialog"
        command="show-modal"
        aria-haspopup="dialog"
        aria-controls="setup-dialog">
  Continue setup
</button>

<dialog class="modal"
        id="setup-dialog"
        closedby="any"
        data-dialog-dismissible
        aria-labelledby="setup-dialog-title">
  <header>
    <div class="media items-center grow">
      <span class="dialog-icon warning soft" aria-hidden="true">
        <i class="ti ti-alert-triangle"></i>
      </span>

      <h2 id="setup-dialog-title">Finish workspace setup</h2>
    </div>

    <div class="cluster">
      <button class="close"
              type="button"
              commandfor="setup-dialog"
              command="request-close"
              aria-controls="setup-dialog"
              aria-label="Close dialog"></button>
    </div>
  </header>

  <form method="dialog" class="stack">
    <div class="card stack">
      <p><strong>Acme workspace</strong></p>
      <p>Team plan</p>
      <p>Starts October 1</p>
    </div>

    <p>Confirm these settings to finish setting up the workspace.</p>

    <footer>
      <button class="btn primary inline-size-full" value="continue">Continue</button>
    </footer>
  </form>
</dialog>
```

## Scrollable modal

Use `modal scrollable` when the header and footer should stay visible while the
dialog body scrolls. Modal dialogs lock page scroll while a modal is open: the
runtime writes `html.has-modal-open`, and the stylesheet applies `overflow:
hidden` (and reserves the scrollbar gutter with `scrollbar-gutter: stable` when
one was present). The height cap follows the small viewport, so the panel keeps
a stable size while mobile browser chrome expands or collapses.

The scrolling body is a scroll container, and browsers make one
keyboard-focusable so it can be scrolled without a pointer — it takes a focus
ring like any other focusable element, and it can claim initial focus when
nothing focusable precedes it. Mark the control you want focused `autofocus`.

```html demo
<button class="btn"
        type="button"
        commandfor="scroll-dialog"
        command="show-modal"
        aria-haspopup="dialog"
        aria-controls="scroll-dialog">
  Open scrollable modal
</button>

<dialog class="modal scrollable"
        id="scroll-dialog"
        closedby="any"
        data-dialog-dismissible>
  <form method="dialog">
    <header>
      <h3>Terms review</h3>
      <p>Review the full text before continuing.</p>
    </header>

    <div class="stack">
      <p>Actual CSS keeps long dialog content inside the dialog surface instead of letting it run past the viewport.</p>
      <p>Section 1. The service stores project settings, interface preferences, and theme choices so teams can keep a consistent working environment.</p>
      <p>Section 2. Administrators can invite users, remove inactive accounts, and review access periodically.</p>
      <p>Section 3. Billing changes may affect future invoices. Existing invoices remain available from the account area.</p>
      <p>Section 4. Export tools are provided for common formats. Large exports may take a few minutes to prepare.</p>
      <p>Section 5. Support requests should include relevant browser, operating system, and account context.</p>
      <p>Section 6. Experimental features can change or disappear before a stable release.</p>
      <p>Section 7. Continued use confirms acceptance of the current terms.</p>
    </div>

    <footer>
      <button class="btn outline" value="cancel">Cancel</button>

      <button class="btn primary" value="accept">
        Accept
      </button>
    </footer>
  </form>
</dialog>
```

## Overlays inside modals

Flyouts and tooltips opened from inside a modal dialog stay exactly where they
are authored. The runtime promotes them to the top layer instead of moving
them, which is what keeps them inside every scope that reaches them by
inheritance.

Author them inside the dialog. Promotion paints an element above a modal, but
it does not lift it out of the modal's inertness — that is computed on the DOM,
not on paint order — so an overlay authored outside the dialog would be
promoted above it and still unclickable.

```html demo
<button class="btn"
        type="button"
        commandfor="overlay-dialog"
        command="show-modal"
        aria-haspopup="dialog"
        aria-controls="overlay-dialog">
  Open modal overlays
</button>

<dialog class="modal"
        id="overlay-dialog"
        closedby="any"
        data-dialog-dismissible>
  <button class="close"
          type="button"
          commandfor="overlay-dialog"
          command="request-close"
          aria-controls="overlay-dialog"
          aria-label="Close dialog"></button>

  <div class="stack">
    <header>
      <hgroup>
        <h3>Modal overlays</h3>
        <p>Flyouts and tooltips remain above the dialog surface.</p>
      </hgroup>
    </header>

    <div class="cluster">
      <button class="btn"
              type="button"
              data-enhance="flyout"
              aria-expanded="false"
              aria-controls="dialog-actions-menu">
        Actions
      </button>

      <button class="btn outline"
              type="button"
              data-tooltip="Tooltip inside a dialog">
        Tooltip
      </button>
    </div>

    <menu class="flyout menu" id="dialog-actions-menu" hidden>
      <li><button class="menu-item" type="button">Archive</button></li>
      <li><button class="menu-item" type="button">Duplicate</button></li>
      <li><button class="menu-item" type="button">Share</button></li>
    </menu>
  </div>
</dialog>
```

## JavaScript options

Add options directly on the dialog element. Without JavaScript, modern browsers
still use the native dialog behavior; the runtime adds declarative command
handling, focus restoration, controlled light dismiss, and optional view
transitions.

Available options:

* `data-dialog-dismissible` gates backdrop click only: the runtime takes over
  light dismiss and closes the dialog (or rewrites `closedby="any"` to
  `closedby="closerequest"` so the native dialog does not double-handle).
  It never affects Escape or explicit close requests.
* `data-dialog-modal="false"` makes direct `openDialog()` calls use `show()`
  instead of `showModal()`. The `show-modal` and `--show` commands override
  this default.
* `data-dialog-view-transition` enables a view transition that morphs the dialog to/from its trigger. Only active when the browser supports `document.startViewTransition` and the user allows motion.
* `closedby` keeps its native meaning: `"any"` closes on backdrop click and
  Escape, `"closerequest"` closes on Escape only, `"none"` disables both. The
  runtime rewrites `closedby="any"` to `closedby="closerequest"` only when
  `data-dialog-dismissible` opts it into light dismiss, and never overrides
  `closedby="none"`. Use `closedby="none"` for critical dialogs that must be
  closed by an explicit action.

## Browser support

Actual relies on the native `<dialog>` API in its supported JavaScript range
(Safari 17+, Firefox 125+, Chromium 116+). No dialog polyfill or fallback shim
is shipped.

## Animation

The base CSS gives supporting browsers small enter and exit transitions. Exit
motion relies on `transition-behavior: allow-discrete` so the native dialog can
remain in the top layer while `display` and `overlay` transition out. Browsers
without that support keep native close behavior.

The open dialog root intentionally ends at `transform: none`; fixed flyouts and
tooltips authored inside a modal dialog rely on viewport coordinates.

### View transition

Add `data-dialog-view-transition` to morph the dialog to/from its trigger using
the View Transition API. The dialog appears to grow out of the trigger on open
and shrink back into it on close, communicating the relationship between the
two.

The effect is progressive: it only runs when the browser supports
`document.startViewTransition` and the user has not requested reduced motion.
Otherwise the dialog simply opens and closes with the baseline dialog
transition.

```html demo
<button class="btn"
        type="button"
        commandfor="vt-dialog"
        command="show-modal"
        aria-haspopup="dialog"
        aria-controls="vt-dialog">
  Open modal
</button>

<dialog class="modal"
        id="vt-dialog"
        data-dialog-view-transition
        data-dialog-dismissible>
  <form method="dialog">
    <header>
      <h3>Title</h3>
      <p>This dialog morphs to and from the trigger button.</p>
    </header>

    <footer>
      <button class="btn outline" value="cancel">Cancel</button>
      <button class="btn primary" value="confirm">Confirm</button>
    </footer>
  </form>
</dialog>
```

## Notes

Prefer native dialog behavior whenever possible. The framework runtime should
not replace the platform modal system; it should only make dialogs declarative,
animation-friendly, and consistent across supported browsers.

## CSS hooks

- `--modal-size` — maximum dialog width. Fallback-only, so a class on the
  dialog or an inherited value both reach it. A dialog is shrink-to-fit: a
  composition that must fill this width sets `inline-size` as well.
- `--modal-pad` — padding of the direct `<form>` or `.stack` content wrapper.
- `--modal-header-bg` — background of a direct header band.
- `--dialog-viewport-gap` — distance kept between the dialog and the viewport edges.
- `--dialog-icon-size` — diameter of the `.dialog-icon` circle.
- `--dialog-icon-glyph-size` — size of the glyph centered inside `.dialog-icon`.
- `--close-size` / `--close-icon-size` — size of the corner `.close` and of its
  X. The header reserves the close size, its edge inset, and a content gap so
  the title never runs under it.
