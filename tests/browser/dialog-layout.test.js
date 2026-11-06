/* Confirmation-dialog geometry, driven over Bun.WebView. */
import { expect, test } from "bun:test";
import {
  browserAvailable,
  fixtureUrl,
  setViewport,
  waitForBrowser,
  withBrowserPage,
} from "../../scripts/utils/browser.js";

const FIXTURE = "tests/browser/dialog-layout.html";
const TIMEOUT = 60_000;

const baseTest = (await browserAvailable()) ? test : test.skip;
const it = (name, run) => baseTest(name, run, TIMEOUT);

it("confirmation copy shares one column and its title centers on the icon", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      const result = await view.evaluate(`(() => {
        const root = document.getElementById("confirmation");
        const rect = (selector) => root.querySelector(selector).getBoundingClientRect();
        const icon = rect(".dialog-icon");
        const title = rect("h3");
        const copy = rect("header p");
        return {
          centerDrift: Math.abs((icon.top + icon.bottom) / 2 - (title.top + title.bottom) / 2),
          columnDrift: Math.abs(title.left - copy.left),
        };
      })()`);

      expect(result.centerDrift).toBeLessThanOrEqual(0.5);
      expect(result.columnDrift).toBeLessThanOrEqual(0.5);
    },
    { artifactName: "dialog-layout" },
  );
});

/* .stack and .cluster reset their children's margins; a modal child lost its
 * UA margin: auto and opened pinned to the top until .modal restated it. */
it("a modal inside .stack or .cluster still opens centered", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      const result = await view.evaluate(`(() => {
        const margins = (id) => {
          const dialog = document.getElementById(id);
          dialog.showModal();
          // Used margins, not the rect: the entry lift offsets the box.
          const { marginTop, marginBottom } = getComputedStyle(dialog);
          dialog.close();
          return [parseFloat(marginTop), parseFloat(marginBottom)];
        };
        return [margins("in-stack"), margins("in-cluster")];
      })()`);

      // A short dialog in a tall viewport: centered means equal, non-zero margins.
      for (const [top, bottom] of result) {
        expect(top).toBeGreaterThan(0);
        expect(Math.abs(top - bottom)).toBeLessThanOrEqual(1);
      }
    },
    { artifactName: "dialog-layout" },
  );
});

/* The action band is pure composition, so this guards the specificity
 * contract: the footer's default row must lose to a one-class utility. */
it("a .bleed footer forms an edge band that a justify utility splits", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      const result = await view
        .evaluate(`(() => {
          const root = document.getElementById("confirmation");
          const panel = root.getBoundingClientRect();
          const footer = root.querySelector("footer");
          const band = footer.getBoundingClientRect();
          const [cancel, commit] = [...footer.children].map((el) => el.getBoundingClientRect());
          const cs = getComputedStyle(footer);
          return JSON.stringify({
            justify: cs.justifyContent,
            edges: [band.left - panel.left, panel.right - band.right, panel.bottom - band.bottom],
            radius: cs.borderEndStartRadius,
            panelRadius: getComputedStyle(root).borderEndStartRadius,
            leadInset: cancel.left - band.left,
            trailInset: band.right - commit.right,
            pad: parseFloat(cs.paddingInlineStart),
          });
        })()`)
        .then(JSON.parse);

      expect(result.justify).toBe("space-between");
      for (const edge of result.edges) expect(Math.abs(edge)).toBeLessThanOrEqual(0.5);
      expect(result.radius).toBe(result.panelRadius);
      expect(result.pad).toBeGreaterThan(0);
      expect(Math.abs(result.leadInset - result.pad)).toBeLessThanOrEqual(0.5);
      expect(Math.abs(result.trailInset - result.pad)).toBeLessThanOrEqual(0.5);
    },
    { artifactName: "dialog-footer-band" },
  );
});

/* The reserve is the unconditional baseline (a browser without :has() keeps
 * it); :has() only reclaims it. Every corner position in close.css must keep
 * it, or a title runs under the close. */
const RESERVE_CASES = {
  modal: { kept: ["direct", "form", "header"], none: "none", bleed: "bleed" },
  drawer: {
    kept: ["direct", "header", "header-form", "form-header"],
    none: "none",
    bleed: "bleed",
  },
};

