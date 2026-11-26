# Empty state

> Guide users when a list is empty or a search has no results, with a message and an optional next action.

Compose the region from layout primitives; there is no empty-state component.

**Related terms:** blank slate, zero state, no data, no results, first run,
placeholder content.

## Anatomy

- An icon, decorative, with `aria-hidden="true"`.
- A heading at the level the page outline calls for: `<h2>` under the page
  title, `<h3>` inside a section. Pick the level for the outline and the size
  with a class, never the other way round.
- One sentence saying what belongs here or how to get it.
- Optional actions, the first one the way out.

```html demo
<section class="stack items-center text-center"
         aria-labelledby="empty-views-title">
  <i class="ti ti-layout-dashboard muted"
     aria-hidden="true"
     style="font-size: 2.5rem"></i>
  <hgroup>
    <h3 id="empty-views-title">No saved views yet</h3>
    <p class="muted">Save a filtered view to come back to this work faster.</p>
  </hgroup>
  <menu class="cluster">
    <li><button class="btn primary" type="button">Save current view</button></li>
    <li><button class="btn ghost" type="button">Clear filters</button></li>
  </menu>
</section>
```

For an icon on a tinted disc, compose an [icon slot](icon-slot.md).

## No results

Filter the list with `hidden` and announce the result count in a persistent
`role="status"` region. CSS shows the empty state when no list item is visible.
Browsers without `:has()` still show the count, including zero. When clearing
the search from the empty state, return focus to the field before the button
disappears. Try searching for “zebra”.

```html demo
<style>
  #member-empty {
    display: none;
  }

  #member-results:not(:has(> li:not([hidden]))) {
    display: none;
  }

  #member-results:not(:has(> li:not([hidden]))) + #member-empty {
    display: flex;
  }
</style>

<div class="stack">
  <div class="field">
    <label class="field-label" for="member-search">Search members</label>
    <input class="input" type="search" id="member-search">
  </div>

  <p class="muted" id="member-count" role="status">3 members found.</p>
  <ul class="list" id="member-results">
    <li class="list-item">Alice Chen</li>
    <li class="list-item">Bob Okafor</li>
    <li class="list-item">Charlie Ruiz</li>
  </ul>

  <section class="stack items-center text-center" id="member-empty"
           aria-labelledby="no-results-title">
    <hgroup>
      <h3 id="no-results-title">No matching members</h3>
      <p class="muted">Check the spelling, or clear the search to see everyone.</p>
    </hgroup>
    <button class="btn outline" type="button" id="clear-member-search">
      Clear search
    </button>
  </section>
</div>

<script type="module">
  const search = document.getElementById("member-search");
  const members = document.getElementById("member-results").children;
  const count = document.getElementById("member-count");

  function filterMembers() {
    const query = search.value.trim().toLowerCase();
    let matches = 0;

    for (const member of members) {
      member.hidden = !member.textContent.toLowerCase().includes(query);
      if (!member.hidden) matches += 1;
    }

    count.textContent = `${matches} ${matches === 1 ? "member" : "members"} found.`;
  }

  search.addEventListener("input", filterMembers);
  document.getElementById("clear-member-search").addEventListener("click", () => {
    search.value = "";
    search.focus();
    filterMembers();
  });

  filterMembers();
</script>
```
