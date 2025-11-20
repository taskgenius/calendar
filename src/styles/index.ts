import type { ThemeConfig } from "../types";

type ResolvedTheme = Required<ThemeConfig> & {
  fontSize: Required<NonNullable<ThemeConfig["fontSize"]>>;
};

/**
 * Apply theme values as CSS variables on the given element.
 */
export function applyThemeVariables(
  target: HTMLElement,
  theme: ResolvedTheme,
): void {
  target.style.setProperty("--tg-primary-color", theme.primaryColor);
  target.style.setProperty("--tg-primary-rgb", hexToRgb(theme.primaryColor));
  target.style.setProperty("--tg-cell-height", `${theme.cellHeight}px`);
  target.style.setProperty("--tg-font-header", theme.fontSize.header);
  target.style.setProperty("--tg-font-event", theme.fontSize.event);
}

/**
 * Clear theme variables from the element.
 */
export function clearThemeVariables(target: HTMLElement): void {
  target.style.removeProperty("--tg-primary-color");
  target.style.removeProperty("--tg-primary-rgb");
  target.style.removeProperty("--tg-cell-height");
  target.style.removeProperty("--tg-font-header");
  target.style.removeProperty("--tg-font-event");
}

/**
 * Convert hex color to RGB string
 */
function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    return `${parseInt(result[1]!, 16)}, ${parseInt(result[2]!, 16)}, ${parseInt(result[3]!, 16)}`;
  }
  return "59, 130, 246"; // Default blue
}
