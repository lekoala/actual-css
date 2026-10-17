import { expect, test } from "bun:test";
import {
  browserAvailable,
  fixtureUrl,
  forceStates,
  setViewport,
  waitForBrowser,
  withBrowserPage,
} from "../../scripts/utils/browser.js";

const FIXTURE = "tests/browser/neo-brutalist.html";
const baseTest = (await browserAvailable()) ? test : test.skip;
const it = (name, run) => baseTest(name, run, 60_000);

function read(view, id, pseudo = null) {
  return view.evaluate(`(() => {
    const el = document.getElementById(${JSON.stringify(id)});
    const s = getComputedStyle(el, ${JSON.stringify(pseudo)});
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    const luminance = (color) => {
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, 1, 1);
      return [...ctx.getImageData(0, 0, 1, 1).data].slice(0, 3).reduce((sum, byte, i) => {
        const c = byte / 255;
        return sum + (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4) * [0.2126, 0.7152, 0.0722][i];
      }, 0);
    };
    const ink = luminance(${pseudo ? "s.backgroundColor" : "s.color"});
    const fill = luminance(${pseudo ? "getComputedStyle(el).backgroundColor" : "s.backgroundColor"});
    return {
      ink: s.color, fill: s.backgroundColor, border: s.borderTopColor,
      shadow: s.boxShadow, transform: s.transform,
      contrast: (Math.max(ink, fill) + 0.05) / (Math.min(ink, fill) + 0.05),
      width: s.width, content: s.content,
      fillLuminance: fill,
    };
  })()`);
}

const settled = (view) => waitForBrowser(view, "document.getAnimations().length === 0");

it("neo-brutalist solid card hover preserves readable intent and heading ink", async () => {
  await withBrowserPage(fixtureUrl(FIXTURE), async (view) => {
    for (const id of ["solid-card", "danger-card"]) {
      const rest = await read(view, id);
      await forceStates(view, { [`#${id}`]: ["hover"] });
      await settled(view);
      const hover = await read(view, id);
      expect(hover.fill).not.toBe(rest.fill);
      expect(hover.ink).toBe(rest.ink);
      expect(hover.shadow).toBe(rest.shadow);
      expect(hover.contrast).toBeGreaterThanOrEqual(4.5);
      expect(
        await view.evaluate(`getComputedStyle(document.querySelector("#${id} h2")).color`),
      ).toBe(hover.ink);
    }
    const plain = await read(view, "plain-card");
    await forceStates(view, { "#plain-card": ["hover"] });
    await settled(view);
    expect((await read(view, "plain-card")).fill).not.toBe(plain.fill);
  });
});

it("neo-brutalist transparent buttons follow surrounding ink and chips use selected ink", async () => {
  await withBrowserPage(fixtureUrl(FIXTURE), async (view) => {
    const card = await read(view, "dark-card");
    for (const id of ["ghost-solid", "link-solid", "outline-solid"]) {
      expect((await read(view, id)).ink).toBe(card.ink);
      await forceStates(view, { [`#${id}`]: ["hover"] });
      await settled(view);
      expect((await read(view, id)).ink).toBe(card.ink);
    }
    const surface = await read(view, "surface-solid");
    expect(surface.ink).not.toBe(card.ink);
    expect(surface.contrast).toBeGreaterThanOrEqual(4.5);
    for (const id of ["chip", "chip-primary", "chip-secondary"]) {
      expect((await read(view, id, "::after")).contrast).toBeGreaterThanOrEqual(4.5);
    }
    for (const id of ["light-chip", "dark-chip"]) {
      // An unset selected-ink hook must retain explicit intents in standard themes.
      const expected = await view.evaluate(`(() => {
        const el = document.createElement("span");
        el.style.color = "var(--secondary)";
        document.getElementById("${id}").append(el);
        const color = getComputedStyle(el).color;
        el.remove();
        return color;
      })()`);
      expect((await read(view, id, "::after")).fill).toBe(expected);
    }
  });
});

