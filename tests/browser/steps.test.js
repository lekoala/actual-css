/*
 * Real-browser .steps contract, driven over Bun.WebView.
 *
 * Five things only a layout engine can settle, and each of them is a bug the
 * source alone would not show:
 *
 * - the connector must resolve --step-line at its own use site, so a
 *   .step-complete segment is accented and a future one is not (a parent-level
 *   default would freeze both);
 * - a row with no labels must be compact by structure, at every width and with
 *   no size context, while a labelled one must switch to inline on the
 *   documented pixel and never drop a label to fit;
 * - a navigable label must keep a real box in every representation;
 * - .steps-vertical must stay vertical whatever the container reports, and
 *   must do it without carrying .steps at all;
 * - state must read identically on both roots;
 * - the label must read as one notch below its marker, and sit on the marker's
 *   optical centre, in every representation;
 * - the row must scroll on the inline axis only, and clip nothing a reader
 *   needs to see.
 */
import { expect, test } from "bun:test";
import { browserAvailable, fixtureUrl, withBrowserPage } from "../../scripts/utils/browser.js";

const FIXTURE = "tests/browser/steps.html";
const TIMEOUT = 60_000;
/* --step-size, the marker row: the stacked/inline split is "is the label
   inside the marker row or under it", which is this number. */
const STEP_SIZE = 28;

const baseTest = (await browserAvailable()) ? test : test.skip;
const it = (name, run) => baseTest(name, run, TIMEOUT);

/*
 * Shared page-side readers. Kept as a string because view.evaluate serializes
 * the program: each test prepends this to its own probe.
 */
const READERS = `
  const stepSize = ${STEP_SIZE};
  const items = (id) => [...document.getElementById(id).children];
  const labelOf = (li) => li.querySelector(".step-label");
  /* Nothing must ever answer true. .sr-only takes an element out of flow and
     clips it away, so this is how "the framework never hides an authored
     label" is asserted rather than assumed. */
  const hidden = (li) => {
    const el = labelOf(li);
    return el ? getComputedStyle(el).position === "absolute" : null;
  };
  // The connector traces the marker's ring, not its fill: a future step's
  // marker is a --surface disc with a --border ring.
  const ring = (li) => getComputedStyle(li, "::before").borderTopColor;
  const connector = (li) => {
    const s = getComputedStyle(li, "::after");
    return {
      content: s.content,
      position: s.position,
      image: s.backgroundImage,
      color: s.backgroundColor,
      size: s.backgroundSize,
      width: Math.round(Number.parseFloat(s.inlineSize)),
    };
  };
  // Which representation is on, read from geometry rather than from the
  // selector that produced it.
  const shape = (id) => {
    const list = items(id);
    const li = list[0];
    const label = labelOf(li);
    const box = li.getBoundingClientRect();
    return {
      liDisplay: getComputedStyle(li).display,
      labelHidden: hidden(li),
      /* The step's own height, which is what the grid template decides: one
         marker row and nothing else, or a marker row plus a gap and a label
         row. A step with no label must measure the first. */
      blockSize: Math.round(box.height),
      // Under the marker row = stacked; inside it = inline.
      labelBelowMarker: label
        ? label.getBoundingClientRect().top - box.top >= stepSize
        : null,
      connectorPosition: connector(li).position,
    };
  };
  const flow = (id) => {
    const ol = document.getElementById(id);
    const list = items(ol.id);
    const lefts = list.map((li) => li.getBoundingClientRect().left);
    const deltas = lefts.slice(1).map((x, i) => x - lefts[i]);
    return {
      overflowPx: Math.round(ol.scrollWidth - ol.clientWidth),
      // The inline scrollbar's height: compacting must remove the overflow,
      // not merely hide it behind a scroll affordance.
      scrollbarPx: ol.offsetHeight - ol.clientHeight,
      // Even marker pitch: no step keeps a bigger budget than its peers.
      pitchSpread: deltas.length
        ? Math.round(Math.max(...deltas) - Math.min(...deltas))
        : 0,
      // Every label stays in the ordered list, compacted or not.
      textPresent: list.every((li) => li.textContent.trim().length > 0),
      lastConnector: connector(list.at(-1)).content,
    };
  };
  const type = (li) => {
    const s = getComputedStyle(labelOf(li));
    return {
      fontSize: s.fontSize,
      fontWeight: s.fontWeight,
      lineHeight: s.lineHeight,
      color: s.color,
      itemColor: getComputedStyle(li).color,
      underlined: s.textDecorationLine,
    };
  };
  /*
   * Optical centring of the label against its marker. The marker is a disc of
   * known height, so its centre is unambiguous; the label's optical centre is
   * the middle of its cap height, which is baseline - capHeight / 2.
   *
   * The baseline is found with a zero-size inline-block probe (vertical-align:
   * baseline puts its top edge exactly on the baseline), and the cap height
   * comes from canvas ink metrics for the very font in use — a line box tells
   * you nothing about where the glyphs sit inside it.
   */
  const opticalOffset = (li, markerCentre) => {
    const label = labelOf(li);
    const s = getComputedStyle(label);
    const probe = document.createElement("span");
    probe.style.cssText = "display:inline-block;width:0;height:0;vertical-align:baseline";
    label.append(probe);
    const baseline = probe.getBoundingClientRect().top;
    probe.remove();
    const ctx = document.createElement("canvas").getContext("2d");
    ctx.font = s.fontStyle + " " + s.fontWeight + " " + s.fontSize + " " + s.fontFamily;
    const caps = ctx.measureText("H").actualBoundingBoxAscent;
    // Positive = the label reads low against its marker.
    return Math.round((baseline - caps / 2 - markerCentre) * 100) / 100;
  };
`;

