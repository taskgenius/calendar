/**
 * Custom View Examples for @taskgenius/calendar
 *
 * This file demonstrates how to create custom calendar views by extending
 * the built-in view classes and using the ViewRegistry system.
 *
 * Examples included:
 * 1. ThreeDayWorkWeekView - A week view showing only Mon/Wed/Fri
 * 2. HalfMonthView - A month view showing only the first 15 days (others blank)
 * 3. TwoDayWeekendView - A week view showing only Sat/Sun
 * 4. WorkDaysView - A week view showing only Mon-Fri
 * 5. SecondHalfMonthView - A month view showing days 16-31 (others blank)
 */

import {
  TimeView,
  MonthView,
  type ViewMeta,
  type CalendarEvent,
  type ViewRenderOptions,
  type DayFilterContext,
  type DayFilterResult,
  type DayRenderConfig,
} from "../../../src";

// =============================================================================
// Custom View 1: Three-Day Work Week View (Mon/Wed/Fri)
// =============================================================================

/**
 * ThreeDayWorkWeekView - Shows only Monday, Wednesday, and Friday
 *
 * This demonstrates how to create a custom time-based view that
 * filters specific days of the week using the dayFilter mechanism.
 */
export class ThreeDayWorkWeekView<T = unknown> extends TimeView<T> {
  static override meta: ViewMeta = {
    type: "three-day-work",
    label: "3-Day Work",
    shortLabel: "3D",
    order: 100,
  };

  /**
   * Override render to inject our custom day filter
   */
  override render(
    container: HTMLElement,
    events: CalendarEvent[],
    options?: ViewRenderOptions,
  ): void {
    // Store original filter
    const originalFilter = this.context.config.view.dayFilter;

    // Temporarily override with our custom filter
    (this.context.config.view as any).dayFilter = (
      _date: T,
      ctx: DayFilterContext,
    ): DayFilterResult => {
      // Only show Monday (1), Wednesday (3), Friday (5)
      const allowedDays = [1, 3, 5];
      const baseResult = allowedDays.includes(ctx.dayOfWeek);

      // If there's an original filter, combine with it
      if (originalFilter) {
        const origResult = originalFilter(_date, ctx);
        const origVisible =
          typeof origResult === "boolean" ? origResult : origResult.visible;
        return baseResult && origVisible;
      }

      return baseResult;
    };

    // Call parent render
    super.render(container, events, options);

    // Restore original filter
    (this.context.config.view as any).dayFilter = originalFilter;
  }

  override getNavigationUnit(): "week" {
    return "week";
  }

  override getHeaderTitle(): string {
    return `${this.context.adapter.format(
      this.context.currentDate,
      this.context.config.dateFormats.monthHeader,
    )} (Mon/Wed/Fri)`;
  }
}

// =============================================================================
// Custom View 2: Half Month View (Days 1-15) - Empty cells for other days
// =============================================================================

/**
 * HalfMonthView - Shows only the first 15 days of a month
 *
 * Days 16-31 are rendered as empty placeholder cells (no date number, no events)
 * to preserve the grid structure.
 */
export class HalfMonthView<T = unknown> extends MonthView<T> {
  static override meta: ViewMeta = {
    type: "half-month",
    label: "Half Month",
    shortLabel: "H",
    order: 110,
  };

