/*
 * Real-browser contrasting-surface contract, driven over Bun.WebView.
 *
 * POC port of inverted.test.js against the Chrome backend of Bun.WebView:
 * same assertions, browser lifecycle owned by Bun instead of the CDP helper.
 * Run a stress pass with STRESS_REPEATS before removing it.
 */
import { expect, test } from "bun:test";
import { browserAvailable, fixtureUrl, withBrowserPage } from "../../scripts/utils/browser.js";

const FIXTURE = "tests/browser/inverted.html";
const STRESS_REPEATS = 20;
const TIMEOUT = 60_000 + STRESS_REPEATS * 10_000;

const skip = !(await browserAvailable());
const baseTest = skip ? test.skip : test;
const it = (name, run, options = {}) =>
  baseTest(name, run, { timeout: TIMEOUT, ...options });

it("inverted contrasting-surface contract over one WebView pass", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      const evalIn = async (expression) => view.evaluate(expression);
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
          refSubtle: bg("#ref-subtle"),
          refRaised: bg("#ref-raised"),
          refNeutral: bg("#ref-neutral"),
          refPrimary: bg("#ref-primary"),
          refText: color("#ref-text"),
          refTextMuted: color("#ref-text-muted"),
          refNeutralFg: color("#ref-neutral-fg"),
          refPrimaryFg: color("#ref-primary-fg"),
          refContextHover: bg("#ref-context-hover"),
          refRaisedOverlay: bg("#ref-raised-overlay"),
          refSolidOverlay: bg("#ref-solid-overlay"),
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
          invertedCardBg: bg("#inverted-card"),
          invertedCardColor: color("#inverted-card"),
          invertedCardHeading: color("#inverted-card h3"),
          invertedBusyOverlay: beforeBg("#inverted-card"),
          cardSubtleBg: bg("#card-subtle"),
          cardSubtleColor: color("#card-subtle"),
          alertBg: bg("#inverted-alert"),
          alertColor: color("#inverted-alert"),
          badgeBg: bg("#inverted-badge"),
          badgeColor: color("#inverted-badge"),
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

      // Shared-surface components opt in when .inverted is applied directly.
      expect(initial.invertedCardBg).toBe(initial.refSolid);
      expect(initial.invertedCardColor).toBe(initial.refSurface);
      expect(initial.invertedCardHeading).toBe(initial.refSurface);
      expect(initial.invertedBusyOverlay).toBe(initial.refSolidOverlay);
      expect(initial.alertBg).toBe(initial.refSolid);
      expect(initial.alertColor).toBe(initial.refSurface);
      expect(initial.badgeBg).toBe(initial.refSolid);
      expect(initial.badgeColor).toBe(initial.refSurface);
      expect(initial.navbarBg).toBe(initial.refSolid);
      expect(initial.navbarColor).toBe(initial.refSurface);
      expect(initial.brandColor).toBe(initial.refSurface);
      expect(initial.linkColor).toBe(initial.refSurface);

      // Explicit component state/surface treatment remains more specific.
      expect(initial.cardSubtleBg).toBe(initial.refSubtle);
      expect(initial.cardSubtleColor).toBe(initial.refSurface);
      expect(initial.activeBg).toBe(initial.refSubtle);
      expect(initial.activeColor).toBe(initial.refText);

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
    },
    { artifactName: "inverted" },
  );
}, { repeats: STRESS_REPEATS });