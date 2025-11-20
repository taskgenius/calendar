/**
 * Month view renderer
 */
import type {
  DateAdapter,
  CalendarEvent,
  ThemeConfig,
  MonthLayoutItem,
} from "../types";
import type { MonthEngine } from "../engines/MonthEngine";
import type { DragController } from "../core/DragController";
import { createElement, setStyles, clearElement } from "../utils/dom";

/**
 * Renders the month view calendar
 */
export class MonthRenderer<T> {
  constructor(
    private engine: MonthEngine<T>,
    private adapter: DateAdapter<T>,
    private theme: Required<ThemeConfig> & {
      fontSize: Required<NonNullable<ThemeConfig["fontSize"]>>;
    },
    private showEventCounts: boolean = false,
    private onRenderDateCell?: (
      ctx: import("../types").DateCellContext,
    ) => void,
    private onStyleEvent?: (
      event: CalendarEvent,
    ) => import("../types").EventStyle,
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
  ): void {
    clearElement(container);

    // Render header with day names
    const header = this.renderHeader();
    container.appendChild(header);

    // Render body with weeks
    const body = createElement("div", "tg-month-body");
    body.style.overflowY = "auto";
    body.style.height = "600px";

    const weeks = this.engine.generateGrid(currentDate);

    for (const weekDays of weeks) {
      const row = this.renderWeekRow(
        weekDays,
        currentDate,
        events,
        dragController,
        renderCallback,
        onEventClick,
      );
      body.appendChild(row);
    }

    container.appendChild(body);
  }

  // ==========================================================================
  // Private Methods
  // ==========================================================================

  private renderHeader(): HTMLElement {
    const header = createElement("div", "tg-month-header");
    const allDayNames = ["日", "一", "二", "三", "四", "五", "六"];

    // Get the correct column count and day order
    const colCount =
      this.engine.getWeekCount(this.adapter.create()) > 0
        ? this.engine.generateGrid(this.adapter.create())[0]?.length || 7
        : 7;

    // Generate day names based on firstDayOfWeek and showWeekends
    const dayNames: string[] = [];
    const firstDay = (this.engine as any).firstDayOfWeek || 0;

    for (let i = 0; i < 7; i++) {
      const dayIndex = (firstDay + i) % 7;
      const isWeekend = dayIndex === 0 || dayIndex === 6;

      // Only add if weekends are shown or it's not a weekend
      if ((this.engine as any).showWeekends || !isWeekend) {
        dayNames.push(allDayNames[dayIndex]!);
      }
    }

    // Apply dynamic grid class
    header.style.display = "grid";
    header.style.gridTemplateColumns = `repeat(${dayNames.length}, 1fr)`;

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
  ): HTMLElement {
    const row = createElement("div", "tg-month-row");
    row.dataset["date"] = weekDays[0]!.dateStr;

    // Apply dynamic grid layout
    row.style.display = "grid";
    row.style.gridTemplateColumns = `repeat(${weekDays.length}, 1fr)`;
    row.style.position = "relative";
    row.style.minHeight = "100px";

    // Render date cells
    for (const day of weekDays) {
      const cell = this.renderDateCell(day, currentDate, events);
      row.appendChild(cell);
    }

    // Calculate and render event bars
    const weekStart = weekDays[0]!.date;
    const weekEnd = weekDays[weekDays.length - 1]!.date; // Use last element instead of [6]
    const layout = this.engine.calculateLayout(events, weekStart, weekEnd);

    for (const item of layout) {
      const eventEl = this.renderEventBar(
        item,
        dragController,
        renderCallback,
        onEventClick,
      );
      row.appendChild(eventEl);
    }

    return row;
  }

  private renderDateCell(
    day: { date: T; dateStr: string },
    currentDate: T,
    events: CalendarEvent[],
  ): HTMLElement {
    const cell = createElement("div", "tg-month-cell");
    cell.style.padding = "4px";

    const dateNum = createElement("div", "tg-date-number");
    dateNum.textContent = String(this.adapter.date(day.date));

    const today = this.adapter.create();
    const isToday = this.adapter.isSame(day.date, today, "day");
    const isPastDue = this.adapter.isBefore(day.date, today, "day");
    const isFuture = this.adapter.isAfter(day.date, today, "day");
    const isThisMonth =
      this.adapter.month(day.date) === this.adapter.month(currentDate);

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
    if (this.showEventCounts && dayEvents.length > 0) {
      const badge = createElement("div", "tg-event-count-badge");
      badge.textContent = dayEvents.length.toString();
      badge.style.cssText = `
        position: absolute;
        bottom: 2px;
        right: 2px;
        background: ${this.theme.primaryColor};
        color: white;
        border-radius: 10px;
        padding: 2px 6px;
        font-size: 10px;
        font-weight: bold;
        min-width: 18px;
        text-align: center;
      `;
      cell.appendChild(badge);
    }

    // Call custom render hook if provided
    if (this.onRenderDateCell) {
      // Convert T to Date for the context
      const dateObj = new Date(this.adapter.format(day.date, "YYYY-MM-DD"));
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
    dragController: DragController<T>,
    renderCallback: () => void,
    onEventClick?: (event: CalendarEvent) => void,
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

    // Calculate column width percentage based on actual number of columns
    const colCount = (this.engine as any).showWeekends ? 7 : 5;
    const colWidth = 100 / colCount;

    // Set position and size
    setStyles(el, {
      left: `calc(${item.startIdx * colWidth}% + 2px)`,
      width: `calc(${item.span * colWidth}% - 4px)`,
      top: `${26 + item.slot * 28}px`,
      backgroundColor: bgColor,
    });

    if (customOpacity !== undefined) {
      el.style.opacity = customOpacity.toString();
    }

    // Add resize handles
    if (item.isStart) {
      const leftHandle = createElement(
        "div",
        "tg-resize-handle tg-resize-h tg-left",
      );
      el.appendChild(leftHandle);
    }

    if (item.isEnd) {
      const rightHandle = createElement(
        "div",
        "tg-resize-handle tg-resize-h tg-right",
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
