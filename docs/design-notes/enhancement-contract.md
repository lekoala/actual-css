# Enhancement contract

Actual CSS 0.2 splits CSS and JavaScript into two independent layers with a shared
opt-in mechanism. Every component uses the same grammar.

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

## When a token, when a `data-*`

> `data-enhance` is a generic opt-in for when HTML does not already provide an unambiguous one.

- **A token** is for a root controller — a behavior that owns a subtree and manages
  descendants (tabs, flyout, scrollspy, validation).
- **A self-describing `data-*`** is for a leaf whose attribute is simultaneously the opt-in
  and the configuration (`data-tooltip`, `data-mask`, `data-filter`,
  `data-context-menu`).
- **Elements that are their own opt-in** need nothing (`<dialog>`).

`data-enhance` is explicitly **not** a mandatory prefix for every module.

## One registration per enhancement per root

No core mechanism prevents registering the same token twice on the same root; doing so
creates two independent records that both run. This is documented behaviour, not guarded
at runtime.

## CSS must never select on `data-enhance`

CSS rules must not select on `data-enhance` or the runtime marker
`data-actual-surface`. Selecting on either would make the CSS API depend on the JS API,
defeating the split.

## Design decisions recorded

| # | Decision | Rationale |
|---|----------|-----------|
| D2 | `selectors.js` drops its 5 discovery entries, keeps 11 write-side state entries | The file's job changes from *CSS↔init bridge* to *state vocabulary the runtime writes*. It stays the single file to alias for another CSS framework. |
| D4 | `status.js` uses `[data-status][role="status"]` — no class, no token | The markup already carries `role="status"` everywhere. Semantics alone scope the document-wide lookup. |
| D5 | `<dialog>` gets no token | `<dialog>` is its own opt-in: semantic, native, CSS-agnostic. |
| D6 | `validation.js` accepts `[data-field-error]` as an alias for `.field-error` and keeps `.field` / `.danger` as an optional, degrading presentation adapter | Validation is the one module with intentional, optional CSS coupling. The adapter degrades to a no-op under foreign CSS while `aria-invalid`, focus management, custom rules, and server errors all keep working. |
| D7 | Context-menu reuses `surface`, not `flyout` | The panel gets no token; `menuFor()` validates semantically (`menu, [role="menu"]`). A context menu may legitimately want the flyout *look* without the flyout *behavior*. |
| D9 | Orphaned mounted surfaces closed from the origin's disconnect handler | A `fix:`, not part of the contract itself. Landed independently. |

### Accepted debt

`flyout.js`'s trigger selector `[aria-controls][aria-expanded]` is the broadest selector
in the runtime and matches unrelated application disclosures (`connectTrigger` bails
afterwards via `flyoutFor()`). It is already ARIA-only and stays as-is:

> Broad trigger discovery is intentional for dynamically inserted triggers.
> Revisit only if profiling or interoperability shows a real problem.

## Token vocabulary (0.2.0)

| Token | Behavior | Existing class |
|-------|----------|---------------|
| `tabs` | Tab panel switching, arrow-key navigation | `.tabs` |
| `flyout` | Trigger → panel positioning, open/close | `.flyout` |
| `scrollspy` | Scroll-driven nav highlighting | `.scrollspy` |
| `validation` | Form validation, focus management, server errors | `.needs-validation` |

Four tokens. Everything else stays self-describing.
