import { expect, test } from "bun:test";
import {
  browserAvailable,
  fixtureUrl,
  waitForBrowser,
  withBrowserPage,
} from "../../scripts/utils/browser.js";

const it = (await browserAvailable()) ? test : test.skip;

// Exercise the source without depending on a rebuilt distribution bundle.
const bundle = await Bun.build({
  entrypoints: ["tests/browser/ajax-entry.js"],
  format: "iife",
  write: false,
});
if (!bundle.success) throw new AggregateError(bundle.logs, "Ajax test bundle failed");
const source = await bundle.outputs[0].text();

/*
 * fetch is replaced in the page: each call is recorded and stays pending until
 * the test answers it with reply(), so busy states and requests made during a
 * request are observable without a server.
 */
const harness = `
  window.calls = [];
  window.fetch = (url, init) => new Promise((resolve, reject) => {
    const call = { url: String(url), init, resolve };
    calls.push(call);
    init.signal.addEventListener("abort", () => {
      call.aborted = true;
      reject(new DOMException("Aborted", "AbortError"));
    });
  });
  window.reply = (body, { status = 200, type = "text/html; charset=utf-8", redirectedTo } = {}) => {
    const response = new Response(body, { status, headers: { "Content-Type": type } });
    if (redirectedTo) {
      Object.defineProperty(response, "redirected", { value: true });
      Object.defineProperty(response, "url", { value: redirectedTo });
    }
    calls.at(-1).resolve(response);
  };
  window.events = [];
  for (const name of ["actual:ajax-start", "actual:ajax-response", "actual:ajax-error"]) {
    document.addEventListener(name, (event) => events.push(name.slice(12) + ":" + (event.detail.response?.status ?? "")));
  }
  // Last in line: records whether the browser would submit natively, and
  // keeps the page from navigating away when it would.
  window.native = [];
  window.addEventListener("submit", (event) => {
    native.push(!event.defaultPrevented);
    event.preventDefault();
  });
  window.press = (id) => document.getElementById(id).click();
`;

const withAjax = (run) =>
  withBrowserPage(fixtureUrl("tests/browser/ajax.html"), async (view) => {
    await view.evaluate(`(() => { ${harness}; ${source} })()`);
    await run(view);
  });

const idle = (view, id) =>
  waitForBrowser(view, `!document.getElementById("${id}").hasAttribute("aria-busy")`);

it("a POST sends what a native submission would, and shows an HTML answer", async () => {
  await withAjax(async (view) => {
    const request = await view.evaluate(`(() => {
      const form = document.getElementById("post");
      form.elements.notes.value = "line 1\\nline 2";
      const file = new File(["x"], "report.pdf");
      const transfer = new DataTransfer();
      transfer.items.add(file);
      form.elements.doc.files = transfer.files;
      press("post-save");
      const { url, init } = calls[0];
      return {
        url,
        method: init.method,
        body: String(init.body),
        headers: init.headers,
        busy: [form.getAttribute("aria-busy"), document.getElementById("post-save").getAttribute("aria-busy")],
      };
    })()`);

    expect(request.url).toEndWith("/tests/browser/save");
    expect(request.method).toBe("post");
    expect(request.body).toBe("_token=t&notes=line+1%0D%0Aline+2&doc=report.pdf&op=save");
    expect(request.headers["X-Requested-With"]).toBe("XMLHttpRequest");
    expect(request.busy).toEqual(["true", "true"]);

    await view.evaluate(`reply("<p>Saved</p>")`);
    await idle(view, "post");
    expect(await view.evaluate(`document.getElementById("out").innerHTML`)).toBe("<p>Saved</p>");
    expect(await view.evaluate("events")).toEqual(["start:", "response:200"]);
  });
}, 60_000);

it("formmethod=get replaces the query string", async () => {
  await withAjax(async (view) => {
    const call = await view.evaluate(`(() => {
      press("post-get");
      return { url: calls[0].url, body: calls[0].init.body ?? null };
    })()`);
    // Only the clicked submitter is sent, and it has no name here.
    expect(call.url).toEndWith("/tests/browser/search?_token=t&notes=&doc=");
    expect(call.body).toBeNull();
  });
}, 60_000);

it("leaves submissions it cannot reproduce to the browser", async () => {
  await withAjax(async (view) => {
    const result = await view.evaluate(`(() => {
      for (const id of ["post-blank", "post-plain", "post-dialog", "remote-save"]) press(id);
      return { calls: calls.length, native };
    })()`);
    expect(result).toEqual({ calls: 0, native: [true, true, true, true] });
  });
}, 60_000);

it("honors <base target> unless the form names its own target", async () => {
  await withAjax(async (view) => {
    const result = await view.evaluate(`(() => {
      const base = document.head.appendChild(document.createElement("base"));
      base.target = "_blank";
      press("post-save");
      document.getElementById("post").target = "_self";
      press("post-save");
      return { calls: calls.length, native };
    })()`);
    expect(result).toEqual({ calls: 1, native: [true, false] });
  });
}, 60_000);

