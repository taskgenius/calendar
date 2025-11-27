/**
 * MonthView - Built-in month view implementation
 *
 * Extends BaseView and wraps the existing MonthRenderer
 * for backward compatibility while supporting the new view system.
 */
import type {
  CalendarEvent,
  DayFilterContext,
  DayFilterResult,
} from "../types";
import { BaseView, type ViewMeta, type ViewRenderOptions } from "./BaseView";
import { MonthEngine } from "../engines/MonthEngine";
import { MonthRenderer } from "../renderers/MonthRenderer";

/**
 * Month view displaying a calendar grid
 *
 * Features:
 * - Full month grid layout
 * - Multi-day event spanning
 * - Day filtering support
 * - Event count badges (optional)
 * - "+N more" popover for overflow events
 */
export class MonthView<T = unknown> extends BaseView<T> {
  static meta: ViewMeta = {
    type: "month",
    label: "Month",
    shortLabel: "M",
    order: 10,
  };

  private engine!: MonthEngine<T>;
  private renderer!: MonthRenderer<T>;

  /**
   * Initialize the view with context and create engine/renderer
   */
  override init(context: typeof this.context): void {
    super.init(context);

    // Create engine
    this.engine = new MonthEngine<T>(
      this.context.adapter,
      this.context.config.view.firstDayOfWeek,
      this.context.config.view.showWeekends,
      this.context.config.dateFormats,
    );

    // Create renderer
    this.renderer = new MonthRenderer<T>(
      this.engine,
      this.context.adapter,
      this.context.config.theme,
      this.context.config.showEventCounts,
      this.context.config.dateFormats,
      this.context.config.onRenderDateCell,
      this.context.config.onStyleEvent,
      this.context.config.view.maxEventsPerRow,
      this.context.config.onRenderMoreEventsPopover,
      this.context.config.onRenderEvent,
    );
  }

  /**
   * Render the month view
   */
  render(
    container: HTMLElement,
    events: CalendarEvent[],
    _options?: ViewRenderOptions,
  ): void {
    this.renderer.render(
      container,
      this.context.currentDate,
      events,
      this.context.dragController,
      this.context.requestRender,
      this.context.config.onEventClick,
      this.context.config.view.dayFilter as
        | ((date: T, context: DayFilterContext) => DayFilterResult)
        | undefined,
    );
  }

  /**
   * Month view navigates by month
   */
  override getNavigationUnit(): "month" {
    return "month";
  }

  /**
   * Get the month engine for advanced usage
   */
  getEngine(): MonthEngine<T> {
    return this.engine;
  }

  /**
   * Get the month renderer for advanced usage
   */
  getRenderer(): MonthRenderer<T> {
    return this.renderer;
  }
}
