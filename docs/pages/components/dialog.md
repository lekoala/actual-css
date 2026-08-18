# Dialog

> Centered modal overlay for focused tasks, confirmations, or forms, built on the native `<dialog>` element.

## Class reference

| Class | Kind | Description |
|---|---|---|
| `.modal` | Component | Centered modal surface built on the native `<dialog>` element. |
| `.scrollable` | Variant | Keeps the header and footer visible while the dialog body scrolls. |
| `.dialog-close` | Component | Icon-only close button for modal and drawer headers. |

## Usage

Modals use the platform-native `<dialog class="modal">` element with `commandfor` and `command` buttons.

Use `command="show-modal"` to open a modal dialog.

Add `aria-haspopup="dialog"` and `aria-controls="<id>"` to opening buttons so
their semantics are present before either native or framework JavaScript runs.
The command runtime is stateless and does not pre-scan triggers.

Use `command="request-close"` for cancel-style buttons so close requests go
through the dialog's cancel lifecycle.

Use `closedby="any"` as the no-JavaScript light-dismiss path. Add
`data-dialog-dismissible` so the optional runtime provides Actual's controlled
backdrop-dismiss behavior.

## Alert dialog

Use this shape when the dialog interrupts the flow and asks for a decision. It
has no close icon and no light dismiss; the footer actions are the way out.
With the optional runtime, backdrop clicks give a small static feedback instead
of closing.

```html demo
<button class="btn"
        type="button"
        commandfor="delete-dialog"
        command="show-modal"
        aria-haspopup="dialog"
        aria-controls="delete-dialog">
  Delete project
</button>

<dialog class="modal" id="delete-dialog">
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
  <div class="stack">
    <header>
      <hgroup>
        <h3>Release details</h3>
        <p>Changes included in this version.</p>
      </hgroup>

      <button class="dialog-close"
              type="button"
              commandfor="details-dialog"
              command="request-close"
              aria-controls="details-dialog"
              aria-label="Close dialog"></button>
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
  <div class="stack">
    <header>
      <hgroup>
        <h3>Modal overlays</h3>
        <p>Flyouts and tooltips remain above the dialog surface.</p>
      </hgroup>

      <button class="dialog-close"
              type="button"
              commandfor="overlay-dialog"
              command="request-close"
              aria-controls="overlay-dialog"
              aria-label="Close dialog"></button>
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

* `data-dialog-dismissible` enables backdrop click dismissal.
* `data-dialog-modal="false"` opens with `show()` instead of `showModal()`.
* `data-dialog-view-transition` enables a view transition that morphs the dialog to/from its trigger. Only active when the browser supports `document.startViewTransition` and the user allows motion.
* `closedby="any"` is the no-JavaScript light-dismiss path. The runtime rewrites it to `closedby="closerequest"` where supported so dialog light-dismiss keeps the modal workflow intact — the same behavior, just stated in terms the platform understands.

## Browser support

Actual relies on the native `<dialog>` API in its supported JavaScript range
(Safari 15.4+, Firefox 98+, Chromium 99+). No dialog polyfill or fallback shim
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

## CSS hooks

- `--modal-size` — maximum dialog width.
- `--dialog-close-size` — inline and block size of the `.dialog-close` button.
- `--dialog-close-icon-size` — size of the close glyph.
