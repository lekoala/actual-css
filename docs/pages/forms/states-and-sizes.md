# States And Sizes

> Read-only, disabled, and shared size modifiers for form controls.

## Class reference

| Class | Kind | Description |
|---|---|---|
| `.sm` | Modifier | Compact control height and spacing rhythm; sets `--control-size` to `--control-size-sm`. |
| `.lg` | Modifier | Large control height and spacing rhythm; sets `--control-size` to `--control-size-lg`. |

Use `readonly` for text-like values that can still be focused, selected, and submitted. Use `disabled` for unavailable controls that should not receive focus or submit a value.

The `.sm` and `.lg` modifiers set the shared control tokens used by inputs, selects, textareas, buttons, and switches. Put the modifier on the control itself, or on a `.field` wrapper when the whole field should share that size.

```html demo
<form novalidate>
  <fieldset class="field-group">
    <legend class="field-label">Text control states</legend>
    <div class="stack container-query">
      <div class="grid-3 items-start">
        <label class="field">
          <span class="field-label">Editable</span>
          <input class="input" type="text" value="Ocean Beach Clinic" />
        </label>

        <label class="field">
          <span class="field-label">Read-only</span>
          <input class="input" type="text" value="INV-2048" readonly />
          <span class="field-help">Focusable and submitted with the form.</span>
        </label>

        <label class="field">
          <span class="field-label">Disabled</span>
          <input class="input" type="text" value="Locked by billing" disabled />
          <span class="field-help">Unavailable and not submitted.</span>
        </label>
      </div>

      <div class="grid-3 items-start">
        <label class="field">
          <span class="field-label">Editable notes</span>
          <textarea class="textarea">Patient asked for an invoice copy.</textarea>
        </label>

        <label class="field">
          <span class="field-label">Read-only notes</span>
          <textarea class="textarea" readonly>Insurance details imported from the patient record.</textarea>
        </label>

        <label class="field">
          <span class="field-label">Disabled notes</span>
          <textarea class="textarea" disabled>Notes are disabled until the transaction is selected.</textarea>
        </label>
      </div>
    </div>
  </fieldset>

  <fieldset class="field-group">
    <legend class="field-label">Choice and select states</legend>
    <div class="stack container-query">
      <div class="grid-3 items-start">
        <label class="field">
          <span class="field-label">Editable select</span>
          <select class="select">
            <option>Card</option>
            <option>Bank transfer</option>
            <option>Cash</option>
          </select>
        </label>

        <label class="field">
          <span class="field-label">Invalid select</span>
          <select class="select" aria-invalid="true">
            <option>Choose a method</option>
            <option>Card</option>
            <option>Bank transfer</option>
          </select>
          <span class="field-error">Choose a payment method.</span>
        </label>

        <label class="field">
          <span class="field-label">Disabled select</span>
          <select class="select" disabled>
            <option>Card</option>
            <option>Bank transfer</option>
            <option>Cash</option>
          </select>
        </label>
      </div>

      <div class="grid-5 items-start">
        <label class="choice">
          <input class="check" type="checkbox" />
          <span>
            <span class="field-label">Unchecked checkbox</span>
            <span class="field-help">Available and not selected.</span>
          </span>
        </label>

        <label class="choice">
          <input class="check" type="checkbox" checked />
          <span>
            <span class="field-label">Checked checkbox</span>
            <span class="field-help">Available and selected.</span>
          </span>
        </label>

        <label class="choice">
          <input class="check" type="checkbox" checked disabled />
          <span>
            <span class="field-label">Disabled checked</span>
            <span class="field-help">Selected but unavailable.</span>
          </span>
        </label>

        <label class="choice">
          <input class="check" type="checkbox" disabled />
          <span>
            <span class="field-label">Disabled unchecked</span>
            <span class="field-help">Unavailable and not selected.</span>
          </span>
        </label>

        <label class="choice">
          <input class="check" type="checkbox" id="indet-demo" />
          <span>
            <span class="field-label">Indeterminate checkbox</span>
            <span class="field-help">Partially selected — set via <code>element.indeterminate = true</code>. Try it: <button class="btn text sm" type="button" onclick="document.getElementById('indet-demo').indeterminate = !document.getElementById('indet-demo').indeterminate">toggle</button></span>
          </span>
        </label>
      </div>

      <div class="grid-4 items-start">
        <label class="choice">
          <input class="radio" type="radio" name="demo-radio-state" />
          <span>
            <span class="field-label">Unselected radio</span>
            <span class="field-help">Available and not selected.</span>
          </span>
        </label>

        <label class="choice">
          <input class="radio" type="radio" name="demo-radio-state" checked />
          <span>
            <span class="field-label">Selected radio</span>
            <span class="field-help">Available and selected.</span>
          </span>
        </label>

        <label class="choice">
          <input class="radio" type="radio" name="demo-radio-disabled" checked disabled />
          <span>
            <span class="field-label">Disabled selected</span>
            <span class="field-help">Selected but unavailable.</span>
          </span>
        </label>

        <label class="choice">
          <input class="radio" type="radio" name="demo-radio-disabled" disabled />
          <span>
            <span class="field-label">Disabled unselected</span>
            <span class="field-help">Unavailable and not selected.</span>
          </span>
        </label>
      </div>

      <div class="grid-4 items-start">
        <label class="choice">
          <input class="switch" type="checkbox" role="switch" />
          <span>
            <span class="field-label">Switch off</span>
            <span class="field-help">Available and inactive.</span>
          </span>
        </label>

        <label class="choice">
          <input class="switch" type="checkbox" role="switch" checked />
          <span>
            <span class="field-label">Switch on</span>
            <span class="field-help">Available and enabled.</span>
          </span>
        </label>

        <label class="choice">
          <input class="switch" type="checkbox" role="switch" checked disabled />
          <span>
            <span class="field-label">Disabled on</span>
            <span class="field-help">On but unavailable.</span>
          </span>
        </label>

        <label class="choice">
          <input class="switch" type="checkbox" role="switch" disabled />
          <span>
            <span class="field-label">Disabled off</span>
            <span class="field-help">Off and unavailable.</span>
          </span>
        </label>
      </div>
    </div>
  </fieldset>

  <fieldset class="field-group">
    <legend class="field-label">Control sizes</legend>
    <div class="stack container-query">
      <div class="grid-3 items-start">
        <label class="field sm">
          <span class="field-label">Small field</span>
          <input class="input" type="text" value="sm" />
        </label>

        <label class="field">
          <span class="field-label">Default field</span>
          <input class="input" type="text" value="default" />
        </label>

        <label class="field lg">
          <span class="field-label">Large field</span>
          <input class="input" type="text" value="lg" />
        </label>
      </div>

      <div class="grid-3 items-start">
        <label class="field sm">
          <span class="field-label">Small select</span>
          <select class="select">
            <option>Compact</option>
          </select>
        </label>

        <label class="field">
          <span class="field-label">Default select</span>
          <select class="select">
            <option>Default</option>
          </select>
        </label>

        <label class="field lg">
          <span class="field-label">Large select</span>
          <select class="select">
            <option>Comfortable</option>
          </select>
        </label>
      </div>

      <div class="grid-3 items-start">
        <label class="field sm">
          <span class="field-label">Small textarea</span>
          <textarea class="textarea" rows="2">Short note</textarea>
        </label>

        <label class="field">
          <span class="field-label">Default textarea</span>
          <textarea class="textarea" rows="2">Default note</textarea>
        </label>

        <label class="field lg">
          <span class="field-label">Large textarea</span>
          <textarea class="textarea" rows="2">Comfortable note</textarea>
        </label>
      </div>

      <div class="grid-3 items-start">
        <button class="btn outline sm" type="button">Small</button>
        <button class="btn outline" type="button">Default</button>
        <button class="btn outline lg" type="button">Large</button>
      </div>

      <div class="grid-4 items-start">
        <label class="choice sm">
          <input class="check" type="checkbox" checked />
          <span>Small checkbox</span>
        </label>
        <label class="choice">
          <input class="check" type="checkbox" checked />
          <span>Default checkbox</span>
        </label>
        <label class="choice lg">
          <input class="check" type="checkbox" checked />
          <span>Large checkbox</span>
        </label>
        <label class="choice">
          <input class="check" type="checkbox" id="indet-size" />
          <span>Indeterminate <button class="btn text sm" type="button" onclick="document.getElementById('indet-size').indeterminate = !document.getElementById('indet-size').indeterminate">toggle</button></span>
        </label>
      </div>

      <div class="grid-3 items-start">
        <label class="choice sm">
          <input class="radio" type="radio" name="demo-radio-size" checked />
          <span>Small radio</span>
        </label>
        <label class="choice">
          <input class="radio" type="radio" name="demo-radio-size" />
          <span>Default radio</span>
        </label>
        <label class="choice lg">
          <input class="radio" type="radio" name="demo-radio-size" />
          <span>Large radio</span>
        </label>
      </div>

      <div class="grid-3 items-start">
        <label class="choice sm">
          <input class="switch" type="checkbox" role="switch" checked />
          <span>Small switch</span>
        </label>
        <label class="choice">
          <input class="switch" type="checkbox" role="switch" checked />
          <span>Default switch</span>
        </label>
        <label class="choice lg">
          <input class="switch" type="checkbox" role="switch" checked />
          <span>Large switch</span>
        </label>
      </div>
    </div>
  </fieldset>
</form>
```