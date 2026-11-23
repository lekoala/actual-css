import { expect, test } from "bun:test";
import {
  browserAvailable,
  fixtureUrl,
  tabUntil,
  withBrowserPage,
} from "../../scripts/utils/browser.js";

const baseTest = (await browserAvailable()) ? test : test.skip;
const it = (name, run) => baseTest(name, run, 60_000);

// Forced colors drop the deck's box-shadows and decorative fills, which is
// fine for decoration and fatal for state. Asserted on computed styles: the
// headless screenshot does not paint the forced palette
// (see scripts/forced-colors-shot.js).
it("cyberdeck keeps focus and switch state readable in forced colors", async () => {
  await withBrowserPage(
    fixtureUrl("tests/browser/cyberdeck.html"),
    async (view) => {
      expect(await tabUntil(view, `document.activeElement?.id === "btn"`)).toBe(true);
      const forced = await view.evaluate(`(() => {
        const s = (id, pseudo) => getComputedStyle(document.getElementById(id), pseudo ?? null);
        return {
          outline: s("btn").outlineStyle,
          outlineWidth: parseFloat(s("btn").outlineWidth),
          // The hollow off knob is drawn by an inset shadow the mode drops;
          // the core's forced-colors border must take over.
          knobBorder: parseFloat(s("switch-off", "::before").borderTopWidth),
          label: s("switch", "::after").color,
          labelContent: s("switch", "::after").content,
          // The resting transparent outline that lets field focus fade in
          // would be painted as a permanent ring here.
          restingFieldOutline: s("field").outlineStyle,
          // A chip's corner tick is its only state sign once the pane tint
          // is dropped. The mode repaints a lit --primary fill as Canvas, the
          // chip's own ground: lit must differ from it, off must stay hollow.
          chipOn: s("chip-on", "::after").backgroundColor,
          chipGround: s("chip-on").backgroundColor,
          chipOff: s("chip-off", "::after").backgroundColor,
          card: getComputedStyle(document.getElementById("card-choice").closest(".choice-card"), "::after")
            .backgroundColor,
        };
      })()`);
      expect(forced.restingFieldOutline).toBe("none");
      expect(forced.outline).toBe("solid");
      expect(forced.outlineWidth).toBeGreaterThan(0);
      expect(forced.knobBorder).toBeGreaterThan(0);
      expect(forced.label).not.toMatch(/rgba\(.*, 0\)$|transparent/);
      expect(forced.labelContent).toContain("ON");
      expect(forced.chipOn).not.toMatch(/rgba\(.*, 0\)$|transparent/);
      expect(forced.chipOn).not.toBe(forced.chipGround);
      expect(forced.card).toBe(forced.chipOn);
      expect(forced.chipOff).toMatch(/rgba\(.*, 0\)$|transparent/);
    },
    {
      artifactName: "cyberdeck-forced",
      mediaFeatures: [{ name: "forced-colors", value: "active" }],
    },
  );
});
