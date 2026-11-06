/*
 * Ajax playground: a real server for src/js/ajax.js, to try by hand what the
 * mocked-fetch test cannot reach (multipart parsing, redirects, cookies, slow
 * uploads, aborts, cross-origin refusal). A local tool, outside every contract:
 * not tested, not published, not hardened.
 *
 * Usage:
 *   bun run play:ajax [--port 3100]
 *
 * The page loads src/ as-is (CSS @import, JS modules), so it always runs the
 * working tree. A second server on port + 1 plays the foreign origin.
 *
 * /echo answers with what it received. Query or form fields tune the answer:
 *   _status=422   _delay=2000 (ms; random fast or slow without it)   _type=json
 * /redirect?to=done|foreign   303 to /done, or to the foreign origin (fetch
 *                             then fails on CORS: the ajax-error path)
 * /swap      re-renders the form that contains it
 * /csrf      single-use tokens: 419 on a spent one; ?mode=render answers
 *            with the form and a fresh token, ?mode=message without
 */
import { join } from "node:path";
import { readFlags } from "../utils/browser.js";

const ROOT = join(import.meta.dirname, "..", "..");
const PAGE = join(import.meta.dirname, "ajax.html");

const { "--port": portArg } = readFlags(process.argv.slice(2), {
  "--port": { fallback: "3100" },
});
const port = Number(portArg);
const foreignPort = port + 1;

const escapeHtml = (value) =>
  String(value).replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
  );

// JSON.stringify makes CR/LF visible: the CRLF normalisation is part of what
// the playground checks.
const show = (value) => escapeHtml(JSON.stringify(value));

async function describeFile(file) {
  const digest = new Bun.CryptoHasher("sha256").update(await file.arrayBuffer()).digest("hex");
  return `File ${show(file.name)} · ${file.size} B · ${escapeHtml(file.type || "no type")} · sha256 ${digest.slice(0, 12)}`;
}

/** Reads the submission: query, then body. Returns entries and the raw body. */
async function readSubmission(request, url) {
  const entries = [...url.searchParams];
  const type = request.headers.get("content-type") ?? "";
  let raw = null;
  if (request.method === "POST") {
    if (type.startsWith("multipart/form-data")) {
      for (const entry of await request.formData()) entries.push(entry);
    } else {
      raw = await request.text();
      if (type.startsWith("application/x-www-form-urlencoded")) {
        entries.push(...new URLSearchParams(raw));
      }
    }
  }
  return { entries, raw };
}

async function report(request, url, { entries, raw }, delay) {
  const rows = [];
  for (const [name, value] of entries) {
    const shown = typeof value === "string" ? show(value) : await describeFile(value);
    rows.push(`<tr><th scope="row">${show(name)}</th><td>${shown}</td></tr>`);
  }
  const headers = ["content-type", "x-requested-with", "accept", "cookie"]
    .map(
      (name) =>
        `<tr><th scope="row">${name}</th><td>${escapeHtml(request.headers.get(name) ?? "—")}</td></tr>`,
    )
    .join("");
  return `
    <p><strong>${request.method} ${escapeHtml(url.pathname + url.search)}</strong>
      · ${new Date().toLocaleTimeString()} · ${delay} ms</p>
    <table class="table">
      <caption>Fields</caption>
      <tbody>${rows.join("") || '<tr><td colspan="2">none</td></tr>'}</tbody>
    </table>
    <table class="table">
      <caption>Headers</caption>
      <tbody>${headers}</tbody>
    </table>
    ${raw ? `<p>Raw body</p><pre>${escapeHtml(raw)}</pre>` : ""}`;
}

// A native submission gets a whole page; the ajax request gets the fragment.
function html(request, body, status = 200) {
  const fragment = request.headers.get("x-requested-with") === "XMLHttpRequest";
  const page = fragment
    ? body
    : `<!doctype html><html lang="en"><head><meta charset="utf-8">
       <link rel="stylesheet" href="http://localhost:${port}/src/css/actual.full.css">
       <title>Native answer</title></head>
       <body class="stack" style="padding: 2rem">
       <p><a href="http://localhost:${port}/">← playground</a> · native submission</p>${body}</body></html>`;
  return new Response(page, { status, headers: { "content-type": "text/html; charset=utf-8" } });
}

const option = (entries, name) => entries.findLast(([key]) => key === name)?.[1];

// Without _delay, half the answers come back under the busy overlay's delay
// and half well past it: both paths show up without asking for them.
const latency = (entries) => {
  const asked = option(entries, "_delay");
  if (asked !== undefined) return Number(asked);
  return Math.random() < 0.5 ? 30 + Math.random() * 120 : 800 + Math.random() * 1700;
};

let swaps = 0;

