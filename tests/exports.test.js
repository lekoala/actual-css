import { expect, test } from "bun:test";
import { publicJsExports } from "./helpers/package-exports.js";

// Inventory of the JS subpaths, not a stability promise. Adding an export (or
// a subpath) without updating this table fails the suite on purpose, so the
// triage stays visible — but inclusion here does NOT mean adopters may rely
// on the symbol. `__`-prefixed entries, ref-counting (`retainSurface`,
// `prepareSurface`), menu lookup internals (`getMenuItems`, `hasMenuItem(s)`,
// `onMenuKeydown`), `selectionStart`, and the `validation` default are
// internals slated for triage before 1.0.
const JS_EXPORT_INVENTORY = {
  enhance: [
    "default",
    "enhancementSelector",
    "hasEnhancement",
    "applyEnhancement",
    "registerEnhancement",
  ],
  escape: ["registerEscapeDismissal"],
  events: ["EVENTS", "ACTUAL_EVENT_PREFIX"],
  focus: ["isElementVisible", "getFocusable", "focusFirstDescendant"],
  "focus-group": ["connectFocusGroup"],
  keys: ["firstItem", "lastItem", "nextItem", "itemForKey", "shouldIgnoreKey"],
  menu: [
    "getMenuItems",
    "hasMenuItems",
    "hasMenuItem",
    "focusFirstMenuItem",
    "focusLastMenuItem",
    "onMenuKeydown",
    "connectMenu",
  ],
  surface: [
    "isSurfaceOpen",
    "prepareSurface",
    "openSurface",
    "closeSurface",
    "disconnectSurface",
    "retainSurface",
  ],
  command: ["targetFor", "commandSelector", "registerCommands"],
  "context-menu": ["contextFor"],
  dialog: ["openDialog", "closeDialog", "requestDialogClose"],
  "enhancement-loader": [
    "loadScript",
    "loadStyle",
    "loadEnhancement",
    "loadEnhancements",
    "watchEnhancementManifests",
    "loadResponse",
    "__setModuleImporter",
    "__reset",
  ],
  input: ["selectionStart", "setCaret", "dispatchInput", "onTextInput"],
  "parse-config": ["default", "parseConfig"],
  scrollspy: ["refreshScrollspy"],
  selectors: ["CLASSES"],
  status: ["default", "status"],
  tooltip: ["isTooltipVisible"],
  validation: ["default", "FormValidator"],
};

for (const exportPath of publicJsExports()) {
  const specifier = `actual-css${exportPath.slice(1)}`;
  test(`${specifier} resolves and exports a module`, async () => {
    const mod = await import(specifier);
    expect(mod).toBeDefined();
    expect(typeof mod).toBe("object");
  });
}

for (const [subpath, symbols] of Object.entries(JS_EXPORT_INVENTORY)) {
  for (const name of symbols) {
    test(`actual-css/js/${subpath} exports ${name}`, async () => {
      const mod = await import(`actual-css/js/${subpath}`);
      expect(mod).toHaveProperty(name);
      const value = name === "default" ? mod.default : mod[name];
      expect(value).toBeDefined();
    });
  }

  test(`actual-css/js/${subpath} matches the inventory`, async () => {
    const mod = await import(`actual-css/js/${subpath}`);
    expect(new Set(Object.keys(mod))).toEqual(new Set(symbols));
  });
}
