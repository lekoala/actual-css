## Applied in Actual CSS

This repo now applies these recommendations directly:

- `AGENTS.md` is the short operating discipline for coding agents.
- `ARCHITECTURE.md` defines the edit layers and routing rules.
- `QUALITY.md` defines the work modes, completion policy, and verification split.
- local contract headers in `src/components/*.css` hold component-specific invariants.
- `tests/contracts/*.test.js` keeps the architecture and contract surface from drifting.
- `npm run verify` is the fast inner loop.
- `npm run verify:ci` is the full gate with build and visual regression.

so i'm working on this project with agentic coding and i always run into similar issue: - overpromising, underdelivering (even from "good" models): "yes, it's done" and when i test : it's not working, or half working, or broke something else - then you think: ok, i just need more tests/specs/... but then you end up writing lots of specs, maintain large md files, keep it consistent. adding test is good though, provided they run fast and agents can write them. but then it also always try to run them and report "xxx tests passing". i don't care about passing tests, i care about failing tests. and really, the agent shouldn't be the one running it, it should be automated: asking an agent to run test or build stuff is a waste of time and tokens, it should be a documented process - "write more code to fix it" : when asked about the feature, the answer is always writing more code. not having a nice, readable, elegant code at the end. architecture? almost always forgotten, even in a small project. best case, it takes current patterns and replicate them - kind of works, but not very inspired either - "this is good enough" : for a test project or a prototype, shortcuts are taken. i always want good, production quality code. it's not that much more work. - asking questions : should i do this, or that... good, in a way, but also, feels like i'm constantly educating someone. really, most decisions should be based on prior knowledge (available knowledge) not provided by me unless necessary. proper patterns should be guided by best practices and project specifications, not random, per request, questions how do we fight this ? agents.md helps, to an extent (then some rules get forgotten or adheres too stricly), harness can help, system prompt, skills... but all that also takes maintenance and orchestration. i'm currently working on a test css project and i keep facing these. how to fix it ?

You’re describing the central failure mode of agentic coding: the agent behaves like an eager junior dev with infinite confidence and weak feedback discipline.

The fix is not “more prompting”. It is to remove as many judgment calls from the agent as possible, and to make the agent operate inside a small, explicit, automated loop where it cannot easily lie, drift, or compensate with more code.

For your CSS framework/test project, I’d think in terms of four layers.

1. Stop asking the agent to “finish features”

The most dangerous prompt is:

“Implement this feature.”

Because the agent interprets that as:

write code until it looks plausible, then declare victory.

A better unit of work is:

“Make one small, reviewable change that satisfies this acceptance condition. Do not claim success. Produce a diff and explain remaining risks.”

The agent should not own “done”.
Your harness should own “done”.

So instead of:

“Fix the avatar primary issue.”

Use:

“Make .avatar.primary visually respond to the intent system without introducing component-specific color duplication. Keep the implementation aligned with the existing intent-token architecture. Do not run tests. Return only: changed files, rationale, risk notes.”

Then your automated process runs visual/build/tests.

This matters because agents are bad at global truth, but decent at local diffs.

2. Replace large specs with small executable contracts

Large markdown specs rot. Agents skim them, obey some parts too literally, and forget others.

For your CSS project, I’d split documentation into three different types:

A. AGENTS.md: behavioral rules only

This should be short and almost boring.

Example:

# Agent rules

- Do not claim that something works unless it is verified by an automated check or explicitly marked as unverified.
- Prefer editing existing architecture over adding new systems.
- Before changing CSS, identify the layer: tokens, engine, component, utility, demo.
- Do not duplicate intent colors inside components.
- Do not introduce component-specific color logic when the intent engine can handle it.
- Keep selectors low-specificity unless there is a documented reason.
- Do not add new abstractions for a single use case.
- Return changed files, rationale, and known risks.

This file is not the product spec. It is the agent’s operating discipline.

B. ARCHITECTURE.md: stable design constraints

This is where you define the architecture once.

For your CSS framework, something like:

# Architecture

## Layers

1. `tokens.css`
   Source of semantic values: colors, spacing, radius, typography.

