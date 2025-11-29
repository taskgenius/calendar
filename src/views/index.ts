/**
 * Views module exports
 *
 * Provides the extensible view system for calendar
 */

// Base classes and types
export { BaseView } from "./BaseView";
export type {
  ViewContext,
  ViewMeta,
  ViewRenderOptions,
  ViewClass,
  ViewConstructor, // Legacy alias
} from "./BaseView";

// Registry
export { ViewRegistry, createViewRegistry } from "./ViewRegistry";
export type { ViewRegistrationOptions } from "./ViewRegistry";

// Built-in views
export { MonthView } from "./MonthView";
export { TimeView, WeekView, DayView } from "./TimeView";
