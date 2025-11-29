/**
 * Test helper for creating Calendar instances with built-in views registered
 *
 * Since the Calendar class is now tree-shake friendly (no built-in views by default),
 * tests need to explicitly register the views they need.
 *
 * This helper provides the same "batteries-included" experience for tests.
 */
import { Calendar, type ExtendedCalendarConfig } from "../../src/core/Calendar";
import { ViewRegistry } from "../../src/views/ViewRegistry";
import { MonthView } from "../../src/views/MonthView";
import { WeekView, DayView } from "../../src/views/TimeView";

/**
 * Creates a ViewRegistry with all built-in views registered
 */
export function createFullViewRegistry(): ViewRegistry {
  const registry = new ViewRegistry();
  registry.register(MonthView);
  registry.register(WeekView);
  registry.register(DayView);
  return registry;
}

/**
 * Creates a Calendar instance with all built-in views registered
 *
 * This mirrors the behavior of createCalendar() from presets for test compatibility.
 * Use this in tests that need the full calendar experience.
 */
export function createTestCalendar(
  container: string | HTMLElement,
  config: ExtendedCalendarConfig = {},
): Calendar {
  return new Calendar(container, {
    ...config,
    viewRegistry: config.viewRegistry || createFullViewRegistry(),
  });
}
