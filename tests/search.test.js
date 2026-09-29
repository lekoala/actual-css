import { describe, expect, it } from "bun:test";
import { render } from "../scripts/docs/markdown.js";
import { buildSearchIndex, scoreEntry, searchEntries } from "../scripts/docs/search.js";

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

describe("scoreEntry", () => {
  const combobox = {
    title: "Combobox",
    description: "A searchable or multi-value combobox is not shipped by the framework.",
    headings: ["Theme bridge"],
    aliases: ["combo box", "combobox", "select", "searchable select", "dropdown", "form controls"],
    text: "The .select class keeps the native baseline with a CSS chevron.",
    url: "forms/combobox.html",
  };
  // Only a substring lookalike: "selection" must not tie with a real "select".
  const lookalike = {
    title: "Status Bar",
    description: "Progress state for a long task.",
    headings: ["Overview"],
    aliases: [],
    text: "Track the selection state of the current run.",
    url: "enhancements/status-bar.html",
  };

  it("matches a query token inside a longer alias", () => {
    expect(scoreEntry(combobox, "select")).toBeGreaterThan(0);
  });

  it("ranks the aliased page above a substring lookalike", () => {
    expect(scoreEntry(combobox, "select")).toBeGreaterThan(scoreEntry(lookalike, "select"));
    const hits = searchEntries([lookalike, combobox], "select");
    expect(hits[0].title).toBe("Combobox");
  });

  it("rewards a multi-word query covering an alias", () => {
    const forms = {
      title: "Forms",
      description: "Cohesive set of form elements.",
      headings: [],
      aliases: ["form controls", "select"],
      text: "Control classes: .input, .textarea, .select.",
      url: "forms/overview.html",
    };
    expect(scoreEntry(forms, "custom select")).toBeGreaterThan(
      scoreEntry(lookalike, "custom select"),
    );
  });

  it("breaks score ties alphabetically so nav order cannot hide a page", () => {
    const a = { title: "Beta", description: "", headings: [], aliases: [], text: "shared word" };
    const b = { title: "Alpha", description: "", headings: [], aliases: [], text: "shared word" };
    const hits = searchEntries([a, b], "shared");
    expect(hits.map((entry) => entry.title)).toEqual(["Alpha", "Beta"]);
  });
});
