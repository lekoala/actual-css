# Join

Group buttons and inputs with shared border-radius.

## Horizontal

Grouped buttons.

```html
<div class="join">
  <button class="btn primary" type="button">Save</button>
  <button class="btn neutral outline" type="button">Cancel</button>
</div>
```

## Vertical

Stacked group.

```html
<div class="join vertical">
  <button class="btn primary" type="button">Top</button>
  <button class="btn neutral outline" type="button">Bottom</button>
</div>
```

## Block

Full-width group.

```html
<div class="join block">
  <input class="input" type="text" placeholder="Search">
  <button class="btn primary" type="button">Go</button>
</div>
```

## Accessibility

- Join does not add ARIA roles. Add role="group" if semantically appropriate.
