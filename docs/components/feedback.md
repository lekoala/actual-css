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

```html .inline
<span class="avatar primary">A</span>
<span class="avatar success lg">B</span>
```

## Skeleton

Loading placeholder.

```html .list
<div class="skeleton title"></div>
<div class="skeleton text"></div>
<div class="skeleton avatar"></div>
```

## Toast

Toast notification.

```html .list
<div class="toast success soft">
  <strong>Done</strong>
  <span class="badge success">OK</span>
</div>
```

## Accordion

Collapsible content sections.

```html .list
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

```html .center
<dialog class="dialog" id="confirm" open>
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

```html .list
<label class="choice">
  <input class="switch primary" type="checkbox" checked>
  Enable notifications
</label>
```

## Accessibility

- Use role="status" for skeleton loading states.
- Use <dialog> with method="dialog" for accessible modals.
- Switches should have an associated label.
