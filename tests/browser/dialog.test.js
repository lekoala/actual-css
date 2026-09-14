/*
 * Real-browser Dialog lifecycle suite, driven over Bun.WebView.
 *
 * These tests validate what the happy-dom unit suite cannot: the native
 * <dialog> lifecycle (requestClose fires cancel before closing), native Escape,
 * real focus restoration, and page scroll preservation across open/close.
 *
 * They skip gracefully when Chrome or a fresh dist/actual.full.js is unavailable
 * (the fixture loads the bundled runtime), and run for real in CI where Chrome
 * is present and build:all has produced dist. The browser lifecycle (one
 * headless Chrome per Bun process, one tab per view) is owned by Bun.WebView.
 */
import { expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { browserAvailable, fixtureUrl, withBrowserPage } from "../../scripts/utils/browser.js";

const FIXTURE = "tests/browser/dialog.html";
const TIMEOUT = 60_000;

const hasBrowser = await browserAvailable();
const distReady = existsSync("dist/actual.full.js");
const skip = !hasBrowser || !distReady;

const baseTest = skip ? test.skip : test;
const it = (name, run) => baseTest(name, run, TIMEOUT);

async function withPage(run) {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      const evalIn = (expression) => view.evaluate(expression);
      const settle = () => evalIn("new Promise((r) => setTimeout(r, 60))");
      const pressEscape = async () => {
        await view.press("Escape");
        await settle();
      };
      const snapshot = (id) =>
        evalIn(`(() => {
          const d = document.getElementById(${JSON.stringify(id)});
          const rect = d?.getBoundingClientRect();
          return {
            scrollY: window.scrollY,
            open: d ? d.open : null,
            staticClass: d ? d.classList.contains("is-static") : null,
            modalLock: document.documentElement.classList.contains("has-modal-open"),
            activeId: document.activeElement?.id ?? document.activeElement?.tagName ?? null,
            position: d ? getComputedStyle(d).position : null,
            inViewport: rect
              ? rect.top >= 0 && rect.left >= 0 && rect.bottom <= innerHeight && rect.right <= innerWidth
              : null,
          };
        })()`);
      await run({ evalIn, settle, pressEscape, snapshot });
    },
    {
      mediaFeatures: [{ name: "prefers-reduced-motion", value: "reduce" }],
      artifactName: "dialog",
    },
  );
}

async function click(view, id) {
  await view.evaluate(
    `document.getElementById(${JSON.stringify(id)}).scrollIntoView({ block: "center" })`,
  );
  const at = await view
    .evaluate(`(() => {
      const rect = document.getElementById(${JSON.stringify(id)}).getBoundingClientRect();
      return JSON.stringify({
        x: Math.round(rect.left + rect.width / 2),
        y: Math.round(rect.top + rect.height / 2),
      });
    })()`)
    .then(JSON.parse);

  for (const type of ["mousePressed", "mouseReleased"]) {
    await view.cdp("Input.dispatchMouseEvent", {
      ...at,
      type,
      button: "left",
      clickCount: 1,
    });
  }
  await view.evaluate("new Promise((resolve) => setTimeout(resolve, 250))");
}

const scrollTo1200 = (evalIn) =>
  evalIn("(() => { window.scrollTo(0, 1200); return window.scrollY; })()");

it("open from a scrolled page keeps the scroll position and locks the page", async () => {
  await withPage(async ({ evalIn, settle, snapshot }) => {
    const trace = [];
    trace.push(["before", await scrollTo1200(evalIn)]);
    await evalIn("document.getElementById('open-dismissible').click()");
    await settle();
    trace.push(["afterOpen", await evalIn("window.scrollY")]);
    const state = await snapshot("dlg-dismissible");

    expect(state.open).toBe(true);
    expect(state.modalLock).toBe(true);
    expect(state.position).toBe("fixed");
    expect(state.inViewport).toBe(true);
    expect(state.scrollY).toBe(trace[0][1]);
    expect(state.scrollY).toBeGreaterThan(500);
  });
});

