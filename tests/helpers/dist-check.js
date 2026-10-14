// Loaded through bunfig.toml's [test] preload.
//
// dist/ is build output, not committed. Browser fixtures and packaging tests
// read it, so a fresh clone fails dozens of them with ERR_FILE_NOT_FOUND or
// popovers that never open — symptoms that point everywhere but the cause.
// Name the cause once, up front. Unit tests still run, so a targeted
// `bun test tests/x.test.js` is not blocked.

import { existsSync } from "node:fs";

const required = ["actual.full.css", "actual.full.min.css", "actual.full.js"];
const dist = new URL("../../dist/", import.meta.url);
const missing = required.filter((file) => !existsSync(new URL(file, dist)));

if (missing.length > 0) {
  console.warn(
    `\n⚠ dist/ is missing ${missing.join(", ")}: browser and packaging tests will fail. Run \`bun run build:all\` first.\n`,
  );
}
