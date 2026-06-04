# Alert

Alerts are used for contextual messages.

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

An alert with default soft styling.

```html
<div class="alert warning">Check this value.</div>
```

```html
<div class="alert danger">Payment failed.</div>
```

## Colors

All intent colors with default soft styling.

```html
<div class="alert primary">Primary alert</div>
```

```html
<div class="alert secondary">Secondary alert</div>
```

```html
<div class="alert success">Success alert</div>
```

```html
<div class="alert warning">Warning alert</div>
```

```html
<div class="alert danger">Danger alert</div>
```

```html
<div class="alert neutral">Neutral alert</div>
```

## Variants

Primary intent across all variants.

```html
<div class="alert primary solid">Solid</div>
```

```html
<div class="alert primary soft">Soft</div>
```

```html
<div class="alert primary outline">Outline</div>
```

```html
<div class="alert primary ghost">Ghost</div>
```

```html
<div class="alert primary link">Link</div>
```

## Sizes

Available sizes.

```html
<div class="alert primary sm">Small alert</div>
```

```html
<div class="alert primary">Default alert</div>
```

```html
<div class="alert primary lg">Large alert</div>
```

## Accessibility

- Use role="alert" only for urgent dynamic messages.
- Do not use role="alert" for static page content.
