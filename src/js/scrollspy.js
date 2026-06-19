/*
 * Scrollspy — navigation that highlights the active section on scroll.
 *
 * Nav:    .scrollspy containing <a href="#section-id"> links
 * Target: elements referenced by the href fragments
 *
 * Uses IntersectionObserver. Falls back gracefully: links still work
 * even if IntersectionObserver isn't available.
 *
 * Self-registers via enhance: injected .scrollspy navs wire automatically.
 * Cleanup is the IntersectionObserver.disconnect() returned to enhance.
 * Root-level support: a nav's link→section map is built at connect time;
 * links added to an existing nav after connect are not picked up.
 */

import enhance from "./enhance.js";

function setupNav(nav) {
  const links = [...nav.querySelectorAll("a[href^='#']")];
  if (!links.length) return;

  const sections = [];
  for (const link of links) {
    const id = link.getAttribute("href").slice(1);
    const section = document.getElementById(id);
    if (section) sections.push({ link, section });
  }
  if (!sections.length) return;

  const io = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

      if (visible.length) {
        const id = visible[0].target.id;
        for (const { link } of sections) {
          if (link.getAttribute("href") === `#${id}`) {
            link.setAttribute("aria-current", "location");
          } else {
            link.removeAttribute("aria-current");
          }
        }
      }
    },
    { rootMargin: "-20% 0px -70% 0px", threshold: 0 },
  );

  for (const { section } of sections) {
    io.observe(section);
  }

  return () => io.disconnect();
}

if (typeof document !== "undefined" && typeof IntersectionObserver !== "undefined") {
  enhance({
    ".scrollspy": setupNav,
  });
}
