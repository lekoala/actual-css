import { afterEach, expect, test } from "bun:test";
import { cleanupDOM, nextMicrotask, setupDOM } from "./helpers/dom.js";
import { createLayout, nextFrame } from "./helpers/layout.js";

let importId = 0;

/*
 * Geometry, not IntersectionObserver. Sections sit at absolute offsets in a
 * 2000px document scrolled through a 600px viewport, so the default activation
 * line lands at 120px (20% of the root height).
 */
async function loadScrollspy(html, layoutOptions) {
  setupDOM(html);
  const layout = createLayout(layoutOptions);
  await import(`../src/js/scrollspy.js?test=${++importId}`);
  await nextFrame();
  return layout;
}

const currentLink = () =>
  document.querySelector("[aria-current='location']")?.getAttribute("href") ?? null;

const NAV = `
  <nav class="scrollspy" data-enhance="scrollspy">
    <a href="#alpha">Alpha</a>
    <a href="#beta">Beta</a>
    <a href="#gamma">Gamma</a>
  </nav>
  <section id="alpha"></section>
  <section id="beta"></section>
  <section id="gamma"></section>
`;

afterEach(() => {
  cleanupDOM();
});

test("no section is current while the page sits above the first one", async () => {
  const layout = await loadScrollspy(NAV);
  layout.placeAll({ alpha: 400, beta: 800, gamma: 1200 });

  await layout.scrollTo(0);

  expect(currentLink()).toBe(null);
});

test("the last section past the activation line wins when several share the viewport", async () => {
  const layout = await loadScrollspy(NAV);
  // At scrollTop 700 the viewport shows 700-1300: beta (top -100) and gamma
  // (top 300) are both visible, but only beta has crossed the 120px line.
  layout.placeAll({ alpha: 0, beta: 600, gamma: 1000 }, 400);

  await layout.scrollTo(700);
  expect(currentLink()).toBe("#beta");

  // Once gamma's top crosses the line too, it takes over.
  await layout.scrollTo(900);
  expect(currentLink()).toBe("#gamma");
});

test("a section shorter than the activation band still becomes current", async () => {
  const layout = await loadScrollspy(NAV);
  layout.placeAll({ alpha: 0, beta: 600, gamma: 900 });
  // beta is 40px tall — an IntersectionObserver band of -20%/-70% can step
  // straight over it between two frames.
  layout.place(document.getElementById("beta"), 600, 40);

  await layout.scrollTo(500);

  expect(currentLink()).toBe("#beta");
});

test("reaching the end of the document activates the last section", async () => {
  const layout = await loadScrollspy(NAV, { height: 600, scrollHeight: 2000 });
  // gamma starts at 1900, so its top never crosses the line: only the explicit
  // end-of-scroll case can select it.
  layout.placeAll({ alpha: 0, beta: 600, gamma: 1900 }, 100);

  await layout.scrollToEnd();

  expect(currentLink()).toBe("#gamma");
});

test("a scroll container is measured instead of the viewport", async () => {
  setupDOM(`
    <div id="scroller">
      <nav class="scrollspy" data-enhance="scrollspy" data-scrollspy-root="#scroller">
        <a href="#alpha">Alpha</a>
        <a href="#beta">Beta</a>
      </nav>
      <section id="alpha"></section>
      <section id="beta"></section>
    </div>
  `);
  const root = document.getElementById("scroller");
  const layout = createLayout({ height: 400, scrollHeight: 1600, root });
  await import(`../src/js/scrollspy.js?test=${++importId}`);
  await nextFrame();
  layout.placeAll({ alpha: 0, beta: 500 });

  await layout.scrollTo(450);

  expect(currentLink()).toBe("#beta");
});