const probe = (view, body) => view.evaluate(`(() => {${READERS}${body}})()`);

/*
 * A custom property resolves its var() before inheritance, so a default
 * --step-connector on .steps would freeze the parent's line colour and a
 * .step-complete child's connector would never follow its own state. The default
 * therefore falls back to the local --step-line inside the gradient.
 */
it("each connector resolves the line color of the step it leaves", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      const result = await probe(
        view,
        `
        const list = items("plain");
        return {
          complete: connector(list[0]),
          completeRing: ring(list[0]),
          // list[2] is the unmarked future step: plain connector, plain ring.
          future: connector(list[2]),
          futureRing: ring(list[2]),
          last: connector(list.at(-1)),
          markerRow: getComputedStyle(list[0], "::before").blockSize,
          connectorBox: getComputedStyle(list[0], "::after").blockSize,
        };
      `,
      );

      // The default is a hairline painted by a gradient, so the colour rides in
      // background-image and the box itself stays transparent.
      expect(result.complete.image).toContain(result.completeRing);
      expect(result.future.image).toContain(result.futureRing);
      expect(result.complete.color).toBe("rgba(0, 0, 0, 0)");
      // Visibly different: complete = selected, future = border.
      expect(result.complete.image).not.toBe(result.future.image);
      // Nothing leaves the final step.
      expect(result.last.content).toBe("none");
      // The box is marker-height so --step-connector can be any complete
      // background value; the hairline is the gradient's size, not the box's.
      expect(result.markerRow).toBe(`${STEP_SIZE}px`);
      expect(result.connectorBox).toBe(`${STEP_SIZE}px`);
      expect(result.complete.size).toBe("100% 1px");
    },
    { artifactName: "steps-connector" },
  );
});

/*
 * --step-connector is a whole background, not a colour: `none` must erase the
 * line and leave the marker geometry untouched, which is what lets a theme
 * drop in a gradient, an image, or nothing.
 */
it("--step-connector replaces the whole connector background", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      const result = await probe(
        view,
        `
        const list = items("no-connector");
        const plain = items("plain");
        return {
          erased: connector(list[0]),
          ring: ring(list[0]),
          plainRing: ring(plain[0]),
          // The box survives the erase; only its paint is gone.
          boxWidth: connector(list[0]).width,
          plainBoxWidth: connector(plain[0]).width,
        };
      `,
      );

      expect(result.erased.image).toBe("none");
      expect(result.erased.color).toBe("rgba(0, 0, 0, 0)");
      // Marker state is untouched by the connector hook.
      expect(result.ring).toBe(result.plainRing);
      expect(result.boxWidth).toBe(result.plainBoxWidth);
    },
    { artifactName: "steps-connector-hook" },
  );
});

