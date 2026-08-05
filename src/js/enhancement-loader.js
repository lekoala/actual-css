/*
 * enhancement-loader.js — Server-declared enhancement manifest loader.
 *
 * Reads <script type="application/json" data-enhance-modules"> blocks or
 * the Enhance-Modules HTTP header, dynamically imports the declared ES
 * module entrypoints, and registers them with the Actual lifecycle engine.
 *
 * One map keyed by name reserves the slot immediately, so concurrent calls
 * for the same name share one promise. The browser's native module cache
 * handles URL dedup. Script/style helpers fill the gap for non-ESM assets.
 */

import { registerEnhancement } from "./enhance.js";
import { parseConfig } from "./parse-config.js";

const enhancements = new Map();

const scriptLoads = new Map();
const styleLoads = new Map();

let moduleImporter = (url) => import(url);

export function loadScript(url) {
  const absoluteUrl = new URL(url, document.baseURI).href;

  if (!scriptLoads.has(absoluteUrl)) {
    scriptLoads.set(
      absoluteUrl,
      new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = absoluteUrl;
        script.defer = true;
        script.onload = resolve;
        script.onerror = () => {
          scriptLoads.delete(absoluteUrl);
          script.remove();
          reject(new Error(`Unable to load script: ${absoluteUrl}`));
        };
        document.head.append(script);
      }),
    );
  }

  return scriptLoads.get(absoluteUrl);
}

export function loadStyle(url) {
  const absoluteUrl = new URL(url, document.baseURI).href;

  if (!styleLoads.has(absoluteUrl)) {
    styleLoads.set(
      absoluteUrl,
      new Promise((resolve, reject) => {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = absoluteUrl;
        link.onload = resolve;
        link.onerror = () => {
          styleLoads.delete(absoluteUrl);
          link.remove();
          reject(new Error(`Unable to load style: ${absoluteUrl}`));
        };
        document.head.append(link);
      }),
    );
  }

  return styleLoads.get(absoluteUrl);
}

function makeInit(name, connect) {
  return (element) => {
    const controller = new AbortController();
    const source = element.getAttribute("data-enhance-config");
    const config = parseConfig(source ?? "");

    const emit = (type, detail, options = {}) =>
      element.dispatchEvent(
        new CustomEvent(`actual:${name}:${type}`, {
          bubbles: true,
          detail,
          ...options,
        }),
      );

    const cleanup = connect(element, {
      config,
      signal: controller.signal,
      emit,
    });

    if (cleanup?.then) {
      controller.abort();
      throw new TypeError(
        `Enhancement "${name}" returned a Promise. connect() must be synchronous; use prepare() for asynchronous setup.`,
      );
    }

    if (cleanup !== undefined && typeof cleanup !== "function") {
      controller.abort();
      throw new TypeError(`Enhancement "${name}" must return a cleanup function or undefined.`);
    }

    return () => {
      controller.abort();
      cleanup?.();
    };
  };
}

export function loadEnhancement(name, url) {
  const absoluteUrl = new URL(url, document.baseURI).href;
  const existing = enhancements.get(name);

  if (existing) {
    if (existing.url !== absoluteUrl) {
      throw new Error(
        `Enhancement "${name}" is already declared from ${existing.url} and cannot be replaced by ${absoluteUrl}.`,
      );
    }
    return existing.promise.then(() => ({ name, status: "skipped" }));
  }

  const promise = moduleImporter(absoluteUrl)
    .then(async (mod) => {
      if (typeof mod.default !== "function") {
        throw new TypeError(`Enhancement "${name}" must export a default function.`);
      }

      if (mod.prepare !== undefined) {
        if (typeof mod.prepare !== "function") {
          throw new TypeError(`Enhancement "${name}" exports an invalid prepare().`);
        }

        await mod.prepare({
          resolve: (path) => new URL(path, absoluteUrl).href,
          loadScript,
          loadStyle,
        });
      }

      registerEnhancement(name, makeInit(name, mod.default));

      return { name, status: "loaded" };
    })
    .catch((error) => {
      if (enhancements.get(name)?.promise === promise) {
        enhancements.delete(name);
      }
      throw error;
    });

  enhancements.set(name, { url: absoluteUrl, promise });

  return promise;
}

async function loadManifest(manifest) {
  const entries = Object.entries(manifest);
  const results = await Promise.allSettled(
    entries.map(([name, url]) => loadEnhancement(name, url)),
  );

  const output = { names: [], failed: [], skipped: [] };

  results.forEach((result, index) => {
    const name = entries[index][0];

    if (result.status === "rejected") {
      output.failed.push({ name, error: result.reason });
    } else if (result.value.status === "skipped") {
      output.skipped.push(name);
    } else {
      output.names.push(name);
    }
  });

  return output;
}

function parseManifestEntries(text) {
  const data = JSON.parse(text);

  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    throw new TypeError("Manifest must be a JSON object.");
  }

  return Object.entries(data);
}

export async function loadEnhancements(root = document) {
  const blocks = root.querySelectorAll('script[type="application/json"][data-enhance-modules]');

  const manifest = new Map();

  for (const block of blocks) {
    const entries = parseManifestEntries(block.textContent);

    for (const [name, rawUrl] of entries) {
      const url = new URL(rawUrl, document.baseURI).href;
      const existing = manifest.get(name);

      if (existing && existing !== url) {
        throw new Error(`Enhancement "${name}" is declared from both ${existing} and ${url}.`);
      }

      manifest.set(name, url);
    }
  }

  const result = await loadManifest(Object.fromEntries(manifest));

  if (result.failed.length === 0) {
    for (const block of blocks) block.remove();
  }

  return result;
}

export async function loadResponse(response) {
  const header = response.headers.get("Enhance-Modules");

  if (!header) return { names: [], failed: [], skipped: [] };

  let manifest;
  try {
    manifest = JSON.parse(header);
  } catch (error) {
    throw new SyntaxError(`Invalid JSON in Enhance-Modules header: ${error.message}`);
  }

  if (typeof manifest !== "object" || manifest === null || Array.isArray(manifest)) {
    throw new TypeError("Enhance-Modules header must be a JSON object.");
  }

  return loadManifest(manifest);
}

export function __setModuleImporter(fn) {
  moduleImporter = fn;
}

export function __reset() {
  enhancements.clear();
  scriptLoads.clear();
  styleLoads.clear();
  moduleImporter = (url) => import(url);
}
