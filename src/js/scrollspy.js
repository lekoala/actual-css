/*
 * Scrollspy — navigation that highlights the active section on scroll.
 *
 * Nav:    .scrollspy containing <a href="#section-id"> links
 * Target: elements referenced by the href fragments
 *
 * Uses IntersectionObserver. Falls back gracefully: links still work
 * even if IntersectionObserver isn't available.
 *
 * Optional root: data-scrollspy-root="#scroll-container" observes section
 * visibility within a scroll container instead of the viewport.
 *
 * Self-registers via enhance: injected .scrollspy navs wire automatically.
 * Cleanup disconnects the IntersectionObserver and the small MutationObserver
 * that refreshes the link→section map as nav links or sections are injected.
 */

import enhance from "./enhance.js";

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

const navState = new WeakMap();

export function refreshScrollspy(nav) {
  navState.get(nav)?.rebuild();
}

function setupNav(nav) {
  if (typeof IntersectionObserver === "undefined") return;
  let io = null;
  let sections = [];
  let scheduled = false;

  function rebuild() {
    scheduled = false;
    io?.disconnect();
    sections = sectionsFor(nav);
    if (!sections.length) return;

    io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (!visible.length) return;

        const id = visible[0].target.id;
        for (const { link } of sections) {
          if (link.getAttribute("href") === `#${id}`) {
            link.setAttribute("aria-current", "location");
          } else {
            link.removeAttribute("aria-current");
          }
        }
      },
      {
        root: rootFor(nav),
        rootMargin: "-20% 0px -70% 0px",
        threshold: 0,
      },
    );

    for (const { section } of sections) {
      io.observe(section);
    }
  }

  function scheduleRebuild() {
    if (scheduled) return;
    scheduled = true;
    queueMicrotask(rebuild);
  }

  const mo = new MutationObserver(scheduleRebuild);
  mo.observe(nav, { childList: true, subtree: true });
  navState.set(nav, { rebuild: scheduleRebuild });

  rebuild();

  return () => {
    io?.disconnect();
    mo.disconnect();
    navState.delete(nav);
  };
}

enhance({
  ".scrollspy": setupNav,
});
