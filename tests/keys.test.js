import { expect, test } from "bun:test";
import { firstItem, itemForKey, lastItem, nextItem } from "../src/js/keys.js";

const items = ["a", "b", "c"];

test("low-level item helpers retain their existing behavior", () => {
  expect(firstItem([])).toBeNull();
  expect(lastItem([])).toBeNull();
  expect(firstItem(items)).toBe("a");
  expect(lastItem(items)).toBe("c");
  expect(nextItem(items, "c", 1)).toBe("a");
  expect(nextItem(items, "c", 1, { wrap: false })).toBeNull();
});

test("Home and End select edges on either axis", () => {
  expect(itemForKey(items, "b", "Home")).toBe("a");
  expect(itemForKey(items, "b", "End", { orientation: "vertical" })).toBe("c");
});

test("horizontal arrows select previous and next items", () => {
  expect(itemForKey(items, "b", "ArrowLeft")).toBe("a");
  expect(itemForKey(items, "b", "ArrowRight")).toBe("c");
});

test("vertical arrows select previous and next items", () => {
  const opts = { orientation: "vertical" };
  expect(itemForKey(items, "b", "ArrowUp", opts)).toBe("a");
  expect(itemForKey(items, "b", "ArrowDown", opts)).toBe("c");
});

test("arrows outside the configured axis are ignored", () => {
  expect(itemForKey(items, "b", "ArrowDown")).toBeNull();
  expect(itemForKey(items, "b", "ArrowRight", { orientation: "vertical" })).toBeNull();
});

test("navigation does not wrap by default", () => {
  expect(itemForKey(items, "a", "ArrowLeft")).toBeNull();
  expect(itemForKey(items, "c", "ArrowRight")).toBeNull();
});

test("navigation wraps when requested", () => {
  const opts = { wrap: true };
  expect(itemForKey(items, "a", "ArrowLeft", opts)).toBe("c");
  expect(itemForKey(items, "c", "ArrowRight", opts)).toBe("a");
});

test("RTL reverses horizontal arrows only", () => {
  const horizontal = { direction: "rtl" };
  expect(itemForKey(items, "b", "ArrowRight", horizontal)).toBe("a");
  expect(itemForKey(items, "b", "ArrowLeft", horizontal)).toBe("c");

  const vertical = { direction: "rtl", orientation: "vertical" };
  expect(itemForKey(items, "b", "ArrowDown", vertical)).toBe("c");
  expect(itemForKey(items, "b", "ArrowUp", vertical)).toBe("a");
});

test("empty collections and unrelated keys return null", () => {
  expect(itemForKey([], null, "Home")).toBeNull();
  expect(itemForKey(items, "b", "Enter")).toBeNull();
});

test("an unknown current item enters from the movement edge", () => {
  expect(itemForKey(items, "missing", "ArrowRight")).toBe("a");
  expect(itemForKey(items, "missing", "ArrowLeft")).toBe("c");
});
