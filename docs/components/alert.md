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

## Guidelines

Do and Don't guidelines using alerts in a grid.

```html .grid.grid-2
<div class="alert success">
  <span class="alert-icon" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span>
  <div class="alert-content">
    <strong>Do</strong>
    <ul>
      <li>Use established variants and color patterns.</li>
      <li>Use to show a status update on a piece of information.</li>
    </ul>
  </div>
</div>
<div class="alert danger">
  <span class="alert-icon" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></span>
  <div class="alert-content">
    <strong>Don't</strong>
    <ul>
      <li>Don't make badges clickable. Use a button instead.</li>
      <li>Don't use alternatives to existing badge variants.</li>
    </ul>
  </div>
</div>
```

## Accessibility

- Use role="alert" only for urgent dynamic messages.
- Do not use role="alert" for static page content.
