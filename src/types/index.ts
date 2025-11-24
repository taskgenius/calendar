/**
 * Core type definitions for @taskgenius/calendar
 */

// =============================================================================
// Event Types
// =============================================================================

/**
 * Represents a calendar event
 */
export interface CalendarEvent {
  /** Unique identifier for the event */
  id: string;
  /** Display title of the event */
  title: string;
  /** Start date/time in ISO 8601 format (yyyy-MM-dd HH:mm) */
  start: string;
  /** End date/time in ISO 8601 format (yyyy-MM-dd HH:mm) */
  end: string;
  /** CSS color value for the event */
  color?: string;
  /** Additional custom data */
  metadata?: Record<string, unknown>;
}

// =============================================================================
// View Types
// =============================================================================

/**
 * Available calendar view types
 */
export type ViewType = "month" | "week" | "day";

/**
 * Context information provided to day filter function
 */
export interface DayFilterContext {
  /** Whether this day is a weekend (Saturday or Sunday) */
  isWeekend: boolean;
  /** Day of week (0-6, where 0 = Sunday) */
  dayOfWeek: number;
  /** Whether this day is today */
  isToday: boolean;
  /** Whether this day belongs to the current month (only meaningful in month view) */
  isThisMonth: boolean;
}

/**
 * Advanced configuration for day rendering (returned by day filter)
 */
export interface DayRenderConfig {
  /** Whether to display this day */
  visible: boolean;
  /** Additional CSS class name to apply */
  className?: string;
  /** Inline styles to apply */
  style?: Partial<CSSStyleDeclaration>;
  /** Whether to disable interactions on this day */
  disabled?: boolean;
}

/**
 * Configuration for time slot rendering (returned by time filter)
 */
export interface TimeSlotConfig {
  /** Whether to display this time slot */
  visible: boolean;
  /** Custom label text for this time slot */
  label?: string;
  /** Additional CSS class name to apply */
  className?: string;
}

/**
 * Function type for formatting time labels
 * @param hour - Hour value (0-23)
 * @param minute - Minute value (default: 0)
 * @returns Formatted time string
 */
export type TimeFormatter = (hour: number, minute?: number) => string;

/**
 * Return type for day filter function (boolean for simple cases, config object for advanced)
 */
export type DayFilterResult = boolean | DayRenderConfig;

/**
 * Return type for time filter function (boolean for simple cases, config object for advanced)
 */
export type TimeFilterResult = boolean | TimeSlotConfig;

/**
 * Configuration for calendar view
 */
export interface ViewConfig {
  /** Current view type */
  type: ViewType;
  /** Show date header in time views */
  showDateHeader?: boolean;
  /** Show week numbers in month view */
  showWeekNumbers?: boolean;
  /** First day of week: 0 = Sunday, 1 = Monday, 6 = Saturday (default: 0) */
  firstDayOfWeek?: 0 | 1 | 6;
  /** Show weekends (Saturday and Sunday) (default: true). Note: dayFilter takes precedence if provided. */
  showWeekends?: boolean;
  /**
   * Day filter function (applies to all views)
   * Controls which days are rendered and how they appear
   * @param date - The date to filter (type depends on date adapter)
   * @param context - Context information about the day
   * @returns boolean (true = show, false = hide) or DayRenderConfig for advanced customization
   * @example
   * ```typescript
   * // Simple: hide weekends
   * dayFilter: (date, ctx) => !ctx.isWeekend
   *
   * // Advanced: customize holiday appearance
   * dayFilter: (date, ctx) => {
   *   if (isHoliday(date)) {
   *     return { visible: true, className: 'holiday', disabled: true };
   *   }
   *   return true;
   * }
   * ```
   */
  dayFilter?: (date: unknown, context: DayFilterContext) => DayFilterResult;
  /**
   * Time slot filter function (only applies to week/day views)
   * Controls which hour slots are displayed on the time axis
   * @param hour - Hour value (0-23)
   * @returns boolean (true = show, false = hide) or TimeSlotConfig for advanced customization
   * @example
   * ```typescript
   * // Simple: show only working hours (8:00-18:00)
   * timeFilter: (hour) => hour >= 8 && hour < 18
   *
   * // Advanced: customize specific hours
   * timeFilter: (hour) => {
   *   if (hour === 12) return { visible: true, label: 'Lunch', className: 'lunch-hour' };
   *   return hour >= 8 && hour < 18;
   * }
   * ```
   */
  timeFilter?: (hour: number) => TimeFilterResult;
  /**
   * Time formatter function (only applies to week/day views)
   * Customizes how time labels are displayed on the time axis
   * @param hour - Hour value (0-23)
   * @param minute - Minute value (default: 0)
   * @returns Formatted time string
   * @example
   * ```typescript
   * // 12-hour format
   * timeFormatter: (hour) => {
   *   const h = hour % 12 || 12;
   *   const period = hour >= 12 ? 'PM' : 'AM';
   *   return `${h} ${period}`;
   * }
   * ```
   */
  timeFormatter?: TimeFormatter;
}

