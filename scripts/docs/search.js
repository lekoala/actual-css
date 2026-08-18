/*
 * Search index generation. One entry per page, plain-text body for scoring.
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
      text: stripHtml(result.html),
    };
  });
}