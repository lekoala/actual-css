## Applied in Actual CSS

Actual CSS kept the curated map part of this advice and rejected the heavier tooling parts.

- `docs/PROJECT_MAP.md` is the maintained discovery entry point.
- local contract headers in `src/components/*.css` are the expectation surface.
- Generated indexes and repo-specific `find` scripts are not maintained as contributor source of truth.
- The examples below discuss possible approaches in general; they are not the adopted workflow for this repo.

next up really is token usage and discovery: it always seems like it takes a really big amount of work to find whats needed and where to edit things. running command line is clunky (for example, codex on windows keeps having issues with the windows sandbox - no obvious fix, i had to install rg otherwise it basically fails at finding stuff). how come agent harness don't have proper internal, optimized tooling and have to rely on running approximate cli commands (on windows, it's a nightmare  : positional arguments not being valid, etc). token usage is also quickly consommed : reading output of these commands, etc... all that doesn't feel very optimized to me

Yes — this is one of the weirdest parts of today’s agentic coding UX: the agent is “smart”, but its discovery tools are often primitive.

It’s like hiring a senior engineer and forcing them to navigate a repo through a bad terminal emulator, on Windows, through a sandbox, with half the tools missing.

Your intuition is right: this is not optimal.

The core problem

Most coding agents currently interact with codebases through a very generic loop:

run shell command
read stdout
guess next command
read file
edit file
run test
read stdout
repeat

That works, but it is wasteful.

It burns tokens on:

ls output
grep output
test output
build noise
stack traces
package manager noise
formatting noise

And worse, the shell interface is not semantic. The agent does not ask:

“Where is the Avatar component defined, and what styles affect .avatar.primary?”

It asks:

rg "avatar"

Then manually reasons from a pile of text.

That is clunky, especially on Windows.

Why don’t harnesses have better internal tools?

They should.

A good agent harness should expose structured repo tools, not just shell access.

Something like:

repo.searchSymbol("avatar")
repo.searchSelector(".avatar")
repo.findCssDefinitions(".avatar.primary")
repo.readFileRange("src/components/avatar.css", 20, 80)
repo.getImports("src/index.css")
repo.getChangedFiles()
repo.runCheck("visual", { onlyFailures: true })

Instead, most agents get:

grep
rg
sed
cat
find
npm test

This is portable in theory, but fragile in practice.

The reasons are probably:

Shell is the lowest common denominator. It works across languages and projects.
Semantic tooling is language-specific. TypeScript, CSS, PHP, Python, Rust all need different parsers.
Sandboxing is hard. File access, command execution, and editing need to be constrained safely.
Most agent products evolved from chat + terminal, not from IDE architecture.
Tooling quality is still early. The model quality improved faster than the harness quality.

But yes: for serious agentic coding, the shell should be fallback, not the main interface.

What good repo discovery should look like

For your CSS framework, the agent should not have to run five commands to understand where things are.

You can create a repo map that acts as a cheap index.

Example:

# PROJECT_MAP.md

## Entry points

- `src/index.css`
  Imports framework layers in order.

## Core layers

- `src/tokens.css`
  Defines semantic tokens, color scales, spacing, radius, typography.

- `src/color-engine.css`
  Defines intent variables for `.primary`, `.success`, `.warning`, etc.

- `src/typography.css`
  Defines fluid text scale and typography utilities.

## Components

- `src/components/button.css`
  `.btn`, button variants, sizes, icon buttons.

- `src/components/avatar.css`
  `.avatar`, size variants, intent variants.

- `src/components/accordion.css`
  `.accordion`, summary layout, caret handling.

- `src/components/forms.css`
  `.field`, `.fieldset`, input/select/textarea styles.

## Demo only

- `demo/*`
  Showcase layout. Must not be required for framework behavior.

This file should be short, manually curated, and high-value.

Then the agent starts from PROJECT_MAP.md, not rg.

This saves a surprising amount of tokens.

Use a “discovery budget”

I’d explicitly constrain discovery.

Example instruction:

## Discovery budget

Before editing, use at most:
- 1 repo map read
- 3 targeted file reads
- 2 searches

If more discovery is needed, explain why before continuing.

This prevents the agent from doing the classic spiral:

rg button
rg primary
rg color
cat entire file
cat another entire file
npm test
cat test output
...

For a small CSS project, most tasks should need only:

PROJECT_MAP.md
src/color-engine.css
src/components/avatar.css
maybe demo file
Prefer file manifests over command discovery

For agentic coding, this is better:

# COMPONENTS.md

## Avatar

Files:
- `src/components/avatar.css`
- `contracts/avatar.md`
- `tests/visual/avatar.spec.ts`

Consumes:
- intent variables from `src/color-engine.css`
- size/radius tokens from `src/tokens.css`

Rules:
- no raw color values
- variants use intent engine

Than expecting the agent to rediscover that every time.

It is not a huge spec. It is a routing table.

That’s the key distinction:

Bad docs: long behavioral essays.
Good docs: maps, invariants, ownership, entry points.
You can make your own lightweight harness layer

Even if Codex or another agent uses shell poorly, you can improve the project itself.

Add scripts that produce agent-friendly output.

For example:

{
  "scripts": {
    "map": "node scripts/repo-map.mjs",
    "check": "pnpm lint && pnpm test && pnpm build",
    "check:fail": "vitest run --reporter=basic",
    "css:where": "node scripts/find-css.mjs"
  }
}

