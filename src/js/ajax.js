/*
 * Ajax — optional fetch transport for HTML forms.
 *
 * Opt in with data-enhance="ajax". A submission the module can reproduce
 * faithfully is sent with fetch; anything else is left to the browser:
 * method="dialog", enctype="text/plain", a target other than the page itself,
 * or a cross-origin action. Refusing beats approximating, and the native path
 * always works.
 *
 * Transport: one request at a time per form, aria-busy on the form and the
 * submitter, the request aborted when the form leaves the page, redirects
 * followed by navigation like a native submission.
 *
 * Display, kept apart: with data-ajax-target, an HTML response (2xx or 422)
 * replaces the target's content. Everything else only reaches the events.
 * The module never decides that a response means "saved".
 */

import { registerEnhancement } from "./enhance.js";
import { EVENTS } from "./events.js";

const BUSY = "aria-busy";
const ENCODINGS = new Set(["application/x-www-form-urlencoded", "multipart/form-data"]);

function isFormElement(el) {
  return typeof HTMLFormElement !== "undefined" && el instanceof HTMLFormElement;
}

// A submitter's form* attribute overrides the form's own, as natively.
function setting(form, submitter, name) {
  const attr = `form${name}`;
  return submitter?.hasAttribute(attr)
    ? submitter[`form${name[0].toUpperCase()}${name.slice(1)}`]
    : form[name];
}

// Without a target attribute, the form falls back to <base target>. An empty
// formtarget="" is still an attribute and means the page itself.
function targetOf(form, submitter) {
  if (submitter?.hasAttribute("formtarget") || form.hasAttribute("target")) {
    return setting(form, submitter, "target");
  }
  return form.ownerDocument.querySelector("base[target]")?.target ?? "";
}

// URL encoding as a native submission does it: CRLF newlines, and a file
// sent as its name. URLSearchParams alone would send "[object File]".
function urlEncoded(data) {
  const params = new URLSearchParams();
  const crlf = (value) => value.replace(/\r\n?|\n/g, "\r\n");
  for (const [name, value] of data) {
    params.append(crlf(name), crlf(typeof value === "string" ? value : value.name));
  }
  return params;
}

/** Builds the request, or returns null for a submission left to the browser. */
function requestFor(form, submitter) {
  const method = setting(form, submitter, "method");
  const enctype = setting(form, submitter, "enctype");
  const target = targetOf(form, submitter).toLowerCase();
  if (method !== "get" && method !== "post") return null;
  if (target !== "" && target !== "_self") return null;
  if (method === "post" && !ENCODINGS.has(enctype)) return null;
  const url = new URL(setting(form, submitter, "action"));
  // Cross-origin would need CORS and send no cookies: the native submission
  // works where fetch would fail. (file: pages compare "null" to "null".)
  if (url.origin !== form.ownerDocument.location.origin) return null;

  const data = new FormData(form, submitter);
  // De facto marker servers use to answer with a fragment instead of a page.
  const init = { method, headers: { Accept: "text/html", "X-Requested-With": "XMLHttpRequest" } };
  if (method === "get") url.search = urlEncoded(data).toString();
  else init.body = enctype === "multipart/form-data" ? data : urlEncoded(data);
  return { url, init };
}

function targetElement(root, selector) {
  try {
    return root.querySelector(selector);
  } catch {
    // A configuration error, not a failed request: keep it out of ajax-error.
    console.warn(`data-ajax-target is not a valid selector: "${selector}"`);
    return null;
  }
}

function display(form, root, response) {
  const selector = form.dataset.ajaxTarget;
  if (!selector || !(response.ok || response.status === 422)) return null;
  const type = response.headers.get("Content-Type")?.toLowerCase() ?? "";
  if (!type.includes("text/html")) return null;
  const target = targetElement(root, selector);
  if (!target) return null;
  // The clone leaves the original body readable by event listeners.
  return response
    .clone()
    .text()
    .then((html) => {
      target.innerHTML = html;
    });
}

function connectForm(form) {
  const root = form.getRootNode();
  const lifetime = new AbortController();
  let pending = false;

  // A target that contains the form (the server re-renders the whole form)
  // detaches it; the root still reaches document listeners.
  const emit = (name, detail) => {
    const origin = form.isConnected ? form : root;
    origin.dispatchEvent(new CustomEvent(name, { bubbles: true, detail: { form, ...detail } }));
  };

  const send = async (submitter, { url, init }) => {
    pending = true;
    const busy = [form, submitter].filter(Boolean);
    for (const el of busy) el.setAttribute(BUSY, "true");
    emit(EVENTS.ajaxStart, { submitter });
    try {
      const response = await fetch(url, { ...init, signal: lifetime.signal });
      if (response.redirected) {
        emit(EVENTS.ajaxResponse, { submitter, response });
        location.assign(response.url);
        return;
      }
      await display(form, root, response);
      emit(EVENTS.ajaxResponse, { submitter, response });
    } catch (error) {
      // An abort means the form left the page: nobody is listening.
      if (!lifetime.signal.aborted) emit(EVENTS.ajaxError, { submitter, error });
    } finally {
      pending = false;
      for (const el of busy) el.removeAttribute(BUSY);
    }
  };

  // Listen on the root, after the form's own listeners: validation (or the
  // application) cancels or stops an invalid submission before it gets here,
  // whatever order the enhancers started in.
  root.addEventListener(
    "submit",
    (event) => {
      if (event.target !== form || event.defaultPrevented) return;
      // Decide first: a submission left to the browser (a dialog's Cancel)
      // goes through even while a request runs.
      const request = requestFor(form, event.submitter);
      if (!request) return;
      event.preventDefault();
      if (!pending) send(event.submitter, request); // one request at a time
    },
    { signal: lifetime.signal },
  );

  return () => lifetime.abort();
}

registerEnhancement("ajax", (el) => (isFormElement(el) ? connectForm(el) : undefined));
