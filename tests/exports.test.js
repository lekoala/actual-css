import { expect, test } from "bun:test";

const PUBLIC_EXPORTS = {
  enhance: ["default", "enhancementSelector", "hasEnhancement", "registerEnhancement"],
  events: ["EVENTS"],
  floating: ["autoUpdate", "reposition", "repositionAt"],
  focus: ["isElementVisible", "getFocusable", "focusFirstDescendant"],
  keys: ["firstItem", "lastItem", "nextItem", "itemForKey"],
  menu: ["getMenuItems", "hasMenuItems", "hasMenuItem", "focusFirstMenuItem", "focusLastMenuItem", "onMenuKeydown", "connectMenu"],
  surface: ["isSurfaceOpen", "prepareSurface", "openSurface", "closeSurface", "disconnectSurface", "registerEscapeDismissal"],
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

const REMAINING_MODULES = [
  "command",
  "context-menu",
  "dialog",
  "dismiss",
  "filter",
  "flyout",
  "input",
  "mask",
  "password",
  "scrollspy",
  "selectors",
  "tab",
  "tooltip",
  "validation",
  "status",
];

for (const subpath of REMAINING_MODULES) {
  test(`actual-css/js/${subpath} resolves`, async () => {
    const mod = await import(`actual-css/js/${subpath}`);
    expect(mod).toBeDefined();
    expect(typeof mod).toBe("object");
  });
}
