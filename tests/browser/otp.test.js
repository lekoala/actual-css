/*
 * Real-browser OTP disabled contract, driven over Bun.WebView.
 *
 * The input must be the first direct child, with one cell <span> per character
 * after it; the state rules select the cells as following siblings. This
 * fixture uses that canonical order and asserts the disabled treatment is
 * visibly distinct — not just a cursor change.
 *
 * color-mix()/computed colors come back from getComputedStyle as oklab()/rgb(),
 * so the page rasterizes every color through a 1x1 canvas first and the
 * assertions work on sRGB bytes.
 */
import { expect, test } from "bun:test";
import {
  browserAvailable,
  fixtureUrl,
  waitForBrowser,
  withBrowserPage,
} from "../../scripts/utils/browser.js";

const FIXTURE = "tests/browser/otp.html";
const TIMEOUT = 60_000;

const baseTest = (await browserAvailable()) ? test : test.skip;
const it = (name, run) => baseTest(name, run, TIMEOUT);

it("disabled OTP cells are visibly distinct from enabled", async () => {
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
        const style = (sel) => getComputedStyle(document.querySelector(sel));
        const read = (id) => {
          const s = getComputedStyle(document.querySelector("#" + id + " > span"));
          return {
            border: norm(s.borderTopColor),
            bg: norm(s.backgroundColor),
            opacity: s.opacity,
          };
        };
        return {
          ref: {
            border: norm(style("#ref-border").color),
            stateDisabled: norm(style("#ref-state-disabled").color),
            surface: norm(style("#ref-surface").backgroundColor),
            surfaceSubtle: norm(style("#ref-surface-subtle").backgroundColor),
          },
          enabled: read("otp-enabled"),
          disabled: read("otp-disabled"),
          disabledCursor: style("#otp-disabled > input").cursor,
        };
      })()`);

      // Enabled baseline cells: page surface with the normal border color.
      expect(snapshot.enabled.bg).toBe(snapshot.ref.surface);
      expect(snapshot.enabled.border).toBe(snapshot.ref.border);
      expect(snapshot.enabled.opacity).toBe("1");

      // Disabled cells: muted gray border over the subtle surface, dimmed.
      expect(snapshot.disabled.bg).toBe(snapshot.ref.surfaceSubtle);
      expect(snapshot.disabled.border).toBe(snapshot.ref.stateDisabled);
      expect(Number(snapshot.disabled.opacity)).toBeLessThan(1);

      // Distinctness: the disabled border and background must actually differ
      // from the enabled cells, not merely fade imperceptibly.
      expect(snapshot.disabled.border).not.toBe(snapshot.enabled.border);
      expect(snapshot.disabled.bg).not.toBe(snapshot.enabled.bg);

      // The input itself signals not-allowed.
      expect(snapshot.disabledCursor).toBe("not-allowed");
    },
    { artifactName: "otp" },
  );
});

// Keyboard focus, not el.focus(): the competing field ring is :focus-visible.
it("keyboard focus marks the cells only, never a group ring", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      for (const type of ["keyDown", "keyUp"]) {
        await view.cdp("Input.dispatchKeyEvent", {
          type,
          key: "Tab",
          code: "Tab",
          windowsVirtualKeyCode: 9,
        });
      }
      await waitForBrowser(view, `document.activeElement?.id === "otp-enabled-input"`);

      const snapshot = await view.evaluate(`(() => {
        const input = document.getElementById("otp-enabled-input");
        const cell = getComputedStyle(document.querySelector("#otp-enabled > span"));
        return {
          focusVisible: input.matches(":focus-visible"),
          outline: getComputedStyle(input).outlineStyle,
          cellBorder: cell.borderTopColor,
          focus: getComputedStyle(document.getElementById("ref-focus")).color,
        };
      })()`);

      expect(snapshot.focusVisible).toBe(true);
      expect(snapshot.outline).toBe("none");
      expect(snapshot.cellBorder).toBe(snapshot.focus);
    },
    { artifactName: "otp-focus" },
  );
});
