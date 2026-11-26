# Enhancement contract

Actual CSS splits CSS and JavaScript into two independent layers with a shared
opt-in mechanism. Every component uses the same grammar.

## Popover ownership

The runtime owns `popover="manual"` and native show/hide calls on managed
surfaces and tooltips. Native automatic dismissal would compete with Actual's
close policy. Canceling `beforetoggle` would leave the runtime's open state
out of sync with platform visibility, so applications cancel
`actual:surface-open` before promotion instead.

Explicit tooltips stay in place to preserve inherited context. Generated
tooltips are mounted outside the trigger's sibling sequence: inserting one
beside the trigger would change structural selectors such as
`.join > :last-child`. Generated tooltips therefore make no promise to inherit
the trigger's theme or density.

## The four-layer contract

```text
class          = presentation           (.tabs, .flyout, .needs-validation)
data-enhance   = JavaScript behavior    (data-enhance="tabs")
ARIA / HTML    = semantics              (role="tab", aria-controls, hidden)
data-*         = behavior configuration (data-mask, data-tooltip, data-filter)
```

The duplication is deliberate:

```html
<div class="tabs" data-enhance="tabs" role="tablist">
```

- `.tabs` opts into the Actual CSS presentation;
- `data-enhance="tabs"` opts into the JavaScript behavior;
- `role="tablist"` declares semantics to assistive technology.

Each layer can be removed independently:

```html
<!-- CSS only: no JS behavior, just styling -->
<div class="tabs" role="tablist">…</div>

<!-- JS only: custom CSS, Actual behavior -->
<div class="my-tabs" data-enhance="tabs" role="tablist">…</div>

<!-- Both: standard Actual look and behavior -->
<div class="tabs" data-enhance="tabs" role="tablist">…</div>

<!-- Semantic only: author handles everything else -->
<div role="tablist">…</div>
```

## `data-enhance` grammar

Tokens are whitespace-separated, matched with the `~=` attribute selector, case-sensitive,
and must match `[a-z][a-z0-9-]*`. Order is irrelevant; duplicates are harmless.

```html
<form data-enhance="validation autosubmit">  <!-- two behaviors -->
```

`applyEnhancement()` is an application-owned authoring convenience: it writes
the same tokens and refreshes their containing registrations. It does not watch
presentation classes or establish a second discovery contract. Walking the
scope's ancestors finds lifecycle owners even when the query scope is narrower
than the registration root, without crossing shadow boundaries.

## When a token, when a `data-*`

> `data-enhance` is a generic opt-in for when HTML does not already provide an unambiguous one.

- **A token** is for a named behavior whose opt-in carries no configuration,
  whether it owns a subtree or enhances one leaf (tabs, flyout, range,
  scrollspy, validation).
- **A self-describing `data-*`** is for a leaf whose attribute is simultaneously
  the opt-in and the configuration (`data-tooltip`, `data-mask`, `data-filter`,
  `data-context-menu`).
- **Elements that are their own opt-in** need nothing (`<dialog>` outside a
  Web Component).

`data-enhance` is explicitly **not** a mandatory prefix for every module.

## One registration per enhancement per root

`registerEnhancement()` owns a name per root. Registering the same token twice
on the same root throws; `disconnect()` releases the name; re-registration
after disconnect is allowed; the same token on a different root is independent.

Named registrations share one `[data-enhance]` discovery gate per root: however
many behaviors are registered, the observer queries that single selector and
each registration matches its own `[data-enhance~="name"]` against what it finds.
`enhance()` records share the same observer and lifecycle with their arbitrary
selectors. Behaviors on one element start in no guaranteed order and must not
depend on each other.

`enhance()` stays generic and unguarded — registering the same selector twice
creates two independent records that both run.

The owner of a custom enhancement root must call `disconnect()` when disposing
that root; the default `document.documentElement` root is not affected.

`enhance(…, root)` owns the lifecycle boundary. It scans additions inside that
root, preserves instances moved within it, and requests cleanup once an instance
leaves it—even when the element remains connected elsewhere. An enhancer's
cleanup must therefore be authoritative and idempotent: it releases its state
when called and must not repeat the root-membership decision.

An optional `enhance()` acceptance predicate narrows lifecycle membership
without another observer. Discovery and the removal sweep recheck it, so moves
across a behavioral boundary clean up or initialize the element as needed.

Core lifecycle primitives accept a `Document`, `Element`, or `DocumentFragment`
root, and command targets resolve in the trigger's document or shadow root.
Built-in auto-registration observes the document tree. It does not discover or
manage built-ins created inside shadow roots. Applications that own a custom
root can install their own enhancements with the core APIs and must dispose
those registrations explicitly.

## Choosing a JavaScript primitive

- Use a command for an immediate trigger-to-current-target action. Commands
  resolve the DOM at event time and do not own element lifecycle.
- Use `registerEnhancement()` for a named, opted-in behavior that owns listeners
  or state for a subtree or leaf.
- Use `enhance()` for a self-describing leaf behavior that needs connection and
  cleanup lifecycle without a named token.
