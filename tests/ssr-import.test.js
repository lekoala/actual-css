import { afterEach, expect, test } from "bun:test";
import { cleanupDOM } from "./helpers/dom.js";

let importId = 0;

afterEach(() => {
  cleanupDOM();
});

test("javascript modules import without a DOM", async () => {
  cleanupDOM();

  const modules = [
    "index",
    "full",
    "context-menu",
    "dialog",
    "dismiss",
    "enhance",
    "filter",
    "floating",
    "flyout",
    "input",
    "mask",
    "scrollspy",
    "status",
    "surface",
    "validation",
    "tab",
    "tooltip",
  ];

  for (const module of modules) {
    await import(`../src/js/${module}.js?ssr=${++importId}`);
  }

  expect(globalThis.document).toBeUndefined();
});
