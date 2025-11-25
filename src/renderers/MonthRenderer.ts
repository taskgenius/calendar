/**
 * Month view renderer
 */
import type {
  DateAdapter,
  CalendarEvent,
  ThemeConfig,
  MonthLayoutItem,
  DateFormatConfig,
  DayFilterContext,
  DayFilterResult,
  DayRenderConfig,
} from "../types";
import type { MonthEngine } from "../engines/MonthEngine";
import type { DragController } from "../core/DragController";
import { createElement, clearElement } from "../utils/dom";

/**
 * Renders the month view calendar
 */
export class MonthRenderer<T> {
  constructor(
    private engine: MonthEngine<T>,
    private adapter: DateAdapter<T>,
    // theme parameter kept for API consistency
    // Theme values now applied via CSS variables (--tg-primary-color, etc.)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _theme: Required<ThemeConfig> & {
      fontSize: Required<NonNullable<ThemeConfig["fontSize"]>>;
    },
    private showEventCounts: boolean = false,
    // dateFormats parameter kept for API consistency with other renderers
    // Currently unused as formats are handled by engines/adapters
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _dateFormats: Required<DateFormatConfig>,
    private onRenderDateCell?: (
      ctx: import("../types").DateCellContext
    ) => void,
    private onStyleEvent?: (
      event: CalendarEvent
    ) => import("../types").EventStyle
  ) {}

  /**
   * Render the complete month view
   */
  render(
    container: HTMLElement,
    currentDate: T,
    events: CalendarEvent[],
    dragController: DragController<T>,
    renderCallback: () => void,
    onEventClick?: (event: CalendarEvent) => void,
    dayFilter?: (date: T, context: DayFilterContext) => DayFilterResult
  ): void {
    clearElement(container);

    // Generate grid with dayFilter
    const weeks = this.engine.generateGrid(currentDate, dayFilter);

    // Render header with day names (dynamically adjusts to number of visible columns)
    const header = this.renderHeader(weeks[0]?.length || 7);
    container.appendChild(header);

    // Render body with weeks
    const body = createElement("div", "tg-month-body");
    // body.style.height = "600px";

    for (const weekDays of weeks) {
      const row = this.renderWeekRow(
        weekDays,
        currentDate,
        events,
        dragController,
        renderCallback,
        onEventClick,
        dayFilter
      );
      body.appendChild(row);
    }

    container.appendChild(body);
  }

  // ==========================================================================
  // Private Methods
  // ==========================================================================

  private renderHeader(columnCount: number): HTMLElement {
    const header = createElement("div", "tg-month-header");
    // Weekday labels: Sunday through Saturday
    const allDayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    // Generate day names based on firstDayOfWeek and actual column count
    const dayNames: string[] = [];
    const firstDay = (this.engine as any).firstDayOfWeek || 0;

    // Generate labels for the actual number of visible columns
    for (let i = 0; i < columnCount; i++) {
      const dayIndex = (firstDay + i) % 7;
      dayNames.push(allDayNames[dayIndex]!);
    }

    // Apply dynamic grid layout via CSS custom property
    header.style.setProperty("--tg-grid-columns", String(dayNames.length));
    header.style.gridTemplateColumns = `repeat(var(--tg-grid-columns), 1fr)`;

    for (const name of dayNames) {
      const cell = createElement("div", "tg-month-header-cell");
      cell.textContent = name;
      header.appendChild(cell);
    }

    return header;
  }

  private renderWeekRow(
    weekDays: Array<{ date: T; dateStr: string }>,
    currentDate: T,
    events: CalendarEvent[],
    dragController: DragController<T>,
    renderCallback: () => void,
    onEventClick?: (event: CalendarEvent) => void,
    dayFilter?: (date: T, context: DayFilterContext) => DayFilterResult
  ): HTMLElement {
    const row = createElement("div", "tg-month-row");
    row.dataset["date"] = weekDays[0]!.dateStr;
    const columnCount = weekDays.length;

    // Apply dynamic grid layout via CSS custom property
    row.style.setProperty("--tg-grid-columns", String(weekDays.length));
    row.style.gridTemplateColumns = `repeat(var(--tg-grid-columns), 1fr)`;

    // Render date cells
    for (const day of weekDays) {
      const cell = this.renderDateCell(day, currentDate, events, dayFilter);
      row.appendChild(cell);
    }

    // Calculate and render event bars
    const weekStart = weekDays[0]!.date;
    const weekEnd = weekDays[weekDays.length - 1]!.date; // Use last element instead of [6]
    const layout = this.engine.calculateLayout(events, weekStart, weekEnd);

    for (const item of layout) {
      const eventEl = this.renderEventBar(
        item,
        columnCount,
        dragController,
        renderCallback,
        onEventClick
      );
      row.appendChild(eventEl);
    }

    return row;
  }

  private renderDateCell(
    day: { date: T; dateStr: string },
    currentDate: T,
    events: CalendarEvent[],
    dayFilter?: (date: T, context: DayFilterContext) => DayFilterResult
  ): HTMLElement {
    const cell = createElement("div", "tg-month-cell");

    const dateNum = createElement("div", "tg-date-number");
    dateNum.textContent = String(this.adapter.date(day.date));

    const today = this.adapter.create();
    const isToday = this.adapter.isSame(day.date, today, "day");
    const isPastDue = this.adapter.isBefore(day.date, today, "day");
    const isFuture = this.adapter.isAfter(day.date, today, "day");
    const isThisMonth =
      this.adapter.month(day.date) === this.adapter.month(currentDate);

    // Build filter context
    const dayOfWeek = this.adapter.day(day.date);
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const context: DayFilterContext = {
      isWeekend,
      dayOfWeek,
      isToday,
      isThisMonth,
    };

    // Apply dayFilter configuration if provided
    if (dayFilter) {
      const result = dayFilter(day.date, context);
      if (typeof result === "object") {
        const config = result as DayRenderConfig;
        // Apply custom className
        if (config.className) {
          cell.classList.add(config.className);
        }
        // Apply custom inline styles
        if (config.style) {
          Object.assign(cell.style, config.style);
        }
        // Apply disabled state (styles defined in CSS)
        if (config.disabled) {
          cell.classList.add("tg-disabled");
        }
      }
    }

    // Style based on month
    if (isThisMonth) {
      dateNum.classList.add("tg-current-month");
    } else {
      dateNum.classList.add("tg-other-month");
    }

    // Highlight today
    if (isToday) {
      dateNum.classList.add("tg-today");
    }

    cell.appendChild(dateNum);

    // Filter events for this day
    const dayEvents = events.filter((e) => {
      const eventStart = this.adapter.parse(e.start);
      const eventEnd = this.adapter.parse(e.end);
      return (
        !this.adapter.isBefore(eventEnd, day.date) &&
        !this.adapter.isAfter(eventStart, day.date)
      );
    });

    // Show event count badge if enabled
    // Styles applied via CSS class, theme color via CSS variable --tg-primary-color
    if (this.showEventCounts && dayEvents.length > 0) {
      const badge = createElement("div", "tg-event-count-badge");
      badge.textContent = dayEvents.length.toString();
      cell.appendChild(badge);
    }

    // Call custom render hook if provided
    if (this.onRenderDateCell) {
      // Convert T to Date using adapter API (avoids format string parsing issues)
      const dateObj = new Date(
        this.adapter.year(day.date),
        this.adapter.month(day.date),
        this.adapter.date(day.date)
      );
      this.onRenderDateCell({
        date: dateObj,
        events: dayEvents,
        cellEl: cell,
        isToday,
        isPastDue,
        isFuture,
        isThisMonth,
      });
    }

    return cell;
  }

  private renderEventBar(
    item: MonthLayoutItem,
    columnCount: number,
    dragController: DragController<T>,
    renderCallback: () => void,
    onEventClick?: (event: CalendarEvent) => void
  ): HTMLElement {
    const el = createElement("div", "tg-event-base tg-event-bar");
    el.textContent = item.event.title;
    el.dataset["eid"] = item.event.id;

    // Apply custom styling if hook is provided
    let bgColor = item.event.color || "#3b82f6";
    let customOpacity: number | undefined;

    if (this.onStyleEvent) {
      const style = this.onStyleEvent(item.event);
      if (style.className) {
        el.classList.add(style.className);
      }
      if (style.color) {
        bgColor = style.color;
      }
      if (style.opacity !== undefined) {
        customOpacity = style.opacity;
      }
    }

    // Calculate column width percentage based on actual number of visible columns
    const colWidth = 100 / columnCount;

    // Calculate position values
    const xOffset = item.startIdx * colWidth;
    const yOffset = 26 + item.slot * 28;

    // Use transform for GPU-accelerated positioning
    // Width uses calc() for precise sizing with margins
    el.style.transform = `translate(calc(${xOffset}% + 2px), ${yOffset}px)`;
    el.style.width = `calc(${item.span * colWidth}% - 4px)`;
    el.style.backgroundColor = bgColor;

    if (customOpacity !== undefined) {
      el.style.opacity = customOpacity.toString();
    }

    // Add resize handles
    if (item.isStart) {
      const leftHandle = createElement(
        "div",
        "tg-resize-handle tg-resize-h tg-left"
      );
      el.appendChild(leftHandle);
    }

    if (item.isEnd) {
      const rightHandle = createElement(
        "div",
        "tg-resize-handle tg-resize-h tg-right"
      );
      el.appendChild(rightHandle);
    }

    // Event click handler
    if (onEventClick) {
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        onEventClick(item.event);
      });
    }

    // Initialize drag
    dragController.initMonthDrag(el, item.event, renderCallback);

    return el;
  }
}
