# Dialog

> Centered modal overlay for focused tasks, confirmations, or forms, built on the native `<dialog>` element.

**Related terms:** modal, alert dialog, confirmation dialog.

## Class reference

| Class                  | Kind      | Description                                    |
| ---------------------- | --------- | ---------------------------------------------- |
| `.modal`               | Component | Centered surface on the native `<dialog>`.     |
| `.scrollable`          | Variant   | Header and footer stay while the body scrolls. |
| `.dialog-confirmation` | Variant   | Message above a full-width action band.        |
| `.dialog-icon`         | Component | Circular intent-aware icon well.               |
| `.dialog-close`        | Component | Icon-only close button, at the top end.        |

`.dialog-close` sits outside the content flow, so it does not take part in the
dialog's own layout.

## Usage

Modals use the platform-native `<dialog class="modal">` element with `commandfor` and `command` buttons.

Use `command="show-modal"` to open a modal dialog.

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
  <button class="dialog-close"
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

## Scrollable modal

Use `modal scrollable` when the header and footer should stay visible while the
dialog body scrolls. Modal dialogs lock page scroll while a modal is open: the
runtime writes `html.has-modal-open`, and the stylesheet applies `overflow:
hidden` (and reserves the scrollbar gutter with `scrollbar-gutter: stable` when
one was present).

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

Flyouts and tooltips opened from inside a modal dialog are mounted inside the
dialog so they stay in the same top-layer context.

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
  <button class="dialog-close"
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
* `data-dialog-modal="false"` opens with `show()` instead of `showModal()`.
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
tooltips mounted inside a modal dialog rely on viewport coordinates.

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

The close button is anchored to the dialog surface, not the content flow: it
sits at the top `inline-end`, inside the panel. The button itself is out of
flow, while the header reserves enough inline padding to keep its title clear.
Keep the button a direct child of `dialog.modal` so the scrolling content
(`> form` or `> .stack`) never competes with it.

## CSS hooks

- `--modal-size` — maximum dialog width. Fallback-only, so a class on the
  dialog or an inherited value both reach it. A dialog is shrink-to-fit: a
  composition that must fill this width sets `inline-size` as well.
- `--dialog-viewport-gap` — distance kept between the dialog and the viewport edges.
- `--dialog-icon-size` — diameter of the `.dialog-icon` circle.
- `--dialog-icon-glyph-size` — size of the glyph centered inside `.dialog-icon`.
- `--control-size` — inline and block size of the `.dialog-close` button. The
  header reserves `calc(var(--control-size) + var(--space-30))` on its inline
  end so the title never runs under the close.
- `--dialog-close-icon-size` — size of the close glyph.