// =============================================================================
// Draggable Types
// =============================================================================

/**
 * Configuration for drag-and-drop functionality
 */
export interface DraggableConfig {
  /** Enable drag-and-drop */
  enabled: boolean;
  /** Snap to minutes interval (default: 15) */
  snapMinutes?: number;
  /** Opacity of ghost element during drag (0-1) */
  ghostOpacity?: number;
  /** Only adjust date when dragging, keep time unchanged (default: false) */
  dateOnly?: boolean;
}

/**
 * Drag operation modes
 */
export type DragMode =
  | "move"
  | "resize-left"
  | "resize-right"
  | "resize-bottom"
  | "resize-top";

/**
 * Drag operation types
 */
export type DragType = "month" | "time";

/**
 * Internal drag state
 */
export interface DragState<T> {
  type: DragType;
  mode: DragMode;
  event: CalendarEvent;
  startX: number;
  startY: number;
  startDate: T;
  endDate: T;
  tentativeStart?: T;
  tentativeEnd?: T;
  cellW?: number;
  colW?: number;
  clickOffsetDays?: number;
  origStartMin?: number;
  origDuration?: number;
  renderCallback: () => void;
}

/**
 * Internal state for range selection
 */
export interface RangeSelectionState<T> {
  /** Whether currently selecting a range */
  isSelecting: boolean;
  /** Start date/time of the selection */
  startDate: T | null;
  /** Starting X coordinate */
  startX: number;
  /** Starting Y coordinate */
  startY: number;
  /** Current date/time during selection */
  currentDate: T | null;
  /** Type of view where selection is happening */
  viewType: "month" | "time";
  /** Column element for time view selection */
  columnEl?: HTMLElement;
}

// =============================================================================
// Render Hook Types
// =============================================================================

/**
 * Context provided to date cell render hook
 */
export interface DateCellContext {
  /** Current date */
  date: Date;
  /** Events on this date */
  events: CalendarEvent[];
  /** DOM element of the cell */
  cellEl: HTMLElement;
  /** Whether this date is today */
  isToday: boolean;
  /** Whether this date is in the past */
  isPastDue: boolean;
  /** Whether this date is in the future */
  isFuture: boolean;
  /** Whether this date belongs to the current month */
  isThisMonth: boolean;
}

/**
 * Style configuration returned by event style hook
 */
export interface EventStyle {
  /** Additional CSS class name */
  className?: string;
  /** Background color */
  color?: string;
  /** Opacity (0-1) */
  opacity?: number;
}

// =============================================================================
// Theme Types
// =============================================================================

/**
 * Configuration for calendar theme/styling
 */
export interface ThemeConfig {
  /** Primary accent color */
  primaryColor?: string;
  /** Height of each hour cell in pixels (default: 60) */
  cellHeight?: number;
  /** Font size configuration */
  fontSize?: {
    /** Header font size */
    header?: string;
    /** Event font size */
    event?: string;
  };
}

// =============================================================================
// Date Format Types
// =============================================================================

/**
 * Configuration for date format strings used throughout the calendar
 * Format tokens depend on the dateAdapter being used (Day.js, date-fns, or Native)
 *
 * @example Unicode tokens (recommended, compatible with all adapters)
 * ```typescript
 * {
 *   date: 'yyyy-MM-dd',
 *   dateTime: 'yyyy-MM-dd HH:mm',
 *   time: 'HH:mm',
 *   monthHeader: 'yyyy M',
 *   dayHeader: 'yyyy M d'
 * }
 * ```
 *
 * @example Legacy tokens (supported for backward compatibility)
 * ```typescript
 * {
 *   date: 'YYYY-MM-DD',
 *   dateTime: 'YYYY-MM-DD HH:mm',
 *   time: 'HH:mm',
 *   monthHeader: 'YYYY M',
 *   dayHeader: 'YYYY M D'
 * }
 * ```
 */
