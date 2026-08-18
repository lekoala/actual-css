# App Shell

Document landmarks for top and bottom regions, composed with layout primitives.

Header and footer are document landmarks, not required layout classes.

Use semantic elements by default.

```html demo
<body class="app-shell">
  <header>Actual CSS</header>
  <main class="grow">Main content</main>
  <footer>Footer links</footer>
</body>
```

```css
.app-shell {
  min-block-size: 100vh;
  display: flex;
  flex-direction: column;
}
```

Sticky header/footer behavior should be opt-in and documented only if it becomes part of the shipped layout API.