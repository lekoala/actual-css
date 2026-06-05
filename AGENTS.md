# Actual CSS

Plain CSS component framework (Node.js, Biome, Playwright). Contribute production-shaped code. Prototype scope is fine; prototype-quality code is not.

## Completion Discipline

The harness decides done. Never claim success without current verification output.
Do not run verification commands manually; the harness runs them automatically.
Report only failures, regressions, and unverified assumptions before any success claim.

## Ceremony Budget

- Do not introduce new persistent project artifacts unless they clearly reduce future maintenance.
- Before adding docs, scripts, generated files, or conventions, prefer keeping the same information closer to the code or generating it from existing source.
- Prefer deleting or consolidating ceremony when it duplicates code, docs, or architecture.

## Scope & Architecture

- Pick the owning layer before editing (tokens, themes, intents, variants, layout, components, enhancements, demo).
- Treat the architectural rules in `ARCHITECTURE.md` as rule-plus-rationale constraints, not blind style laws.
- Component-specific contracts live in the header comment of the owning CSS file. Update that local header only when ownership or invariants change.
- Do not duplicate palette values or invent component-local intent systems. Use shared intents and variants.
- Demo files must never be required for framework behavior. Do not modify `demo/components` or `dist/`.
- Keep selectors low-specificity. Prefer `:where()` defaults. Avoid `!important`, ID selectors, and `filter: brightness()`.

## Questions

Ask only when a choice affects public API, irreversible behavior, or user-visible design not resolved by the docs.
