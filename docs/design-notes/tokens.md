# Token architecture

User-facing hooks and theming guidance are in
[Tokens](../pages/foundations/tokens.md). This note records implementation
constraints and the reasoning behind the token system.

## Scope and inheritance

Custom properties resolve their references on the element that declares them.
An alias declared only on `:root` arrives in a theme island already resolved,
so it cannot follow the island's palette. Theme-derived aliases must be
redeclared on `:root, [data-theme]`.

Optional hooks such as `--state-selected-text` reset to the guaranteed-invalid
value at each theme boundary. Consumers then fall back to that theme's
`--state-selected`, rather than inheriting an outer theme's resolved color.

Instance geometry resets on each instance; palette, rhythm, and policy inherit.
A reset is safe only when the instance itself consumes the hook. The children
of `.switcher` and `.sidebar-layout` consume their layout hooks, so those hooks
keep inheriting: a nested instance may also need its parent's value as a child.

## Intent boundaries

Intent classes expose `--intent`, `--intent-fg`, and `--intent-soft-fg`.
Each consuming component resets the relays it uses in a `:where()` rule.
This stops ancestor intents from tinting nested components while allowing a
local intent class to win by specificity. Both directions are covered by
`tests/css-audit.test.js`, `tests/browser/intent-boundary.test.js`, and
`tests/browser/soft-boundary.test.js`.

## Size and density

Size changes optical scale; density changes spacing and geometry independently
of text and icons. Components participate only where that distinction is
meaningful. Controls change geometry and rhythm, content rows change rhythm,
and badges, avatars, and other intrinsically sized components keep their own
size scale. Explicit local size wins over inherited density where they overlap.

## Palette

A coherent palette treats surfaces, text, borders, intents, and shadows as related roles rather than isolated colors.

Coherence does not mean that every token must be chromatic. Pure or near-pure whites and blacks remain legitimate where their role calls for them; what matters is that the surrounding neutral ramp and derived treatments belong to the same visual family.

Neutral roles may lean toward the palette's ambient hue — by default the primary's — while lightness and chroma stay curated per role. Chroma runs strongest through the ramp's mid-lightness rungs, often around `--border` and `--text-muted` depending on the color scheme, and tapers toward both ends. A palette whose accent is deliberately warmer or cooler than its paper picks an ambient hue of its own.

Semantic intents are curated colors, not mechanical derivatives of `--primary`. Danger, warning, and success stay recognizable for their function, but they are chosen as members of the theme palette rather than copied independently from a generic scale. Neither intents nor neutrals are derived from `--primary` at runtime: the relationship is a design decision recorded in the theme's own values.

Actual ships a theme, not a palette. A palette lists available colors (`blue-100` … `blue-900`); a theme assigns meaning (primary, danger, surface, text). Components consume only the roles, so bundled color scales would add hundreds of custom properties the framework never reads and widen the public API without adding behavior. Applications bring their own source — a palette library, brand guidelines, literal values — and map it to the roles at the theme boundary.

Color should reinforce structure and meaning, not carry them alone. Information hierarchy and semantic states should remain understandable when hue is removed or unavailable. Desaturating a composition is a useful review heuristic, not a conformance test.

## Soft foreground calibration

Calibrate soft text against the closest resting and hovered surfaces, not just
against the page. Translucent tints change with the surface underneath, and
hover adds intent through `--soft-hover-alpha`. The default theme's per-role
foregrounds hold 4.5:1 on `--surface`, `--surface-raised`, and `--surface-subtle`
in both schemes; `tests/browser/soft-recipe.test.js` enforces that contract.
Named themes reset these hooks to avoid inheriting colors calibrated for the
default palette. Their global mix or per-role hooks need separate measurement.

## Contextual color interpolation

**When an intent is tinted against a theme-controlled surface or border, the mix interpolates in `oklab`.** That covers the soft recipe, the checked `.choice-card` tint, and the `.overline.pill` border.

Not because rectangular interpolation is more faithful to the intent hue — across the shipped presets it is a few degrees *less* faithful. A browser treats hue as powerless below a small chroma epsilon, so for the low-chroma surfaces and borders the presets actually use, a polar mix snaps cleanly onto the intent and wins.

The reason is continuity. A theme owns `--surface` and `--border`, and may put them anywhere from achromatic to vivid. Under polar interpolation that range contains a cliff: below the epsilon the mix tracks the intent, above it the surface hue starts winning, and crossing it moves the result into a different color family — 116 degrees, a soft `.secondary` landing in the greens. Cartesian interpolation responds smoothly across the whole range a public token allows. A recipe that is only correct while an adopter's surface stays under an unstated, implementation-defined threshold is not a contract, so the framework trades a small continuous error for a predictable one. The present cost is imperceptible: the largest difference the rule introduces in any preset is 3/255 on one channel.

Mixing against `black`, `white`, `transparent`, or `currentColor` is exempt and stays in `oklch`: those have no hue to interpolate, so both spaces give byte-identical results. Polar interpolation also stays legitimate where hue rotation is the point, such as sweeping a gradient through hues. `bun run check:color-space` enforces the rule for contextual tints and takes an `intentional-oklch` comment as an escape hatch.

## Motion