it("a header reserves close room for every corner position and reclaims it without one", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      const pads = await view
        .evaluate(`(() => {
          const out = {};
          for (const el of document.querySelectorAll('dialog[id^="reserve-"]')) {
            const cs = getComputedStyle(el.querySelector("header"));
            out[el.id] = { end: parseFloat(cs.paddingInlineEnd), start: parseFloat(cs.paddingInlineStart) };
          }
          return JSON.stringify(out);
        })()`)
        .then(JSON.parse);

      for (const [kind, { kept, none, bleed }] of Object.entries(RESERVE_CASES)) {
        const reserve = pads[`reserve-${kind}-${kept[0]}`].end;
        expect(`${kind} reserve > 0: ${reserve > 0}`).toBe(`${kind} reserve > 0: true`);
        for (const id of kept) {
          expect(`${kind}-${id}: ${pads[`reserve-${kind}-${id}`].end}`).toBe(
            `${kind}-${id}: ${reserve}`,
          );
        }
        expect(`${kind}-${none}: ${pads[`reserve-${kind}-${none}`].end}`).toBe(
          `${kind}-${none}: 0`,
        );
        // A band without a close keeps its own inset on both sides.
        const band = pads[`reserve-${kind}-${bleed}`];
        expect(`${kind}-bleed start > 0: ${band.start > 0}`).toBe(`${kind}-bleed start > 0: true`);
        expect(`${kind}-bleed: ${band.end}`).toBe(`${kind}-bleed: ${band.start}`);
      }
    },
    { artifactName: "dialog-close-reserve" },
  );
});

it("a direct header aligns its title, icon, close, and additional controls", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      const result = await view.evaluate(`(() => {
        const root = document.getElementById("header-dialog");
        const rect = (selector) => root.querySelector(selector).getBoundingClientRect();
        const center = (box) => (box.top + box.bottom) / 2;
        const title = rect("h2");
        const icon = rect(".dialog-icon");
        const close = rect("#header-close");
        const extra = rect("#header-extra");
        return {
          iconDrift: Math.abs(center(title) - center(icon)),
          closeDrift: Math.abs(center(title) - center(close)),
          extraDrift: Math.abs(center(title) - center(extra)),
          closePosition: getComputedStyle(root.querySelector("#header-close")).position,
        };
      })()`);

      expect(result.iconDrift).toBeLessThanOrEqual(0.5);
      expect(result.closeDrift).toBeLessThanOrEqual(0.5);
      expect(result.extraDrift).toBeLessThanOrEqual(0.5);
      expect(result.closePosition).toBe("static");
    },
    { artifactName: "dialog-header-layout" },
  );
});

it("a chrome header takes a surface utility but keeps its own layout", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      const result = await view
        .evaluate(`(() => {
          const read = (id) => getComputedStyle(document.querySelector("#" + id + " > header"));
          const painted = read("header-paint");
          return JSON.stringify({
            paintedBg: painted.backgroundColor,
            defaultBg: read("header-dialog").backgroundColor,
            raisedBg: getComputedStyle(document.getElementById("header-paint")).backgroundColor,
            justify: painted.justifyContent,
          });
        })()`)
        .then(JSON.parse);

      expect(result.paintedBg).toBe(result.raisedBg);
      expect(result.paintedBg).not.toBe(result.defaultBg);
      expect(result.justify).toBe("space-between");
    },
    { artifactName: "dialog-header-paint" },
  );
});

it("a shared --dialog-icon-size centers the confirmation title on the icon", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      for (const id of ["icon-hook-media", "icon-hook-dialog"]) {
        const result = await view.evaluate(`(() => {
          const root = document.getElementById(${JSON.stringify(id)});
          const icon = root.querySelector(".dialog-icon").getBoundingClientRect();
          const title = root.querySelector("h3").getBoundingClientRect();
          const center = (box) => (box.top + box.bottom) / 2;
          return {
            iconHeight: icon.height,
            titleHeight: title.height,
            centerDrift: Math.abs(center(icon) - center(title)),
          };
        })()`);

        expect(`${id}: ${result.iconHeight}`).toBe(`${id}: 80`);
        expect(`${id}: ${result.titleHeight}`).toBe(`${id}: 80`);
        expect(`${id}: ${result.centerDrift <= 0.5}`).toBe(`${id}: true`);
      }
    },
    { artifactName: "dialog-icon-hook" },
  );
});

/* Every scroll-wrapper anatomy, at a narrow, short viewport — the case that
 * collapsed a footer to zero. Each region combination is stated outright:
 * header + footer, header only, footer only, body only, two bare body regions,
 * and an external header (chrome outside the wrapper). */
