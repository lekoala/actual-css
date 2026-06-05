## Applied in Actual CSS

Actual CSS now keeps component-specific contracts in the header comment of the owning CSS file.

- `contracts/` is no longer part of the contributor workflow.
- `docs/components/` stays user-facing.
- `docs/PROJECT_MAP.md` points discovery to the owning CSS file, where the local contract lives beside the implementation.

i find these #file:contracts actually terrible. the basically duplicate the whole architecture. we have one contract, one doc, one file... that's too much. they should either: - live together (one folder per component, with code and docs) - or live in one css file (using comments). might make the file a bit bigger, but at least we would get everything in one place

---

Yes. I agree with this direction.

contracts/ sounded clean in theory, but for a small CSS framework it risks becoming documentation architecture cosplay: one CSS file, one contract file, one docs file, one map entry, maybe one visual test — and suddenly every component change requires editing four places.

That is exactly the opposite of low-maintenance agentic coding.

The better principle is:

Put the invariant as close as possible to the code it constrains.

Option A: one folder per component

This is good when a component is large enough to deserve its own mini-module.

src/components/avatar/
  avatar.css
  avatar.md
  avatar.test.ts

or:

src/components/avatar/
  index.css
  README.md
  test.ts

Pros:

code and docs live together
easy discovery
scalable for complex components
avoids global contracts/ sprawl

Cons:

a bit more folder structure
maybe overkill for tiny components like status or divider

This is probably best if components become substantial.

Option B: contract comments inside the CSS file

For your current project, I think this may be better.

Example:

/**
 * @component avatar
 * @category decoration
 *
 * Purpose:
 * Identity marker for initials, icons, or images.
 *
 * Contract:
 * - `.avatar` provides neutral default styling.
 * - Intent classes such as `.primary` must flow through shared intent variables.
 * - Shape, size, and typography must not change when intent changes.
 * - No raw palette values in this component.
 *
 * Architecture:
 * - consumes: tokens, intents
 * - owns: avatar geometry, local variable mapping
 * - does not own: palette values, contrast computation
 */
.avatar {
  --avatar-size: 2rem;
  --avatar-bg: var(--surface-subtle);
  --avatar-fg: var(--text);
  ...
}

This has a big advantage: when the agent opens avatar.css, it sees the local rules immediately.

No separate discovery. No stale contract file. No extra map update.

For an agent, this is much more likely to work.

I’d avoid separate contracts/ unless they are executable or cross-cutting

A separate contract file is worth it only when it does something the CSS comment cannot:

contracts/
  color-system.md
  variant-system.md
  accessibility.md
  cascade.md

These are cross-cutting contracts, not one file per component.

For example:

contracts/color-system.md

is useful because many components must obey it.

But:

contracts/avatar.md
contracts/badge.md
contracts/card.md
contracts/status.md

is probably too much unless those files are generated from source comments or used by tests.

My preferred setup for your project

I’d use this:

src/
  actual.css
  tokens.css
  themes.css
  intents.css
  variants.css
  layout.css
  components/
    avatar.css
    button.css
    badge.css
    alert.css
    forms.css
    accordion.css
  enhancements/
    ...
docs/
  architecture.md
  quality.md
  components.md

Then each component CSS gets a short header:

/**
 * @component badge
 * @category action
 *
 * Contract:
 * - Uses shared intent variables for color.
 * - Supports solid, soft, outline, and ghost variants through shared variant variables.
 * - Does not define component-specific palette values.
 *
 * Owns:
 * - badge geometry
 * - inline layout
 * - local variable mapping
 *
 * Does not own:
 * - palette values
 * - contrast decisions
 * - variant algorithm
 */

And keep docs/components only if they are user-facing docs, not internal contracts.

So you avoid this:

avatar.css
avatar.md
contracts/avatar.md
PROJECT_MAP.md entry
AGENTS.md routing note

And move toward this:

avatar.css with local contract header
docs/components.md for public examples

Much better.

The rule I’d add to AGENTS.md

Something like:

## Local Contracts

Component-specific contracts live in the header comment of the owning CSS file.

Do not create one contract file per component unless the component has complex behavior that cannot be described locally.

Use separate contract/docs files only for cross-cutting architecture rules, public documentation, or executable checks.

And maybe:

When editing a component, update its local header only if the component’s ownership, public API, or architectural contract changes. Do not duplicate implementation details in comments.

That last line matters. Otherwise agents will start maintaining huge comments.

What belongs in the CSS header

Good:

purpose
ownership
public classes
architectural constraints
what the component must not own

Bad:

long usage examples
all class combinations
full architecture explanation
implementation walkthrough
historical notes

The header should be a local guardrail, not documentation.

Example compact format
/**
 * @component switch
 * @category input
 * @public .switch
 *
 * Contract:
 * - Uses shared control sizing and intent variables.
 * - Supports hover/focus/disabled states.
 * - Keeps input semantics accessible.
 *
 * Owns: track/knob geometry, state visuals.
 * Does not own: palette values, contrast algorithm, form layout.
 */

That’s enough.

For docs

I’d collapse public docs too, unless you really need one doc per component.

Maybe:

docs/components.md

with sections:

# Components

## Button
...

## Badge
...

## Avatar
...

One file is often easier for a small framework. Later, if it grows, split it.

Final take

Your instinct is right:

Separate contracts/ per component is probably too much ceremony here.

I’d move component contracts into the component CSS header, keep only cross-cutting contracts/docs separately, and let the source file be the main discovery unit.

That gives agents a much better flow:

find component → open CSS file → read contract + implementation together → patch locally

Instead of:

find component → read map → read contract → read docs → read CSS → reconcile drift

The second flow is exactly where token usage and maintenance pain explode.
