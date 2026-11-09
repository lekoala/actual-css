# Coding agents and DESIGN.md

Actual CSS ships a starter agent skill that teaches a coding agent the
framework's vocabulary: classes, hooks, layout primitives and enhancements. It
does not give your product a look. That comes from your theme and from a
`DESIGN.md` you write, alone or with a design skill such as
[Impeccable](https://impeccable.style/).

## Install the skill

The skill ships in the package under `skills/actual-css/`. Copy that directory
into the folder your agent loads skills from (`.claude/skills/actual-css/`,
for example), then copy `PROJECT.md.example` to `PROJECT.md` beside it.

The skill reads `components.json`, `tokens.json` and the sources from the
installed package, so it follows the version your project uses. See the
[skill source](https://github.com/lekoala/actual-css/tree/master/skills/actual-css).

## One fact, one file

| File             | Owns                                 | Location         |
| ---------------- | ------------------------------------ | ---------------- |
| `PRODUCT.md`     | audience, purpose, brand commitments | project root     |
| `DESIGN.md`      | visual direction and its rules       | project root     |
| Theme stylesheet | every value: colors, radii, shadows  | your CSS         |
| `PROJECT.md`     | how the app uses Actual CSS          | beside the skill |
| Actual CSS       | vocabulary, components, behavior     | the package      |

`DESIGN.md` records the approved visual direction; the theme defines the values
actually shipped; `PROJECT.md` says with which classes. When `DESIGN.md` and
the theme disagree, neither wins by default: decide whether the design changed
on purpose or the code drifted, then update the stale document or fix the
theme. Confirm what the user sees on the rendered page.

## What goes in DESIGN.md

`DESIGN.md` follows the
[DESIGN.md format](https://github.com/google-labs-code/design.md): optional
YAML tokens, then prose sections. Use the eight canonical headings, in this
order: Overview, Colors, Typography, Layout, Elevation & Depth, Shapes,
Components, Do's and Don'ts. Other headings are preserved, but tools such as
Impeccable read these ones; leave out the sections you have nothing to say in.

Write the decisions the code cannot show:

- the mood and what to avoid ("calm and precise, not a generic admin
  dashboard");
- what each color is reserved for ("the primary color marks the one key action
  of a region");
- depth and density ("flat at rest", "dense tables, generous forms");
- named rules an agent can cite ("The Quiet Ground Rule: state shows as a soft
  tint, never a strong fill").

Leave out of the prose:

- **Values.** Name the token in parentheses (`--primary`); the value belongs
  in the YAML tokens.
- **Class names.** Describe the role; the class mapping is in `PROJECT.md`.
- **What Actual CSS already guarantees**: visible focus, reduced motion,
  forced colors. Record a product's own decision on focus, states or motion;
  do not restate the default.

The YAML tokens are the structured layer of the format: tools validate them
and measure drift against them. A first direction can do without; an
established visual system should carry them. Put them in the frontmatter,
where Impeccable reads them, keyed by the Actual token name without `--`, as
the [design tool export](design-tools.md) does. Keep them in sync with the
theme: `/impeccable document` refreshes them from the code once a change is
approved.

A DESIGN.md taken from another site is a reference, not yours: keep it outside
the project root (`design/references/`), so agents do not adopt its brand as
your own.

```text
---
name: Ledger
description: Bookkeeping for small studios.
colors:
  primary: "#0f6e6e"
  surface: "#fbfaf7"
---

# Design System: Ledger

## Overview

**Creative North Star: "The Lab Notebook"**

Calm, precise, approachable. Dense where people work, generous where they
decide. Not a generic admin dashboard.

## Colors

- **Ink Teal** (`--primary`): the one key action of a region, nothing else.

**The Quiet Ground Rule.** Backgrounds stay neutral; state shows as a soft
tint, never a strong fill.

## Elevation & Depth

Flat at rest. Depth comes from tonal surfaces (`--surface`,
`--surface-raised`), one level deep: no card inside a card.

## Do's and Don'ts

- **Do** align amounts with tabular figures.
- **Don't** put two primary actions in one region.
```

## Map the direction onto Actual CSS

`PROJECT.md` turns the roles named in `DESIGN.md` into Actual classes and
hooks, so every agent writes the same markup for the same intent:

```text
Primary action               → .btn.primary
Secondary action             → .btn.outline
Toolbar and row actions      → .btn.ghost
Status labels                → .badge.soft + intent
Dense data views             → .compact on the region
```

## With a design skill

A design skill and the Actual skill do not overlap. The design skill owns the
direction: product context, visual world, critique. The Actual skill owns the
implementation: which class, hook or token expresses it. Install both.

Design skills differ in what they write. Before adopting one, check:

- **Where it records the direction.** A root `DESIGN.md` is shared with every
  other agent; a direction in the skill's own file is read only by that skill.
- **Whether it scaffolds its own tokens or base stylesheet.** Map its tokens
  onto Actual's in your theme and drop its base and reset rules: Actual
  already ships them.
- **Which stack it assumes.** Name Actual CSS in the request when its default
  is a utility framework or a component library, or it writes for that one.
- **Whether it keeps an incumbent design.** Routine changes should stay in
  your system; a redesign is a request you make on purpose.

With Impeccable:

1. `/impeccable init` writes `PRODUCT.md`.
2. A new surface or redesign chooses the visual world and seeds `DESIGN.md`.
3. Implement it in the theme first, then through the
   [decision order](integrating-actual-css.md#10-before-adding-a-css-rule):
   layout primitive, component, hook, utility, application CSS.
4. `/impeccable document` reads the shipped theme and completes `DESIGN.md`.
5. `critique`, `audit` and `polish` findings go through the same order. When
   no public hook expresses a product-specific deviation, write focused
   application CSS. Report a missing hook when the need is generic and
   recurring. Never override a component's internal state or behavior.

Traps:

- The design detector scans sources (`impeccable detect src/`) or a rendered
  page (`impeccable detect http://localhost:3000`). A source scan does not
  resolve the cascade, so confirm any finding about sizes or colors on the
  rendered page: Actual's tokens are inherited.
- `.impeccable/design.json` holds self-contained preview snippets with `ds-`
  classes for Impeccable's live panel. They are not application code; do not
  copy them into your templates.
