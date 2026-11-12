import { expect, test } from "bun:test";
import {
  browserAvailable,
  clickSelector,
  fixtureUrl,
  pressKey,
  setViewport,
  waitForBrowser,
  withBrowserPage,
} from "../../scripts/utils/browser.js";

const it = (await browserAvailable()) ? test : test.skip;
const HOME = fixtureUrl("site/index.html");

async function clickPreview(view, selector) {
  await view.evaluate(
    `document.querySelector(${JSON.stringify(selector)}).scrollIntoView({ block: "center" })`,
  );
  await waitForBrowser(
    view,
    `(() => {
    const target = document.querySelector(${JSON.stringify(selector)});
    const box = target.getBoundingClientRect();
    const dialog = target.closest("dialog");
    return box.top >= 0 && box.bottom <= innerHeight &&
      !dialog?.getAnimations().some(animation => animation.playState === "running");
  })()`,
  );
  await clickSelector(view, selector);
}

it("home entrances wait for the content rather than the section padding", async () => {
  for (const width of [390, 1280]) {
    await withBrowserPage(
      HOME,
      async (view) => {
        await setViewport(view, { width, height: 900 });
        await view.evaluate("document.fonts.ready.then(() => true)");
        const title = ".docs-feature-grid";
        await view.evaluate(`(() => {
          const section = document.querySelector(${JSON.stringify(title)}).closest("section");
          window.__entrance = { section, title: section.querySelector("h2"), text: section.querySelector("p"), grid: section.querySelector(".docs-feature-grid") };
        })()`);
        await waitForBrowser(view, "window.__entrance.title.classList.contains('is-pending')");
        // Put only the leading padding on screen, then wait for an actual
        // intersection delivery before checking that the title stays pending.
        await view.evaluate(`(() => {
          const section = window.__entrance.section;
          scrollTo(0, scrollY + section.getBoundingClientRect().top - innerHeight + parseFloat(getComputedStyle(section).paddingBlockStart) / 2);
          return new Promise(resolve => {
            const observer = new IntersectionObserver(entries => {
              if (!entries.some(entry => entry.isIntersecting)) return;
              observer.disconnect();
              resolve(true);
            });
            observer.observe(section);
          });
        })()`);
        expect(
          await view.evaluate("window.__entrance.title.classList.contains('is-pending')"),
        ).toBe(true);
        expect(
          await view.evaluate("window.__entrance.title.getBoundingClientRect().top > innerHeight"),
        ).toBe(true);

        await view.evaluate(`(() => {
          const rect = window.__entrance.title.getBoundingClientRect();
          scrollTo(0, scrollY + rect.top - innerHeight + 96);
        })()`);
        await waitForBrowser(view, "!window.__entrance.title.classList.contains('is-pending')");
        // Seek the entrance instead of sleeping, for the reason sampleTransition
        // documents: a wall-clock sample can read either end state.
        const opacity = await view.evaluate(`(() => {
          const el = window.__entrance.title;
          const entrance = el.getAnimations().find(a => a.animationName === "actual-reveal");
          if (!entrance) return null;
          entrance.currentTime = entrance.effect.getComputedTiming().duration / 2;
          return getComputedStyle(el).opacity;
        })()`);
        expect(opacity).not.toBeNull();
        expect(Number(opacity)).toBeGreaterThan(0);
        expect(Number(opacity)).toBeLessThan(1);
        expect(await view.evaluate("window.__entrance.text.classList.contains('is-pending')")).toBe(
          true,
        );
        expect(await view.evaluate("window.__entrance.grid.classList.contains('is-pending')")).toBe(
          true,
        );
      },
      { sourceCss: true, artifactName: `docs-home-entrance-${width}` },
    );
  }
}, 60_000);

