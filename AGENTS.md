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

- Never ignore biome diagnostics: warnings and info-level findings must be
  fixed or explicitly accepted, never dismissed. `bun run lint` must end clean
  before the work is considered done
- Do not run build:dist, unless you want to test if build script works (the user build it)
- Do not run build:docs unless you worked on the build scripts or docs sources (it needs dist/ first; the user runs it)
- After editing demo/templates/*.html, run `bun run check:templates` (balanced `<style>` braces) — it's cheap and doesn't touch dist or generated demo output, unlike build:all
- Rendering is `Bun.WebView` driving headless Chrome through
  `scripts/utils/browser.js`, never Playwright (not a dependency;
  `node_modules/.bin/playwright` is a stale shim). Use `bun run shot:page`,
  `bun run shot:multi` or `bun run probe`; for a state no flag exposes, such as
  `prefers-reduced-motion`, import `capture` from that module in a `tmp/`
  script and pass `mediaFeatures`.
- Visual changes must be inspected once in the states they affect. Cover the
  meaningful extremes when the geometry is responsive, and exaggerate a tiny
  detail in the fixture rather than squinting at its production size.
- Do not screenshot top-layer content with `shot:page` or `capture`: they pass
  `captureBeyondViewport: true`, which mis-composites an open popover or modal
  dialog — the panel came out translucent and painted *under* a sibling button
  that a probe proved it covered. For a top-layer state, drive
  `Page.captureScreenshot` yourself from a `tmp/` script with the flag off, and
  size the viewport with `Emulation.setDeviceMetricsOverride`.
- On every shell, pass rg a directory plus rg's own `-g` glob — never a shell
  glob (`rg "x" dir/*.ext` passes the literal path and fails with os error 123).
  Wrap the pattern in single quotes and never escape a quote with `\"`
  (PowerShell double-quoted strings end at an unescaped `"`; bash needs no
  escaping inside single quotes). One safe universal form:
  `rg 'pattern' tests -g '*.test.js'`
- Keep each shell command to one plain invocation, on every shell. Control flow
  (loops, `if`, `do ... done`, `{ ... }`) and multi-path argument forms are the
  least portable things you can write, and they fail before touching a file, on
  grammar or on argument binding — so nothing runs and the error describes the
  syntax rather than the task. Both directions bite: `for f in a b; do ...;
  done` is a bash reflex that PowerShell rejects, and space-separated
  `dir a b` is a bash reflex that PowerShell answers with "A positional
  parameter cannot be found that accepts argument". A loop over N files is N
  separate calls, or one call to a tool that documents how it takes several
  paths.
- Read file contents with the read tool, not a shell command. It works on every
  shell, labels each file, and takes an offset and a limit, so it replaces the
  usual reasons to reach for a loop or for `head` / `tail` / `wc`. Assume no
  utility exists beyond the one you are calling.
- For the rare quick number-only check (a rect, a computed style, a class
  list) use `bun run probe <page> --script tmp/x.js` instead of improvising a
  headless-Chrome script — it runs the file as an async program in the page and
  prints its `return` value as JSON. Do not chain probes to verify behaviour;
  that belongs in a test, with `bun run lint` and the suite as the gate. This
  bans the probe loop, not the screenshot pass above — a value you cannot
  assert is a value you have to look at
- Never rewrite a source file through a shell pipeline. PowerShell
  `(Get-Content x) -replace ... | Set-Content x` truncated `blocks.html`,
  `forms.md` and `javascript.md` to 0 bytes (the read is lazy, so the write
  empties the file before it is read). Same trap with `sed -i`, `>` and `tee`.
  Use the edit tool, which fails loudly instead of silently emptying a file.
- Bulk markup migrations need a verification pass, not a careful replace: a
  replace over `class="flyout"` cannot see markup whose attributes span several
  lines.

## Rules

- All code, comments, commit messages, and documentation are written in English
- Don't open the browser
- Don't create file outside the project
- Temp files can be created in `./tmp`
- If code and docs disagree, treat code as the API source and update the smallest doc that explains the decision
- Release tags carry no `v` prefix: `0.7.0`, never `v0.7.0`. The maintainer
  creates the tag — a release stops at the version commit (dated changelog
  section, bumped `package.json`, rebuilt artifacts). Do not tag and do not
  publish to npm. Read the format from `git ls-remote --tags github`, not from
  the local tag list, which can hold a stray a push never carried.
- Resolve designs toward the system before transcribing them. Prefer an existing
  token or primitive when it is a close match. Use a public component hook for
  intentional local deviations. Add application CSS only when the difference is
  genuinely product-specific. Do not preserve incidental mockup pixel values by
  default.

## CSS selectors

- Invalid selectors discard the whole rule. Never merge vendor rules, and never
  nest `:has()` inside `:has()` — including through `:not()`/`:is()`. Flat
  combinations such as `.x:has(...):has(...)` and
  `.x:not(:has(...)):has(...)` are valid; only a `:has()` inside another
  `:has()` argument is forbidden.
- No `@supports` that guards nothing: an unsupported selector or declaration is
  already dropped on its own. Wrap a rule only when that drop would take
  something worth keeping with it — a selector list mixing new and supported
  selectors, or a fallback declaration that must survive. Otherwise document
  the degradation with a why comment or the `check:compat` ledger.
- Not every position accepts a math function. A radial-gradient radius rejects
  percentage-mixed math at parse time (`min(38%, 4.5rem)` and
  `calc(38% - 1rem)` both fail `CSS.supports`), so the declaration is dropped
  and the effect silently disappears. Probe `CSS.supports` before relying on
  math in an unusual value position.
- Child combinator only where layout or state depends on the immediate DOM: the
  component's own items, or a property that needs a direct child (grid/flex-item
  properties). Plain descendant for anything named by its own class — the
  framework owns the structure, so restating it is weight without protection.

  ```css
  .steps > li { … }                                   /* the row's items */
  .steps-vertical > li > .step-label { align-self: center; }  /* grid item */
  .steps .step-label { … }                            /* named sub-element */
  ```

- The same prefix on a dozen rules is a shared primitive missing a class. Give
  it one and make the variants peers, so no rule excludes or undoes another.

## Writing

- Clear and concise. Every sentence must carry something the reader cannot get
  from the code.
- Say what a thing is and how to use it. Reasoning belongs in a design note, a
  commit message, or a code comment — not in reference documentation.
- Cut restatements: a default already visible in the CSS, a rationale already
  written elsewhere, a sentence summarising the paragraph above it.
- Changelog: one line per entry, always. An entry needing a second sentence is
  two entries or a pointer to a note. Name the class, hook, export, or file an
  adopter would search for.

## Documentation and implementation

- The CSS source is canonical for exact values and fallback chains. Do not
  duplicate current defaults into docs merely to restate them; explain which
  hook to use, non-obvious relationships, and what is derived, state-owned, or
  runtime-written.
- Docs and comments always describe the current state, not history. Version
  references ("in 0.2", "introduced in", "removed in", "previously") belong in
  the changelog or a migration guide, never in user documentation.
- A component-prefixed custom property owned by the component's base rule is
  generally an author hook. Properties owned by state/variant rules, derived
  from other properties, or written by JavaScript are internal unless documented
  otherwise. Treat this as a convention, not a parser rule.
- Use `### Hooks` to list useful author-facing hooks and their non-obvious
  relationships. Do not repeat defaults already visible in the CSS, and skip a
  one-item section when the surrounding prose already names the hook.
- Table cells hold labels, not paragraphs. Alignment pads every cell to its
  column's widest, so one long cell widens every row and the source stops
  fitting a pane — `check:docs` fails a table whose aligned width would pass
  100 chars, and names the cell to shorten. Keep the cell to the scannable
  claim and put the qualification in prose under the table. When a cell is an
  enumeration or a paragraph, the content is not table-shaped: use a list.
- Never align a markdown table by hand. Write the cells with single spaces and
  run `bun run format:docs`, which aligns every table under `docs/` (biome
  does not format markdown). It pads on the side each column's marker asks
  for, so `:---:` and `---:` keep previewing their rendering, and it leaves
  code fences alone. `check:docs` fails an unaligned table, so the pair works
  like `generate:reserved` / `check:reserved`. Both read the width formula from
  `scripts/docs/tables.js` — change it there, not in one of them.
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
