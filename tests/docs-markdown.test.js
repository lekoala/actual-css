import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  extractAliases,
  parseCodeInfo,
  render,
  scanCodeFences,
  wrapTables,
} from "../scripts/docs/markdown.js";
import { wrapDocsContent } from "../scripts/docs/templates.js";

const fixture = readFileSync(join(import.meta.dir, "fixtures", "docs", "sample.md"), "utf8");

describe("parseCodeInfo", () => {
  it("parses language and demo flag", () => {
    expect(parseCodeInfo("html demo")).toEqual({
      language: "html",
      flags: ["demo"],
      demo: true,
    });
  });

  it("parses source-only fences", () => {
    expect(parseCodeInfo("css")).toEqual({
      language: "css",
      flags: [],
      demo: false,
    });
  });

  it("handles empty info", () => {
    expect(parseCodeInfo("")).toEqual({
      language: "",
      flags: [],
      demo: false,
    });
  });
});

describe("scanCodeFences", () => {
  it("returns every fence in order with raw content", () => {
    const fences = scanCodeFences(fixture);
    expect(fences).toHaveLength(4);
    expect(fences.map((f) => f.language)).toEqual(["css", "js", "html", "html"]);
    expect(fences[3].demo).toBe(true);
    expect(fences[3].content).toContain('<button class="btn primary"');
    expect(fences[3].content).toContain("<script>");
  });

  it("ignores tildes as an alternative marker", () => {
    const fences = scanCodeFences("~~~\n<b>x</b>\n~~~\n");
    expect(fences).toHaveLength(1);
    expect(fences[0].content).toBe("<b>x</b>");
  });

  it("keeps unclosed fences to the end of the document", () => {
    const fences = scanCodeFences("```js\nlet x = 1;\n");
    expect(fences).toHaveLength(1);
    expect(fences[0].content).toBe("let x = 1;");
  });
});

