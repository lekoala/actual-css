## Applied in Actual CSS

Actual CSS is intentionally not adopting generated discovery indexes or repo-specific `find` scripts as maintained workflow.

- `docs/PROJECT_MAP.md` is the maintained map.
- local contract headers in the owning CSS file and nearby source remain the next step after the map.
- Targeted search is fallback, not first step.
- The examples below are generic options, not the adopted workflow for this repo.

Yes, that’s a real limitation of “repo-local agent tooling”: if the tool is project-specific, non-standard, and not part of the model’s learned habits, the agent often won’t naturally reach for it.

So the goal should not be “invent many helper scripts”. The goal should be:

create a tiny, conventional, memorable interface that agents are explicitly routed through.

Not:

scripts/find-component.mjs
scripts/find-css-selector.mjs
scripts/list-contracts.mjs
scripts/map-intents.mjs
scripts/find-demo-usage.mjs
...

That becomes another mini-framework to maintain.

Better:

npm run agent
npm run agent -- find avatar
npm run agent -- map
npm run agent -- verify

One entry point. Few verbs. Stable output.

The problem with many find-* scripts

You’re right to distrust them.

They are usually:

too project-specific
poorly discoverable
not part of agent priors
easy to forget
another thing to maintain
less powerful than rg in unexpected cases
not obviously better unless the output is excellent

Agents are trained to try things like:

rg avatar
find .
ls
cat package.json
npm test

They are not trained to guess:

node scripts/find-css-layer.mjs --selector=.avatar --contracts --include-demo=false

Even if you document it, the agent may revert to generic shell behavior.

So the solution is not “more scripts”. It’s one obvious agent command.

I’d make a single agent command

Something like:

{
  "scripts": {
    "agent": "node scripts/agent.mjs"
  }
}

Usage:

npm run agent -- map
npm run agent -- find avatar
npm run agent -- find .avatar
npm run agent -- contract avatar
npm run agent -- verify
npm run agent -- changed

That’s reusable enough across projects.

Inside, each project can adapt implementation details, but the interface stays stable.

That’s the important part.

Minimal useful verbs

I’d keep only five.

1. map
npm run agent -- map

Outputs:

Project map

