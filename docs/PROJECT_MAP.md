# Project Map

Generated from `src/actual.css`, `ARCHITECTURE.md`, `docs/components/`, and local contract headers in `src/components/*.css`. Do not edit manually.

## Main Entry Points

- `src/actual.css`
- local contract headers in `src/components/*.css`
- `docs/components/*.md`
- `demo/index.html`
- `demo/components/index.html`

## Layers

| File | Summary |
| --- | --- |
| `src/tokens.css` | public semantic tokens and default surfaces. |
| `src/themes.css`, `src/themes/*.css` | theme definitions and theme-specific token overrides. |
| `src/intents.css` | maps intent classes to shared intent variables. |
| `src/variants.css` | shared variant behavior and shared control sizing. |
| `src/layout.css` | compositional layout primitives. |
| `src/components/*.css` | component-local geometry, typography, and interaction. |
| `src/enhancements/*.css` | progressive enhancement only. Baseline behavior must work without these files. |
| `demo/`, `styles/demo.css` | showcase only. Never required for framework behavior. |

## Components

| Order | Component | Category | Source | Docs |
| --- | --- | --- | --- | --- |
| 1 | button | action | `src/components/button.css` | `docs/components/button.md` |
| 2 | badge | action | `src/components/badge.css` | `docs/components/badge.md` |
| 3 | alert | feedback | `src/components/alert.css` | `docs/components/alert.md` |
| 4 | card | surface | `src/components/card.css` | `docs/components/card.md` |
| 5 | forms | input | `src/components/forms.css` | `docs/components/forms.md` |
| 6 | navigation | navigation | `src/components/navigation.css` | `docs/components/navigation.md` |
| 7 | data | data | `src/components/data.css` | `docs/components/data.md` |
| 8 | avatar | decoration | `src/components/avatar.css` | `docs/components/avatar.md` |
| 9 | indicator | decoration | `src/components/indicator.css` | `docs/components/indicator.md` |
| 10 | status | decoration | `src/components/status.css` | `docs/components/status.md` |
| 11 | skeleton | data | `src/components/skeleton.css` | `docs/components/skeleton.md` |
| 12 | accordion | navigation | `src/components/accordion.css` | `docs/components/accordion.md` |
| 13 | dialog | surface | `src/components/dialog.css` | `docs/components/dialog.md` |
| 14 | switch | input | `src/components/switch.css` | `docs/components/switch.md` |
| 15 | join | navigation | `src/components/join.css` | `docs/components/join.md` |
| 16 | dropdown | navigation | `src/components/dropdown.css` | `docs/components/dropdown.md` |
| 17 | divider | data | `src/components/divider.css` | `docs/components/divider.md` |
| 18 | spinner | decoration | `src/components/spinner.css` | `docs/components/spinner.md` |

## Enhancements

- `src/enhancements/color-mix.css`
- `src/enhancements/container.css`
- `src/enhancements/base-select.css`

## Warnings

None.
