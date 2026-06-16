/*
 * Scrollspy — navigation that highlights the active section on scroll.
 *
 * Nav:    .scrollspy containing <a href="#section-id"> links
 * Target: elements referenced by the href fragments
 *
 * Uses IntersectionObserver. Falls back gracefully: links still work
 * even if IntersectionObserver isn't available.
 */

export function initScrollspy() {
  if (typeof IntersectionObserver === "undefined") return;

  const navs = document.querySelectorAll(".scrollspy");

  for (const nav of navs) {
    if (nav._ssInit) continue;
    nav._ssInit = true;

    const links = [...nav.querySelectorAll("a[href^='#']")];
    if (!links.length) continue;

    const sections = [];
    for (const link of links) {
      const id = link.getAttribute("href").slice(1);
      const section = document.getElementById(id);
      if (section) sections.push({ link, section });
    }
    if (!sections.length) continue;

    const observer = new IntersectionObserver(
      (entries) => {
        // find the first visible section (highest in the viewport)
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
      observer.observe(section);
    }
  }
}
