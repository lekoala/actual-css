// A popover can become detached before the native call. Let the caller handle
// a failed show and allow its own teardown to finish after a failed hide.
export function showPopover(element) {
  try {
    element.showPopover();
    return true;
  } catch {
    return false;
  }
}

export function hidePopover(element) {
  try {
    element.hidePopover();
  } catch {
    /* Already closed or detached; nothing left to hide. */
  }
}
