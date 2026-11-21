/*
 * Composition weight report: what a page built with Actual CSS pays, by
 * composition and by JS profile. Report only, never a gate — build:size owns
 * the budgets.
 *
 * Usage: bun run report:composition [--ref <manifest.json>] [--no-timing]
 *
 * build:size answers "did the framework grow?"; this answers "what does an
 * application built with it pay?", the lightness that matters to an adopter:
 * a rich framework is fine as long as a simple page does not load all of it.
 *
 * --ref adds another library as a reference column. The repository holds no
 * copy of it and no knowledge of it: the manifest, kept beside a local copy
 * of the library (in tmp/, say), maps this report's component and profile
 * ids to that library's files, paths relative to the manifest:
 *
 *   {
 *     "name": "Lib 1.0",
 *     "shipped": { "css": "lib.min.css", "js": "lib.min.js" },
 *     "foundation": ["css/base.css"],
 *     "css": { "button": ["css/button.css"], ... },
 *     "js": { "tab": ["js/tabs.js"], "dialog": [], ... },
 *     "fullJs": ["js/index.js"]
 *   }
 *
 * An id the manifest leaves out has no counterpart and drops out of the
 * matched scope; an empty JS list means the library ships no script for it.
 * Pairs are close in purpose, not identical in behavior: read ratios as a
 * signal, absolute bytes as the cost.
 *
 * Both sides go through the same minifier (src/tooling minifyCss for CSS,
 * Bun's for JS) and the same compressors (gzip 9, brotli default); the
 * reference's shipped files, when named, are a check on that parity. Actual is
 * measured from src/, so the working tree is what is reported.
 *
 * Timing: parse plus import-time execution of each JS profile, in a fresh
 * iframe of headless Chrome under 4x CPU throttling, median of 9 runs. A
 * unique trailing comment defeats the compilation cache between runs. The
 * figure is indicative (machine-dependent); compare profiles within a run.
 */
import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { brotliCompressSync, gzipSync } from "node:zlib";
import { inlineImports, minifyCss } from "../src/tooling/css-bundle.js";
import { browserAvailable, readFlags, withBrowserPage } from "./utils/browser.js";

const ROOT = join(import.meta.dirname, "..");
const SRC_CSS = join(ROOT, "src", "css");

const flags = readFlags(process.argv.slice(2), {
  "--ref": { fallback: undefined },
  "--no-timing": { boolean: true },
});
const timing = !flags["--no-timing"];

let REF = null;
if (flags["--ref"]) {
  const file = resolve(flags["--ref"]);
  REF = { ...JSON.parse(await readFile(file, "utf8")), dir: dirname(file) };
}
const refPath = (p) => join(REF.dir, p);

const measure = (text) => {
  const buf = Buffer.from(text);
  return {
    min: buf.length,
    gzip: gzipSync(buf, { level: 9 }).length,
    brotli: brotliCompressSync(buf).length,
  };
};

// An adopter's composed entry: the core once, then the families or files.
const actualCss = async (files) =>
  minifyCss((await Promise.all(files.map((f) => inlineImports(join(SRC_CSS, f))))).join("\n"));

const refCss = async (files) =>
  minifyCss((await Promise.all(files.map((f) => readFile(refPath(f), "utf8")))).join("\n"));

/* ── CSS scope ─────────────────────────────────────────────────────────── */

const FOUNDATION = ["actual.css"];

// Component id -> the Actual files that cover it. The ids are the vocabulary
// a reference manifest maps onto its own files.
const COMPONENTS = {
  accordion: ["components/accordion.css"],
  alert: ["components/alert.css"],
  avatar: ["components/avatar.css"],
  badge: ["components/badge.css"],
  button: ["components/button.css", "components/close.css"],
  card: ["components/card.css"],
  dialog: ["components/modal.css"],
  dropdown: ["components/flyout.css", "components/menu.css"],
  form: ["forms/base.css", "forms/switch.css", "forms/range.css"],
  grid: ["layout/grid.css"],
  progress: ["components/progress.css", "components/meter.css"],
  sidebar: ["layout/sidebar-shell.css", "components/navbar.css", "components/drawer.css"],
  skeleton: ["components/skeleton.css"],
  spinner: ["components/spinner.css"],
  table: ["components/table.css"],
  tabs: ["components/tab.css", "components/segmented.css"],
  status: ["components/status-bar.css"],
  tooltip: ["components/tooltip.css"],
  utilities: ["utilities/base.css", "layout/stack.css", "layout/cluster.css"],
};

// A typical settings screen: the cards of scripts/playground/compare.html.
const PAGE = ["accordion", "avatar", "badge", "button", "card", "form", "progress", "tabs"];

const actualFor = (ids) => [...FOUNDATION, ...new Set(ids.flatMap((id) => COMPONENTS[id]))];
const refFor = (ids) => [...REF.foundation, ...new Set(ids.flatMap((id) => REF.css[id] ?? []))];

