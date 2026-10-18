/*
 * Real-browser badge dismiss target contract, driven over Bun.WebView.
 *
 * WCAG 2.2 2.5.8 floors pointer targets at 24 CSS px. The visible .close is a
 * disc inside the pill, the avatar's mirror, so it is smaller than 24px on the
 * default and .sm badges. The target is the hit area, not the paint: a
 * transparent pseudo-element extends it to the floor, which only hit testing
 * can see.
 */
import { expect, test } from "bun:test";
import { browserAvailable, fixtureUrl, withBrowserPage } from "../../scripts/utils/browser.js";

const FIXTURE = "tests/browser/badge-target.html";
const TIMEOUT = 60_000;

const baseTest = (await browserAvailable()) ? test : test.skip;
const it = (name, run) => baseTest(name, run, TIMEOUT);

it("the dismiss disc sits inside the pill while its hit target keeps 24x24", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      const result = await view.evaluate(`(() => {
        const measure = (id) => {
          const badge = document.getElementById(id).getBoundingClientRect();
          const button = document.querySelector("#" + id + " > button");
          const disc = button.getBoundingClientRect();
          const cx = disc.left + disc.width / 2;
          const cy = disc.top + disc.height / 2;
          // Just inside the corners of a 24px square centred on the disc.
          const reach = 11.5;
          const corners = [[-1, -1], [1, -1], [-1, 1], [1, 1]];
          return {
            badge: badge.height,
            disc: disc.width,
            top: disc.top - badge.top,
            bottom: badge.bottom - disc.bottom,
            end: badge.right - disc.right,
            hits: corners.every(([dx, dy]) => {
              const hit = document.elementFromPoint(cx + dx * reach, cy + dy * reach);
              return hit === button;
            }),
          };
        };
        return {
          sm: measure("sm"),
          def: measure("default"),
          lg: measure("lg"),
          custom: measure("custom"),
        };
      })()`);

      for (const key of ["sm", "def", "lg", "custom"]) {
        const chip = result[key];
        // The disc never inflates the pill and keeps one inset on its edges…
        expect(chip.disc).toBeLessThan(chip.badge);
        expect(Math.abs(chip.top - chip.bottom)).toBeLessThanOrEqual(0.5);
        expect(Math.abs(chip.end - chip.top)).toBeLessThanOrEqual(0.5);
        // …and the hit area still covers the 24px floor around it.
        expect(chip.hits).toBe(true);
      }
      // A small badge has a small disc: only the hit area meets the floor.
      expect(result.sm.disc).toBeLessThan(24);
      expect(result.sm.badge).toBeLessThan(24);
    },
    { artifactName: "badge-target" },
  );
});

it("badge size scales type and icons while density geometry stays inert", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      const result = await view.evaluate(`(() => {
        const measure = (id) => {
          const el = document.getElementById(id);
          const rect = el.getBoundingClientRect();
          const icon = el.querySelector('[aria-hidden="true"]');
          return {
            font: parseFloat(getComputedStyle(el).fontSize),
            height: rect.height,
            icon: icon ? icon.getBoundingClientRect().width : null,
          };
        };
        return {
          sm: measure("sm"),
          def: measure("default"),
          lg: measure("lg"),
          compact: measure("compact"),
          densityDefault: measure("density-default"),
          spacious: measure("spacious"),
        };
      })()`);

      expect(result.sm.font).toBe(13);
      expect(result.def.font).toBe(14);
      expect(result.lg.font).toBe(16);
      expect(result.sm.icon).toBe(result.sm.font);
      expect(result.def.icon).toBe(result.def.font);
      expect(result.lg.icon).toBe(result.lg.font);

      expect(result.compact.font).toBe(result.densityDefault.font);
      expect(result.densityDefault.font).toBe(result.spacious.font);
      expect(result.compact.icon).toBe(result.compact.font);
      expect(result.densityDefault.icon).toBe(result.densityDefault.font);
      expect(result.spacious.icon).toBe(result.spacious.font);
      // Badge geometry is intrinsic: density contexts leave it identical.
      expect(result.compact.height).toBe(result.densityDefault.height);
      expect(result.densityDefault.height).toBe(result.spacious.height);
    },
    { artifactName: "badge-size-density" },
  );
});

it("a leading avatar follows the badge size at an even inset", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      const result = await view.evaluate(`(() => {
        const measure = (id) => {
          const badge = document.getElementById(id).getBoundingClientRect();
          const avatar = document.querySelector("#" + id + " > .avatar").getBoundingClientRect();
          return {
            badge: badge.height,
            avatar: avatar.width,
            start: avatar.left - badge.left,
            top: avatar.top - badge.top,
            bottom: badge.bottom - avatar.bottom,
          };
        };
        return {
          sm: measure("avatar-sm"),
          def: measure("avatar-default"),
          lg: measure("avatar-lg"),
          hidden: measure("avatar-hidden"),
          plainLg: document.getElementById("plain-lg").getBoundingClientRect().height,
        };
      })()`);

      // The avatar never inflates the pill, whatever its own size class.
      expect(result.lg.badge).toBe(result.plainLg);
      for (const key of ["sm", "def", "lg", "hidden"]) {
        const chip = result[key];
        expect(chip.avatar).toBeLessThan(chip.badge);
        expect(Math.abs(chip.top - chip.bottom)).toBeLessThanOrEqual(0.5);
        expect(Math.abs(chip.start - chip.top)).toBeLessThanOrEqual(0.5);
      }
      expect(result.sm.avatar).toBeLessThan(result.def.avatar);
      expect(result.def.avatar).toBeLessThan(result.lg.avatar);
      // aria-hidden must not route the avatar through the 1em icon rule.
      expect(result.hidden.avatar).toBe(result.lg.avatar);
    },
    { artifactName: "badge-avatar" },
  );
});
