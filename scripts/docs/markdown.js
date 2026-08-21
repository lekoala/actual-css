/*
 * Encapsulation of Bun's Markdown API. Bun.markdown is an unstable runtime API;
 * every call lives here so a Bun upgrade cannot leak into the rest of the
 * builder.
 *
 * Why not Bun.markdown.render()? Its code callback meta.language contains only
 * the first word of the fence info string (```html demo arrives as "html"), so
 * the demo flag is lost. Instead we pre-scan fences ourselves and splice demo
 * examples into the rendered HTML via placeholder comments, letting
 * Bun.markdown.html() produce all the standard markup (tables, heading ids,
 * safe escaping) for the prose.
 */

const escapeHtml = (str) =>
  str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/* Page assembly consumes these boundaries to keep live component demos out of
   prose while leaving authored Markdown in rich-text sections. */
export const DOCS_PROSE_END = "<!--docs-prose-end-->";
export const DOCS_PROSE_START = "<!--docs-prose-start-->";

/**
 * Parse a fence info string: "html demo" -> { language: "html", demo: true }.
 */
export function parseCodeInfo(info = "") {
  const [language = "", ...flags] = info.trim().split(/\s+/);
  return { language, flags, demo: flags.includes("demo") };
}

/**
 * Scan fenced code blocks in document order. Each entry carries the language
 * and flags from its info string plus the raw content. Fences may be ``` or
 * ~~~; content ends at the first closing fence of the same kind with >= the
 * opening length. An unclosed fence runs to the end of the document.
 */
export function scanCodeFences(markdown) {
  const lines = markdown.split(/\r?\n/);
  const blocks = [];
  let open = null;

  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(/^ {0,3}(`{3,}|~{3,})(.*)$/);

    if (!open) {
      const info = match?.[2] ?? "";
      if (match && !(match[1][0] === "`" && info.includes("`"))) {
        open = {
          marker: match[1][0],
          length: match[1].length,
          start: i,
          info,
          contentLines: [],
        };
      }
      continue;
    }

    if (match && match[1][0] === open.marker && match[1].length >= open.length) {
      blocks.push({
        start: open.start,
        end: i,
        ...parseCodeInfo(open.info),
        content: open.contentLines.join("\n"),
      });
      open = null;
    } else {
      open.contentLines.push(lines[i]);
    }
  }

  if (open) {
    blocks.push({
      start: open.start,
      end: lines.length - 1,
      ...parseCodeInfo(open.info),
      content: open.contentLines.join("\n"),
    });
  }

  return blocks.map((block) => {
    const contentLines = block.content.split("\n");
    while (contentLines.length > 0 && contentLines.at(-1) === "") {
      contentLines.pop();
    }
    return { ...block, content: contentLines.join("\n") };
  });
}

/**
 * Replace every demo fence with a placeholder comment, keeping the rest of the
 * markdown untouched for Bun to render. Returns the prepared markdown and the
 * demo blocks in order.
 */
export function prepareMarkdown(markdown) {
  const blocks = scanCodeFences(markdown);
  const lines = markdown.split(/\r?\n/);
  const out = [];
  const demos = [];
  let cursor = 0;

  for (const block of blocks) {
    out.push(...lines.slice(cursor, block.start));
    if (block.demo) {
      demos.push(block);
      out.push(`<!--docs-demo-${demos.length - 1}-->`);
    } else {
      out.push(...lines.slice(block.start, block.end + 1));
    }
    cursor = block.end + 1;
  }
  out.push(...lines.slice(cursor));

  return { markdown: out.join("\n"), demos };
}

/**
 * HTML for a demo example: live preview + escaped source. The preview content
 * is intentionally executable — docs sources are repo-controlled content.
 */
function renderDemoBlock(entry) {
  const language = escapeHtml(entry.language || "html");
  const source = escapeHtml(entry.content);
  return `${DOCS_PROSE_END}
<div class="docs-example">
  <div class="docs-preview">
${entry.content}
  </div>
  <div class="docs-code">
    <pre><code class="language-${language}">${source}</code></pre>
  </div>
</div>
${DOCS_PROSE_START}`;
}

/**
 * Wrap GFM tables in Actual's .table-wrap scroll container and apply .table.
 * Bun's table markup is well-formed, so a scan is safe; nothing inside escaped
 * code blocks can match.
 */
export function wrapTables(html) {
  const re = /<table[^>]*>[\s\S]*?<\/table>/g;
  const out = [];
  let last = 0;
  let match = re.exec(html);

  while (match) {
    out.push(html.slice(last, match.index));
    out.push('<div class="table-wrap">');
    out.push(match[0].replace("<table", '<table class="table"'));
    out.push("</div>");
    last = match.index + match[0].length;
    match = re.exec(html);
  }
  out.push(html.slice(last));
  return out.join("");
}

/**
 * Rewrite internal links in rendered HTML. resolve(href) returns the new href
 * for internal links and null for external/unchanged ones.
 */
export function rewriteLinks(html, resolve) {
  return html.replace(/<a\s+href="([^"]+)"/g, (match, href) => {
    const raw = href.replace(/&amp;/g, "&");
    const target = resolve(raw);
    if (!target) return match;
    const [_path, fragment] = raw.split("#");
    const next = `${target}${fragment ? `#${fragment}` : ""}`;
    return `<a href="${escapeHtml(next)}"`;
  });
}

/**
 * Render a markdown document to an HTML fragment. Returns the title (first
 * H1), description (first paragraph), TOC (H2/H3 with ids), and the demo
 * blocks so the caller can also build search data.
 */
export function render(markdown, { resolveLink } = {}) {
  const { markdown: prepared, demos } = prepareMarkdown(markdown);
  let html = Bun.markdown.html(prepared, {
    tables: true,
    strikethrough: true,
    tasklists: true,
    autolinks: true,
    headings: { ids: true },
  });

  // Only authored Markdown tables become the editorial table composition.
  // Live demos own their markup and are inserted after this transformation.
  html = wrapTables(html);
  for (let i = 0; i < demos.length; i++) {
    html = html.replace(`<!--docs-demo-${i}-->`, renderDemoBlock(demos[i]));
  }
  if (resolveLink) html = rewriteLinks(html, resolveLink);

  return {
    html,
    demos,
    title: extractTitle(markdown),
    description: extractDescription(html),
    toc: extractToc(html),
  };
}

export function extractTitle(markdown) {
  const match = markdown.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : "";
}

export function extractDescription(html) {
  const headingEnd = html.indexOf("</h1>");
  const body = headingEnd === -1 ? html : html.slice(headingEnd);
  const match = body.match(/<p>([\s\S]*?)<\/p>/);
  if (!match) return "";
  return match[1].replace(/<[^>]+>/g, "").trim();
}

export function extractToc(html) {
  const toc = [];
  const re = /<h([23]) id="([^"]+)">([\s\S]*?)<\/h\1>/g;
  let match = re.exec(html);
  while (match) {
    toc.push({
      level: Number(match[1]),
      id: match[2],
      label: match[3].replace(/<[^>]+>/g, "").trim(),
    });
    match = re.exec(html);
  }
  return toc;
}
