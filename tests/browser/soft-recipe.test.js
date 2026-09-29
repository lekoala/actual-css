/*
 * Real-browser soft-variant contract, driven over Bun.WebView.
 *
 * The recipe mixes --surface with --intent, so its correctness depends on how
 * the mix treats a surface carrying chroma of its own. No shipped preset can
 * exercise that: the default light surface is pure white, and the tinted ones
 * sit below the chroma where a polar mix starts rotating hue toward the
 * surface. Past that point the polar response is a cliff — a theme nudging its
 * surface tint up sees soft secondary swing 116 degrees into green — while a
 * rectangular mix stays continuous.
 *
 * So this fixture pins a surface just above that threshold, behind vivid and
 * light intents, and asserts three things the string-level @sync check cannot
 * see:
 *
 *   1. a soft surface keeps its intent's hue instead of the surface's;
 *   2. --soft-fg-mix rebates soft ink toward --text far enough to stay legible,
 *      and is a byte-exact no-op at its 100% default;
 *   3. badge, alert, and button resolve to the same soft treatment at runtime.
 *
 * Colors are read through RASTERIZE, so the assertions compare sRGB bytes.
 */
import { expect, test } from "bun:test";
import { browserAvailable, fixtureUrl, withBrowserPage } from "../../scripts/utils/browser.js";
import { contrast, hueDistance, oklch, RASTERIZE } from "../../scripts/utils/color.js";

const FIXTURE = "tests/browser/soft-recipe.html";
const TIMEOUT = 60_000;

const baseTest = (await browserAvailable()) ? test : test.skip;
const it = (name, run) => baseTest(name, run, TIMEOUT);

/* Shortest hue arc between two colors, in degrees. */
const hueDrift = (from, to) => hueDistance(oklch(from).h, oklch(to).h);

const INTENTS = ["primary", "secondary", "success", "warning", "danger", "neutral"];

