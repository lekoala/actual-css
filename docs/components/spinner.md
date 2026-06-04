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

```html .inline
<span class="spinner primary"></span>
<span class="spinner danger sm"></span>
<span class="spinner neutral lg"></span>
```

## Button loading

Button with loading state.

```html .inline
<button class="btn primary loading" type="button">Saving</button>
```

## Accessibility

- Use role="status" with screen-reader text for loading states.
- Loading buttons should be disabled.
