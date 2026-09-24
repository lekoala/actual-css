# Actual CSS starter skill

A small, copyable agent skill for **building with Actual CSS**.

It is intentionally not a contributor guide for the Actual CSS repository. Repository development workflow belongs in `AGENTS.md`; this skill teaches consumers how to use the framework without inventing API or duplicating framework behavior.

## Contents

```text
actual-css/
├── SKILL.md
├── README.md
├── PROJECT.md.example
├── references/
│   ├── accessibility.md
│   ├── api-and-vocabulary.md
│   ├── enhancements.md
│   ├── forms.md
│   ├── layout-and-theming.md
│   └── review-checklist.md
└── scripts/
    └── inspect-actual-css.mjs
```

## Recommended distribution

Actual CSS can ship this directory as a starter/reference skill. Consuming projects copy it into the location their coding agent uses for skills.

The copied skill should remain mostly framework-generic. Application-specific choices belong in a local `PROJECT.md` created from `PROJECT.md.example`.

This gives a clean split:

```text
Actual CSS package/docs/manifests
        -> what exists and how the framework works

SKILL.md + references
        -> how an agent should build with it

PROJECT.md
        -> how this application chooses to use it
```

## Why the skill does not bundle the catalog

`components.json`, `reserved-classes.json`, package exports, CSS source, and JS source are intentionally read from the installed Actual CSS version. Copying those files into the skill would create a second, quickly stale API snapshot.

The bundled inspector makes common lookups cheap:

```sh
node /path/to/actual-css/scripts/inspect-actual-css.mjs --source
node /path/to/actual-css/scripts/inspect-actual-css.mjs button
node /path/to/actual-css/scripts/inspect-actual-css.mjs --class compact
node /path/to/actual-css/scripts/inspect-actual-css.mjs --exports
node /path/to/actual-css/scripts/inspect-actual-css.mjs --enhancements
```

Set `ACTUAL_CSS_ROOT=/path/to/actual-css` to inspect a specific checkout or installed package.

## Customize, do not fork the framework contract

Good project customizations include which modules are loaded, local theme tokens, server/template wrappers, page-shell conventions, browser policy, and application class naming.

Do not use the project layer to redefine Actual CSS class meanings, internal runtime state, package exports, or undocumented hooks.
