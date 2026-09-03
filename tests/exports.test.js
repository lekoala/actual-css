import { expect, test } from "bun:test";
import { publicJsExports } from "./helpers/package-exports.js";

const PUBLIC_EXPORTS = {
  enhance: ["default", "enhancementSelector", "hasEnhancement", "registerEnhancement"],
  escape: ["registerEscapeDismissal"],
  events: ["EVENTS"],
  floating: ["autoUpdate", "reposition", "repositionAt"],
  focus: ["isElementVisible", "getFocusable", "focusFirstDescendant"],
  "focus-group": ["connectFocusGroup"],
  keys: ["firstItem", "lastItem", "nextItem", "itemForKey"],
  menu: [
    "getMenuItems",
    "hasMenuItems",
    "hasMenuItem",
    "focusFirstMenuItem",
    "focusLastMenuItem",
    "onMenuKeydown",
    "connectMenu",
  ],
  surface: ["isSurfaceOpen", "prepareSurface", "openSurface", "closeSurface", "disconnectSurface"],
};

for (const exportPath of publicJsExports()) {
  const specifier = `actual-css${exportPath.slice(1)}`;
  test(`${specifier} resolves and exports a module`, async () => {
    const mod = await import(specifier);
    expect(mod).toBeDefined();
    expect(typeof mod).toBe("object");
  });
}

for (const [subpath, symbols] of Object.entries(PUBLIC_EXPORTS)) {
  for (const name of symbols) {
    test(`actual-css/js/${subpath} exports ${name}`, async () => {
      const mod = await import(`actual-css/js/${subpath}`);
      expect(mod).toHaveProperty(name);
      const value = name === "default" ? mod.default : mod[name];
      expect(value).toBeDefined();
    });
  }
}
