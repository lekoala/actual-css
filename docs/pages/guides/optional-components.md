# Optional components

Optional components extend Actual with specialized patterns while keeping the
same tokens, intents, variants, and density grammar as the core. They add no
global design tokens and require no JavaScript.

Import the complete optional layer after the core:

```css
@import "actual-css/css";
@import "actual-css/css/optional";
```

`actual-css/css/optional` resolves to the minified optional bundle
(`dist/optional.min.css`). Alternatively, import only the modules a project
uses from the source tree:

```css
@import "actual-css/css/optional/fab";
@import "actual-css/css/optional/floating-field";
```

| Module | Use | Import | Documentation |
|---|---|---|---|
| OTP | One native one-time-code input with visual cells | `actual-css/css/optional/otp` | [OTP](../forms/otp.md) |
| Chat | Start/end message rows and bubbles | `actual-css/css/optional/chat` | [Chat](../components/chat.md) |
| Aura | Decorative intent-colored frame and glow | `actual-css/css/optional/aura` | [Aura](../components/aura.md) |
| FAB | Fixed action placement and native speed dial | `actual-css/css/optional/fab` | [FAB](../components/fab.md) |
| Floating field | Floating labels over the text controls | `actual-css/css/optional/floating-field` | [Floating labels](../forms/floating-field.md) |

Component-prefixed custom properties documented on each page are author hooks.
Color and sizing otherwise stay with the existing intent, variant, control,
and button APIs.
