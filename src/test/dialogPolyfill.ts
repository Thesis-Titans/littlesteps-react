import { afterEach, beforeEach } from "vitest";

/**
 * Installs a lightweight jsdom polyfill for native `<dialog>` `showModal()` and `close()`.
 * Call once inside a `describe` block or top-level test file that renders modal dialogs.
 */
export function installDialogPolyfill(): void {
  const proto = HTMLDialogElement.prototype;
  let originalShowModal: typeof proto.showModal;
  let originalClose: typeof proto.close;

  beforeEach(() => {
    originalShowModal = proto.showModal;
    originalClose = proto.close;

    proto.showModal = function (this: HTMLDialogElement) {
      this.setAttribute("open", "");
    };
    proto.close = function (this: HTMLDialogElement) {
      this.removeAttribute("open");
    };
  });

  afterEach(() => {
    proto.showModal = originalShowModal;
    proto.close = originalClose;
  });
}
