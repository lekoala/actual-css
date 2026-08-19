# Platform alignment

Actual CSS should stay close to the direction of the web platform.

HTML, CSS, ARIA, and browser APIs continue to absorb behaviors that historically required framework components or JavaScript widgets. Open UI is a particularly useful signal because it studies common design-system patterns and explores how they can become native platform capabilities.

This note does not define a browser support policy and is not a commitment to implement experimental proposals.

Its purpose is architectural:

> When the platform eventually provides a capability natively, Actual should be able to adopt it by removing code rather than redesigning its public API.

## Core principle

Actual should prefer this progression:

```text
native HTML
    ↓
native HTML + CSS
    ↓
native HTML + progressive enhancement
    ↓
small reusable behavior primitive
    ↓
Actual component
    ↓
application-specific widget
```

The further down this list a feature sits, the stronger the justification should be.

A framework component should not exist merely because the platform does not provide a convenient primitive today.

## Design for deletion

Progressive enhancement is not only about supporting older browsers.

It should also make framework code temporary.

When Actual implements behavior that browsers may eventually provide, the implementation should be structured so that native support can replace one responsibility at a time.

For example, a floating interactive surface can involve several independent concerns:

```text
surface
positioning
open / close lifecycle
light dismiss
focus management
keyboard navigation
command invocation
```

These should not unnecessarily become one monolithic widget.

The platform is evolving these responsibilities independently. Actual should do the same.

This is the motivation behind reusable primitives such as `surface`, `floating`, `menu`, `keys`, and `command`.

A future native primitive should ideally replace one of these pieces without forcing unrelated behavior or styling to change.

## Follow semantics, not proposal syntax

Open UI proposals are useful directional signals, but experimental syntax is not an Actual API.

Actual should not prematurely reproduce proposed HTML attributes or elements as `data-*` APIs.

For example, if the platform is exploring:

```html
<div focusgroup="toolbar">
```

Actual should not automatically introduce:

```html
<div data-focusgroup="toolbar">
```

Instead, the underlying behavior can influence the design of a reusable JavaScript primitive.

If native `focusgroup` later becomes broadly available, the JavaScript implementation can become a fallback or disappear.

The important thing to copy early is the **responsibility boundary**, not necessarily the proposed syntax.

## Preserve native-shaped markup

When a useful platform feature can be added without harming unsupported browsers, documentation should prefer markup that remains compatible with that future.

For example, Actual's switch is intentionally based on a real checkbox:

```html
<input type="checkbox" class="switch">
```

If a native switch attribute becomes appropriate for the supported browser contract, the same component can evolve toward:

```html
<input type="checkbox" class="switch" switch>
```

without replacing the element or changing the styling API.

The class remains responsible for appearance.

The platform remains responsible for semantics and behavior.

This separation is desirable.

## Public classes should survive platform evolution

Actual classes should generally describe visual or compositional concepts rather than reimplement browser mechanics.

For example:

```text
.switch
.modal
.drawer
.tooltip
.toolbar
```

may remain useful styling hooks even if more of their semantics and behavior eventually become native.

This means platform adoption should not require unnecessary class churn.

A successful transition may look like:

```text
Actual class + Actual JavaScript
            ↓
Actual class + small fallback
            ↓
Actual class + native HTML
```

rather than replacing one framework API with another.

## Prefer capabilities over browser generations

New platform features should not automatically raise Actual's Minimal browser floor.

When a modern capability has a cheap functional fallback, it should normally be used as progressive enhancement.

This applies especially to features concerned with:

* presentation;
* positioning;
* animation;
* interaction convenience;
* declarative invocation;
* richer native controls.

The Minimal tier should move when the framework genuinely needs a capability for its supported contract, not simply because a newer API produces a nicer implementation.

## Current platform directions

The following areas are particularly relevant to Actual's architecture.

Their specifications and exact syntax may change. The important part is the direction they indicate.

### Focus groups

Focus-group proposals aim to provide common keyboard and focus behavior for collections of related controls.

This overlaps with behavior currently implemented through keyboard helpers such as next-item, previous-item, first-item, and last-item navigation.

**Influence on Actual:**