const SCROLL_CASES = [
  { id: "scroll-both", bodies: ["scroll-both-body"], action: "scroll-both-action" },
  { id: "scroll-header", bodies: ["scroll-header-body"], action: null },
  { id: "scroll-footer", bodies: ["scroll-footer-body"], action: "scroll-footer-action" },
  { id: "scroll-body", bodies: ["scroll-body-body"], action: null },
  {
    id: "scroll-multi",
    bodies: ["scroll-multi-a", "scroll-multi-b"],
    action: "scroll-multi-action",
  },
  { id: "external-scrollable", bodies: ["external-scroll-body"], action: "external-action" },
];

it("scrollable keeps each region scrollable, the action reachable, and the chrome fixed", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      await setViewport(view, { width: 360, height: 520 });

      for (const testCase of SCROLL_CASES) {
        const result = await view
          .evaluate(`(() => {
            const dialog = document.getElementById(${JSON.stringify(testCase.id)});
            dialog.showModal();
            const rect = (el) => {
              const b = el.getBoundingClientRect();
              return { top: b.top, bottom: b.bottom, left: b.left, right: b.right };
            };
            const chrome = (tag) =>
              dialog.querySelector(":scope > " + tag + ", :scope > .stack > " + tag);
            const header = chrome("header");
            const footer = chrome("footer");
            const bodies = ${JSON.stringify(testCase.bodies)}.map((id) =>
              document.getElementById(id),
            );
            const measure = (el) => {
              const cs = getComputedStyle(el);
              return {
                scrollHeight: el.scrollHeight,
                clientHeight: el.clientHeight,
                scrollTop: el.scrollTop,
                overflowY: cs.overflowY,
                reserve: parseFloat(cs.paddingInlineStart),
              };
            };
            const action = document.getElementById(${JSON.stringify(testCase.action)});
            const before = {
              dialog: rect(dialog),
              action: action ? rect(action) : null,
              headerTop: header ? header.getBoundingClientRect().top : null,
              footerTop: footer ? footer.getBoundingClientRect().top : null,
              bodies: bodies.map(measure),
            };
            for (const body of bodies) body.scrollTop = body.scrollHeight;
            const after = {
              headerTop: header ? header.getBoundingClientRect().top : null,
              footerTop: footer ? footer.getBoundingClientRect().top : null,
              bodies: bodies.map(measure),
            };
            dialog.close();
            return JSON.stringify({ before, after });
          })()`)
          .then(JSON.parse);

        const label = testCase.id;
        for (const [index, body] of result.before.bodies.entries()) {
          const where = `${label}/${index}`;
          expect(`${where} overflowY: ${body.overflowY}`).toBe(`${where} overflowY: auto`);
          expect(`${where} overflows: ${body.scrollHeight > body.clientHeight}`).toBe(
            `${where} overflows: true`,
          );
          expect(`${where} reserve: ${body.reserve > 0}`).toBe(`${where} reserve: true`);
          expect(`${where} scrolled: ${result.after.bodies[index].scrollTop > 0}`).toBe(
            `${where} scrolled: true`,
          );
        }

        if (result.before.action) {
          const { action, dialog } = result.before;
          const inside =
            action.top >= dialog.top - 0.5 &&
            action.bottom <= dialog.bottom + 0.5 &&
            action.left >= dialog.left - 0.5 &&
            action.right <= dialog.right + 0.5;
          expect(`${label} action in panel: ${inside}`).toBe(`${label} action in panel: true`);
        }

        if (result.before.headerTop !== null) {
          const fixed = Math.abs(result.after.headerTop - result.before.headerTop) <= 0.5;
          expect(`${label} header fixed: ${fixed}`).toBe(`${label} header fixed: true`);
        }

        if (result.before.footerTop !== null) {
          const fixed = Math.abs(result.after.footerTop - result.before.footerTop) <= 0.5;
          expect(`${label} footer fixed: ${fixed}`).toBe(`${label} footer fixed: true`);
        }
      }
    },
    { artifactName: "dialog-scrollable-regions" },
  );
});

const normalizeCss = (value) => value.replace(/\s+/g, "");
const EASE_ENTER = "cubic-bezier(0.2,0,0,1)";
const EASE_EXIT = "cubic-bezier(0.4,0,1,1)";

/* The transition refactor changed how presence motion is declared, not what it
 * does. The mid-transition sample is the only timed wait here: the interpolation
 * is the contract, so elapsed time is part of what is asserted. */
