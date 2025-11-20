/**
 * Month view layout engine
 * Handles grid generation and event layout calculation for month view
 */
import type { DateAdapter, CalendarEvent, MonthLayoutItem, GridCell } from '../types';

/**
 * Engine for calculating month view layouts
 */
export class MonthEngine<T> {
  constructor(private adapter: DateAdapter<T>) {}

  /**
   * Generate the grid of days for a month view
   * Returns a 2D array of weeks, each containing 7 days
   * Includes days from previous/next months to fill complete weeks
   *
   * @param currentDate - The current date to generate grid for
   * @returns Array of weeks, each containing 7 GridCell objects
   */
  generateGrid(currentDate: T): Array<Array<GridCell<T>>> {
    const start = this.adapter.startOf(
      this.adapter.startOf(currentDate, 'month'),
      'week'
    );
    const end = this.adapter.endOf(
      this.adapter.endOf(currentDate, 'month'),
      'week'
    );

    const weeks: Array<Array<GridCell<T>>> = [];
    let curr = start;

    while (this.adapter.isBefore(curr, end) || this.adapter.isSame(curr, end, 'day')) {
      const days: Array<GridCell<T>> = [];

      for (let i = 0; i < 7; i++) {
        days.push({
          date: curr,
          dateStr: this.adapter.format(curr, 'YYYY-MM-DD')
        });
        curr = this.adapter.add(curr, 1, 'day');
      }

      weeks.push(days);
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
    weekEnd: T
  ): MonthLayoutItem[] {
    // Filter events that overlap with this week
    const weekEvents = events.filter(e => {
      const eventStart = this.adapter.parse(e.start);
      const eventEnd = this.adapter.parse(e.end);

      return !this.adapter.isBefore(eventEnd, weekStart) &&
             !this.adapter.isAfter(eventStart, weekEnd);
    });

    // Calculate visual items with positioning
    const visualItems: Array<MonthLayoutItem & { sortKey: number }> = weekEvents.map(e => {
      const eventStart = this.adapter.parse(e.start);
      const eventEnd = this.adapter.parse(e.end);

      // Clamp to week boundaries
      const displayStart = this.adapter.isBefore(eventStart, weekStart)
        ? weekStart
        : eventStart;
      const displayEnd = this.adapter.isAfter(eventEnd, weekEnd)
        ? weekEnd
        : eventEnd;

      const startIdx = this.adapter.diff(displayStart, weekStart, 'day');
      const span = this.adapter.diff(displayEnd, displayStart, 'day') + 1;

      return {
        event: e,
        startIdx,
        span,
        slot: 0, // Will be calculated below
        isStart: !this.adapter.isBefore(eventStart, weekStart),
        isEnd: !this.adapter.isAfter(eventEnd, weekEnd),
        // Sort key: start index first, then by span (longer events first)
        sortKey: startIdx * 1000 - span
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
