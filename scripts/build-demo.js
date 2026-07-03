import {
  existsSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
  readdirSync,
  rmSync,
  unlinkSync,
  watch,
} from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import Prism from "prismjs";
import "prismjs/components/prism-markup.js";
import "prismjs/components/prism-css.js";
import "prismjs/components/prism-javascript.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const DEMO = join(ROOT, "demo");
const GENERATED_DEMO = join(DEMO, "generated");
const DOCS = join(ROOT, "docs");

const DEMO_CATEGORY_FILES = [
  "components.md",
  "forms.md",
  "ui.md",
  "layout.md",
  "patterns.md",
  "utilities.md",
  "typography.md",
  "tokens.md",
  "accessibility.md",
  "why.md",
];

const TITLE_WORDS = {
  css: "CSS",
  ui: "UI",
};

const templates = {
  page: readFileSync(join(__dirname, "templates", "page.html"), "utf8"),
  index: readFileSync(join(__dirname, "templates", "index.html"), "utf8"),
  mainIndex: readFileSync(join(__dirname, "templates", "main-index.html"), "utf8"),
};

function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function categoryNameFromFile(file) {
  const base = file.replace(/\.md$/, "");
  return base
    .split(/[-_]/)
    .map((w) => TITLE_WORDS[w] || w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function inlineProse(text) {
  return text
    .replace(/`([^`]+)`/g, (_, c) => `<code>${escapeHtml(c)}</code>`)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, url) => `<a href="${url}">${label}</a>`);
}

function renderProseBlock(lines) {
  if (lines.length === 0) return "";
  const trimmed = lines.map((l) => l.trim()).filter((l) => l !== "");
  if (trimmed.length === 0) return "";

  const blocks = [];
  let current = null;

  for (const line of trimmed) {
    const h3 = line.match(/^###\s+(.+)$/);
    const li = line.match(/^[-*]\s+(.+)$/);

    if (h3) {
      if (current) blocks.push(current);
      current = { type: "h3", html: `<h3>${inlineProse(h3[1])}</h3>` };
      continue;
    }

    if (li) {
      if (!current || current.type !== "ul") {
        if (current) blocks.push(current);
        current = { type: "ul", html: "" };
      }
      current.html += `  <li>${inlineProse(li[1])}</li>\n`;
      continue;
    }

    if (current && current.type === "p") {
      current.html += ` ${inlineProse(line)}`;
    } else {
      if (current) blocks.push(current);
      current = { type: "p", html: inlineProse(line) };
    }
  }
  if (current) blocks.push(current);

  return blocks
    .map((b) => {
      if (b.type === "ul") return `<ul>\n${b.html}</ul>`;
      if (b.type === "h3") return b.html;
      return `<p>${b.html}</p>`;
    })
    .join("\n");
}

function parseMarkdown(content, fallbackTitle) {
  const lines = content.split("\n");
  const sections = [];
  let current = null;
  let codeBlock = null;
  let codeWrapperClasses = "";
  let codeLines = [];
  let proseBuffer = [];
  let hasH2 = false;
  let h1Title = null;

  function flushProse() {
    if (!current) {
      proseBuffer = [];
      return;
    }
    const html = renderProseBlock(proseBuffer);
    if (html) {
      current.items.push({ type: "prose", html });
    }
    proseBuffer = [];
  }

  for (const line of lines) {
    const h1Match = line.match(/^#\s+(.+)$/);
    if (h1Match && !codeBlock && !h1Title) {
      h1Title = h1Match[1].trim();
      continue;
    }

    const h2Match = line.match(/^##\s+(.+)$/);

    if (h2Match && !codeBlock) {
      hasH2 = true;
      flushProse();
      if (current) sections.push(current);
      current = { title: h2Match[1].trim(), slug: slugify(h2Match[1]), items: [], desc: "", links: [] };
      continue;
    }

    if (line.startsWith("```") && !codeBlock) {
      const match = line.match(/^```(\w+)(?:\{([^}]*)\})?\s*$/);
      const lang = match?.[1] || "html";
      const wrapperClasses = match?.[2]?.split(/\s+/).map((c) => c.replace(/^\./, "")).join(" ") || "";
      flushProse();
      codeBlock = lang;
      codeWrapperClasses = wrapperClasses;
      codeLines = [];
      continue;
    }

    if (line.startsWith("```") && codeBlock) {
      const code = codeLines.join("\n");
      if (current) {
        current.items.push({ lang: codeBlock, code, wrapperClasses: codeWrapperClasses });
      }
      codeBlock = null;
      codeWrapperClasses = "";
      codeLines = [];
      continue;
    }

    if (codeBlock) {
      codeLines.push(line);
      continue;
    }

    if (!current) continue;

    const trimmed = line.trim();

    if (trimmed === "") {
      if (proseBuffer.length > 0 && proseBuffer[proseBuffer.length - 1] !== "") {
        proseBuffer.push("");
      }
      continue;
    }

    if (/^Links:\s*$/.test(trimmed)) {
      continue;
    }

    const descMatch = trimmed.match(/^>\s+(.+)$/);
    if (descMatch && !current.desc) {
      current.desc = descMatch[1].trim();
      continue;
    }

    const linkMatch = trimmed.match(/^[-*]\s+(?:(.+?):\s+)?(https?:\/\/\S+)\s*$/);
    if (linkMatch) {
      const label = linkMatch[1] || linkMatch[2];
      current.links.push({ url: linkMatch[2], label });
      continue;
    }

    const liMatch = trimmed.match(/^[-*]\s+(.+)$/);
    if (liMatch) {
      proseBuffer.push(trimmed);
      continue;
    }

    if (/^###\s+/.test(trimmed)) {
      proseBuffer.push(trimmed);
      continue;
    }

    proseBuffer.push(trimmed);
  }

  flushProse();
  if (current) sections.push(current);

  if (!hasH2) {
    const title = h1Title || fallbackTitle;
    sections.push({
      title,
      slug: slugify(title),
      items: proseBuffer.length > 0
        ? [{ type: "prose", html: renderProseBlock(proseBuffer) || "" }].filter((i) => i.html)
        : [],
      desc: "",
      links: [],
    });
  }

  return sections;
}

