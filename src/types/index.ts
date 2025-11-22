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
  /** Start date/time in ISO 8601 format (YYYY-MM-DD HH:mm) */
  start: string;
  /** End date/time in ISO 8601 format (YYYY-MM-DD HH:mm) */
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
  /** Show weekends (Saturday and Sunday) (default: true) */
  showWeekends?: boolean;
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
  | "resize-bottom";

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
 * @example Day.js tokens
 * ```typescript
 * {
 *   date: 'YYYY-MM-DD',
 *   dateTime: 'YYYY-MM-DD HH:mm',
 *   time: 'HH:mm',
 *   monthHeader: 'YYYY M',
 *   dayHeader: 'YYYY M D'
 * }
 * ```
 *
 * @example date-fns tokens
 * ```typescript
 * {
 *   date: 'yyyy-MM-dd',
 *   dateTime: 'yyyy-MM-dd HH:mm',
 *   time: 'HH:mm',
 *   monthHeader: 'YYYY M',
 *   dayHeader: 'YYYY M D'
 * }
 * ```
 */
export interface DateFormatConfig {
  /** Date format (default: 'YYYY-MM-DD' for Day.js, 'yyyy-MM-dd' for date-fns) */
  date: string;
  /** Date-time format (default: 'YYYY-MM-DD HH:mm' for Day.js, 'yyyy-MM-dd HH:mm' for date-fns) */
  dateTime: string;
  /** Time format (default: 'HH:mm') */
  time: string;
  /** Month view header format (default: 'YYYY M' for Day.js, 'YYYY M' for date-fns) */
  monthHeader: string;
  /** Day view header format (default: 'YYYY M D' for Day.js, 'YYYY M D' for date-fns) */
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
  /** Formatted date string (YYYY-MM-DD) */
  dateStr: string;
}

/**
 * Column information for time view
 */
export interface TimeColumn<T> {
  /** Date object */
  date: T;
  /** Formatted date string (YYYY-MM-DD) */
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
   * Default uses Day.js tokens: { month: 'YYYY M', day: 'YYYY M D' }
   * Note: Format tokens depend on the dateAdapter being used (Day.js vs date-fns)
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
  /** Callback when an event is dropped after dragging */
  onEventDrop?: (
    event: CalendarEvent,
    newStart: string,
    newEnd: string,
  ) => void;
  /** Callback when the view type changes */
  onViewChange?: (viewType: ViewType) => void;
  /** Callback when navigating to a different date */
  onDateChange?: (date: string) => void;
  /** Callback when a date cell is clicked (month view) */
  onDateClick?: (date: string) => void;
  /** Callback when a date cell is double-clicked (month view) */
  onDateDoubleClick?: (date: string) => void;
  /** Callback when a date cell is right-clicked (month view) */
  onDateContextMenu?: (date: string, x: number, y: number) => void;
  /** Callback when a time slot is clicked (week/day view) */
  onTimeSlotClick?: (dateTime: string) => void;
  /** Callback when a time slot is double-clicked (week/day view) */
  onTimeSlotDoubleClick?: (dateTime: string) => void;
  /** Callback when a time slot is right-clicked (week/day view) */
  onTimeSlotContextMenu?: (dateTime: string, x: number, y: number) => void;
  /** Callback when a date range is selected by dragging (month view) */
  onDateRangeSelect?: (startDate: string, endDate: string) => void;
  /** Callback when a time range is selected by dragging (week/day view) */
  onTimeRangeSelect?: (startDateTime: string, endDateTime: string) => void;
  /** Hook to customize date cell rendering */
  onRenderDateCell?: (ctx: DateCellContext) => void;
  /** Hook to customize event styling */
  onStyleEvent?: (event: CalendarEvent) => EventStyle;
}

/**
 * Internal resolved configuration with all defaults applied
 */
export interface ResolvedCalendarConfig {
  view: Required<ViewConfig>;
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
  onEventDrop?: (
    event: CalendarEvent,
    newStart: string,
    newEnd: string,
  ) => void;
  onViewChange?: (viewType: ViewType) => void;
  onDateChange?: (date: string) => void;
  onDateClick?: (date: string) => void;
  onDateDoubleClick?: (date: string) => void;
  onDateContextMenu?: (date: string, x: number, y: number) => void;
  onTimeSlotClick?: (dateTime: string) => void;
  onTimeSlotDoubleClick?: (dateTime: string) => void;
  onTimeSlotContextMenu?: (dateTime: string, x: number, y: number) => void;
  onDateRangeSelect?: (startDate: string, endDate: string) => void;
  onTimeRangeSelect?: (startDateTime: string, endDateTime: string) => void;
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
