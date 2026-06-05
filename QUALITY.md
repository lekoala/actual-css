# Quality

This project uses a harsh, lean feedback loop. The human or harness decides whether work is done.

## Completion Policy

- Code written is not proof.
- Work is only complete when the requested verification output exists.
- If verification was not run, say `Verification not run`.
- Report failing checks, regressions, and risks before any success claim.

## Scope

- Bug fixes should usually be narrow.
- Feature work should happen at the owning architectural layer, even when that requires coordinated edits.
- Do not force a local patch when the correct solution is a shared token, intent, variant, layout, or component pattern.
- Broad changes are acceptable when they reduce duplication, preserve public API, and make the feature easier to reason about.
- Avoid rewrites that are not required by the local component contract or feature goal.
- Prefer removing or consolidating process artifacts when they duplicate code, docs, or architecture.

## Commands

- `npm run map`: regenerate `docs/PROJECT_MAP.md` from repo conventions.
- `npm run verify`: fast inner loop. Runs lint, CSS architecture guards, and contract tests.
- `npm run verify:ci`: full gate. Runs the fast loop, build, and visual regression.
- `npm run test`: fast contract tests only.
- `npm run test:visual`: Playwright visual regression. Use for milestones, CI, or explicit visual work.

## Discovery

1. Read `docs/PROJECT_MAP.md`.
2. Read the local contract header in the owning CSS file.
3. Read nearby implementation and public docs only as needed.

`docs/PROJECT_MAP.md` is generated. Do not edit it manually; regenerate it with `npm run map` when structure changes. Use targeted search only when the map and local contract are insufficient.

## Loop

1. Start from one failing behavior, diff, or local contract.
2. Patch the owning layer only.
3. Run `npm run verify`.
4. Feed failures back into the next patch.
5. Run `npm run verify:ci` only when you need build or visual proof.

## Questions

Ask only when the choice changes public API, locks in irreversible behavior, or creates unresolved user-visible design ambiguity. Otherwise, use the existing architecture and document the assumption.

## Response Format

Return:

1. Changed files
2. What changed
3. Architectural fit
4. Verification status
5. Risks or follow-up notes