Core:
- src/tokens.css — design tokens
- src/intents.css — intent variables
- src/variants.css — variant behavior
- src/components/*.css — component styles

Contracts:
- contracts/avatar.md
- contracts/button.md
- contracts/forms.md

Verification:
- npm run verify
- npm run verify:ci

This replaces “read five docs and inspect the tree”.

2. find <thing>
npm run agent -- find avatar

Outputs:

Search: avatar

Likely files:
- src/components/avatar.css
- contracts/avatar.md
- tests/visual/avatar.spec.ts
- demo/components/avatar.html

Relevant selectors:
- .avatar
- .avatar.primary
- .avatar.secondary

Recommended first reads:
1. contracts/avatar.md
2. src/components/avatar.css
3. src/intents.css

This is not trying to be a universal search engine. It’s a routing assistant.

3. contract <thing>
npm run agent -- contract avatar

Outputs the relevant contract, maybe shortened.

This matters because you want the agent to start from expectations, not implementation.

4. verify
npm run agent -- verify

Runs your default verification and prints failure-oriented output.

The actual implementation can call:

npm run verify

But the output should be curated if possible.

5. changed
npm run agent -- changed

Outputs changed files and maybe a small diff summary.

Useful because agents often lose track of what they edited.

Keep the interface boring and generic

The naming should use words agents already understand:

map
find
contract
verify
changed

Not:

discover
resolve-owner
inspect-component
trace-selector
quality-gate

This matters more than it sounds. Agents are pattern machines. Familiar verbs win.

Make AGENTS.md force the entry point

Add something like this:

## Agent command

Use the project agent command before broad shell discovery:

```bash
npm run agent -- map
npm run agent -- find <term>
npm run agent -- contract <component>
npm run agent -- verify
npm run agent -- changed

Prefer this command over ad-hoc find, grep, ls, or shell pipelines.

Only use broad shell search if npm run agent -- find <term> does not return enough context.


The key line is:

> before broad shell discovery

Don’t ban `rg`. Just make it second-line.

---

# Make it visible in `package.json`

Agents almost always inspect `package.json`.

So make the script obvious:

```json
{
  "scripts": {
    "agent": "node scripts/agent.mjs",
    "verify": "npm run lint && npm run test",
    "verify:ci": "npm run verify && npm run build && npm run test:visual"
  }
}

You can even add:

{
  "scripts": {
    "help": "node scripts/agent.mjs map",
    "agent": "node scripts/agent.mjs"
  }
}

But npm run agent -- map is the main thing.

Don’t overfit the tool

The tool should not know too much.

Bad:

agent find avatar
→ deeply parses every CSS selector, maps variables, locates tests, categorizes variants, detects architecture drift

This becomes fragile.

Good:

agent find avatar
→ gives likely files, related contracts, recommended reads

The tool’s job is to reduce wandering, not replace reasoning.

Project-specific internals are okay if the interface is reusable

This is the important distinction.

You don’t need the implementation to be reusable.
You need the interface to be reusable.

Across projects, you can keep:

npm run agent -- map
npm run agent -- find auth
npm run agent -- contract login
npm run agent -- verify
npm run agent -- changed

But the implementation can differ:

CSS project: selectors, contracts, demo components.
PHP project: services, controllers, templates, migrations.
PixiJS game: systems, components, assets, scenes.
SilverStripe app: models, controllers, templates, tasks.

That’s fine. The agent learns the stable habit:

use npm run agent -- find X first.

You can make the tool self-advertising

When run without arguments:

npm run agent

It should print:

Agent helper

Use:
  npm run agent -- map
  npm run agent -- find <term>
  npm run agent -- contract <name>
  npm run agent -- verify
  npm run agent -- changed

Rules:
- Start with map/find before broad shell search.
- Verification output is failure-oriented.
- Generated files and dist are ignored by default.

This helps because agents often run scripts without arguments to inspect them.

Even simpler: maybe no scripts, just AGENT_MAP.md

Honestly, for a small CSS framework, you may not need scripts yet.

The most reliable agent tool is often a plain file:

AGENT_MAP.md

Because every agent can read a file. No Windows shell weirdness. No script bugs. No Node argument parsing. No maintenance.

Example:

# Agent Map

## Start here

- Architecture: `ARCHITECTURE.md`
- Quality rules: `QUALITY.md`
- Contracts: `contracts/`

## Components

| Thing | Main file | Contract | Demo |
|---|---|---|---|
| avatar | `src/components/avatar.css` | `contracts/avatar.md` | `demo/avatar.html` |
| accordion | `src/components/accordion.css` | `contracts/accordion.md` | `demo/accordion.html` |
| tabs | `src/components/tabs.css` | `contracts/tabs.md` | `demo/tabs.html` |
| forms | `src/components/forms.css` | `contracts/forms.md` | `demo/forms.html` |

## Shared layers

| Layer | File | Use for |
|---|---|---|
| tokens | `src/tokens.css` | semantic values |
| intents | `src/intents.css` | `.primary`, `.success`, etc. |
| variants | `src/variants.css` | shared visual variants |
| layout | `src/layout.css` | layout primitives |

## Verification

- Fast: `npm run verify`
- Full: `npm run verify:ci`

This may be more effective than generated scripts.

The agent sees:

Use AGENT_MAP.md before broad searches.

That’s very likely to work.

My recommendation

For now, I’d avoid a pile of project-specific find scripts.

Use this hierarchy:

Level 1: plain map file

Most useful, lowest maintenance.

AGENT_MAP.md
Level 2: one generic command

Only if you still need it.

npm run agent -- map
npm run agent -- find avatar
npm run agent -- verify
Level 3: generated indexes

Only when the project grows enough that manual maps rot.

generated/CSS_INDEX.md

But don’t start there.

Revised AGENTS.md addition

I’d add this, not too much more:

## Discovery

Before broad shell discovery, read `AGENT_MAP.md`.

Use broad searches only when the map and relevant contract are insufficient.

Prefer stable project entry points over ad-hoc shell pipelines:
- `npm run agent -- map`
- `npm run agent -- find <term>`
- `npm run agent -- verify`

If an agent command is unavailable or unhelpful, fall back to targeted search with `rg`.

This is pragmatic. It does not pretend your scripts are magic.

The bigger lesson

You found the trap:

“Let’s improve agentic coding by adding tools.”

But if those tools are not standard, obvious, and habit-forming, they become more context the agent has to learn.

The better target is:

one map
one command
few verbs
boring names
failure-oriented output

That has a chance of being reused.

For your current CSS project, I’d probably do:

AGENTS.md
AGENT_MAP.md
ARCHITECTURE.md
contracts/

And maybe later:

npm run agent -- find <term>

No more than that.
