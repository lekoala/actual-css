import { expect } from "bun:test";
import { fixtureUrl } from "../../scripts/utils/browser.js";
import { browserSuite } from "./browser-suite.js";

const { it, setViewport, withBrowserPage } = await browserSuite();

it("native meter zones paint flat intent colors on the themed track", async () => {
  await withBrowserPage(
    fixtureUrl("tests/browser/meter.html"),
    async (view) => {
      // Force the content viewport so Chrome's window chrome cannot clip it.
      await setViewport(view, { width: 480, height: 200 });
      // The browser paints the native fill into an internal box. Sampling the
      // render also catches a gradient that covers the intended color.
      const screenshot = await view.screenshot();
      const png = Buffer.from(
        screenshot instanceof Blob ? await screenshot.arrayBuffer() : screenshot,
      ).toString("base64");
      const samples = await view.evaluate(`(async () => {
        const img = new Image();
        img.src = "data:image/png;base64,${png}";
        await img.decode();
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        const scale = img.width / innerWidth;
        const pixel = (x, y) => {
          const [r, g, b] = ctx.getImageData(x * scale, y * scale, 1, 1).data;
          return "#" + [r, g, b].map((value) => value.toString(16).padStart(2, "0")).join("");
        };
        return [...document.querySelectorAll("meter")].map((meter) => {
          const rect = meter.getBoundingClientRect();
          const style = getComputedStyle(meter);
          const ratio = (meter.value - meter.min) / (meter.max - meter.min);
          const fillX = rect.left + rect.width * ratio / 2;
          const trackX = rect.right - rect.width * (1 - ratio) / 2;
          return {
            zone: meter.id,
            upperFill: pixel(fillX, rect.top + rect.height / 4),
            lowerFill: pixel(fillX, rect.bottom - rect.height / 4),
            track: pixel(trackX, rect.top + rect.height / 2),
            expectedFill: style.getPropertyValue("--" + meter.id).trim(),
            expectedTrack: style.getPropertyValue("--meter-track").trim(),
          };
        });
      })()`);

      expect(samples).toHaveLength(3);
      for (const { zone, upperFill, lowerFill, track, expectedFill, expectedTrack } of samples) {
        expect({ zone, upperFill, lowerFill, track }).toEqual({
          zone,
          upperFill: expectedFill,
          lowerFill: expectedFill,
          track: expectedTrack,
        });
      }
    },
    { artifactName: "meter" },
  );
});
