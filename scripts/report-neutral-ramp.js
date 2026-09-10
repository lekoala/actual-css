/*
 * Non-blocking survey of the neutral ramp across the default theme and the
 * shipped presets.
 *
 * Analysis only — this tool answers a design question, it gates nothing and
 * exits 0 whatever it finds. The question: does Actual's neutral ramp follow a
 * common shape that a theme-authoring tool could generate, or are the presets
 * curated palettes whose only stable property is ordinal?
 *
 * It must stay a report. Departing from the trend is a legitimate palette
 * decision — forest, cyberpunk and neon put their neutrals well off the
 * primary's hue on purpose — so promoting any figure here to a check would
 * fail themes that are working as designed.
 *
 * For every neutral role, in light and dark, it reports:
 *   L, C, h      OKLCH of the resolved token
 *   paper        the scheme as measured; "dark*" marks a natively dark preset
 *                that ships no light-dark() pair
 *   dh           hue distance to --primary, marked "~" below CHROMA_EPSILON.
 *                Hue deltas on near-achromatic colors are descriptive only:
 *                the angle stays computable but loses perceptual meaning and
 *                swings on small channel differences. Read dh together with
 *                C, never on its own, and do not aggregate it into a claim
 *                that ignores chroma
 *   C/Cp         chroma as a share of the primary's — the "temperature dose"
 *   dL           OKLCH lightness minus that of the achromatic gray with the
 *                same WCAG relative luminance, i.e. what the tint costs (or
 *                gains) in perceived lightness at equal contrast
 *
 * Roles are printed lightest-first so the chroma column reads as a curve, and
 * a per-island line reports whether the arch holds: chroma rising off the
 * paper through the structural roles, then falling again at the extreme ink.
 *
 * Usage: bun run report:neutral-ramp
 */

import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fixtureUrl, withBrowserPage } from "./utils/browser.js";

const ROOT = join(import.meta.dirname, "..");
const THEMES_DIR = join(ROOT, "src", "css", "themes");
const OUT_HTML = join(ROOT, "tmp", "neutral-ramp.html");

/* Below this OKLCH chroma a hue reading is noise, not a design decision. */
const CHROMA_EPSILON = 0.01;

/* Lightest-first; `surface` is the paper every other role is judged against. */
const ROLES = [
  "surface",
  "surface-raised",
  "surface-subtle",
  "border",
  "text-subtle",
  "text-muted",
  "neutral",
  "text",
];

/* The shape under test is an arch on the paper -> ink axis, not a slope:
   chroma climbs off the paper through the structural roles, then falls again
   at the extreme ink. Both halves are checked separately, and `surface` is
   read as the paper whether the theme is light or dark. */
const ARCH = {
  rise: ["surface", "surface-subtle", "border"],
  fall: ["text", "text-muted"],
};

const toLinear = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const luminance = ([r, g, b]) => {
  const [x, y, z] = [r, g, b].map((v) => toLinear(v / 255));
  return 0.2126 * x + 0.7152 * y + 0.0722 * z;
};

function oklch([r, g, b]) {
  const [lr, lg, lb] = [r, g, b].map((v) => toLinear(v / 255));
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return { L, C: Math.hypot(a, bb), h: ((Math.atan2(bb, a) * 180) / Math.PI + 360) % 360 };
}

const hueDistance = (a, b) => {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
};

/* OKLCH lightness of the achromatic gray carrying `target` relative luminance.
   Bisection on the sRGB channel: relative luminance is monotonic in it. */
function grayLightnessAt(target) {
  let lo = 0;
  let hi = 255;
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    if (luminance([mid, mid, mid]) < target) lo = mid;
    else hi = mid;
  }
  const v = (lo + hi) / 2;
  return oklch([v, v, v]).L;
}