  /**
   * Override render to inject custom day filter and render hook
   */
  override render(
    container: HTMLElement,
    events: CalendarEvent[],
    options?: ViewRenderOptions,
  ): void {
    // Store originals
    const originalFilter = this.context.config.view.dayFilter;
    const originalRenderHook = this.context.config.onRenderDateCell;

    // Set up day filter to mark non-target days
    (this.context.config.view as any).dayFilter = (
      date: T,
      ctx: DayFilterContext,
    ): DayFilterResult => {
      const dayOfMonth = this.context.adapter.date(date);
      const isFirstHalf = dayOfMonth <= 15;

      // Apply original filter logic if exists
      if (originalFilter) {
        const origResult = originalFilter(date, ctx);
        if (typeof origResult === "boolean") {
          if (!origResult) return false;
        } else if (!origResult.visible) {
          return origResult;
        }
      }

      // Return config - all visible, but mark inactive cells
      const config: DayRenderConfig = {
        visible: true,
        className: isFirstHalf ? "half-month-active" : "half-month-blank",
        disabled: !isFirstHalf,
      };

      return config;
    };

    // Set up render hook to clear content of blank cells
    (this.context.config as any).onRenderDateCell = (ctx: {
      date: Date;
      cellEl: HTMLElement;
    }) => {
      const dayOfMonth = ctx.date.getDate();
      if (dayOfMonth > 15) {
        // Clear all content from the cell
        ctx.cellEl.innerHTML = "";
        ctx.cellEl.classList.add("half-month-blank");
      }

      // Call original hook if exists
      if (originalRenderHook) {
        originalRenderHook(ctx as any);
      }
    };

    // Call parent render
    super.render(container, events, options);

    // Restore originals
    (this.context.config.view as any).dayFilter = originalFilter;
    (this.context.config as any).onRenderDateCell = originalRenderHook;
  }

  override getHeaderTitle(): string {
    return `${this.context.adapter.format(
      this.context.currentDate,
      this.context.config.dateFormats.monthHeader,
    )} (Days 1-15)`;
  }
}

// =============================================================================
// Custom View 3: Two-Day Weekend View (Sat/Sun)
// =============================================================================

/**
 * TwoDayWeekendView - Shows only Saturday and Sunday
 *
 * Perfect for planning weekend activities or events.
 */
export class TwoDayWeekendView<T = unknown> extends TimeView<T> {
  static override meta: ViewMeta = {
    type: "weekend",
    label: "Weekend",
    shortLabel: "WE",
    order: 120,
  };

  /**
   * Override render to inject our custom day filter
   */
  override render(
    container: HTMLElement,
    events: CalendarEvent[],
    options?: ViewRenderOptions,
  ): void {
    // Store original filter
    const originalFilter = this.context.config.view.dayFilter;

    // Temporarily override with our custom filter
    (this.context.config.view as any).dayFilter = (
      _date: T,
      ctx: DayFilterContext,
    ): DayFilterResult => {
      // Only show Saturday (6) and Sunday (0)
      const allowedDays = [0, 6];
      const baseResult = allowedDays.includes(ctx.dayOfWeek);

      // If there's an original filter, combine with it
      if (originalFilter) {
        const origResult = originalFilter(_date, ctx);
        const origVisible =
          typeof origResult === "boolean" ? origResult : origResult.visible;
        return baseResult && origVisible;
      }

      return baseResult;
    };

    // Call parent render
    super.render(container, events, options);

    // Restore original filter
    (this.context.config.view as any).dayFilter = originalFilter;
  }

  override getNavigationUnit(): "week" {
    return "week";
  }

  override getHeaderTitle(): string {
    return `${this.context.adapter.format(
      this.context.currentDate,
      this.context.config.dateFormats.monthHeader,
    )} Weekend`;
  }
}

// =============================================================================
// Custom View 4: Work Days Only (Mon-Fri)
// =============================================================================

/**
 * WorkDaysView - Shows only Monday through Friday
 *
 * A standard business week view without weekends.
 */
export class WorkDaysView<T = unknown> extends TimeView<T> {
  static override meta: ViewMeta = {
    type: "workdays",
    label: "Work Days",
    shortLabel: "WD",
    order: 130,
  };

  /**
   * Override render to inject our custom day filter
   */
  override render(
    container: HTMLElement,
    events: CalendarEvent[],
    options?: ViewRenderOptions,
  ): void {
    // Store original filter
    const originalFilter = this.context.config.view.dayFilter;

    // Temporarily override with our custom filter
    (this.context.config.view as any).dayFilter = (
      _date: T,
      ctx: DayFilterContext,
    ): DayFilterResult => {
      // Only show weekdays (Mon=1, Tue=2, Wed=3, Thu=4, Fri=5)
      const allowedDays = [1, 2, 3, 4, 5];
      const baseResult = allowedDays.includes(ctx.dayOfWeek);

      // If there's an original filter, combine with it
      if (originalFilter) {
        const origResult = originalFilter(_date, ctx);
        const origVisible =
          typeof origResult === "boolean" ? origResult : origResult.visible;
        return baseResult && origVisible;
      }

      return baseResult;
    };

    // Call parent render
    super.render(container, events, options);

    // Restore original filter
    (this.context.config.view as any).dayFilter = originalFilter;
  }

