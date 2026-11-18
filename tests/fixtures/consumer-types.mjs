import enhanceModule from "actual-css/js/enhance";
import { applyEnhancement, enhance, registerEnhancement } from "actual-css/js/full";

/** @type {import("actual-css/js/full").Enhancer} */
const init = (element) => {
  element.setAttribute("data-ready", "");
  return () => element.removeAttribute("data-ready");
};

/** @type {import("actual-css/js/full").EnhancementHandle} */
const handle = enhance({ "form[data-autosubmit]": init });
handle.refresh(document.body);
handle.disconnect();
enhanceModule({ form: init }, document.createDocumentFragment()).disconnect();

registerEnhancement("autosubmit", (element) => {
  element.toggleAttribute("data-ready");
}).refresh(document);

applyEnhancement("autosubmit", "form", document).forEach(init);

// @ts-expect-error Refresh takes a DOM node.
handle.refresh("form");
// @ts-expect-error An enhancer can only return a cleanup function or nothing.
registerEnhancement("invalid", () => 42);