/*
 * Labels are a dimension of their own, independent of orientation, and each
 * side of it makes one promise.
 *
 * An empty step is a marker and nothing else, so it is compact by structure
 * rather than by grant: five of them fit a 320px region with no size context,
 * because `> li:empty` reads the markup and not the width. Nothing authored,
 * nothing hidden, no variant class. It must be that one shape at every width,
 * so the inline query has to stay out of it — and the column must answer the
 * same way, which in a shrink-to-fit box means being exactly as wide as its
 * markers.
 *
 * A labelled sequence makes the opposite promise: every label stays visible at
 * every width, and a row that outgrows its space scrolls. The count is no part
 * of either promise, so two steps at 200px must answer exactly as five at
 * 559px: nothing in the component counts its items.
 */
it("an empty step is compact by structure, and a labelled one is never dropped", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      const result = await probe(
        view,
        `
        const read = (id) => ({ ...shape(id), ...flow(id) });
        const widthOf = (id) => Math.round(
          document.getElementById(id).getBoundingClientRect().width);
        /* The marker is a ::before, so its box is read through its item: an
           empty step aligns it to the start of its share, and the final step
           is only as wide as its own marker. Both ends therefore sit flush
           with the row. */
        const trackEdges = (id) => {
          const ol = document.getElementById(id);
          const list = items(id);
          const box = ol.getBoundingClientRect();
          return [
            Math.round(list[0].getBoundingClientRect().left - box.left),
            Math.round(box.right - list.at(-1).getBoundingClientRect().right),
          ];
        };
        return {
          markerEdges: trackEdges("markers"),
          markerWideEdges: trackEdges("markers-wide"),
          markers: read("markers"),
          markersWide: read("markers-wide"),
          narrow5: read("labelled-narrow"),
          tiny2: read("labelled-tiny"),
          bare: read("bare"),
          mixed: items("mixed").map((li) => Math.round(li.getBoundingClientRect().width)),
          verticalRail: widthOf("vertical-markers"),
          verticalRailItem: read("vertical-markers").blockSize,
        };
      `,
      );

      /* 320px, five steps, no grant at all. An even marker pitch is the point:
         a step keeping a wider budget than its peers would stop reading as a
         position in a sequence. */
      expect(result.markers.overflowPx).toBe(0);
      expect(result.markers.scrollbarPx).toBe(0);
      expect(result.markers.pitchSpread).toBeLessThanOrEqual(2);
      /* One grid row, the marker's. This is the row's half of the trick: the
         template declares that row only, so no label means no implicit second
         row and therefore no gap either — measured as the step's own height. */
      expect(result.markers.liDisplay).toBe("grid");
      expect(result.markers.blockSize).toBe(STEP_SIZE);

      /* Edge to edge, at both widths. A marker with no label under it has
         nothing to share a centre with, so it takes the start of its share and
         the track lines up with the text around it. Half-cell margins at the
         ends would leave it floating against a left-aligned heading. */
      expect(result.markerEdges).toEqual([0, 0]);
      expect(result.markerWideEdges).toEqual([0, 0]);

      /* 980px, and granted the context that fires the inline query. Same
         representation: a marker row whose first marker jumped flush at 60rem
         would break the "one shape at every width" promise. */
      expect(result.markersWide.liDisplay).toBe("grid");
      expect(result.markersWide.blockSize).toBe(STEP_SIZE);
      expect(result.markersWide.connectorPosition).toBe("absolute");
      expect(result.markersWide.overflowPx).toBe(0);

      /* The column's half. A stretched column hides the difference, so this is
         measured shrink-to-fit — a sticky rail — where the label track and the
         gap to it would otherwise make the rail --step-inline-gap wider than
         the markers it draws. */
      expect(result.verticalRail).toBe(STEP_SIZE);
      expect(result.verticalRailItem).toBe(STEP_SIZE);

      /* The other promise, at both ends of the count range: labels stay
         visible, stacked under their markers, and the row scrolls instead. */
      for (const key of ["narrow5", "tiny2"]) {
        expect(result[key].labelHidden).toBe(false);
        expect(result[key].labelBelowMarker).toBe(true);
        expect(result[key].overflowPx).toBeGreaterThan(0);
      }

      /* `:empty` reads an item's own content, which is what makes both
         out-of-contract rows lay out as what they say rather than fall apart.
         Bare text is content, so it keeps the reading widths its wrapped peers
         would get — the second row of a stacked step, hence a taller item than
         a marker. And in a row mixing an empty step with labelled ones, the
         labelled ones still measure alike: `--step-min` is a floor on the
         items that asked for it, never a budget one item can take from
         another, which is the 201px-against-89px skew that made the wrapper
         mandatory. */
      expect(result.bare.labelHidden).toBe(null);
      expect(result.bare.blockSize).toBeGreaterThan(STEP_SIZE);
      expect(result.mixed[0]).toBe(result.mixed[2]);
      expect(result.mixed[1]).toBeLessThan(result.mixed[0]);
    },
    { artifactName: "steps-markers" },
  );
});

