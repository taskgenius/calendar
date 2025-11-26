/**
 * Month view layout engine
 * Handles grid generation and event layout calculation for month view
 */
import type {
  DateAdapter,
  CalendarEvent,
  MonthLayoutItem,
  GridCell,
  DateFormatConfig,
  VisibleDay,
} from "../types";
import type { DayFilterContext, DayFilterResult } from "../types";

/**
 * Engine for calculating month view layouts
 */
export class MonthEngine<T> {
  constructor(
    private adapter: DateAdapter<T>,
    private firstDayOfWeek: number = 0,
    private showWeekends: boolean = true,
    private dateFormats: Required<DateFormatConfig>,
  ) {}

  /**
   * Generate the grid of days for a month view
   * Returns a 2D array of weeks, each containing 7 days
   * Includes days from previous/next months to fill complete weeks
   *
   * @param currentDate - The current date to generate grid for
   * @param dayFilter - Optional filter function to control which days are included
   * @returns Array of weeks, each containing GridCell objects for visible days
   */
  generateGrid(
    currentDate: T,
    dayFilter?: (date: T, context: DayFilterContext) => DayFilterResult,
  ): Array<Array<GridCell<T>>> {
    // Get month boundaries
    const monthStart = this.adapter.startOf(currentDate, "month");
    const monthEnd = this.adapter.endOf(currentDate, "month");
    const today = this.adapter.create();

    // Adjust start to first day of week
    let start = this.adapter.startOf(monthStart, "week");

    // Adjust start based on firstDayOfWeek configuration
    const currentDayOfWeek = this.adapter.day(start);
    if (currentDayOfWeek !== this.firstDayOfWeek) {
      let diff = this.firstDayOfWeek - currentDayOfWeek;
      // Ensure we go backward to the correct start of week
      if (diff > 0) {
        diff = diff - 7; // Go to previous week
      }
      start = this.adapter.add(start, diff, "day");
    }

    // Calculate end to ensure we cover the entire month
    let end = this.adapter.endOf(monthEnd, "week");

    // Adjust end based on firstDayOfWeek
    const endDayOfWeek = this.adapter.day(end);
    const expectedEndDay = (this.firstDayOfWeek + 6) % 7;
    if (endDayOfWeek !== expectedEndDay) {
      const diff = (expectedEndDay - endDayOfWeek + 7) % 7;
      if (diff > 0) {
        end = this.adapter.add(end, diff, "day");
      }
    }

    const weeks: Array<Array<GridCell<T>>> = [];
    let curr = start;

    while (
      this.adapter.isBefore(curr, end) ||
      this.adapter.isSame(curr, end, "day")
    ) {
      const days: Array<GridCell<T>> = [];

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
          days.push({
            date: curr,
            dateStr: this.adapter.format(curr, this.dateFormats.date),
          });
        }

        curr = this.adapter.add(curr, 1, "day");
      }