it("modal enter/exit keeps its easing and interpolates, dialog and backdrop", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      const read = () =>
        view
          .evaluate(`(() => {
            const d = document.getElementById("scroll-both");
            const cs = getComputedStyle(d);
            const bd = getComputedStyle(d, "::backdrop");
            return JSON.stringify({
              open: d.open,
              property: cs.transitionProperty,
              timing: cs.transitionTimingFunction,
              backdropProperty: bd.transitionProperty,
              backdropTiming: bd.transitionTimingFunction,
            });
          })()`)
          .then(JSON.parse);

      let state = await read();
      expect(state.open).toBe(false);
      expect(state.property).toContain("opacity");
      expect(state.property).toContain("transform");
      expect(normalizeCss(state.timing)).toBe(EASE_EXIT);
      expect(state.backdropProperty).toContain("opacity");
      expect(normalizeCss(state.backdropTiming)).toBe("ease");

      const midOpen = await view.evaluate(`(async () => {
        const d = document.getElementById("scroll-both");
        d.showModal();
        const ms = parseFloat(getComputedStyle(d).transitionDuration) * 1000;
        await new Promise((resolve) => setTimeout(resolve, ms * 0.25));
        return getComputedStyle(d).opacity;
      })()`);
      expect(parseFloat(midOpen) < 1).toBe(true);
      await waitForBrowser(
        view,
        'getComputedStyle(document.getElementById("scroll-both")).opacity === "1"',
      );

      state = await read();
      expect(state.open).toBe(true);
      expect(normalizeCss(state.timing)).toBe(EASE_ENTER);

      const midClose = await view.evaluate(`(async () => {
        const d = document.getElementById("scroll-both");
        const ms = parseFloat(getComputedStyle(d).transitionDuration) * 1000;
        d.close();
        await new Promise((resolve) => setTimeout(resolve, ms * 0.25));
        return getComputedStyle(d).opacity;
      })()`);
      expect(parseFloat(midClose) < 1).toBe(true);
    },
    { artifactName: "dialog-motion" },
  );
});

it("reduced motion keeps the transition declarations but collapses the duration", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      const state = await view
        .evaluate(`(() => {
          const d = document.getElementById("scroll-both");
          const cs = getComputedStyle(d);
          const bd = getComputedStyle(d, "::backdrop");
          return JSON.stringify({
            property: cs.transitionProperty,
            timing: cs.transitionTimingFunction,
            duration: parseFloat(cs.transitionDuration),
            backdropDuration: parseFloat(bd.transitionDuration),
          });
        })()`)
        .then(JSON.parse);

      expect(state.property).toContain("opacity");
      expect(state.timing).not.toBe("none");
      expect(state.duration < 0.001).toBe(true);
      expect(state.backdropDuration < 0.001).toBe(true);

      await view.evaluate('document.getElementById("scroll-both").showModal()');
      await waitForBrowser(
        view,
        'getComputedStyle(document.getElementById("scroll-both")).opacity === "1"',
      );
      await view.evaluate('document.getElementById("scroll-both").close()');
    },
    {
      mediaFeatures: [{ name: "prefers-reduced-motion", value: "reduce" }],
      artifactName: "dialog-motion-reduced",
    },
  );
});

/* The drawer body's scrollport reaches the panel's inline-end edge, so the
 * scrollbar sits on the edge and the content keeps the panel padding on both
 * sides instead of running up to the scrollbar. */
it("a scrolling drawer body keeps the panel padding on both sides of its content", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      const result = await view.evaluate(`(() => {
        const drawer = document.createElement("dialog");
        drawer.className = "drawer";
        drawer.innerHTML = '<header><strong>Menu</strong></header><div><p id="scroll-content">' +
          "Line. ".repeat(600) + "</p></div>";
        document.body.append(drawer);
        drawer.showModal();
        const panel = drawer.getBoundingClientRect();
        const body = drawer.children[1];
        const content = document.getElementById("scroll-content").getBoundingClientRect();
        const pad = parseFloat(getComputedStyle(drawer).paddingInlineStart);
        const border = parseFloat(getComputedStyle(drawer).borderInlineEndWidth);
        return {
          pad,
          scrolls: body.scrollHeight > body.clientHeight,
          bodyEnd: panel.right - border - body.getBoundingClientRect().right,
          start: content.left - panel.left,
          // The gap from the content to the scrollbar, or to the edge without one.
          end: body.getBoundingClientRect().left + body.clientLeft + body.clientWidth - content.right,
        };
      })()`);

      expect(result.scrolls).toBe(true);
      expect(result.bodyEnd).toBeCloseTo(0, 0);
      expect(result.start).toBeCloseTo(result.pad, 0);
      expect(result.end).toBeCloseTo(result.pad, 0);
    },
    { width: 800, height: 600, artifactName: "drawer-scrollbar-edge" },
  );
});