const themes = readdirSync(THEMES_DIR)
  .filter((file) => /^[a-z-]+\.css$/.test(file) && file !== "index.css")
  .map((file) => {
    const css = readFileSync(join(THEMES_DIR, file), "utf8");
    return { name: file.replace(".css", ""), hasDark: /light-dark\(/.test(css) };
  });

/* The default theme is the reference the presets are read against, so it is
   surveyed as a bare island with no data-theme name. */
const surveyed = [
  { name: "(default)", attr: "", hasDark: true },
  ...themes.map((t) => ({ ...t, attr: ` data-theme="${t.name}"` })),
];

const island = (theme, scheme) =>
  `<div${theme.attr} style="color-scheme: ${scheme}" id="island-${theme.name.replace(/[()]/g, "")}-${scheme}">
    ${["primary", ...ROLES].map((role) => `<span data-role="${role}" style="color: var(--${role})"></span>`).join("")}
  </div>`;

const page = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Neutral ramp report</title>
  <link rel="stylesheet" href="../src/css/actual.full.css">
  ${themes.map((t) => `<link rel="stylesheet" href="../src/css/themes/${t.name}.css">`).join("\n  ")}
</head>
<body>
${surveyed.map((t) => island(t, "light") + (t.hasDark ? island(t, "dark") : "")).join("\n  ")}
</body>
</html>
`;

mkdirSync(join(ROOT, "tmp"), { recursive: true });
writeFileSync(OUT_HTML, page);

await withBrowserPage(
  fixtureUrl(OUT_HTML),
  async (view) => {
    const readIsland = (id) =>
      view.evaluate(`(() => {
        const c = document.createElement("canvas");
        c.width = c.height = 1;
        const x = c.getContext("2d", { willReadFrequently: true });
        const out = {};
        for (const el of document.getElementById("${id}").querySelectorAll("[data-role]")) {
          x.clearRect(0, 0, 1, 1);
          x.fillStyle = getComputedStyle(el).color;
          x.fillRect(0, 0, 1, 1);
          out[el.dataset.role] = [...x.getImageData(0, 0, 1, 1).data.slice(0, 3)];
        }
        return out;
      })()`);

    const rows = [];
    const arch = [];
    console.log("Neutral ramp survey — analysis only, no gate.");
    console.log(
      `Hue distance marked "~" below C ${CHROMA_EPSILON}: descriptive only, read it together with C.\n`,
    );
    console.log("theme        paper   role              L        C      dh     C/Cp     dL");

    for (const theme of surveyed) {
      for (const scheme of theme.hasDark ? ["light", "dark"] : ["light"]) {
        const rgb = await readIsland(`island-${theme.name.replace(/[()]/g, "")}-${scheme}`);
        const primary = oklch(rgb.primary);
        /* A theme with no light-dark() pair gets one island, and that island
           is requested as `light` — but a natively dark preset paints dark
           paper there. Label by the paper actually measured, not by request. */
        const paper = theme.hasDark ? scheme : oklch(rgb.surface).L < 0.5 ? "dark*" : "light";
        for (const role of ROLES) {
          const t = oklch(rgb[role]);
          const dL = t.L - grayLightnessAt(luminance(rgb[role]));
          const faint = t.C < CHROMA_EPSILON;
          const dh = `${faint ? "~" : " "}${hueDistance(t.h, primary.h).toFixed(0).padStart(3)}`;
          const share = primary.C > 0.001 ? (t.C / primary.C).toFixed(2).padStart(5) : "    -";
          console.log(
            `${theme.name.padEnd(11)}  ${paper.padEnd(6)}  ${role.padEnd(15)} ${(t.L * 100).toFixed(1).padStart(5)}%  ${t.C.toFixed(4)}  ${dh}  ${share}  ${(dL * 100).toFixed(2).padStart(6)}`,
          );
          rows.push({
            theme: theme.name,
            scheme,
            role,
            ...t,
            dL,
            dh: hueDistance(t.h, primary.h),
            share: primary.C > 0.001 ? t.C / primary.C : null,
          });
        }
        const chroma = (role) =>
          rows.find((r) => r.theme === theme.name && r.scheme === scheme && r.role === role).C;
        const monotonic = (roles) =>
          roles.every((role, i) => i === 0 || chroma(role) >= chroma(roles[i - 1]));
        const verdict = (roles) =>
          `${roles.join(" <= ")}: ${monotonic(roles) ? "holds" : "BROKEN"}`;
        console.log(`${"".padEnd(21)}  arch rise ${verdict(ARCH.rise)}`);
        console.log(`${"".padEnd(21)}  arch fall ${verdict(ARCH.fall)}\n`);
        arch.push({
          theme: theme.name,
          scheme,
          paper,
          rise: monotonic(ARCH.rise),
          fall: monotonic(ARCH.fall),
        });
      }
    }

    const failed = arch.filter((a) => !a.rise || !a.fall);
    console.log("=== arch shape ===");
    console.log(
      `rise (paper -> border) holds on ${arch.filter((a) => a.rise).length}/${arch.length} islands`,
    );
    console.log(
      `fall (text <= text-muted) holds on ${arch.filter((a) => a.fall).length}/${arch.length} islands`,
    );
    if (failed.length > 0)
      console.log(
        `exceptions: ${failed.map((a) => `${a.theme}/${a.scheme}${a.rise ? "" : " rise"}${a.fall ? "" : " fall"}`).join(", ")}`,
      );

    /* The two candidate generator inputs, side by side: absolute chroma per
       role, and chroma as a share of the primary's. Whichever spreads less is
       the quantity a theme actually holds steady. */
    const spread = (values) => {
      const v = [...values].sort((x, y) => x - y);
      return { min: v[0], med: v[Math.floor(v.length / 2)], max: v.at(-1) };
    };
    console.log("\n=== per role: absolute chroma vs share of --primary ===");
    console.log("role             C min  C med  C max    |  C/Cp min    med    max");
    for (const role of ROLES) {
      const mine = rows.filter((r) => r.role === role);
      const abs = spread(mine.map((r) => r.C));
      const rel = spread(mine.filter((r) => r.share !== null).map((r) => r.share));
      console.log(
        `${role.padEnd(15)} ${abs.min.toFixed(4)} ${abs.med.toFixed(4)} ${abs.max.toFixed(4)}  | ${rel.min.toFixed(2).padStart(8)} ${rel.med.toFixed(2).padStart(6)} ${rel.max.toFixed(2).padStart(6)}`,
      );
    }

    /* Peak neutral chroma sorts the presets into bands; the widest hue
       distance among the roles that carry enough chroma to have a hue says
       whether the ramp leans on the primary at all. */
    /* `--neutral` is an intent that happens to be named neutral: it is a
       curated chromatic color, not a rung of the ramp, so it is left out of
       the shape read. The paper roles are the ramp's endpoint, not a rung. */
    const RAMP = ["surface-subtle", "border", "text-subtle", "text-muted", "text"];
    const band = (peak) =>
      peak < 0.008 ? "mono" : peak < 0.02 ? "muted" : peak < 0.04 ? "tinted" : "vivid";
    console.log("\n=== per island: where the ramp's chroma peaks, and its hue coherence ===");
    console.log("theme        paper   peak C   at role          L     band     max dh");
    for (const { theme, scheme, paper } of arch) {
      const mine = rows.filter(
        (r) => r.theme === theme && r.scheme === scheme && RAMP.includes(r.role),
      );
      const top = mine.reduce((best, r) => (r.C > best.C ? r : best));
      const hued = mine.filter((r) => r.C >= CHROMA_EPSILON);
      const maxDh =
        hued.length > 0
          ? `${Math.max(...hued.map((r) => r.dh))
              .toFixed(0)
              .padStart(3)}`
          : "  - achromatic";
      console.log(
        `${theme.padEnd(11)}  ${paper.padEnd(6)}  ${top.C.toFixed(4)}   ${top.role.padEnd(15)} ${(top.L * 100).toFixed(0).padStart(3)}%   ${band(top.C).padEnd(7)} ${maxDh}`,
      );
    }
  },
  { artifactName: "neutral-ramp" },
);
