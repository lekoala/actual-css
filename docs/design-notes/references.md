# References

## Positioning

Actual CSS is for new projects that want semantic HTML, small class APIs, theme tokens, and progressive enhancement without a build step.

It claims a small public grammar: `.component [intent] [variant] [size] [modifier]`. For existing projects with collisions, use cascade layers, import order, or an application-side prefix transform.

### Non-goals

- No legacy drop-in promise.
- No large utility surface.
- No compatibility build that rewrites the product.
- No complex widgets.

## Previous work

Prior Actual CSS libraries:

- https://github.com/lekoala/liveinit
- https://github.com/lekoala/modern-now
- unpublished css library

## Research links

### Forms

- https://oat.ink/components/#form
- https://picocss.com/docs/forms
- https://picocss.com/docs/group
- https://getbootstrap.com/docs/5.3/forms/overview/
- https://developer.chrome.com/blog/a-customizable-select
- https://modern-css.com/customizable-selects-without-a-javascript-library/
- https://smolcss.dev/#smol-focus-styles
- https://daisyui.com/components/checkbox/
- https://daisyui.com/components/fieldset/
- https://daisyui.com/components/label/
- https://daisyui.com/components/radio/
- https://daisyui.com/components/range/
- https://daisyui.com/components/select/
- https://daisyui.com/components/textarea/
- https://daisyui.com/components/toggle/
- https://uiterms.com/slider/
- https://uiterms.com/switch/
- https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/label
- https://open-ui.org/components/checkbox.research/
- https://open-ui.org/components/radio-button.research/
- https://open-ui.org/components/select.research/
- https://open-ui.org/components/slider.research/
- https://open-ui.org/components/switch/
- https://daisyui.com/components/validator/
- https://getbootstrap.com/docs/5.3/forms/validation/
- https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/switch_role

### Components: Accordion

- https://picocss.com/docs/accordion
- https://oat.ink/components/#accordion
- https://daisyui.com/components/accordion/
- https://getbootstrap.com/docs/5.3/components/accordion/
- https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/details
- https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/summary
- https://semantic-ui.com/modules/accordion.html
- https://modern-css.com/accordion-without-javascript/
- https://modern-css.com/exclusive-accordions-without-javascript/
- https://uiterms.com/accordion/
- https://basecoatui.com/components/accordion/
- https://open-ui.org/components/accordion.explainer/

### Components: Alert

- https://oat.ink/components/#alert
- https://getbootstrap.com/docs/5.3/components/alerts/
- https://playground.halfaccessible.com/aria-reference/alert-role
- https://www.a11y-collective.com/blog/aria-alert/
- https://primer.style/accessibility/patterns/accessible-notifications-and-messages/
- https://uiterms.com/alert/
- https://open-ui.org/components/alert.research/
- https://kelpui.com/docs/components/callouts/

### Components: Avatar

- https://oat.ink/components/#avatar
- https://daisyui.com/components/avatar/
- https://smolcss.dev/#smol-avatar-list
- https://open-ui.org/components/avatar.research/

### Components: Badge

- https://oat.ink/components/#badge
- https://daisyui.com/components/badge/
- https://semantic-ui.com/elements/label.html
- https://getbootstrap.com/docs/5.3/components/badge/
- https://uiterms.com/badge/
- https://m3.material.io/components/badges/overview
- https://daisyui.com/components/indicator/
- https://open-ui.org/components/badge.research/
- https://kelpui.com/docs/components/badges/

### Components: Breadcrumb

- https://oat.ink/components/#breadcrumb
- https://daisyui.com/components/breadcrumbs/
- https://getbootstrap.com/docs/5.3/components/breadcrumb/
- https://gomakethings.com/articles/creating-unstyled-lists/
- https://uiterms.com/breadcrumbs/
- https://open-ui.org/components/breadcrumb.research/

### Components: Button

