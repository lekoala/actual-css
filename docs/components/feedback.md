# Feedback

Avatar, toast, skeleton, accordion, dialog, and switch.

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

## Avatar

User avatar with initials.

```html
<span class="avatar primary">A</span>
```

```html
<span class="avatar success lg">B</span>
```

## Toast

Toast notification.

```html
<div class="toast success soft">
  <strong>Done</strong>
  <span class="badge success">OK</span>
</div>
```

## Skeleton

Loading placeholder.

```html
<div class="skeleton title"></div>
```

```html
<div class="skeleton text"></div>
```

```html
<div class="skeleton avatar"></div>
```

## Accordion

Collapsible content sections.

```html
<div class="accordion">
  <details open>
    <summary>First item</summary>
    <div class="accordion-body">Content here.</div>
  </details>
  <details>
    <summary>Second item</summary>
    <div class="accordion-body">More content.</div>
  </details>
</div>
```

## Dialog

Modal dialog.

```html
<dialog class="dialog" id="confirm">
  <form method="dialog" class="stack">
    <h2>Confirm</h2>
    <p>Are you sure?</p>
    <div class="cluster">
      <button class="btn neutral outline" value="cancel">Cancel</button>
      <button class="btn danger" value="delete">Delete</button>
    </div>
  </form>
</dialog>
```

## Switch

Toggle switch.

```html
<label class="choice">
  <input class="switch primary" type="checkbox" checked>
  Enable notifications
</label>
```

## Accessibility

- Use role="status" for skeleton loading states.
- Use <dialog> with method="dialog" for accessible modals.
- Switches should have an associated label.
