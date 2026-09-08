/*
 * `{ public, internal, plumbing }` from every "Public hooks:" /
 * "Framework plumbing:" / "Internal:" block in a CSS file, used by the CSS API
 * contract check and by the component catalog generator.
 *
 * A section ends at the next label-like line ("Child contract:",
 * "JS target contract:" — a label with a trailing colon). Lines without one
 * ("Intent boundary —" has no colon) stay in the active section.
 */

export function parseHookSections(css) {
  const sections = { public: [], internal: [], plumbing: [] };
  for (const block of css.matchAll(/\/\*[\s\S]*?\*\//g)) {
    let active = null;
    for (const rawLine of block[0].split("\n")) {
      const line = rawLine
        .trim()
        .replace(/^\*\s?/, "")
        .trim();
      if (/^Public hooks:$/.test(line)) {
        active = "public";
        continue;
      }
      if (/^Framework plumbing:$/.test(line)) {
        active = "plumbing";
        continue;
      }
      if (/^Internal:$/.test(line)) {
        active = "internal";
        continue;
      }
      if (active && /^[A-Za-z][A-Za-z -]*:$/.test(line)) {
        active = null; // next section (e.g. "Child contract:")
        continue;
      }
      if (active) {
        const hook = line.match(/--[a-z0-9-]+/);
        if (hook) sections[active].push(hook[0]);
      }
    }
  }
  return sections;
}
