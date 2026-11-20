// Keep the last opener through dismissal so the dialog command can capture
// it even when the surface's click listener runs first.
export const surfaceFocusReturns = new WeakMap();

export function findFocusSurface(element) {
  for (
    let node = element;
    node;
    node = node.assignedSlot || node.parentElement || node.getRootNode().host
  ) {
    if (surfaceFocusReturns.has(node)) return node;
  }
  return null;
}
