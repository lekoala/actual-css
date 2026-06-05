# References

## Details element as a dropdown menu

**Don't use `<details>`/`<summary>` for dropdown menus.** Use a `<button>` with `aria-expanded` toggling a list of links instead.

**Article:** [Details-As-A-Menu by Melanie Sumner](https://melsumner.github.io/details-as-a-menu) (Jun 2022)

**Key points:**

- `<details>` has implicit role of `group`, `<summary>` has implicit role of `button`
- The interactive content inside `<details>` is **not associated** with the disclosure widget — screen readers don't connect the links to the button
- Screen readers announce "User Menu, collapsed, summary button" — confusing when the expanded content is a list of links
- The links appear in the "links" rotor/list, but the summary appears in "form elements" (Chrome only), and **nothing associates them**
- Valid alternative: a `<button>` with `aria-expanded` that toggles a `<ul>` of links — this is a well-known, accessible pattern

**Why this matters:** The framework is CSS-only (no JS), so dropdown menus use `<details>` elements for functionality. This is acceptable for non-critical UI (like user profile menus or action menus), but **should not be used for primary navigation** where keyboard/screen reader users need predictable behavior. The application template (`demo/app.html`) uses `<details>` for secondary action menus but keeps the main sidebar navigation as static links.
