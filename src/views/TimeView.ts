/**
 * TimeView - Built-in week/day view implementation
 *
 * Base class for time-based views (week and day).
 * Can be extended for custom time-based views.
 */
import type {
  CalendarEvent,
  DayFilterContext,
  DayFilterResult,
  TimeFilterResult,
  TimeFormatter,
  ViewType,
} from "../types";
import { BaseView, type ViewMeta, type ViewRenderOptions } from "./BaseView";
import { TimeEngine } from "../engines/TimeEngine";
import { TimeRenderer } from "../renderers/TimeRenderer";

/**
 * Base time view for week/day displays
 *
 * Features:
 * - Hourly time grid
 * - All-day events section
 * - Event overlap handling
 * - Time slot filtering
 * - Custom time formatting
 */
export class TimeView<T = unknown> extends BaseView<T> {
  static meta: ViewMeta = {
    type: "time",
    label: "Time",
    shortLabel: "T",
    order: 20,
  };

  protected engine!: TimeEngine<T>;
  protected renderer!: TimeRenderer<T>;
  protected timeViewType: ViewType = "week";

  /**
   * Initialize the view with context and create engine/renderer
   */
  override init(context: typeof this.context): void {
    super.init(context);

    // Create engine
    this.engine = new TimeEngine<T>(
      this.context.adapter,
      this.context.config.theme.cellHeight,
      this.context.config.view.showWeekends,
      this.context.config.view.firstDayOfWeek,
      this.context.config.dateFormats,
    );

    // Create renderer
    this.renderer = new TimeRenderer<T>(
      this.engine,
      this.context.adapter,
      this.context.config.theme,
      this.context.config.dateFormats,
      this.context.config.onStyleEvent,
      this.context.config.onRenderEvent,
    );
  }

  /**
   * Render the time view
   */
  render(
    container: HTMLElement,
    events: CalendarEvent[],
    options?: ViewRenderOptions,
  ): void {
    this.renderer.render(
      container,
      this.context.currentDate,
      this.timeViewType,
      events,
      this.context.dragController,
      this.context.requestRender,
      this.context.config.onEventClick,
      options?.preservedScrollTop,
      this.context.config.view.dayFilter as
        | ((date: T, context: DayFilterContext) => DayFilterResult)
        | undefined,
      this.context.config.view.timeFilter as
        | ((hour: number) => TimeFilterResult)
        | undefined,
      this.context.config.view.timeFormatter as TimeFormatter | undefined,
    );
  }

  /**
   * Get the time engine for advanced usage
   */
  getEngine(): TimeEngine<T> {
    return this.engine;
  }

  /**
   * Get the time renderer for advanced usage
   */
  getRenderer(): TimeRenderer<T> {
    return this.renderer;
  }
}

/**
 * WeekView - Week display with hourly grid
 */
export class WeekView<T = unknown> extends TimeView<T> {
  static override meta: ViewMeta = {
    type: "week",
    label: "Week",
    shortLabel: "W",
    order: 20,
  };

  protected override timeViewType: ViewType = "week";

  /**
   * Week view navigates by week
   */
  override getNavigationUnit(): "week" {
    return "week";
  }
}

/**
 * DayView - Single day display with hourly grid
 */
export class DayView<T = unknown> extends TimeView<T> {
  static override meta: ViewMeta = {
    type: "day",
    label: "Day",
    shortLabel: "D",
    order: 30,
  };

  protected override timeViewType: ViewType = "day";

  /**
   * Day view navigates by day
   */
  override getNavigationUnit(): "day" {
    return "day";
  }

  /**
   * Day view uses day header format
   */
  override getHeaderTitle(): string {
    return this.context.adapter.format(
      this.context.currentDate,
      this.context.config.dateFormats.dayHeader,
    );
  }
}
