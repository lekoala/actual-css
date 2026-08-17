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
 * active section  = last section whose top <= activation line
 * scrolled to end = last section, whatever the line says
 * above the first = no active section
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

    // Scrolled to the end: the last section wins even when its top never
    // crosses the line. This is the case IntersectionObserver cannot express.
    if (scrollHeight > height && scrollTop + height >= scrollHeight - 1) {
      activate(sections[sections.length - 1].section);
      return;
    }

    const line = top + activationOffset(nav, height);
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
    measure();
  }

  // The scroll root (custom container or the document viewport) is resolved
  // once at connect and is stable for the lifetime of the connection; measure
  // still re-reads the current root element so a replaced *element* under a
  // stable container is handled, but swapping the container itself is out of
  // contract (re-inject the nav or call refreshScrollspy after such a move).
  const scrollTarget = rootFor(nav) ?? nav.ownerDocument.defaultView;
  scrollTarget?.addEventListener("scroll", () => schedule(), {
    passive: true,
    signal: controller.signal,
  });
  nav.ownerDocument.defaultView?.addEventListener("resize", () => schedule(), {
    passive: true,
    signal: controller.signal,
  });

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
