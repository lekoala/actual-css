/*
 * Real-browser contextual-surface contract, driven over Bun.WebView.
 *
 * An application paints a contrasting band with local CSS (the theming.md
 * recipe; Actual ships no class for it). Covers what components owe such a
 * context: transparent treatments follow its ink, explicit intents and filled
 * controls keep their own, surface-owning descendants are boundaries, a
 * navbar with its own --ui-* keeps readable states, and every focus line is
 * the same --focus. The browser lifecycle (one headless Chrome per Bun
 * process, one tab per view) is owned by Bun.WebView; this file only
 * describes the contract.
 */
import { expect, test } from "bun:test";
import {
  browserAvailable,
  fixtureUrl,
  waitForBrowser,
  withBrowserPage,
} from "../../scripts/utils/browser.js";

const FIXTURE = "tests/browser/surface-context.html";
const TIMEOUT = 60_000;

const baseTest = (await browserAvailable()) ? test : test.skip;
const it = (name, run) => baseTest(name, run, TIMEOUT);

it("contextual-surface contract over one browser pass", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      const evalIn = (expression) => view.evaluate(expression);
      const cdp = (method, params) => view.cdp(method, params);

      const snapshot = () =>
        evalIn(`(() => {
        const style = (sel) => getComputedStyle(document.querySelector(sel));
        const bg = (sel) => style(sel).backgroundColor;
        const color = (sel) => style(sel).color;
        const border = (sel) => style(sel).borderColor;
        const beforeBg = (sel) =>
          getComputedStyle(document.querySelector(sel), "::before").backgroundColor;
        return {
          refSolid: bg("#ref-solid"),
          refSurface: bg("#ref-surface"),
          refRaised: bg("#ref-raised"),
          refNeutral: bg("#ref-neutral"),
          refPrimary: bg("#ref-primary"),
          refText: color("#ref-text"),
          refTextMuted: color("#ref-text-muted"),
          refNeutralFg: color("#ref-neutral-fg"),
          refPrimaryFg: color("#ref-primary-fg"),
          refContextHover: bg("#ref-context-hover"),
          refRaisedOverlay: bg("#ref-raised-overlay"),
          normalOutlineColor: color("#normal-outline"),
          normalOutlineBorder: border("#normal-outline"),
          wrapperBg: bg("#wrapper"),
          wrapperColor: color("#wrapper"),
          wrapperHeadingColor: color("#wrapper h2"),
          wrapperLinkColor: color("#context-link"),
          contextOutlineBg: bg("#context-outline"),
          contextOutlineColor: color("#context-outline"),
          contextOutlineBorder: border("#context-outline"),
          contextGhostColor: color("#context-ghost"),
          contextLinkButtonColor: color("#context-link-button"),
          contextPrimaryOutlineColor: color("#context-primary-outline"),
          contextPrimaryOutlineBorder: border("#context-primary-outline"),
          contextDefaultBg: bg("#context-default"),
          contextDefaultColor: color("#context-default"),
          contextPrimaryBg: bg("#context-primary"),
          contextPrimaryColor: color("#context-primary"),
          nestedCardBg: bg("#nested-card"),
          nestedCardColor: color("#nested-card"),
          nestedHeadingColor: color("#nested-card h3"),
          nestedOutlineColor: color("#nested-outline"),
          nestedOutlineBorder: border("#nested-outline"),
          nestedBusyOverlay: beforeBg("#nested-busy"),
          nestedAccordionBg: bg("#nested-accordion"),
          nestedAccordionSummary: color("#nested-accordion summary"),
          nestedAccordionPanel: color("#nested-accordion p"),
          bandBackgroundBg: bg("#band-background"),
          bandBackgroundColor: color("#band-background"),
          bandBackgroundHeading: color("#band-background h3"),
          navbarBg: bg("#navbar"),
          navbarColor: color("#navbar"),
          brandColor: color(".navbar-brand"),
          linkColor: color("#navbar .nav-link:not([aria-current])"),
          activeBg: bg("#navbar .nav-link[aria-current]"),
          activeColor: color("#navbar .nav-link[aria-current]"),
        };
      })()`);

      const initial = await snapshot();

      // Transparent treatments inherit ordinary foreground context. An explicit
      // intent remains stronger than that contextual color.
      expect(initial.normalOutlineColor).toBe(initial.refText);
      expect(initial.normalOutlineBorder).toBe(initial.refText);
      expect(initial.wrapperBg).toBe(initial.refSolid);
      expect(initial.wrapperColor).toBe(initial.refSurface);
      expect(initial.wrapperHeadingColor).toBe(initial.refSurface);
      expect(initial.wrapperLinkColor).toBe(initial.refSurface);
      expect(initial.contextOutlineBg).toBe("rgba(0, 0, 0, 0)");
      expect(initial.contextOutlineColor).toBe(initial.refSurface);
      expect(initial.contextOutlineBorder).toBe(initial.refSurface);
      expect(initial.contextGhostColor).toBe(initial.refSurface);
      expect(initial.contextLinkButtonColor).toBe(initial.refSurface);
      expect(initial.contextPrimaryOutlineColor).toBe(initial.refPrimary);
      expect(initial.contextPrimaryOutlineBorder).toBe(initial.refPrimary);

      // Filled controls own their surfaces even inside a contrasting context.
      expect(initial.contextDefaultBg).toBe(initial.refNeutral);
      expect(initial.contextDefaultColor).toBe(initial.refNeutralFg);
      expect(initial.contextPrimaryBg).toBe(initial.refPrimary);
      expect(initial.contextPrimaryColor).toBe(initial.refPrimaryFg);

      // A nested surface is a boundary; its own contextual descendants follow
      // that local surface, including heading, outline, and busy overlay.
      expect(initial.nestedCardBg).toBe(initial.refRaised);
      expect(initial.nestedCardColor).toBe(initial.refText);
      expect(initial.nestedHeadingColor).toBe(initial.refText);
      expect(initial.nestedOutlineColor).toBe(initial.refText);
      expect(initial.nestedOutlineBorder).toBe(initial.refText);
      expect(initial.nestedBusyOverlay).toBe(initial.refRaisedOverlay);
      expect(initial.nestedAccordionBg).toBe(initial.refRaised);
      expect(initial.nestedAccordionSummary).toBe(initial.refText);
      expect(initial.nestedAccordionPanel).toBe(initial.refTextMuted);

      // A background utility is a semantic surface: it recreates a light
      // surface inside the dark band, so it must also recreate the matching
      // ink and heading color, not inherit the band foreground.
      expect(initial.bandBackgroundBg).toBe(initial.refSurface);
      expect(initial.bandBackgroundColor).toBe(initial.refText);
      expect(initial.bandBackgroundHeading).toBe(initial.refText);

      // A navbar given its own --ui-* surface paints it and follows its ink.
      expect(initial.navbarBg).toBe(initial.refSolid);
      expect(initial.navbarColor).toBe(initial.refSurface);
      expect(initial.brandColor).toBe(initial.refSurface);
      expect(initial.linkColor).toBe(initial.refSurface);

      // The current nav link is a tint of the bar's ink, in that ink: the
      // selected accent has no contrast pair with an arbitrary bar.
      expect(initial.activeBg).toBe(initial.refContextHover);
      expect(initial.activeBg).not.toBe(initial.navbarBg);
      expect(initial.activeColor).toBe(initial.refSurface);

      // Force a real :hover through CDP and verify that it derives from the
      // contextual foreground instead of injecting an absolute light surface.
      await cdp("DOM.enable");
      await cdp("CSS.enable");
      const { root } = await cdp("DOM.getDocument");
      const { nodeId } = await cdp("DOM.querySelector", {
        nodeId: root.nodeId,
        selector: "#context-outline",
      });
      await cdp("CSS.forcePseudoState", { nodeId, forcedPseudoClasses: ["hover"] });
      const hovered = await snapshot();
      expect(hovered.contextOutlineBg).toBe(hovered.refContextHover);
      expect(hovered.contextOutlineColor).toBe(hovered.refSurface);

      // Keyboard focus: every button, with or without an intent, draws the
      // same solid --focus line — on the page, on the band, and inside a card
      // nested in it (where a context-derived ring once fell to 1.0:1).
      const ringOf = async (id) => {
        for (let i = 0; i < 8; i++) {
          if (await evalIn(`document.activeElement?.id === ${JSON.stringify(id)}`)) break;
          for (const type of ["keyDown", "keyUp"]) {
            await cdp("Input.dispatchKeyEvent", {
              type,
              key: "Tab",
              code: "Tab",
              windowsVirtualKeyCode: 9,
            });
          }
        }
        await waitForBrowser(view, `document.activeElement?.id === ${JSON.stringify(id)}`);
        return evalIn(`(() => {
          const cs = getComputedStyle(document.activeElement);
          return cs.outlineStyle + " " + cs.outlineColor;
        })()`);
      };
      const expected = `solid ${await evalIn(`getComputedStyle(document.getElementById("ref-focus")).color`)}`;
      for (const id of [
        "normal-outline",
        "context-outline",
        "context-primary-outline",
        "context-primary",
        "nested-outline",
      ]) {
        expect(await ringOf(id), id).toBe(expected);
      }
    },
    { artifactName: "surface-context" },
  );
});
