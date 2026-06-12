# Tokens

Tokens are the public theming surface. They should make the library feel easy to restyle without requiring users to understand every component implementation detail.

The surface stays small by keeping most tokens semantic, not component-specific.

- Global tokens are public API.
- Component-local tokens are implementation details unless documented by that component.
- Components should map global tokens to local variables internally.
- Themes override tokens, not selectors.
- Defaults must work without modern color features or build tooling.
- Modern enhancements can derive better values with `color-mix()`, `light-dark()`, or container queries.

## Public Surface

> Tokens exposed as the public theming API, kept small and semantic.

### Color

Intent tokens are used by `.primary`, `.secondary`, `.success`, `.warning`, `.danger`, and `.neutral`.

```css
:root {
  --primary: hsl(220 90% 56%);
  --primary-fg: white;
  --secondary: hsl(270 60% 56%);
  --secondary-fg: white;
  --success: hsl(145 60% 36%);
  --success-fg: white;
  --warning: hsl(38 92% 50%);
  --warning-fg: hsl(35 30% 12%);
  --danger: hsl(0 75% 55%);
  --danger-fg: white;
  --neutral: hsl(220 10% 42%);
  --neutral-fg: white;
}
```

Surface tokens describe the canvas and elevation model. Components should prefer these over hard-coded colors.

```css
:root {
  --surface: hsl(0 0% 100%);
  --surface-raised: hsl(0 0% 100%);
  --surface-subtle: hsl(220 20% 96%);
  --surface-solid: hsl(222 22% 12%);

  --text: hsl(222 22% 12%);
  --text-muted: hsl(220 10% 42%);
  --text-subtle: hsl(220 8% 55%);

  --border: hsl(220 15% 88%);
  --focus: var(--primary);
  --focus-ring: hsl(220 90% 56% / 0.22);
  --hover-overlay: hsl(220 30% 10% / 0.04);
}
```

Use `*-fg` pairs only for solid backgrounds where the component controls both foreground and background. Do not require a foreground token for every surface token.

### Shape

Shape is intentionally small. Components can derive local radii from these.

```css
:root {
  --radius-sm: 0.25rem;
  --radius: 0.5rem;
  --radius-lg: 0.75rem;
  --border-width: 1px;
}
```

Do not create shape APIs like `.rounded`, `.pill`, or `.square` for every component. Prefer theme-level changes, for example a square theme can set all radius tokens to `0`.

### Spacing

Spacing should be useful without becoming a design-token encyclopedia.

```css
:root {
  --gap: 0.75rem;
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-5: 1.5rem;
  --space-6: 2rem;
}
```

Use `em` for spacing that should scale with the component text size, such as button gaps and inline padding. Use `rem` for global rhythm, layouts, and fixed density.

### Typography

Typography tokens should cover the document baseline and common component needs.

```css
:root {
  --font-sans: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --font-mono: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  --font-body: var(--font-sans);

  --font-size: 1rem;
  --line-height: 1.5;
  --font-weight: 400;
  --font-weight-strong: 650;
}
```

Components can use local font variables for their own mapping, but should inherit by default.

### Controls

Controls share sizing so buttons, inputs, selects, and compact app UI align.

```css
:root {
  --control-size: 2.5rem;
  --control-pad-x: 1rem;
  --control-font-size: 0.9375rem;
}
```

Size modifiers such as `.sm` and `.lg` should set these shared control tokens first. Component-specific size variables can read from them.

```css
.sm {
  --control-size: 2rem;
  --control-pad-x: 0.75rem;
  --control-font-size: 0.875rem;
}

.lg {
  --control-size: 3rem;
  --control-pad-x: 1.25rem;
  --control-font-size: 1rem;
}
```

### Elevation

Use a tiny elevation surface. Components should not invent their own shadow scales.

```css
:root {
  --shadow: 0 0.5rem 1.5rem hsl(220 30% 10% / 0.08);
  --shadow-popout: 0 0.25rem 0.75rem hsl(220 30% 10% / 0.15);
}
```

### Motion

Motion tokens keep transitions consistent and easy to disable.

```css
:root {
  --duration: 150ms;
  --ease: ease;
}

@media (prefers-reduced-motion: reduce) {
  :root {
    --duration: 0.01ms;
  }
}
```

### Icons

Icons used by CSS-only controls are public tokens because users may need to replace them.

