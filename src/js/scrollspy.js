/*
 * Scrollspy — navigation that highlights the active section on scroll.
 *
 * Nav:    [data-enhance="scrollspy"] containing <a href="#section-id"> links
 * Target: elements referenced by the href fragments
 *
 * Deterministic geometry, not IntersectionObserver: on each scroll (throttled
 * with requestAnimationFrame) the active section is the last one whose top has
 * crossed an activation line. An IntersectionObserver reports *which* sections
 * intersect, not which one is current, so it has to guess whenever several
 * share the viewport — and guesses wrong for sections shorter than the band.
 *
 * activation line = root top + offset      (default 20% of the root's height)
 * near scroll end = line advances to the root bottom over the last viewport
 * active section  = last section whose top <= activation line
 * scrolled to end = last section, whatever the line says
 * above the first = no active section
 * followed link   = its section, until the next scroll input
 *                   (wheel, touch, key, pointer); the line then starts
 *                   between that heading and the next and fades back
 *
 * Optional root: data-scrollspy-root="#scroll-container" measures against a
 * scroll container instead of the viewport.
 * Optional offset: data-scrollspy-offset="24" | "24px" | "20%" moves the
 * activation line. Invalid values fall back to 20%; negatives clamp to 0.
 *
 * Self-registers via registerEnhancement: injected navs wire automatically.
 * Cleanup removes the scroll/resize listeners and the small MutationObserver
 * that refreshes the link->section map as nav links are injected. New sections
 * outside the nav subtree are not observed — call refreshScrollspy(nav) after
 * those mutations.
 *
 * The .scrollspy class alone still gives :target-current behavior via CSS —
 * a documented no-JS mode, not a fallback remark.
 */

import { registerEnhancement } from "./enhance.js";

const DEFAULT_OFFSET_RATIO = 0.2;
const navState = new WeakMap();

function rootFor(nav) {
  const selector = nav.getAttribute("data-scrollspy-root");
  if (!selector) return null;

  try {
    return nav.ownerDocument.querySelector(selector);
  } catch {
    return null;
  }
}

function sectionsFor(nav) {
  const links = [...nav.querySelectorAll("a[href^='#']")];
  const sections = [];

  for (const link of links) {
    const id = link.getAttribute("href").slice(1);
    const section = id ? nav.ownerDocument.getElementById(id) : null;
    if (section) sections.push({ link, section });
  }

  return sections;
}

/*
 * Viewport-relative measurements for either scroll root. The window branch
 * reads documentElement rather than a captured window so a nav in another
 * document measures its own root — same reason surface.js resolves
 * ownerDocument instead of binding at import time.
 */
function measureRoot(nav, root) {
  if (root) {
    return {
      top: root.getBoundingClientRect().top,
      height: root.clientHeight,
      scrollTop: root.scrollTop,
      scrollHeight: root.scrollHeight,
    };
  }

  // scrollingElement is the real scroll container in standards mode; fall
  // back to documentElement (quirks mode, or older engines without it).
  const doc = nav.ownerDocument;
  const el = doc.scrollingElement || doc.documentElement;
  return {
    top: 0,
    height: el.clientHeight,
    scrollTop: el.scrollTop,
    scrollHeight: el.scrollHeight,
  };
}

/*
 * "24" and "24px" are pixels, "20%" is a share of the root's visible height.
 * Percentages resolve per measurement, so a resize needs no rebuild.
 */
function activationOffset(nav, height) {
  const raw = (nav.getAttribute("data-scrollspy-offset") ?? "").trim();
  if (!raw) return height * DEFAULT_OFFSET_RATIO;

  const value = Number.parseFloat(raw);
  if (!Number.isFinite(value)) return height * DEFAULT_OFFSET_RATIO;

  return Math.max(0, raw.endsWith("%") ? (height * value) / 100 : value);
}

