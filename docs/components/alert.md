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

An alert with default border styling.

```html .list
<div class="alert">A neutral alert with default border.</div>
```

## Colors

All intent colors with default soft styling.

```html .list
<div class="alert primary"><span class="alert-icon" aria-hidden="true">i</span><span class="alert-content">Primary alert</span></div>
<div class="alert secondary"><span class="alert-icon" aria-hidden="true">i</span><span class="alert-content">Secondary alert</span></div>
<div class="alert success"><span class="alert-icon" aria-hidden="true">✓</span><span class="alert-content">Success alert</span></div>
<div class="alert warning"><span class="alert-icon" aria-hidden="true">!</span><span class="alert-content">Warning alert</span></div>
<div class="alert danger"><span class="alert-icon" aria-hidden="true">!</span><span class="alert-content">Danger alert</span></div>
<div class="alert neutral"><span class="alert-icon" aria-hidden="true">i</span><span class="alert-content">Neutral alert</span></div>
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