describe("render", () => {
  const result = render(fixture);

  it("produces an h1 with a heading id", () => {
    expect(result.html).toContain('<h1 id="sample-page">Sample page</h1>');
  });

  it("keeps strong, emphasis, and raw HTML", () => {
    expect(result.html).toContain("<strong>strong</strong>");
    expect(result.html).toContain("<em>emphasis</em>");
    expect(result.html).toContain("<b>raw HTML</b>");
  });

  it("renders inline code", () => {
    expect(result.html).toContain("<code>inline code</code>");
  });

  it("renders lists, task lists, and ordered lists", () => {
    expect(result.html).toContain("<ul>");
    expect(result.html).toContain(
      '<li class="task-list-item"><input type="checkbox" class="task-list-item-checkbox" disabled checked>done task</li>',
    );
    expect(result.html).toContain(
      '<li class="task-list-item"><input type="checkbox" class="task-list-item-checkbox" disabled>open task</li>',
    );
    expect(result.html).toContain("<ol>");
  });

  it("renders GFM tables wrapped in .table-wrap with .table", () => {
    const tables = result.html.match(/<table class="table">/g) ?? [];
    expect(tables).toHaveLength(1);
    expect(result.html).toContain("<thead>");
    expect(result.html).toContain("<th>Class</th>");
    expect(result.html).toContain(".btn");
  });

  it("renders a blockquote and horizontal rule", () => {
    expect(result.html).toContain("<blockquote>");
    expect(result.html).toMatch(/<hr\s*\/?>/);
  });

  it("renders source-only css/js/html fences as escaped code", () => {
    expect(result.html).toContain('<code class="language-css">');
    expect(result.html).toContain("&lt;span&gt;plain source&lt;/span&gt;");
  });

  it("renders a demo fence with live preview and escaped source", () => {
    expect(result.html).toContain('<div class="docs-example">');
    expect(result.html).toContain('<div class="docs-preview">');
    expect(result.html).toContain('<div class="docs-code">');

    const preview = result.html.match(/class="docs-preview">([\s\S]*?)\n {2}<\/div>/)?.[1];
    expect(preview).toContain('<button class="btn primary" type="button">');
    expect(preview).toContain("<script>window.__demoRan = true;</script>");

    const source = result.html.match(
      /<div class="docs-example">[\s\S]*?<pre><code class="language-html">([\s\S]*?)<\/code><\/pre>/,
    )?.[1];
    expect(source).toContain("Save &amp; continue");
    expect(source).toContain("title=&quot;A &lt; B &amp; C&quot;");
    expect(source).not.toContain("<script>");
  });

  it("marks a demo preview resizable only on the resize flag", () => {
    const plain = render("```html demo\n<button>One</button>\n```");
    const resizable = render("```html demo resize\n<button>One</button>\n```");

    expect(plain.html).toContain('<div class="docs-preview">');
    expect(plain.html).not.toContain("docs-preview-resizable");
    expect(resizable.html).toContain('<div class="docs-preview docs-preview-resizable">');
    expect(resizable.html).not.toContain('<div class="docs-preview">');
  });

  it("keeps live demos outside prose sections", () => {
    const content = wrapDocsContent(result.html);
    expect(content).toContain('</div>\n<div class="docs-example">');
    expect(content).toContain('</div>\n<div class="prose docs-prose">');

    const proseSections = content.match(/<div class="prose docs-prose">[\s\S]*?<\/div>/g) ?? [];
    expect(proseSections).toHaveLength(2);
    expect(proseSections.every((section) => !section.includes("docs-example"))).toBe(true);
    expect(content).not.toMatch(/<div class="prose docs-prose">\s*<\/div>/);
  });

  it("does not emit empty prose between consecutive demos", () => {
    const result = render(
      "```html demo\n<button>One</button>\n```\n\n```html demo\n<button>Two</button>\n```",
    );
    const content = wrapDocsContent(result.html);
    expect(content).not.toMatch(/<div class="prose docs-prose">\s*<\/div>/);
    expect(content.match(/class="docs-example"/g)).toHaveLength(2);
  });

  it("does not rewrite tables owned by live demos", () => {
    const demo = render(
      '```html demo\n<table class="comparison"><tr><td>Demo</td></tr></table>\n```',
    );
    expect(demo.html).toContain('<table class="comparison">');
    expect(demo.html).not.toContain('<table class="table" class="comparison">');
    expect(demo.html).not.toContain('<div class="table-wrap"><table class="comparison">');
  });

  it("dedupes duplicate heading ids", () => {
    expect(result.html).toContain('<h2 id="variants">');
    expect(result.html).toContain('<h2 id="variants-1">');
  });

  it("extracts title, description, and TOC", () => {
    expect(result.title).toBe("Sample page");
    expect(result.description).toContain("This is a lead paragraph");
    expect(result.toc[0]).toEqual({
      level: 2,
      id: "basic-usage",
      label: "Basic usage",
    });
    expect(result.toc.map((t) => t.label)).toEqual(["Basic usage", "Variants", "Variants"]);
    expect(result.toc.map((t) => t.id)).toEqual(["basic-usage", "variants", "variants-1"]);
  });
});

describe("extractAliases", () => {
  it("parses a Related terms line into lowercased aliases", () => {
    const markdown =
      "# Flyout\n\n> Description.\n\n**Related terms:** Popover, dropdown menu, bottom sheet.\n";
    expect(extractAliases(markdown)).toEqual(["popover", "dropdown menu", "bottom sheet"]);
  });

  it("strips the trailing period", () => {
    const markdown = "**Related terms:** off-canvas, side sheet.\n";
    expect(extractAliases(markdown)).toEqual(["off-canvas", "side sheet"]);
  });

  it("dedupes repeated terms", () => {
    const markdown = "**Related terms:** bottom nav, bottom navigation, bottom nav.\n";
    expect(extractAliases(markdown)).toEqual(["bottom nav", "bottom navigation"]);
  });

  it("returns an empty list when no Related terms line exists", () => {
    expect(extractAliases("# Page\n\nPlain paragraph.\n")).toEqual([]);
  });

  it("exposes aliases through render", () => {
    const result = render("# Range\n\n> Description.\n\n**Related terms:** slider, scrubber.\n");
    expect(result.aliases).toEqual(["slider", "scrubber"]);
  });
});

describe("wrapTables", () => {
  it("leaves HTML without tables untouched", () => {
    const html = "<p>Hello</p>";
    expect(wrapTables(html)).toBe(html);
  });
});

describe("link rewriting", () => {
  it("rewrites internal links through the resolver", () => {
    const html = render(fixture, {
      resolveLink: (href) => (href.endsWith(".md") ? "layout/stack.html" : null),
    }).html;
    expect(html).toContain('href="layout/stack.html"');
    expect(html).toContain('href="https://example.com"');
  });
});
