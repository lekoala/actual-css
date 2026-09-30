/*
 * Penpot plugin: builds Actual CSS components from spec.json (written by
 * `bun run export:design`) and binds them to the tokens imported from
 * penpot/tokens.json.
 *
 * The spec holds measured values, not rules: each variant is one board with
 * a flex layout and its texts, sized and painted as the browser rendered it.
 * Only colors are bound to tokens. Literal values are set first and tokens
 * applied on top, so a token the
 * plugin API refuses leaves a correct-looking shape and a report line rather
 * than a broken one. Tokens are applied before createComponent: the API drops
 * token bindings on component children without an error (penpot/penpot#8520).
 */
penpot.ui.open("Actual CSS components", `ui.html?theme=${penpot.theme}`, {
  width: 300,
  height: 380,
});

penpot.ui.onMessage(async (message) => {
  if (message?.type !== "build") return;
  let text;
  try {
    text = await build(message.spec, message.font);
  } catch (error) {
    text = `Build failed: ${error?.message ?? error}`;
  }
  penpot.ui.sendMessage({ type: "report", text });
});

/* Tokens are applied by name; an active set wins over an inactive one with
   the same token, like Penpot's own resolution. */
function tokensByName() {
  const tokens = new Map();
  for (const set of penpot.library.local.tokens.sets) {
    for (const token of set.tokens) {
      if (!tokens.has(token.name) || set.active) tokens.set(token.name, token);
    }
  }
  return tokens;
}

const COMPONENT_GAP = 64;
const PAGE_NAME = "Actual CSS components";

/* Main components live on their own page, the usual home of a library: the
   variant sets are large (a Button is Intent × Variant × Size) and a working
   page only needs instances, dragged from Assets. New shapes land on the
   active page, so the page is opened (and awaited) before building. */
async function openComponentsPage(log) {
  try {
    const page =
      penpot.currentFile?.pages?.find((p) => p.name === PAGE_NAME) ?? penpot.createPage();
    page.name = PAGE_NAME;
    await penpot.openPage(page);
  } catch (error) {
    log.notes.push(
      `Built on the current page: "${PAGE_NAME}" could not be opened (${error?.message ?? error}).`,
    );
  }
}