function renderCodeBlock(block) {
  const grammar = block.lang === "css"
    ? Prism.languages.css
    : block.lang === "js" || block.lang === "javascript"
      ? Prism.languages.javascript
      : Prism.languages.markup;
  const highlighted = Prism.highlight(block.code, grammar, block.lang);
  const wrapperClass = block.wrapperClasses ? ` ${block.wrapperClasses}` : "";

  if (block.lang === "css") {
    return `    <section class="component-section">
      <h2>CSS</h2>
      <div class="example-group">
        <div class="example-code">
          <pre><code class="language-${block.lang}">${highlighted}</code></pre>
        </div>
      </div>
    </section>`;
  }

  if (block.lang === "js" || block.lang === "javascript") {
    return `    <section class="component-section">
      <div class="example-group">
        <div class="example-code">
          <pre><code class="language-${block.lang}">${highlighted}</code></pre>
        </div>
      </div>
    </section>
    <script>try{${block.code}}catch(e){console.error(e)}</script>`;
  }

  return `    <section class="component-section">
      <div class="example-group">
        <div class="example-render${wrapperClass}">
          ${block.code}
        </div>
        <div class="example-code">
          <pre><code class="language-${block.lang}">${highlighted}</code></pre>
        </div>
      </div>
    </section>`;
}

function renderItem(item) {
  if (item.type === "prose") {
    return `    <div class="component-prose">
      ${item.html}
    </div>`;
  }
  return renderCodeBlock(item);
}

function renderLinksAccordion(links) {
  if (!links || links.length === 0) return "";
  const items = links
    .map((l) => `        <li><a href="${l.url}" rel="noopener noreferrer">${l.label}</a></li>`)
    .join("\n");
  return `    <details class="demo-links">
      <summary>Links (${links.length})</summary>
      <ul>
${items}
      </ul>
    </details>`;
}

function renderPage(catName, section) {
  const desc = section.desc ? `<p>${escapeHtml(section.desc)}</p>` : "";
  const items = section.items.map(renderItem).join("\n");
  const links = renderLinksAccordion(section.links);

  return templates.page
    .replace(/\{\{title\}\}/g, escapeHtml(section.title))
    .replace(/\{\{category\}\}/g, escapeHtml(catName))
    .replace(/\{\{desc\}\}/g, desc)
    .replace(/\{\{content\}\}/g, items)
    .replace(/\{\{links\}\}/g, links)
    .replace(/\{\{cssPath\}\}/g, "../../../src/css")
    .replace(/\{\{demoAssetsPath\}\}/g, "../../styles")
    .replace(/\{\{distPath\}\}/g, "../../../dist");
}

function renderIndex(catName, catDesc, sections) {
  let cards = "";
  for (const section of sections) {
    const desc = section.desc ? `<p>${escapeHtml(section.desc)}</p>` : "";
    cards += `      <article class="component-card">
        <div class="card-info">
          <h3><a href="${section.slug}.html">${escapeHtml(section.title)}</a></h3>
          ${desc}
        </div>
      </article>
`;
  }

  return templates.index
    .replace(/\{\{title\}\}/g, escapeHtml(catName))
    .replace(/\{\{desc\}\}/g, escapeHtml(catDesc || ""))
    .replace(/\{\{cards\}\}/g, cards)
    .replace(/\{\{cssPath\}\}/g, "../../../src/css")
    .replace(/\{\{demoAssetsPath\}\}/g, "../../styles");
}

function renderMainIndex(categories) {
  let cards = "";
  for (const cat of categories) {
    const desc = cat.desc ? `<p>${escapeHtml(cat.desc)}</p>` : "";
    cards += `      <article class="component-card">
        <div class="card-info">
          <h3><a href="${cat.slug}/index.html">${escapeHtml(cat.name)}</a></h3>
          ${desc}
        </div>
      </article>
`;
  }

  return templates.mainIndex
    .replace(/\{\{cards\}\}/g, cards)
    .replace(/\{\{cssPath\}\}/g, "../../src/css")
    .replace(/\{\{demoAssetsPath\}\}/g, "../styles");
}

