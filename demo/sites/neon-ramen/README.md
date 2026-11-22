# Neon Ramen reference site

A small multi-page reference app for Actual CSS. It is intentionally expressive, and split in three: Actual owns the layout, components, state and interaction primitives; the `cyberdeck` theme owns the look (palette, bevels, backdrop, label voice, gauges, rating); `neon-site.css` owns the brand and the pages.

## Expected location

Place this directory at `demo/sites/neon-ramen/` in the Actual CSS repository. The pages load:

```text
../../../dist/actual.full.css
../../../dist/actual.full.js
```

Run the normal Actual CSS build before opening the demo.

## Pages

- `index.html` — marketing home, live cart summary, aligned card footers
- `menu.html` — tabbed menu with equal-height product cards
- `item.html` — product configurator using choice cards and native form controls
- `locations.html` — responsive locations and description-list metadata
- `order.html` — validation flow; invalid submissions surface through the empty `.status-bar`

## Integration rules demonstrated

1. The brand is two hues on the theme root (`--deck-hue`, `--deck-signal-hue`) plus the hot pink `--primary`. Decorative colors are derived with `color-mix()`.
2. Layout is chosen by relationship (`.grid`, structural `.grid-4`, `.cluster`, `.media`) rather than by recreating track/flex recipes locally.
3. Component hooks tune Actual (`--grid-min`, `--card-pad`, `--frame-ratio`, `--cluster-justify`, etc.).
4. Existing vocabulary is reused (`.overline`, `.measure`, `.list-reset`, `.dot`, `.grow`).
5. Direct card `<footer>` elements demonstrate the framework's bottom-anchoring contract.
6. `.status-bar` remains empty persistent markup for transient runtime feedback; permanent operational data stays normal page content.
7. Custom CSS is reserved for the Neon Ramen identity: glow type, ticker, chips, signal captions and product layout.
8. Nothing is chamfered in site CSS: the theme bevels every frame through `corner-shape`, so the default focus outline follows the cut.

The target is not zero custom CSS. The target is **no duplicated framework or theme behavior, and no palette literals outside the brand block**.


## Assets

The site ships with generated WebP photography for the hero, menu cards and cart scene so the demo reads as a complete editorial showcase rather than a wireframe with placeholders.


## Credits

Heavily inspired by demos provided by https://html.non.io/ to test IA agents.