/*
 * Inline is the generous end of the axis: marker, label, and a connector that
 * absorbs what is left. It is a bonus, not a rescue, so one late threshold
 * serves every supported count.
 *
 * 60rem is where a five-step row — the widest case, so the binding one — still
 * leaves its connector at roughly its 2rem basis with realistic labels.
 * Measured at 48rem that same row renders inline with a 15px connector: the
 * representation applies, but the region a themed chevron lives in has
 * collapsed to a stub. So the assertion below is on the connector's width, not
 * merely on the row being inline.
 *
 * It is also the only thing an `actual-container` grant buys, so all three
 * grant routes are checked here: the class on the row, the name declared in a
 * stylesheet, and a wrapper carrying the shared name — that last one reaching
 * the row through an intervening element and measuring its own region.
 *
 * --step-inline-connector is scoped to this representation on purpose: a
 * chevron that reads correctly between two inline groups would be nonsense
 * squeezed over a stacked row, so the hook must not leak across the threshold.
 */
it("generous room puts the label beside its marker and stretches the connector", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      const result = await probe(
        view,
        `
        const read = (id) => ({ ...shape(id), ...flow(id) });
        const connectorOf = (id) => connector(items(id)[0]);
        return {
          inline3: read("inline-3"),
          stacked3: read("stacked-3"),
          inline5: read("inline-5"),
          cramped5: read("stacked-5-cramped"),
          inlineConnector: connectorOf("inline-3"),
          inlineConnector5: connectorOf("inline-5"),
          stackedConnector: connectorOf("stacked-3"),
          hookedInline: connectorOf("inline-hook"),
          hookedStacked: connectorOf("stacked-hook"),
          stylesheet: read("stylesheet-route"),
          ancestor: read("ancestor-grant"),
        };
      `,
      );

      // 961px: one pixel over the single threshold, whatever the count.
      for (const key of ["inline3", "inline5"]) {
        expect(result[key].liDisplay).toBe("flex");
        expect(result[key].labelHidden).toBe(false);
        expect(result[key].labelBelowMarker).toBe(false);
        expect(result[key].overflowPx).toBe(0);
        // Still nothing after the final step.
        expect(result[key].lastConnector).toBe("none");
      }
      // The connector joins the flex row and takes the free space, so it stays
      // at least its 2rem basis. That width is what a themed chevron gets, and
      // on five steps — the widest supported row — it is what any lower
      // threshold squeezes away.
      expect(result.inlineConnector.position).toBe("static");
      expect(result.inlineConnector.width).toBeGreaterThan(32);
      expect(result.inlineConnector5.position).toBe("static");
      expect(result.inlineConnector5.width).toBeGreaterThanOrEqual(32);

      // 959px: the last stacked pixel. Label under the marker, connector back
      // to the absolutely positioned span.
      expect(result.stacked3.liDisplay).toBe("grid");
      expect(result.stacked3.labelBelowMarker).toBe(true);
      expect(result.stackedConnector.position).toBe("absolute");

      /* 769px, five steps, realistic labels: what a 48rem threshold buys. The
         row does fit inline there, so "no overflow" is not the test — the
         connector measures ~15px, a stub where the representation promises a
         region. It must still be stacked. */
      expect(result.cramped5.liDisplay).toBe("grid");
      expect(result.cramped5.labelBelowMarker).toBe(true);

      // The hook repaints the inline representation only.
      expect(result.hookedInline.image).toBe("linear-gradient(rgb(1, 2, 3), rgb(1, 2, 3))");
      expect(result.hookedStacked.image).toBe(result.stackedConnector.image);

      /* The class is a convenience, not the API: naming the anchor in a
         stylesheet is equivalent, and actual-container is shared, so a wrapper
         grant reaches the row inside it and measures the zone it was given. */
      for (const key of ["stylesheet", "ancestor"]) {
        expect(result[key].liDisplay).toBe("flex");
        expect(result[key].labelBelowMarker).toBe(false);
      }
    },
    { artifactName: "steps-inline" },
  );
});