export interface DateFormatConfig {
  /** Date format (default: 'yyyy-MM-dd') */
  date: string;
  /** Date-time format (default: 'yyyy-MM-dd HH:mm') */
  dateTime: string;
  /** Time format (default: 'HH:mm') */
  time: string;
  /** Month view header format (default: 'yyyy M') */
  monthHeader: string;
  /** Day view header format (default: 'yyyy M d') */
  dayHeader: string;
}

// =============================================================================
// Layout Types
// =============================================================================

/**
 * Layout information for a month view event
 */
export interface MonthLayoutItem {
  /** Original event data */
  event: CalendarEvent;
  /** Start index within week (0-6) */
  startIdx: number;
  /** Number of days the event spans */
  span: number;
  /** Vertical slot position */
  slot: number;
  /** Whether this is the start of the event */
  isStart: boolean;
  /** Whether this is the end of the event */
  isEnd: boolean;
}

/**
 * Layout information for a time view event
 */
export interface TimeLayoutItem {
  /** Original event data */
  event: CalendarEvent;
  /** Top position in pixels */
  top: number;
  /** Height in pixels */
  height: number;
  /** Left position as percentage (0-100) */
  leftPercent: number;
  /** Width as percentage (0-100) */
  widthPercent: number;
  /** Column index for overlap handling */
  colIndex: number;
  /** Start time in minutes from midnight */
  startMin: number;
  /** End time in minutes from midnight */
  endMin: number;
}

/**
 * Grid cell information for month view
 */
export interface GridCell<T> {
  /** Date object */
  date: T;
  /** Formatted date string (yyyy-MM-dd) */
  dateStr: string;
}

/**
 * Column information for time view
 */
export interface TimeColumn<T> {
  /** Date object */
  date: T;
  /** Formatted date string (yyyy-MM-dd) */
  dateStr: string;
}

// =============================================================================
// Configuration Types
// =============================================================================

/**
 * Main calendar configuration
 */
export interface CalendarConfig {
  /** View configuration */
  view?: ViewConfig;
  /** Initial events to display */
  events?: CalendarEvent[];
  /** Drag-and-drop configuration */
  draggable?: DraggableConfig;
  /** Theme/styling configuration */
  theme?: ThemeConfig;
  /** Custom date adapter instance */
  dateAdapter?: DateAdapter<unknown>;
  /** Show event count badges on date cells in month view (default: false) */
  showEventCounts?: boolean;
  /**
   * Date format strings configuration
   * Allows full customization of all date/time formats used internally
   * Format tokens depend on the dateAdapter being used
   */
  dateFormats?: Partial<DateFormatConfig>;
  /**
   * Custom header title format strings (deprecated, use dateFormats instead)
   * @deprecated Use dateFormats.monthHeader and dateFormats.dayHeader instead
   * Default uses unicode tokens: { month: 'yyyy M', day: 'yyyy M d' }
   * Note: Format tokens depend on the dateAdapter being used
   */
  headerFormat?: {
    /** Format for month/week view header */
    month?: string;
    /** Format for day view header */
    day?: string;
  };
  /** Callback when an event is clicked */
  onEventClick?: (event: CalendarEvent) => void;
  /** Callback when an event is double-clicked */
  onEventDoubleClick?: (event: CalendarEvent) => void;
  /** Callback when an event is right-clicked */
  onEventContextMenu?: (event: CalendarEvent, x: number, y: number) => void;
  /** Callback when an event is dropped after dragging (moved to a new position) */
  onEventDrop?: (event: CalendarEvent, newStart: Date, newEnd: Date) => void;
  /** Callback when an event is resized (duration changed by dragging start/end time) */
  onEventResize?: (event: CalendarEvent, newStart: Date, newEnd: Date) => void;
  /** Callback when the view type changes */
  onViewChange?: (viewType: ViewType) => void;
  /** Callback when navigating to a different date */
  onDateChange?: (date: Date) => void;
  /** Callback when a date cell is clicked (month view) */
  onDateClick?: (date: Date) => void;
  /** Callback when a date cell is double-clicked (month view) */
  onDateDoubleClick?: (date: Date) => void;
  /** Callback when a date cell is right-clicked (month view) */
  onDateContextMenu?: (date: Date, x: number, y: number) => void;
  /** Callback when a time slot is clicked (week/day view) */
  onTimeSlotClick?: (dateTime: Date) => void;
  /** Callback when a time slot is double-clicked (week/day view) */
  onTimeSlotDoubleClick?: (dateTime: Date) => void;
  /** Callback when a time slot is right-clicked (week/day view) */
  onTimeSlotContextMenu?: (dateTime: Date, x: number, y: number) => void;
  /** Callback when a date range is selected by dragging (month view) */
  onDateRangeSelect?: (startDate: Date, endDate: Date) => void;
  /** Callback when a time range is selected by dragging (week/day view) */
  onTimeRangeSelect?: (startDateTime: Date, endDateTime: Date) => void;
  /** Hook to customize date cell rendering */
  onRenderDateCell?: (ctx: DateCellContext) => void;
  /** Hook to customize event styling */
  onStyleEvent?: (event: CalendarEvent) => EventStyle;
}

