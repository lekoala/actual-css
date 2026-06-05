## Applied in Actual CSS

Actual CSS now keeps the richer rule format only for architectural rules.

- `ARCHITECTURE.md` uses `Rule`, `Reason`, and `Allowed exceptions` blocks for the core architectural constraints.
- `AGENTS.md` stays short and points back to architecture rationale instead of duplicating it.
- Small preferences remain lightweight; only architecture-carrying rules get the richer treatment.

Yes, exactly. Rules without rationale often become cargo-cult constraints.

For agents, a rule like:

Do not duplicate palette values in component CSS.

is useful, but a better rule is:

Do not duplicate palette values in component CSS.
Reason: palette ownership belongs to themes/intents; duplicating values makes theme changes drift and causes inconsistent dark-mode behavior.
Exception: temporary debug styles or isolated demo-only examples, clearly marked and not shipped.

That gives the agent three things:

What to do
Why it matters
When the rule can bend

That last part is important. Without exceptions, agents either ignore rules or apply them mechanically.

Your rules would be stronger as “rule / rationale / exception” blocks.

Something like this:

## Core Rules

### Components consume shared semantic variables

Rule:
Components consume shared semantic variables. Do not duplicate palette values in component CSS.

Reason:
Themes and intent files own color decisions. Components should express local structure and map to shared variables. Duplicating palette values makes themes, dark mode, and intent variants drift.

Allowed exceptions:
- Truly component-specific non-theme visual constants, such as internal opacity values or geometry.
- Temporary demo/debug styles, if clearly isolated outside framework source.

---

### Foreground tokens stay explicit

Rule:
Keep explicit foreground tokens such as `--primary-fg`. Do not auto-compute contrast at the component layer.

Reason:
Contrast decisions are part of theme/intent design, not component behavior. Component-level contrast computation can produce inconsistent results across browsers, variants, and transparent surfaces.

Allowed exceptions:
- Experimental contrast logic may live in the theme/intent layer if documented and covered by contracts.
- Components may consume computed foreground variables, but should not define the computation.

---

### Defaults use low specificity

Rule:
Use `:where()` for defaults when practical to keep specificity low.

Reason:
Framework defaults should be easy to override. Low specificity keeps the framework composable with user CSS, utilities, and local app styles.

Allowed exceptions:
- State selectors or modifiers may use normal specificity when needed for clarity.
- Avoid `:where()` if it makes the selector harder to understand or changes expected cascade behavior.

---

### Avoid forceful or legacy APIs

Rule:
Avoid `!important`, ID selectors, and component-specific variant APIs such as `.btn-primary`.

Reason:
The framework should remain composable and consistent. Forceful selectors are hard to override, and component-specific variant APIs duplicate the global intent system.

Allowed exceptions:
- `!important` only for documented utility classes whose purpose is explicit override behavior.
- Compatibility aliases may exist if intentionally supported and documented, but they should map to the shared variant/intent system.

---

### Transparent hover states use shared variables

Rule:
Do not use `filter: brightness()` for transparent variant hover states. Use shared hover variables instead.

Reason:
`filter: brightness()` affects the whole rendered element, including text and icons, and behaves poorly with transparency. Shared hover variables keep foreground, background, border, and theme behavior controllable.

Allowed exceptions:
- None in framework source unless a specific visual effect intentionally requires filtering and is documented as such.

This is much better than a flat list.

The key is not to overdo it. I’d use this richer format only for architectural rules, not for every tiny preference.

A compact template could be:

### Rule name

Rule:
...

Reason:
...

Exceptions:
...

Or even shorter:

- Rule: Components consume semantic variables, not raw palette values.
  Why: themes/intents own color decisions; duplication causes drift.
  Exceptions: isolated demo/debug styles only.

For your project, I’d definitely expose rationale for these five rules because they are not arbitrary style preferences. They encode the architecture.
