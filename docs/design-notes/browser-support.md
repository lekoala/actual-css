# Browser support strategy

## Actual tiers

The compatibility contract is expressed in browser versions, not ECMAScript
edition labels. Each tier is defined by what it guarantees.

| Actual tier |  Firefox |  Safari | Chromium | Contract                                       |
| ----------- | -------: | ------: | -------: | ---------------------------------------------- |
| Degraded    |      78+ |     14+ |      88+ | Semantic HTML + core CSS; JS unsupported       |
| **Minimal** | **125+** | **17+** | **116+** | Full supported Actual experience, including JS |
| Recommended |     129+ |   17.5+ |     123+ | Target experience                              |

- **Degraded** keeps useful HTML and CSS on older browsers. JavaScript is
  explicitly outside the supported contract there.
- **Minimal** is the JavaScript baseline: the complete Actual experience,
  including the runtime, is supported from this tier up. The runtime assumes
  modern platform primitives available across the whole tier and ships no
  legacy compatibility layer or polyfill.

Only the JavaScript floor is expressed by Minimal. CSS degradation is owed to
Degraded, so a capability being available across Minimal does not make it CSS
baseline — `check:compat` audits stylesheets against the Degraded floor.

Degraded browsers may still run some JavaScript successfully, but that
behavior is not tested, documented as supported, or preserved when the
runtime evolves.

### Native Popover and the tiers

Minimal sits exactly where the manual Popover transport lands: Chromium 116,
Firefox 125, Safari 17. That is what the floor buys, and the whole of what the
runtime requires:

```text
popover="manual"
showPopover()
hidePopover()
top-layer promotion + closed-state display: none
```

`popovertarget`, `popover="auto"` and `:popover-open` arrive on the same
engines and are guaranteed too, but the runtime uses none of them — it keeps
`aria-controls` and drives the lifecycle itself. Newer parts of the API
(`popover="hint"`, interest invokers) are covered by no tier.

| Actual tier | Manual Popover transport | Lifecycle owner                 |
| ----------- | ------------------------ | ------------------------------- |
| Degraded    | no                       | HTML/CSS fallback only          |
| Minimal     | yes                      | `surface.js`                    |
| Recommended | yes                      | native Popover, or `surface.js` |

Actual's presentation classes compose with either lifecycle. `surface.js` uses
the transport and never the native lifecycle, because `popover="auto"` cannot
express `data-flyout-auto-close`; see
[platform-alignment](platform-alignment.md).

## JavaScript philosophy

> The Degraded tier exists primarily to preserve useful HTML and CSS on older
> browsers. It does not constrain the JavaScript runtime.

> Minimal is the JavaScript baseline.

Modern JavaScript supported by all Minimal browsers may be used directly.
Actual does not transpile, polyfill, or wrap platform APIs solely to extend
JavaScript support below Minimal.

### Abortable listeners

Abortable event listeners predate the Minimal floor by a wide margin: Firefox
86, Chrome 88, and WebKit (early 2021). ([Bugzilla][1], [Chrome][2],
[WebKit][3])

> `addEventListener({ signal })` is a baseline runtime primitive.

Do not introduce compatibility wrappers (`listen`, `on`,
`addAbortableListener`, `supportsSignal`) solely to reproduce a capability
that is already native throughout Minimal.

### Native `<dialog>`

Native `<dialog>` predates the floor on every engine: Safari 15.4, Firefox 98,
and Chromium earlier still. ([WebKit][4])

> Native dialog is assumed by the runtime; no dialog polyfill is shipped.

### The manual Popover transport

The floor is set by this capability. `surface.js` promotes a panel with
`popover="manual"` instead of moving it in the DOM, which is what keeps a
surface inside every scope that reaches it by inheritance — see
[surface-reparenting](surface-reparenting.md).

> The manual Popover transport is assumed by the runtime; there is no
> reparenting fallback.

A capability branch was rejected rather than overlooked: the fallback path is
the defect, so keeping it would leave the bug in place for exactly the browsers
the branch would have served.

### Future-direction invariants

1. **Minimal drives JavaScript compatibility; Degraded does not.**
2. **Prefer native platform APIs over compatibility abstractions when they are
   available throughout Minimal.**
3. **Browser versions are the compatibility contract, not ECMAScript edition
   labels.**
4. **Raise Minimal only when doing so buys a concrete simplification, removal
   of a fallback, or materially better implementation.**

> Do not preserve an older JavaScript idiom solely because it happens to run
> in the Degraded tier. If the clearer native alternative is supported
> throughout Minimal, prefer it.

---

## Philosophy

Works everywhere, works best on modern browsers. Wide browser support (even older browsers, not IE 11).

