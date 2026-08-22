# Neon Ramen reference site

A small multi-page reference app for Actual CSS. It is intentionally expressive: Actual owns the layout, components, state and interaction primitives; `neon-site.css` owns the brand.

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

1. Palette literals live only in the theme/token block. Decorative colors are derived with `color-mix()`.
2. Layout is chosen by relationship (`.grid`, structural `.grid-4`, `.cluster`, `.media`) rather than by recreating track/flex recipes locally.
3. Component hooks tune Actual (`--grid-min`, `--card-pad`, `--frame-ratio`, `--cluster-justify`, etc.).
4. Existing vocabulary is reused (`.overline`, `.measure`, `.list-reset`, `.dot`, `.grow`).
5. Direct card `<footer>` elements demonstrate the framework's bottom-anchoring contract.
6. `.status-bar` remains empty persistent markup for transient runtime feedback; permanent operational data stays normal page content.
7. Custom CSS is reserved for the Neon Ramen identity: glow, ticker, chips, signal captions and decorative geometry.
8. Key call-to-action controls use a dedicated chamfered `.cyber-btn` skin; focus is restored with a custom glow rather than the clipped default outline.

The target is not zero custom CSS. The target is **no duplicated framework behavior and no palette literals outside the token layer**.


## Assets

The site ships with generated WebP photography for the hero, menu cards and cart scene so the demo reads as a complete editorial showcase rather than a wireframe with placeholders.


## Credits

Heavily inspired by demos provided by https://html.non.io/ to test IA agents.
