import { afterEach, expect, test } from "bun:test";
import { cleanupDOM } from "./helpers/dom.js";

let importId = 0;

afterEach(() => {
  cleanupDOM();
});

test("javascript modules import without a DOM", async () => {
  cleanupDOM();

  const modules = [
    "context-menu",
    "dialog",
    "floating",
    "flyout",
    "inputmode",
    "mask",
    "scrollspy",
    "surface",
    "tab",
    "tooltip",
  ];

  for (const module of modules) {
    await import(`../src/js/${module}.js?ssr=${++importId}`);
  }

  expect(globalThis.document).toBeUndefined();
});
