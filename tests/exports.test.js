import { expect, test } from "bun:test";
import { publicJsExports } from "./helpers/package-exports.js";

// Inventory of the JS subpaths, not a stability promise. Keys mirror the JS
// subpaths of package.json#exports and values list each module's exact
// exports, so adding an export or a subpath without updating this table fails
// the suite on purpose and the triage stays visible — but inclusion here does
// NOT mean adopters may rely on the symbol. `[]` marks a self-registering
// module with no exports. `__`-prefixed entries, ref-counting
// (`retainSurface`, `prepareSurface`), menu lookup internals (`getMenuItems`,
// `hasMenuItem(s)`, `onMenuKeydown`), `selectionStart`, and the `validation`
// default are internals slated for triage before 1.0.
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
  "./js/enhance": ["default", "applyEnhancement", "registerEnhancement"],
  "./js/escape": ["registerEscapeDismissal"],
  "./js/events": ["EVENTS", "ACTUAL_EVENT_PREFIX"],
  "./js/focus": ["isElementVisible", "getFocusable", "focusFirstDescendant"],
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
    "__setModuleImporter",
    "__reset",
  ],
  "./js/input": ["selectionStart", "setCaret", "dispatchInput", "onTextInput"],
  "./js/parse-config": ["default", "parseConfig"],
  "./js/scrollspy": ["refreshScrollspy"],
  "./js/selectors": ["CLASSES"],
  "./js/status": ["default", "status"],
  "./js/tooltip": ["isTooltipVisible"],
  "./js/validation": ["default", "FormValidator"],
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
