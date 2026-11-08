/*
 * Docs navigation: groups own the URLs, destinations only present them.
 * Every group sits in exactly one destination, reading order follows the
 * destinations, and the header marks the destination holding the page.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { destinationIssues, loadNavigation } from "../scripts/docs/navigation.js";
import {
  expandPageIndexes,
  renderDestinations,
  renderNavGroups,
} from "../scripts/docs/templates.js";

const navigation = loadNavigation(join(import.meta.dir, ".."));

describe("destinations", () => {
  it("accepts the committed navigation", () => {
    expect(destinationIssues(navigation.raw)).toEqual([]);
  });

  it("names a group that is missing, duplicated or unknown", () => {
    const raw = {
      groups: [{ slug: "a" }, { slug: "b" }, { slug: "c" }],
      destinations: [
        { title: "One", groups: ["a", "x"] },
        { title: "Two", groups: ["a"] },
      ],
    };
    expect(destinationIssues(raw)).toEqual([
      'destination "One" lists unknown group "x"',
      'group "a" is in both "One" and "Two" destinations',
      'group "b" is in no destination',
      'group "c" is in no destination',
    ]);
  });

  it("keeps URLs on the group and reading order on the destinations", () => {
    for (const page of navigation.pages) {
      expect(page.url).toBe(`${page.groupSlug}/${page.slug}.html`);
    }
    // Prev/next never leaves a destination and comes back to it.
    const order = navigation.pages.map((page) => page.destination.title);
    const seen = new Set();
    for (const [i, title] of order.entries()) {
      if (i > 0 && title !== order[i - 1]) {
        expect(seen.has(title)).toBe(false);
      }
      seen.add(title);
    }
  });
});

describe("rendering", () => {
  const rating = navigation.pages.find((page) => page.url === "components/rating.html");
  const intro = navigation.pages.find((page) => page.url === "guides/introduction.html");

  it("marks the destination holding the page, and its own first page as the page", () => {
    const header = renderDestinations(navigation, rating);
    expect(header).toContain('aria-current="true">Components</a>');
    expect(header.match(/aria-current/g)).toHaveLength(1);
    expect(renderDestinations(navigation, intro)).toContain('aria-current="page">Get started</a>');
    expect(renderDestinations(navigation, null)).not.toContain("aria-current");
  });

  it("lists only the current destination's groups in the sidebar", () => {
    const sidebar = renderNavGroups(rating);
    expect(sidebar).toContain('<summary class="nav-link">Patterns</summary>');
    expect(sidebar).toContain('href="segmented.html"');
    expect(sidebar).not.toContain("forms/");
    expect(renderNavGroups(null)).toBe("");
  });

  it("opens Components on its overview", () => {
    const components = navigation.destinations.find((d) => d.title === "Components");
    expect(components.home.url).toBe("components/overview.html");
  });
});

describe("page indexes", () => {
  const overview = navigation.pages.find((page) => page.url === "components/overview.html");

  it("expands a group into one card per page, overviews skipped, links relative", () => {
    const html = expandPageIndexes("<!--docs-index:patterns-->", navigation, overview);
    const patterns = navigation.groups.find((group) => group.slug === "patterns");
    expect(html.match(/docs-component-card/g)).toHaveLength(patterns.pages.length - 1);
    expect(html).toContain('href="../patterns/stat.html"');
    expect(html).not.toContain("patterns/overview.html");
  });

  // The first paragraph is the page's description on cards and in search; a
  // module import note there showed "Module — import …" as the summary.
  it("never opens a page on its module note", () => {
    for (const page of navigation.pages) {
      const markdown = readFileSync(
        join(import.meta.dir, "..", "docs", "pages", page.file),
        "utf8",
      );
      expect(markdown, page.file).not.toMatch(/^# .+\n+> \*\*Module\*\*/);
    }
  });

  it("names an unknown group", () => {
    expect(() => expandPageIndexes("<!--docs-index:nope-->", navigation, overview)).toThrow(
      'docs-index names unknown group "nope"',
    );
  });
});