/**
 * Internal resolved configuration with all defaults applied
 */
export interface ResolvedCalendarConfig {
  view: Required<
    Omit<ViewConfig, "dayFilter" | "timeFilter" | "timeFormatter">
  > & {
    dayFilter?: (date: unknown, context: DayFilterContext) => DayFilterResult;
    timeFilter?: (hour: number) => TimeFilterResult;
    timeFormatter?: TimeFormatter;
  };
  draggable: Required<DraggableConfig>;
  theme: Required<ThemeConfig> & {
    fontSize: Required<NonNullable<ThemeConfig["fontSize"]>>;
  };
  showEventCounts: boolean;
  dateFormats: Required<DateFormatConfig>;
  headerFormat: {
    month: string;
    day: string;
  };
  onEventClick?: (event: CalendarEvent) => void;
  onEventDoubleClick?: (event: CalendarEvent) => void;
  onEventContextMenu?: (event: CalendarEvent, x: number, y: number) => void;
  onEventDrop?: (event: CalendarEvent, newStart: Date, newEnd: Date) => void;
  onEventResize?: (event: CalendarEvent, newStart: Date, newEnd: Date) => void;
  onViewChange?: (viewType: ViewType) => void;
  onDateChange?: (date: Date) => void;
  onDateClick?: (date: Date) => void;
  onDateDoubleClick?: (date: Date) => void;
  onDateContextMenu?: (date: Date, x: number, y: number) => void;
  onTimeSlotClick?: (dateTime: Date) => void;
  onTimeSlotDoubleClick?: (dateTime: Date) => void;
  onTimeSlotContextMenu?: (dateTime: Date, x: number, y: number) => void;
  onDateRangeSelect?: (startDate: Date, endDate: Date) => void;
  onTimeRangeSelect?: (startDateTime: Date, endDateTime: Date) => void;
  onRenderDateCell?: (ctx: DateCellContext) => void;
  onStyleEvent?: (event: CalendarEvent) => EventStyle;
}

// =============================================================================
// Date Adapter Types
// =============================================================================

/**
 * Time unit for date operations
 */
export type TimeUnit = "year" | "month" | "week" | "day" | "hour" | "minute";

/**
 * Abstract date adapter interface for pluggable date libraries
 */
export interface DateAdapter<T> {
  // Creation
  /** Create a date from various inputs */
  create(date?: string | Date | T): T;
  /** Parse a date string with optional format */
  parse(dateStr: string, format?: string): T;
  /** Format a date to string */
  format(date: T, format: string): string;

  // Getters
  /** Get year */
  year(date: T): number;
  /** Get month (0-11) */
  month(date: T): number;
  /** Get day of month (1-31) */
  date(date: T): number;
  /** Get day of week (0-6, Sunday = 0) */
  day(date: T): number;
  /** Get hour (0-23) */
  hour(date: T): number;
  /** Get minute (0-59) */
  minute(date: T): number;

  // Setters
  /** Set hour and return new date */
  setHour(date: T, hour: number): T;
  /** Set minute and return new date */
  setMinute(date: T, minute: number): T;

  // Calculations
  /** Add time to date */
  add(date: T, amount: number, unit: TimeUnit): T;
  /** Calculate difference between dates */
  diff(date1: T, date2: T, unit: TimeUnit): number;

  // Boundaries
  /** Get start of time unit */
  startOf(date: T, unit: TimeUnit): T;
  /** Get end of time unit */
  endOf(date: T, unit: TimeUnit): T;

  // Comparisons
  /** Check if date1 is before date2 */
  isBefore(date1: T, date2: T, unit?: TimeUnit): boolean;
  /** Check if date1 is after date2 */
  isAfter(date1: T, date2: T, unit?: TimeUnit): boolean;
  /** Check if dates are the same */
  isSame(date1: T, date2: T, unit?: TimeUnit): boolean;
}