2. `color-engine.css`
   Intent resolution layer. Maps `.primary`, `.success`, etc. to local intent variables.

3. `components.css`
   Components consume semantic/local variables. They must not hardcode palette values.

4. `utilities.css`
   Small atomic helpers. Utilities must not override component internals unless documented.

5. `demo.css`
   Demo-only layout and showcase styling. Never required for framework behavior.

## Color rule

Components should use intent variables when they support variants:

```css
.component.primary {
  --component-bg: var(--intent-surface);
  --component-fg: var(--intent-contrast);
}

Do not copy OKLCH/HSL values into components.


This prevents the “write more code” failure because the agent has to place its change in a layer.

### C. Tiny `contracts/*.md` or `contracts/*.test.md`

These are not broad specs. They are executable-ish expectations.

Example:

```md
# Avatar contract

- `.avatar` defaults to neutral surface.
- `.avatar.primary` uses the active intent background and foreground.
- `.avatar.success`, `.avatar.warning`, `.avatar.error` follow the same intent mechanism.
- Avatar size, shape, and typography must not change when intent changes.

This is small enough that an agent can reliably obey it.

3. Don’t let the agent run the quality loop manually

You’re completely right: asking the agent to run tests/builds is a waste unless the test output is needed for reasoning.

The process should be:

pnpm check
pnpm test
pnpm build
pnpm visual

or even better:

pnpm verify

And the agent’s rule should be:

You may inspect failing output when provided. You do not need to run verification unless explicitly asked. Never report “passing tests” as proof of quality.

What you actually want is a red-first loop:

Human or CI/harness reports failure.
Agent receives the failing output.
Agent proposes a minimal patch.
Harness verifies again.
Agent only sees failures, diffs, and maybe snapshots.

For your project, the useful output is not:

132 tests passing

It is:

avatar.primary expected background not equal to neutral background
tab has no visible focus style
fieldset border uses browser default
accordion caret position mismatch

So define a command that emits only failures, for example:

{
  "scripts": {
    "verify": "pnpm lint && pnpm test && pnpm build",
    "verify:quiet": "pnpm verify --silent",
    "test:failures": "vitest run --reporter=basic"
  }
}

For CSS specifically, you probably want a mix of:

{
  "scripts": {
    "lint:css": "stylelint \"src/**/*.css\"",
    "build": "vite build",
    "test": "vitest run",
    "visual": "playwright test",
    "verify": "pnpm lint:css && pnpm test && pnpm build && pnpm visual"
  }
}

Then the agent receives failure logs only.

4. Make “no new code” a valid mode

A major problem is that agents are biased toward generating code. So give them explicit non-coding modes.

For example:

## Work modes

### Diagnose
Do not edit files. Identify the architectural cause and propose options.

### Patch
Make the smallest code change that satisfies the provided acceptance condition.

### Refactor
Improve structure without changing behavior. Must preserve public API.

### Contract
Write or update tests/contracts only.

### Review
Find regressions, duplication, and architecture violations. Do not fix.

Then prompt like:

“Mode: Diagnose. The avatar primary class does not change color. Explain where the fix belongs architecturally. Do not write code yet.”

This fights the “always write more code” reflex.

For your CSS project, this is especially important because the correct answer is often:

“This component should consume the existing intent variables.”

Not:

“Add six new .avatar.primary, .avatar.success, etc. rules with copied colors.”

A practical setup for your CSS project

I’d set up the project like this.

/
  AGENTS.md
  ARCHITECTURE.md
  QUALITY.md
  contracts/
    avatar.md
    button.md
    badge.md
    alert.md
    accordion.md
    tabs.md
    fieldset.md
  src/
    tokens.css
    color-engine.css
    typography.css
    components/
      avatar.css
      button.css
      badge.css
      alert.css
      accordion.css
      tabs.css
      forms.css
  tests/
    css/
      architecture.test.ts
      components.test.ts
    visual/
      demo.spec.ts
QUALITY.md

This should document the process, not the product.

# Quality process

The agent does not decide whether work is complete.

Completion requires:

