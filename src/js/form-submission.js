/*
 * Form submission settings as the browser resolves them.
 *
 * A control named "action", "method", "enctype" or "target" shadows the
 * form's own property (form.action returns the <input>), so the values are
 * read through the HTMLFormElement prototype, never as form[name].
 */

function formProperty(form, name) {
  return Object.getOwnPropertyDescriptor(HTMLFormElement.prototype, name).get.call(form);
}

/**
 * Reads action, method, enctype or target: a submitter's form* attribute
 * overrides the form's own, as natively. Reflected values, so method and
 * enctype come back lowercase and action as an absolute URL.
 */
export function submissionSetting(form, submitter, name) {
  return submitter?.hasAttribute(`form${name}`)
    ? submitter[`form${name[0].toUpperCase()}${name.slice(1)}`]
    : formProperty(form, name);
}

/**
 * The browsing context name the submission goes to, "" for the page itself.
 * Without a target attribute the form falls back to <base target>; an empty
 * formtarget="" is still an attribute and means the page itself.
 */
export function submissionTarget(form, submitter) {
  if (submitter?.hasAttribute("formtarget") || form.hasAttribute("target")) {
    return submissionSetting(form, submitter, "target");
  }
  return form.ownerDocument.querySelector("base[target]")?.target ?? "";
}