- https://picocss.com/docs/button
- https://daisyui.com/components/button/
- https://semantic-ui.com/elements/button.html
- https://bulma.io/documentation/elements/button/
- https://oat.ink/components/#button
- https://getbootstrap.com/docs/5.3/components/buttons/
- https://moderncss.dev/icon-button-css-styling-guide/
- https://moderncss.dev/css-button-styling-guide/
- https://codepen.io/lekoalabe/pen/RNaXBBP
- https://codepen.io/lekoalabe/pen/oNORPZP
- https://piccalil.li/blog/how-i-build-a-button-component/
- https://open-ui.org/components/button/
- https://kelpui.com/docs/components/buttons/

### Components: Card

- https://oat.ink/components/#card
- https://daisyui.com/components/card/
- https://picocss.com/docs/card
- https://getbootstrap.com/docs/5.3/components/card/
- https://semantic-ui.com/views/card.html
- https://smolcss.dev/#smol-card-component
- https://uiterms.com/card/
- https://open-ui.org/components/card.research/

### UI: Drawer

- https://oat.ink/components/#sidebar
- https://daisyui.com/components/drawer/
- https://mac81.github.io/pure-drawer/
- https://codepen.io/nwest88/pen/PwwZpv
- https://uiterms.com/drawer/
- https://v6-dev--twbs-bootstrap.netlify.app/docs/6.0/components/drawer/

### Components: Meter

- https://oat.ink/components/#meter

### UI: Modal / Dialog

- https://oat.ink/components/#dialog
- https://picocss.com/docs/modal
- https://daisyui.com/components/modal/
- https://getbootstrap.com/docs/5.3/components/modal/
- https://modern-css.com/modal-dialogs-without-a-javascript-library/
- https://modern-css.com/full-width-without-horizontal-scrollbar-overflow/
- https://modern-css.com/modal-controls-without-onclick-handlers/
- https://modern-css.com/dialog-light-dismiss-without-click-outside-listeners/
- https://uiterms.com/alert-dialog/
- https://uiterms.com/dialog/
- https://codepen.io/lekoalabe/pen/GgKOKOE
- https://pqina.nl/blog/animating-the-dialog-element-using-view-transitions/
- https://basecoatui.com/components/alert-dialog/
- https://v6-dev--twbs-bootstrap.netlify.app/docs/6.0/components/dialog/
- https://open-ui.org/components/invokers.explainer/
- https://open-ui.org/components/dialog.research/
- https://kelpui.com/docs/components/dialog/

### Components: Pagination

- https://oat.ink/components/#pagination
- https://daisyui.com/components/pagination/
- https://uiterms.com/pagination/

### Components: Progress

- https://oat.ink/components/#progress
- https://daisyui.com/components/progress/
- https://picocss.com/docs/progress
- https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/progress
- https://getbootstrap.com/docs/5.3/components/progress/
- https://codepen.io/lekoalabe/pen/NWEzXMO

### Components: Spinner

- https://oat.ink/components/#spinner
- https://picocss.com/docs/loading
- https://daisyui.com/components/loading/
- https://kelpui.com/docs/components/spinner/

### Components: Skeleton

- https://oat.ink/components/#skeleton
- https://daisyui.com/components/skeleton/
- https://github.com/Aejkatappaja/phantom-ui
- https://kelpui.com/docs/components/skeleton/

### Components: Table

- https://picocss.com/docs/table
- https://oat.ink/components/#table
- https://getbootstrap.com/docs/5.3/content/tables/
- https://piccalil.li/blog/styling-tables-the-modern-css-way/
- https://open-ui.org/components/table.research/

### Layout: Stack

- https://github.com/knadh/oat/blob/master/src/css/utilities.css
- https://every-layout.dev/layouts/stack/
- https://kelpui.com/docs/layout/stack/

### Layout: Cluster

- https://modern-css.com/spacing-elements-without-margin-hacks/
- https://every-layout.dev/layouts/cluster/
- https://kelpui.com/docs/layout/cluster/

### Layout: Center

- https://picocss.com/docs/container
- https://smolcss.dev/#smol-container
- https://every-layout.dev/layouts/center/

### Layout: List

