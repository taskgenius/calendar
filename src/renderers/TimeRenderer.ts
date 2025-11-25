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
  AllDayLayoutItem,
} from "../types";
import type { TimeEngine } from "../engines/TimeEngine";
import type { DragController } from "../core/DragController";
import { createElement, clearElement } from "../utils/dom";

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
    const columns = this.engine.generateColumns(
      currentDate,
      viewType,
      dayFilter,
    );

    // Generate time slots with timeFilter
    const timeSlots = this.engine.generateTimeSlots(timeFilter);

    // Separate all-day events from timed events
    const allDayEvents = events.filter((e) => this.engine.isAllDayEvent(e));
    const timedEvents = events.filter((e) => !this.engine.isAllDayEvent(e));

    // Render header
    const header = this.renderHeader(columns, currentDate, dayFilter);
    container.appendChild(header);

    // Render all-day events section (if any)
    if (allDayEvents.length > 0) {
      const allDaySection = this.renderAllDaySection(
        columns,
        allDayEvents,
        dragController,
        renderCallback,
        onEventClick,
      );
      container.appendChild(allDaySection);
    }

    // Render scrollable body
    const scrollWrap = createElement("div", "tg-time-grid-container");
    const bodyInner = createElement("div", "tg-time-body");

    // Render time axis with timeSlots and timeFormatter
    const axis = this.renderTimeAxis(timeSlots, timeFormatter);
    bodyInner.appendChild(axis);

    // Render day columns (only timed events)
    for (const colData of columns) {
      const col = this.renderDayColumn(
        colData,
        timedEvents,
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
        const targetSlotIndex = timeSlots.findIndex(
          (slot) => slot.hour >= defaultHour,
        );
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
    // padding-left is defined in CSS

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

      // Highlight today using CSS class (default styling when no dayFilter)
      if (isToday && !dayFilter) {
        cell.classList.add("tg-today");
      }

      const dayName = dayNames[dayOfWeek];
      const dateNum = this.adapter.date(col.date);

      // Use CSS classes instead of inline styles
      const dayNameEl = createElement("div");
      dayNameEl.textContent = dayName!;

      const dateNumEl = createElement("div", "tg-header-date");
      dateNumEl.textContent = String(dateNum);

      cell.appendChild(dayNameEl);
      cell.appendChild(dateNumEl);

      header.appendChild(cell);
    }

    return header;
  }

  /**
   * Render the all-day events section below the header
   * Uses layout calculation for multi-day spanning events
   */
  private renderAllDaySection(
    columns: Array<{ date: T; dateStr: string }>,
    allDayEvents: CalendarEvent[],
    dragController: DragController<T>,
    renderCallback: () => void,
    onEventClick?: (event: CalendarEvent) => void,
  ): HTMLElement {
    const section = createElement("div", "tg-allday-section");

    // Left spacer (matches time axis width)
    const spacer = createElement("div", "tg-allday-spacer");
    section.appendChild(spacer);

    // Container for all-day events (positioned relatively)
    const eventsContainer = createElement("div", "tg-allday-events-container");
    eventsContainer.style.setProperty(
      "--tg-allday-columns",
      String(columns.length),
    );

    // Calculate layout for all-day events
    const layout = this.engine.calculateAllDayLayout(allDayEvents, columns);

    // Calculate section height based on max slot
    const maxSlot = layout.reduce((max, item) => Math.max(max, item.slot), -1);
    const rowHeight = 26; // Height of each all-day event row
    const padding = 8; // Top and bottom padding
    const sectionHeight =
      maxSlot >= 0 ? padding + (maxSlot + 1) * rowHeight : 0;
    eventsContainer.style.height = `${Math.max(sectionHeight, 28)}px`;

    // Render each all-day event bar with spanning
    for (const item of layout) {
      const eventEl = this.renderAllDayEventBar(
        item,
        columns.length,
        dragController,
        renderCallback,
        onEventClick,
      );
      eventsContainer.appendChild(eventEl);
    }

    section.appendChild(eventsContainer);
    return section;
  }

  /**
   * Render a single all-day event bar with spanning support
   */
  private renderAllDayEventBar(
    item: AllDayLayoutItem,
    columnCount: number,
    dragController: DragController<T>,
    renderCallback: () => void,
    onEventClick?: (event: CalendarEvent) => void,
  ): HTMLElement {
    const el = createElement("div", "tg-event-base tg-allday-event");
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

    // Calculate position and size based on layout
    const colWidth = 100 / columnCount;
    const xOffset = item.startIdx * colWidth;
    const yOffset = 4 + item.slot * 26; // 4px top padding, 26px row height

    el.style.left = `calc(${xOffset}% + 2px)`;
    el.style.top = `${yOffset}px`;
    el.style.width = `calc(${item.span * colWidth}% - 4px)`;
    el.style.backgroundColor = bgColor;

    if (customOpacity !== undefined) {
      el.style.opacity = customOpacity.toString();
    }

    // Title only (no time text for all-day events)
    el.textContent = item.event.title;

    // Add resize handles for spanning events
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

    // Initialize drag for all-day events (use month drag for horizontal movement)
    dragController.initMonthDrag(el, item.event, renderCallback);

    return el;
  }

  private renderTimeAxis(
    timeSlots: Array<{
      hour: number;
      config?: import("../types").TimeSlotConfig;
    }>,
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

      // Use transform for GPU-accelerated positioning
      const yOffset = slotIndex * this.theme.cellHeight;
      label.style.transform = `translateY(${yOffset}px)`;
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
    timeSlots?: Array<{
      hour: number;
      config?: import("../types").TimeSlotConfig;
    }>,
  ): HTMLElement {
    const col = createElement("div", "tg-day-column");
    col.dataset["date"] = colData.dateStr;

    // Set height via CSS custom property for dynamic time slots
    if (timeSlots && timeSlots.length > 0) {
      const height = timeSlots.length * this.theme.cellHeight;
      col.style.setProperty("--tg-column-height", `${height}px`);
      col.style.height = "var(--tg-column-height)";
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

    // Use transform for GPU-accelerated positioning
    // translateX uses percentage for responsive width positioning
    el.style.transform = `translate(${item.leftPercent}%, ${item.top}px)`;
    el.style.width = `calc(${item.widthPercent}% - 2px)`;
    el.style.height = `${item.height}px`;
    el.style.backgroundColor = bgColor;

    if (customOpacity !== undefined) {
      el.style.opacity = customOpacity.toString();
    }

    // Check if this is an all-day event
    const isAllDay = this.engine.isAllDayEvent(item.event);

    // Create content - hide time text for all-day events
    if (!isAllDay) {
      const startDate = this.adapter.parse(item.event.start);
      const endDate = this.adapter.parse(item.event.end);
      const startTime = this.adapter.format(startDate, this.dateFormats.time);
      const endTime = this.adapter.format(endDate, this.dateFormats.time);

      const timeText = createElement("div", "tg-time-text");
      timeText.textContent = `${startTime} - ${endTime}`;
      el.appendChild(timeText);
    }

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
