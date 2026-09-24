/*
 * Transport contracts the unit layer cannot see.
 *
 * happy-dom ships no Popover API, does not lay out, and does not hit-test, so
 * everything here is invisible to it and would pass vacuously. Each case is one
 * the transport change could plausibly break:
 *
 *   - a closed surface's contents must stay out of reach. The old transport used
 *     [hidden], which isElementVisible() reads directly; a closed popover is
 *     display:none instead, so the guard now depends on the checkVisibility()
 *     branch of that same helper.
 *   - a surface authored inside a modal dialog must be promoted above it
 *     without leaving it, and must stay interactive — a modal dialog makes the
 *     rest of the document inert, which is exactly why the old transport moved
 *     the panel into the dialog.
 *   - reopening during the exit transition must land open.
 *   - a coordinate-positioned context menu must still be placed at the pointer.
 *   - .is-open and :popover-open must say the same thing. The unit layer is
 *     right never to read :popover-open — happy-dom answers it with a silent
 *     false — but that leaves nothing anywhere asserting the two agree, which
 *     is the one invariant this transport introduced.
 */
import { expect, test } from "bun:test";
import {
  browserAvailable,
  fixtureUrl,
  waitForBrowser,
  withBrowserPage,
} from "../../scripts/utils/browser.js";

const FIXTURE = "tests/browser/surface-transport.html";
const TIMEOUT = 60_000;

const baseTest = (await browserAvailable()) ? test : test.skip;
const it = (name, run) => baseTest(name, run, TIMEOUT);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const withPage = (name, run) =>
  withBrowserPage(fixtureUrl(FIXTURE), run, {
    artifactName: `surface-transport-${name}`,
    mediaFeatures: [{ name: "prefers-reduced-motion", value: "no-preference" }],
  });

it("a closed surface keeps its contents unreachable", async () => {
  await withPage("closed", async (view) => {
    const state = JSON.parse(
      await view.evaluate(`(() => {
        const panel = document.getElementById("plain-panel");
        const item = document.getElementById("plain-item");
        item.focus();
        return JSON.stringify({
          open: panel.classList.contains("is-open"),
          display: getComputedStyle(panel).display,
          // The platform, not [hidden], is what hides it now.
          hasHiddenAttribute: panel.hasAttribute("hidden"),
          popover: panel.getAttribute("popover"),
          itemVisible: item.checkVisibility(),
          focused: document.activeElement === item,
        });
      })()`),
    );

    expect(state.open).toBe(false);
    expect(state.popover).toBe("manual");
    expect(state.hasHiddenAttribute).toBe(false);
    expect(state.display).toBe("none");
    expect(state.itemVisible).toBe(false);
    expect(state.focused).toBe(false);
  });
});

it("a surface authored inside a modal dialog opens above it and stays interactive", async () => {
  await withPage("dialog", async (view) => {
    await view.evaluate(`document.getElementById("open-dialog").click()`);
    await waitForBrowser(view, `document.getElementById("dlg").matches(":modal")`);
    await view.evaluate(`document.getElementById("dlg-trigger").click()`);
    await waitForBrowser(view, `document.getElementById("dlg-panel").matches(":popover-open")`);

    const state = JSON.parse(
      await view.evaluate(`(() => {
        const panel = document.getElementById("dlg-panel");
        const item = document.getElementById("dlg-item");
        const rect = item.getBoundingClientRect();
        const at = document.elementFromPoint(
          Math.round(rect.left + rect.width / 2),
          Math.round(rect.top + rect.height / 2),
        );
        item.focus();
        return JSON.stringify({
          open: panel.classList.contains("is-open"),
          // Promoted, not relocated: still inside the dialog subtree it was
          // authored in, and still in its own host element.
          parent: panel.parentElement.className,
          insideDialog: !!panel.closest("dialog"),
          // Not inert, and painted above the dialog.
          hitTestReachesItem: at ? item.contains(at) || at === item : false,
          focusable: document.activeElement === item,
        });
      })()`),
    );

    expect(state.open).toBe(true);
    expect(state.parent).toBe("flyout-trigger");
    expect(state.insideDialog).toBe(true);
    expect(state.hitTestReachesItem).toBe(true);
    expect(state.focusable).toBe(true);
  });
});

it("reopening during the exit transition lands open", async () => {
  await withPage("reopen", async (view) => {
    const isOpen = () =>
      view.evaluate(`document.getElementById("plain-panel").classList.contains("is-open")`);

    await view.evaluate(`document.getElementById("plain-trigger").click()`);
    await waitForBrowser(view, `document.getElementById("plain-panel").matches(":popover-open")`);
    expect(await isOpen()).toBe(true);

    // Close and reopen well inside the 100ms exit.
    await view.evaluate(`document.getElementById("plain-trigger").click()`);
    await sleep(30);
    await view.evaluate(`document.getElementById("plain-trigger").click()`);
    await waitForBrowser(
      view,
      `getComputedStyle(document.getElementById("plain-panel")).opacity === "1"`,
    );

    expect(await isOpen()).toBe(true);
    const settled = JSON.parse(
      await view.evaluate(`(() => {
        const panel = document.getElementById("plain-panel");
        return JSON.stringify({
          display: getComputedStyle(panel).display,
          opacity: Number(getComputedStyle(panel).opacity),
        });
      })()`),
    );
    expect(settled.display).not.toBe("none");
    expect(settled.opacity).toBe(1);
  });
});