      // Only add week if it has days (could be empty if all days filtered)
      if (days.length > 0) {
        weeks.push(days);
      }
    }

    return weeks;
  }

  /**
   * Calculate layout for events within visible days
   * Handles multi-day events, event overlapping, slot allocation, and event segmentation
   *
   * When events span across filtered (hidden) days, they are split into multiple segments.
   * Each segment represents a contiguous visible portion of the event.
   *
   * @param events - All calendar events
   * @param visibleDays - Array of visible days with their column indices
   * @returns Array of MonthLayoutItem with positioning information (may include segmented events)
   */
  calculateLayoutWithVisibleDays(
    events: CalendarEvent[],
    visibleDays: VisibleDay<T>[],
  ): MonthLayoutItem[] {
    if (visibleDays.length === 0) {
      return [];
    }

    const firstVisibleDate = visibleDays[0]!.date;
    const lastVisibleDate = visibleDays[visibleDays.length - 1]!.date;

    // Filter events that overlap with the visible date range
    const rangeEvents = events.filter((e) => {
      const eventStart = this.adapter.startOf(
        this.adapter.parse(e.start),
        "day",
      );
      const eventEnd = this.adapter.startOf(this.adapter.parse(e.end), "day");

      return (
        !this.adapter.isAfter(eventStart, lastVisibleDate, "day") &&
        !this.adapter.isBefore(eventEnd, firstVisibleDate, "day")
      );
    });

    // Calculate segments for each event
    const visualItems: Array<MonthLayoutItem & { sortKey: number }> = [];

    for (const event of rangeEvents) {
      const eventStart = this.adapter.startOf(
        this.adapter.parse(event.start),
        "day",
      );
      const eventEnd = this.adapter.startOf(
        this.adapter.parse(event.end),
        "day",
      );

      // Find all visible days that this event covers
      // Exclude disabled days (events should not be displayed on disabled days)
      const coveredDays: Array<{ colIndex: number; date: T; dateStr: string }> =
        [];

      for (const day of visibleDays) {
        // Skip disabled days - events should not appear on them
        if (day.disabled) {
          continue;
        }

        if (
          !this.adapter.isBefore(day.date, eventStart, "day") &&
          !this.adapter.isAfter(day.date, eventEnd, "day")
        ) {
          coveredDays.push({
            colIndex: day.colIndex,
            date: day.date,
            dateStr: day.dateStr,
          });
        }
      }

      if (coveredDays.length === 0) {
        continue; // Event doesn't cover any visible days
      }

      // Group consecutive covered days into segments
      // IMPORTANT: Consecutive means actual calendar dates differ by exactly 1 day,
      // NOT column indices. This ensures events are split when hidden days create gaps.
      const segments: Array<{
        startIdx: number;
        span: number;
        isEventStart: boolean;
        isEventEnd: boolean;
      }> = [];

      let segmentStart = coveredDays[0]!;
      let prevDay = segmentStart;
      let segmentSpan = 1;

      for (let i = 1; i < coveredDays.length; i++) {
        const current = coveredDays[i]!;

        // Check if this day is consecutive in actual calendar (differs by exactly 1 day)
        const nextExpectedDate = this.adapter.add(prevDay.date, 1, "day");
        const isConsecutive = this.adapter.isSame(
          current.date,
          nextExpectedDate,
          "day",
        );

        if (isConsecutive) {
          segmentSpan++;
          prevDay = current;
        } else {
          // Non-consecutive: save current segment and start a new one
          const isEventStart = this.adapter.isSame(
            segmentStart.date,
            eventStart,
            "day",
          );
          const isEventEnd = this.adapter.isSame(prevDay.date, eventEnd, "day");

          segments.push({
            startIdx: segmentStart.colIndex,
            span: segmentSpan,
            isEventStart,
            isEventEnd,
          });

          // Start new segment
          segmentStart = current;
          prevDay = current;
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
        prevDay.date,
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
        const item: MonthLayoutItem & { sortKey: number } = {
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

    // Allocate vertical slots to prevent overlap
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
   * Calculate layout for events within a week (legacy API for backward compatibility)
   * Handles multi-day events, event overlapping, and slot allocation
   *
   * @deprecated Use calculateLayoutWithVisibleDays for proper dayFilter support
   * @param events - All calendar events
   * @param weekStart - Start date of the week
   * @param weekEnd - End date of the week
   * @returns Array of MonthLayoutItem with positioning information
   */
  calculateLayout(
    events: CalendarEvent[],
    weekStart: T,
    weekEnd: T,
  ): MonthLayoutItem[] {
    // Build visible days array from weekStart to weekEnd
    const visibleDays: VisibleDay<T>[] = [];
    let curr = weekStart;
    let colIndex = 0;

    while (
      this.adapter.isBefore(curr, weekEnd, "day") ||
      this.adapter.isSame(curr, weekEnd, "day")
    ) {
      const dayOfWeek = this.adapter.day(curr);
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      // Apply showWeekends filter
      if (this.showWeekends || !isWeekend) {
        visibleDays.push({
          date: curr,
          dateStr: this.adapter.format(curr, this.dateFormats.date),
          colIndex,
        });
        colIndex++;
      }

      curr = this.adapter.add(curr, 1, "day");
    }

    return this.calculateLayoutWithVisibleDays(events, visibleDays);
  }

  /**
   * Get the number of weeks in a month grid
   *
   * @param currentDate - The current date
   * @returns Number of weeks (4-6)
   */
  getWeekCount(currentDate: T): number {
    return this.generateGrid(currentDate).length;
  }
}