```css
:root {
  --icon-chevron: url("data:image/svg+xml,...");
  --icon-check: url("data:image/svg+xml,...");
}
```

Only add an icon token when CSS needs the icon. Markup icons should stay in markup.

## Internal Tokens

> Component-local tokens allowed when they reduce duplication or make component code clearer.

Internal tokens are allowed when they reduce duplication or make component code clearer.

### Variant Plumbing

The shared visual variants are:

- `.solid`: full background, paired foreground. This is the default for buttons and badges.
- `.soft`: lightly tinted background, colored text. Good for alerts and secondary badges.
- `.outline`: transparent background, colored border and text.

Buttons also support two button-only variants:

- `.ghost`: transparent button with hover affordance.
- `.link`: button semantics with link presentation.

Do not force `.ghost` or `.link` onto components where the interaction model does not fit. Shared API should follow shared use.

```css
.btn {
  --btn-bg: var(--ui-bg, var(--intent, var(--neutral)));
  --btn-fg: var(--ui-fg, var(--intent-fg, var(--neutral-fg)));
  --btn-border: var(--ui-border, transparent);
}
```

Rules:

- Prefix internal component tokens with the component name (`--btn-*`, `--alert-*`, `--card-*`).
- Prefix shared variant plumbing with `--ui-*`.
- Keep component-specific variants in component code when they do not generalize.
- Do not require users to override internal tokens for ordinary theming.
- Promote an internal token to public only when there is a repeated, reasonable customization need.

## Theme Contract

> What a theme must override to restyle the library without touching components.

A theme can be complete by overriding only:

- intent colors and foreground pairs
- surface, text, border, focus, and overlay colors
- radius tokens
- optional shadow, motion, and typography tokens

```css
[data-theme="brand"] {
  color-scheme: light;

  --primary: hsl(260 70% 54%);
  --primary-fg: white;
  --secondary: hsl(190 70% 38%);
  --secondary-fg: white;
  --success: hsl(150 58% 34%);
  --success-fg: white;
  --warning: hsl(42 92% 52%);
  --warning-fg: hsl(35 35% 10%);
  --danger: hsl(355 72% 52%);
  --danger-fg: white;
  --neutral: hsl(250 8% 42%);
  --neutral-fg: white;

  --surface: hsl(260 45% 98%);
  --surface-raised: white;
  --surface-subtle: hsl(260 35% 94%);
  --surface-solid: hsl(260 28% 16%);

  --text: hsl(260 24% 14%);
  --text-muted: hsl(260 10% 42%);
  --text-subtle: hsl(260 8% 56%);
  --border: hsl(260 24% 84%);
  --focus: var(--primary);
  --focus-ring: hsl(260 70% 54% / 0.22);
  --hover-overlay: hsl(260 30% 10% / 0.04);

  --radius: 0.625rem;
  --radius-sm: 0.3125rem;
  --radius-lg: 0.875rem;
}
```

Dark themes should set `color-scheme: dark`. Light themes should set `color-scheme: light`.

## Component Mapping

> How components map global tokens to local aliases for a clear theme and variant contract.

Components should map global tokens once at the top of the component and use local tokens afterwards.

```css
.alert {
  --alert-bg: var(--ui-bg, var(--surface-subtle));
  --alert-fg: var(--ui-fg, var(--text));
  --alert-border: var(--ui-border, var(--border));
  --alert-radius: var(--radius-lg);

  border: var(--border-width) solid var(--alert-border);
  border-radius: var(--alert-radius);
  background: var(--alert-bg);
  color: var(--alert-fg);
}
```

This makes the contract obvious:

- theme authors adjust global tokens
- variant code adjusts `--ui-*`
- component code consumes local aliases

## Non-Goals

> Decisions deliberately excluded from the token surface to keep it small.

- Do not expose a separate token for every selector.
- Do not mirror Pico-style component-specific variables unless there is a clear need.
- Do not add Tailwind-like color scales as public API.
- Do not rely on Sass, PostCSS, or generated token files.
- Do not make dark mode required for old browsers. Light mode is the fallback.

## Links

> Reference reading on design tokens and theming approaches.

- https://primer.style/product/primitives/
- https://picocss.com/docs/css-variables
- https://nordhealth.design/tokens
- https://oat.ink/customizing/
- https://modern-css.com/theme-variables-without-a-preprocessor/
