/**
 * Time view layout engine
 * Handles column generation and event layout calculation for week/day views
 */
import type {
  DateAdapter,
  CalendarEvent,
  TimeLayoutItem,
  TimeColumn,
  ViewType,
  DateFormatConfig,
  DayFilterContext,
  DayFilterResult,
  TimeFilterResult,
  TimeSlotConfig,
  AllDayLayoutItem,
} from "../types";

/**
 * Internal event representation with calculated geometry
 */
interface EventGeometry {
  event: CalendarEvent;
  top: number;
  height: number;
  startMin: number;
  endMin: number;
  colIndex: number;
  widthPercent: number;
  leftPercent: number;
}

/**
 * Engine for calculating time view (week/day) layouts
 */
export class TimeEngine<T> {
  private cellHeight: number;

  /**
   * @param adapter - Date adapter instance
   * @param cellHeight - Height of each hour cell in pixels (default: 60)
   * @param showWeekends - Whether to show weekend columns (default: true)
   * @param firstDayOfWeek - First day of week: 0 = Sunday, 1 = Monday (default: 0)
   * @param dateFormats - Date format configuration
   */
  constructor(
    private adapter: DateAdapter<T>,
    cellHeight: number = 60,
    private showWeekends: boolean = true,
    private firstDayOfWeek: number = 0,
    private dateFormats: Required<DateFormatConfig>,
  ) {
    this.cellHeight = cellHeight;
  }

  /**
   * Generate columns for time view
   * Returns 1 column for day view, up to 7 columns for week view
   *
   * @param currentDate - The current date
   * @param viewType - 'day' or 'week'
   * @param dayFilter - Optional filter function to control which days are included
   * @returns Array of TimeColumn objects for visible days
   */
  generateColumns(
    currentDate: T,
    viewType: ViewType,
    dayFilter?: (date: T, context: DayFilterContext) => DayFilterResult,
  ): Array<TimeColumn<T>> {
    const columns: Array<TimeColumn<T>> = [];
    const today = this.adapter.create();

    if (viewType === "day") {
      // Day view - always show single day (filter doesn't apply to single day view)
      columns.push({
        date: currentDate,
        dateStr: this.adapter.format(currentDate, this.dateFormats.date),
      });
    } else {
      // Week view - generate columns starting from configured first day of week
      let weekStart = this.adapter.startOf(currentDate, "week");

      // Adjust to firstDayOfWeek
      const currentDayOfWeek = this.adapter.day(weekStart);
      if (currentDayOfWeek !== this.firstDayOfWeek) {
        let diff = this.firstDayOfWeek - currentDayOfWeek;
        if (diff > 0) {
          // firstDayOfWeek is later in the week, move forward
          weekStart = this.adapter.add(weekStart, diff, "day");
        } else {
          // firstDayOfWeek is earlier, move backward
          weekStart = this.adapter.add(weekStart, diff, "day");
        }
      }

      let curr = weekStart;
      for (let i = 0; i < 7; i++) {
        const dayOfWeek = this.adapter.day(curr);
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday

        // Build filter context
        const context: DayFilterContext = {
          isWeekend,
          dayOfWeek,
          isToday: this.adapter.isSame(curr, today, "day"),
          isThisMonth: this.adapter.isSame(curr, currentDate, "month"),
        };

        // Determine if this day should be included
        let shouldInclude = true;
        if (dayFilter) {
          // Use dayFilter if provided (takes precedence)
          const result = dayFilter(curr, context);
          shouldInclude = typeof result === "boolean" ? result : result.visible;
        } else if (!this.showWeekends && isWeekend) {
          // Fallback to showWeekends for backward compatibility
          shouldInclude = false;
        }

        if (shouldInclude) {
          columns.push({
            date: curr,
            dateStr: this.adapter.format(curr, this.dateFormats.date),
          });
        }

        curr = this.adapter.add(curr, 1, "day");
      }
    }

    return columns;
  }