/*
 * Navigation is a labelled affair — only a `.step-label` can be a link — and
 * the framework never hides an authored label, so a focusable box exists in
 * every representation, at every width. It falls out of the contract rather
 * than out of a guard, which is exactly why it needs a real browser to hold:
 * the cheap way to compact a row is `.sr-only`, and that leaves an element in
 * the tab order at 1x1 under `clip-path: inset(50%)`, so the focus ring is
 * clipped to nothing and a keyboard user lands somewhere invisible.
 *
 * The narrow row therefore scrolls with its labels intact, and the inline
 * representation moves the label rather than touching its box.
 */
it("a navigable label keeps a real box at every width", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      const result = await probe(
        view,
        `
        const ol = document.getElementById("interactive");
        const link = ol.querySelector("a.step-label");
        link.focus();
        const r = link.getBoundingClientRect();
        const s = getComputedStyle(link);
        return {
          focused: document.activeElement === link,
          w: Math.round(r.width),
          h: Math.round(r.height),
          clipPath: s.clipPath,
          position: s.position,
          // Labels kept means the row scrolls, grant or no grant.
          overflowPx: Math.round(ol.scrollWidth - ol.clientWidth),
          inline: shape("interactive-inline"),
        };
      `,
      );

      expect(result.focused).toBe(true);
      // A focus ring needs a box appreciably larger than the 1x1 sr-only one.
      expect(result.w).toBeGreaterThan(10);
      expect(result.h).toBeGreaterThan(10);
      expect(result.clipPath).toBe("none");
      expect(result.position).not.toBe("absolute");
      expect(result.overflowPx).toBeGreaterThan(0);

      // And above the inline threshold, where the label only moves.
      expect(result.inline.liDisplay).toBe("flex");
      expect(result.inline.labelHidden).toBe(false);
    },
    { artifactName: "steps-interactive" },
  );
});

/*
 * .steps-vertical is a composition choice, not a responsive fallback. The same
 * grant that moves a horizontal row inline must leave it alone at every width,
 * its connector must run down the marker track instead of across it, and the 2..5
 * horizontal range must not follow it: a vertical flow is bounded by its
 * layout, not by a rule.
 */
