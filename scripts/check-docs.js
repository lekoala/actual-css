/*
 * Structural checks for the docs site. Run with bun run check:docs.
 *
 * Verifies navigation.json against docs/pages, that every page is well-formed
 * (one H1, explicit fence languages), that slugs are unique, and that internal
 * links (including anchors) resolve.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, normalize, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { extractAliases, render, scanCodeFences } from "./docs/markdown.js";
import { loadNavigation } from "./docs/navigation.js";
import { relHref } from "./docs/templates.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const PAGES = join(ROOT, "docs", "pages");
const SITE = join(ROOT, "site");

const FENCE_LANGUAGES = new Set(["html", "css", "js", "javascript", "sh", "text"]);
const KNOWN_FENCE_FLAGS = new Set(["demo", "bare", "resize"]);

function isExternal(href) {
  return /^(?:[a-z]+:)?\/\//iu.test(href) || /^(?:mailto|tel):/iu.test(href);
}

function walkMarkdown(dir) {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walkMarkdown(full));
    else if (entry.name.endsWith(".md")) files.push(full);
  }
  return files;
}

function rel(file) {
  return relative(ROOT, file).replaceAll(sep, "/");
}

function main() {
  const issues = [];
  const navigation = loadNavigation(ROOT);
  const manifestFiles = new Map(
    navigation.pages.map((page) => [join(PAGES, page.file), { page, toc: [] }]),
  );

  const actualFiles = walkMarkdown(PAGES);

  for (const file of actualFiles) {
    if (!manifestFiles.has(file)) {
      issues.push(`${rel(file)}: not listed in docs/navigation.json`);
    }
  }

  const seenUrls = new Map();
  for (const page of navigation.pages) {
    const key = `${page.groupSlug}/${page.slug}`;
    if (seenUrls.has(key)) {
      issues.push(`docs/navigation.json: duplicate slug ${key}`);
    }
    seenUrls.set(key, page);

    const file = join(PAGES, page.file);
    if (!manifestFiles.has(file)) continue;

    const markdown = readFileSync(file, "utf8");
    const fences = scanCodeFences(markdown);
    const fencedLines = new Set(
      fences.flatMap((fence) =>
        Array.from({ length: fence.end - fence.start + 1 }, (_, offset) => fence.start + offset),
      ),
    );

    for (const [index, line] of markdown.split(/\r?\n/u).entries()) {
      if (
        !fencedLines.has(index) &&
        /^\s*<(?:article|aside|button|dialog|div|form|header|main|nav|section|table)\b/iu.test(line)
      ) {
        issues.push(
          `${rel(file)}:${index + 1}: live component markup must use an \`\`\`html demo fence so it stays outside .prose`,
        );
      }
    }

    for (const fence of fences) {
      if (!fence.language) {
        issues.push(`${rel(file)}: fence without a language (use \`\`\`html, \`\`\`css, ...)`);
      } else if (!FENCE_LANGUAGES.has(fence.language)) {
        issues.push(`${rel(file)}: unsupported fence language "${fence.language}"`);
      }
      if (fence.language.includes("{")) {
        issues.push(
          `${rel(file)}: legacy fence wrapper class "${fence.language}" — put layout in the example markup`,
        );
      }
      if (fence.demo && fence.language !== "html") {
        issues.push(`${rel(file)}: the demo flag is only supported on html fences`);
      }
      if (fence.flags.some((flag) => !KNOWN_FENCE_FLAGS.has(flag))) {
        issues.push(
          `${rel(file)}: unknown fence flag "${fence.flags.find((f) => !KNOWN_FENCE_FLAGS.has(f))}"`,
        );
      }
      if (fence.language === "html") {
        for (const match of fence.content.matchAll(/<(input|select|textarea)\b([^>]*)>/gu)) {
          const attrs = match[2];
          const hidden = /type\s*=\s*["']?(hidden|radio|checkbox)["']?/u.test(attrs);
          if (!/class\s*=/u.test(attrs) && !hidden) {
            issues.push(
              `${rel(file)}: bare <${match[1]}> in a code fence — add the component class (.input / .textarea / .select, ...)`,
            );
          }
        }
      }
    }

    const h1Count = (markdown.match(/^#\s+.+$/m) ?? []).length;
    if (h1Count !== 1) {
      issues.push(`${rel(file)}: expected exactly one H1, found ${h1Count}`);
    }

    if (/^\*\*Related terms:\*\*$/m.test(markdown)) {
      issues.push(
        `${rel(file)}: the Related terms line must list at least one term after the colon`,
      );
    } else if (
      /^\*\*Related terms:\*\*.+$/m.test(markdown) &&
      extractAliases(markdown).length === 0
    ) {
      issues.push(
        `${rel(file)}: Related terms parse to no aliases — check the comma-separated list`,
      );
    }

    const sourceRefs = new Set(
      [...markdown.matchAll(/src\/(?:css|js)\/[A-Za-z0-9_./-]+\.(?:css|js|ts)/g)].map((m) => m[0]),
    );
    for (const ref of sourceRefs) {
      if (!existsSync(join(ROOT, ref))) {
        issues.push(`${rel(file)}: references missing source file ${ref}`);
      }
    }

    const rendered = render(markdown);
    manifestFiles.get(file).toc = rendered.toc;
  }

  for (const file of actualFiles) {
    const markdown = readFileSync(file, "utf8");
    const pageDir = dirname(file);

    for (const match of markdown.matchAll(/\[[^\]]+\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)) {
      const href = match[1];
      if (isExternal(href)) continue;
      const [targetPath, anchor] = href.split("#");
      if (!targetPath) continue;
      if (!targetPath.endsWith(".md")) continue;

      const resolved = resolve(pageDir, targetPath);
      if (!resolved.startsWith(PAGES)) continue;
      const info = manifestFiles.get(resolved);
      if (!info) {
        issues.push(`${rel(file)}: broken link to ${href}`);
        continue;
      }
      if (anchor && !info.toc.some((heading) => heading.id === anchor)) {
        issues.push(
          `${rel(file)}: link to ${href} — missing anchor "${anchor}" in ${rel(resolved)}`,
        );
      }
    }
  }

  const pagesByUrl = new Map(navigation.pages.map((page) => [page.url, page]));
  for (const page of navigation.pages) {
    const generatedFile = join(SITE, page.url);
    if (existsSync(generatedFile)) {
      const html = readFileSync(generatedFile, "utf8");
      for (const match of html.matchAll(/\bhref="([^"]*\\[^"]*)"/gu)) {
        issues.push(`${page.url}: generated href contains a backslash: ${match[1]}`);
      }
    }

    const chain = [
      ["previous", page.previous],
      ["next", page.next],
    ];
    for (const [kind, linked] of chain) {
      if (!linked) continue;
      const href = relHref(page.url, linked.url);
      if (normalize(join(dirname(page.url), href)) !== normalize(linked.url)) {
        issues.push(
          `${page.url}: ${kind} link renders as "${href}" but should point at ${linked.url}`,
        );
      }
      if (!pagesByUrl.has(linked.url)) {
        issues.push(`${page.url}: ${kind} target ${linked.url} is not a generated page`);
      }
    }
  }

  if (issues.length > 0) {
    console.error("Docs check failed.");
    for (const issue of issues) console.error(`- ${issue}`);
    process.exit(1);
  }

  console.log(`Docs check passed (${navigation.pages.length} pages, ${actualFiles.length} files).`);
}

main();