function extractCategoryDescription(content) {
  const lines = content.split("\n");
  let inCode = false;
  for (const line of lines) {
    if (line.startsWith("```")) {
      inCode = !inCode;
      continue;
    }
    if (inCode) continue;
    if (line.startsWith("#")) continue;
    const t = line.trim();
    if (t === "" || t === "Links:" || /^[-*]\s+https?:/.test(t)) continue;
    if (/^[-*]\s+/.test(t)) return t.replace(/^[-*]\s+/, "");
    if (t.startsWith(">")) return t.replace(/^>\s+/, "");
    return t;
  }
  return "";
}

function buildCategory(category) {
  const md = readFileSync(join(DOCS, category.file), "utf8");
  const sections = parseMarkdown(md, category.name);
  const slug = slugify(category.name);
  const dir = join(GENERATED_DEMO, slug);
  const expectedFiles = new Set(["index.html", ...sections.map((section) => `${section.slug}.html`)]);

  mkdirSync(dir, { recursive: true });

  writeFileSync(join(dir, "index.html"), renderIndex(category.name, category.desc, sections));
  for (const section of sections) {
    writeFileSync(join(dir, `${section.slug}.html`), renderPage(category.name, section));
  }

  for (const file of readdirSync(dir)) {
    if (file.endsWith(".html") && !expectedFiles.has(file)) unlinkSync(join(dir, file));
  }

  return { name: category.name, slug, desc: category.desc, sections };
}

function discoverCategories() {
  return DEMO_CATEGORY_FILES.map((file) => {
    const path = join(DOCS, file);
    if (!existsSync(path)) {
      throw new Error(`Missing demo documentation source: docs/${file}`);
    }

    const name = categoryNameFromFile(file);
    const content = readFileSync(path, "utf8");
    return { file, name, desc: extractCategoryDescription(content) };
  });
}

function removeGeneratedDirs(root, expected, protectedNames = new Set()) {
  if (!existsSync(root)) return;

  for (const entry of readdirSync(root, { withFileTypes: true })) {
    if (!entry.isDirectory() || expected.has(entry.name) || protectedNames.has(entry.name)) {
      continue;
    }

    const indexPath = join(root, entry.name, "index.html");
    if (!existsSync(indexPath)) continue;

    const marker = readFileSync(indexPath, "utf8").slice(0, 80);
    if (!marker.includes("Generated by build-demo.js")) continue;

    rmSync(join(root, entry.name), { recursive: true, force: true });
  }
}

function renderRootRedirect() {
  return `<!-- Generated by build-demo.js — do not edit directly -->
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="refresh" content="0; url=generated/index.html">
  <title>Actual CSS Demo</title>
  <link rel="canonical" href="generated/index.html">
</head>
<body>
  <p><a href="generated/index.html">Open the generated demo catalog</a>.</p>
</body>
</html>
`;
}

function writeGeneratedReadme() {
  writeFileSync(
    join(GENERATED_DEMO, "README.md"),
    `# Generated Demo

This directory is generated by \`bun run build:demo\`.

Do not edit files here directly. Edit \`docs/*.md\` or \`scripts/templates/*.html\`, then regenerate the demo catalog.
`,
  );
}

function main() {
  const categories = discoverCategories();
  mkdirSync(GENERATED_DEMO, { recursive: true });
  const results = categories.map((cat) => buildCategory(cat));
  const expected = new Set(results.map((category) => category.slug));

  removeGeneratedDirs(GENERATED_DEMO, expected);
  removeGeneratedDirs(DEMO, new Set(), new Set(["generated", "styles", "templates"]));
  writeGeneratedReadme();
  writeFileSync(join(GENERATED_DEMO, "index.html"), renderMainIndex(results));
  writeFileSync(join(DEMO, "index.html"), renderRootRedirect());

  console.log("Demo pages generated:");
  for (const r of results) {
    console.log(`  ${r.slug}/ (${r.sections.length} sections)`);
  }
}

function runBuild() {
  try {
    main();
  } catch (error) {
    console.error("Demo build failed:");
    console.error(error);
  }
}

function watchMode() {
  const watchTargets = [DOCS, join(__dirname, "templates")];
  const recursiveSupported = process.platform === "win32" || process.platform === "darwin";

  let timer = null;
  const scheduleBuild = () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      console.log("\nRebuilding demo...");
      runBuild();
    }, 100);
  };

  for (const target of watchTargets) {
    watch(target, { recursive: recursiveSupported }, (_eventType, filename) => {
      const changed = filename ? String(filename) : "unknown file";
      console.log(`Change detected in ${changed}`);
      scheduleBuild();
    });
  }

  console.log("Watching demo sources for changes...");
  for (const target of watchTargets) {
    console.log(`  ${target}`);
  }
  console.log("Press Ctrl+C to stop.");
}

runBuild();

if (process.argv.includes("--watch")) {
  watchMode();
}