  override getNavigationUnit(): "week" {
    return "week";
  }

  override getHeaderTitle(): string {
    return `${this.context.adapter.format(
      this.context.currentDate,
      this.context.config.dateFormats.monthHeader,
    )} Work Days`;
  }
}

// =============================================================================
// Custom View 5: Second Half Month View (Days 16-31) - Empty cells for 1-15
// =============================================================================

/**
 * SecondHalfMonthView - Shows only days 16 to end of month
 *
 * Days 1-15 are rendered as empty placeholder cells to preserve grid structure.
 */
export class SecondHalfMonthView<T = unknown> extends MonthView<T> {
  static override meta: ViewMeta = {
    type: "second-half-month",
    label: "2nd Half",
    shortLabel: "2H",
    order: 140,
  };

  /**
   * Override render to inject custom day filter and render hook
   */
  override render(
    container: HTMLElement,
    events: CalendarEvent[],
    options?: ViewRenderOptions,
  ): void {
    // Store originals
    const originalFilter = this.context.config.view.dayFilter;
    const originalRenderHook = this.context.config.onRenderDateCell;

    // Set up day filter to mark non-target days
    (this.context.config.view as any).dayFilter = (
      date: T,
      ctx: DayFilterContext,
    ): DayFilterResult => {
      const dayOfMonth = this.context.adapter.date(date);
      const isSecondHalf = dayOfMonth >= 16;

      // Apply original filter logic if exists
      if (originalFilter) {
        const origResult = originalFilter(date, ctx);
        if (typeof origResult === "boolean") {
          if (!origResult) return false;
        } else if (!origResult.visible) {
          return origResult;
        }
      }

      // Return config - all visible, but mark inactive cells
      const config: DayRenderConfig = {
        visible: true,
        className: isSecondHalf
          ? "second-half-month-active"
          : "second-half-month-blank",
        disabled: !isSecondHalf,
      };

      return config;
    };

    // Set up render hook to clear content of blank cells
    (this.context.config as any).onRenderDateCell = (ctx: {
      date: Date;
      cellEl: HTMLElement;
    }) => {
      const dayOfMonth = ctx.date.getDate();
      if (dayOfMonth < 16) {
        // Clear all content from the cell
        ctx.cellEl.innerHTML = "";
        ctx.cellEl.classList.add("second-half-month-blank");
      }

      // Call original hook if exists
      if (originalRenderHook) {
        originalRenderHook(ctx as any);
      }
    };

    // Call parent render
    super.render(container, events, options);

    // Restore originals
    (this.context.config.view as any).dayFilter = originalFilter;
    (this.context.config as any).onRenderDateCell = originalRenderHook;
  }

  override getHeaderTitle(): string {
    return `${this.context.adapter.format(
      this.context.currentDate,
      this.context.config.dateFormats.monthHeader,
    )} (Days 16-End)`;
  }
}

// =============================================================================
// Export all custom views
// =============================================================================

export const customViews = [
  ThreeDayWorkWeekView,
  HalfMonthView,
  TwoDayWeekendView,
  WorkDaysView,
  SecondHalfMonthView,
];

/**
 * Helper function to get view info for UI display
 */
export function getCustomViewInfo() {
  return customViews.map((ViewClass) => ({
    type: ViewClass.meta.type,
    label: ViewClass.meta.label,
    shortLabel: ViewClass.meta.shortLabel,
    order: ViewClass.meta.order,
    description: getViewDescription(ViewClass.meta.type),
  }));
}

function getViewDescription(type: string): string {
  const descriptions: Record<string, string> = {
    "three-day-work": "Shows Mon/Wed/Fri only - for part-time schedules",
    "half-month": "Shows days 1-15 only (other cells empty but preserve grid)",
    weekend: "Shows Sat/Sun only - for weekend planning",
    workdays: "Shows Mon-Fri - standard business week",
    "second-half-month":
      "Shows days 16-end only (other cells empty but preserve grid)",
  };
  return descriptions[type] || "";
}
