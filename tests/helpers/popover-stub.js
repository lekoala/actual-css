/*
 * Popover transport stub for the unit layer. Not a polyfill.
 *
 * happy-dom (20.11) implements the popover *invoker* attributes —
 * popoverTargetElement and popoverTargetAction on button and input — but not
 * the element API. showPopover, hidePopover and togglePopover are absent from
 * the package, and matches(":popover-open") answers `false` rather than
 * throwing, which is the dangerous half: a silently wrong answer instead of an
 * error.
 *
 * surface.js uses popover="manual" purely as transport. The platform promotes
 * the surface to the top layer and does nothing else; .is-open remains the
 * lifecycle state the runtime reads and the CSS keys on. So the unit layer
 * needs exactly one thing that happy-dom cannot give it: that calling the two
 * methods does not throw. Hence two no-ops, and nothing more.
 *
 * TRANSPORT STUB ONLY. Do not add Popover lifecycle, top-layer, selector,
 * dismissal or accessibility behavior here: no :popover-open, no toggle or
 * beforetoggle events, no popovertarget wiring, no light dismiss, no
 * ::backdrop, no stacking order. Those are real contracts and they belong in
 * tests/browser, running in an engine that implements them. A partial
 * imitation here is worse than no coverage, because it turns green on
 * assertions a real browser would fail.
 *
 * That happy-dom does not implement any of this is a useful reminder of where
 * those assertions have to live — not an invitation to write them here.
 */
export function installPopoverTestStub(window) {
  const proto = window.HTMLElement.prototype;
  if (typeof proto.showPopover === "function") return;

  proto.showPopover = function showPopover() {};
  proto.hidePopover = function hidePopover() {};
}