  /**
   * Generate time slots for time axis
   * Returns time slots (hours) that should be displayed
   *
   * @param timeFilter - Optional filter function to control which hours are displayed
   * @returns Array of objects with hour and optional config
   */
  generateTimeSlots(
    timeFilter?: (hour: number) => TimeFilterResult,
  ): Array<{ hour: number; config?: TimeSlotConfig }> {
    const slots: Array<{ hour: number; config?: TimeSlotConfig }> = [];

    for (let hour = 0; hour < 24; hour++) {
      if (!timeFilter) {
        // No filter - include all hours
        slots.push({ hour });
        continue;
      }

      const result = timeFilter(hour);
      if (typeof result === "boolean") {
        // Simple boolean return
        if (result) {
          slots.push({ hour });
        }
      } else {
        // Advanced config return
        if (result.visible) {
          slots.push({ hour, config: result });
        }
      }
    }

    return slots;
  }

  /**
   * Calculate layout for events on a specific day
   * Handles overlapping events using a column packing algorithm
   *
   * @param events - All calendar events
   * @param dateStr - Target date string (YYYY-MM-DD)
   * @returns Array of TimeLayoutItem with positioning information
   */
  calculateLayout(events: CalendarEvent[], dateStr: string): TimeLayoutItem[] {
    // Step 1: Filter and calculate geometry for single-day events on this date
    const dayEvents = this.filterAndCalculateGeometry(events, dateStr);

    if (dayEvents.length === 0) {
      return [];
    }

    // Step 2: Sort by start time, then by duration (longer first)
    dayEvents.sort((a, b) => a.startMin - b.startMin || b.endMin - a.endMin);

    // Step 3: Group overlapping events into clusters
    const groups = this.groupOverlappingEvents(dayEvents);

    // Step 4: Calculate column positions within each group
    for (const group of groups) {
      this.calculateColumnPositions(group);
    }

    // Step 5: Convert to TimeLayoutItem
    return dayEvents.map((ev) => ({
      event: ev.event,
      top: ev.top,
      height: ev.height,
      leftPercent: ev.leftPercent,
      widthPercent: ev.widthPercent,
      colIndex: ev.colIndex,
      startMin: ev.startMin,
      endMin: ev.endMin,
    }));
  }

  /**
   * Check if an event is a single-day event (starts and ends on same day)
   *
   * @param event - Calendar event
   * @returns true if event is single-day
   */
  isSingleDayEvent(event: CalendarEvent): boolean {
    const start = this.adapter.parse(event.start);
    const end = this.adapter.parse(event.end);
    return this.adapter.isSame(start, end, "day");
  }

  /**
   * Check if an event is an all-day event
   * An event is considered all-day if:
   * - Start and end times are both 00:00 (same day or next day)
   * - Duration covers the entire day (00:00 to 23:59 or similar)
   *
   * @param event - Calendar event
   * @returns true if event is all-day
   */
  isAllDayEvent(event: CalendarEvent): boolean {
    const start = this.adapter.parse(event.start);
    const end = this.adapter.parse(event.end);

    const startHour = this.adapter.hour(start);
    const startMinute = this.adapter.minute(start);
    const endHour = this.adapter.hour(end);
    const endMinute = this.adapter.minute(end);

    // Case 1: Both start and end are 00:00 (common pattern for all-day events)
    if (
      startHour === 0 &&
      startMinute === 0 &&
      endHour === 0 &&
      endMinute === 0
    ) {
      return true;
    }

    // Case 2: Starts at 00:00 and ends at 23:59 (or close to midnight)
    if (
      startHour === 0 &&
      startMinute === 0 &&
      endHour === 23 &&
      endMinute >= 59
    ) {
      return true;
    }

    return false;
  }

