# Agent Project Guide

This document is project-agnostic. Use it as a baseline for any codebase that will be edited by coding agents.

## Goal

Agent workflows should reduce maintenance, not add ceremony.

Optimize for:

- fewer moving parts
- clear ownership
- fast feedback
- source of truth near the code
- good architecture
- small coherent changes

Avoid optimizing for:

- more files
- more abstractions
- more process artifacts
- more helper scripts
- more documentation layers that repeat the same information

## Core Model

Agents are workers, not judges.

- Humans define intent and review taste.
- Architecture docs define structure and ownership.
- Source files carry local invariants near the code.
- The harness or CI verifies facts.
- Agents edit code inside those constraints.

Do not let the agent decide what "done" means.

## Minimum Project Shape

Every project should start with a very small control surface:

- `AGENTS.md`: short operating rules for agent behavior
- `ARCHITECTURE.md`: ownership, layers, invariants, and routing
- `QUALITY.md`: work modes, completion policy, and verification commands
- code files: local contracts or local invariants near the implementation
- one generated project map only if the repo is large enough to justify it

Do not add more persistent artifacts unless they clearly reduce future maintenance.

## Ceremony Budget

Before adding docs, scripts, generated files, contracts, or conventions, ask:

1. What exact problem does this artifact solve?
2. What now has to stay in sync?
3. Can the same information live closer to the code?
4. Should this be generated instead of maintained manually?
5. Is deleting or consolidating an existing artifact better than adding a new one?

Prefer removing ceremony over organizing ceremony.

## Source Of Truth

Keep source of truth as close as possible to the thing it governs.

- Component-specific constraints belong in the owning file or component folder.
- Cross-cutting rules belong in architecture docs.
- Generated views are derived outputs, not primary truth.
- Public usage docs should explain usage, not restate internal architecture.
- Avoid separate files that only mirror information already present in code or conventions.

## Local Contracts

Local contracts should live with the code they constrain.

Use short headers or nearby comments for:

- what the unit must preserve
- what it owns
- what it does not own

Keep them short. They are guardrails, not essays.

Good local contract content:

- purpose
- public surface
- ownership boundaries
- architectural constraints

Bad local contract content:

- large usage tutorials
- implementation walkthroughs
- repeated architecture explanations
- full combinatorial API listings

## Architecture Rules

Important architectural rules should carry three parts:

- Rule
- Reason
- Allowed exceptions

This prevents cargo-cult behavior.

A good rule explains:

- what to do
- why the rule exists
- when the rule may bend

Keep this richer format for architectural constraints, not for every small preference.

## Discovery

Discovery should be cheap and boring.

Preferred order:

1. Read the project map if one exists.
2. Read the relevant architecture section.
3. Open the owning file and read its local contract.
4. Read nearby implementation.
5. Use targeted search only if the previous steps are insufficient.

Avoid broad repo wandering by default.

## Verification

The harness owns completion.

- `verify` should be the default inner loop.
- `verify:ci` should be the full gate.
- Verification output should be failure-oriented.
- Passing counts are low signal; failing checks are high signal.

Agents should not claim success without current verification output.

## Change Scope

Choose the smallest coherent change at the correct architectural level.

- Local bugs usually need local patches.
- Shared behavior belongs in shared layers.
- Broad changes are acceptable when they remove duplication or establish a needed pattern.
- Do not invent a new pattern when an existing one can be extended cleanly.

Small change does not mean shallow change. Fix the problem at the owning layer.

## Anti-Patterns

Watch for these failure modes:

- one code file plus one internal contract file plus one public doc plus one generated index entry
- helper scripts that are more complex than the discovery problem they solve
- generated artifacts treated like source of truth
- architecture rules with no rationale
- agents widening scope because the process is unclear
- adding process layers that make iteration slower

## Recommended Defaults

For most projects, start here:

- short `AGENTS.md`
- one `ARCHITECTURE.md`
- one `QUALITY.md`
- local contracts near code
- one fast verification command
- one full verification command
- optional generated project map if structure is non-trivial

Do not add more until the repo proves it needs more.

## Decision Test

When an agent proposes a new artifact, ask:

"Will this make the next ten changes cheaper, or only make this change look more organized?"

If the answer is not clearly "the next ten changes," do not add it.
