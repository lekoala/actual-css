/*
 * parse-config.js — Configuration parsing for data-enhance-config.
 *
 * Strict JSON is parsed as-is, never rewritten. When strict JSON fails, a
 * small, deliberate relax step accepts the ergonomic subset that is common in
 * HTML attributes: unquoted keys and single-quoted strings. The relaxed
 * subset is intentionally tiny and is NOT a second grammar — anything it
 * cannot transform cleanly is rejected by the final JSON.parse. The root
 * value must be an object; bare string values (other than true/false/null)
 * stay invalid, and trailing commas are rejected.
 */

function relax(source) {
  return source.replace(
    /([a-zA-Z_$][\w$-]*)\s*:|'((?:\\'|[^'])*)'/g,
    (_match, key, stringContent) => {
      if (key) return `"${key}":`;
      const unescaped = stringContent.replace(/\\'/g, "'");
      const escaped = unescaped.replace(/"/g, '\\"');
      return `"${escaped}"`;
    },
  );
}

export function parseConfig(source) {
  if (source == null || typeof source !== "string") return {};
  const str = source.trim();
  if (str === "") return {};

  let text = str;
  let value;
  try {
    value = JSON.parse(text);
  } catch {
    const relaxed = relax(text);
    text = relaxed.startsWith("{") ? relaxed : `{${relaxed}}`;
    value = JSON.parse(text);
  }

  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError("Enhancement config must be an object");
  }

  return value;
}

export default parseConfig;