it("vertical steps stay vertical under any container width", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      const result = await probe(
        view,
        `
        const read = (id) => {
          const ol = document.getElementById(id);
          const list = items(id);
          const li = list[0];
          const box = li.getBoundingClientRect();
          const label = labelOf(li).getBoundingClientRect();
          const line = connector(li);
          const after = getComputedStyle(li, "::after");
          return {
            // Peers on a shared primitive: a column carries the primitive for
            // everything a step is, and never the horizontal composition.
            carriesPrimitive: ol.classList.contains("steps"),
            carriesHorizontal: ol.classList.contains("steps-horizontal"),
            direction: getComputedStyle(ol).flexDirection,
            // Stacked top to bottom, each step at the same inline start.
            stacked: list.every((x, i, all) =>
              i === 0 || x.getBoundingClientRect().top > all[i - 1].getBoundingClientRect().top),
            sameStart: new Set(list.map((x) => Math.round(x.getBoundingClientRect().left))).size,
            count: list.length,
            // Label beside the marker, clear of the marker column.
            labelOffsetX: Math.round(label.left - box.left),
            // A hairline running down, not across.
            lineWidth: Math.round(Number.parseFloat(after.inlineSize)),
            lineHeight: Math.round(Number.parseFloat(after.blockSize)),
            lineImage: line.image,
            lastConnector: connector(list.at(-1)).content,
            // No scroll container: the vertical form has nothing to scroll.
            overflowX: getComputedStyle(ol).overflowX,
            labelHidden: hidden(li),
          };
        };
        return {
          narrow: read("vertical"),
          wide: read("vertical-wide"),
        };
      `,
      );

      for (const key of ["narrow", "wide"]) {
        const v = result[key];
        // `<ol class="steps steps-vertical">`, never `.steps-horizontal`.
        expect(v.carriesPrimitive).toBe(true);
        expect(v.carriesHorizontal).toBe(false);
        expect(v.direction).toBe("column");
        expect(v.stacked).toBe(true);
        expect(v.sameStart).toBe(1);
        // A label is never hidden, here no more than in a row.
        expect(v.labelHidden).toBe(false);
        expect(v.labelOffsetX).toBeGreaterThanOrEqual(STEP_SIZE);
        // The connector is taller than it is wide, and stops at the last step.
        expect(v.lineWidth).toBeLessThan(v.lineHeight);
        expect(v.lastConnector).toBe("none");
        expect(v.overflowX).toBe("visible");
      }

      // Past the horizontal 2..5 range and still vertical: the limit is the
      // surrounding layout, not a count.
      expect(result.narrow.count).toBe(5);

      // The track follows each step's own state, like the horizontal one. There
      // is no --step-vertical-connector: nothing has asked for one, and the
      // geometry is reachable through .steps-vertical > li::after.
      expect(result.narrow.lineImage).toContain("rgb");
    },
    { artifactName: "steps-vertical" },
  );
});

/*
 * `.steps` and `.steps-vertical` are two roots but one component, and state is
 * the half they share. Every channel a step's state paints — the marker fill,
 * its ring, its ring width, the glyph or number inside it, the label's weight
 * and the item's own text colour — must read identically on both.
 *
 * This is the test that would catch the shared block being split back into two
 * copies. `:is(.steps, .steps-vertical)` makes the parity structural rather
 * than a convention someone maintains by hand, and a copy that drifted by one
 * token would still pass every other test in this file.
 */
it("state reads the same on both roots", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      const result = await probe(
        view,
        `
        const state = (li) => {
          const marker = getComputedStyle(li, "::before");
          const label = getComputedStyle(labelOf(li));
          return {
            fill: marker.backgroundColor,
            ring: marker.borderTopColor,
            ringWidth: marker.borderTopWidth,
            glyph: marker.content,
            markerColor: marker.color,
            itemColor: getComputedStyle(li).color,
            labelWeight: label.fontWeight,
            labelSize: label.fontSize,
          };
        };
        const read = (id) => items(id).map(state);
        return { horizontal: read("plain"), vertical: read("plain-vertical") };
      `,
      );

      // complete, current, upcoming — same markup, same three states.
      expect(result.horizontal).toHaveLength(3);
      expect(result.vertical).toEqual(result.horizontal);

      /* And the three states are actually distinct on that shared channel set,
         so the equality above is not two identical nothings. */
      const [complete, current, upcoming] = result.horizontal;
      expect(complete.fill).not.toBe(upcoming.fill);
      expect(current.ringWidth).not.toBe(upcoming.ringWidth);
      expect(current.labelWeight).not.toBe(upcoming.labelWeight);
      expect(complete.labelWeight).toBe(upcoming.labelWeight);
    },
    { artifactName: "steps-state-parity" },
  );
});

