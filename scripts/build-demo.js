import { readFileSync, writeFileSync, mkdirSync, readdirSync, unlinkSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import Prism from "prismjs";
import "prismjs/components/prism-markup.js";
import "prismjs/components/prism-css.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const DEMO = join(ROOT, "demo");
const DOCS = join(ROOT, "docs", "manual");

const config = JSON.parse(readFileSync(join(__dirname, "demo-config.json"), "utf8"));

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

function parseMarkdown(content) {
  const lines = content.split("\n");
  const sections = [];
  let current = null;
  let codeBlock = null;
  let codeWrapperClasses = "";
  let codeLines = [];

  for (const line of lines) {
    const h2Match = line.match(/^## (.+)$/);

    if (h2Match && !codeBlock) {
      if (current) sections.push(current);
      current = { title: h2Match[1], slug: slugify(h2Match[1]), blocks: [], desc: "" };
      continue;
    }

    if (line.startsWith("```") && !codeBlock) {
      const match = line.match(/^```(\w+)(?:\{([^}]*)\})?\s*$/);
      const lang = match?.[1] || "html";
      const wrapperClasses = match?.[2]?.split(/\s+/).map(c => c.replace(/^\./, "")).join(" ") || "";
      codeBlock = lang;
      codeWrapperClasses = wrapperClasses;
      codeLines = [];
      continue;
    }

    if (line.startsWith("```") && codeBlock) {
      const code = codeLines.join("\n");
      if (current) {
        current.blocks.push({ lang: codeBlock, code, wrapperClasses: codeWrapperClasses });
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

    if (line.startsWith("Links:")) continue;
    if (line.match(/^- https?:\/\//)) continue;

    const trimmed = line.trim();
    if (trimmed === "") continue;
    if (trimmed.startsWith("### ")) continue;

    if (trimmed.startsWith("- ")) {
      if (!current.desc) current.desc = trimmed.slice(2);
      continue;
    }

    if (!current.desc) {
      current.desc = trimmed;
    }
  }

  if (current) sections.push(current);
  return sections.filter((s) => s.blocks.length > 0);
}

function renderBlocks(blocks) {
  let html = "";
  for (const block of blocks) {
    const grammar = block.lang === "css" ? Prism.languages.css : Prism.languages.markup;
    const highlighted = Prism.highlight(block.code, grammar, block.lang);
    const wrapperClass = block.wrapperClasses ? ` ${block.wrapperClasses}` : "";

    if (block.lang === "css") {
      html += `    <section class="component-section">\n`;
      html += `      <h2>CSS</h2>\n`;
      html += `      <div class="example-group">\n`;
      html += `        <div class="example-code">\n`;
      html += `          <pre><code class="language-${block.lang}">${highlighted}</code></pre>\n`;
      html += `        </div>\n`;
      html += `      </div>\n`;
      html += `    </section>\n`;
    } else {
      html += `    <section class="component-section">\n`;
      html += `      <div class="example-group">\n`;
      html += `        <div class="example-render${wrapperClass}">\n`;
      html += `          ${block.code}\n`;
      html += `        </div>\n`;
      html += `        <div class="example-code">\n`;
      html += `          <pre><code class="language-${block.lang}">${highlighted}</code></pre>\n`;
      html += `        </div>\n`;
      html += `      </div>\n`;
      html += `    </section>\n`;
    }
  }
  return html;
}

function renderPage(catName, section) {
  const desc = section.desc ? `<p>${escapeHtml(section.desc)}</p>` : "";
  const content = renderBlocks(section.blocks);

  return templates.page
    .replace(/\{\{title\}\}/g, escapeHtml(section.title))
    .replace(/\{\{category\}\}/g, escapeHtml(catName))
    .replace(/\{\{desc\}\}/g, desc)
    .replace(/\{\{content\}\}/g, content)
    .replace(/\{\{cssPath\}\}/g, "../../src")
    .replace(/\{\{demoCssPath\}\}/g, "../..");
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
      </article>\n`;
  }

  return templates.index
    .replace(/\{\{title\}\}/g, escapeHtml(catName))
    .replace(/\{\{desc\}\}/g, escapeHtml(catDesc))
    .replace(/\{\{cards\}\}/g, cards)
    .replace(/\{\{cssPath\}\}/g, "../../src")
    .replace(/\{\{demoCssPath\}\}/g, "../..");
}

function renderMainIndex(categories) {
  let links = "";
  for (const cat of categories) {
    links += `    <li><a href="${cat.slug}/index.html">${cat.name}</a></li>\n`;
  }

  return templates.mainIndex
    .replace(/\{\{links\}\}/g, links)
    .replace(/\{\{cssPath\}\}/g, "src");
}

function buildCategory(category) {
  const md = readFileSync(join(DOCS, category.file), "utf8");
  const sections = parseMarkdown(md);
  const slug = slugify(category.name);
  const dir = join(DEMO, slug);

  mkdirSync(dir, { recursive: true });
  for (const file of readdirSync(dir)) {
    if (file.endsWith(".html")) unlinkSync(join(dir, file));
  }

  writeFileSync(join(dir, "index.html"), renderIndex(category.name, category.desc, sections));
  for (const section of sections) {
    writeFileSync(join(dir, `${section.slug}.html`), renderPage(category.name, section));
  }

  return { name: category.name, slug, sections };
}

function main() {
  const results = config.map((cat) => buildCategory(cat));
  writeFileSync(join(DEMO, "index.html"), renderMainIndex(results));

  console.log("Demo pages generated:");
  for (const r of results) {
    console.log(`  ${r.slug}/ (${r.sections.length} sections)`);
  }
}

main();
