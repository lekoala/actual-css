import { expect, test } from "bun:test";

const PUBLIC_EXPORTS = {
  enhance: ["default", "enhancementSelector", "hasEnhancement", "registerEnhancement"],
  events: ["EVENTS"],
  floating: ["track", "reposition", "repositionAt"],
  focus: ["isElementVisible", "getFocusable", "focusFirstDescendant"],
  keys: ["firstItem", "lastItem", "nextItem"],
  menu: ["getMenuItems", "hasMenuItems", "hasMenuItem", "focusFirstMenuItem", "focusLastMenuItem", "onMenuKeydown", "connectMenu"],
  surface: ["isSurfaceOpen", "prepareSurface", "openSurface", "closeSurface", "disconnectSurface"],
};

for (const [subpath, symbols] of Object.entries(PUBLIC_EXPORTS)) {
  test(`actual-css/js/${subpath} resolves and exports a module`, async () => {
    const mod = await import(`actual-css/js/${subpath}`);
    expect(mod).toBeDefined();
    expect(typeof mod).toBe("object");
  });

  for (const name of symbols) {
    test(`actual-css/js/${subpath} exports ${name}`, async () => {
      const mod = await import(`actual-css/js/${subpath}`);
      expect(mod).toHaveProperty(name);
      const value = name === "default" ? mod.default : mod[name];
      expect(value).toBeDefined();
    });
  }
}
