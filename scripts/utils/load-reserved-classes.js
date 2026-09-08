/*
 * Strict loader for the reserved-classes list (repo-root reserved-classes.json).
 *
 * The list is the single source of truth for Actual class names. A checker
 * that loses it — a missing, unreadable, empty, or malformed file — must fail,
 * never run against a weaker set of classes. Hence validation instead of a
 * bare JSON.parse: this throws a message-annotated error every consumer can
 * surface as its own failure.
 */
import { readFileSync } from "node:fs";

export function loadReservedClasses(jsonPath) {
  let raw;
  try {
    raw = readFileSync(jsonPath, "utf8");
  } catch (error) {
    throw new Error(`Cannot read reserved class list (${jsonPath}): ${error.message}`);
  }

  let classes;
  try {
    classes = JSON.parse(raw);
  } catch (error) {
    throw new Error(`Reserved class list (${jsonPath}) is not valid JSON: ${error.message}`);
  }

  if (!Array.isArray(classes) || classes.length === 0) {
    throw new Error(`Reserved class list (${jsonPath}) must be a non-empty array`);
  }
  if (classes.some((entry) => typeof entry !== "string")) {
    throw new Error(`Reserved class list (${jsonPath}) contains a non-string entry`);
  }

  return classes;
}