it("neo-brutalist joined faces respond without moving and disabled groups lie flat", async () => {
  await withBrowserPage(fixtureUrl(FIXTURE), async (view) => {
    for (const id of ["joined-button", "joined-fill", "joined-soft"]) {
      const rest = await read(view, id);
      await forceStates(view, { [`#${id}`]: ["hover"] });
      await settled(view);
      const hover = await read(view, id);
      expect(hover.fill !== rest.fill || hover.shadow !== rest.shadow).toBe(true);
      expect(hover.transform).toBe("none");
      await forceStates(view, { [`#${id}`]: ["active"] });
      await settled(view);
      expect((await read(view, id)).transform).toBe("none");
    }
    for (const id of ["ghost", "link"]) {
      await forceStates(view, { [`#${id}`]: ["active"] });
      await settled(view);
      expect((await read(view, id)).transform).toBe("none");
    }
    for (const id of ["disabled-join", "fieldset-join"]) {
      expect((await read(view, id)).shadow).toBe("none");
    }
    for (const width of [360, 1100]) {
      await setViewport(view, { width });
      await settled(view);
      const groups = await view.evaluate(`
        ["joined", "mixed-join"].map(id => {
          const el = document.getElementById(id);
          return { right: el.getBoundingClientRect().right,
            face: el.lastElementChild.getBoundingClientRect().right,
            shadow: getComputedStyle(el).boxShadow };
        })`);
      for (const group of groups) {
        expect(group.right).toBeCloseTo(group.face, 1);
        expect(group.shadow).not.toBe("none");
      }
    }
    await forceStates(view, { "#lift": ["hover"] });
    await settled(view);
    expect((await read(view, "lift")).transform).toBe("matrix(1, 0, 0, 1, -2, -2)");
    await forceStates(view, { "#lift": ["active"] });
    await settled(view);
    expect((await read(view, "lift")).transform).toBe("matrix(1, 0, 0, 1, 3, 3)");
  });
});

it("neo-brutalist honours component hooks, validation and shared resting field fills", async () => {
  await withBrowserPage(fixtureUrl(FIXTURE), async (view) => {
    const themeBorder = (await read(view, "field")).border;
    expect((await read(view, "choice-default")).border).toBe(themeBorder);
    await forceStates(view, { "#choice-default": ["hover"] });
    await settled(view);
    expect((await read(view, "choice-default")).border).toBe(themeBorder);
    await view.evaluate('document.querySelector("#choice-default input").click()');
    await settled(view);
    expect((await read(view, "choice-default")).border).toBe(themeBorder);
    expect((await read(view, "choice")).border).toBe("rgb(100, 0, 150)");
    await forceStates(view, { "#choice-checked": ["hover"] });
    await settled(view);
    expect((await read(view, "choice-checked")).border).toBe("rgb(100, 0, 150)");
    expect((await read(view, "choice-invalid")).border).toBe("rgb(180, 0, 0)");
    const marker = await view.evaluate(`(() => {
      const s = getComputedStyle(document.querySelector("#accordion summary"), "::after");
      return { width: s.width, transform: s.transform };
    })()`);
    expect(marker.width).toBe("32px");
    expect(marker.transform).toBe("matrix(0, 1, -1, 0, 0, 0)");
    const field = await read(view, "field");
    expect(field.fillLuminance).toBe((await read(view, "bridge")).fillLuminance);
    expect((await read(view, "field-invalid")).fill).not.toBe(field.fill);
    expect((await read(view, "field-disabled")).fill).not.toBe(field.fill);
    expect((await read(view, "field-readonly")).fill).not.toBe(field.fill);
    expect((await read(view, "regional-field")).fill).toBe(
      (await read(view, "regional-bridge")).fill,
    );
    await forceStates(view, { "#flat": ["hover"] });
    await settled(view);
    // Trap: none is not a shadow-list item and would erase the overlay too.
    expect((await read(view, "flat")).shadow).toContain("999px inset");
  });
});

it("neo-brutalist chips retain visible checks in forced colors", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      for (const id of ["chip", "chip-primary", "chip-secondary"]) {
        expect((await read(view, id, "::before")).content).toBe("none");
        expect((await read(view, id, "::after")).contrast).toBeGreaterThanOrEqual(4.5);
      }
    },
    { mediaFeatures: [{ name: "forced-colors", value: "active" }] },
  );
});