  /**
   * Calculate layout for all-day events across visible columns
   * Handles multi-day spanning events with segmentation support
   *
   * When events span across non-visible (filtered) columns, they are split into
   * multiple segments. Each segment represents a contiguous visible portion.
   *
   * @param allDayEvents - Array of all-day events
   * @param columns - Array of visible columns (from generateColumns)
   * @returns Array of AllDayLayoutItem with positioning information (may include segmented events)
   */
  calculateAllDayLayout(
    allDayEvents: CalendarEvent[],
    columns: Array<TimeColumn<T>>,
  ): AllDayLayoutItem[] {
    if (columns.length === 0 || allDayEvents.length === 0) {
      return [];
    }

    const firstColDate = columns[0]!.date;
    const lastColDate = columns[columns.length - 1]!.date;

    // Filter events that overlap with the visible columns range
    const rangeEvents = allDayEvents.filter((event) => {
      const eventStart = this.adapter.startOf(
        this.adapter.parse(event.start),
        "day",
      );
      const eventEnd = this.adapter.startOf(
        this.adapter.parse(event.end),
        "day",
      );

      return (
        !this.adapter.isAfter(eventStart, lastColDate, "day") &&
        !this.adapter.isBefore(eventEnd, firstColDate, "day")
      );
    });

    // Calculate segments for each event
    const visualItems: Array<AllDayLayoutItem & { sortKey: number }> = [];

    for (const event of rangeEvents) {
      const eventStart = this.adapter.startOf(
        this.adapter.parse(event.start),
        "day",
      );
      const eventEnd = this.adapter.startOf(
        this.adapter.parse(event.end),
        "day",
      );

      // Find all visible columns that this event covers
      const coveredColumns: Array<{
        colIndex: number;
        date: T;
        dateStr: string;
      }> = [];

      for (let i = 0; i < columns.length; i++) {
        const col = columns[i]!;
        if (
          !this.adapter.isBefore(col.date, eventStart, "day") &&
          !this.adapter.isAfter(col.date, eventEnd, "day")
        ) {
          coveredColumns.push({
            colIndex: i,
            date: col.date,
            dateStr: col.dateStr,
          });
        }
      }

      if (coveredColumns.length === 0) {
        continue; // Event doesn't cover any visible columns
      }

      // Group consecutive covered columns into segments
      // IMPORTANT: Consecutive means actual calendar dates differ by exactly 1 day,
      // NOT column indices. This ensures events are split when hidden days create gaps.
      const segments: Array<{
        startIdx: number;
        span: number;
        isEventStart: boolean;
        isEventEnd: boolean;
      }> = [];

      let segmentStart = coveredColumns[0]!;
      let prevCol = segmentStart;
      let segmentSpan = 1;

      for (let i = 1; i < coveredColumns.length; i++) {
        const current = coveredColumns[i]!;

        // Check if this column is consecutive in actual calendar (differs by exactly 1 day)
        const nextExpectedDate = this.adapter.add(prevCol.date, 1, "day");
        const isConsecutive = this.adapter.isSame(
          current.date,
          nextExpectedDate,
          "day",
        );

        if (isConsecutive) {
          segmentSpan++;
          prevCol = current;
        } else {
          // Non-consecutive: save current segment and start a new one
          const isEventStart = this.adapter.isSame(
            segmentStart.date,
            eventStart,
            "day",
          );
          const isEventEnd = this.adapter.isSame(prevCol.date, eventEnd, "day");

          segments.push({
            startIdx: segmentStart.colIndex,
            span: segmentSpan,
            isEventStart,
            isEventEnd,
          });

          // Start new segment
          segmentStart = current;
          prevCol = current;
          segmentSpan = 1;
        }
      }

      // Don't forget the last segment
      const isEventStartFinal = this.adapter.isSame(
        segmentStart.date,
        eventStart,
        "day",
      );
      const isEventEndFinal = this.adapter.isSame(
        prevCol.date,
        eventEnd,
        "day",
      );

      segments.push({
        startIdx: segmentStart.colIndex,
        span: segmentSpan,
        isEventStart: isEventStartFinal,
        isEventEnd: isEventEndFinal,
      });

      // Create layout items for each segment
      const totalSegments = segments.length;
      segments.forEach((seg, idx) => {
        const item: AllDayLayoutItem & { sortKey: number } = {
          event,
          startIdx: seg.startIdx,
          span: seg.span,
          slot: 0, // Will be calculated below
          isStart: seg.isEventStart,
          isEnd: seg.isEventEnd,
          sortKey: seg.startIdx * 1000 - seg.span,
          // Add segmentation info only if event was split
          ...(totalSegments > 1 ? { segmentIndex: idx, totalSegments } : {}),
        };
        visualItems.push(item);
      });
    }

    // Sort by start index, then by span (descending)
    visualItems.sort((a, b) => a.sortKey - b.sortKey);

    // Allocate vertical slots to prevent overlap (same as MonthEngine)
    const slots: number[] = [];

    for (const item of visualItems) {
      let slotIdx = 0;

      // Find first available slot
      while (true) {
        const slotEnd = slots[slotIdx];
        if (slotEnd === undefined || slotEnd < item.startIdx) {
          slots[slotIdx] = item.startIdx + item.span - 1;
          item.slot = slotIdx;
          break;
        }
        slotIdx++;
      }
    }

    // Remove sortKey from result
    return visualItems.map(({ sortKey: _sortKey, ...item }) => item);
  }

