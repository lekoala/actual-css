# AGENTS.md

Rules describe stable constraints.
Examples show preferred usage.
Manual explain the principles.
Code reveals the actual API.
Comments explain the purpose.

Ship production ready, future-proof code.
Always think about ease of maintenance and low developer burden.

Elegance is key. Less is more.

This library has not reached 1.0 and can make as many breaking changes as required to reach the proper shape.

Add relevant guards for future-us when needed based on traps and discoveries.

## Tools

- Do not lint yourself, this is done by config and use biome
- Do not run build:dist, unless you want to test if build script works (the user build it)
- Do not run build:demo, unless you worked on the build script (we have a watcher that build it)
- After editing demo/templates/*.html, run `bun run check:templates` (balanced `<style>` braces) — it's cheap and doesn't touch dist or generated demo output, unlike build:all
- Playwright is not installed, build based on specifications
- Never rewrite a source file through a shell pipeline. PowerShell
  `(Get-Content x) -replace ... | Set-Content x` truncated `blocks.html`,
  `forms.md` and `javascript.md` to 0 bytes (the read is lazy, so the write
  empties the file before it is read). Same trap with `sed -i`, `>` and `tee`.
  Use the edit tool, which fails loudly instead of silently emptying a file.
- Bulk markup migrations need a verification pass, not a careful replace: a
  replace over `class="flyout"` cannot see markup whose attributes span several
  lines. Write the inverse check (`tmp/enhance-audit.js` is the 0.2 example) and
  run it after each step.

No need to mention that you didn't do anything

## Rules

- Don't open the browser
- Don't create file outside the project
- Temp files can be created in `./tmp`
- If code and docs disagree, treat code as the API source and update the smallest doc that explains the decision
- Resolve designs toward the system before transcribing them. Prefer an existing
  token or primitive when it is a close match. Use a public component hook for
  intentional local deviations. Add application CSS only when the difference is
  genuinely product-specific. Do not preserve incidental mockup pixel values by
  default.

### Documentation and implementation

- The CSS source is canonical for exact values and fallback chains. Do not
  duplicate current defaults into docs merely to restate them; explain which
  hook to use, non-obvious relationships, and what is derived, state-owned, or
  runtime-written.
- A component-prefixed custom property owned by the component's base rule is
  generally an author hook. Properties owned by state/variant rules, derived
  from other properties, or written by JavaScript are internal unless documented
  otherwise. Treat this as a convention, not a parser rule.
- Use `### Hooks` to list useful author-facing hooks and their non-obvious
  relationships. Do not repeat defaults already visible in the CSS, and skip a
  one-item section when the surrounding prose already names the hook.
- Document primitives so they are searchable from the problem, not only from the
  solution: near the canonical answer, include a few natural terms an author
  might search for (e.g. cluster / split / spread / one left one right). State
  intentional absences next to the recommended alternative, case by case; no
  exhaustive negative catalogue.
- Before adding CSS or a new primitive: search docs with the problem vocabulary,
  inspect the nearest existing primitive and its hooks, and check whether the
  need is composition of existing primitives. Do not create a convenience
  primitive merely because the existing solution was not discoverable — improve
  the docs instead, in the same change.
- Comments explain why, constraints, and non-obvious contracts — not what the
  next declaration says. Add a short `why` comment on intentionally defensive
  declarations or component invariants so future cleanup does not remove and
  restore them.