/*
 * Label typography, which is a hierarchy claim and an alignment claim at once.
 *
 * Hierarchy: the marker carries the state — filled, ringed, or neutral — so the
 * label sits a notch below it and only the current step earns extra weight.
 * A completed step gets none: its filled disc already reads as strongly.
 *
 * Alignment: the size is set on the component, not inside the container
 * blocks, so it cannot change with the representation — a label that resized
 * as the reader dragged a window would be worse than the imperfection it
 * fixed. Which makes one measurement cover every form: the label's cap-height
 * centre must land on its marker's centre wherever the marker is beside it.
 */
it("the label reads one notch below its marker and centres on it", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      const result = await probe(
        view,
        `
        const marked = (id) => {
          const list = items(id);
          const current = list.find((li) => li.getAttribute("aria-current") === "step");
          const complete = list.find((li) => li.classList.contains("step-complete"));
          const future = list.at(-1);
          return {
            current: type(current),
            complete: type(complete),
            future: type(future),
          };
        };
        // The marker sits at the top of its item in both forms that put the
        // label beside it, so its centre is the same expression for both.
        const centred = (id) =>
          items(id).map((li) =>
            opticalOffset(li, li.getBoundingClientRect().top + ${STEP_SIZE} / 2));
        return {
          inline: marked("inline-3"),
          stacked: marked("stacked-3"),
          vertical: marked("vertical"),
          inlineOffsets: centred("inline-3"),
          verticalOffsets: centred("vertical"),
          wrapOffsets: centred("vertical-wrap"),
          // A wrapped label starts level with the top of its marker instead.
          wrapFirstLine: (() => {
            const li = items("vertical-wrap")[0];
            const label = labelOf(li);
            return {
              lines: Math.round(label.getBoundingClientRect().height / 17.5),
              topDelta: Math.round(
                label.getBoundingClientRect().top - li.getBoundingClientRect().top),
            };
          })(),
          themed: items("themed-link").map((li) => type(li)),
        };
      `,
      );

      // One size for the whole component: identical in all three forms, so no
      // threshold can resize the text under the reader.
      const sizes = new Set(
        ["inline", "stacked", "vertical"].flatMap((form) =>
          [result[form].current, result[form].complete, result[form].future].map(
            (t) => `${t.fontSize}/${t.lineHeight}`,
          ),
        ),
      );
      expect([...sizes]).toEqual(["14px/17.5px"]);

      // Only the current step gains weight; complete leans on its filled disc.
      for (const form of ["inline", "stacked", "vertical"]) {
        const { current, complete, future } = result[form];
        expect(Number(current.fontWeight)).toBeGreaterThan(Number(future.fontWeight));
        expect(complete.fontWeight).toBe(future.fontWeight);
      }

      // Optically centred wherever the marker is beside the label. Sub-pixel:
      // anything a translateY could "fix" it would overshoot in the other
      // direction.
      for (const offset of [...result.inlineOffsets, ...result.verticalOffsets]) {
        expect(Math.abs(offset)).toBeLessThanOrEqual(1);
      }

      // A label too tall to centre starts level with the marker instead, so a
      // wrapped step reads as a block hanging off its disc.
      expect(result.wrapFirstLine.lines).toBeGreaterThan(1);
      expect(result.wrapFirstLine.topDelta).toBe(0);
      // Its shorter siblings still centre.
      expect(Math.abs(result.wrapOffsets[1])).toBeLessThanOrEqual(1);

      // --link is a theme hook: a step label keeps the state color it inherits
      // and signals the link with its underline instead.
      for (const label of result.themed) {
        expect(label.color).toBe(label.itemColor);
      }
      expect(result.themed[0].underlined).toBe("underline");
      expect(result.themed[1].underlined).toBe("none");
    },
    { artifactName: "steps-label-type" },
  );
});

/*
 * The row scrolls on one axis only, and never by accident.
 *
 * `overflow-x: auto` alone is not enough: the spec computes the other axis to
 * `auto` as well, and a row hugs fractional content — a 28px marker, an 8px
 * gap and a 17.5px label line come to 53.5px, with no slack at all. Whichever
 * way the engine rounds scrollHeight against clientHeight decides whether a
 * phantom vertical scrollbar appears, so it shows up under one font, one device
 * pixel ratio or one zoom step and not another. `overflow-y: hidden` settles it:
 * there is never anything to scroll on that axis.
 *
 * Clipping then happens at the padding edge, which is where a focus ring would
 * be lost — a navigable label sits flush with the bottom of the row. So a row
 * with an interactive label reserves the ring's width and offset, and only that
 * row pays for it.
 */
