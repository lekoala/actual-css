## Applied in Actual CSS

Actual CSS now treats `docs/PROJECT_MAP.md` as a generated view, not a handwritten source of truth.

- The map is generated from `src/actual.css`, `ARCHITECTURE.md`, `docs/components/`, and local contract headers in `src/components/*.css`.
- `npm run map` regenerates it.
- Local contract headers and architecture docs remain human-maintained; the map is just a derived routing view.

for example look at this project map . while good, it required writing a prompt. if i refactor code, agents needs to remember to update it too. once you start getting this, iterating becomes tedious. ideally, a nice convention could generate this map automatically : find key files, extract comments and categorize things properly. wouldn't that be a better flow?

---

Yes. That would be a better flow.

A manually maintained Project Map is useful, but it has the same failure mode as all docs: it becomes another artifact agents must remember to update. For agentic coding, the best discovery layer should be generated from the repo, with only a small amount of human-authored metadata.

The ideal split is:

Human-authored:
- architecture rules
- conventions
- component ownership hints
- public contracts

Generated:
- project map
- component index
- selector index
- import graph
- verification commands
- stale/missing docs warnings

So yes: instead of asking an agent to maintain PROJECT_MAP.md, I’d rather have a convention like:

npm run agent:map

or:

npm run agent -- map

that generates a fresh map.

The better pattern: source annotations + generated map

Instead of maintaining this manually:

- `src/intents.css`: maps `.primary`, `.success`, and the other intent classes...

Put a concise header in the source file:

/**
 * @layer intents
 * @summary Maps public intent classes to shared --intent variables.
 * @owns .primary .secondary .success .warning .error .info .neutral
 * @depends themes
 */

Then the generator can produce:

## Ownership Map

- `src/intents.css`
  Layer: intents
  Summary: Maps public intent classes to shared `--intent` variables.
  Owns: `.primary`, `.secondary`, `.success`, `.warning`, `.error`, `.info`, `.neutral`
  Depends on: themes

Now the source file is the source of truth.

That is much better than asking agents to remember to update a separate map.

For components, use the same convention

At the top of src/components/avatar.css:

/**
 * @component avatar
 * @category decoration
 * @summary Circular or square identity marker with optional intent support.
 * @contract contracts/avatar.md
 * @docs docs/components/avatar.md
 * @demo demo/components/avatar.html
 * @depends intents variants tokens
 */

Then your generated map can create:

## Component Routing

| Component | Category | Source | Contract | Docs | Demo |
|---|---|---|---|---|---|
| avatar | decoration | `src/components/avatar.css` | `contracts/avatar.md` | `docs/components/avatar.md` | `demo/components/avatar.html` |

This gives agents the routing table without maintaining it manually.

This also helps detect drift

The generator should not only create a map. It should report problems.

For example:

Discovery warnings:

- src/components/avatar.css declares @contract contracts/avatar.md, but the file does not exist.
- contracts/dialog.md exists, but no component declares @component dialog.
- docs/components/switch.md exists, but no matching contract found.
- src/components/navigation.css has no @component header.
- src/components/forms.css owns .fieldset, but no contract mentions fieldset.

That is extremely agent-friendly, because the agent gets actionable failures instead of vague repo wandering.

Suggested convention for your CSS framework

I’d use a small metadata block in each meaningful CSS file.

Layer file example
/**
 * @actual layer
 * @layer themes
 * @summary Defines public theme tokens: color roles, surfaces, text, borders, and radius.
 * @exports --primary --secondary --accent --surface --text --border --radius
 */
Component file example
/**
 * @actual component
 * @component button
 * @category action
 * @summary Button and anchor-button styling with intent, size, and variant support.
 * @contract contracts/button.md
 * @docs docs/components/button.md
 * @demo demo/components/button.html
 * @depends intents variants tokens
 * @owns .btn .btn.primary .btn.secondary .btn.ghost .btn.outline
 */
Enhancement file example
/**
 * @actual enhancement
 * @enhancement popover
 * @summary Progressive enhancement for popover-backed dropdown behavior.
 * @depends components/dropdown
 */

The important part: keep the metadata small. You do not want a second spec language.

Generated PROJECT_MAP.md

Then you can generate something like:

# Project Map

Generated from source annotations. Do not edit manually.

## Main Entry Points

- `src/actual.css`
- `docs/components/*.md`
- `contracts/*.md`
- `demo/index.html`

## Layers