it("soft variant contract over a chromatic surface", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      const snapshot = await view.evaluate(`(() => {
        const norm = ${RASTERIZE};
        const style = (sel) => getComputedStyle(document.querySelector(sel));
        const read = (sel) => {
          const s = style(sel);
          return {
            bg: norm(s.backgroundColor),
            fg: norm(s.color),
            border: norm(s.borderTopColor),
          };
        };
        const ink = (sel) => norm(style(sel).color);
        return {
          surface: norm(style("#ref-surface").backgroundColor),
          text: ink("#ref-text"),
          intent: {
            primary: ink("#ref-primary"),
            secondary: ink("#ref-secondary"),
            success: ink("#ref-success"),
            warning: ink("#ref-warning"),
            danger: ink("#ref-danger"),
            neutral: ink("#ref-neutral"),
          },
          badge: {
            primary: read("#badge-primary"),
            secondary: read("#badge-secondary"),
            success: read("#badge-success"),
            warning: read("#badge-warning"),
            danger: read("#badge-danger"),
            neutral: read("#badge-neutral"),
          },
          alert: { danger: read("#alert-danger"), secondary: read("#alert-secondary") },
          alertSoft: { primary: read("#alert-soft-primary"), danger: read("#alert-soft-danger") },
          badgeSoft: { primary: read("#badge-soft-primary"), danger: read("#badge-soft-danger") },
          btn: { primary: read("#btn-primary"), secondary: read("#btn-secondary") },
          bare: read("#badge-bare"),
          raw: { primary: read("#raw-badge-primary"), danger: read("#raw-badge-danger") },
          plain: {
            primary: read("#plain-badge-primary"),
            danger: read("#plain-badge-danger"),
            bare: read("#plain-badge-bare"),
            intentPrimary: ink("#plain-ref-primary"),
            intentDanger: ink("#plain-ref-danger"),
            text: ink("#plain-ref-text"),
          },
        };
      })()`);

      // The fixture only proves anything above the chroma where a polar mix
      // starts letting the surface hue win. Below it — every shipped preset —
      // oklch and oklab agree and this file would assert nothing.
      expect(oklch(snapshot.surface).C).toBeGreaterThan(0.02);

      for (const intent of INTENTS) {
        const soft = snapshot.badge[intent];
        const raw = snapshot.intent[intent];

        // 1. The soft surface carries the intent hue, not the surface hue.
        // Interpolating in polar form drifts 116 degrees on secondary here (35
        // on success, 50 on danger) and turns the soft blue badge green.
        expect(hueDrift(raw, soft.bg)).toBeLessThan(20);
        expect(hueDrift(raw, soft.border)).toBeLessThan(20);

        // 2. Soft ink stays legible on the surface the same recipe generated.
        expect(contrast(soft.fg, soft.bg)).toBeGreaterThanOrEqual(4.5);

        // A --soft-fg-mix below 100% must actually move the ink off raw intent.
        // Neutral is the fixture's near-black text, so rebating toward --text
        // cannot change it — the move is only meaningful for chromatic intents.
        if (intent !== "neutral") expect(soft.fg).not.toEqual(raw);
      }

      // 3. The three synced blocks agree at runtime, not merely as text.
      expect(snapshot.alert.danger.bg).toEqual(snapshot.badge.danger.bg);
      expect(snapshot.alert.danger.fg).toEqual(snapshot.badge.danger.fg);
      expect(snapshot.alert.secondary.bg).toEqual(snapshot.badge.secondary.bg);
      expect(snapshot.alert.secondary.fg).toEqual(snapshot.badge.secondary.fg);
      expect(snapshot.btn.primary.bg).toEqual(snapshot.badge.primary.bg);
      expect(snapshot.btn.primary.fg).toEqual(snapshot.badge.primary.fg);
      expect(snapshot.btn.secondary.fg).toEqual(snapshot.badge.secondary.fg);

      // 3b. Explicit .soft + intent on an alert/badge is a no-op against the
      // soft-by-default treatment: it must resolve to the same soft intent
      // tint, never collapse to a neutral subtle surface (item: alert.soft
      // must keep the intent).
      expect(snapshot.alertSoft.primary.bg).toEqual(snapshot.badge.primary.bg);
      expect(snapshot.alertSoft.primary.fg).toEqual(snapshot.badge.primary.fg);
      expect(snapshot.alertSoft.danger.bg).toEqual(snapshot.alert.danger.bg);
      expect(snapshot.alertSoft.danger.fg).toEqual(snapshot.alert.danger.fg);
      expect(snapshot.badgeSoft.primary.bg).toEqual(snapshot.badge.primary.bg);
      expect(snapshot.badgeSoft.primary.fg).toEqual(snapshot.badge.primary.fg);
      expect(snapshot.badgeSoft.danger.bg).toEqual(snapshot.badge.danger.bg);
      expect(snapshot.badgeSoft.danger.fg).toEqual(snapshot.badge.danger.fg);
      // ...and each stays on the intent hue, not a neutral/surface grey.
      expect(hueDrift(snapshot.intent.primary, snapshot.alertSoft.primary.bg)).toBeLessThan(20);
      expect(hueDrift(snapshot.intent.danger, snapshot.alertSoft.danger.bg)).toBeLessThan(20);

      // Without an intent the recipe collapses to plain text ink, never a mix.
      expect(snapshot.bare.fg).toEqual(snapshot.text);

      // --soft-fg-mix: 100% resolves to exactly the raw intent, so the token
      // defaults to a no-op and existing themes keep their ink untouched.
      expect(snapshot.raw.primary.fg).toEqual(snapshot.intent.primary);
      expect(snapshot.raw.danger.fg).toEqual(snapshot.intent.danger);

      // On the untouched default theme: intents without a soft-fg hook keep the
      // raw intent (primary), while hooked intents rebate toward --text (danger
      // no longer equals its raw intent). The hook is the default palette's
      // deliberate contrast calibration, not recipe drift.
      expect(snapshot.plain.primary.fg).toEqual(snapshot.plain.intentPrimary);
      expect(snapshot.plain.danger.fg).not.toEqual(snapshot.plain.intentDanger);
      expect(snapshot.plain.bare.fg).toEqual(snapshot.plain.text);

      // And the default theme's own soft pairs stay legible.
      expect(contrast(snapshot.plain.primary.fg, snapshot.plain.primary.bg)).toBeGreaterThanOrEqual(
        4.5,
      );
      expect(contrast(snapshot.plain.danger.fg, snapshot.plain.danger.bg)).toBeGreaterThanOrEqual(
        4.5,
      );
    },
    { artifactName: "soft-recipe" },
  );
});

