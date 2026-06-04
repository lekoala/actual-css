# Spinner

Inline loading indicators.

## Intents

- `.primary`
- `.secondary`
- `.success`
- `.warning`
- `.danger`
- `.neutral`

## Sizes

- `.sm`
- `.lg`

## Inline

Inline spinner.

```html
<span class="spinner primary"></span>
```

```html
<span class="spinner danger sm"></span>
```

```html
<span class="spinner neutral lg"></span>
```

## Button loading

Button with loading state.

```html
<button class="btn primary loading" type="button">Saving</button>
```

## Accessibility

- Use role="status" with screen-reader text for loading states.
- Loading buttons should be disabled.
