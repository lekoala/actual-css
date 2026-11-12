/*
 * Rendering cost of what a page animates: renderer CPU, main-thread task time
 * and frame pacing over a fixed window, one row per page.
 *
 * Analysis only — it gates nothing and exits 0. Pass one page per variant to
 * compare (a fixture can read its variant from the query string); the numbers
 * mean something only relative to each other on the same machine and run.
 *
 * - cpu ms/s: renderer process CPU (Performance.getMetrics ProcessTime), all
 *   renderer threads. Headless Chrome rasterizes in software, so raster-heavy
 *   work (blur, large gradients) reads costlier than on a GPU: confirm a
 *   finding with DevTools > Rendering > Paint flashing in a real browser.
 * - task ms/s: main-thread task time. An animation that stays on the
 *   compositor (transform, opacity) barely moves it; one that runs style or
 *   paint every frame (a registered custom property, box-shadow) does — off
 *   screen too.
 * - fps / long frames: rAF cadence in the page; frames over 20ms.
 *
 * Runs vary by ±30%: compare orders of magnitude, or rerun before trusting a
 * small gap. The warm-up is a fixed wait on purpose: first raster and layer
 * setup have no observable "done" state to wait for.
 *
 * Usage: bun run report:paint <page>... [--window 3000] [--cpu 1] [--width 1280]
 *   --cpu  CPU throttling rate (4 approximates a mid-range phone)
 */
import { fixtureUrl, readFlags, setViewport } from "./utils/browser.js";

const args = process.argv.slice(2);
const flags = readFlags(args, {
  "--window": { fallback: "3000" },
  "--cpu": { fallback: "1" },
  "--width": { fallback: "1280" },
});
const windowMs = Number(flags["--window"]);
const cpu = Number(flags["--cpu"]);
const pages = args;

if (pages.length === 0) {
  console.error("Usage: bun run report:paint <page>... [--window 3000] [--cpu 1] [--width 1280]");
  process.exit(1);
}

const WARM_UP_MS = 500;
const metric = (metrics, name) => metrics.find((m) => m.name === name)?.value ?? 0;

await using view = new Bun.WebView({
  backend: "chrome",
  width: Number(flags["--width"]),
  height: 900,
});
await view.navigate("about:blank");
await view.cdp("Performance.enable", {});
await setViewport(view, { width: Number(flags["--width"]) });
if (cpu > 1) await view.cdp("Emulation.setCPUThrottlingRate", { rate: cpu });

const seconds = windowMs / 1000;
const rows = [];
for (const page of pages) {
  await view.navigate(fixtureUrl(page));
  await view.evaluate(`new Promise((resolve) => setTimeout(resolve, ${WARM_UP_MS}))`);

  const before = (await view.cdp("Performance.getMetrics", {})).metrics;
  const stamps = await view.evaluate(`new Promise((resolve) => {
    const stamps = [];
    const end = performance.now() + ${windowMs};
    const tick = (t) => { stamps.push(t); t < end ? requestAnimationFrame(tick) : resolve(stamps); };
    requestAnimationFrame(tick);
  })`);
  const after = (await view.cdp("Performance.getMetrics", {})).metrics;

  const gaps = stamps.slice(1).map((t, i) => t - stamps[i]);
  const perSecond = (name) =>
    Math.round(((metric(after, name) - metric(before, name)) * 1000) / seconds);
  rows.push({
    page: page.replace(/^.*\//, ""),
    "cpu ms/s": perSecond("ProcessTime"),
    "task ms/s": perSecond("TaskDuration"),
    fps: Math.round(gaps.length / seconds),
    "frames >20ms": gaps.filter((gap) => gap > 20).length,
  });
}

console.table(rows);
