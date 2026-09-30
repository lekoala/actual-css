/*
 * CDN pin helpers shared by check:docs (the gate) and release (the writer).
 *
 * Snippets pin the release line (`actual-css@0.11`), not a patch or `@latest`:
 * before 1.0 a minor may break, so copied markup stays on the line it was
 * written for while patch fixes still reach it.
 */
export const CDN_PIN = /(?:cdn\.jsdelivr\.net\/npm|unpkg\.com)\/actual-css@([^/\s"'`)]+)/g;

/* `0.11.0` -> `0.11`: the pin granularity. */
export function minorOf(version) {
  return version.split(".").slice(0, 2).join(".");
}

/*
 * Pins accepted for a tree on `version`: the current minor and the next one.
 * The next-minor window lets the pin move before the version bump, so the
 * check stays green on both sides of a release commit.
 */
export function acceptedPins(version) {
  const [major, minor] = version.split(".").map(Number);
  return [`${major}.${minor}`, `${major}.${minor + 1}`];
}
