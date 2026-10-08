/*
 * Real-browser soft-variant contract, driven over Bun.WebView.
 *
 * Two recipes share the soft ink. Badge, alert and soft button paint a
 * translucent intent tint; the shared .soft (card, navbar, app-nav, chat) an
 * opaque mix of --surface with --intent. The opaque mix depends on how it
 * treats a surface carrying chroma of its own. No shipped preset can exercise
 * that: the default light surface is pure white, and the tinted ones sit below
 * the chroma where a polar mix starts rotating hue toward the surface. Past
 * that point the polar response is a cliff — a theme nudging its surface tint
 * up sees soft secondary swing 116 degrees into green — while a rectangular
 * mix stays continuous.
 *
 * So this fixture pins a surface just above that threshold, behind vivid and
 * light intents, and asserts what the string-level @sync check cannot see:
 *
 *   1. a soft surface keeps its intent's hue instead of the surface's;
 *   2. --soft-fg-mix rebates soft ink toward --text far enough to stay legible,
 *      and is a byte-exact no-op at its 100% default;
 *   3. badge, alert, and button resolve to the same soft treatment at runtime;
 *   4. the tint stays translucent and the zone recipe opaque.
 *
 * Colors are read through RASTERIZE, so the assertions compare sRGB bytes. A
 * translucent fill is composited over the surface it sits on before any
 * contrast or hue is measured: that is the color the page shows.
 */
import { expect, test } from "bun:test";
import { browserAvailable, fixtureUrl, withBrowserPage } from "../../scripts/utils/browser.js";
import { composite, contrast, hueDistance, oklch, RASTERIZE } from "../../src/tooling/color.js";

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
          card: { secondary: read("#card-soft-secondary"), danger: read("#card-soft-danger") },
          bare: read("#badge-bare"),
          raw: { primary: read("#raw-badge-primary"), danger: read("#raw-badge-danger") },
          plain: {
            surface: norm(style("#plain").backgroundColor),
            primary: read("#plain-badge-primary"),
            danger: read("#plain-badge-danger"),
            bare: read("#plain-badge-bare"),
            card: read("#plain-card-primary"),
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

      // What the page shows: the tint over the theme surface, the ink over that.
      const shown = ({ bg, fg }, surface) => {
        const fill = composite(bg, surface);
        return { bg: fill, fg: composite(fg, fill) };
      };

      for (const intent of INTENTS) {
        const soft = snapshot.badge[intent];
        const raw = snapshot.intent[intent];
        const seen = shown(soft, snapshot.surface);

        // 1. The soft surface carries the intent hue, not the surface hue.
        // Interpolating in polar form drifts 116 degrees on secondary here (35
        // on success, 50 on danger) and turns the soft blue badge green. The
        // tint is mixed with transparent, so its own hue is the intent's; the
        // rim is set by this theme (--soft-border-mix: 25%).
        expect(hueDrift(raw, soft.bg)).toBeLessThan(20);
        expect(hueDrift(raw, soft.border)).toBeLessThan(20);

        // 2. Soft ink stays legible on the tint over the theme surface.
        expect(contrast(seen.fg, seen.bg)).toBeGreaterThanOrEqual(4.5);

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

      // 4. The zone recipe (.card.soft) is an opaque mix, and that mix is the
      // one the polar cliff threatens: it must keep the intent hue too.
      for (const intent of ["secondary", "danger"]) {
        const card = snapshot.card[intent];
        expect(card.bg[3]).toBe(255);
        expect(hueDrift(snapshot.intent[intent], card.bg)).toBeLessThan(20);
        expect(hueDrift(snapshot.intent[intent], card.border)).toBeLessThan(20);
        expect(contrast(card.fg, card.bg)).toBeGreaterThanOrEqual(4.5);
        // Same ink as the tint: both recipes read the soft-ink block.
        expect(card.fg).toEqual(snapshot.badge[intent].fg);
      }

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
      for (const pair of [snapshot.plain.primary, snapshot.plain.danger]) {
        const seen = shown(pair, snapshot.plain.surface);
        expect(contrast(seen.fg, seen.bg)).toBeGreaterThanOrEqual(4.5);
      }

      // Without --soft-border-mix the tint draws no rim, and the zone recipe
      // keeps its tinted, opaque one: the hook's absence is each recipe's
      // own default (tokens.css).
      expect(snapshot.plain.primary.bg[3]).toBeLessThan(255);
      expect(snapshot.plain.primary.border[3]).toBe(0);
      expect(snapshot.plain.card.bg[3]).toBe(255);
      expect(snapshot.plain.card.border[3]).toBe(255);
      expect(snapshot.plain.card.border).not.toEqual(snapshot.plain.card.bg);
    },
    { artifactName: "soft-recipe" },
  );
});

it("default theme soft contract clears 4.5 on rest and hover, on every surface, light and dark", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      // Force a real :hover on the soft buttons (see surface-context.test.js).
      await view.cdp("DOM.enable");
      await view.cdp("CSS.enable");
      const { root } = await view.cdp("DOM.getDocument", { depth: -1 });
      const { nodeIds } = await view.cdp("DOM.querySelectorAll", {
        nodeId: root.nodeId,
        selector: "[id^=contract] [data-hover]",
      });
      for (const nodeId of nodeIds) {
        await view.cdp("CSS.forcePseudoState", { nodeId, forcedPseudoClasses: ["hover"] });
      }

      const surfaces = await view.evaluate(`(() => {
        const norm = ${RASTERIZE};
        const cs = (el) => getComputedStyle(el);
        return [...document.querySelectorAll("[id^=contract] [data-surface]")].map((surface) => {
          const pairs = {};
          for (const badge of surface.querySelectorAll("[data-badge]")) {
            const intent = badge.dataset.badge;
            pairs[intent] = {
              fg: norm(cs(badge).color),
              rest: norm(cs(badge).backgroundColor),
              hover: norm(cs(surface.querySelector('[data-hover="' + intent + '"]')).backgroundColor),
            };
          }
          return {
            label: surface.parentElement.id + " " + surface.dataset.surface,
            backdrop: norm(cs(surface).backgroundColor),
            pairs,
          };
        });
      })()`);

      expect(surfaces).toHaveLength(6);
      for (const { label, backdrop, pairs } of surfaces) {
        for (const intent of INTENTS) {
          const { fg, rest, hover } = pairs[intent];
          // The soft ink must clear the ratio over BOTH fills, each composited
          // over the surface it sits on: the hover fill is usually binding.
          for (const fill of [rest, hover]) {
            const bg = composite(fill, backdrop);
            const ratio = contrast(composite(fg, bg), bg);
            if (ratio < 4.5) console.error(`${label} ${intent}: ${ratio.toFixed(2)}`);
            expect(ratio).toBeGreaterThanOrEqual(4.5);
          }
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