it("Escape closes a non-dismissible dialog on the first press", async () => {
  await withPage(async ({ evalIn, pressEscape, snapshot }) => {
    const y0 = await scrollTo1200(evalIn);
    await evalIn("document.getElementById('open-nondismiss').click()");
    expect((await snapshot("dlg-nondismiss")).open).toBe(true);

    await pressEscape();
    const state = await snapshot("dlg-nondismiss");
    expect(state.open).toBe(false);
    expect(state.modalLock).toBe(false);
    expect(state.scrollY).toBe(y0);
  });
});

it("Escape after the open animation settles closes", async () => {
  await withPage(async ({ evalIn, settle, pressEscape, snapshot }) => {
    await scrollTo1200(evalIn);
    await evalIn("document.getElementById('open-dismissible').click()");
    await settle();
    await pressEscape();
    expect((await snapshot("dlg-dismissible")).open).toBe(false);
  });
});

it("close button closes, restores focus, and keeps the scroll position", async () => {
  await withPage(async ({ evalIn, settle, snapshot }) => {
    const y0 = await scrollTo1200(evalIn);
    await evalIn("document.getElementById('open-dismissible').click()");
    await settle();
    await evalIn("document.querySelector('#dlg-dismissible .dialog-close').click()");
    await settle();

    const state = await snapshot("dlg-dismissible");
    expect(state.open).toBe(false);
    expect(state.scrollY).toBe(y0);
    expect(state.activeId).toBe("open-dismissible");
  });
});

it("dismissible backdrop click closes the dialog", async () => {
  await withPage(async ({ evalIn, settle }) => {
    await scrollTo1200(evalIn);
    await evalIn("document.getElementById('open-dismissible').click()");
    await settle();
    const state = await evalIn(`(() => {
      const d = document.getElementById('dlg-dismissible');
      d.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, clientX: 5, clientY: 5 }));
      return { open: d.open };
    })()`);
    expect(state.open).toBe(false);
  });
});

it("non-dismissible backdrop click stays open with static feedback", async () => {
  await withPage(async ({ evalIn, settle }) => {
    await scrollTo1200(evalIn);
    await evalIn("document.getElementById('open-nondismiss').click()");
    await settle();
    const state = await evalIn(`(() => {
      const d = document.getElementById('dlg-nondismiss');
      d.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, clientX: 5, clientY: 5 }));
      return { open: d.open, staticClass: d.classList.contains('is-static') };
    })()`);
    expect(state.open).toBe(true);
    expect(state.staticClass).toBe(true);
  });
});

it("a prevented actual:dialog-cancel keeps the dialog open", async () => {
  await withPage(async ({ evalIn, settle }) => {
    await scrollTo1200(evalIn);
    await evalIn("document.getElementById('open-nondismiss').click()");
    await settle();
    await evalIn(`(() => {
      const d = document.getElementById('dlg-nondismiss');
      window.__seen = [];
      d.addEventListener('cancel', (e) =>
        window.__seen.push(['native-cancel', e.cancelable, e.defaultPrevented]),
      );
      d.addEventListener('actual:dialog-cancel', (e) => {
        window.__seen.push(['actual-cancel', e.cancelable, e.defaultPrevented]);
        e.preventDefault();
      });
    })()`);

    // A close button goes through requestClose(), whose cancel event is
    // cancelable — unlike Chrome's closedby-driven Escape close. The contract
    // (preventable actual:dialog-cancel) is exercised on this path.
    await evalIn("document.querySelector('#dlg-nondismiss .dialog-close').click()");
    await settle();
    const report = await evalIn(
      "({ seen: window.__seen, open: document.getElementById('dlg-nondismiss').open })",
    );
    expect(report.seen.map((e) => e[0])).toEqual(["actual-cancel", "native-cancel"]);
    expect(report.seen[1][1]).toBe(true);
    expect(report.open).toBe(true);
  });
});

it("repeated open/close cycles do not drift the scroll position", async () => {
  await withPage(async ({ evalIn, settle, pressEscape, snapshot }) => {
    const y0 = await scrollTo1200(evalIn);
    for (let i = 0; i < 3; i += 1) {
      await evalIn("document.getElementById('open-dismissible').click()");
      await settle();
      expect((await snapshot("dlg-dismissible")).open).toBe(true);
      await pressEscape();
      expect((await snapshot("dlg-dismissible")).open).toBe(false);
    }
    expect(await evalIn("window.scrollY")).toBe(y0);
  });
});

