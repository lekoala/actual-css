/*
 * Selector parsing shared by the reserved-class manifest and the component
 * catalog generator.
 *
 * Three granularities, all operating on comment- and string-safe source:
 *
 *   - stripComments / selectorPreludes  — the raw sauce: declaration preludes
 *     with comments removed ("{...}" pairs, at-rule preludes dropped).
 *   - classesFromSelectors             — every `.class` anywhere in a prelude
 *     (the reserved manifest's total vocabulary).
 *   - preludeClasses                   — the classes a rule *styles*: classes of
 *     the leftmost compound of each simple selector. Classes inside :not() or
 *     :has() are never included — :not() is negated and :has() is relational,
 *     so neither positively styles what it lists. :is()/:where() classes are
 *     kept: they are alternatives of the same compound
 *     (`.btn:is(.outline, .ghost)` → btn, outline, ghost).
 *
 * `depthZeroOnly` restricts a compound scan to top-level classes, so a
 * core-file list like `:where(.btn, .input, …).sm` contributes only `.sm` —
 * the shared size modifier — and none of the participant names.
 */

export function stripComments(css) {
  let out = "";
  let quote = "";

  for (let i = 0; i < css.length; i += 1) {
    const char = css[i];
    const next = css[i + 1];

    if (quote) {
      out += char;
      if (char === "\\") {
        out += next ?? "";
        i += 1;
      } else if (char === quote) {
        quote = "";
      }
      continue;
    }

    if (char === '"' || char === "'") {
      quote = char;
      out += char;
      continue;
    }

    if (char === "/" && next === "*") {
      i += 2;
      while (i < css.length && !(css[i] === "*" && css[i + 1] === "/")) i += 1;
      i += 1;
      continue;
    }

    out += char;
  }

  return out;
}

export function selectorPreludes(css) {
  const preludes = [];
  let start = 0;

  for (let i = 0; i < css.length; i += 1) {
    const char = css[i];
    if (char === "{") {
      const prelude = css.slice(start, i).trim();
      if (prelude && !prelude.startsWith("@")) {
        preludes.push(prelude);
      }
      start = i + 1;
    } else if (char === "}") {
      start = i + 1;
    }
  }

  return preludes;
}

export function classesFromSelectors(css) {
  const classes = new Set();

  for (const prelude of selectorPreludes(stripComments(css))) {
    for (const match of prelude.matchAll(/\.([A-Za-z_-][A-Za-z0-9_-]*)/g)) {
      classes.add(match[1]);
    }
  }

  return classes;
}

/* Split a prelude into simple selectors at depth-0 commas. Commas inside a
   compound (e.g. `:is(.outline, .ghost)` or `:where(a, button)`) separate the
   function's arguments, not two selectors. */
function simpleSelectors(prelude) {
  const parts = [];
  let depth = 0;
  let quote = null;
  let start = 0;

  for (let i = 0; i < prelude.length; i += 1) {
    const char = prelude[i];
    if (quote) {
      if (char === "\\") {
        i += 1;
      } else if (char === quote) {
        quote = null;
      }
    } else if (char === '"' || char === "'") {
      quote = char;
    } else if (char === "(") {
      depth += 1;
    } else if (char === ")" && depth > 0) {
      depth -= 1;
    } else if (char === "," && depth === 0) {
      parts.push(prelude.slice(start, i).trim());
      start = i + 1;
    }
  }

  parts.push(prelude.slice(start).trim());
  return parts.filter(Boolean);
}

/* Classes of a simple selector's leftmost (subject) compound. The scan stops
   at the first depth-0 combinator: later compounds are context, not the
   element the rule styles — `.steps > .step-complete` styles the steps, and
   `.btn[aria-busy="true"] > .spinner` styles the button, not the spinner. */
function subjectClasses(simple, { depthZeroOnly = false } = {}) {
  const classes = new Set();
  let excluded = false;
  let depth = 0;
  let quote = null;
  let i = 0;
  const n = simple.length;

  while (i < n) {
    const char = simple[i];

    if (quote) {
      if (char === "\\") {
        i += 1;
      } else if (char === quote) {
        quote = null;
      }
      i += 1;
      continue;
    }

    if (char === '"' || char === "'") {
      quote = char;
      i += 1;
      continue;
    }

    if (char === "(") {
      const isRelational = /:(?:not|has)$/.test(simple.slice(0, i));
      excluded = excluded || isRelational;
      depth += 1;
      i += 1;
      continue;
    }

    if (char === ")") {
      if (depth > 0) depth -= 1;
      if (depth === 0) excluded = false;
      i += 1;
      continue;
    }

    if (
      depth === 0 &&
      (char === ">" ||
        char === "+" ||
        char === "~" ||
        char === " " ||
        char === "\t" ||
        char === "\n" ||
        char === ",")
    ) {
      break;
    }

    if (char === ".") {
      const matched = simple.slice(i).match(/^\.([A-Za-z_-][A-Za-z0-9_-]*)/);
      if (matched) {
        if (!excluded && (!depthZeroOnly || depth === 0)) {
          classes.add(matched[1]);
        }
        i += matched[0].length;
        continue;
      }
    }

    i += 1;
  }

  return classes;
}

/* Every class the prelude's rules style, across all its simple selectors. */
export function preludeClasses(prelude, options) {
  const classes = new Set();
  for (const simple of simpleSelectors(prelude)) {
    for (const name of subjectClasses(simple, options)) {
      classes.add(name);
    }
  }
  return classes;
}
