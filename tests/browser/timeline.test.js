/*
 * Real-browser .timeline contract, driven over Bun.WebView.
 *
 * Geometry only a layout engine settles: the marker sits on the first line
 * whichever element opens the event (a smaller <time> must not shift it), a
 * slot shares the rail axis with the plain dots of its list, each line segment
 * spans exactly from one marker to the next, and a stretched list keeps its
 * rhythm.
 */
import { expect, test } from "bun:test";
import { browserAvailable, fixtureUrl, withBrowserPage } from "../../scripts/utils/browser.js";

const FIXTURE = "tests/browser/timeline.html";
const TIMEOUT = 60_000;

const baseTest = (await browserAvailable()) ? test : test.skip;
const it = (name, run) => baseTest(name, run, TIMEOUT);

const MEASURE = `
  const px = (value) => parseFloat(value);
  // The ::before / ::after boxes in viewport coordinates, from their resolved
  // offsets (used values for a positioned box, in either direction):
  // pseudo-elements have no getBoundingClientRect. The <li> has no border, so
  // its border box is the containing block.
  const pseudo = (li, which) => {
    const box = li.getBoundingClientRect();
    const style = getComputedStyle(li, which);
    if (style.content === "none") return null;
    return {
      top: box.top + px(style.top),
      left: box.left + px(style.left),
      width: px(style.width),
      height: px(style.height),
    };
  };
  // Where the event's own text starts on its first line.
  const textStart = (li) => {
    const range = document.createRange();
    range.selectNodeContents(li);
    return [...range.getClientRects()].find((rect) => rect.width > 0).left;
  };
  const center = (rect) => ({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
`;

it("the marker sits on the first line, whichever element opens the event", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      const result = await view.evaluate(`(() => {
        ${MEASURE}
        const timeFirst = document.getElementById("time-first");
        const textFirst = document.getElementById("text-first");
        const lineBox = px(getComputedStyle(timeFirst).lineHeight);
        return {
          lineBox,
          timeHeight: timeFirst.querySelector("time").getBoundingClientRect().height,
          timeDot: center(pseudo(timeFirst, "::before")).y,
          timeLine: center(timeFirst.querySelector("time").getBoundingClientRect()).y,
          textDot: center(pseudo(textFirst, "::before")).y,
          textLine: textFirst.getBoundingClientRect().top + lineBox / 2,
          // A sentence mixing text and links stays one line of block flow.
          sentenceLines: new Set(
            [...textFirst.querySelectorAll("a")].map((a) => Math.round(a.getBoundingClientRect().top)),
          ).size,
        };
      })()`);

      // A smaller <time> keeps the event's line box, so the dot centred on it
      // centres on the dateline too.
      expect(result.timeHeight).toBe(result.lineBox);
      expect(Math.abs(result.timeDot - result.timeLine)).toBeLessThanOrEqual(0.5);
      expect(Math.abs(result.textDot - result.textLine)).toBeLessThanOrEqual(0.5);
      expect(result.sentenceLines).toBe(1);
    },
    { artifactName: "timeline-first-line" },
  );
});

