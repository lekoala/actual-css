import { expect, test } from "bun:test";

const PUBLIC_SUBPATHS = [
  "enhance",
  "events",
  "floating",
  "focus",
  "keys",
  "menu",
  "surface",
];

for (const subpath of PUBLIC_SUBPATHS) {
  test(`actual-css/js/${subpath} resolves and exports a module`, async () => {
    // Self-reference through the package — exercises the exports map.
    const mod = await import(`actual-css/js/${subpath}`);
    expect(mod).toBeDefined();
    expect(typeof mod).toBe("object");
  });
}
