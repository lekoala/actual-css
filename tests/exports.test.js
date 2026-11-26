import { expect, test } from "bun:test";
import { publicJsExports } from "./helpers/package-exports.js";

// Review changes to this inventory as API changes. Keys mirror the JS subpaths
// of package.json#exports and values list exactly the public symbols at each
// subpath. An empty array marks an entry point imported for its side effects.
const JS_EXPORT_INVENTORY = {
  "./js": [],
  "./js/full": ["applyEnhancement", "enhance", "registerEnhancement"],
  "./js/dismiss": [],
  "./js/filter": [],
  "./js/flyout": [],
  "./js/mask": [],
  "./js/password": [],
  "./js/range": [],
  "./js/tab": [],
  "./js/in-view": [],
  "./js/enhance": ["default", "applyEnhancement", "registerEnhancement"],
  "./js/escape": ["registerEscapeDismissal"],
  "./js/events": ["EVENTS", "ACTUAL_EVENT_PREFIX"],
  "./js/focus": ["isElementVisible", "getFocusable", "nextTabStop", "focusFirstDescendant"],
  "./js/focus-group": ["connectFocusGroup"],
  "./js/keys": ["firstItem", "lastItem", "nextItem", "itemForKey", "shouldIgnoreKey"],
  "./js/menu": [
    "getMenuItems",
    "hasMenuItems",
    "hasMenuItem",
    "focusFirstMenuItem",
    "focusLastMenuItem",
    "onMenuKeydown",
    "connectMenu",
  ],
  "./js/surface": [
    "isSurfaceOpen",
    "prepareSurface",
    "openSurface",
    "closeSurface",
    "disconnectSurface",
    "retainSurface",
  ],
  "./js/command": ["targetFor", "commandSelector", "registerCommands"],
  "./js/context-menu": ["contextFor"],
  "./js/dialog": ["openDialog", "closeDialog", "requestDialogClose"],
  "./js/enhancement-loader": [
    "loadScript",
    "loadStyle",
    "loadEnhancement",
    "loadEnhancements",
    "watchEnhancementManifests",
    "loadResponse",
  ],
  "./js/input": ["selectionStart", "setCaret", "dispatchInput", "onTextInput"],
  "./js/parse-config": ["parseConfig"],
  "./js/scrollspy": ["refreshScrollspy"],
  "./js/selectors": ["CLASSES"],
  "./js/status": ["status"],
  "./js/tooltip": ["isTooltipVisible"],
  "./js/validation": ["FormValidator"],
  "./js/dirty": ["FormDirty"],
  "./js/ajax": [],
};

const specifierFor = (exportPath) => `actual-css${exportPath.slice(1)}`;

test("the inventory lists every public JS subpath, and only those", () => {
  expect(new Set(Object.keys(JS_EXPORT_INVENTORY))).toEqual(new Set(publicJsExports()));
});

for (const [exportPath, symbols] of Object.entries(JS_EXPORT_INVENTORY)) {
  const specifier = specifierFor(exportPath);

  test(`${specifier} exports exactly its inventory`, async () => {
    const mod = await import(specifier);
    expect(new Set(Object.keys(mod))).toEqual(new Set(symbols));
    for (const name of symbols) expect(mod[name]).toBeDefined();
  });
}
