// Keep the caches and import seam private to the loader and its tests.
export const loaderState = {
  enhancements: new Map(),
  scriptLoads: new Map(),
  styleLoads: new Map(),
  importModule: (url) => import(url),
};
