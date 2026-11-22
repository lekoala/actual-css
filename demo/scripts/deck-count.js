/*
 * Cyberdeck demo readouts — not part of Actual CSS.
 *
 *   <span data-deck-count="notes" aria-hidden="true"></span>
 *   <textarea id="notes" maxlength="180"></textarea>
 *
 * A [data-deck-count] element prints its field's length against its
 * maxlength, zero-padded to the maximum's width, two digits at least
 * ("02/04", "012/180"). It is a
 * decorative readout: maxlength already enforces the limit, so the element
 * stays aria-hidden rather than announcing every keystroke.
 *
 * Inside an .otp it also marks the cell that takes the next character with
 * data-deck-cell="active" (the last one once the code is full), so page CSS
 * can light one cell instead of all of them. The value is not reflected in
 * the DOM, so CSS alone cannot find that cell.
 *
 * Its own attribute, not data-enhance: the plain-script runtime does not
 * expose registerEnhancement(), and this page should not pretend otherwise.
 */
(() => {
  const update = (field, readout) => {
    const max = field.maxLength;
    const length = field.value.length;
    const width = Math.max(2, String(max).length);
    const pad = (n) => String(n).padStart(width, "0");
    readout.textContent = `${pad(length)}/${pad(max)}`;

    const otp = field.closest(".otp");
    if (!otp) return;
    const cells = otp.querySelectorAll(":scope > span");
    const active = Math.min(length, cells.length - 1);
    cells.forEach((cell, index) => {
      if (index === active) cell.dataset.deckCell = "active";
      else cell.removeAttribute("data-deck-cell");
    });
  };

  const connect = () => {
    for (const readout of document.querySelectorAll("[data-deck-count]")) {
      const field = document.getElementById(readout.dataset.deckCount);
      if (!field || field.maxLength < 0) continue;
      field.addEventListener("input", () => update(field, readout));
      // A reset restores the value after the event, so read it a task later.
      field.form?.addEventListener("reset", () => setTimeout(() => update(field, readout)));
      update(field, readout);
    }
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", connect);
  else connect();
})();
