# Examples

> Real pages built with Actual CSS to see the primitives, components, and patterns composed the way they are meant to be used.

The examples live in the repository under `demo/` and load `actual.full.css`
and `actual.full.js` from `dist/`, plus the theme palettes bundle from
`demo/assets/` (`bun run build:themes`).

## Templates

`demo/templates/` are standalone pages covering common page shapes.

- [Kitchen sink](../../demo/templates/kitchen-sink.html) - every component and variant on one page
- [Keyboard controls](../../demo/templates/keyboard-controls.html) - hands-on keyboard support matrix and focus test bench
- [Surface contracts](../../demo/templates/surfaces.html) - .inverted, cascade precedence, and the intent boundary
- [Dashboard](../../demo/templates/dashboard.html) - data-heavy overview page
- [App](../../demo/templates/app.html) - application shell with sidebar
- [Marketing](../../demo/templates/marketing.html) - landing page with typography and fluid type
- [Blog](../../demo/templates/blog.html) - article page with prose
- [Blocks](../../demo/templates/blocks.html) - layout building blocks
- [Layout reference](../../demo/templates/layouts.html) - canonical compositions built only with the layout primitives
- [Grid density](../../demo/templates/grid.html) - the grid contracts on resizable stages, with the pitfalls called out
- [Density](../../demo/templates/density.html) - compact control density

## Sites

Full sites demo living in `demo/sites`.

### Admin application

`demo/sites/admini/` is a complete admin interface: application shell, navigation,
tables, forms, dialogs, and feedback states.

- [Dashboard](../../demo/sites/admini/index.html) - app shell, navbar, stat cards, quota meter, recent activity
- [Login](../../demo/sites/admini/login.html) - centered auth card with social actions
- [Forms](../../demo/sites/admini/forms.html) - inputs, choice cards, validation, joined controls
- [Tables](../../demo/sites/admini/tables.html) - data tables, status badges, right-click row actions
- [Kanban](../../demo/sites/admini/kanban.html) - drag-and-drop columns with card context menus
- [Chat](../../demo/sites/admini/chat.html) - conversation list, message thread, composer
- [Calendar](../../demo/sites/admini/calendar.html) - month grid with event chips and month navigation
- [Invoice](../../demo/sites/admini/invoice.html) - structured document layout, print styles
- [Profile](../../demo/sites/admini/profile.html) - avatar header, tabs, activity feed
- [Settings](../../demo/sites/admini/settings.html) - vertical tabs, validation, confirmation dialog
- [User grid](../../demo/sites/admini/user-grid.html) - avatar grid with live search and role filter
- [404](../../demo/sites/admini/404.html) - error state

### Neon ramen

`demo/sites/neon-ramen/` is a complete restaurant storefront: campaign home,
menu browsing, item customization, locations, and checkout validation flow.

- [Home](../../demo/sites/neon-ramen/index.html) - campaign landing, hero story, live cart summary
- [Menu](../../demo/sites/neon-ramen/menu.html) - tabbed categories with equal-height product cards
- [Item](../../demo/sites/neon-ramen/item.html) - product configurator with choice cards and form controls
- [Locations](../../demo/sites/neon-ramen/locations.html) - responsive shop list with practical location metadata
- [Order](../../demo/sites/neon-ramen/order.html) - checkout form with validation feedback states


> Note: the examples reference the repository's source files, so they open from
> the checkout, not from a standalone copy of `site`.
