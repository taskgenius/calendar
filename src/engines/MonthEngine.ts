/**
 * Month view layout engine
 * Handles grid generation and event layout calculation for month view
 */
import type {
  DateAdapter,
  CalendarEvent,
  MonthLayoutItem,
  GridCell,
} from "../types";

/**
 * Engine for calculating month view layouts
 */
export class MonthEngine<T> {
  constructor(
    private adapter: DateAdapter<T>,
    private firstDayOfWeek: number = 0,
    private showWeekends: boolean = true,
  ) {}

  /**
   * Generate the grid of days for a month view
   * Returns a 2D array of weeks, each containing 7 days
   * Includes days from previous/next months to fill complete weeks
   *
   * @param currentDate - The current date to generate grid for
   * @returns Array of weeks, each containing 7 GridCell objects
   */
  generateGrid(currentDate: T): Array<Array<GridCell<T>>> {
    // Get month boundaries
    const monthStart = this.adapter.startOf(currentDate, "month");
    const monthEnd = this.adapter.endOf(currentDate, "month");

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

        // Only add if weekends are shown or it's not a weekend
        if (this.showWeekends || !isWeekend) {
          days.push({
            date: curr,
            dateStr: this.adapter.format(curr, "YYYY-MM-DD"),
          });
        }

        curr = this.adapter.add(curr, 1, "day");
      }

      // Only add week if it has days (could be empty if all weekends filtered)
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

        let startIdx = this.adapter.diff(displayStart, weekStart, "day");
        let span = this.adapter.diff(displayEnd, displayStart, "day") + 1;

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
