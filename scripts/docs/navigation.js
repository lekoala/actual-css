/*
 * Information architecture: reads docs/navigation.json and resolves pages to
 * their source files, output URLs, and prev/next ordering.
 *
 * Two layers. Groups are the URL source: a page lives at
 * `<group slug>/<page slug>.html`, so moving a page between groups breaks its
 * links and search entries. Destinations are presentation only: the header,
 * sidebar and drawer sections, each a list of group slugs. Regrouping the
 * menu edits destinations and never changes a URL.
 */

import { readFileSync } from "node:fs";
import { join, posix } from "node:path";

/** Every group must sit in exactly one destination, and every slug must exist. */
export function destinationIssues(raw) {
  const issues = [];
  const known = new Set(raw.groups.map((group) => group.slug));
  const owner = new Map();
  for (const destination of raw.destinations ?? []) {
    for (const slug of destination.groups) {
      if (!known.has(slug)) {
        issues.push(`destination "${destination.title}" lists unknown group "${slug}"`);
      } else if (owner.has(slug)) {
        issues.push(
          `group "${slug}" is in both "${owner.get(slug)}" and "${destination.title}" destinations`,
        );
      } else {
        owner.set(slug, destination.title);
      }
    }
  }
  for (const slug of known) {
    if (!owner.has(slug)) issues.push(`group "${slug}" is in no destination`);
  }
  return issues;
}

export function loadNavigation(root) {
  const raw = JSON.parse(readFileSync(join(root, "docs", "navigation.json"), "utf8"));

  // A group outside every destination would drop its pages from the site.
  const issues = destinationIssues(raw);
  if (issues.length > 0) {
    throw new Error(`docs/navigation.json destinations:\n  ${issues.join("\n  ")}`);
  }

  const groupsBySlug = new Map(
    raw.groups.map((group) => [
      group.slug,
      { title: group.title, slug: group.slug, pages: group.pages.map((slug) => ({ slug })) },
    ]),
  );

  const destinations = raw.destinations.map((destination) => {
    const entry = {
      title: destination.title,
      icon: destination.icon,
      groups: destination.groups.map((slug) => groupsBySlug.get(slug)),
    };
    for (const group of entry.groups) group.destination = entry;
    return entry;
  });

  // Reading order follows the destinations, so prev/next never leaves one
  // section for another and comes back.
  const groups = destinations.flatMap((destination) => destination.groups);

  const flat = [];
  for (const group of groups) {
    for (const page of group.pages) {
      const entry = {
        group,
        groupTitle: group.title,
        groupSlug: group.slug,
        destination: group.destination,
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

  // A destination opens on its first page.
  for (const destination of destinations) destination.home = destination.groups[0].pages[0].entry;

  return { raw, destinations, groups, pages: flat };
}
