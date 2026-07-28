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