  /**
   * Update cell height
   *
   * @param height - New cell height in pixels
   */
  setCellHeight(height: number): void {
    this.cellHeight = height;
  }

  /**
   * Get current cell height
   */
  getCellHeight(): number {
    return this.cellHeight;
  }

  // ==========================================================================
  // Private Methods
  // ==========================================================================

  /**
   * Filter events for a specific date and calculate their geometry
   */
  private filterAndCalculateGeometry(
    events: CalendarEvent[],
    dateStr: string,
  ): EventGeometry[] {
    const result: EventGeometry[] = [];

    for (const event of events) {
      const start = this.adapter.parse(event.start);
      const startDateStr = this.adapter.format(start, this.dateFormats.date);

      // Only include single-day events on this date
      if (startDateStr !== dateStr || !this.isSingleDayEvent(event)) {
        continue;
      }

      const end = this.adapter.parse(event.end);
      const startMin =
        this.adapter.hour(start) * 60 + this.adapter.minute(start);
      const duration = this.adapter.diff(end, start, "minute");
      const endMin = startMin + duration;

      const pixelsPerMinute = this.cellHeight / 60;
      const top = startMin * pixelsPerMinute;
      const height = Math.max(20, duration * pixelsPerMinute); // Minimum height of 20px

      result.push({
        event,
        top,
        height,
        startMin,
        endMin,
        colIndex: 0,
        widthPercent: 100,
        leftPercent: 0,
      });
    }

    return result;
  }

  /**
   * Group events that overlap into clusters
   * Events in the same cluster need to share horizontal space
   */
  private groupOverlappingEvents(events: EventGeometry[]): EventGeometry[][] {
    if (events.length === 0) {
      return [];
    }

    const groups: EventGeometry[][] = [];
    let currentGroup: EventGeometry[] = [events[0]!];
    let groupEnd = events[0]!.endMin;

    for (let i = 1; i < events.length; i++) {
      const ev = events[i]!;

      // If event starts before current group ends, it overlaps
      if (ev.startMin < groupEnd) {
        currentGroup.push(ev);
        groupEnd = Math.max(groupEnd, ev.endMin);
      } else {
        // No overlap - save current group and start new one
        groups.push(currentGroup);
        currentGroup = [ev];
        groupEnd = ev.endMin;
      }
    }

    // Don't forget the last group
    groups.push(currentGroup);

    return groups;
  }

  /**
   * Calculate column positions for events within a group
   * Uses a greedy column packing algorithm
   */
  private calculateColumnPositions(group: EventGeometry[]): void {
    // Track the end time of each column
    const columns: number[] = [];

    for (const ev of group) {
      let placed = false;

      // Try to fit in an existing column
      for (let i = 0; i < columns.length; i++) {
        if (columns[i]! <= ev.startMin) {
          columns[i] = ev.endMin;
          ev.colIndex = i;
          placed = true;
          break;
        }
      }

      // If no column available, create new one
      if (!placed) {
        columns.push(ev.endMin);
        ev.colIndex = columns.length - 1;
      }
    }

    // Apply width and left offset based on number of columns
    const numCols = columns.length;
    for (const ev of group) {
      ev.widthPercent = 100 / numCols;
      ev.leftPercent = ev.colIndex * ev.widthPercent;
    }
  }
}
