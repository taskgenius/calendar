/**
 * @taskgenius/calendar
 *
 * A lightweight, configurable TypeScript calendar component library
 * with drag-and-drop support and extensible view system.
 */

// Main Calendar class
export { Calendar } from "./core/Calendar";
export type { ExtendedCalendarConfig } from "./core/Calendar";

// Core utilities
export { EventManager } from "./core/EventManager";
export { DragController } from "./core/DragController";
export { InteractionController } from "./core/InteractionController";

// Date adapters
export { DayJsAdapter } from "./adapters/DayJsAdapter";
export { NativeDateAdapter } from "./adapters/NativeDateAdapter";
export { DateFnsAdapter } from "./adapters/DateFnsAdapter";
export type { DateAdapter, TimeUnit } from "./adapters/DateAdapter";

// Engines
export { MonthEngine } from "./engines/MonthEngine";
export { TimeEngine } from "./engines/TimeEngine";

// Renderers
export { MonthRenderer } from "./renderers/MonthRenderer";
export { TimeRenderer } from "./renderers/TimeRenderer";

// Views - Extensible view system
export {
  // Base classes
  BaseView,
  ViewRegistry,
  createViewRegistry,
  // Built-in views (imported on-demand for tree-shaking)
  MonthView,
  TimeView,
  WeekView,
  DayView,
} from "./views";
export type {
  ViewContext,
  ViewMeta,
  ViewRenderOptions,
  ViewClass,
  ViewConstructor, // Legacy alias for ViewClass
  ViewRegistrationOptions,
} from "./views";

// Styles
export { applyThemeVariables, clearThemeVariables } from "./styles";

// Filter/Format preset utilities
export {
  hideWeekends,
  hideWeekdays,
  onlyDays,
  hideDays,
  workingHours,
  hideHours,
  onlyHours,
  format12h,
  format24h,
  customTimeLabels,
  formatCompact,
} from "./utils/presets";

// Factory presets for quick setup (includes all views)
// For tree-shaking optimization, use Calendar directly with manual view registration
export {
  createCalendar,
  createFullCalendar,
  createMonthCalendar,
  createWeekCalendar,
  createDayCalendar,
  registerBuiltInViews,
} from "./presets";
export type { FullCalendarConfig } from "./presets";

// Types
export type {
  CalendarEvent,
  CalendarConfig,
  ViewType,
  ViewConfig,
  DraggableConfig,
  ThemeConfig,
  MonthLayoutItem,
  AllDayLayoutItem,
  TimeLayoutItem,
  GridCell,
  TimeColumn,
  VisibleDay,
  DragMode,
  DragType,
  DragState,
  ResolvedCalendarConfig,
  DayFilterContext,
  DayRenderConfig,
  TimeSlotConfig,
  TimeFormatter,
  DayFilterResult,
  TimeFilterResult,
  DateCellContext,
  EventStyle,
  EventRenderContext,
} from "./types";
