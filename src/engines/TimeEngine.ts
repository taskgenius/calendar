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
  /** Whether this segment is the start of the original event */
  isStart: boolean;
  /** Whether this segment is the end of the original event */
  isEnd: boolean;
  /** Segment index for cross-midnight events (0-based) */
  segmentIndex?: number;
  /** Total segments for cross-midnight events */
  totalSegments?: number;
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
   * Supports both single-day events and cross-midnight event segments
   *
   * @param events - All calendar events
   * @param dateStr - Target date string (YYYY-MM-DD)
   * @returns Array of TimeLayoutItem with positioning information
   */
  calculateLayout(events: CalendarEvent[], dateStr: string): TimeLayoutItem[] {
    // Step 1: Filter and calculate geometry for events on this date
    // Now includes cross-midnight events that span this day
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

    // Step 5: Convert to TimeLayoutItem with segment info
    return dayEvents.map((ev) => {
      const item: TimeLayoutItem = {
        event: ev.event,
        top: ev.top,
        height: ev.height,
        leftPercent: ev.leftPercent,
        widthPercent: ev.widthPercent,
        colIndex: ev.colIndex,
        startMin: ev.startMin,
        endMin: ev.endMin,
        isStart: ev.isStart,
        isEnd: ev.isEnd,
      };

      // Add segment info only for cross-midnight events
      if (ev.segmentIndex !== undefined && ev.totalSegments !== undefined) {
        item.segmentIndex = ev.segmentIndex;
        item.totalSegments = ev.totalSegments;
      }

      return item;
    });
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
   * Check if a timed event crosses midnight (spans multiple days but is not all-day)
   * These events need special handling in time view to show on each day they span.
   *
   * @param event - Calendar event
   * @returns true if event crosses midnight and is not an all-day event
   */
  isCrossMidnightEvent(event: CalendarEvent): boolean {
    // All-day events are handled separately
    if (this.isAllDayEvent(event)) {
      return false;
    }
    return !this.isSingleDayEvent(event);
  }

  /**
   * Get the number of days an event spans
   *
   * @param event - Calendar event
   * @returns Number of days (1 for single-day events)
   */
  getEventDaySpan(event: CalendarEvent): number {
    const start = this.adapter.startOf(this.adapter.parse(event.start), "day");
    const end = this.adapter.startOf(this.adapter.parse(event.end), "day");
    return this.adapter.diff(end, start, "day") + 1;
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
   * Supports both single-day events and cross-midnight events
   *
   * For cross-midnight events:
   * - First day: shows from event start time to 23:59 (1440 minutes)
   * - Middle days: shows full day (00:00 to 23:59)
   * - Last day: shows from 00:00 to event end time
   */
  private filterAndCalculateGeometry(
    events: CalendarEvent[],
    dateStr: string,
  ): EventGeometry[] {
    const result: EventGeometry[] = [];
    const targetDate = this.adapter.parse(dateStr);
    const targetDayStart = this.adapter.startOf(targetDate, "day");

    for (const event of events) {
      // Skip all-day events (handled by calculateAllDayLayout)
      if (this.isAllDayEvent(event)) {
        continue;
      }

      const eventStart = this.adapter.parse(event.start);
      const eventEnd = this.adapter.parse(event.end);
      const eventStartDay = this.adapter.startOf(eventStart, "day");
      const eventEndDay = this.adapter.startOf(eventEnd, "day");

      // Check if this event touches the target date
      const isOnTargetDate =
        !this.adapter.isBefore(targetDayStart, eventStartDay, "day") &&
        !this.adapter.isAfter(targetDayStart, eventEndDay, "day");

      if (!isOnTargetDate) {
        continue;
      }

      // Calculate segment info for cross-midnight events
      const isStart = this.adapter.isSame(targetDayStart, eventStartDay, "day");
      const isEnd = this.adapter.isSame(targetDayStart, eventEndDay, "day");
      const totalDays =
        this.adapter.diff(eventEndDay, eventStartDay, "day") + 1;
      const segmentIndex = this.adapter.diff(
        targetDayStart,
        eventStartDay,
        "day",
      );

      // Calculate start/end minutes for this day's segment
      let startMin: number;
      let endMin: number;

      if (isStart && isEnd) {
        // Single-day event: use actual times
        startMin =
          this.adapter.hour(eventStart) * 60 + this.adapter.minute(eventStart);
        endMin =
          this.adapter.hour(eventEnd) * 60 + this.adapter.minute(eventEnd);
      } else if (isStart) {
        // First day of multi-day: event start to end of day
        startMin =
          this.adapter.hour(eventStart) * 60 + this.adapter.minute(eventStart);
        endMin = 24 * 60; // End of day (1440 minutes)
      } else if (isEnd) {
        // Last day of multi-day: start of day to event end
        startMin = 0;
        endMin =
          this.adapter.hour(eventEnd) * 60 + this.adapter.minute(eventEnd);
      } else {
        // Middle day: full day
        startMin = 0;
        endMin = 24 * 60;
      }

      // Skip if segment has no duration (e.g., ends exactly at midnight)
      if (endMin <= startMin) {
        continue;
      }

      const pixelsPerMinute = this.cellHeight / 60;
      const top = startMin * pixelsPerMinute;
      const duration = endMin - startMin;
      const height = Math.max(20, duration * pixelsPerMinute);

      const geometry: EventGeometry = {
        event,
        top,
        height,
        startMin,
        endMin,
        colIndex: 0,
        widthPercent: 100,
        leftPercent: 0,
        isStart,
        isEnd,
      };

      // Add segment info only for multi-day events
      if (totalDays > 1) {
        geometry.segmentIndex = segmentIndex;
        geometry.totalSegments = totalDays;
      }

      result.push(geometry);
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
   * Uses a greedy column packing algorithm with smart expansion
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

    const numCols = columns.length;

    if (numCols === 1) {
      // Single event - full width
      for (const ev of group) {
        ev.widthPercent = 100;
        ev.leftPercent = 0;
      }
      return;
    }

    const offsetPerCol = 100 / numCols;

    // Width multiplier determines how much each event extends into neighbor space
    // Adjust based on column count for better visual balance
    const widthMultiplier = numCols <= 3 ? 1.6 : numCols <= 5 ? 1.5 : 1.4;

    for (const ev of group) {
      const leftOffset = ev.colIndex * offsetPerCol;

      // Check for available space to the right (expansion)
      // Find how many subsequent columns are free during this event's time
      let span = 1;
      for (let c = ev.colIndex + 1; c < numCols; c++) {
        // Check collision with any event in column 'c'
        const hasCollision = group.some(
          (other) =>
            other.colIndex === c &&
            other.startMin < ev.endMin &&
            other.endMin > ev.startMin,
        );

        if (hasCollision) {
          break;
        }
        span++;
      }

      // Calculate width with expansion
      // Base width (overlapping) + spanned columns
      const expandedWidth = offsetPerCol * (span - 1 + widthMultiplier);
      const maxWidth = 100 - leftOffset;

      ev.leftPercent = leftOffset;
      ev.widthPercent = Math.min(expandedWidth, maxWidth);

      // If expanded to the last column, ensure it hits the edge exactly
      if (ev.colIndex + span === numCols) {
        ev.widthPercent = maxWidth;
      }
    }
  }
}
