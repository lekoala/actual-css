# Examples

> Real pages built with Actual CSS - an admin application and a set of standalone templates - to see the primitives, components, and patterns composed the way they are meant to be used.

The examples live in the repository under `demo/` and load `actual.full.css`
and `actual.full.js` from `dist/`, plus the theme palettes bundle from
`demo/assets/` (`bun run build:themes`), referenced with stable URLs.

## Admin application

`demo/admini/` is a complete admin interface: application shell, navigation,
tables, forms, dialogs, and feedback states.

- [Dashboard](../../demo/admini/index.html) - app shell, navbar, stat cards, charts, recent activity
- [Login](../../demo/admini/login.html) - centered auth card with social actions
- [Forms](../../demo/admini/forms.html) - inputs, choice cards, validation, joined controls, sticky actions
- [Tables](../../demo/admini/tables.html) - data tables, status badges, bulk actions
- [Kanban](../../demo/admini/kanban.html) - drag-free column layout with cards
- [Chat](../../demo/admini/chat.html) - conversation list, message thread, composer
- [Calendar](../../demo/admini/calendar.html) - month grid with event cards
- [Invoice](../../demo/admini/invoice.html) - structured document layout
- [Profile](../../demo/admini/profile.html) - avatar, tabs, settings rows
- [Settings](../../demo/admini/settings.html) - grouped settings with switches
- [User grid](../../demo/admini/user-grid.html) - avatar grid, filters, pagination
- [404](../../demo/admini/404.html) - empty state

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

> Note: the examples reference the repository's source files, so they open from
> the checkout, not from a standalone copy of `site`.
