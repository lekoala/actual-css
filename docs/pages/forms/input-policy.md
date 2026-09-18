# Input Policy

> Native input intent first. Actual's runtime filters values only when explicitly asked, and fixed-shape masks stay opt-in through `data-mask`.

**Related terms:** telephone, phone, tel-prefix.

`inputmode` changes the virtual keyboard but does not constrain the value. Actual
does not filter plain `inputmode` fields by default because numeric entry often
needs temporary, signed, grouped, or locale-specific values while the user types.

When the JavaScript runtime is loaded, Actual enhances `input[data-filter]`.
Textareas are left alone.

Add an explicit `data-filter` value when the field should enforce one of
Actual's small built-in filters. Unsupported filter names are ignored. An
empty `data-filter` never filters — `inputmode` is not read as a fallback,
even when it is `numeric` or `decimal`. `data-filter="numeric"` /
`data-filter="decimal"` are intentionally destructive (they rewrite the
value as the user types), unlike `inputmode`, which only hints the virtual
keyboard.

```html demo
<label class="field">
  <span class="field-label">Quantity</span>
  <input class="input" inputmode="numeric" data-filter="numeric" placeholder="42" />
</label>
```

```html demo
<label class="field">
  <span class="field-label">Amount</span>
  <input class="input" inputmode="decimal" data-filter="decimal" placeholder="12.34" />
</label>
```

### Built-in filters

The built-in filters are intentionally narrow. They are input helpers, not
domain validation.

- `numeric` — Keeps ASCII digits only: `0` through `9`.
- `decimal` — Converts `,` to `.`, keeps ASCII digits, and keeps the first `.` separator.
- `lower` — Converts the value with `toLocaleLowerCase()`.
- `upper` — Converts the value with `toLocaleUpperCase()`.
- `letters` — Keeps Unicode letters only. Digits, punctuation, symbols, and spaces are removed.
- `slug` — Normalizes accents, lowercases text, turns runs of non-letter and non-digit characters into `-`, collapses repeated `-`, and trims edge separators.

During direct typing, `slug` may keep a trailing `-` until the next character so
words do not merge while the user is still entering text.

Filters can be piped with `|` when a field needs more than one transform. They
run from left to right.

```html demo
<label class="field">
  <span class="field-label">Slug</span>
  <input class="input" data-filter="lower|slug" autocomplete="off" placeholder="release-notes" />
</label>
```

```html demo
<label class="field">
  <span class="field-label">Code</span>
  <input class="input" data-filter="upper|letters" autocomplete="off" placeholder="ABC" />
</label>
```

For signed numbers, locale formatting, currency rules, time ranges, or
app-specific character policies, use application code. Those rules are domain
policy, not a framework default. See the JavaScript docs for custom filter
patterns built on `enhance()`.

### Pattern mask

Use `data-mask` when the input has a fixed shape. Tokens are `9` for a digit,
`a` for a letter, and `*` for any character.

```html demo
<label class="field">
  <span class="field-label">Reference</span>
  <input class="input" data-mask="aaa-999" autocomplete="off" placeholder="abc-123" />
</label>
```

```html demo
<label class="field">
  <span class="field-label">Date</span>
  <input class="input" data-mask="9999-99-99" inputmode="numeric" autocomplete="off" placeholder="yyyy-mm-dd" />
</label>
```

Masks enforce shape, not domain validity. Use application validation when a date
must reject impossible values such as `2026-13-40`.

### Telephone input

Do not mask telephone numbers by default. Phone formatting varies by country,
device, copied source, and user convention. Preserve the entered value, apply
only coarse client-side policy, and normalize or validate the actual number on
the server.

`tel-prefix` is that coarse policy: a local number passes, and an explicit
international number must match one of the allowed prefixes. It analyzes a copy
of the value and never rewrites it.

```html demo
<form class="needs-validation stack" data-enhance="validation" novalidate>
  <label class="field">
    <span class="field-label">Phone</span>
    <input
      class="input"
      type="tel"
      name="phone"
      inputmode="tel"
      autocomplete="tel"
      data-validation-rules="tel-prefix +32"
      aria-describedby="phone-help phone-error"
    />
    <span class="field-help" id="phone-help">
      Local number or +32 international number.
    </span>
    <span class="field-error" id="phone-error">
      Use a local number or an allowed international prefix.
    </span>
  </label>

  <div class="form-actions">
    <button class="btn primary" type="submit">Submit</button>
    <button class="btn neutral outline" type="reset">Reset</button>
  </div>
</form>
```

| Input                | `tel-prefix +32` |
| -------------------- | ---------------- |
| `0470 12 34 56`      | passes           |
| `02/123.45.67`       | passes           |
| `+32 470 12 34 56`   | passes           |
| `0032 470 12 34 56`  | passes           |
| `(+32) 470 12 34 56` | passes           |
| `0033 6 12 34 56 78` | fails            |
| `+33 6 12 34 56 78`  | fails            |

A local number passes in any usual notation, but its digits are required: once
the separators are ignored, letters and stray symbols fail, so a pasted word is
never read as a local number. An explicit international number is normalized
for comparison — `0032…`, `(+32)…`, and `+32 (0)…` all read as `+32` — and a
foreign prefix fails. With no prefix, only local input passes. This is an origin
policy, not phone validation: region detection, number semantics, and E.164
normalization stay on the server. See [validation](validation.md).