* keep keyboard navigation reusable rather than widget-specific;
* consider a reusable focus-group primitive internally;
* let tabs, menus, toolbars, and similar patterns share it;
* avoid exposing speculative `focusgroup`-like HTML syntax prematurely.

This is a strong candidate for code that could eventually shrink when native focus-group behavior becomes available.

### Toolbar

Toolbar proposals combine a semantic group of controls with conventional keyboard navigation.

Actual already has most of the visual building blocks through buttons, actions, clusters, and keyboard helpers.

**Influence on Actual:**

A toolbar may be a useful small pattern, but its keyboard contract should preferably be built on a shared focus primitive rather than implemented independently.

Do not add `.toolbar` merely as another horizontal flex utility.

### Menu elements

The platform is exploring native menu structures with menu items, submenus, popover behavior, anchor positioning, commands, focus management, and keyboard navigation.

This strongly validates keeping these responsibilities separate in Actual.

**Influence on Actual:**

* `surface` should not own menu semantics;
* `floating` should not own menu lifecycle;
* `menu` should not unnecessarily own positioning;
* keyboard behavior should remain reusable;
* command invocation should remain independent.

Actual should not attempt to reproduce a future native menu element API.

Instead, its current primitives should make eventual native menus easy to adopt.

### Interest invokers and hint popovers

The platform is moving toward declarative ways to express that focus, hover, or other user interest should reveal contextual content.

This overlaps substantially with tooltip and hover-card behavior.

**Influence on Actual:**

* keep tooltip appearance separate from invocation mechanics;
* avoid making hover timers or pointer handling part of the visual component contract;
* prefer native popover lifecycle where possible;
* structure tooltip enhancement so future native interest invocation can remove JavaScript.

Tooltip is a good example of a component whose implementation should become smaller over time.

### Openable content

A generic openable primitive is being explored for content that can be shown and hidden without imposing a new semantic element.

This overlaps with the territory traditionally occupied by generic framework `collapse` widgets.

**Influence on Actual:**

Do not add a generic Collapse component simply to match other frameworks.

Use semantic platform elements where they already exist:

* `<details>` for disclosure;
* `<dialog>` for modal or dialog-like surfaces;
* popovers for transient surfaces.

Application-specific show/hide behavior can remain application code.

If the platform eventually gains a generic openable mechanism, this gap may disappear naturally.

### Customizable and filterable select

Native `<select>` is becoming substantially more customizable, and further work is exploring filtering and richer option behavior.

**Influence on Actual:**

Actual should continue to improve native select progressively rather than introducing a replacement select widget into core.

Avoid owning:

* option synchronization;
* keyboard selection models;
* popup lifecycle;
* active-option state;
* form integration;

when the platform is actively moving toward providing those capabilities.

A third-party autocomplete or advanced combobox can still compose Actual primitives when needed.

Repeated low-level needs discovered there may justify reusable primitives, but not necessarily a core widget.

### Link area delegation

The platform is exploring safer ways to make larger content areas delegate activation to a link while preserving nested interactions and text selection.

This overlaps with patterns such as Bootstrap's stretched links and pseudo-element link overlays.

**Influence on Actual:**

Do not introduce a generic `.stretched-link` workaround.

Prefer an explicit primary link today.

Wait for a native solution to the more general clickable-card problem.

### Enhanced range controls

Work on richer native range controls may eventually expose more consistent styling parts and more advanced range interactions.

**Influence on Actual:**

Avoid building a large custom range abstraction around browser-specific pseudo-elements unless a concrete project requirement justifies it.

Prefer native controls and progressive styling.

### Navigation

Native navigation proposals may eventually provide richer semantics and interaction behavior for complex navigation structures.

**Influence on Actual:**

Keep `.navbar` a small layout/presentation pattern.

Compose complex behaviors from existing primitives such as flyouts, drawers, commands, and menus rather than turning Navbar into a large JavaScript widget.

### Invoker commands

Declarative command invocation is an important platform direction because it separates the element requesting an action from the element implementing it.

This maps well to Actual's preference for semantic HTML and small behavior primitives.

**Influence on Actual:**

Prefer native commands where available and appropriate.

When fallback behavior is needed, keep it generic rather than implementing separate invocation systems inside Modal, Drawer, Popover, and other widgets.

## Decision framework

Before adding a new Actual component or JavaScript behavior, ask these questions in order.

