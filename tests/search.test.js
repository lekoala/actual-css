import { describe, expect, it } from "bun:test";
import { render } from "../scripts/docs/markdown.js";
import { buildSearchIndex } from "../scripts/docs/search.js";

describe("buildSearchIndex", () => {
  it("carries aliases parsed from the page into the index", () => {
    const navigation = {
      pages: [
        {
          file: "enhancements/flyout.md",
          slug: "flyout",
          title: "Flyout",
          description: "Positioned surface attached to a trigger.",
          groupTitle: "Enhancements",
          url: "enhancements/flyout.html",
        },
      ],
    };
    const markdown =
      "# Flyout\n\n> Positioned surface attached to a trigger.\n\n**Related terms:** popover, dropdown.\n";
    const rendered = new Map([["enhancements/flyout.md", render(markdown)]]);

    const index = buildSearchIndex(navigation, rendered);
    expect(index).toHaveLength(1);
    expect(index[0].aliases).toEqual(["popover", "dropdown"]);
  });

  it("defaults missing aliases to an empty array", () => {
    const navigation = {
      pages: [
        {
          file: "layout/stack.md",
          slug: "stack",
          title: "Stack",
          groupTitle: "Layout",
          url: "layout/stack.html",
        },
      ],
    };
    const rendered = new Map([["layout/stack.md", render("# Stack\n")]]);

    const index = buildSearchIndex(navigation, rendered);
    expect(index[0].aliases).toEqual([]);
  });
});
