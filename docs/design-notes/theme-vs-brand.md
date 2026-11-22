# Theme versus brand

A theme defines a shared visual language; a project defines its identity, its
content and its own compositions. The `cyberdeck` theme and the Neon Ramen
site, which moved onto it, are the reference split.

## Where each thing goes

| Belongs to    | Examples                                                          |
| ------------- | ----------------------------------------------------------------- |
| The framework | Layout, components, states, interaction, focus contract           |
| The theme     | Palette, geometry, backdrop, label voice, control and gauge skins |
| The brand     | Hues, a signature accent, fonts, logo                             |
| The project   | Content, product layout, editorial decoration                     |

The test for a rule: would every project on this theme want it, on every page,
without asking? Then it is the theme's. A rule that only makes sense next to
this project's content is the project's.

## Decisions

- **The theme exposes knobs, not a configuration system.** `cyberdeck` resolves
  its palette from `--deck-hue` (chrome) and `--deck-signal-hue` (signal) on the
  theme root. A brand sets them, and overrides a palette token outright when a
  hue alone does not carry it: the signal is calibrated for a light cyan, and
  Neon Ramen's pink read pastel at the same lightness, so the site sets
  `--primary` itself.
- **Semantic intents keep their meaning across brands.** Danger stays a
  pink-red, warning amber, success green, whatever the chrome and the signal.
  `cyberdeck` moves danger to pink only because its default chrome is a red.
  When a brand's accent sits near an intent, the difference also travels by
  text, icon or shape, never by hue alone.
- **The backdrop is the theme's.** The dot grid is painted on the theme root
  and `body`; Neon Ramen dropped its radial glows rather than restating the
  grid under them.
- **Fonts stay with the page** (see Theming · fonts): a theme can be switched
  at runtime and scoped to an island, and a font would change every island's
  metrics.
- **A reusable decoration is not automatically theme material.** Micro-print,
  serial numbers or a telemetry readout carry content. Even if several projects
  want them, they become optional primitives (for example in Actual Blocks), not
  something a theme injects into every card and form.
- **Geometry goes through tokens.** The bevels are `corner-shape` over the
  radius tokens, not `clip-path`, so borders, shadows and the focus outline
  follow the cut and the core focus contract holds. Without `corner-shape` the
  radii stay 0: a square deck, tested in Firefox.
- **Vendor pseudo-elements get hooks, not theme rules.** The universal cut
  cannot reach a range thumb or a progress value, so each theme restated
  vendor selectors, and one of those restatements erased the thumb's focus
  ring. `--bar-radius`, `--range-thumb-radius` and `--range-thumb-inline-size`
  replaced them; only `corner-shape` on the WebKit thumb is left.
- **A third-party component is the page's integration.** The deck's look on
  `@lekoala/date-picker` lives in the demo page next to its `--dp-*` bridge: a
  theme names only Actual's vocabulary (`reserved-classes.json` would claim
  anything else).

## Measured

Neon Ramen lost 154 lines of site CSS in the move: its palette, its chamfer
utility, its chamfered button with a hand-made focus glow, its corner brackets,
its rating skin and a fieldset reset that duplicated `.field-group.flush`. The
pages kept their markup apart from the removed classes.