it("home specimens fit narrow viewports, share heights in a grid and appear in the first desktop screen", async () => {
  await withBrowserPage(
    HOME,
    async (view) => {
      await view.evaluate("document.fonts.ready.then(() => true)");
      for (const width of [320, 768, 1280, 1600]) {
        await setViewport(view, { width });
        await waitForBrowser(view, `innerWidth === ${width}`);
        const layout = await view.evaluate(`(() => {
        const root = document.documentElement;
        const scenes = [...document.querySelectorAll(".docs-scene")];
        return {
          overflow: root.scrollWidth > root.clientWidth,
          panelsFit: scenes.every(scene => {
            const outer = scene.getBoundingClientRect();
            const panel = scene.querySelector(".docs-specimen-panel").getBoundingClientRect();
            return panel.left >= outer.left && panel.right <= outer.right;
          }),
          columns: new Set(scenes.map(scene => Math.round(scene.getBoundingClientRect().left))).size,
          sceneHeights: scenes.map(scene => scene.getBoundingClientRect().height),
          panelHeights: scenes.map(scene => scene.querySelector(".docs-specimen-panel").getBoundingClientRect().height),
          visiblePreview: scenes[0].getBoundingClientRect().top < innerHeight,
        };
      })()`);
        expect(layout.overflow, `${width}px document overflow`).toBe(false);
        expect(layout.panelsFit, `${width}px specimen containment`).toBe(true);
        if (width >= 768) {
          for (const heights of [layout.sceneHeights, layout.panelHeights]) {
            expect(
              Math.max(...heights) - Math.min(...heights),
              `${width}px equal heights`,
            ).toBeLessThan(1);
          }
        }
        if (width >= 1280) {
          expect(layout.columns).toBe(3);
          expect(layout.visiblePreview).toBe(true);
        }
      }
    },
    { sourceCss: true, artifactName: "docs-home-layout" },
  );
}, 60_000);

it("workspace menus hand focus to dialogs, settings save or cancel, and installation tabs keep their height", async () => {
  await withBrowserPage(
    HOME,
    async (view) => {
      await clickPreview(view, "#docs-home-flyout-trigger");
      await waitForBrowser(
        view,
        'document.getElementById("docs-home-flyout").matches(":popover-open")',
      );
      expect(
        await view.evaluate(
          'document.querySelectorAll("#docs-home-flyout .menu-item-icon").length',
        ),
      ).toBe(5);
      expect(
        await view.evaluate('!!document.querySelector("#docs-home-flyout .menu-separator")'),
      ).toBe(true);
      await clickPreview(view, '#docs-home-flyout [commandfor="docs-home-dialog"]');
      await waitForBrowser(
        view,
        'document.getElementById("docs-home-dialog").open && document.getElementById("docs-home-dialog").contains(document.activeElement)',
      );
      await pressKey(view, "Escape");
      // The menu row that opened the dialog is hidden, so the native restore
      // has nowhere to go; the page's close listener moves focus to the
      // flyout trigger. The close event is a queued task, so `open` reads
      // false a few milliseconds before focus moves: wait for the focus.
      await waitForBrowser(
        view,
        '!document.getElementById("docs-home-dialog").open && document.activeElement === document.getElementById("docs-home-flyout-trigger")',
      );

      await clickPreview(view, "#docs-settings-trigger");
      await waitForBrowser(view, 'document.getElementById("docs-home-drawer").open');
      await view.evaluate(
        'document.querySelector("#docs-workspace-settings [name=workspaceName]").value = "Design studio"',
      );
      await clickPreview(view, '#docs-workspace-settings [value="save"]');
      await waitForBrowser(
        view,
        'document.querySelector("[data-workspace-title]").textContent === "Design studio"',
      );
      await waitForBrowser(view, '!document.getElementById("docs-home-drawer").open');
      expect(
        await view.evaluate(
          'document.activeElement === document.getElementById("docs-settings-trigger")',
        ),
      ).toBe(true);
      await clickPreview(view, "#docs-settings-trigger");
      await waitForBrowser(view, 'document.getElementById("docs-home-drawer").open');
      await view.evaluate(
        'document.querySelector("#docs-workspace-settings [name=workspaceName]").value = "Discard me"',
      );
      await pressKey(view, "Escape");
      // The draft is restored by the queued close event, after .open becomes false.
      await waitForBrowser(
        view,
        '!document.getElementById("docs-home-drawer").open && document.querySelector("#docs-workspace-settings [name=workspaceName]").value === "Design studio"',
      );
      expect(
        await view.evaluate('document.querySelector("[data-workspace-title]").textContent'),
      ).toBe("Design studio");
      expect(
        await view.evaluate(
          'document.querySelector("#docs-workspace-settings [name=workspaceName]").value',
        ),
      ).toBe("Design studio");

      await clickPreview(view, "#docs-install-npm-tab");
      const height = await view.evaluate(
        'document.querySelector(".docs-install-card").getBoundingClientRect().height',
      );
      await pressKey(view, "ArrowRight", { windowsVirtualKeyCode: 39 });
      await waitForBrowser(
        view,
        'document.getElementById("docs-install-cdn-tab").getAttribute("aria-selected") === "true"',
      );
      expect(await view.evaluate('document.getElementById("docs-install-npm").hidden')).toBe(true);
      expect(
        await view.evaluate(
          'document.activeElement === document.getElementById("docs-install-cdn-tab")',
        ),
      ).toBe(true);
      const cdnHeight = await view.evaluate(
        'document.querySelector(".docs-install-card").getBoundingClientRect().height',
      );
      expect(Math.abs(height - cdnHeight)).toBeLessThan(1);
    },
    { sourceCss: true, artifactName: "docs-home-workspace" },
  );
}, 60_000);

