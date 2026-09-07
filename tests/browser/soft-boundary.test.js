/*
 * Real-browser soft-foreground channel and intent-boundary contract, driven
 * over Bun.WebView.
 *
 * The shared .soft recipe now resolves soft ink through --intent-soft-fg with
 * the old --soft-fg-mix color-mix as its fallback. Two promises need pinning:
 *
 *   1. Byte-identical compatibility: without a per-intent --*-soft-fg defined
 *      anywhere, a local intent class resolves to exactly the old recipe.
 *   2. The channel honors the intent boundary: a --*-soft-fg set by an
 *      ancestor reaches a component that carries the matching local intent,
 *      but never a neutral .soft component — whose :where() boundary resets
 *      --intent-soft-fg to its guaranteed-invalid initial value, the same
 *      semantics tests/browser/intent-boundary.test.js pins for --intent.
 *
 * Covers every component that opts into the shared variant recipe: .btn,
 * .badge, .alert, .chat-bubble, .dialog-icon, .card, .navbar, .app-nav.
 */
import { expect, test } from "bun:test";
import { browserAvailable, fixtureUrl, withBrowserPage } from "../../scripts/utils/browser.js";

const FIXTURE = "tests/browser/soft-boundary.html";
const TIMEOUT = 60_000;

const baseTest = (await browserAvailable()) ? test : test.skip;
const it = (name, run) => baseTest(name, run, TIMEOUT);

/* Rasterize a computed color through a 1x1 canvas so color-mix()-shaped
   oklab() values become comparable sRGB bytes. */
const COMPONENTS = ["btn", "badge", "alert", "bubble", "icon", "card", "navbar", "appnav"];

it("the soft foreground channel honors the intent boundary on every participant", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      const snapshot = await view.evaluate(`(() => {
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = 1;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        const norm = (value) => {
          ctx.clearRect(0, 0, 1, 1);
          ctx.fillStyle = value;
          ctx.fillRect(0, 0, 1, 1);
          const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
          return r + "," + g + "," + b;
        };
        const fg = (id) => norm(getComputedStyle(document.getElementById(id)).color);
        const probe = (id) => fg(id);
        return {
          ref: probe("ref-fallback-fg"),
          ${COMPONENTS.map(
            (c) =>
              `wrapPrimary_${c}: probe("wrap-${c}-primary"),\n          wrap_${c}: probe("wrap-${c}"),\n          plainPrimary_${c}: probe("plain-${c}-primary"),\n          plain_${c}: probe("plain-${c}"),`,
          ).join("\n          ")}
        };
      })()`);

      const channel = await view.evaluate(`(() => {
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = 1;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        ctx.fillStyle = "rgb(15, 20, 45)";
        ctx.fillRect(0, 0, 1, 1);
        const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
        return r + "," + g + "," + b;
      })()`);

      for (const c of COMPONENTS) {
        const wrapPrimary = snapshot[`wrapPrimary_${c}`];
        const wrap = snapshot[`wrap_${c}`];
        const plainPrimary = snapshot[`plainPrimary_${c}`];
        const plain = snapshot[`plain_${c}`];

        // 1. A local intent class picks up the ancestor's --primary-soft-fg.
        expect(wrapPrimary).toBe(channel);

        // 2. Without a channel defined, the local intent resolves byte-exactly
        //    to the old --soft-fg-mix recipe.
        expect(plainPrimary).toBe(snapshot.ref);

        // 3. A neutral .soft component never inherits the ancestor channel —
        //    its boundary resets --intent-soft-fg, exactly like --intent.
        expect(wrap).toBe(plain);
        expect(wrap).not.toBe(channel);
      }
    },
    { artifactName: "soft-boundary" },
  );
});
