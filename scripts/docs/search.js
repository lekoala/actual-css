/*
 * Search index generation and ranking. One entry per page, plain-text body
 * for scoring. scoreEntry() is the source of truth for ranking — the docs
 * runtime in scripts/docs/assets/docs.js mirrors it (no bundler there);
 * tests/browser/docs-search.test.js enforces the parity.
 */

function stripHtml(html) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

export function buildSearchIndex(navigation, rendered) {
  return navigation.pages.map((page) => {
    const result = rendered.get(page.file);
    return {
      title: page.title ?? page.slug,
      description: page.description ?? "",
      group: page.groupTitle,
      url: page.url,
      headings: result.toc.map((heading) => heading.label),
      aliases: result.aliases ?? [],
      text: stripHtml(result.html),
    };
  });
}

/* Tokenize on non-alphanumerics so ".select" and "select" share the token
   "select", while "selection" stays a different token. */
export function tokenize(value) {
  return (value ?? "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function hasWord(haystack, query) {
  if (!query) return false;
  return new RegExp(`\\b${escapeRegExp(query)}\\b`).test(haystack);
}

/*
 * Ranking weights: title exact > alias exact > title prefix > alias token >
 * title token > title substring > heading > description > body word > body
 * substring fallback. Body substring is a recall fallback only (+1) so a page
 * merely containing "selection" cannot tie with a page about a "select".
 */
export function scoreEntry(entry, query) {
  const q = query.trim().toLowerCase();
  if (!q) return 0;
  const qTokens = new Set(tokenize(q));
  const title = (entry.title ?? "").toLowerCase();
  const description = (entry.description ?? "").toLowerCase();
  const text = (entry.text ?? "").toLowerCase();
  let score = 0;
  if (title === q) {
    score += 100;
  } else {
    // Each signal counts once at its best weight: a title containing the
    // query as both substring and token takes the token weight.
    let titleBonus = 0;
    if (title.startsWith(q)) titleBonus = Math.max(titleBonus, 60);
    if (title.includes(q)) titleBonus = Math.max(titleBonus, 30);
    if (tokenize(title).some((token) => qTokens.has(token))) {
      titleBonus = Math.max(titleBonus, 35);
    }
    score += titleBonus;
  }
  // Best alias wins once: three aliases sharing one token must not triple it.
  let aliasBonus = 0;
  for (const raw of entry.aliases ?? []) {
    const alias = raw.toLowerCase();
    const aliasTokens = tokenize(alias);
    if (alias === q) {
      aliasBonus = Math.max(aliasBonus, 80);
    } else if (aliasTokens.length > 0 && aliasTokens.every((token) => qTokens.has(token))) {
      // Multi-word alias fully covered by the query ("custom select" covers
      // alias "select", or vice versa through the token overlap below).
      aliasBonus = Math.max(aliasBonus, 50);
    } else if (aliasTokens.some((token) => qTokens.has(token))) {
      // Query token inside a longer alias: "select" matches an entry aliased
      // "searchable select" even though neither string contains the other.
      aliasBonus = Math.max(aliasBonus, 50);
    } else if (q.includes(alias)) {
      aliasBonus = Math.max(aliasBonus, 40);
    }
  }
  score += aliasBonus;
  for (const heading of entry.headings ?? []) {
    const label = heading.toLowerCase();
    if (label.includes(q)) score += 20;
    else if (tokenize(label).some((token) => qTokens.has(token))) score += 15;
  }
  if (hasWord(description, q)) score += 10;
  else if (description.includes(q)) score += 2;
  if (hasWord(text, q)) score += 5;
  else if (text.includes(q)) score += 1;
  return score;
}

/* Top-8 matches, deterministic on ties so nav order cannot hide the best page. */
export function searchEntries(index, query) {
  const q = query.trim();
  if (!q) return [];
  return index
    .map((entry) => ({ entry, score: scoreEntry(entry, q) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.entry.title.localeCompare(b.entry.title))
    .slice(0, 8)
    .map((item) => item.entry);
}
