# Navigation

Navbar, breadcrumbs, tabs, and pagination.

## Intents

- `.primary`
- `.secondary`
- `.success`
- `.warning`
- `.danger`
- `.neutral`

## Navbar

Top navigation bar.

```html .full
<nav class="navbar" aria-label="Primary">
  <a class="navbar-brand" href="#">Brand</a>
  <ul class="navbar-nav">
    <li><a class="nav-link" aria-current="page" href="#">Home</a></li>
    <li><a class="nav-link" href="#">About</a></li>
  </ul>
</nav>
```

## Breadcrumb

Navigation breadcrumbs.

```html .full
<ol class="breadcrumb" aria-label="Breadcrumb">
  <li><a href="#">Home</a></li>
  <li><a href="#">Category</a></li>
  <li aria-current="page">Product</li>
</ol>
```

## Tabs

Tab navigation.

```html .inline
<div class="tabs primary" role="tablist">
  <button class="tab" type="button" role="tab" aria-selected="true">Active</button>
  <button class="tab" type="button" role="tab">Inactive</button>
</div>
```

## Sizes

```html .inline
<button class="tab sm">Small</button>
<button class="tab">Default</button>
<button class="tab lg">Large</button>
```

## Pagination

Page navigation.

```html .inline
<ol class="pagination" aria-label="Pagination">
  <li><a class="page-link" href="#">Prev</a></li>
  <li><a class="page-link" aria-current="page" href="#">1</a></li>
  <li><a class="page-link" href="#">2</a></li>
  <li><a class="page-link" href="#">Next</a></li>
</ol>
```

## Accessibility

- Use aria-label for navigation landmarks.
- Use aria-current="page" for active links.
- Tabs need role="tablist" and role="tab".