it("scrollable dialog bodies preserve full-width focus rings and alignment", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      await click(view, "open-scrollable");
      await click(view, "modal-edge-control");

      const modal = await view
        .evaluate(`(() => {
          const body = document.getElementById("modal-scroll-body");
          const control = document.getElementById("modal-edge-control");
          const header = body.previousElementSibling;
          const bodyRect = body.getBoundingClientRect();
          const controlRect = control.getBoundingClientRect();
          const headerRect = header.getBoundingClientRect();
          const style = getComputedStyle(body);
          const controlStyle = getComputedStyle(control);
          const reserve = parseFloat(style.paddingInlineStart);
          const paintedRing =
            parseFloat(controlStyle.outlineWidth) + parseFloat(controlStyle.outlineOffset);
          const expectedReserve =
            parseFloat(style.getPropertyValue("--focus-outline-offset")) +
            parseFloat(style.getPropertyValue("--border-width")) * 2;
          return JSON.stringify({
            active: document.activeElement === control,
            focusVisible: control.matches(":focus-visible"),
            reserve,
            expectedReserve,
            paintedRing,
            paddingStart: parseFloat(style.paddingInlineStart),
            marginStart: parseFloat(style.marginInlineStart),
            ringPastStart: bodyRect.left - (controlRect.left - paintedRing),
            ringPastEnd: controlRect.right + paintedRing - bodyRect.right,
            startDrift: controlRect.left - headerRect.left,
            endDrift: controlRect.right - headerRect.right,
          });
        })()`)
        .then(JSON.parse);

      expect(modal.active).toBe(true);
      expect(modal.focusVisible).toBe(true);
      expect(modal.reserve).toBeGreaterThan(0);
      expect(modal.reserve).toBe(modal.expectedReserve);
      expect(modal.reserve).toBeGreaterThanOrEqual(modal.paintedRing);
      expect(modal.paddingStart).toBe(modal.reserve);
      expect(modal.marginStart).toBe(-modal.reserve);
      expect(modal.ringPastStart).toBeLessThanOrEqual(0);
      expect(modal.ringPastEnd).toBeLessThanOrEqual(0);
      expect(Math.abs(modal.startDrift)).toBeLessThanOrEqual(0.5);
      expect(Math.abs(modal.endDrift)).toBeLessThanOrEqual(0.5);

      await view.evaluate('document.getElementById("dlg-scrollable").close()');
      await click(view, "open-drawer");
      await view.press("Tab");
      await view.evaluate("new Promise((resolve) => setTimeout(resolve, 250))");

      const drawer = await view
        .evaluate(`(() => {
          const drawer = document.getElementById("drawer");
          const body = drawer.querySelector("nav");
          const control = document.getElementById("drawer-edge-control");
          const bodyRect = body.getBoundingClientRect();
          const controlRect = control.getBoundingClientRect();
          const drawerRect = drawer.getBoundingClientRect();
          const bodyStyle = getComputedStyle(body);
          const controlStyle = getComputedStyle(control);
          const drawerStyle = getComputedStyle(drawer);
          const reserve = parseFloat(bodyStyle.paddingInlineStart);
          const paintedRing =
            parseFloat(controlStyle.outlineWidth) + parseFloat(controlStyle.outlineOffset);
          const expectedReserve =
            parseFloat(bodyStyle.getPropertyValue("--focus-outline-offset")) +
            parseFloat(bodyStyle.getPropertyValue("--border-width")) * 2;
          const contentStart =
            drawerRect.left +
            parseFloat(drawerStyle.borderLeftWidth) +
            parseFloat(drawerStyle.paddingLeft);
          const contentEnd =
            drawerRect.right -
            parseFloat(drawerStyle.borderRightWidth) -
            parseFloat(drawerStyle.paddingRight);
          return JSON.stringify({
            activeId: document.activeElement?.id,
            focusVisible: control.matches(":focus-visible"),
            open: drawer.open,
            reserve,
            expectedReserve,
            paintedRing,
            paddingStart: parseFloat(bodyStyle.paddingInlineStart),
            marginStart: parseFloat(bodyStyle.marginInlineStart),
            ringPastStart: bodyRect.left - (controlRect.left - paintedRing),
            ringPastEnd: controlRect.right + paintedRing - bodyRect.right,
            startDrift: controlRect.left - contentStart,
            endDrift: controlRect.right - contentEnd,
          });
        })()`)
        .then(JSON.parse);

      expect(drawer.open).toBe(true);
      expect(drawer.activeId).toBe("drawer-edge-control");
      expect(drawer.focusVisible).toBe(true);
      expect(drawer.reserve).toBeGreaterThan(0);
      expect(drawer.reserve).toBe(drawer.expectedReserve);
      expect(drawer.reserve).toBeGreaterThanOrEqual(drawer.paintedRing);
      expect(drawer.paddingStart).toBe(drawer.reserve);
      expect(drawer.marginStart).toBe(-drawer.reserve);
      expect(drawer.ringPastStart).toBeLessThanOrEqual(0);
      expect(drawer.ringPastEnd).toBeLessThanOrEqual(0);
      expect(Math.abs(drawer.startDrift)).toBeLessThanOrEqual(0.5);
      expect(Math.abs(drawer.endDrift)).toBeLessThanOrEqual(0.5);
    },
    {
      mediaFeatures: [{ name: "prefers-reduced-motion", value: "reduce" }],
      artifactName: "dialog-focus-bleed",
    },
  );
});