- No consumer build step is required (just CSS).
- No post-processing — use only necessary browser-specific prefixes and engine hooks.
- CSS nesting is not used — code must be findable in the inspector. Rules are organized as if nesting were used, grouped together without nesting syntax. Exception: see [CSS nesting inside @supports](#css-nesting-inside-supports).

## Platform feature baseline

The tiers above are Actual's own contract. The table below tracks the Web
Platform Baseline of the individual CSS features the framework uses; it is a
different notion from an Actual tier.

| Feature area                          | Baseline      | Progressive enhancement              |
| ------------------------------------- | ------------- | ------------------------------------ |
| Layout (flex, grid, position)         | Baseline 2023 | —                                    |
| CSS custom properties                 | Baseline 2023 | —                                    |
| `:has()`                              | Baseline 2023 | —                                    |
| `<dialog>` element                    | Baseline 2023 | —                                    |
| `color-mix()`                         | Baseline 2023 | Fallback flat color                  |
| `light-dark()`                        | 2024+         | Manual theme override                |
| `:user-invalid`                       | 2024+         | `[aria-invalid]` attribute           |
| `transition-behavior: allow-discrete` | 2024+         | Native dialog open/close             |
| `appearance: base-select`             | 2024+         | Native `<select>`                    |
| `@starting-style`                     | 2024+         | Instant appearance                   |
| View Transition API                   | 2024+         | Dialog open/close transition         |
| Popover transport (`manual`)          | Baseline 2025 | none — runtime requirement           |
| CSS Anchor Positioning                | Future        | JS positioning (`@lekoala/floating`) |

Core layout and visual tokens work on all Baseline 2023 browsers. Features marked
2024+ are gated with `@supports` or degrade gracefully through fallback values.

## Dark mode

Dark mode is for modern browsers only (light mode is the fallback otherwise).
Use `color-scheme: light dark` plus `light-dark()` for theme tokens so the
default theme follows the OS without `data-theme`. Explicit themes pin
`color-scheme` to light or dark.

## Progressive enhancement

Modern features are gated with `@supports`; unsupported browsers keep the core layout and controls.

- `color-mix(in oklch, ...)` — enhanced variant surfaces and hover states
- `appearance: base-select` — enhanced select picker on fine-pointer devices
- `backdrop-filter` — enhanced sticky form actions
- `transition-behavior: allow-discrete` — smooth dialog open/close
- `:has()` — button groups, alert icons, disabled choice labels

### @supports usage

Use positive `@supports` by default. Use `@supports not` only for a genuine fallback branch that cannot safely coexist with the enhanced rules. Do not gate a single progressive declaration whose unsupported value is simply ignored by the browser, such as `text-wrap: balance`.

When a baseline declaration is already a valid fallback, prefer the normal cascade to an `@supports` wrapper. For example, older browsers keep the opaque surface here, while newer ones replace it with the translucent value:

```css
background: var(--surface);
background: color-mix(in oklch, var(--surface) 88%, transparent);
backdrop-filter: blur(1rem);
```

### CSS nesting inside @supports

The no-nesting rule protects browsers that predate CSS nesting (Chrome 112, Firefox 117, Safari 16.5). A block already gated behind a later feature can't be reached by any browser that lacks nesting, so the inspector-friendliness argument no longer applies — nest freely inside it. `appearance: base-select` (Chrome 133+) is the current example: everything inside that `@supports` block in `custom-select.css` uses `&`-nesting instead of repeating the `.select:not(...)` selector.

Check the gating feature's baseline against nesting's before relying on this: if a future gate ships on a browser older than nesting's baseline, flatten that block back out.

### Vendor prefixes and engine hooks

Keep a browser-specific prefix only when it reaches a still-relevant engine behavior that the standard property does not cover, or when it targets a browser-only native part. Examples include `-webkit-mask-*` where needed and pseudo-elements such as `::-webkit-scrollbar` or `::-webkit-progress-value`.

Do not retain a prefixed duplicate merely to preserve an optional visual enhancement on older browsers. If the unprefixed declaration or an earlier fallback keeps the component functional and legible, prefer the smaller rule set.

### color-mix fallbacks

Every `color-mix()` declaration needs a flat fallback outside `@supports` (older browsers drop the whole property, not just the function).

### Hover rules

Use `:hover` directly for standard interactive feedback (links, buttons, table rows,
form controls, menu items, tabs, badges). The browser already knows when `:hover` can
apply; guarding it behind `@media (hover: hover)` needlessly suppresses hover on hybrid
devices whose primary pointer is touch but that also have a mouse or trackpad.

Reserve `@media (hover: hover)` only when hover:

- reveals controls or content,
- triggers heavy animation,
- changes layout,
- or is part of an interaction specifically designed for a mouse.

`:active` feedback stays unguarded.

### forced-colors

The default theme maps public color, focus, and shadow tokens to system colors
inside `forced-colors: active`. Components should rely on those tokens first.
Use local forced-color rules only for shapes or states the token layer cannot
infer, such as custom checkbox/switch geometry, native progress/meter parts,
disabled affordances, tooltip arrows, or selected states otherwise expressed
only through background color.

### :has()

- Grouping works with `role="group"` and `:has()`: it is a progressive enhancement; UI should still be functional without it.
- Keep `:has()` out of selector lists that also contain legacy-safe selectors. Put the `:has()` branch in `@supports selector(...)` if necessary.

[1]: https://bugzilla.mozilla.org/show_bug.cgi?id=1679204 "1679204 - Consider to add signal to addEventListener"
[2]: https://developer.chrome.com/blog/new-in-chrome-88 "New in Chrome 88 | Blog"
[3]: https://trac.webkit.org/timeline "WebKit timeline, January 2021"
[4]: https://webkit.org/blog/12209/introducing-the-dialog-element/ "Introducing the Dialog Element"
