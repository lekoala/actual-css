# Data list

> A compact key/value layout for object properties.

Use `.data-list` to present the properties of a single object as simple
term–value pairs on a `<dl>`. It expects alternating `<dt>` and `<dd>` children
— one term, one value per property. Use a plain description list for
relationships that involve multiple terms or descriptions, and a `<table>` to
compare the same property across several objects.

```html demo
<dl class="data-list">
  <dt>Name</dt>
  <dd>Alice Martin</dd>

  <dt>Email</dt>
  <dd>alice@example.com</dd>

  <dt>Role</dt>
  <dd>Administrator</dd>
</dl>
```

## Rich values

Values accept inline content such as badges, links, dates, or a `.cluster` of
related items. Terms and values remain baseline-aligned.

```html demo
<dl class="data-list">
  <dt>Status</dt>
  <dd><span class="badge success">Active</span></dd>

  <dt>Plan</dt>
  <dd>Professional</dd>

  <dt>Renewal</dt>
  <dd><time datetime="2026-09-14">14 Sep 2026</time></dd>
</dl>
```

## In a card

`.data-list` composes with `.card` and other layout primitives for business
metadata.

```html demo
<article class="card stack">
  <h3>Storage details</h3>

  <dl class="data-list">
    <dt>Used</dt>
    <dd>6.7 GB</dd>

    <dt>Available</dt>
    <dd>1.3 GB</dd>

    <dt>Files</dt>
    <dd>12,492</dd>
  </dl>
</article>
```

## Stacked

`.stacked` puts each value under its term instead of beside it, for a narrow
column or for values too long to share a row.

```html demo
<dl class="data-list stacked" style="max-inline-size: 16rem">
  <dt>Billing contact</dt>
  <dd>alice@example.com</dd>

  <dt>Registered address</dt>
  <dd>42 Rue des Fleurs, 1000 Brussels, Belgium</dd>

  <dt>Renewal</dt>
  <dd><time datetime="2026-09-14">14 Sep 2026</time></dd>
</dl>
```

## Contract

`.data-list` styles one `<dt>` followed by one `<dd>` per property. A valid
`<dl>` may group several terms with one description or the reverse, but that
markup does not belong in `.data-list` — use a plain description list instead,
where `.prose` already covers the editorial cases.

Use `.data-list` for the properties of a single object. Use a `<table>` when
comparing the same properties across multiple objects.

A per-property icon goes inside the `<dt>`, next to the term. There is no
gutter slot spanning a term and its value: a `<dl>` admits only `<dt>` and
`<dd>` per pair — directly or inside a `<div>` wrapper — so no third element
can hold it. When the icon is the point and the term/value relation is not,
the content is not a description list: reach for `.media` with an `.overline`
label instead.