/* A bottom sheet is the drawer on the block-end edge: content-sized up to
 * --drawer-size, footer always on screen, the body scrolling between. */
const BOTTOM_SHEET = `(content) => {
  const drawer = document.createElement("dialog");
  drawer.className = "drawer";
  drawer.dataset.side = "bottom";
  drawer.innerHTML =
    '<form method="dialog"><header><strong>Filters</strong></header>' +
    '<div class="stack">' + content + "</div>" +
    '<footer class="cluster"><button class="btn" id="sheet-apply">Apply</button></footer></form>';
  document.body.append(drawer);
  drawer.showModal();
  return drawer;
}`;

const sheetGeometry = (content) => `(async () => {
  const drawer = (${BOTTOM_SHEET})(${JSON.stringify(content)});
  await Promise.all(drawer.getAnimations().map((a) => a.finished));
  const panel = drawer.getBoundingClientRect();
  const cs = getComputedStyle(drawer);
  const body = drawer.querySelector(".stack");
  const footer = drawer.querySelector("footer").getBoundingClientRect();
  return {
    viewport: { width: innerWidth, height: innerHeight },
    panel: { top: panel.top, bottom: panel.bottom, left: panel.left, width: panel.width, height: panel.height },
    footerBottom: footer.bottom,
    bodyScrolls: body.scrollHeight > body.clientHeight + 1,
    maxHeight: parseFloat(cs.maxBlockSize),
    topRadius: parseFloat(cs.borderStartStartRadius),
    bottomRadius: parseFloat(cs.borderEndStartRadius),
    transform: cs.transform,
    closed: cs.getPropertyValue("--drawer-closed-transform").trim(),
  };
})()`;

it("a bottom sheet hugs the bottom edge at its content's height", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      const sheet = await view.evaluate(sheetGeometry("<p>Remote</p><p>In person</p>"));
      expect(sheet.panel.bottom).toBeCloseTo(sheet.viewport.height, 0);
      expect(sheet.panel.left).toBeCloseTo(0, 0);
      expect(sheet.panel.width).toBeCloseTo(sheet.viewport.width, 0);
      expect(sheet.panel.height).toBeLessThan(sheet.maxHeight);
      expect(sheet.topRadius).toBeGreaterThan(0);
      expect(sheet.bottomRadius).toBe(0);
      // Open at rest; closed off the bottom edge, on the block axis.
      expect(["none", "matrix(1, 0, 0, 1, 0, 0)"]).toContain(sheet.transform);
      expect(sheet.closed).toBe("translateY(100%)");
    },
    { width: 400, height: 800, artifactName: "drawer-bottom-short" },
  );
});

it("a tall bottom sheet caps its height, keeps the footer on screen and scrolls its body", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      const sheet = await view.evaluate(sheetGeometry("<p>Option</p>".repeat(80)));
      expect(sheet.panel.height).toBeCloseTo(sheet.maxHeight, 0);
      expect(sheet.panel.height).toBeLessThan(sheet.viewport.height);
      expect(sheet.panel.bottom).toBeCloseTo(sheet.viewport.height, 0);
      expect(sheet.footerBottom).toBeLessThanOrEqual(sheet.viewport.height);
      expect(sheet.bodyScrolls).toBe(true);
    },
    { width: 400, height: 800, artifactName: "drawer-bottom-tall" },
  );
});

it("side drawers keep their inline motion", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      const closed = await view.evaluate(`(() => {
        const read = (side) => {
          const drawer = document.createElement("dialog");
          drawer.className = "drawer";
          if (side) drawer.dataset.side = side;
          document.body.append(drawer);
          // A closed dialog is display: none, so its transform reads "none";
          // the resolved closed position is the variable.
          return getComputedStyle(drawer).getPropertyValue("--drawer-closed-transform").trim();
        };
        return { start: read(""), end: read("end") };
      })()`);
      expect(closed.start).toBe("translateX(-100%)");
      expect(closed.end).toBe("translateX(100%)");
    },
    { width: 400, height: 800, artifactName: "drawer-side-motion" },
  );
});