async function cssReport() {
  const matched = REF ? Object.keys(COMPONENTS).filter((id) => REF.css[id]) : [];
  const sources = [
    ["Foundation", "Actual core", () => actualCss(FOUNDATION)],
    ["Settings page", "Actual", () => actualCss(actualFor(PAGE))],
    ["Full", "Actual actual.full.css", () => actualCss(["actual.full.css"])],
  ];
  if (REF) {
    sources.push(
      ["Foundation", REF.name, () => refCss(REF.foundation)],
      ["Settings page", REF.name, () => refCss(refFor(PAGE))],
      [
        "Matched scope",
        `Actual (${matched.length} components)`,
        () => actualCss(actualFor(matched)),
      ],
      ["Matched scope", REF.name, () => refCss(refFor(matched))],
    );
    if (REF.shipped?.css) {
      sources.push([
        "Full, as shipped",
        REF.name,
        () => readFile(refPath(REF.shipped.css), "utf8"),
      ]);
    }
  }
  const order = ["Foundation", "Settings page", "Matched scope", "Full", "Full, as shipped"];
  const rows = [];
  for (const [scope, lib, read] of sources) rows.push({ scope, lib, ...measure(await read()) });
  rows.sort((a, b) => order.indexOf(a.scope) - order.indexOf(b.scope));

  // Marginal cost of each component on top of its foundation.
  const components = [];
  for (const [id, files] of Object.entries(COMPONENTS)) {
    const a = measure(await actualCss(files));
    const refFiles = REF?.css[id];
    const r = refFiles ? measure(await refCss(refFiles)) : null;
    components.push({
      component: id,
      files: files.map((f) => f.replace(/^.*\//, "")).join(" + "),
      "actual br": a.brotli,
      "ref br": r?.brotli ?? "",
      ratio: r ? (a.brotli / r.brotli).toFixed(1) : "",
    });
  }
  return { rows, components };
}

/* ── JS profiles ───────────────────────────────────────────────────────── */

// A virtual entry, so a composed profile needs no file on disk.
const entryPlugin = (contents) => ({
  name: "composition-entry",
  setup(build) {
    build.onResolve({ filter: /^composition:entry$/ }, () => ({
      path: "entry",
      namespace: "composition",
    }));
    build.onLoad({ filter: /.*/, namespace: "composition" }, () => ({
      contents,
      loader: "js",
      resolveDir: ROOT,
    }));
  },
});

async function bundle(contents) {
  const out = await Bun.build({
    entrypoints: ["composition:entry"],
    plugins: [entryPlugin(contents)],
    minify: true,
    format: "iife",
    target: "browser",
    metafile: true,
  });
  if (!out.success) throw new Error(out.logs.join("\n"));
  const inputs = Object.values(out.metafile.outputs)[0].inputs;
  const modules = Object.entries(inputs)
    .filter(([path]) => !path.startsWith("composition:"))
    .map(([path, { bytesInOutput }]) => ({ path: path.replace(/\\/g, "/"), bytes: bytesInOutput }));
  return { code: await out.outputs[0].text(), modules };
}

const importsOf = (paths) =>
  paths.map((p) => `import ${JSON.stringify(p.replace(/\\/g, "/"))};`).join("\n");

// The documented native-popover recipe (docs/pages/enhancements/flyout.md):
// the browser owns the lifecycle, a positioner only places the panel.
const NATIVE_RECIPE = `import { autoUpdate, reposition } from "@lekoala/floating";
for (const panel of document.querySelectorAll(".flyout[popover]")) {
  const trigger = document.querySelector(\`[popovertarget="\${panel.id}"]\`);
  let stop;
  panel.addEventListener("toggle", (event) => {
    stop?.();
    stop = undefined;
    if (event.newState !== "open") return;
    stop = autoUpdate(trigger, panel, () => reposition(trigger, panel, { placement: "bottom-start", distance: 4 }));
  });
}`;

// Profile id -> Actual modules. A composed profile lists ids; "dropdown"
// stands for the flyout, the id a reference maps its menu script onto.
const MODULES = {
  tab: ["tab"],
  dialog: ["dialog"],
  tooltip: ["tooltip"],
  dropdown: ["flyout"],
  status: ["status"],
};
const JS_PROFILES = [
  { name: "tab", ids: ["tab"] },
  { name: "dialog", ids: ["dialog"] },
  { name: "tooltip", ids: ["tooltip"] },
  { name: "flyout", ids: ["dropdown"] },
  { name: "tab + tooltip + flyout", ids: ["tab", "tooltip", "dropdown"] },
  { name: "native menu + positioner recipe", ids: ["dropdown"], source: NATIVE_RECIPE },
  {
    name: "tab + dialog + tooltip + flyout + status",
    ids: ["tab", "dialog", "tooltip", "dropdown", "status"],
  },
  { name: "full", full: true },
];

const actualSource = (p) =>
  p.source ??
  importsOf(
    p.full
      ? [join(ROOT, "src/js/full.js")]
      : p.ids.flatMap((id) => MODULES[id]).map((m) => join(ROOT, "src/js", `${m}.js`)),
  );

// The reference side of a profile: null when an id has no counterpart (the
// row would compare unequal scopes), "" when the library ships no script.
function refSource(p) {
  if (!REF) return null;
  if (p.full) return REF.fullJs ? importsOf(REF.fullJs.map(refPath)) : null;
  if (p.ids.some((id) => !REF.js?.[id])) return null;
  return importsOf([...new Set(p.ids.flatMap((id) => REF.js[id]))].map(refPath));
}

async function jsReport() {
  const profiles = [];
  for (const profile of JS_PROFILES) {
    const actualBundle = await bundle(actualSource(profile));
    const ref = refSource(profile);
    const refBundle = ref ? await bundle(ref) : ref === "" ? { code: "", modules: [] } : null;
    profiles.push({ ...profile, actualBundle, refBundle });
  }
  const shipped = REF?.shipped?.js
    ? measure(await readFile(refPath(REF.shipped.js), "utf8"))
    : null;
  return { profiles, shipped };
}

async function timeProfiles(profiles) {
  if (!timing || !(await browserAvailable())) return null;
  const results = new Map();
  await withBrowserPage("about:blank", async (view) => {
    await view.cdp("Emulation.setCPUThrottlingRate", { rate: 4 });
    for (const p of profiles) {
      for (const side of ["actual", "ref"]) {
        const code = p[`${side}Bundle`]?.code;
        if (!code) continue;
        const ms = await view.evaluate(`(async () => {
          const code = ${JSON.stringify(code.replaceAll("</script", "<\\/script"))};
          const runs = [];
          for (let i = 0; i < 9; i++) {
            const frame = document.createElement("iframe");
            const done = new Promise((resolve) => addEventListener("message", (e) => resolve(e.data), { once: true }));
            frame.srcdoc = "<script>t0=performance.now()<\\/script><script>" + code + "\\n//" + Math.random()
              + "<\\/script><script>parent.postMessage(performance.now()-t0,'*')<\\/script>";
            document.body.append(frame);
            runs.push(await done);
            frame.remove();
          }
          runs.sort((a, b) => a - b);
          return runs[4];
        })()`);
        results.set(`${p.name}:${side}`, ms);
      }
    }
  });
  return results;
}

/* ── Output ────────────────────────────────────────────────────────────── */

function table(rows, cols) {
  const cells = rows.map((row) => cols.map((c) => String(row[c] ?? "")));
  const widths = cols.map((c, i) => Math.max(c.length, ...cells.map((r) => r[i].length)));
  const line = (values) => `| ${values.map((v, i) => v.padEnd(widths[i])).join(" | ")} |`;
  return [line(cols), line(widths.map((w) => "-".repeat(w))), ...cells.map(line)].join("\n");
}

const withRef = (cols) => (REF ? cols : cols.filter((c) => !c.startsWith("ref") && c !== "ratio"));

const { rows, components } = await cssReport();
const { profiles, shipped } = await jsReport();
const times = await timeProfiles(profiles);

console.log(`Report only, no gate. Actual from src/${REF ? `; ref: ${REF.name}` : ""}. Bytes.\n`);
console.log("CSS compositions\n");
console.log(table(rows, ["scope", "lib", "min", "gzip", "brotli"]));
console.log("\nCSS per component (marginal, without the foundation)\n");
console.log(table(components, withRef(["component", "files", "actual br", "ref br", "ratio"])));

const jsRows = profiles.map((p) => {
  const a = measure(p.actualBundle.code);
  const r = p.refBundle ? measure(p.refBundle.code) : null;
  const ms = (side) =>
    times?.has(`${p.name}:${side}`) ? times.get(`${p.name}:${side}`).toFixed(1) : "";
  return {
    profile: p.name,
    "actual min": a.min,
    "actual br": a.brotli,
    modules: p.actualBundle.modules.length,
    "actual ms": ms("actual"),
    "ref br": r ? (r.min === 0 ? "0" : r.brotli) : "n/a",
    "ref ms": ms("ref"),
  };
});
console.log(
  `\nJS profiles${shipped ? ` (${REF.name} as shipped: ${shipped.brotli} B brotli)` : ""}\n`,
);
console.log(
  table(
    jsRows,
    withRef(["profile", "actual min", "actual br", "modules", "actual ms", "ref br", "ref ms"]),
  ),
);
if (!times) console.log("(timing skipped)");

// Which modules each single-feature profile pulls in, by weight in the full
// bundle: the shared floor is what any enhancement pays before it does
// anything of its own.
const singles = profiles.filter((p) => ["tab", "dialog", "tooltip", "flyout"].includes(p.name));
const full = profiles.find((p) => p.full).actualBundle.modules;
const moduleRows = full
  .map(({ path, bytes }) => ({
    module: path.replace(/^(.*\/)?src\/js\//, "").replace(/^.*node_modules\//, ""),
    "min in full": bytes,
    "pulled by": singles
      .filter((p) => p.actualBundle.modules.some((m) => m.path === path))
      .map((p) => p.name)
      .join(", "),
  }))
  .sort((a, b) => b["min in full"] - a["min in full"]);
console.log("\nJS modules in the full bundle\n");
console.log(table(moduleRows, ["module", "min in full", "pulled by"]));