- Prefer delegation when no persistent per-element state is required.
- Give instance-owned listeners an `AbortController`, and abort it from the
  instance cleanup.

## CSS must never select on `data-enhance`

CSS rules must not select on `data-enhance` or the runtime marker
`data-actual-surface`. Selecting on either would make the CSS API depend on the JS API,
defeating the split.

## Design decisions recorded

**D2 — `selectors.js` drops its 5 discovery entries and keeps 9 state
entries.** The file's job changes from *CSS↔init bridge* to *state vocabulary
the runtime writes*. It stays the single file to alias for another CSS
framework.

**D4 — `status.js` uses `[data-status][role="status"]`, with no class and no
token.** The markup already carries `role="status"` everywhere, so semantics
alone scope the document-wide lookup.

**D5 — `<dialog>` is its own opt-in outside Web Components.** Custom-element
ancestors and shadow roots reserve lifecycle ownership for the component.
`data-enhance="dialog"` delegates it explicitly to Actual, independently of
presentation classes. Both discovery and dialog command resolution apply this
boundary; the command router leaves rejected targets' native clicks alone.

**D6 — `validation.js` accepts `[data-field-error]` as an alias for
`.field-error`, and keeps `.field` / `.danger` as an optional, degrading
presentation adapter.** Validation is the one module with intentional, optional
CSS coupling. The adapter degrades to a no-op under foreign CSS, while
`aria-invalid`, focus management, custom rules and server errors all keep
working.

**D7 — Context-menu reuses `surface`, not `flyout`.** The panel gets no token;
`menuFor()` validates semantically (`menu, [role="menu"]`). A context menu may
legitimately want the flyout *look* without the flyout *behavior*.

**D9 — The surface reaper handles DOM removal.**
`prepareSurface()` writes the internal `data-actual-surface` marker used for
discovery. The reaper is a fallback for removal by code that cannot call
`disconnectSurface()`.

## Surface lifecycle

The surface is the panel element. Its ID is an address that declarative
triggers resolve as needed. Retention, opening and DOM connection each track
a different part of its lifetime.

- **Retention.** `retainSurface(panel)` gives a consumer a reference to that
  element and returns its release function. Several consumers can retain the
  same panel. Each release takes effect once. The final release disconnects
  the runtime wiring. Retaining a panel leaves its current opening intact.
- **Opening.** A connected panel can be opened directly or through a
  trigger. Only an active opening owns an Escape entry, position tracking,
  and scroll dismissal listeners. Closing ends that opening and keeps the
  last focus return target available to a dialog command from the panel.
  `disconnectSurface()` clears that target and removes the panel's runtime
  wiring. Both operations leave the DOM node and outstanding retains intact.
- **DOM connection.** Removing a panel ends its opening and tears down its
  wiring once the runtime observes the removal. Outstanding retains still
  refer to that same object. Cleanup also works if the trigger and panel
  are removed in the same mutation batch, regardless of teardown order.

### DOM mutations

- **Removal followed by reinsertion.** If the panel is absent when the
  mutation batch is processed, reinserting the same element leaves it closed.
  A later activation can wire and open it again using the existing reference.
- **Move within the document.** An element that stays in the document at the
  end of the mutation batch keeps its identity and retains. If the move also
  preserves the native popover, the opening can continue. If the platform
  closes it during the move, Actual ends that opening and releases its
  resources. The panel can be opened again on the next activation.
- **Replacement at the same ID.** The old element ends its opening. On the
  next activation, the trigger resolves the current element, releases its
  reference to the old one and retains the replacement. The replacement
  starts with its own wiring and opening state.

Trigger teardown can explicitly close its panel before releasing it. For
example, removing the source of an open context menu dismisses that opening
even if another trigger retains the menu.

## Token vocabulary

| Token        | Behavior                                         | Existing class           |
| ------------ | ------------------------------------------------ | ------------------------ |
| `tabs`       | Tab panel switching, arrow-key navigation        | `.tabs`                  |
| `flyout`     | Trigger → panel positioning, open/close          | `.flyout`                |
| `range`      | Fill share and named-value synchronization       | `.range`                 |
| `scrollspy`  | Scroll-driven nav highlighting                   | `.scrollspy`             |
| `in-view`    | One-shot viewport appearance state               | `.reveal`, `.mark-sweep` |
| `validation` | Form validation, focus management, server errors | `.needs-validation`      |
| `dirty`      | Unsaved-changes state on a form                  | —                        |
| `ajax`       | Form submission through `fetch`                  | —                        |

Eight tokens. Everything else stays self-describing.

`in-view` is a presentation trigger, not an animation system: it writes
`is-pending` while an element waits outside the viewport and removes it on the
first intersection. The effect's CSS owns what that state looks like, and the
element is never hidden before the observer's first callback reports it off
screen. Its one concession to motion is focus: a release by `focusin` finishes
the animations that removing the state started, found by difference, because
a CSS `:focus-within` override lapses on blur and replays the entrance.