it("sends one request at a time, but never holds back a native submission", async () => {
  await withAjax(async (view) => {
    expect(
      await view.evaluate(
        `(() => { press("post-save"); press("post-save"); press("post-dialog"); return [calls.length, native]; })()`,
      ),
    ).toEqual([1, [false, false, true]]);
    await view.evaluate(`reply("")`);
    await idle(view, "post");
    expect(await view.evaluate(`(() => { press("post-save"); return calls.length; })()`)).toBe(2);
  });
}, 60_000);

it("a target that contains the form replaces it and still reports", async () => {
  await withAjax(async (view) => {
    await view.evaluate(`press("swap-save")`);
    await view.evaluate(`reply("<p id=done>Thanks</p>", { type: "Text/HTML" })`);
    await waitForBrowser(view, `document.getElementById("done") !== null`);
    expect(await view.evaluate("events")).toEqual(["start:", "response:200"]);
    expect(await view.evaluate(`document.getElementById("swap")`)).toBeNull();
  });
}, 60_000);

it("an invalid target selector warns instead of reporting a failed request", async () => {
  await withAjax(async (view) => {
    await view.evaluate(`(() => {
      window.warnings = [];
      console.warn = (message) => warnings.push(message);
      press("misconfigured-save");
      reply("<p>Saved</p>");
    })()`);
    await idle(view, "misconfigured");
    expect(await view.evaluate("events")).toEqual(["start:", "response:200"]);
    expect(await view.evaluate("warnings.length")).toBe(1);
  });
}, 60_000);

it("shows only HTML answers with a 2xx or 422 status", async () => {
  await withAjax(async (view) => {
    for (const [options, shown] of [
      [{ status: 422 }, "<p>Fix the email</p>"],
      [{ status: 422, type: "application/json" }, "initial"],
      [{ status: 500 }, "initial"],
    ]) {
      await view.evaluate(`document.getElementById("out").textContent = "initial"`);
      await view.evaluate(`press("post-save")`);
      await view.evaluate(`reply("<p>Fix the email</p>", ${JSON.stringify(options)})`);
      await idle(view, "post");
      expect(await view.evaluate(`document.getElementById("out").innerHTML`)).toBe(shown);
    }
    expect(await view.evaluate("events.filter((e) => e.startsWith('response'))")).toEqual([
      "response:422",
      "response:422",
      "response:500",
    ]);
  });
}, 60_000);

it("follows a redirect like a native submission", async () => {
  await withAjax(async (view) => {
    await view.evaluate(`press("post-save")`);
    await view.evaluate(`(() => {
      document.addEventListener("actual:ajax-response", () => {
        window.hashAtResponse = location.hash;
      });
      reply("", { redirectedTo: location.href.split("#")[0] + "#landed" });
    })()`);
    await waitForBrowser(view, `location.hash === "#landed"`);
    expect(await view.evaluate(`document.getElementById("out").textContent`)).toBe("initial");
    // The response is reported before the page navigates away.
    expect(await view.evaluate("hashAtResponse")).toBe("");
  });
}, 60_000);

it("aborts the request when the form leaves the page", async () => {
  await withAjax(async (view) => {
    await view.evaluate(`press("post-save")`);
    await view.evaluate(`document.getElementById("post").remove()`);
    await waitForBrowser(view, `calls[0].aborted === true`);
    expect(await view.evaluate("events")).toEqual(["start:"]);
  });
}, 60_000);

it("a network failure reaches actual:ajax-error", async () => {
  await withAjax(async (view) => {
    await view.evaluate(`(() => {
      window.fetch = () => Promise.reject(new TypeError("Failed to fetch"));
      press("post-save");
    })()`);
    await idle(view, "post");
    expect(await view.evaluate("events")).toEqual(["start:", "error:"]);
  });
}, 60_000);

it("composes with validation and dirty snapshots", async () => {
  await withAjax(async (view) => {
    await view.evaluate(`(() => {
      const snapshots = new WeakMap();
      document.addEventListener("actual:ajax-start", ({ detail }) => {
        snapshots.set(detail.form, FormDirty.capture(detail.form));
      });
      document.addEventListener("actual:ajax-response", ({ detail }) => {
        if (detail.response.ok) FormDirty.markClean(detail.form, snapshots.get(detail.form));
      });
      window.type = (value) => {
        const email = document.getElementById("email");
        email.value = value;
        email.dispatchEvent(new Event("input", { bubbles: true }));
      };
    })()`);
    const form = `document.getElementById("checked")`;

    // Invalid: validation stops the submission before the transport sees it.
    expect(
      await view.evaluate(`(() => { press("checked-save"); return [calls.length, native]; })()`),
    ).toEqual([0, []]);

    await view.evaluate(`(() => { type("a@b.c"); press("checked-save"); type("a@b.cd"); })()`);
    await view.evaluate(`reply("")`);
    await idle(view, "checked");
    // Saved "a@b.c"; the edit made during the request is still unsaved.
    expect(await view.evaluate(`${form}.hasAttribute("data-dirty")`)).toBe(true);
    await view.evaluate(`type("a@b.c")`);
    expect(await view.evaluate(`${form}.hasAttribute("data-dirty")`)).toBe(false);
  });
}, 60_000);
