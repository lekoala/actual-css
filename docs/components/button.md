# Button

Buttons allow the user to take actions or make choices.

## Intents

- `.primary`
- `.secondary`
- `.success`
- `.warning`
- `.danger`
- `.neutral`

## Variants

- `.solid`
- `.soft`
- `.outline`
- `.ghost`
- `.link`

## Sizes

- `.sm`
- `.lg`

## Default

A button with default styling.

```html .inline
<button class="btn primary">Save</button>
<button class="btn neutral">Cancel</button>
```

## Colors

All intent colors with default solid styling.

```html .inline
<button class="btn primary">Primary</button>
<button class="btn secondary">Secondary</button>
<button class="btn success">Success</button>
<button class="btn warning">Warning</button>
<button class="btn danger">Danger</button>
<button class="btn neutral">Neutral</button>
```

## Variants

Primary intent across all variants.

```html .inline
<button class="btn primary solid">Solid</button>
<button class="btn primary soft">Soft</button>
<button class="btn primary outline">Outline</button>
<button class="btn primary ghost">Ghost</button>
<button class="btn primary link">Link</button>
```

## Sizes

Available sizes.

```html .inline
<button class="btn primary sm">Small</button>
<button class="btn primary">Default</button>
<button class="btn primary lg">Large</button>
```

## States

Disabled and loading states.

```html .inline
<button class="btn primary" disabled>Disabled</button>
<button class="btn primary" aria-disabled="true">ARIA Disabled</button>
<button class="btn primary loading">Loading</button>
```

## With icon

Buttons with icon content.

```html .inline
<button class="btn primary">★ Favorite</button>
<button class="btn primary">Save →</button>
```

## Accessibility

- Use a real <button> element for actions.
- Use <a> for navigation links.
- Use disabled attribute or aria-disabled for inactive buttons.