| Layer | File | Summary |
|---|---|---|
| tokens | `src/tokens.css` | Shared non-color tokens such as motion, gap, icons, and shadow scale. |
| themes | `src/themes.css` | Public theme token definitions. |
| intents | `src/intents.css` | Maps public intent classes to shared `--intent` variables. |
| variants | `src/variants.css` | Shared `--ui-*` variant behavior and control sizing. |

## Components

| Category | Component | Source | Contract | Docs |
|---|---|---|---|---|
| action | button | `src/components/button.css` | `contracts/button.md` | `docs/components/button.md` |
| action | badge | `src/components/badge.css` | `contracts/badge.md` | `docs/components/badge.md` |
| decoration | avatar | `src/components/avatar.css` | `contracts/avatar.md` | `docs/components/avatar.md` |

## Warnings

None.

This becomes a generated artifact, not project truth.

The real source of truth becomes three things

I’d use this hierarchy:

1. Source annotations
   File ownership, component category, nearby docs/contracts.

2. Contracts
   Expected behavior and drift guards.

3. Architecture docs
   Human-written principles and layer definitions.

Generated maps are just views.

That’s a much better maintenance model.

Could this be generic across projects?

Yes, if the convention is generic enough.

For example:

@actual layer
@actual component
@actual module
@actual feature
@actual enhancement

Across projects:

/**
 * @actual component
 * @component avatar
 * ...
 */
/**
 * @actual feature
 * @feature auth
 * @summary Login, logout, session refresh, and permission checks.
 * @contract contracts/auth.md
 */
/**
 * @actual module
 * @module appointments
 * @summary Doctor availability and booking rules.
 * @contract contracts/appointments.md
 */

The implementation differs, but the convention remains.

That gives agents a reusable mental model:

Look for @actual metadata. Generate/read the agent map. Then inspect the owning files.

I’d avoid too much auto-magic

The generator can discover some things automatically:

imports
file tree
selectors
CSS custom properties
contracts by filename
docs by filename
demo files by filename

But categorization is hard to infer reliably.

For example, is badge:

action?
feedback?
decoration?
status?

That is a human design decision.

So I’d use a hybrid:

auto-detect:
- files
- selectors
- variables
- imports
- missing docs/contracts
- unused contracts

human annotation:
- summary
- category
- ownership
- intended layer
- contract link

That’s the sweet spot.

The most useful generated outputs

I’d generate these:

generated/PROJECT_MAP.md
generated/CSS_INDEX.md
generated/CONTRACT_INDEX.md

But I would tell agents:

Read generated/PROJECT_MAP.md first.
Do not edit generated files.
Update source annotations or contracts instead.

This is much safer than maintaining hand-written maps.

Your current map translated to annotation-driven flow

Your current hand-written map is good content. I’d convert it like this:

src/actual.css
/**
 * @actual entry
 * @summary Imports the framework layers in order.
 */
src/tokens.css
/**
 * @actual layer
 * @layer tokens
 * @summary Shared non-color tokens such as motion, gap, icons, and shadow scale.
 */
src/themes.css
/**
 * @actual layer
 * @layer themes
 * @summary Public theme token definitions such as --primary, surfaces, text, borders, and radius.
 */
src/intents.css
/**
 * @actual layer
 * @layer intents
 * @summary Maps .primary, .success, and other intent classes to shared --intent variables.
 */
src/components/avatar.css
/**
 * @actual component
 * @component avatar
 * @category decoration
 * @summary Identity marker component with size, shape, and intent support.
 * @contract contracts/avatar.md
 * @docs docs/components/avatar.md
 * @depends tokens intents variants
 */

Then the map writes itself.

Add this to AGENTS.md

I’d add:

## Discovery

Use generated discovery files before broad repo search:

- `generated/PROJECT_MAP.md`
- `generated/CSS_INDEX.md`
- `generated/CONTRACT_INDEX.md`

Do not edit generated discovery files manually.

If discovery is stale or incorrect, update the source annotation block in the owning file, then regenerate discovery.

Source annotations use `@actual` metadata comments.

That gives the agent a concrete maintenance rule.

The key insight

You do not want agents maintaining maps.

You want agents maintaining local metadata next to the code they edit.

That is much more reliable because when an agent changes src/components/avatar.css, it is already in the file where the metadata lives.

A separate PROJECT_MAP.md is out-of-sight, out-of-mind.

So yes: your instinct is correct. The better flow is:

source annotations → generated map/index → agent discovery → patch → regenerate/check map

That is more scalable, less tedious, and much less dependent on agent memory.
