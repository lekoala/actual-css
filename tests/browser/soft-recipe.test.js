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
 * color-mix() results come back from getComputedStyle as oklab(), so the page
 * rasterizes every color through a 1x1 canvas first and the assertions work on
 * sRGB bytes.
 */
import { expect, test } from "bun:test";
import { browserAvailable, fixtureUrl, withBrowserPage } from "../../scripts/utils/browser.js";

const FIXTURE = "tests/browser/soft-recipe.html";
const TIMEOUT = 60_000;

const baseTest = (await browserAvailable()) ? test : test.skip;
const it = (name, run) => baseTest(name, run, TIMEOUT);

const parse = (value) => value.split(",").map((channel) => Number(channel) / 255);
const toLinear = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);

/* Oklab hue of an sRGB triplet, in degrees. */
const hue = (value) => {
  const [r, g, b] = parse(value).map(toLinear);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return ((Math.atan2(bb, a) * 180) / Math.PI + 360) % 360;
};

/* Oklab chroma of an sRGB triplet. */
const chroma = (value) => {
  const [r, g, b] = parse(value).map(toLinear);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return Math.hypot(
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  );
};

/* Shortest hue arc between two sRGB colors, in degrees. */
const hueDrift = (from, to) => {
  let delta = hue(to) - hue(from);
  if (delta > 180) delta -= 360;
  if (delta < -180) delta += 360;
  return Math.abs(delta);
};

const contrast = (a, b) => {
  const luminance = (value) => {
    const [r, g, bl] = parse(value).map(toLinear);
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [x, y] = [luminance(a), luminance(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};

const INTENTS = ["primary", "secondary", "success", "danger"];

it("soft variant contract over a chromatic surface", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      const snapshot = await view.evaluate(`(() => {
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = 1;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        // Rasterize so oklab() and rgb() computed values become comparable bytes.
        const norm = (value) => {
          ctx.clearRect(0, 0, 1, 1);
          ctx.fillStyle = value;
          ctx.fillRect(0, 0, 1, 1);
          const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
          return r + "," + g + "," + b;
        };
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
            danger: ink("#ref-danger"),
          },
          badge: {
            primary: read("#badge-primary"),
            secondary: read("#badge-secondary"),
            success: read("#badge-success"),
            danger: read("#badge-danger"),
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
      expect(chroma(snapshot.surface)).toBeGreaterThan(0.02);

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
        expect(soft.fg).not.toBe(raw);
      }

      // 3. The three synced blocks agree at runtime, not merely as text.
      expect(snapshot.alert.danger.bg).toBe(snapshot.badge.danger.bg);
      expect(snapshot.alert.danger.fg).toBe(snapshot.badge.danger.fg);
      expect(snapshot.alert.secondary.bg).toBe(snapshot.badge.secondary.bg);
      expect(snapshot.alert.secondary.fg).toBe(snapshot.badge.secondary.fg);
      expect(snapshot.btn.primary.bg).toBe(snapshot.badge.primary.bg);
      expect(snapshot.btn.primary.fg).toBe(snapshot.badge.primary.fg);
      expect(snapshot.btn.secondary.fg).toBe(snapshot.badge.secondary.fg);

      // 3b. Explicit .soft + intent on an alert/badge is a no-op against the
      // soft-by-default treatment: it must resolve to the same soft intent
      // tint, never collapse to a neutral subtle surface (item: alert.soft
      // must keep the intent).
      expect(snapshot.alertSoft.primary.bg).toBe(snapshot.badge.primary.bg);
      expect(snapshot.alertSoft.primary.fg).toBe(snapshot.badge.primary.fg);
      expect(snapshot.alertSoft.danger.bg).toBe(snapshot.alert.danger.bg);
      expect(snapshot.alertSoft.danger.fg).toBe(snapshot.alert.danger.fg);
      expect(snapshot.badgeSoft.primary.bg).toBe(snapshot.badge.primary.bg);
      expect(snapshot.badgeSoft.primary.fg).toBe(snapshot.badge.primary.fg);
      expect(snapshot.badgeSoft.danger.bg).toBe(snapshot.badge.danger.bg);
      expect(snapshot.badgeSoft.danger.fg).toBe(snapshot.badge.danger.fg);
      // ...and each stays on the intent hue, not a neutral/surface grey.
      expect(hueDrift(snapshot.intent.primary, snapshot.alertSoft.primary.bg)).toBeLessThan(20);
      expect(hueDrift(snapshot.intent.danger, snapshot.alertSoft.danger.bg)).toBeLessThan(20);

      // Without an intent the recipe collapses to plain text ink, never a mix.
      expect(snapshot.bare.fg).toBe(snapshot.text);

      // --soft-fg-mix: 100% resolves to exactly the raw intent, so the token
      // defaults to a no-op and existing themes keep their ink untouched.
      expect(snapshot.raw.primary.fg).toBe(snapshot.intent.primary);
      expect(snapshot.raw.danger.fg).toBe(snapshot.intent.danger);

      // Same guarantee on the untouched default theme, whose surface has no
      // chroma of its own.
      expect(snapshot.plain.primary.fg).toBe(snapshot.plain.intentPrimary);
      expect(snapshot.plain.danger.fg).toBe(snapshot.plain.intentDanger);
      expect(snapshot.plain.bare.fg).toBe(snapshot.plain.text);

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
