const ROOT_FONT_SIZE = 16;
const MIN_VIEWPORT = 360;
const MAX_VIEWPORT = 1440;

const TOKENS = [
  ["--fluid-display", 44, 68],
  ["--fluid-title", 32, 44],
  ["--fluid-lead", 18, 20],
] as const;

function toRem(px: number) {
  return `${Number((px / ROOT_FONT_SIZE).toFixed(4))}rem`;
}

function toViewport(value: number, unit: "vi" | "vw") {
  return `${Number(value.toFixed(3))}${unit}`;
}

function clampFor(minPx: number, maxPx: number, unit: "vi" | "vw") {
  const slope = ((maxPx - minPx) / (MAX_VIEWPORT - MIN_VIEWPORT)) * 100;
  const intercept = minPx - (slope * MIN_VIEWPORT) / 100;

  return `clamp(${toRem(minPx)}, calc(${toRem(intercept)} + ${toViewport(slope, unit)}), ${toRem(maxPx)})`;
}

for (const [name, minPx, maxPx] of TOKENS) {
  console.log(`${name}: ${clampFor(minPx, maxPx, "vw")};`);
}

console.log("");
console.log("@supports (inline-size: 100vi) {");
console.log("  :root {");

for (const [name, minPx, maxPx] of TOKENS) {
  console.log(`    ${name}: ${clampFor(minPx, maxPx, "vi")};`);
}

console.log("  }");
console.log("}");
