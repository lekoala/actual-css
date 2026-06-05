## Applied in Actual CSS

Actual CSS now treats maintenance cost as an explicit constraint, not just an implicit preference.

- `AGENTS.md` includes a `Ceremony Budget` section.
- `ARCHITECTURE.md` defines `Source Of Truth` so local contracts and generated views do not drift into duplicate systems.
- `QUALITY.md` explicitly prefers removing or consolidating duplicated process artifacts.

Yes — and this is exactly the uncomfortable part: agentic coding is not autonomous engineering yet; it is steered engineering.

Without guidance, agents often optimize for the wrong thing:

more files
more abstractions
more docs
more tests
more scripts
more apparent structure

But what you actually want is:

less maintenance
fewer moving parts
clear ownership
fast feedback
good architecture
source of truth near the code

Those are not the same.

The agent’s default bias is often “add a system”. Your real need is often “remove ceremony”.

So the useful pattern is not:

ask the agent to design the process

but:

constrain the agent to evaluate process changes against maintenance cost.

A good rule for your AGENTS.md / architecture docs would be:

## Ceremony Budget

Do not introduce new persistent project artifacts unless they clearly reduce future maintenance.

Before adding docs, scripts, generated files, contracts, or conventions, explain:
- what problem this artifact solves;
- what must be kept in sync;
- whether the same information can live closer to the code;
- whether this should be generated instead of maintained manually.

Prefer deleting or consolidating process artifacts when they duplicate code, docs, or architecture.

This is probably one of the most important rules for your project.

Because the failure mode is not just “bad code”. It is helpful-looking process bloat.

I’d also add:

## Source of Truth

Keep source of truth as close as possible to the thing it governs.

- Component-specific contracts belong in the component file or component folder.
- Cross-cutting rules belong in architecture docs.
- Generated maps/indexes must not be edited manually.
- Avoid separate files that merely restate information already present in code, docs, or conventions.

That gives the agent a better compass.

And for feature work:

## Change Scope

Choose the smallest coherent change at the correct architectural level.

- Local bugs usually need local patches.
- Shared behavior usually belongs in shared layers.
- Broad changes are acceptable when they remove duplication or establish a necessary pattern.
- Do not create a new pattern when an existing one can be extended cleanly.

This is the balance you kept pushing toward.

The key insight from this whole discussion is:

The agent needs not only coding rules, but anti-ceremony rules.

Otherwise it will “professionalize” the project by adding layers of artifacts that look mature but make iteration worse.

For your CSS project, I’d now aim for this minimal shape:

AGENTS.md
ARCHITECTURE.md
QUALITY.md, maybe merged into ARCHITECTURE.md
src/*.css
src/components/*.css with local header contracts
docs/components.md for public usage only
npm run verify
npm run verify:ci

No per-component contract files unless they are truly needed.
No manual project map unless tiny and static.
No pile of find scripts.
No generated index until the repo is large enough to justify it.

A good agent setup should make the project lighter, not heavier.
