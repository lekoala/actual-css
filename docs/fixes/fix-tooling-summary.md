The Core Problem: Agent as Judge vs. Agent as Worker
Across all four issues, the pattern is the same: agents are given too much autonomy, too little structure, and no external feedback loop. The fix is not "write better prompts" — it's to build a harness that constrains agent behavior and an repo structure that makes the right move obvious.

Layer 1: Project Structure — The Three Invariants
Every project, regardless of stack, should have exactly three human-authored docs and one generated artifact:

AGENTS.md — behavioral rules only (short, boring, and unambiguous): no claiming "done" without harness output, no duplicating architecture, no questions unless the choice affects public API

ARCHITECTURE.md — layer definitions, ownership rules, invariants (e.g., "components consume semantic variables, never hardcode palette values")

QUALITY.md — work modes (Diagnose / Patch / Refactor / Contract / Review), completion policy (harness owns "done", not the agent), and verification commands

generated/PROJECT_MAP.md — never hand-written; always regenerated from source annotations

The key insight from your files: large markdown specs rot. A component contract should be 4–6 bullet lines, not a 3-page essay. Agents skim long docs, obey some parts too literally, and forget others.

Layer 2: Source Annotations → Generated Map
The manual map trap is solved by annotating the source directly and generating the map from it. Every meaningful file gets a small metadata block:

js
/**
 * @actual component
 * @component avatar
 * @category decoration
 * @summary Identity marker with intent support.
 * @contract contracts/avatar.md
 * @depends intents variants tokens
 * @owns .avatar .avatar.primary
 */
Then npm run map regenerates generated/PROJECT_MAP.md automatically. The generator also outputs drift warnings — "contract declared but file missing", "component has no @actual header" — which are more useful to agents than passing test counts. This convention (@actual layer, @actual component, @actual feature, @actual module) is generic enough to work in CSS, Rust, PHP, TypeScript, or any stack.

Layer 3: The Agent Command — One Entry Point, Five Verbs
The problem with many find-* scripts is that agents revert to rg and ls anyway because those are in their learned priors. The solution is one conventionally-named command with boring verbs agents already understand:

Command	Purpose
npm run agent -- map	Print the generated project map (replaces 5 file reads)
npm run agent -- find <term>	Routing assistant: likely files, related contracts, recommended reads
npm run agent -- contract <name>	Read the component contract directly
npm run agent -- verify	Run checks, emit failures only
npm run agent -- changed	Show what files were modified (agents lose track)
The interface stays identical across every project; only the internal implementation varies. Add this to AGENTS.md:

text
## Discovery
Before broad shell search, use: npm run agent -- map / find / verify
Prefer this over ad-hoc find, grep, ls, or shell pipelines.
This is critical on Windows where rg, sed, and xargs pipelines routinely break in sandboxes.

Layer 4: The Verification Loop — Harness Owns "Done"
The relationship you want is: Human defines intent → Architecture docs define structure → Contracts define behavior → Harness verifies facts → Agent edits code. Never the reverse. Concretely:

npm run verify is the only truth. Agent must not report "done" unless this output was provided by the harness

npm run verify:ci is the full gate (build + visual regression)

The agent receives only failures, never "132 tests passing" — use vitest run --reporter=basic or equivalent

Ban these phrases in AGENTS.md: "Done", "Fully implemented", "All tests pass", "This now works" — unless the harness output was explicitly provided

For CSS specifically, DOM/CSS Playwright assertions beat 20-page markdown specs: expect(primaryBg).not.toBe(normalBg) is a better avatar contract than any written description.

Layer 5: Token Budget — Constrain Discovery
Agents spiral into rg loops that burn context on noise. Add a discovery budget to AGENTS.md:

text
## Discovery budget
Before editing, use at most:
- 1 repo map read
- 3 targeted file reads  
- 2 targeted searches
Do not read files longer than 250 lines in full.
Do not inspect lockfiles, build output, or generated files unless the task is about them.
The generated CSS_INDEX.md (or equivalent symbol index for your stack) eliminates most grep wandering by giving agents a pre-built routing table: "where is .avatar.primary defined, what variables does it consume" — answered in one read.

Tooling Choices: OpenCode, Cursor, and Plugins
Given you're on Windows/WSL and work with Rust + web stacks, here's an honest evaluation of harness options:

OpenCode is a strong fit: it's terminal-native, designed for agentic loops, and respects AGENTS.md/CLAUDE.md-style files natively. It exposes file tools rather than raw shell by default, which directly addresses the Windows sandbox pain you documented.

Cursor with .cursorrules works well but still defaults to shell-heavy discovery. Your npm run agent -- find abstraction compensates for this.

VS Code + Continue.dev with a custom MCP server is the most powerful but highest setup cost — worth it once the @actual annotation system is in place and you want IDE-integrated map navigation.

Claude's project-level system prompts (or OpenCode's equivalent) are where AGENTS.md content should live at the harness level, not just in the repo — so it applies before the agent even reads any files.

The honest answer from your files: no harness currently exposes proper semantic repo tools. Until they do, the project-side mitigation (generated/PROJECT_MAP.md + npm run agent) is the most reliable cross-project fix.

What to Build First (Priority Order)
Template AGENTS.md — copy-paste base for every new project, with work modes, decision policy, discovery budget, and response format baked in

scripts/agent.mjs — the single entry point with map / find / contract / verify / changed; the internals are project-specific but the CLI is universal

@actual annotation convention in your source files + a generator script (npm run map)

Failure-only verify script (npm run verify:failures) that never reports passing counts

Per-project contracts/ — small (4–8 lines each), written before the agent touches the component

Once steps 1–4 exist as a reusable template repo or dotfiles, bootstrapping a new project becomes a git init + copy of the template, not re-deriving the whole system each time.
