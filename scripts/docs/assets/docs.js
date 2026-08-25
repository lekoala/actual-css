/*
 * Docs site runtime — progressive enhancement only. The documentation and its
 * examples are fully usable without this script; it adds search, theme
 * persistence, and copy buttons.
 */
(() => {
  const THEME_KEY = "actual-docs-theme";

  /* --- Theme persistence --- */

  const themeSelect = document.querySelector("[data-docs-theme]");

  function applyTheme(theme) {
    if (!theme || theme === "system") {
      document.documentElement.removeAttribute("data-theme");
    } else {
      document.documentElement.setAttribute("data-theme", theme);
    }
  }

  if (themeSelect) {
    const storedTheme = localStorage.getItem(THEME_KEY);
    const current =
      storedTheme && themeSelect.querySelector(`option[value="${storedTheme}"]`)
        ? storedTheme
        : "system";
    themeSelect.value = current;
    applyTheme(current);

    themeSelect.addEventListener("change", () => {
      const theme = themeSelect.value;
      if (theme === "system") {
        localStorage.removeItem(THEME_KEY);
      } else {
        localStorage.setItem(THEME_KEY, theme);
      }
      applyTheme(theme);
    });
  }

  /* --- Copy code blocks --- */

  for (const codeBlock of document.querySelectorAll(".docs-code")) {
    const code = codeBlock.querySelector("code");
    if (!code) continue;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "btn sm ghost docs-copy";
    button.textContent = "Copy";
    button.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(code.innerText);
        button.textContent = "Copied";
        setTimeout(() => (button.textContent = "Copy"), 1500);
      } catch {
        // clipboard unavailable — leave the button inert rather than failing
      }
    });
    codeBlock.prepend(button);
  }

  /* --- Search --- */

  const searchDialog = document.getElementById("docs-search-dialog");
  const searchInput = searchDialog?.querySelector("input[type='search']");
  const searchResults = document.querySelector("[data-docs-search-results]");

  let index = [];
  let indexLoading = null;
  let results = [];
  let activeIndex = -1;

  // The site root seen from the current page: "../" on a subpage, "" on the
  // homepage. The builder writes it on <html data-site-root>, which keeps
  // result links correct no matter where the site is hosted (file:// or any
  // subpath) without guessing the structure from a stylesheet URL.
  function siteRoot() {
    return document.documentElement.getAttribute("data-site-root") ?? "";
  }

  // Loaded as a script, not fetched: fetch() of a local file is blocked from
  // file:// pages, but a <script> loads from disk fine. Search-index.js is
  // only downloaded on first use.
  async function loadIndex() {
    if (index.length > 0) return;
    if (!indexLoading) {
      indexLoading = (async () => {
        try {
          const root = siteRoot();
          const assetsDir = new URL(`${root}assets/`, document.baseURI);
          await new Promise((resolve) => {
            const script = document.createElement("script");
            script.src = new URL("search-index.js", assetsDir).href;
            script.onload = resolve;
            script.onerror = resolve;
            document.head.append(script);
          });
          index = window.__SEARCH_INDEX__ ?? [];
        } catch {
          index = [];
        }
      })();
    }
    await indexLoading;
  }

  function score(entry, query) {
    const q = query.toLowerCase();
    const title = (entry.title ?? "").toLowerCase();
    const description = (entry.description ?? "").toLowerCase();
    const text = (entry.text ?? "").toLowerCase();
    let score = 0;
    if (title === q) score += 100;
    else if (title.startsWith(q)) score += 60;
    else if (title.includes(q)) score += 30;
    for (const heading of entry.headings ?? []) {
      if (heading.toLowerCase().includes(q)) score += 20;
    }
    // Aliases stay below an exact title: a known synonym is the second-best
    // signal after the canonical name. Only "query contains alias" counts —
    // a short query must not inherit a boost from a longer alias.
    for (const alias of entry.aliases ?? []) {
      if (alias === q) score += 80;
      else if (q.includes(alias)) score += 40;
    }
    if (description.includes(q)) score += 10;
    if (text.includes(q)) score += 5;
    return score;
  }

  function renderResults() {
    if (!searchResults) return;
    activeIndex = -1;
    if (results.length === 0) {
      searchResults.innerHTML = "";
      return;
    }
    searchResults.innerHTML = results
      .map(
        (entry, i) =>
          `<li data-index="${i}"><a href="${siteRoot()}${entry.url}">${entry.title}` +
          (entry.description
            ? `<span class="docs-search-match"> — ${entry.description}</span>`
            : "") +
          `</a></li>`,
      )
      .join("");
  }

  function runSearch(query) {
    const q = query.trim();
    if (!q) {
      results = [];
      renderResults();
      return;
    }
    results = index
      .map((entry) => ({ entry, score: score(entry, q) }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map((item) => item.entry);
    renderResults();
  }

  function setActive(next) {
    if (!searchResults) return;
    const items = searchResults.querySelectorAll("li");
    if (items.length === 0) return;
    activeIndex = (next + items.length) % items.length;
    for (const item of items) item.classList.remove("docs-search-active");
    items[activeIndex].classList.add("docs-search-active");
    items[activeIndex].querySelector("a").focus();
  }

  if (searchDialog && searchInput && searchResults) {
    const openSearch = async () => {
      await loadIndex();
      if (!searchDialog.open) searchDialog.showModal();
      searchInput.value = "";
      runSearch("");
      searchInput.focus();
    };

    for (const trigger of document.querySelectorAll("[data-docs-search]")) {
      trigger.addEventListener("click", openSearch);
    }

    searchInput.addEventListener("input", () => runSearch(searchInput.value));

    searchInput.addEventListener("keydown", (event) => {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActive(activeIndex + 1);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setActive(activeIndex - 1);
      } else if (event.key === "Enter") {
        const target = results[activeIndex >= 0 ? activeIndex : 0];
        if (target) {
          event.preventDefault();
          target.url && location.assign(siteRoot() + target.url);
        }
      }
    });

    document.addEventListener("keydown", (event) => {
      const editing =
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target?.isContentEditable;
      if (editing) return;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        openSearch();
      } else if (event.key === "/") {
        event.preventDefault();
        openSearch();
      }
    });

    searchDialog.addEventListener("close", () => runSearch(""));
  }
})();