// Single-use CSRF tokens, as a strict per-request scheme issues them: each
// accepted submission burns its token and issues a new one.
const tokens = new Set();
const issueToken = () => {
  const token = crypto.randomUUID().slice(0, 8);
  tokens.add(token);
  return token;
};

// mode "render": the answer re-renders the whole form, fresh token included.
// mode "message": the answer is a message, the page keeps the spent token.
const csrfForm = (mode, token) => {
  const target = mode === "render" ? "#csrf-render" : "#out";
  return `<form action="/csrf?mode=${mode}" method="post" class="cluster"
      data-enhance="ajax" data-ajax-target="${target}" aria-busy="false">
    <input type="hidden" name="_token" value="${token}">
    <code>_token=${token}</code>
    <button class="btn" type="submit">Save</button>
    <span class="spinner" aria-hidden="true"></span>
  </form>`;
};

async function handle(request, foreign) {
  const url = new URL(request.url);
  const path = url.pathname;
  console.log(`${foreign ? "[foreign] " : ""}${request.method} ${path}${url.search}`);

  if (path === "/echo" || path === "/done") {
    const submission = await readSubmission(request, url);
    const delay = Math.round(latency(submission.entries));
    console.log(`  answered after ${delay} ms`);
    await Bun.sleep(delay);
    const status = Number(option(submission.entries, "_status") ?? 200);
    if (option(submission.entries, "_type") === "json") {
      return Response.json(
        { received: submission.entries.filter(([, v]) => typeof v === "string") },
        { status },
      );
    }
    return html(request, await report(request, url, submission, delay), status);
  }
  if (foreign) return new Response("Not found", { status: 404 });

  if (path === "/") {
    const page = (await Bun.file(PAGE).text())
      .replaceAll("{{foreign}}", `http://localhost:${foreignPort}`)
      .replace("{{csrf-render}}", csrfForm("render", issueToken()))
      .replace("{{csrf-message}}", csrfForm("message", issueToken()));
    return new Response(page, {
      headers: {
        "content-type": "text/html; charset=utf-8",
        // A same-origin request must carry it back: visible in /echo's headers.
        "set-cookie": "playground=1; Path=/; SameSite=Lax",
      },
    });
  }
  if (path === "/redirect") {
    const to =
      url.searchParams.get("to") === "foreign" ? `http://localhost:${foreignPort}/done` : "/done";
    await readSubmission(request, url);
    return new Response(null, { status: 303, headers: { location: to } });
  }
  if (path === "/swap") {
    await Bun.sleep(latency([]));
    swaps += 1;
    return html(
      request,
      `<form action="/swap" method="post" class="cluster" data-enhance="ajax" data-ajax-target="#swap-card" aria-busy="false">
        <span>Rendered by the server, #${swaps}</span>
        <button class="btn" type="submit">Replace me again</button>
        <span class="spinner" aria-hidden="true"></span>
      </form>`,
    );
  }
  if (path === "/csrf") {
    const { entries } = await readSubmission(request, url);
    await Bun.sleep(latency([]));
    const sent = option(entries, "_token");
    // 419 is Laravel's "Page Expired"; other stacks answer 403. Neither is
    // displayed by the module: the page handles it from ajax-response.
    if (!tokens.delete(sent)) {
      return html(request, `<p>Page expired: token ${escapeHtml(sent)} is spent.</p>`, 419);
    }
    const mode = url.searchParams.get("mode");
    return html(
      request,
      mode === "render"
        ? csrfForm("render", issueToken())
        : `<p>Saved with <code>${escapeHtml(sent)}</code>. The form still holds it: send again.</p>`,
    );
  }
  // src/ imports packages by name, which a browser cannot resolve: bundle the
  // runtime on each load, so the page still runs the working tree.
  if (path === "/runtime.js") {
    const bundle = await Bun.build({ entrypoints: [join(ROOT, "src/js/full.js")], format: "esm" });
    if (!bundle.success) {
      console.error(bundle.logs);
      return new Response("console.error('runtime bundle failed: see the server log')", {
        headers: { "content-type": "text/javascript" },
      });
    }
    return new Response(bundle.outputs[0], {
      headers: { "content-type": "text/javascript", "cache-control": "no-store" },
    });
  }
  if (path.startsWith("/src/")) {
    const file = Bun.file(join(ROOT, decodeURIComponent(path)));
    if (await file.exists())
      return new Response(file, { headers: { "cache-control": "no-store" } });
  }
  return new Response("Not found", { status: 404 });
}

const server = Bun.serve({
  port,
  hostname: "localhost",
  fetch: (request) => handle(request, false),
});
Bun.serve({ port: foreignPort, hostname: "localhost", fetch: (request) => handle(request, true) });

console.log(`Ajax playground: http://localhost:${server.port}/`);
console.log(`Foreign origin:  http://localhost:${foreignPort}/`);