async function build(spec, fontName) {
  const tokens = tokensByName();
  const log = {
    variants: 0,
    applied: 0,
    built: [],
    missing: new Set(),
    failed: new Set(),
    notes: [],
  };
  if (tokens.size === 0) log.notes.push("No tokens found: import penpot/tokens.json first.");

  const bind = (shape, value, properties) => {
    if (!value?.token) return;
    const token = tokens.get(value.token);
    if (!token) {
      log.missing.add(value.token);
      return;
    }
    try {
      shape.applyToken(token, properties);
      log.applied += 1;
    } catch (error) {
      log.failed.add(`${token.type} → ${properties ?? "default"}: ${error?.message ?? error}`);
    }
  };

  const font = fontName ? penpot.fonts.findByName(fontName) : null;
  if (fontName && !font) log.notes.push(`Font "${fontName}" not found; Penpot's default is used.`);

  await openComponentsPage(log);

  // Right of whatever the page holds: a rebuild over a previous one reads as
  // broken components (transparent boards show the old text through).
  const existing = penpot.currentPage?.root?.children ?? [];
  const origin = {
    x: existing.length ? Math.max(...existing.map((s) => s.x + s.width)) + 200 : 0,
    y: existing.length ? Math.min(...existing.map((s) => s.y)) : 0,
  };

  // Components side by side, each at the right of the previous one.
  for (const component of spec.components) {
    const shapes = buildComponent(component, { bind, font, log, origin });
    origin.x = Math.max(...shapes.map((s) => s.x + s.width)) + COMPONENT_GAP;
  }

  // Show the result: the build lands at the page origin, often off screen.
  try {
    penpot.selection = log.built;
    penpot.viewport.zoomIntoView(log.built);
  } catch (error) {
    log.notes.push(`Could not select the result: ${error?.message ?? error}`);
  }

  const names = spec.components.map((c) => c.name).join(", ");
  return [
    `${log.variants} variants built, ${log.applied} token bindings applied.`,
    `${names}: built on the "${PAGE_NAME}" page and listed under Assets → Components.`,
    "Drag an instance onto any page, then pick its Intent / Variant / Size in the right panel.",
    "Check the bindings: Tokens → Themes → Mode / Dark repaints the components.",
    ...log.notes,
    log.missing.size ? `Missing tokens: ${[...log.missing].join(", ")}` : "",
    log.failed.size ? `Refused bindings:\n- ${[...log.failed].join("\n- ")}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}

function paint({ hex, opacity }) {
  return { fillColor: hex, fillOpacity: opacity };
}

/*
 * Penpot lays a text out only after the plugin call returns: a new text reads
 * 0×0, and flex places that empty box (a centred label then grows from the
 * centre down-right). Each text gets the browser's box up front; the grow type
 * then corrects the few pixels the design font differs by. Waiting for the
 * layout inside the plugin never ends: it does not happen while we run.
 */
function buildText(spec, { column, font, bind }) {
  const text = penpot.createText(spec.label);
  if (font) {
    const weight = String(spec.fontWeight);
    const face = font.variants?.find((v) => v.fontWeight === weight && v.fontStyle === "normal");
    font.applyToText(text, face);
  }
  text.fontSize = String(spec.fontSize);
  text.fontWeight = String(spec.fontWeight);
  text.lineHeight = String(spec.lineHeight);
  text.fills = [paint(spec.color)];
  if (spec.underline) text.textDecoration = "underline";
  text.resize(Math.max(1, spec.width), Math.ceil(spec.fontSize * spec.lineHeight));
  // In a column the text keeps its width and wraps (a card body); in a row
  // it follows its label (a button, a badge).
  text.growType = column ? "auto-height" : "auto-width";

  bind(text, spec.color, ["fill"]);
  return text;
}

function buildVariant(component, variant, { bind, font }) {
  const { box } = variant;
  const column = box.dir === "column";
  const board = penpot.createBoard();
  board.name = component.name;
  board.fills = box.fill ? [paint(box.fill)] : [];
  board.strokes = box.stroke
    ? [
        {
          strokeColor: box.stroke.hex,
          strokeOpacity: box.stroke.opacity,
          strokeWidth: box.borderWidth,
          strokeAlignment: "inner",
          strokeStyle: "solid",
        },
      ]
    : [];
  board.borderRadius = box.radius;

  const flex = board.addFlexLayout();
  flex.dir = box.dir;
  flex.alignItems = column ? "start" : "center";
  flex.justifyContent = box.justify;
  flex.rowGap = box.gap;
  flex.columnGap = box.gap;
  flex.leftPadding = box.padding.left;
  flex.rightPadding = box.padding.right;
  // A control's height is fixed and centres its row; the vertical padding is
  // only what the browser needed to get there.
  if (!box.fixedHeight) {
    flex.topPadding = box.padding.top;
    flex.bottomPadding = box.padding.bottom;
  }

  for (const spec of variant.texts) board.appendChild(buildText(spec, { column, font, bind }));

  board.resize(box.width, box.height);
  // Hug the label so the component grows when the text is edited, and let a
  // content-height box follow its texts. Safe only because the texts already
  // have their box: hugging a 0×0 text shrank every board to its padding.
  if (box.hug) flex.horizontalSizing = "auto";
  if (!box.fixedHeight) flex.verticalSizing = "auto";

  // Colors only: they are what a theme switch repaints. Lengths stay literal
  // (see design-components.js for why).
  bind(board, box.fill, ["fill"]);
  if (box.stroke) bind(board, box.stroke, ["strokeColor"]);
  return board;
}

/* A single variant is a plain component. Several are laid out one row per
   combination of the leading properties, one column per value of the last,
   then combined into one variant set. Returns the shapes placed on the page. */
function buildComponent(component, { bind, font, log, origin }) {
  const gap = 16;
  const last = component.properties.at(-1);
  const perRow = new Set(component.variants.map((v) => v.props[last])).size;
  let x = 0;
  let y = 0;
  let rowHeight = 0;

  const boards = component.variants.map((variant, i) => {
    const board = buildVariant(component, variant, { bind, font });
    if (i > 0 && i % perRow === 0) {
      x = 0;
      y += rowHeight + gap;
      rowHeight = 0;
    }
    board.x = origin.x + x;
    board.y = origin.y + y;
    x += board.width + gap;
    rowHeight = Math.max(rowHeight, board.height);
    log.variants += 1;
    return board;
  });

  const library = penpot.library.local;
  const created = boards.map((board) => library.createComponent([board]));
  if (created.length === 1) {
    log.built.push(...boards);
    return boards;
  }

  try {
    const [first, ...rest] = created.map((c) => c.mainInstance());
    first.combineAsVariants(rest.map((shape) => shape.id));

    const members = created.map((c) => library.components.find((m) => m.id === c.id) ?? c);
    const { variants } = members[0];
    while (variants.properties.length < component.properties.length) variants.addProperty();
    component.properties.forEach((name, pos) => {
      variants.renameProperty(pos, name);
    });
    members.forEach((member, i) => {
      component.properties.forEach((name, pos) => {
        member.setVariantProperty(pos, component.variants[i].props[name]);
      });
    });
    // combineAsVariants wraps the main instances in the variant container.
    // Painted with the theme page, so light-ink variants (outline, ghost,
    // link in dark) sit on their own surface rather than on the canvas.
    const container = first.parent ?? first;
    if (container !== first) bind(container, { token: "surface" }, ["fill"]);
    log.built.push(container);
    return [container];
  } catch (error) {
    log.failed.add(`variants of ${component.name}: ${error?.message ?? error}`);
    log.built.push(...boards);
    return boards;
  }
}