it("scrolls only on the inline axis, without clipping a focus ring", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      const result = await probe(
        view,
        `
        // --focus-outline is 2x --border-width, offset by --focus-outline-offset.
        const RING_PX = 4;
        const build = (width, interactive) => {
          const box = document.createElement("div");
          box.style.inlineSize = width + "px";
          document.body.append(box);
          const ol = document.createElement("ol");
          ol.className = "steps steps-horizontal";
          for (const [i, text] of ["Account", "Payment", "Confirm"].entries()) {
            const li = document.createElement("li");
            if (i === 0) li.className = "step-complete";
            const el = document.createElement(interactive ? "a" : "span");
            el.className = "step-label";
            if (interactive) el.href = "#x";
            el.textContent = text;
            li.append(el);
            ol.append(li);
          }
          box.append(ol);
          return { box, ol };
        };

        /* Sweep fractional widths across every representation. A vertical
           scrollbar or any vertical scrollable overflow is the bug. */
        const swept = [];
        const { box, ol } = build(700, false);
        for (let w = 192; w <= 1000; w += 3.7) {
          box.style.inlineSize = w + "px";
          const vBar = ol.offsetWidth - ol.clientWidth;
          const vOverflow = ol.scrollHeight - ol.clientHeight;
          if (vBar > 0 || vOverflow > 0) swept.push({ w: Math.round(w), vBar, vOverflow });
        }
        box.remove();

        const nav = build(700, true);
        const info = build(700, false);
        const link = nav.ol.querySelector("a");
        link.focus();
        const linkBox = link.getBoundingClientRect();
        const navBox = nav.ol.getBoundingClientRect();
        const vertical = document.getElementById("vertical");
        // Navigable and vertical: a ring to protect, but no clip to protect it
        // from. The padding is compensation, not decoration.
        const verticalLink = document.getElementById("vertical-link");

        return {
          verticalScrollHits: swept.length,
          sample: swept.slice(0, 4),
          overflowY: getComputedStyle(nav.ol).overflowY,
          navPadding: getComputedStyle(nav.ol).paddingBlock,
          infoPadding: getComputedStyle(info.ol).paddingBlock,
          // <= 0 means the whole ring sits inside the clip edge.
          ringBelowClipPx: Math.round((linkBox.bottom + RING_PX - navBox.bottom) * 100) / 100,
          // Focus must not have had to scroll the row to reveal the ring.
          navScrollTop: nav.ol.scrollTop,
          // The vertical orientation gives the scroll container back entirely,
          // so neither the clip nor the reserved padding reaches it.
          verticalOverflow: getComputedStyle(vertical).overflow,
          verticalPadding: getComputedStyle(vertical).paddingBlock,
          verticalLinkOverflow: getComputedStyle(verticalLink).overflow,
          verticalLinkPadding: getComputedStyle(verticalLink).paddingBlock,
        };
      `,
      );

      expect(result.overflowY).toBe("hidden");
      // Not one width, in any representation, wants to scroll vertically.
      expect(result.sample).toEqual([]);
      expect(result.verticalScrollHits).toBe(0);

      // The ring fits inside the clip, and focus did not have to scroll for it.
      expect(result.navPadding).toBe("4px");
      expect(result.ringBelowClipPx).toBeLessThanOrEqual(0);
      expect(result.navScrollTop).toBe(0);
      // An informational stepper has no ring to protect and keeps its height.
      expect(result.infoPadding).toBe("0px");

      expect(result.verticalOverflow).toBe("visible");
      expect(result.verticalPadding).toBe("0px");
      // Same for a navigable column: nothing clips it, so it reserves nothing.
      expect(result.verticalLinkOverflow).toBe("visible");
      expect(result.verticalLinkPadding).toBe("0px");
    },
    { artifactName: "steps-overflow" },
  );
});
