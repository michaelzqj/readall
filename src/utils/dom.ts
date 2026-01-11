/**
 * Waits for an element to appear in the DOM.
 * @param selector The CSS selector to match.
 * @param timeout The maximum time to wait in milliseconds (default: 10000ms).
 * @returns A promise resolving to the element, or null if timed out.
 */
export function waitForElement(selector: string, timeout: number = 10000): Promise<HTMLElement | null> {
  return new Promise((resolve) => {
    if (document.querySelector(selector)) {
      return resolve(document.querySelector(selector) as HTMLElement);
    }

    const observer = new MutationObserver((_mutations) => {
      if (document.querySelector(selector)) {
        observer.disconnect();
        resolve(document.querySelector(selector) as HTMLElement);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    setTimeout(() => {
      observer.disconnect();
      resolve(null);
    }, timeout);
  });
}

/**
 * Simulates a native click event on an element.
 * specific mouse events are sometimes required over .click()
 */
export function simulateClick(element: HTMLElement) {
    const mouseClickEvents = ['mousedown', 'click', 'mouseup'];
    mouseClickEvents.forEach(type => {
        const event = new MouseEvent(type, {
            view: window,
            bubbles: true,
            cancelable: true,
            buttons: 1
        });
        element.dispatchEvent(event);
    });
}