Ordinary interaction/state transitions have **no easing token**: they use the CSS default `ease` directly, and the dialog shake feedback plus the `actual-dialog` View Transition keep that default deliberately. The presence pair exists only for one-shot open/close where open and closed states own separate easing values (`.status-bar`/`.is-open`, `dialog.modal[open]`, `dialog.drawer[open]`): `--ease-enter` decelerates the appearance, `--ease-exit` accelerates the departure. The pair follows Material's standard rhythm; the emphasized-decelerate entrance is deliberately not offered because it only pays off at 250–400ms durations, beyond this vocabulary. Backdrops keep `ease` — a scrim only fades, it does not travel — but track their surface's duration. Toggles that share one transition list at `--duration-fast` (flyout, tooltip) also stay on `ease`: at 100ms the curve barely resolves and entry/exit cannot split on a single rule. These absences are deliberate, not gaps; a theme with a different motion character overrides `--ease-enter` / `--ease-exit`.

## Internal tokens

Internal tokens are allowed when they reduce duplication or make component code clearer.

### Variant plumbing

The shared visual variants are:

- `.solid`: full background, paired foreground. This is the default for buttons.
- `.soft`: lightly tinted background, colored text. Good for alerts, badges, and secondary actions.
- `.outline`: transparent background, colored border and text.
- `.surface`: the page surface with the theme border, and the intent only in the text. The neutral chrome neither `.soft` (the intent-tinted treatment) nor `.outline` (no fill) can give.

Buttons also support two button-only variants:

- `.ghost`: transparent button with hover affordance.
- `.link`: button semantics with link presentation.

Do not force `.ghost` or `.link` onto components where the interaction model does not fit. Shared API should follow shared use.

Components map global tokens to local aliases once at the top of the component and consume local tokens afterwards:

```css
.btn {
  --btn-bg: var(--ui-bg, var(--btn-default-bg, var(--intent, var(--neutral))));
  --btn-fg: var(--ui-fg, var(--btn-default-fg, var(--intent-fg, var(--neutral-fg))));
  --btn-border: var(--ui-border, var(--btn-default-border, transparent));

  border: var(--border-width) solid var(--btn-border-color, var(--btn-border));
  border-block-end-color: var(
    --btn-border-block-end-color,
    var(--btn-border-color, var(--btn-border))
  );
  border-block-end-width: var(--btn-border-block-end-width, var(--border-width));
}
```

The `--btn-*` fallbacks are intentionally inherited extension points for themes that change button grammar — such as turning the default solid button into a surface button with an intent-colored lower edge (the `edge` theme does exactly this). Keep them local until the same need appears across multiple components.

Text controls (`.input`/`.textarea`/`.select`) expose the same lower-edge extension point: `--control-border-block-end-color` and `--control-border-block-end-width` are unset by default and fall back to the regular border, so a theme can give inputs an underline-style lower edge the same way, without fighting the hover/focus/disabled state rules that still own `--control-border` itself.

Alerts expose the same idea on the leading edge instead of the lower one: `--alert-border-inline-start-color` and `--alert-border-inline-start-width` are unset by default and fall back to the regular `--ui-border`, so a theme can turn an alert into a callout with a colored flag on the inline-start side, matching the classic notice pattern, without a per-variant override.

A theme is not limited to the tokens above; it can restate any component-local token or rule under a state selector to change the interaction recipe itself, not just the palette. The `gradient` theme does this for field focus: it restores a `--focus` border plus an outer translucent halo in place of the core inset outline.

Rules:

- Prefix internal component tokens with the component name (`--btn-*`, `--alert-*`, `--card-*`).
- Prefix shared variant plumbing with `--ui-*`.
- The shared relays `--ui-*`, `--intent*`, and `--density-*` are framework plumbing: they are classified once at framework level, not restated in every component file.
- Keep component-specific variants in component code when they do not generalize.
- `flush` is a shared modifier: it removes the component's outer chrome so the component sits directly inside an existing surface (`.accordion.flush`). Reuse the term one component at a time when the same integration need appears elsewhere; `separated` stays component-local until a second real consumer exists.
- Do not require users to override internal tokens for ordinary theming.
- Promote an internal token to public only when there is a repeated, reasonable customization need.
- A custom property used only in a fallback position (`var(--x, default)`) and never declared is an unset extension point and must carry a classification — public, framework plumbing, or internal. `check:css-api` fails on any unclassified fallback-only property; it does not force an artificial declaration to satisfy the audit.

## Component mapping

Components map global tokens to local aliases at the top of the component, then use the local tokens afterwards. This makes the contract obvious:

```css
.alert {
  --alert-bg: var(--ui-bg, var(--surface-subtle));
  --alert-fg: var(--ui-fg, var(--intent, var(--text)));
  --alert-border: var(--ui-border, var(--border));

  border: var(--border-width) solid var(--alert-border);
  border-radius: var(--alert-radius, var(--radius-lg));
  background: var(--alert-bg);
  color: var(--alert-fg);
}
```

- theme authors adjust global tokens
- variant code adjusts `--ui-*`
- component code consumes local aliases

## Non-goals

- Do not expose a separate token for every selector.
- Do not mirror Pico-style component-specific variables unless there is a clear need.
- Do not add Tailwind-like color scales as public API.
- Do not rely on Sass, PostCSS, or generated token files.
- Do not make dark mode required for old browsers. Light mode is the fallback.