### 1. Does semantic HTML already solve it?

Prefer native elements such as:

```text
button
details
dialog
select
input
progress
meter
```

when their semantics match the requirement.

### 2. Is the missing part mainly styling?

If so, add CSS rather than JavaScript.

### 3. Can a modern platform capability solve it progressively?

Use the capability when unsupported browsers retain an acceptable functional result.

Do not raise the Minimal floor unnecessarily.

### 4. Is the platform actively moving toward this capability?

Check HTML, CSS, ARIA, and Open UI direction before inventing a framework abstraction.

A proposal is not a reason to wait indefinitely, but it is a reason to avoid designing an API directly against a temporary platform limitation.

### 5. Is there a smaller reusable behavior underneath the requested widget?

Prefer:

```text
focus navigation
floating positioning
surface lifecycle
command invocation
selection state
```

over a monolithic component when several widgets share the same responsibility.

### 6. Is the behavior actually framework-level?

If it is highly application-specific, leave it to project code.

Actual does not need to provide every interaction pattern found in application UI.

## Adoption levels

Platform developments can influence Actual at different stages.

### Adopt

Use the native feature directly when it is part of the supported contract or has a safe fallback.

Examples include mature semantic HTML and suitable progressive enhancements.

### Align

The native feature is not ready to depend on, but its architecture is sufficiently useful to influence Actual's internal boundaries.

Focus-group behavior is a good example.

### Watch

The proposal solves a relevant problem but is too early, uncertain, or specialized to affect code today.

Document the direction and avoid unnecessary competing abstractions.

### Ignore

Not every platform proposal belongs in Actual.

A capability may be useful for applications without being appropriate for a small CSS framework.

## What Open UI should not become for Actual

Open UI is not a backlog of components to implement.

Actual should not:

* mirror every Open UI component;
* polyfill every proposal;
* expose experimental syntax under `data-*` names;
* add components solely because another framework has them;
* maintain custom widgets that duplicate improving native controls;
* raise browser requirements just to adopt newer syntax;
* freeze an experimental proposal into the public Actual API.

The objective is compatibility of **architecture**, not API imitation.

## Near-term implications

The current direction suggests a few concrete actions.

### Focus navigation

Audit `keys` around the responsibilities described by focus groups.

If several widgets need the same roving-focus behavior, extract one reusable primitive rather than adding separate implementations.

### Toolbar

Consider a small Toolbar pattern only after the shared focus behavior is clear.

Its value should come from semantics and interaction, not from duplicating `.cluster`.

### Switch

Keep the checkbox-based implementation.

Track native switch semantics and adopt forward-compatible markup when it becomes appropriate for the browser contract.

### Menu

Keep menu styling, surface lifecycle, floating positioning, commands, and keyboard behavior decomposed.

Do not add a second menu architecture that mimics experimental elements.

### Tooltip

Continue treating Tooltip as progressive enhancement over native-shaped markup.

Interest invocation and hint popovers should eventually be able to replace parts of its JavaScript.

### Select and combobox

Keep native `<select>` as the core path.

Do not add a custom select or autocomplete widget merely to fill today's browser gaps.

### Collapse

Do not add a generic Collapse widget while native disclosure, popover, dialog, and possible future openable primitives cover or may cover the relevant use cases.

### Clickable cards

Do not add a stretched-link utility as a framework workaround.

Use explicit links until the platform provides a robust delegation mechanism.

## Review trigger

This note should be revisited when:

* Actual considers adding a complex interactive component;
* a relevant Open UI proposal graduates or materially changes direction;
* an HTML or CSS primitive becomes broadly available;
* browser support tiers are revised;
* several existing widgets duplicate the same interaction logic.

The useful question is not:

> "Can browsers do this natively yet?"

It is:

> "If browsers can do this natively in two years, will today's Actual design make that transition easy?"

## Goal

Actual should progressively become **less responsible for browser behavior**, not more.

CSS should provide the visual system.

Small primitives should bridge genuine platform gaps.

JavaScript enhancements should remain replaceable.

HTML should carry as much semantics and behavior as the platform can reasonably provide.

The ideal long-term outcome is that improvements to HTML and CSS allow Actual to delete implementation code while applications keep essentially the same markup and styling vocabulary.
