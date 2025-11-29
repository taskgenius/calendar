/**
 * Preset utilities for quick calendar setup
 *
 * These factory functions provide convenient ways to create fully-configured
 * calendars with all built-in views and adapters pre-registered.
 *
 * Use these when you don't need fine-grained control over tree-shaking
 * and want a quick setup experience.
 */
import type { CalendarConfig } from "./types";
import { Calendar, type ExtendedCalendarConfig } from "./core/Calendar";
import { ViewRegistry } from "./views/ViewRegistry";
import { MonthView } from "./views/MonthView";
import { WeekView, DayView } from "./views/TimeView";
import { DayJsAdapter } from "./adapters/DayJsAdapter";
import type { Dayjs } from "dayjs";

/**
 * Configuration for createFullCalendar factory
 */
export type FullCalendarConfig = CalendarConfig;

/**
 * Create a fully-configured calendar with all built-in views
 *
 * This is a convenience factory for users who want the complete
 * calendar experience without manual view registration.
 *
 * Note: This function imports all built-in views and DayJsAdapter,
 * which will include them in your bundle. For minimal bundle size,
 * use the Calendar class directly and register only needed views.
 *
 * @param containerSelector - CSS selector or HTMLElement
 * @param config - Calendar configuration
 * @returns Configured Calendar instance with all views registered
 *
 * @example
 * ```typescript
 * import { createFullCalendar } from '@taskgenius/calendar/presets';
 *
 * const calendar = createFullCalendar('#app', {
 *   view: { type: 'week' },
 *   events: [...]
 * });
 * ```
 */
export function createFullCalendar(
  containerSelector: string | HTMLElement,
  config: FullCalendarConfig = {},
): Calendar<Dayjs> {
  // Create a pre-populated view registry
  const viewRegistry = new ViewRegistry();
  viewRegistry.register(MonthView);
  viewRegistry.register(WeekView);
  viewRegistry.register(DayView);

  // Build extended config with DayJsAdapter by default
  const extendedConfig: ExtendedCalendarConfig = {
    ...config,
    viewRegistry,
    dateAdapter: new DayJsAdapter(),
  };

  return new Calendar<Dayjs>(containerSelector, extendedConfig);
}

/**
 * Create a calendar with only month view registered
 *
 * Use this for a lighter bundle when you only need the month view.
 *
 * @param containerSelector - CSS selector or HTMLElement
 * @param config - Calendar configuration
 * @returns Calendar with month view only
 *
 * @example
 * ```typescript
 * import { createMonthCalendar } from '@taskgenius/calendar/presets';
 *
 * const calendar = createMonthCalendar('#app', {
 *   events: [...]
 * });
 * ```
 */
export function createMonthCalendar(
  containerSelector: string | HTMLElement,
  config: CalendarConfig = {},
): Calendar<Date> {
  const viewRegistry = new ViewRegistry();
  viewRegistry.register(MonthView);

  return new Calendar<Date>(containerSelector, {
    ...config,
    view: { ...config.view, type: "month" },
    viewRegistry,
  });
}

/**
 * Create a calendar with only week view registered
 *
 * Use this for a lighter bundle when you only need the week view.
 *
 * @param containerSelector - CSS selector or HTMLElement
 * @param config - Calendar configuration
 * @returns Calendar with week view only
 *
 * @example
 * ```typescript
 * import { createWeekCalendar } from '@taskgenius/calendar/presets';
 *
 * const calendar = createWeekCalendar('#app', {
 *   events: [...]
 * });
 * ```
 */
export function createWeekCalendar(
  containerSelector: string | HTMLElement,
  config: CalendarConfig = {},
): Calendar<Date> {
  const viewRegistry = new ViewRegistry();
  viewRegistry.register(WeekView);

  return new Calendar<Date>(containerSelector, {
    ...config,
    view: { ...config.view, type: "week" },
    viewRegistry,
  });
}

/**
 * Create a calendar with only day view registered
 *
 * Use this for the lightest bundle when you only need the day view.
 *
 * @param containerSelector - CSS selector or HTMLElement
 * @param config - Calendar configuration
 * @returns Calendar with day view only
 *
 * @example
 * ```typescript
 * import { createDayCalendar } from '@taskgenius/calendar/presets';
 *
 * const calendar = createDayCalendar('#app', {
 *   events: [...]
 * });
 * ```
 */
export function createDayCalendar(
  containerSelector: string | HTMLElement,
  config: CalendarConfig = {},
): Calendar<Date> {
  const viewRegistry = new ViewRegistry();
  viewRegistry.register(DayView);

  return new Calendar<Date>(containerSelector, {
    ...config,
    view: { ...config.view, type: "day" },
    viewRegistry,
  });
}

/**
 * Register all built-in views to an existing ViewRegistry
 *
 * Utility function for programmatic registration of all built-in views.
 *
 * @param registry - ViewRegistry to register views to
 *
 * @example
 * ```typescript
 * import { ViewRegistry, registerBuiltInViews } from '@taskgenius/calendar';
 *
 * const registry = new ViewRegistry();
 * registerBuiltInViews(registry);
 *
 * const calendar = new Calendar('#app', { viewRegistry: registry });
 * ```
 */
export function registerBuiltInViews(registry: ViewRegistry): void {
  if (!registry.has("month")) {
    registry.register(MonthView);
  }
  if (!registry.has("week")) {
    registry.register(WeekView);
  }
  if (!registry.has("day")) {
    registry.register(DayView);
  }
}

/**
 * Create a standard calendar with NativeDateAdapter and all built-in views.
 *
 * This is the recommended entry point for users who want a batteries-included
 * experience without worrying about view registration.
 *
 * For tree-shaking optimization (smaller bundles), use `new Calendar()` directly
 * and register only the views you need.
 *
 * @param containerSelector - CSS selector or HTMLElement
 * @param config - Calendar configuration
 * @returns Configured Calendar instance with all built-in views registered
 *
 * @example
 * ```typescript
 * import { createCalendar } from '@taskgenius/calendar';
 *
 * // Batteries-included: all views registered automatically
 * const calendar = createCalendar('#app', {
 *   view: { type: 'week' },
 *   events: [...]
 * });
 * ```
 *
 * @example Tree-shaking mode (advanced)
 * ```typescript
 * import { Calendar, ViewRegistry, MonthView } from '@taskgenius/calendar';
 *
 * // Only include MonthView in bundle
 * const registry = new ViewRegistry();
 * registry.register(MonthView);
 *
 * const calendar = new Calendar('#app', {
 *   viewRegistry: registry,
 *   view: { type: 'month' }
 * });
 * ```
 */
export function createCalendar(
  containerSelector: string | HTMLElement,
  config: CalendarConfig = {},
): Calendar<Date> {
  const viewRegistry = new ViewRegistry();
  registerBuiltInViews(viewRegistry);

  return new Calendar<Date>(containerSelector, {
    ...config,
    viewRegistry,
  });
}
