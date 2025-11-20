/**
 * DOM utility functions for building calendar UI
 */

/**
 * Create an HTML element with optional class and attributes
 *
 * @param tag - HTML tag name
 * @param className - CSS class string
 * @param attributes - Additional attributes to set
 * @returns Created element
 */
export function createElement<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  attributes?: Record<string, string>
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);

  if (className) {
    el.className = className;
  }

  if (attributes) {
    for (const [key, value] of Object.entries(attributes)) {
      el.setAttribute(key, value);
    }
  }

  return el;
}

/**
 * Set multiple styles on an element
 *
 * @param el - Target element
 * @param styles - Style properties to set
 */
export function setStyles(
  el: HTMLElement,
  styles: Partial<CSSStyleDeclaration>
): void {
  Object.assign(el.style, styles);
}

/**
 * Clear all child elements from an element
 *
 * @param el - Target element
 */
export function clearElement(el: HTMLElement): void {
  el.innerHTML = '';
}

/**
 * Append multiple children to a parent element
 *
 * @param parent - Parent element
 * @param children - Children to append
 */
export function appendChildren(
  parent: HTMLElement,
  children: HTMLElement[]
): void {
  for (const child of children) {
    parent.appendChild(child);
  }
}

/**
 * Query selector with type safety
 *
 * @param selector - CSS selector
 * @param parent - Parent element to search within
 * @returns Found element or null
 */
export function querySelector<T extends HTMLElement>(
  selector: string,
  parent: HTMLElement | Document = document
): T | null {
  return parent.querySelector<T>(selector);
}

/**
 * Query all matching elements with type safety
 *
 * @param selector - CSS selector
 * @param parent - Parent element to search within
 * @returns NodeList of found elements
 */
export function querySelectorAll<T extends HTMLElement>(
  selector: string,
  parent: HTMLElement | Document = document
): NodeListOf<T> {
  return parent.querySelectorAll<T>(selector);
}

/**
 * Add event listener with automatic cleanup
 *
 * @param el - Target element
 * @param event - Event name
 * @param handler - Event handler
 * @param options - Event listener options
 * @returns Cleanup function
 */
export function addListener<K extends keyof HTMLElementEventMap>(
  el: HTMLElement | Document,
  event: K,
  handler: (e: HTMLElementEventMap[K]) => void,
  options?: boolean | AddEventListenerOptions
): () => void {
  el.addEventListener(event, handler as EventListener, options);
  return () => el.removeEventListener(event, handler as EventListener, options);
}

/**
 * Get element's position relative to another element
 *
 * @param el - Target element
 * @param relativeTo - Reference element (default: document.body)
 * @returns Position object with top, left, width, height
 */
export function getRelativePosition(
  el: HTMLElement,
  relativeTo: HTMLElement = document.body
): { top: number; left: number; width: number; height: number } {
  const elRect = el.getBoundingClientRect();
  const refRect = relativeTo.getBoundingClientRect();

  return {
    top: elRect.top - refRect.top,
    left: elRect.left - refRect.left,
    width: elRect.width,
    height: elRect.height
  };
}
