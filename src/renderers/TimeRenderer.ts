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
  DayFilterContext,
  DayFilterResult,
  DayRenderConfig,
  TimeFilterResult,
  TimeFormatter,
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
    dayFilter?: (date: T, context: DayFilterContext) => DayFilterResult,
    timeFilter?: (hour: number) => TimeFilterResult,
    timeFormatter?: TimeFormatter,
  ): void {
    clearElement(container);

    // Generate columns with dayFilter
    const columns = this.engine.generateColumns(currentDate, viewType, dayFilter);

    // Generate time slots with timeFilter
    const timeSlots = this.engine.generateTimeSlots(timeFilter);

    // Render header
    const header = this.renderHeader(columns, currentDate, dayFilter);
    container.appendChild(header);

    // Render scrollable body
    const scrollWrap = createElement("div", "tg-time-grid-container");
    const bodyInner = createElement("div", "tg-time-body");

    // Render time axis with timeSlots and timeFormatter
    const axis = this.renderTimeAxis(timeSlots, timeFormatter);
    bodyInner.appendChild(axis);

    // Render day columns
    for (const colData of columns) {
      const col = this.renderDayColumn(
        colData,
        events,
        dragController,
        renderCallback,
        onEventClick,
        timeSlots,
      );
      bodyInner.appendChild(col);
    }

    scrollWrap.appendChild(bodyInner);
    container.appendChild(scrollWrap);

    // Restore scroll position (adjust for filtered time slots)
    setTimeout(() => {
      if (initialScrollTop !== null && initialScrollTop !== undefined) {
        scrollWrap.scrollTop = initialScrollTop;
      } else {
        // Default scroll to first visible time slot >= 8:00 AM
        const defaultHour = 8;
        const targetSlotIndex = timeSlots.findIndex((slot) => slot.hour >= defaultHour);
        if (targetSlotIndex >= 0) {
          scrollWrap.scrollTop = targetSlotIndex * this.theme.cellHeight;
        }
      }
    }, 0);
  }

  // ==========================================================================
  // Private Methods
  // ==========================================================================

  private renderHeader(
    columns: Array<{ date: T; dateStr: string }>,
    currentDate: T,
    dayFilter?: (date: T, context: DayFilterContext) => DayFilterResult,
  ): HTMLElement {
    const header = createElement("div", "tg-time-header");
    header.style.paddingLeft = "60px";

    // Weekday labels: Sunday through Saturday
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const today = this.adapter.create();

    for (const col of columns) {
      const cell = createElement("div", "tg-time-header-cell");

      // Build filter context
      const dayOfWeek = this.adapter.day(col.date);
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isToday = this.adapter.isSame(col.date, today, "day");
      const context: DayFilterContext = {
        isWeekend,
        dayOfWeek,
        isToday,
        isThisMonth: this.adapter.isSame(col.date, currentDate, "month"),
      };

      // Apply dayFilter configuration if provided
      if (dayFilter) {
        const result = dayFilter(col.date, context);
        if (typeof result === "object") {
          const config = result as DayRenderConfig;
          if (config.className) {
            cell.classList.add(config.className);
          }
          if (config.style) {
            Object.assign(cell.style, config.style);
          }
          if (config.disabled) {
            cell.classList.add("tg-disabled");
          }
        }
      }

      // Highlight today (default styling)
      if (isToday && !dayFilter) {
        cell.style.backgroundColor = "rgba(59, 130, 246, 0.1)";
        cell.style.color = "#3b82f6";
      }

      const dayName = dayNames[dayOfWeek];
      const dateNum = this.adapter.date(col.date);

      cell.innerHTML = `
        <div>${dayName}</div>
        <div style="font-weight: bold; font-size: 18px;">${dateNum}</div>
      `;

      header.appendChild(cell);
    }

    return header;
  }

  private renderTimeAxis(
    timeSlots: Array<{ hour: number; config?: import("../types").TimeSlotConfig }>,
    timeFormatter?: TimeFormatter,
  ): HTMLElement {
    const axis = createElement("div", "tg-time-axis");

    for (let slotIndex = 0; slotIndex < timeSlots.length; slotIndex++) {
      const slot = timeSlots[slotIndex]!;
      const label = createElement("div", "tg-time-axis-label");

      // Apply custom label or formatter
      if (slot.config?.label) {
        label.textContent = slot.config.label;
      } else if (timeFormatter) {
        label.textContent = timeFormatter(slot.hour, 0);
      } else {
        label.textContent = `${slot.hour}:00`;
      }

      // Apply custom className
      if (slot.config?.className) {
        label.classList.add(slot.config.className);
      }

      // Position based on slot index (not hour) to account for filtered hours
      setStyles(label, {
        position: "absolute",
        top: `${slotIndex * this.theme.cellHeight}px`,
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
    timeSlots?: Array<{ hour: number; config?: import("../types").TimeSlotConfig }>,
  ): HTMLElement {
    const col = createElement("div", "tg-day-column");
    col.dataset["date"] = colData.dateStr;

    // Adjust height based on visible time slots
    if (timeSlots && timeSlots.length > 0) {
      col.style.height = `${timeSlots.length * this.theme.cellHeight}px`;
    }

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

    // Add resize handles (top and bottom)
    const resizeHandleTop = createElement(
      "div",
      "tg-resize-handle tg-resize-v tg-top",
    );
    el.appendChild(resizeHandleTop);

    const resizeHandleBottom = createElement(
      "div",
      "tg-resize-handle tg-resize-v tg-bottom",
    );
    el.appendChild(resizeHandleBottom);

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
