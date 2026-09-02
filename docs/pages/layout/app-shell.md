# App Shell

Full-height, single-column document flow. Use it as the outer shell for ordinary pages,
simple applications, and other layouts that need a header / main / footer structure spanning the viewport.

Header and footer are document landmarks, not required layout classes.
Use semantic elements by default. .app-shell already supplies the outer column,
so do not add a .stack solely to arrange the page landmarks.

```html demo
<body class="app-shell">
  <header>
    <div class="center">
      <nav class="navbar" aria-label="Main">
        <a class="navbar-brand" href="/">Actual CSS</a>
      </nav>
    </div>
  </header>
  <main class="grow">
    <div class="center stack">
      <h1>Page title</h1>
      <p>Main content</p>
    </div>
  </main>
  <footer>
    <div class="center">Footer links</div>
  </footer>
</body>
```

```css
.app-shell {
  min-block-size: 100vh;
  display: flex;
  flex-direction: column;
}
```

Keep `.center` inside each full-width landmark when their backgrounds or
borders should span the viewport. Sticky header/footer behavior remains an
application choice.

Do not upgrade this shell to `.app-layout` merely because the product is an
application. Use App Layout only for its complete specialized contract: a
direct-child `.topbar`, independently scrolling `.app-main`, and direct-child
`.app-nav` that changes from a bottom bar to a labelled side menu.