it("default theme soft contract clears 4.5 on rest and hover, light and dark", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      const readContract = (root) =>
        view.evaluate(`(() => {
          const norm = ${RASTERIZE};
          const ink = {};
          for (const el of document.querySelectorAll("#${root} [data-ink]"))
            ink[el.dataset.ink] = norm(getComputedStyle(el).color);
          const pair = (sel) => {
            const s = getComputedStyle(document.querySelector("#${root} " + sel));
            return { bg: norm(s.backgroundColor), fg: norm(s.color) };
          };
          const rest = {};
          for (const el of document.querySelectorAll("#${root} [data-badge]"))
            rest[el.dataset.badge] = pair("[data-badge='" + el.dataset.badge + "']");
          return { rest };
        })()`);

      for (const root of ["contract", "contract-dark"]) {
        const resting = await readContract(root);

        // Force a real :hover on the soft buttons (see surface-context.test.js).
        await view.cdp("DOM.enable");
        await view.cdp("CSS.enable");
        const { root: docRoot } = await view.cdp("DOM.getDocument");
        for (const intent of INTENTS) {
          const { nodeId } = await view.cdp("DOM.querySelector", {
            nodeId: docRoot.nodeId,
            selector: `#${root} [data-hover="${intent}"]`,
          });
          await view.cdp("CSS.forcePseudoState", { nodeId, forcedPseudoClasses: ["hover"] });
        }

        const hoveredBg = await view.evaluate(`(() => {
          const norm = ${RASTERIZE};
          const out = {};
          for (const el of document.querySelectorAll("#${root} [data-hover]"))
            out[el.dataset.hover] = norm(getComputedStyle(el).backgroundColor);
          return out;
        })()`);

        // The soft ink must clear the required ratio on BOTH surfaces the fill
        // reaches: the resting fill just carries more margin.
        for (const intent of INTENTS) {
          const fg = resting.rest[intent].fg;
          expect(contrast(fg, resting.rest[intent].bg)).toBeGreaterThanOrEqual(4.5);
          expect(contrast(fg, hoveredBg[intent])).toBeGreaterThanOrEqual(4.5);
        }
      }
    },
    { artifactName: "soft-recipe-contract" },
  );
});

/*
 * A custom theme must hand its soft ink to the --soft-fg-mix recipe wherever
 * the author put the attribute. The reset and the default palette's hooks both
 * match when data-theme sits on <html>, so a bare :root selector on the hooks
 * (0,1,0) silently beat the zero-specificity reset there and only there: the
 * same theme resolved a calibrated Ink & Terra ink on <html data-theme> and a
 * raw intent ink on <div data-theme>. Levelling both to zero specificity makes
 * source order decide, so this also pins the reset below the hooks.
 */
it("a custom theme resets the default soft hooks on <html> and on a nested island", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      const readings = await view.evaluate(`(() => {
        const style = document.createElement("style");
        style.textContent = '[data-theme="probe"] { color-scheme: light; --secondary: hsl(190 70% 38%); }';
        document.head.append(style);
        const hook = (el) =>
          getComputedStyle(el).getPropertyValue("--secondary-soft-fg").trim();

        const html = document.documentElement;
        const island = document.createElement("div");
        document.body.append(island);

        const bareRoot = hook(html);

        html.setAttribute("data-theme", "probe");
        const onHtml = hook(html);
        html.removeAttribute("data-theme");

        html.setAttribute("data-theme", "light");
        const onHtmlLight = hook(html);
        html.removeAttribute("data-theme");

        island.setAttribute("data-theme", "probe");
        const onIsland = hook(island);
        island.remove();

        return { bareRoot, onHtml, onIsland, onHtmlLight };
      })()`);

      // The untouched default theme keeps its calibrated hooks.
      expect(readings.bareRoot).not.toBe("");
      // The built-in light/dark boundaries are the default theme, not a custom one.
      expect(readings.onHtmlLight).toBe(readings.bareRoot);
      // A custom theme drops them, and both placements agree.
      expect(readings.onHtml).toBe("");
      expect(readings.onIsland).toBe("");
    },
    { artifactName: "soft-recipe-theme-reset" },
  );
});
