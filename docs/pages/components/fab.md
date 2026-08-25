# Floating action button

> **Module** — import `actual-css/css/components/fab` or `actual-css/css/components`.

FAB fixes a primary action near the viewport's block-end and inline-end edges.
The existing button component owns its size, shape, intent, and interaction.
As a direct child of `.app-layout`, it instead overlays the main grid area so
the layout keeps it clear of adaptive application navigation and safe areas.

**Related terms:** fab.

```html
<div class="fab">
  <button class="btn circle primary lg icon-only" type="button" aria-label="Create">
    <span aria-hidden="true">+</span>
  </button>
</div>
```

Use native `details` for a no-JavaScript speed dial. List actions in their
visual top-to-bottom order so keyboard focus follows the same sequence.

```html
<details class="fab">
  <summary
    class="btn circle primary icon-only"
    style="--btn-min-size: 3.5rem"
    aria-label="Create"
  >
    <span aria-hidden="true">+</span>
  </summary>

  <div class="fab-actions">
    <div class="fab-action">
      <span class="fab-label">Document</span>
      <button class="btn circle lg icon-only" type="button" aria-label="New document">…</button>
    </div>
    <div class="fab-action">
      <span class="fab-label">Upload</span>
      <button class="btn circle lg icon-only" type="button" aria-label="Upload file">…</button>
    </div>
    <div class="fab-action">
      <span class="fab-label">Folder</span>
      <button class="btn circle lg icon-only" type="button" aria-label="New folder">…</button>
    </div>
  </div>
</details>
```

## Preview

This documentation-only surface simulates a viewport by replacing the FAB's
fixed positioning with absolute positioning. The card is background content,
not the FAB's containing component. Production `.fab` remains viewport-fixed.

```html demo
<div class="docs-fab-preview">
  <article class="card">
    <h3>Documents</h3>
    <p>Your recent documents will appear here.</p>
  </article>

  <details class="fab" open>
    <summary
      class="btn circle primary icon-only"
      style="--btn-min-size: 3.5rem"
      aria-label="Create"
    >
      <span aria-hidden="true">+</span>
    </summary>

    <div class="fab-actions">
      <div class="fab-action">
        <span class="fab-label">Document</span>
        <button class="btn circle lg icon-only" type="button" aria-label="New document">
          <i class="ti ti-file-plus" aria-hidden="true"></i>
        </button>
      </div>
      <div class="fab-action">
        <span class="fab-label">Upload</span>
        <button class="btn circle lg icon-only" type="button" aria-label="Upload file">
          <i class="ti ti-upload" aria-hidden="true"></i>
        </button>
      </div>
      <div class="fab-action">
        <span class="fab-label">Folder</span>
        <button class="btn circle lg icon-only" type="button" aria-label="New folder">
          <i class="ti ti-folder-plus" aria-hidden="true"></i>
        </button>
      </div>
    </div>
  </details>
</div>
```

The native baseline manages click, keyboard activation, and the open state. It
does not close automatically after an action, on outside click, or on Escape;
add application behavior only when the product requires those policies.

Each `.fab-action` keeps its `.fab-label` and secondary button on one compact
line. The example uses the button's existing `.lg` density for 44px secondary
actions and its `--btn-min-size` hook for a dominant 56px trigger. Size still
belongs to Button rather than introducing FAB-specific size modifiers.
When the summary contains one decorative icon, FAB rotates it by 45 degrees in
the open state so a plus naturally becomes a close symbol.

## Class reference

| Class          | Description                                               |
|----------------|-----------------------------------------------------------|
| `.fab`         | Fixed viewport placement; use `details` for a speed dial. |
| `.fab-actions` | Collapsible vertical action list.                         |
| `.fab-action`  | One horizontal label-and-button unit.                     |
| `.fab-label`   | Compact floating label for an action.                     |

## CSS hooks

- `--fab-offset` — minimum viewport-edge offset.
- `--fab-gap` — gap between actions and between the trigger and action list.

FAB is hidden in print and uses `--z-menu`, leaving tooltips and status UI above
it. Dialogs remain in the browser's top layer.
