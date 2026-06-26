# AGENTS.md

Rules describe stable constraints.
Examples show preferred usage.
Manual explain the principles.
Code reveals the actual API.
Comments explain the purpose.

Ship production ready, future-proof code.
Always think about ease of maintenance and low developer burden.

Elegance is key.

This library has not reached 1.0 and can make as many breaking changes as required to reach the proper shape.

Add relevant guards for future-us when needed based on traps and discoveries.

## Tools

- Do not lint yourself, this is done by config and use biome
- Do not run build:dist, unless you want to test if build script works (the user build it)
- Do not run build:demo, unless you worked on the build script (we have a watcher that build it)
- Playwright is not installed, build based on specifications

No need to mention that you didn't do anything

## Rules

- Don't open the browser
- Don't create file outside the project
- Temp files can be created in `./tmp`