it("slots replace the dot on a rail shared by the whole list", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      const result = await view.evaluate(`(() => {
        ${MEASURE}
        const avatarItem = document.getElementById("avatar");
        const iconItem = document.getElementById("icon");
        const dotItem = document.getElementById("slot-dot");
        const avatar = avatarItem.querySelector(".avatar").getBoundingClientRect();
        const icon = iconItem.querySelector("[aria-hidden]").getBoundingClientRect();
        const dot = pseudo(dotItem, "::before");
        const lineBox = px(getComputedStyle(avatarItem).lineHeight);
        return {
          avatarDot: pseudo(avatarItem, "::before"),
          iconDot: pseudo(iconItem, "::before"),
          avatar: { w: avatar.width, h: avatar.height, ...center(avatar) },
          icon: { w: icon.width, ...center(icon) },
          dot: center(dot),
          avatarLine: avatarItem.getBoundingClientRect().top + lineBox / 2,
          timeStart: avatarItem.querySelector("time").getBoundingClientRect().left,
          textStart: textStart(dotItem),
          plainRail: pseudo(document.querySelector("#dots > li"), "::before").width,
        };
      })()`);

      expect(result.avatarDot).toBeNull();
      expect(result.iconDot).toBeNull();
      // The avatar follows the rail, never its own 2.25rem scale.
      expect(result.avatar.w).toBe(result.avatar.h);
      expect(result.avatar.w).toBeLessThan(36);
      expect(result.icon.w).toBe(result.avatar.w);
      // One axis for slots and dots, one start for every text column.
      expect(Math.abs(result.avatar.x - result.dot.x)).toBeLessThanOrEqual(0.5);
      expect(Math.abs(result.icon.x - result.dot.x)).toBeLessThanOrEqual(0.5);
      expect(Math.abs(result.timeStart - result.textStart)).toBeLessThanOrEqual(0.5);
      expect(Math.abs(result.avatar.y - result.avatarLine)).toBeLessThanOrEqual(0.5);
      // A list without slots keeps the narrow rail.
      expect(result.plainRail).toBeLessThan(result.avatar.w);
    },
    { artifactName: "timeline-slots" },
  );
});

it("each segment runs from one marker to the next, and the last has none", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      const result = await view.evaluate(`(() => {
        ${MEASURE}
        // A segment clears every marker by half the rail, so a dot in a list
        // widened by a slot keeps the same clearance as the slot itself.
        const segments = (id, rail) => {
          const items = [...document.querySelectorAll("#" + id + " > li")];
          const markerCenter = (item) => {
            const slot = item.querySelector(":scope > :is(.avatar, [aria-hidden]):first-child");
            return center(slot ? slot.getBoundingClientRect() : pseudo(item, "::before")).y;
          };
          return items.slice(0, -1).map((li, i) => {
            const line = pseudo(li, "::after");
            return {
              start: line.top,
              end: line.top + line.height,
              from: markerCenter(li) + rail / 2,
              to: markerCenter(items[i + 1]) - rail / 2,
            };
          });
        };
        const dotRail = pseudo(document.getElementById("time-first"), "::before").width;
        const slotRail = document.querySelector("#avatar > .avatar").getBoundingClientRect().width;
        return {
          dots: segments("dots", dotRail),
          slots: segments("slots", slotRail),
          lastHasLine: pseudo(document.getElementById("last"), "::after") !== null,
        };
      })()`);

      for (const segment of [...result.dots, ...result.slots]) {
        expect(Math.abs(segment.start - segment.from)).toBeLessThanOrEqual(0.5);
        expect(Math.abs(segment.end - segment.to)).toBeLessThanOrEqual(0.5);
      }
      expect(result.lastHasLine).toBe(false);
    },
    { artifactName: "timeline-segments" },
  );
});

it("the rail follows the writing direction, and a stretched list keeps its gap", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      const result = await view.evaluate(`(() => {
        ${MEASURE}
        const rtl = document.getElementById("rtl-item");
        const range = document.createRange();
        range.selectNodeContents(rtl);
        const items = [...document.querySelectorAll("#stretched > li")];
        return {
          rtlDot: center(pseudo(rtl, "::before")).x,
          rtlTextEnd: range.getBoundingClientRect().right,
          gap: items[1].getBoundingClientRect().top - items[0].getBoundingClientRect().bottom,
          expectedGap: px(getComputedStyle(document.getElementById("stretched")).rowGap),
        };
      })()`);

      expect(result.rtlDot).toBeGreaterThan(result.rtlTextEnd);
      expect(Math.abs(result.gap - result.expectedGap)).toBeLessThanOrEqual(0.5);
    },
    { artifactName: "timeline-direction" },
  );
});
