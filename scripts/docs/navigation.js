/*
 * Information architecture: reads docs/navigation.json and resolves pages to
 * their source files, output URLs, and prev/next ordering.
 */

import { readFileSync } from "node:fs";
import { join, posix } from "node:path";

export function loadNavigation(root) {
  const raw = JSON.parse(readFileSync(join(root, "docs", "navigation.json"), "utf8"));

  const groups = raw.groups.map((group) => ({
    title: group.title,
    slug: group.slug,
    pages: group.pages.map((slug) => ({ slug })),
  }));

  const flat = [];
  for (const group of groups) {
    for (const page of group.pages) {
      const entry = {
        group,
        groupTitle: group.title,
        groupSlug: group.slug,
        slug: page.slug,
        // This value is both a repository path and a URL suffix. Keep it
        // platform-neutral; filesystem consumers join it onto an absolute root.
        file: posix.join(group.slug, `${page.slug}.md`),
        url: `${group.slug}/${page.slug}.html`,
      };
      page.entry = entry;
      flat.push(entry);
    }
  }

  for (let i = 0; i < flat.length; i++) {
    flat[i].previous = i > 0 ? flat[i - 1] : null;
    flat[i].next = i < flat.length - 1 ? flat[i + 1] : null;
  }

  return { raw, groups, pages: flat };
}
