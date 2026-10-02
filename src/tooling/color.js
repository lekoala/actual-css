/*
 * sRGB color math shared by `actual-css contrast`, the repository reports and
 * the browser tests.
 * Colors are [r, g, b, a] byte arrays as returned by RASTERIZE in the page;
 * plain [r, g, b] triplets are accepted and treated as opaque.
 */

/*
 * Page-side rasterizer, injected into a view.evaluate() program as
 * `const rgba = ${RASTERIZE};`. getComputedStyle returns color-mix() and
 * light-dark() results as oklab() or color(), so a 1x1 canvas turns any
 * computed color into sRGB bytes. Alpha is kept so contrast() can refuse a
 * translucent color instead of measuring it as if it were opaque.
 */
export const RASTERIZE = `(() => {
  const canvas = Object.assign(document.createElement("canvas"), { width: 1, height: 1 });
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  return (value) => {
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = value;
    ctx.fillRect(0, 0, 1, 1);
    return [...ctx.getImageData(0, 0, 1, 1).data];
  };
})()`;

/* 0.04045 is the sRGB (IEC 61966-2-1) threshold and the one WCAG 2.2 defines.
   WCAG 2.0/2.1 printed 0.03928, from an older sRGB draft. No 8-bit channel
   falls between the two (10/255 = 0.0392, 11/255 = 0.0431), so ratios are
   identical either way. */
const toLinear = (byte) => {
  const c = byte / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};

/* WCAG 2 relative luminance. */
export const luminance = ([r, g, b]) =>
  0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);

/* WCAG 2 contrast ratio, 1 to 21. The formula has no alpha: a translucent
   color must be composited over its real background before it is measured. */
export function contrast(a, b) {
  if (a[3] < 255 || b[3] < 255) {
    throw new Error(`contrast() needs opaque colors, got [${a}] and [${b}]`);
  }
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/* OKLCH of an sRGB color: L 0-1, C chroma, h degrees. */
export function oklch([r, g, b]) {
  const [lr, lg, lb] = [r, g, b].map(toLinear);
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return { L, C: Math.hypot(A, B), h: ((Math.atan2(B, A) * 180) / Math.PI + 360) % 360 };
}

/* Shortest arc between two hues, in degrees. */
export const hueDistance = (a, b) => {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
};
