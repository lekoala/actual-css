/*
 * GFM table parsing, alignment and width measurement — the single source of
 * truth shared by `format:docs` (which writes the alignment) and `check:docs`
 * (which verifies it and enforces the width budget). Keeping the width formula
 * in one place is the point: a check that measured differently from the
 * formatter would fail files the formatter had just fixed.
 */
import { scanCodeFences } from "./markdown.js";

/*
 * Table cells hold labels, not paragraphs. Alignment pads every cell to its
 * column's widest, so one long cell widens every row and the source stops
 * fitting a pane. Matches biome's lineWidth, which governs every other source
 * file in the repo.
 */
export const TABLE_MAX_WIDTH = 100;

/*
 * Code points, not UTF-16 units, so an astral character counts once. Docs
 * tables use arrows, dashes and check marks — all single-width — so there is
 * no East Asian width handling here; add it the day a table needs it.
 */
const width = (text) => [...text].length;

const SEPARATOR = /^\|(?:\s*:?-{3,}:?\s*\|)+$/u;

function cellsOf(row) {
  return row
    .split("|")
    .slice(1, -1)
    .map((cell) => cell.trim());
}

/* `:---` / `---:` / `:---:` survive formatting; a plain `---` stays plain. */
function alignmentOf(cell) {
  const start = cell.startsWith(":");
  const end = cell.endsWith(":");
  if (start && end) return "center";
  if (end) return "end";
  if (start) return "start";
  return null;
}

function separatorCell(size, alignment) {
  if (alignment === "center") return `:${"-".repeat(Math.max(1, size - 2))}:`;
  if (alignment === "end") return `${"-".repeat(Math.max(1, size - 1))}:`;
  if (alignment === "start") return `:${"-".repeat(Math.max(1, size - 1))}`;
  return "-".repeat(size);
}

/*
 * Tables are a header row, a separator row, then body rows — all starting with
 * "|", outside code fences. The separator is what makes a run of pipe lines a
 * table in GFM, so a run without one is left alone rather than guessed at.
 */
export function findTables(markdown) {
  const lines = markdown.split(/\r?\n/u);
  const fenced = new Set(
    scanCodeFences(markdown).flatMap((fence) =>
      Array.from({ length: fence.end - fence.start + 1 }, (_, offset) => fence.start + offset),
    ),
  );

  const tables = [];
  let run = null;
  const close = () => {
    if (run && run.rows.length >= 2 && SEPARATOR.test(run.rows[1])) tables.push(run);
    run = null;
  };

  for (const [index, line] of lines.entries()) {
    if (fenced.has(index) || !line.startsWith("|")) {
      close();
      continue;
    }
    if (!run) run = { start: index, rows: [] };
    run.rows.push(line);
  }
  close();

  return tables;
}

/* Column widths, alignments, and the width the table formats to. */
export function measureTable(table) {
  const rows = table.rows.map(cellsOf);
  const alignments = rows[1].map(alignmentOf);
  const content = rows.filter((_, index) => index !== 1);
  const columns = Math.max(...rows.map((row) => row.length));
  const widths = Array.from({ length: columns }, (_, index) =>
    Math.max(
      // A column never formats narrower than its `---` separator, and a
      // centered one needs room for both colons.
      alignments[index] === "center" ? 5 : 3,
      ...content.map((row) => width(row[index] ?? "")),
    ),
  );

  return {
    columns,
    widths,
    alignments,
    formattedWidth: 4 + widths.reduce((a, b) => a + b, 0) + 3 * (columns - 1),
    widestCell: content.flat().reduce((a, b) => (width(b) > width(a) ? b : a), ""),
  };
}

export function formatTable(table) {
  const { columns, widths, alignments } = measureTable(table);

  /* Padded on the side the column's marker asks for, so the source previews
     the rendering — and so this agrees with the editor formatters that do the
     same, instead of trading a diff back and forth with them. */
  const pad = (text, size, alignment) => {
    const room = size - width(text);
    if (alignment === "end") return " ".repeat(room) + text;
    if (alignment === "center") {
      const left = Math.floor(room / 2);
      return " ".repeat(left) + text + " ".repeat(room - left);
    }
    return text + " ".repeat(room);
  };

  return table.rows.map((row, index) => {
    const cells = cellsOf(row);
    const formatted = Array.from({ length: columns }, (_, column) =>
      index === 1
        ? separatorCell(widths[column], alignments[column])
        : pad(cells[column] ?? "", widths[column], alignments[column]),
    );
    return `| ${formatted.join(" | ")} |`;
  });
}

/* Every table aligned, everything else byte-for-byte untouched. */
export function formatTables(markdown) {
  const lines = markdown.split(/\r?\n/u);
  for (const table of findTables(markdown)) {
    for (const [offset, row] of formatTable(table).entries()) {
      lines[table.start + offset] = row;
    }
  }
  return lines.join(markdown.includes("\r\n") ? "\r\n" : "\n");
}