test("data-scrollspy-offset moves the activation line", async () => {
  const layout = await loadScrollspy(`
    <nav class="scrollspy" data-enhance="scrollspy" data-scrollspy-offset="300">
      <a href="#alpha">Alpha</a>
      <a href="#beta">Beta</a>
    </nav>
    <section id="alpha"></section>
    <section id="beta"></section>
  `);
  layout.placeAll({ alpha: 0, beta: 600 });

  // At scrollTop 350 beta's top is 250: past the 300px line, and it would not
  // have crossed the 120px default — so this asserts the offset, not gravity.
  await layout.scrollTo(350);

  expect(currentLink()).toBe("#beta");
});

test("an unparseable offset falls back to the default band", async () => {
  const layout = await loadScrollspy(`
    <nav class="scrollspy" data-enhance="scrollspy" data-scrollspy-offset="banana">
      <a href="#alpha">Alpha</a>
      <a href="#beta">Beta</a>
    </nav>
    <section id="alpha"></section>
    <section id="beta"></section>
  `);
  layout.placeAll({ alpha: 0, beta: 600 });

  await layout.scrollTo(250);
  expect(currentLink()).toBe("#alpha");

  await layout.scrollTo(500);
  expect(currentLink()).toBe("#beta");
});

test("a percentage offset resolves against the root height on every measurement", async () => {
  const layout = await loadScrollspy(
    `
    <nav class="scrollspy" data-enhance="scrollspy" data-scrollspy-offset="50%">
      <a href="#alpha">Alpha</a>
      <a href="#beta">Beta</a>
    </nav>
    <section id="alpha"></section>
    <section id="beta"></section>
  `,
    { height: 600, scrollHeight: 2000 },
  );
  layout.placeAll({ alpha: 0, beta: 600 });

  // 50% of 600 = 300, and beta's top is at 320: not current yet.
  await layout.scrollTo(280);
  expect(currentLink()).toBe("#alpha");

  // 50% of 800 = 400 with no rebuild: the line now reaches beta.
  await layout.resize(800);
  expect(currentLink()).toBe("#beta");
});

test("injected nav links join the map", async () => {
  const layout = await loadScrollspy(`
    <nav class="scrollspy" data-enhance="scrollspy">
      <a href="#alpha">Alpha</a>
    </nav>
    <section id="alpha"></section>
    <section id="beta"></section>
  `);
  const nav = document.querySelector("nav");
  layout.placeAll({ alpha: 0, beta: 600 });

  nav.insertAdjacentHTML("beforeend", '<a href="#beta">Beta</a>');
  await nextMicrotask();
  await nextFrame();

  await layout.scrollTo(700);

  expect(currentLink()).toBe("#beta");
});

test("mutations outside the nav do not disturb the current section", async () => {
  const layout = await loadScrollspy(`
    <nav class="scrollspy" data-enhance="scrollspy">
      <a href="#alpha">Alpha</a>
      <a href="#beta">Beta</a>
    </nav>
    <section id="alpha"></section>
    <section id="beta"></section>
    <aside></aside>
  `);
  layout.placeAll({ alpha: 0, beta: 600 });

  await layout.scrollTo(700);
  expect(currentLink()).toBe("#beta");

  document.querySelector("aside").insertAdjacentHTML("beforeend", "<p>Unrelated</p>");
  await nextMicrotask();
  await nextFrame();

  expect(currentLink()).toBe("#beta");
});

test("removing the nav stops the listeners", async () => {
  const layout = await loadScrollspy(NAV);
  const nav = document.querySelector("nav");
  layout.placeAll({ alpha: 0, beta: 600, gamma: 1200 });

  await layout.scrollTo(700);
  expect(currentLink()).toBe("#beta");

  nav.remove();
  await nextMicrotask();

  // Nothing throws, and no handler keeps writing to the detached links.
  await layout.scrollTo(1300);
  expect(document.querySelector("[aria-current='location']")).toBe(null);
});

test("a nav with no resolvable sections stays inert", async () => {
  const layout = await loadScrollspy(`
    <nav class="scrollspy" data-enhance="scrollspy">
      <a href="#missing">Missing</a>
      <a href="/elsewhere">External</a>
    </nav>
  `);

  await layout.scrollTo(400);

  expect(currentLink()).toBe(null);
});
