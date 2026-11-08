/*
 * Docs site runtime — progressive enhancement only. The documentation and its
 * examples are fully usable without this script; it adds search, theme
 * persistence, and copy buttons.
 */
(() => {
  const THEME_KEY = "actual-docs-theme";

  /* --- Theme persistence --- */

  /* The theme select is duplicated: the header keeps it while there is room,
     the drawer carries it below the compact-header breakpoint. Bind every
     copy and mirror a change across the rest, or the hidden one drifts. */
  const themeSelects = [...document.querySelectorAll("[data-docs-theme]")];

  function applyTheme(theme) {
    if (!theme || theme === "system") {
      document.documentElement.removeAttribute("data-theme");
    } else {
      document.documentElement.setAttribute("data-theme", theme);
    }
  }

  if (themeSelects.length > 0) {
    const storedTheme = localStorage.getItem(THEME_KEY);
    const current =
      storedTheme && themeSelects[0].querySelector(`option[value="${storedTheme}"]`)
        ? storedTheme
        : "system";
    for (const select of themeSelects) {
      select.value = current;
      select.addEventListener("change", () => {
        const theme = select.value;
        if (theme === "system") {
          localStorage.removeItem(THEME_KEY);
        } else {
          localStorage.setItem(THEME_KEY, theme);
        }
        applyTheme(theme);
        for (const other of themeSelects) other.value = theme;
      });
    }
    applyTheme(current);
  }

  /* --- Collapsed nav groups --- */

  /* A collapsed group would reopen on every page, since each page renders its
     groups open. Remember the collapsed ones for the session, but never hide
     the current page's link: its group opens whatever was stored. Storage can
     throw (blocked site data); the nav then just stays open. Restored before
     the reveal below, which measures the open layout. */
  const NAV_KEY = "actual-docs-collapsed";
  const navGroups = [...document.querySelectorAll("details[data-docs-nav-group]")];
  if (navGroups.length > 0) {
    let collapsed = new Set();
    try {
      collapsed = new Set(JSON.parse(sessionStorage.getItem(NAV_KEY) ?? "[]"));
    } catch {}
    for (const group of navGroups) {
      const current = group.querySelector('[aria-current="page"]');
      group.open = Boolean(current) || !collapsed.has(group.dataset.docsNavGroup);
      group.addEventListener("toggle", () => {
        if (group.open) collapsed.delete(group.dataset.docsNavGroup);
        else collapsed.add(group.dataset.docsNavGroup);
        try {
          sessionStorage.setItem(NAV_KEY, JSON.stringify([...collapsed]));
        } catch {}
      });
    }
  }

  /* --- Reveal active nav item --- */

  /* The sidebar is its own scroll container, so a deep link loads with the
     current page's link wherever it falls and the browser never brings it into
     view. Move the container itself; scrollIntoView would also scroll the
     document. Center only when the link is clipped, so short pages stay still.
     A hidden sidebar has no height and is skipped. */
  const sidebar = document.querySelector(".docs-sidebar");
  const activeNavLink = sidebar?.querySelector('.nav-link[aria-current="page"]');
  if (sidebar && activeNavLink && sidebar.clientHeight > 0) {
    const box = sidebar.getBoundingClientRect();
    const link = activeNavLink.getBoundingClientRect();
    if (link.top < box.top || link.bottom > box.bottom) {
      sidebar.scrollTop += link.top - box.top - (box.height - link.height) / 2;
    }
  }

  /* --- Copy code blocks --- */

  // The button lives in the block's bar, never over the code: an absolutely
  // placed button covered the first line on narrow screens.
  for (const codeBlock of document.querySelectorAll(".docs-code")) {
    const code = codeBlock.querySelector("code");
    const bar = codeBlock.querySelector(".docs-code-bar");
    if (!code || !bar) continue;
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
    bar.append(button);
  }

  /* --- Search --- */

  const searchDialog = document.getElementById("docs-search-dialog");
  const searchInput = searchDialog?.querySelector("input[type='search']");
  const searchResults = document.querySelector("[data-docs-search-results]");
  const searchEmpty = document.querySelector("[data-docs-search-empty]");

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

  // Ranking mirrors scoreEntry() in scripts/docs/search.js (kept self-contained:
  // this file ships without a bundler). Parity is enforced by
  // tests/browser/docs-search.test.js.
  function tokenize(value) {
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
    const identifier = !/^\w/.test(query);
    const start = identifier ? "(?<![\\w-])" : "\\b";
    const end = identifier || !/\w$/.test(query) ? "(?![\\w-])" : "\\b";
    return new RegExp(`${start}${escapeRegExp(query)}${end}`).test(haystack);
  }

  function score(entry, query) {
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
      let titleBonus = 0;
      if (title.startsWith(q)) titleBonus = Math.max(titleBonus, 60);
      if (title.includes(q)) titleBonus = Math.max(titleBonus, 30);
      if (tokenize(title).some((token) => qTokens.has(token))) {
        titleBonus = Math.max(titleBonus, 35);
      }
      score += titleBonus;
    }
    let aliasBonus = 0;
    for (const raw of entry.aliases ?? []) {
      const alias = raw.toLowerCase();
      const aliasTokens = tokenize(alias);
      if (alias === q) {
        aliasBonus = Math.max(aliasBonus, 80);
      } else if (aliasTokens.length > 0 && aliasTokens.every((token) => qTokens.has(token))) {
        aliasBonus = Math.max(aliasBonus, 50);
      } else if (aliasTokens.some((token) => qTokens.has(token))) {
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

  // Index fields are plain text: markdown.js decodes entities, so a title or
  // description can carry a literal "<textarea>". Escape before it reaches
  // innerHTML or it renders as markup instead of a match label.
  function escapeHtml(value) {
    return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  // The first heading containing the query, so a result opens on its section.
  function matchedHeading(entry, q) {
    const i = (entry.headings ?? []).findIndex((label) => label.toLowerCase().includes(q));
    return i < 0 ? null : { label: entry.headings[i], id: entry.anchors?.[i] };
  }

  function renderResults(query = "") {
    if (!searchResults) return;
    activeIndex = -1;
    searchInput?.removeAttribute("aria-activedescendant");
    searchInput?.setAttribute("aria-expanded", String(results.length > 0));
    if (searchEmpty) {
      searchEmpty.textContent =
        query && results.length === 0
          ? `No results for “${query}”. Try a class, a hook or a component name.`
          : "";
    }
    if (results.length === 0) {
      searchResults.innerHTML = "";
      return;
    }
    const q = query.toLowerCase();
    searchResults.innerHTML = results
      .map((entry, i) => {
        const heading = matchedHeading(entry, q);
        const hash = heading?.id ? `#${heading.id}` : "";
        const meta = [entry.group, entry.description].filter(Boolean).map(escapeHtml).join(" · ");
        return (
          `<li id="docs-search-opt-${i}" role="option" aria-selected="false" data-index="${i}">` +
          `<a href="${siteRoot()}${entry.url}${hash}" tabindex="-1">${escapeHtml(entry.title)}` +
          (heading ? ` › ${escapeHtml(heading.label)}` : "") +
          (meta ? `<span class="docs-search-match"> — ${meta}</span>` : "") +
          `</a></li>`
        );
      })
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
      .sort((a, b) => b.score - a.score || a.entry.title.localeCompare(b.entry.title))
      .slice(0, 8)
      .map((item) => item.entry);
    renderResults(q);
  }

  // Focus stays in the input; arrows move the highlight via
  // aria-activedescendant. Moving focus onto a result link would leave the
  // input's keydown handler and strand arrow navigation after the first item.
  function setActive(next) {
    if (!searchResults || !searchInput) return;
    const items = searchResults.querySelectorAll("li");
    if (items.length === 0) return;
    activeIndex = (next + items.length) % items.length;
    for (const item of items) {
      item.classList.remove("docs-search-active");
      item.setAttribute("aria-selected", "false");
    }
    const current = items[activeIndex];
    current.classList.add("docs-search-active");
    current.setAttribute("aria-selected", "true");
    searchInput.setAttribute("aria-activedescendant", current.id);
    current.scrollIntoView({ block: "nearest" });
  }

  // A #section on the current page navigates without unloading it, so the
  // modal would stay open over the section it was asked to show.
  function closeForSamePage(link) {
    const target = new URL(link.href);
    if (target.pathname === location.pathname && target.search === location.search) {
      searchDialog.close();
    }
  }

  // The rendered link is the one destination: click and Enter must agree,
  // including the #section a result adds when a heading matched.
  function goToResult(index) {
    const link = searchResults.querySelector(`#docs-search-opt-${index} a`);
    if (!link) return;
    const href = link.href;
    closeForSamePage(link);
    location.assign(href);
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

    // Only the input owns result navigation: dialog buttons and result links
    // keep their native activation, and IME confirmation stays in the editor.
    searchInput.addEventListener("keydown", (event) => {
      if (event.defaultPrevented || event.isComposing || event.keyCode === 229) return;
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActive(activeIndex + 1);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setActive(activeIndex < 0 ? results.length - 1 : activeIndex - 1);
      } else if (event.key === "Home") {
        event.preventDefault();
        setActive(0);
      } else if (event.key === "End") {
        event.preventDefault();
        setActive(results.length - 1);
      } else if (event.key === "Enter") {
        if (results.length > 0) {
          event.preventDefault();
          goToResult(Math.max(activeIndex, 0));
        }
      }
    });

    searchResults.addEventListener("mousemove", (event) => {
      const item = event.target.closest("li[data-index]");
      if (item) setActive(Number(item.dataset.index));
    });

    searchResults.addEventListener("click", (event) => {
      const link = event.target.closest("a[href]");
      if (link) closeForSamePage(link);
    });

    searchDialog.querySelector("[data-docs-search-form]")?.addEventListener("submit", (event) => {
      // Always cancel: implicit submission would request-close the dialog
      // without navigating.
      event.preventDefault();
      if (results.length > 0) goToResult(Math.max(activeIndex, 0));
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
