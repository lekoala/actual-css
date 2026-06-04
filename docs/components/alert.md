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

```html .list
<div class="alert warning">Check this value.</div>
<div class="alert danger">Payment failed.</div>
```

## Colors

All intent colors with default solid styling.

```html .list
<div class="alert primary">Primary alert</div>
<div class="alert secondary">Secondary alert</div>
<div class="alert success">Success alert</div>
<div class="alert warning">Warning alert</div>
<div class="alert danger">Danger alert</div>
<div class="alert neutral">Neutral alert</div>
```

## Variants

Primary intent across all variants.

```html .list
<div class="alert primary solid">Solid</div>
<div class="alert primary soft">Soft</div>
<div class="alert primary outline">Outline</div>
<div class="alert primary ghost">Ghost</div>
<div class="alert primary link">Link</div>
```

## Sizes

Available sizes.

```html .list
<div class="alert primary sm">Small alert</div>
<div class="alert primary">Default alert</div>
<div class="alert primary lg">Large alert</div>
```

## Accessibility

- Use role="alert" only for urgent dynamic messages.
- Do not use role="alert" for static page content.
