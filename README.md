# Actual CSS

Plain CSS component framework with semantic classes, universal variants, small tokens, strong themes, and progressive enhancements.

## Browser support

Degraded (:where):
- Firefox 82+
- Safari 14+
- Chromium 88+

Minimum (dialog):
- Firefox 98+
- Safari 15.4+
- Chromium 99+

Intermediate (:has):
- Firefox 121+
- Safari 15.4+
- Chromium 105+

Recommended (oklch, light-dark):
- Firefox 121+
- Safari 17.5+
- Chromium 123+

Older browsers get a progressively degraded experience.
Dark mode and animated top-layer transitions require newer browsers.

Actual CSS does not bundle a `<dialog>` polyfill. If the JavaScript runtime is
loaded in a browser without `HTMLDialogElement.showModal()` (for example Firefox
97), dialog triggers show a native alert instead of failing silently. Projects
that need real dialogs there can load and register an external dialog polyfill
before a dialog is opened. The polyfill may load before or after `actual-css/js`;
the runtime checks the target dialog when the trigger is used.
