/**
 * @taskgenius/calendar
 *
 * A lightweight, configurable TypeScript calendar component library
 * with drag-and-drop support.
 */

// Main Calendar class
export { Calendar } from "./core/Calendar";

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

// Styles
export { applyThemeVariables, clearThemeVariables } from "./styles";

// Types
export type {
  CalendarEvent,
  CalendarConfig,
  ViewType,
  ViewConfig,
  DraggableConfig,
  ThemeConfig,
  MonthLayoutItem,
  TimeLayoutItem,
  GridCell,
  TimeColumn,
  DragMode,
  DragType,
  DragState,
  ResolvedCalendarConfig,
} from "./types";