it("drawer: scroll preserved, close button and Escape close, backdrop gated by dismissible", async () => {
  await withPage(async ({ evalIn, settle, pressEscape, snapshot }) => {
    const y0 = await scrollTo1200(evalIn);

    await evalIn(`(() => {
      const list = document.querySelector('#drawer .nav-list');
      list.replaceChildren(...Array.from({ length: 100 }, (_, index) => {
        const item = document.createElement('li');
        const link = document.createElement('a');
        link.href = '#';
        link.textContent = \`Item \${index + 1}\`;
        item.append(link);
        return item;
      }));
    })()`);
    await evalIn("document.getElementById('open-drawer').click()");
    await settle();
    let state = await snapshot("drawer");
    expect(state.open).toBe(true);
    expect(state.position).toBe("fixed");
    expect(state.inViewport).toBe(true);
    expect(state.scrollY).toBe(y0);

    const layout = await evalIn(`(() => {
      const drawer = document.getElementById('drawer');
      const nav = drawer.querySelector('nav');
      const rect = drawer.getBoundingClientRect();
      nav.scrollTop = nav.scrollHeight;
      return {
        top: rect.top,
        bottom: rect.bottom,
        viewportHeight: innerHeight,
        scrollHeight: nav.scrollHeight,
        clientHeight: nav.clientHeight,
        scrollTop: nav.scrollTop,
      };
    })()`);
    expect(layout.top).toBe(0);
    expect(layout.bottom).toBe(layout.viewportHeight);
    expect(layout.scrollHeight).toBeGreaterThan(layout.clientHeight);
    expect(layout.scrollTop).toBeGreaterThan(0);

    state = await evalIn(`(() => {
      const d = document.getElementById('drawer');
      const rect = d.getBoundingClientRect();
      d.dispatchEvent(new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        clientX: rect.right + 1,
        clientY: rect.top + 1,
      }));
      return { open: d.open, staticClass: d.classList.contains('is-static') };
    })()`);
    expect(state.open).toBe(true);
    expect(state.staticClass).toBe(true);

    await evalIn("document.querySelector('#drawer .drawer-close').click()");
    await settle();
    state = await snapshot("drawer");
    expect(state.open).toBe(false);
    expect(state.scrollY).toBe(y0);

    await evalIn("document.getElementById('open-drawer').click()");
    await settle();
    await pressEscape();
    expect((await snapshot("drawer")).open).toBe(false);
    expect(await evalIn("window.scrollY")).toBe(y0);
  });
});
