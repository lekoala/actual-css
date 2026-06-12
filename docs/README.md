# Documentation

This project keeps documentation intentionally small.

## Sources of truth

- `../src` files define the public API.
- `../demo` files show valid usage.
- `/docs/manual` explains current project-wide principles.
- `/docs/log` records historical context.
- Git history is the archive.

## Rule

Do not document what the code already says.

Document:
- why a rule exists,
- how things compose,
- where the boundaries are,
- what agents or contributors must not accidentally change.

## Reading priority

When working on the project, read in this order:

1. Relevant source code
2. Relevant `/docs/manual` page
3. Relevant `/docs/log` entries only if extra context is needed

If code and docs disagree, ask the user what is the expected outcome.