it("home preferences stay local while feedback and invoice pagination remain usable", async () => {
  await withBrowserPage(
    HOME,
    async (view) => {
      const pageTheme = await view.evaluate("document.documentElement.getAttribute('data-theme')");
      await clickPreview(view, '[name="showcase-theme"][value="dark"]');
      await waitForBrowser(
        view,
        'document.getElementById("showcase-appearance").dataset.theme === "dark"',
      );
      expect(await view.evaluate("document.documentElement.getAttribute('data-theme')")).toBe(
        pageTheme,
      );
      await clickPreview(view, '[name="showcase-theme"][value=""]');
      await waitForBrowser(
        view,
        '!document.getElementById("showcase-appearance").hasAttribute("data-theme")',
      );
      await clickPreview(view, "#showcase-digest");
      expect(await view.evaluate('document.getElementById("showcase-digest").checked')).toBe(true);

      await clickPreview(view, '#showcase-review button[type="submit"]');
      await waitForBrowser(
        view,
        '!document.querySelector("#showcase-review [role=status]").hidden',
      );
      // An inline response must grow the shared tracks, never clip the form.
      const feedbackLayout = await view.evaluate(`(() => {
        const panels = [...document.querySelectorAll(".docs-specimen-panel")];
        const heights = panels.map(panel => panel.getBoundingClientRect().height);
        return {
          spread: Math.max(...heights) - Math.min(...heights),
          fits: panels.every(panel => panel.scrollHeight <= panel.clientHeight + 1),
        };
      })()`);
      expect(feedbackLayout.spread).toBeLessThan(1);
      expect(feedbackLayout.fits).toBe(true);

      await clickPreview(view, '#showcase-invoices [aria-label="Page 2"]');
      await waitForBrowser(
        view,
        'document.querySelectorAll("#showcase-invoices tbody")[0].hidden && !document.querySelectorAll("#showcase-invoices tbody")[1].hidden',
      );
      expect(
        await view.evaluate(
          'document.querySelector("#showcase-invoices [aria-current]").textContent.trim()',
        ),
      ).toBe("2");
      await clickPreview(view, '#showcase-invoices [aria-label="Page 1"]');
      await waitForBrowser(
        view,
        '!document.querySelectorAll("#showcase-invoices tbody")[0].hidden && document.querySelectorAll("#showcase-invoices tbody")[1].hidden',
      );
    },
    { sourceCss: true, artifactName: "docs-home-interactions" },
  );
}, 60_000);