1. The diff is small and understandable.
2. The change matches the architecture layer.
3. Existing public class names remain compatible.
4. Automated checks pass in CI/harness.
5. Visual regressions are reviewed when relevant.

Agents must not report "done" solely because code was written.
Agents must mark unverified work as unverified.
Architecture tests

You can write simple tests that prevent common agent mistakes.

Examples:

import { readFileSync } from "node:fs";

const files = [
  "src/components/avatar.css",
  "src/components/button.css",
  "src/components/badge.css",
  "src/components/alert.css",
];

describe("component architecture", () => {
  it("does not duplicate raw OKLCH colors in components", () => {
    for (const file of files) {
      const css = readFileSync(file, "utf8");
      expect(css).not.toMatch(/oklch\(/);
    }
  });

  it("does not duplicate raw HSL colors in components", () => {
    for (const file of files) {
      const css = readFileSync(file, "utf8");
      expect(css).not.toMatch(/hsl\(/);
    }
  });
});

This is not enough to prove quality, but it catches agent drift.

You can also test selector discipline:

it("avoids ID selectors in framework CSS", () => {
  for (const file of files) {
    const css = readFileSync(file, "utf8");
    expect(css).not.toMatch(/#[a-zA-Z0-9_-]+/);
  }
});

And maybe:

it("does not use !important in components", () => {
  for (const file of files) {
    const css = readFileSync(file, "utf8");
    expect(css).not.toContain("!important");
  }
});

These are cheap, fast, and very agent-friendly.

For CSS: prefer visual contracts over endless specs

CSS is visual. Text specs help, but screenshots catch the real problems.

Your reported issues are perfect visual contracts:

system/spec buttons same line
“Live v0.1.0” looks like awkward alert/badge
revenue card spacing
accordion caret should align to end
fieldset border should be styled
tab focus-visible missing
switch hover missing
avatar intent missing

A Playwright visual test could open the demo page and compare snapshots. But even before image snapshots, you can use DOM/CSS assertions:

test("avatar primary does not use the same background as default avatar", async ({ page }) => {
  await page.goto("/");

  const normal = page.locator(".avatar").first();
  const primary = page.locator(".avatar.primary").first();

  const normalBg = await normal.evaluate(el => getComputedStyle(el).backgroundColor);
  const primaryBg = await primary.evaluate(el => getComputedStyle(el).backgroundColor);

  expect(primaryBg).not.toBe(normalBg);
});

Focus style:

test("tabs expose visible focus style", async ({ page }) => {
  await page.goto("/");

  const tab = page.locator(".tab").first();
  await tab.focus();

  const outline = await tab.evaluate(el => getComputedStyle(el).outlineStyle);
  const boxShadow = await tab.evaluate(el => getComputedStyle(el).boxShadow);

  expect(outline !== "none" || boxShadow !== "none").toBe(true);
});

Accordion caret alignment:

test("accordion caret is placed at the end", async ({ page }) => {
  await page.goto("/");

  const summary = page.locator(".accordion summary").first();
  const box = await summary.boundingBox();

  const caret = page.locator(".accordion summary .caret").first();
  const caretBox = await caret.boundingBox();

  expect(caretBox!.x).toBeGreaterThan(box!.x + box!.width * 0.75);
});

That is much more useful than a 20-page markdown file.

The agent should produce patches, not declarations

Require a fixed response format.

## Changed files
- ...

## What changed
...

## Architectural fit
...

## Verification
Not run. Expected checks:
- pnpm verify
- pnpm visual

## Risks
- ...

This single change helps a lot.

Ban these phrases:

Do not say:
- "Done"
- "Fully implemented"
- "All tests pass"
- "This now works"

Unless the verification output was provided by the harness.

Instead allow:

Implemented a patch for the requested behavior. Verification not run here.

This sounds small, but it changes the agent’s psychology. It stops the false closure.

The bigger pattern: agent as worker, harness as judge

You want this relationship:

Human: defines intent and reviews taste
Architecture docs: define allowed structure
Contracts/tests: define expected behavior
Harness/CI: verifies facts
Agent: edits code

Not this:

Agent writes code
Agent runs tests
Agent interprets tests
Agent declares success
Human discovers reality

That second loop is exactly what you’re suffering from.

About “production quality even for prototypes”

You need to encode this as a default quality bar, not a per-task reminder.

Example rule:

# Quality bar

This project treats prototype code as production-shaped code.

Allowed:
- Small scope
- Incomplete feature coverage
- Simple implementation

Not allowed:
- Duplicated architecture
- Dead code
- Temporary hacks without TODO owner
- Inconsistent naming
- Styling that only works for the demo
- Public APIs that will obviously need renaming later

This distinction is important.

A prototype can be small.
It should not be sloppy.

About questions from the agent

You’re right again: too many questions are a failure mode.

Add a decision policy:

# Decision policy

Agents should only ask questions when:
- The choice affects public API.
- The choice affects user-visible behavior in a way the project docs do not resolve.
- The choice is irreversible or expensive to change.

Otherwise:
- Follow existing architecture.
- Prefer simple, conventional solutions.
- Document the assumption in the response.

So instead of asking:

“Should the accordion caret be on the right?”

The agent should infer:

In modern disclosure components, the caret usually sits at the inline end. I’ll align it right.

But it should ask before:

“Should we rename .primary to [data-intent='primary'] globally?”

Because that affects public API.

My suggested AGENTS.md for your project

You could start with this:

# AGENTS.md

## Role

You are contributing to a small CSS framework. Favor production-shaped, readable, maintainable code over quick demo fixes.

## Completion discipline

- Do not claim work is complete unless verification output is provided.
- If verification was not run, say "Verification not run".
- Do not report passing tests unless the latest harness output is available.
- Focus on failing checks, regressions, and risks.

## Architecture

- Identify the layer before editing: tokens, color engine, typography, component, utility, demo.
- Prefer extending existing architecture over adding new systems.
- Components consume semantic variables; they must not duplicate palette values.
- Intent variants should flow through the intent engine.
- Demo CSS must not be required for framework behavior.
- Keep selectors low-specificity and composable.
- Avoid `!important`.

## Quality bar

- Prototype scope is acceptable; prototype-quality code is not.
- No dead code, one-off hacks, or unexplained duplication.
- Preserve existing public class names unless explicitly asked.
- Prefer small, reviewable diffs.
- Do not add abstractions for one use case.

## Questions

Ask only when a decision affects public API, irreversible behavior, or user-visible design that is not covered by existing docs.
Otherwise use conventional best practice and state the assumption.

## Response format

Return:

1. Changed files
2. What changed
3. Architectural fit
4. Verification status
5. Risks or follow-up notes

That is enough. Don’t make AGENTS.md huge.

My suggested workflow

For each issue:

1. Write/adjust a tiny contract.
2. Ask the agent for a patch only.
3. Harness runs verification.
4. Feed only failures back to the agent.
5. Review final diff for architecture.

Example:

Issue: .avatar.primary does not change color.

Contract:
.avatar supports intent variants through the color engine.

Agent task:
Patch avatar.css so avatar variants consume intent variables.
Do not add raw color values.
Do not run tests.
Return diff summary and risks.

Then:

pnpm verify

If it fails, paste only:

FAIL avatar primary expected different background
actual: rgb(...)
expected: not neutral

Now the agent has a useful loop.

The uncomfortable truth

You cannot fully prompt your way out of this.

A good agentic coding setup is less like:

“A smarter assistant who understands everything”

and more like:

“A constrained code generator inside a harsh feedback system.”

The best results come when the agent has:

less freedom
smaller tasks
clearer architecture
automatic verification
no authority to declare done
strong bias toward editing existing patterns
explicit permission to diagnose/refactor instead of always adding code

For your CSS framework specifically, I’d focus first on:

AGENTS.md short operating discipline.
ARCHITECTURE.md defining CSS layers.
contracts/ for each component.
pnpm verify as the only truth.
Playwright visual/DOM assertions for the demo.
Agent response format that forbids false closure.

That should fight most of the issues you listed without turning the project into a documentation swamp.
