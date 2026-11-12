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

An empty search names the query and offers to clear it. Clearing removes the
empty state and the button with it, so move focus back to the search field;
otherwise it falls to the page.

```html demo
<div class="stack">
  <div class="field">
    <label class="field-label" for="member-search">Search members</label>
    <input class="input" type="search" id="member-search" value="zebra">
  </div>

  <section class="stack items-center text-center"
           id="no-results"
           aria-labelledby="no-results-title">
    <hgroup>
      <h3 id="no-results-title">No members match “zebra”</h3>
      <p class="muted">Check the spelling, or clear the search to see everyone.</p>
    </hgroup>
    <button class="btn outline" type="button" id="clear-member-search">
      Clear search
    </button>
  </section>
</div>

<script>
  const search = document.getElementById("member-search");
  const noResults = document.getElementById("no-results");

  document.getElementById("clear-member-search").addEventListener("click", () => {
    search.value = "";
    noResults.hidden = true;
    search.focus();
  });
</script>
```