it("a context menu is still positioned at the pointer", async () => {
  await withPage("context", async (view) => {
    const rect = JSON.parse(
      await view.evaluate(`(() => {
        const r = document.getElementById("row").getBoundingClientRect();
        return JSON.stringify({ x: Math.round(r.left + 40), y: Math.round(r.top + 40) });
      })()`),
    );

    // A synthetic contextmenu carrying real coordinates: the gesture plumbing
    // is not what is under test here, the placement is.
    await view.evaluate(`document.getElementById("row").dispatchEvent(
      new MouseEvent("contextmenu", { bubbles: true, cancelable: true, clientX: ${rect.x}, clientY: ${rect.y} })
    )`);
    await waitForBrowser(view, `document.getElementById("ctx").matches(":popover-open")`);

    const state = JSON.parse(
      await view.evaluate(`(() => {
        const menu = document.getElementById("ctx");
        const r = menu.getBoundingClientRect();
        return JSON.stringify({
          open: menu.classList.contains("is-open"),
          parent: menu.parentElement.tagName,
          position: getComputedStyle(menu).position,
          left: Math.round(r.left),
          top: Math.round(r.top),
        });
      })()`),
    );

    expect(state.open).toBe(true);
    expect(state.position).toBe("fixed");
    // Authored at body level here, and it must not have been moved.
    expect(state.parent).toBe("BODY");
    // Placed at the pointer, within the positioner's shift padding.
    expect(Math.abs(state.left - rect.x)).toBeLessThan(24);
    expect(Math.abs(state.top - rect.y)).toBeLessThan(24);
  });
});

async function realClick(view, id) {
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
}

/*
 * --dismiss writes [hidden] on its target before emitting actual:dismiss, so
 * when the command's trigger sits inside the surface, hiding it can already
 * have dropped focus out of the panel by the time the event lands. The
 * surface reads the trigger from the event detail — not activeElement — to
 * decide whether focus has to be restored to the opener. Programmatic clicks
 * would not prove this: only a real click gives the in-panel button focus.
 */
it("--dismiss from inside a surface closes it and returns focus to the opener", async () => {
  await withPage("dismiss", async (view) => {
    await realClick(view, "dismiss-trigger");
    await waitForBrowser(view, `document.getElementById("dismiss-panel").matches(":popover-open")`);

    const opened = JSON.parse(
      await view.evaluate(`(() => {
        const panel = document.getElementById("dismiss-panel");
        return JSON.stringify({
          open: panel.classList.contains("is-open"),
          focused: document.activeElement.id,
        });
      })()`),
    );
    expect(opened.open).toBe(true);

    await realClick(view, "dismiss-close");
    await waitForBrowser(
      view,
      `!document.getElementById("dismiss-panel").matches(":popover-open") && document.activeElement.id === "dismiss-trigger"`,
    );

    const state = JSON.parse(
      await view.evaluate(`(() => {
        const panel = document.getElementById("dismiss-panel");
        return JSON.stringify({
          open: panel.classList.contains("is-open"),
          popoverOpen: panel.matches(":popover-open"),
          hidden: panel.hasAttribute("hidden"),
          focused: document.activeElement.id,
        });
      })()`),
    );
    expect(state.open).toBe(false);
    expect(state.popoverOpen).toBe(false);
    expect(state.hidden).toBe(false);
    expect(state.focused).toBe("dismiss-trigger");
  });
});

it("the runtime state and the transport state agree", async () => {
  await withPage("state-sync", async (view) => {
    // Read both together, so a mismatch cannot hide behind a timing gap.
    const sync = () =>
      view
        .evaluate(`(() => {
          const panel = document.getElementById("plain-panel");
          return JSON.stringify({
            isOpen: panel.classList.contains("is-open"),
            popoverOpen: panel.matches(":popover-open"),
          });
        })()`)
        .then(JSON.parse);

    const closed = await sync();
    expect(closed.isOpen).toBe(false);
    expect(closed.popoverOpen).toBe(closed.isOpen);

    await view.evaluate(`document.getElementById("plain-trigger").click()`);
    await waitForBrowser(view, `document.getElementById("plain-panel").matches(":popover-open")`);

    const open = await sync();
    expect(open.isOpen).toBe(true);
    expect(open.popoverOpen).toBe(open.isOpen);

    // Past the exit transition: `overlay` holds the panel in the top layer
    // while it fades, so settle before reading rather than racing the fade.
    await view.evaluate(`document.getElementById("plain-trigger").click()`);
    await waitForBrowser(view, `!document.getElementById("plain-panel").matches(":popover-open")`);

    const reclosed = await sync();
    expect(reclosed.isOpen).toBe(false);
    expect(reclosed.popoverOpen).toBe(reclosed.isOpen);
  });
});