function setupNav(nav) {
  const controller = new AbortController();
  let sections = [];
  let frame = 0;
  let current;
  // A followed link bends the activation line to sit between its heading and
  // the next: { section, held, scrollTop, remaining, floor, delta }. Held until
  // the next scroll input, then faded; floor is where the upward fade ends.
  let anchor = null;

  function activate(section) {
    if (section === current) return;
    current = section;

    for (const entry of sections) {
      if (entry.section === section) {
        entry.link.setAttribute("aria-current", "location");
      } else {
        entry.link.removeAttribute("aria-current");
      }
    }
  }

  function measure() {
    frame = 0;
    if (!sections.length) return;

    const root = rootFor(nav);
    const { top, height, scrollTop, scrollHeight } = measureRoot(nav, root);
    const offset = activationOffset(nav, height);
    // A fixed line followed by an end-of-scroll jump can skip whole sections
    // on a tall viewport. Advance continuously through the final viewport of
    // scroll travel so each intervening heading can become current first.
    const remaining = scrollHeight - height - scrollTop;
    const progress = height > 0 ? Math.max(0, Math.min(1, 1 - remaining / height)) : 0;
    let line = top + offset + Math.max(0, height - offset) * progress;

    // A followed link names its section outright. Near the end of the page
    // the browser cannot scroll that heading up to the line, so geometry
    // alone would keep a later section. While held (through a smooth scroll
    // on the way there), the bend is recomputed at each position.
    if (anchor?.held) {
      const index = sections.findIndex(({ section }) => section === anchor.section);
      const next = sections[index + 1]?.section;
      const low = anchor.section.getBoundingClientRect().top;
      const high = next ? next.getBoundingClientRect().top - 1 : Infinity;
      Object.assign(anchor, {
        scrollTop,
        remaining,
        floor: Math.max(0, scrollTop - height),
        delta: Math.min(Math.max(line, low), high) - line,
      });
      line += anchor.delta;
    } else if (anchor) {
      // Released, the bend fades over the scroll travel left in each
      // direction: down to the end of the content, up to one viewport above
      // the release. Scrolling on then walks the neighbouring sections in
      // order instead of jumping to whatever the unbent line picks there.
      // Re-based on every measure, so it only ever shrinks: coming back to the
      // release position does not bend the line again.
      const travel = scrollTop - anchor.scrollTop;
      const span = travel > 0 ? anchor.remaining : anchor.scrollTop - anchor.floor;
      const delta = span > 0 ? anchor.delta * Math.max(0, 1 - Math.abs(travel) / span) : 0;
      // Negated so NaN drops too: a pin released before its first measure.
      if (!(Math.abs(delta) >= 0.5)) anchor = null;
      else {
        line += delta;
        anchor = { ...anchor, scrollTop, remaining, delta };
      }
    }

    // Scrolled to the end: the last section wins even when its top never
    // crosses the line. This is the case IntersectionObserver cannot express.
    if (!anchor && scrollHeight > height && remaining <= 1) {
      activate(sections.at(-1).section);
      return;
    }

    let active = null;
    for (const { section } of sections) {
      if (section.getBoundingClientRect().top <= line) active = section;
    }

    activate(active);
  }

  function schedule(run = measure) {
    if (frame) cancelAnimationFrame(frame);
    frame = requestAnimationFrame(run);
  }

  function rebuild() {
    sections = sectionsFor(nav);
    current = undefined;
    anchor = null;
    measure();
  }

  function pin(link) {
    const entry = sections.find((candidate) => candidate.link === link);
    if (!entry) return;
    anchor = { section: entry.section, held: true };
    schedule();
  }

  // The scroll root is resolved once when the enhancement connects, and the
  // scroll listener stays on it. Changing data-scrollspy-root or replacing its
  // target is outside the connection contract; recreate the enhancement with
  // the new markup. refreshScrollspy() only rebuilds the link->section map.
  const scrollTarget = rootFor(nav) ?? nav.ownerDocument.defaultView;
  scrollTarget?.addEventListener("scroll", () => schedule(), {
    passive: true,
    signal: controller.signal,
  });
  nav.ownerDocument.defaultView?.addEventListener("resize", () => schedule(), {
    passive: true,
    signal: controller.signal,
  });

  const doc = nav.ownerDocument;
  nav.addEventListener("click", (event) => pin(event.target.closest?.("a[href^='#']")), {
    signal: controller.signal,
  });
  // Another in-page link, or history navigation, to one of the sections.
  doc.defaultView?.addEventListener(
    "hashchange",
    () => pin(sections.find(({ link }) => link.hash === doc.location.hash)?.link),
    { signal: controller.signal },
  );
  // Scroll input, not the scroll event: the navigation itself scrolls. Capture
  // runs before the click that may pin again (pointerdown, Enter on a link).
  for (const type of ["wheel", "touchstart", "keydown", "pointerdown"]) {
    doc.addEventListener(
      type,
      () => {
        // No measure here: the scroll this input causes runs it.
        if (anchor) anchor.held = false;
      },
      { capture: true, passive: true, signal: controller.signal },
    );
  }

  // Observer is scoped to the nav subtree — link injection is caught;
  // section-only DOM mutations elsewhere need an explicit refreshScrollspy().
  const mo = new MutationObserver(() => schedule(rebuild));
  mo.observe(nav, { childList: true, subtree: true });
  navState.set(nav, { rebuild });

  rebuild();

  return () => {
    controller.abort();
    if (frame) cancelAnimationFrame(frame);
    mo.disconnect();
    navState.delete(nav);
  };
}

export function refreshScrollspy(nav) {
  navState.get(nav)?.rebuild();
}

registerEnhancement("scrollspy", setupNav);