- https://daisyui.com/components/list/
- https://html.spec.whatwg.org/multipage/grouping-content.html#the-li-element
- https://open-ui.org/components/list.research/

### Layout: Grid

- https://picocss.com/docs/grid
- https://oat.ink/components/#grid
- https://modern-css.com/grid-layout-without-extra-wrappers/
- https://moderncss.dev/3-css-grid-techniques-to-make-you-a-grid-convert/
- https://smolcss.dev/#smol-css-grid
- https://kelpui.com/docs/layout/grid/

### Layout: Sidebar

- https://every-layout.dev/layouts/sidebar/
- https://kelpui.com/docs/layout/sidecar/

### Layout: Switcher

- https://every-layout.dev/layouts/switcher/

### Layout: Frame

- https://every-layout.dev/layouts/frame/

### Layout: Header and Footer

- https://uiterms.com/sticky-header/
- https://developer.mozilla.org/en-US/docs/Web/CSS/How_to/Layout_cookbook/Sticky_footers
- https://crinkles.dev/writing/enhanced-sticky-footer/
- https://prismic.io/blog/css-sticky-footers
- https://modern-css.com/sticky-headers-without-javascript-scroll-listeners/
- https://picocss.com/docs/landmarks-section

### Utilities

- https://piccalil.li/blog/a-modern-css-reset/
- https://www.a11yproject.com/posts/how-to-hide-content/
- https://getbootstrap.com/docs/5.3/content/tables/#responsive-tables
- https://picocss.com/docs/overflow-auto
- https://github.com/knadh/oat/blob/master/src/css/utilities.css

### Tokens

- https://primer.style/product/primitives/
- https://picocss.com/docs/css-variables
- https://nordhealth.design/tokens
- https://oat.ink/customizing/
- https://modern-css.com/theme-variables-without-a-preprocessor/

### Typography

- https://daisyui.com/docs/layout-and-typography/
- https://nordhealth.design/typography
- https://primer.style/product/primitives/typography/
- https://picocss.com/docs/typography
- https://piccalil.li/blog/a-more-modern-css-reset/
- https://moderncss.dev/generating-font-size-css-rules-and-creating-a-fluid-type-scale/

### Patterns

- https://picocss.com/docs/nav
- https://daisyui.com/components/navbar/
- https://kelpui.com/docs/components/navbar/

### UI: Flyout / Menu

- https://oat.ink/components/#menu
- https://daisyui.com/components/menu/
- https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/
- https://github.com/lekoala/pure-context-menu
- https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/popover
- https://v6-dev--twbs-bootstrap.netlify.app/docs/6.0/components/menu/
- https://getbootstrap.com/docs/5.3/components/popovers/#overview
- https://open-ui.org/components/menu.research/

### UI: Tabs

- https://www.makethingsaccessible.com/guides/responsive-and-accessible-tabbed-interfaces/
- https://www.w3.org/WAI/ARIA/apg/patterns/tabs/
- https://uiterms.com/tabs/
- https://m3.material.io/components/tabs/accessibility
- https://css-tricks.com/pure-css-tabs-with-details-grid-and-subgrid/
- https://basecoatui.com/components/tabs/
- https://daisyui.com/components/tab/
- https://inclusive-components.design/tabbed-interfaces/
- https://open-ui.org/components/tabs.research/
- https://kelpui.com/docs/components/tabs/

### UI: Tooltip

- https://oat.ink/components/#tooltip
- https://picocss.com/docs/tooltip
- https://uiterms.com/tooltip/
- https://vispero.com/resources/using-the-html-title-attribute-updated/
- https://codepen.io/lekoalabe/pen/JoPNWpX
- https://m3.material.io/components/tooltips/overview
- https://basecoatui.com/components/tooltip/
- https://daisyui.com/components/tooltip/
- https://open-ui.org/components/tooltip.research/

### UI: Scrollspy

- https://getbootstrap.com/docs/5.3/components/scrollspy/
- https://una.im/scroll-target-group/
- https://www.sarasoueidan.com/blog/css-scrollspy/
