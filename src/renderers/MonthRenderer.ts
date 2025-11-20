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
    _theme: Required<ThemeConfig> & {
      fontSize: Required<NonNullable<ThemeConfig["fontSize"]>>;
    },
  ) {
    // Theme is used for future extensions
    void _theme;
  }

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
    const header = createElement("div", "tg-month-header tg-grid-7");
    const dayNames = ["日", "一", "二", "三", "四", "五", "六"];

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
    const row = createElement("div", "tg-month-row tg-grid-7");
    row.dataset["date"] = weekDays[0]!.dateStr;

    // Render date cells
    for (const day of weekDays) {
      const cell = this.renderDateCell(day, currentDate);
      row.appendChild(cell);
    }

    // Calculate and render event bars
    const weekStart = weekDays[0]!.date;
    const weekEnd = weekDays[6]!.date;
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
  ): HTMLElement {
    const cell = createElement("div", "tg-month-cell");
    cell.style.padding = "4px";

    const dateNum = createElement("div", "tg-date-number");
    dateNum.textContent = String(this.adapter.date(day.date));

    // Style based on month
    if (this.adapter.month(day.date) === this.adapter.month(currentDate)) {
      dateNum.classList.add("tg-current-month");
    } else {
      dateNum.classList.add("tg-other-month");
    }

    // Highlight today
    const today = this.adapter.create();
    if (this.adapter.isSame(day.date, today, "day")) {
      dateNum.classList.add("tg-today");
    }

    cell.appendChild(dateNum);
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

    // Set position and size
    setStyles(el, {
      left: `calc(${item.startIdx * 14.28}% + 2px)`,
      width: `calc(${item.span * 14.28}% - 4px)`,
      top: `${26 + item.slot * 28}px`,
      backgroundColor: item.event.color || "#3b82f6",
    });

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
