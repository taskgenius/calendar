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
   * Calculate layout for events within a week
   * Handles multi-day events, event overlapping, and slot allocation
   *
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
    // Filter events that overlap with this week
    const weekEvents = events.filter((e) => {
      const eventStart = this.adapter.parse(e.start);
      const eventEnd = this.adapter.parse(e.end);

      return (
        !this.adapter.isBefore(eventEnd, weekStart) &&
        !this.adapter.isAfter(eventStart, weekEnd)
      );
    });

    // Calculate visual items with positioning
    const visualItems: Array<MonthLayoutItem & { sortKey: number }> =
      weekEvents.map((e) => {
        const eventStart = this.adapter.parse(e.start);
        const eventEnd = this.adapter.parse(e.end);

        // Clamp to week boundaries
        const displayStart = this.adapter.isBefore(eventStart, weekStart)
          ? weekStart
          : eventStart;
        const displayEnd = this.adapter.isAfter(eventEnd, weekEnd)
          ? weekEnd
          : eventEnd;

        // Normalize dates to day start (00:00:00) to avoid time-based truncation in diff
        // This ensures multi-day events span correctly across all calendar days
        const normalizedDisplayStart = this.adapter.startOf(
          displayStart,
          "day",
        );
        const normalizedDisplayEnd = this.adapter.startOf(displayEnd, "day");
        const normalizedWeekStart = this.adapter.startOf(weekStart, "day");

        let startIdx = this.adapter.diff(
          normalizedDisplayStart,
          normalizedWeekStart,
          "day",
        );
        let span =
          this.adapter.diff(
            normalizedDisplayEnd,
            normalizedDisplayStart,
            "day",
          ) + 1;

        // Adjust indices if weekends are hidden
        if (!this.showWeekends) {
          // Count non-weekend days between weekStart and displayStart
          let adjustedStartIdx = 0;
          let tempDate = weekStart;
          while (this.adapter.isBefore(tempDate, displayStart)) {
            const dayOfWeek = this.adapter.day(tempDate);
            if (dayOfWeek !== 0 && dayOfWeek !== 6) {
              adjustedStartIdx++;
            }
            tempDate = this.adapter.add(tempDate, 1, "day");
          }

          // Count non-weekend days in span
          let adjustedSpan = 0;
          tempDate = displayStart;
          const spanEnd = this.adapter.add(displayStart, span - 1, "day");
          while (
            this.adapter.isBefore(tempDate, spanEnd) ||
            this.adapter.isSame(tempDate, spanEnd, "day")
          ) {
            const dayOfWeek = this.adapter.day(tempDate);
            if (dayOfWeek !== 0 && dayOfWeek !== 6) {
              adjustedSpan++;
            }
            tempDate = this.adapter.add(tempDate, 1, "day");
          }

          startIdx = adjustedStartIdx;
          span = adjustedSpan;
        }

        return {
          event: e,
          startIdx,
          span,
          slot: 0, // Will be calculated below
          isStart: !this.adapter.isBefore(eventStart, weekStart),
          isEnd: !this.adapter.isAfter(eventEnd, weekEnd),
          // Sort key: start index first, then by span (longer events first)
          sortKey: startIdx * 1000 - span,
        };
      });

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
   * Get the number of weeks in a month grid
   *
   * @param currentDate - The current date
   * @returns Number of weeks (4-6)
   */
  getWeekCount(currentDate: T): number {
    return this.generateGrid(currentDate).length;
  }
}