Then create small scripts like:

pnpm css:where avatar

Output:

Component: avatar

Files:
- src/components/avatar.css
- contracts/avatar.md
- tests/visual/avatar.spec.ts

Selectors:
- .avatar
- .avatar.primary
- .avatar.secondary
- .avatar.success

That is far better than a raw rg.

For CSS specifically: build an index

CSS discovery is painful because selectors are not “symbols” in the same way functions/classes are.

So I’d seriously consider generating a CSS selector index.

Example generated file:

# CSS_INDEX.md

Generated from `src/**/*.css`.

## .avatar

Defined in:
- `src/components/avatar.css`

Related selectors:
- `.avatar`
- `.avatar.primary`
- `.avatar.secondary`
- `.avatar.success`
- `.avatar.warning`
- `.avatar.error`

Uses variables:
- `--avatar-size`
- `--avatar-bg`
- `--avatar-fg`
- `--intent-surface`
- `--intent-contrast`

## .accordion

Defined in:
- `src/components/accordion.css`

Related selectors:
- `.accordion`
- `.accordion summary`
- `.accordion .caret`

Now the agent can answer:

“Where do I edit avatar?”

without searching the repo.

You can generate this with PostCSS or LightningCSS later. At first, even a crude script is enough.

The ideal agent workflow would be different

Instead of:

agent runs rg
agent reads lots of files
agent edits
agent runs tests
agent reads noisy output

It should be:

harness gives task context:
- relevant files
- ownership map
- failing contract
- recent diff
- architecture constraints

agent returns:
- patch
- reasoning summary
- risk notes

harness verifies:
- only failing checks are returned

That is the right architecture.

The agent should not spend 40% of the session discovering obvious repo structure.

Windows makes this worse

Windows is absolutely a multiplier here.

Common pain points:

shell differences
PowerShell quoting
missing Unix tools
path separator differences
sandbox restrictions
argument parsing differences
line endings
file permissions
npm script inconsistencies

So yes, “just use rg, sed, find, xargs” is not a robust agent strategy on Windows.

For agent-friendly projects, I’d avoid relying on shell composition.

Prefer Node scripts:

node scripts/find-css.mjs avatar
node scripts/list-components.mjs
node scripts/check-failures.mjs

These are cross-platform and predictable.

Bad:

rg ".avatar" src | sed -n '1,80p'

Better:

pnpm repo:find avatar

Internally it can use Node APIs.

A practical setup I’d use

For your CSS project:

docs/
  PROJECT_MAP.md
  ARCHITECTURE.md
  QUALITY.md

contracts/
  avatar.md
  accordion.md
  tabs.md
  forms.md

generated/
  CSS_INDEX.md

scripts/
  repo-map.mjs
  css-index.mjs
  find-component.mjs
  verify.mjs

Package scripts:

{
  "scripts": {
    "repo:index": "node scripts/css-index.mjs",
    "repo:map": "node scripts/repo-map.mjs",
    "repo:find": "node scripts/find-component.mjs",
    "verify": "node scripts/verify.mjs",
    "verify:failures": "node scripts/verify.mjs --failures-only"
  }
}

Then AGENTS.md says:

## Discovery

Start with:
1. `docs/PROJECT_MAP.md`
2. `generated/CSS_INDEX.md`
3. The relevant contract in `contracts/`

Do not use broad repo searches unless these files are insufficient.

Prefer project scripts over shell pipelines:
- `pnpm repo:find <term>`
- `pnpm verify:failures`

That changes the default behavior massively.

Token usage: what to avoid

The agent should avoid:

reading full files unnecessarily
running full test suites manually
reading package-lock output
reading minified/generated files
broad grep on common terms
printing giant diffs
asking for entire architecture context repeatedly

And prefer:

repo map
file ranges
targeted contracts
failure-only logs
changed-file summaries
small diffs

A very useful rule:

Do not read files longer than 250 lines in full. Read the relevant range unless the file structure is unknown.

Another one:

Do not inspect generated files, lockfiles, build output, or dependencies unless the task is specifically about them.
The bigger idea: create an “agent API” for your repo

This is probably the most important framing.

Your project should expose a small, stable API to agents.

Not just:

Here are files, good luck.

But:

Here is how to discover components.
Here is how to find ownership.
Here is how to verify.
Here is how to inspect failures.
Here are the architecture invariants.

This can be tiny.

Example:

# Agent API

## Find where to edit

Use:

```bash
pnpm repo:find avatar
Rebuild generated indexes

Use:

pnpm repo:index
Verify work

Use:

pnpm verify:failures
Main docs
docs/PROJECT_MAP.md
docs/ARCHITECTURE.md
generated/CSS_INDEX.md

Now the agent does not need to improvise the operating system every time.

---

# My honest take

You are not wrong: current agent harnesses feel underbuilt compared to the models.

The model can reason about architecture, but the harness often gives it:

```txt
a shell
a text editor
a huge context window
hope

That is not enough.

For now, the best workaround is to make the repo itself agent-friendly:

Curated repo map
Generated selector/symbol index
Cross-platform Node scripts
Failure-only verification output
Small contracts per component
Strict discovery budget
No shell pipelines as primary workflow

For your CSS project, I’d start with just three files/scripts:

docs/PROJECT_MAP.md
generated/CSS_INDEX.md
scripts/find-component.mjs

That alone should reduce a lot of token waste and random CLI wandering.
