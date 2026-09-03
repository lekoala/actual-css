import { afterEach, expect, test } from "bun:test";
import { cleanupDOM } from "./helpers/dom.js";
import { publicJsExports, sourceModuleForJsExport } from "./helpers/package-exports.js";

let importId = 0;

afterEach(() => {
  cleanupDOM();
});

test("javascript modules import without a DOM", async () => {
  cleanupDOM();

  for (const exportPath of publicJsExports()) {
    const module = sourceModuleForJsExport(exportPath);
    await import(`../src/js/${module}.js?ssr=${++importId}`);
  }

  expect(globalThis.document).toBeUndefined();
});
