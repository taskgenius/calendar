/**
 * Time view (week/day) renderer
 */
import type {
  DateAdapter,
  CalendarEvent,
  ThemeConfig,
  ViewType,
  TimeLayoutItem,
  DateFormatConfig,
} from "../types";
import type { TimeEngine } from "../engines/TimeEngine";
import type { DragController } from "../core/DragController";
import { createElement, setStyles, clearElement } from "../utils/dom";

/**
 * Renders the week/day time view calendar
 */
export class TimeRenderer<T> {
  constructor(
    private engine: TimeEngine<T>,
    private adapter: DateAdapter<T>,
    private theme: Required<ThemeConfig> & {
      fontSize: Required<NonNullable<ThemeConfig["fontSize"]>>;
    },
    private dateFormats: Required<DateFormatConfig>,
    private onStyleEvent?: (
      event: CalendarEvent,
    ) => import("../types").EventStyle,
  ) {}

  /**
   * Render the complete time view
   */
  render(
    container: HTMLElement,
    currentDate: T,
    viewType: ViewType,
    events: CalendarEvent[],
    dragController: DragController<T>,
    renderCallback: () => void,
    onEventClick?: (event: CalendarEvent) => void,
    initialScrollTop?: number | null,
  ): void {
    clearElement(container);

    const columns = this.engine.generateColumns(currentDate, viewType);

    // Render header
    const header = this.renderHeader(columns);
    container.appendChild(header);

    // Render scrollable body
    const scrollWrap = createElement("div", "tg-time-grid-container");
    const bodyInner = createElement("div", "tg-time-body");

    // Render time axis
    const axis = this.renderTimeAxis();
    bodyInner.appendChild(axis);

    // Render day columns
    for (const colData of columns) {
      const col = this.renderDayColumn(
        colData,
        events,
        dragController,
        renderCallback,
        onEventClick,
      );
      bodyInner.appendChild(col);
    }

    scrollWrap.appendChild(bodyInner);
    container.appendChild(scrollWrap);

    // Restore scroll position
    setTimeout(() => {
      if (initialScrollTop !== null && initialScrollTop !== undefined) {
        scrollWrap.scrollTop = initialScrollTop;
      } else {
        // Default to 8:00 AM
        scrollWrap.scrollTop = 8 * this.theme.cellHeight;
      }
    }, 0);
  }

  // ==========================================================================
  // Private Methods
  // ==========================================================================

  private renderHeader(
    columns: Array<{ date: T; dateStr: string }>,
  ): HTMLElement {
    const header = createElement("div", "tg-time-header");
    header.style.paddingLeft = "60px";

    const dayNames = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
    const today = this.adapter.create();

    for (const col of columns) {
      const cell = createElement("div", "tg-time-header-cell");

      // Highlight today
      if (this.adapter.isSame(col.date, today, "day")) {
        cell.style.backgroundColor = "rgba(59, 130, 246, 0.1)";
        cell.style.color = "#3b82f6";
      }

      const dayName = dayNames[this.adapter.day(col.date)];
      const dateNum = this.adapter.date(col.date);

      cell.innerHTML = `
        <div>${dayName}</div>
        <div style="font-weight: bold; font-size: 18px;">${dateNum}</div>
      `;

      header.appendChild(cell);
    }

    return header;
  }

  private renderTimeAxis(): HTMLElement {
    const axis = createElement("div", "tg-time-axis");

    for (let i = 0; i < 24; i++) {
      const label = createElement("div", "tg-time-axis-label");
      label.textContent = `${i}:00`;
      setStyles(label, {
        position: "absolute",
        top: `${i * this.theme.cellHeight}px`,
      });
      axis.appendChild(label);
    }

    return axis;
  }

  private renderDayColumn(
    colData: { date: T; dateStr: string },
    events: CalendarEvent[],
    dragController: DragController<T>,
    renderCallback: () => void,
    onEventClick?: (event: CalendarEvent) => void,
  ): HTMLElement {
    const col = createElement("div", "tg-day-column");
    col.dataset["date"] = colData.dateStr;

    // Calculate layout for events on this day
    const layout = this.engine.calculateLayout(events, colData.dateStr);

    for (const item of layout) {
      const eventEl = this.renderEventBlock(
        item,
        dragController,
        renderCallback,
        onEventClick,
      );
      col.appendChild(eventEl);
    }

    return col;
  }

  private renderEventBlock(
    item: TimeLayoutItem,
    dragController: DragController<T>,
    renderCallback: () => void,
    onEventClick?: (event: CalendarEvent) => void,
  ): HTMLElement {
    const el = createElement("div", "tg-event-base tg-event-block");
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

    // Set position and size
    setStyles(el, {
      top: `${item.top}px`,
      height: `${item.height}px`,
      width: `calc(${item.widthPercent}% - 2px)`,
      left: `${item.leftPercent}%`,
      backgroundColor: bgColor,
    });

    if (customOpacity !== undefined) {
      el.style.opacity = customOpacity.toString();
    }

    // Format times
    const startDate = this.adapter.parse(item.event.start);
    const endDate = this.adapter.parse(item.event.end);
    const startTime = this.adapter.format(startDate, this.dateFormats.time);
    const endTime = this.adapter.format(endDate, this.dateFormats.time);

    // Create content
    const timeText = createElement("div", "tg-time-text");
    timeText.textContent = `${startTime} - ${endTime}`;
    el.appendChild(timeText);

    const titleText = createElement("div", "tg-event-title");
    titleText.textContent = item.event.title;
    el.appendChild(titleText);

    // Add resize handle
    const resizeHandle = createElement("div", "tg-resize-handle tg-resize-v");
    el.appendChild(resizeHandle);

    // Event click handler
    if (onEventClick) {
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        onEventClick(item.event);
      });
    }

    // Initialize drag
    dragController.initTimeDrag(el, item.event, renderCallback);

    return el;
  }
}
