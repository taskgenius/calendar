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
  VisibleDay,
} from "../types";
import type { MonthEngine } from "../engines/MonthEngine";
import type { DragController } from "../core/DragController";
import { createElement, clearElement } from "../utils/dom";

/**
 * Renders the month view calendar
 */
export class MonthRenderer<T> {
  /** Currently active popover element */
  private activePopover: HTMLElement | null = null;
  /** Bound handler for closing popover on outside click */
  private popoverCloseHandler: ((e: MouseEvent) => void) | null = null;

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
      ctx: import("../types").DateCellContext,
    ) => void,
    private onStyleEvent?: (
      event: CalendarEvent,
    ) => import("../types").EventStyle,
    private maxEventsPerRow?: number,
    private onRenderMoreEventsPopover?: (
      events: CalendarEvent[],
      date: Date,
      anchorEl: HTMLElement,
      defaultRender: () => void,
    ) => void,
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
    dayFilter?: (date: T, context: DayFilterContext) => DayFilterResult,
  ): void {
    // Close any existing popover before re-rendering
    this.closePopover();

    clearElement(container);

    // Generate grid with dayFilter
    const weeks = this.engine.generateGrid(currentDate, dayFilter);

    // Render header with day names (dynamically adjusts to number of visible columns)
    const header = this.renderHeader(weeks[0]?.length || 7);
    container.appendChild(header);

    // Render body with weeks
    const body = createElement("div", "tg-month-body");

    for (const weekDays of weeks) {
      const row = this.renderWeekRow(
        weekDays,
        currentDate,
        events,
        dragController,
        renderCallback,
        onEventClick,
        dayFilter,
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
    dayFilter?: (date: T, context: DayFilterContext) => DayFilterResult,
  ): HTMLElement {
    const row = createElement("div", "tg-month-row");
    row.dataset["date"] = weekDays[0]!.dateStr;
    const columnCount = weekDays.length;

    // Apply dynamic grid layout via CSS custom property
    row.style.setProperty("--tg-grid-columns", String(weekDays.length));
    row.style.gridTemplateColumns = `repeat(var(--tg-grid-columns), 1fr)`;

    // Build VisibleDay array for layout calculation
    // This enables proper event segmentation when days are filtered
    // Also check dayFilter for disabled state to exclude events from disabled days
    const visibleDays: VisibleDay<T>[] = weekDays.map((day, index) => {
      let isDisabled = false;

      if (dayFilter) {
        const dayOfWeek = this.adapter.day(day.date);
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const today = this.adapter.create();
        const context: DayFilterContext = {
          isWeekend,
          dayOfWeek,
          isToday: this.adapter.isSame(day.date, today, "day"),
          isThisMonth: this.adapter.isSame(day.date, currentDate, "month"),
        };

        const result = dayFilter(day.date, context);
        if (typeof result === "object" && result.disabled) {
          isDisabled = true;
        }
      }

      return {
        date: day.date,
        dateStr: day.dateStr,
        colIndex: index,
        disabled: isDisabled,
      };
    });

    // Calculate layout with visible days support for event segmentation
    const layout = this.engine.calculateLayoutWithVisibleDays(
      events,
      visibleDays,
    );

    // Split layout into visible and hidden events
    const visibleLayout =
      this.maxEventsPerRow !== undefined
        ? layout.filter((item) => item.slot < this.maxEventsPerRow!)
        : layout;

    // Group hidden events by column index for "+N more" indicators
    const hiddenEventsByColumn: Map<number, CalendarEvent[]> = new Map();
    if (this.maxEventsPerRow !== undefined) {
      for (const item of layout) {
        if (item.slot >= this.maxEventsPerRow) {
          // For each column the event spans, add it to hidden events
          for (
            let colIdx = item.startIdx;
            colIdx < item.startIdx + item.span;
            colIdx++
          ) {
            if (!hiddenEventsByColumn.has(colIdx)) {
              hiddenEventsByColumn.set(colIdx, []);
            }
            // Avoid duplicates
            const arr = hiddenEventsByColumn.get(colIdx)!;
            if (!arr.find((e) => e.id === item.event.id)) {
              arr.push(item.event);
            }
          }
        }
      }
    }

    // Calculate minimum row height based on visible events
    // The actual height will be determined by flex: 1 to fill container evenly
    const effectiveMaxSlot = visibleLayout.reduce(
      (max, item) => Math.max(max, item.slot),
      -1,
    );
    const baseHeight = 80; // Base height for date numbers and padding
    let eventAreaHeight =
      effectiveMaxSlot >= 0 ? 26 + (effectiveMaxSlot + 1) * 28 : 0;

    // Add space for "+N more" indicator if there are hidden events
    if (hiddenEventsByColumn.size > 0) {
      eventAreaHeight += 24; // Height for the "+N more" row
    }

    const minHeight = Math.max(baseHeight, eventAreaHeight + 8);

    // Set minimum row height via CSS custom property
    // Rows will grow beyond this if container has extra space (flex: 1)
    row.style.setProperty("--tg-row-min-height", `${minHeight}px`);

    // Render date cells
    for (const day of weekDays) {
      const cell = this.renderDateCell(day, currentDate, events, dayFilter);
      row.appendChild(cell);
    }

    // Render visible event bars
    for (const item of visibleLayout) {
      const eventEl = this.renderEventBar(
        item,
        columnCount,
        dragController,
        renderCallback,
        onEventClick,
      );
      row.appendChild(eventEl);
    }

    // Render "+N more" indicators for each column with hidden events
    for (const [colIdx, hiddenEvents] of hiddenEventsByColumn) {
      const moreEl = this.renderMoreIndicator(
        colIdx,
        hiddenEvents,
        weekDays[colIdx]!,
        columnCount,
        effectiveMaxSlot,
        onEventClick,
      );
      row.appendChild(moreEl);
    }

    return row;
  }

  private renderDateCell(
    day: { date: T; dateStr: string },
    currentDate: T,
    events: CalendarEvent[],
    dayFilter?: (date: T, context: DayFilterContext) => DayFilterResult,
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
        this.adapter.date(day.date),
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
    onEventClick?: (event: CalendarEvent) => void,
  ): HTMLElement {
    const el = createElement("div", "tg-event-base tg-event-bar");
    el.textContent = item.event.title;
    el.dataset["eid"] = item.event.id;

    // Add segmentation data attributes and classes for styling
    if (item.segmentIndex !== undefined && item.totalSegments !== undefined) {
      el.dataset["segmentIndex"] = String(item.segmentIndex);
      el.dataset["totalSegments"] = String(item.totalSegments);
      el.classList.add("tg-event-segmented");

      // Add specific classes for first/last segments
      if (item.segmentIndex === 0) {
        el.classList.add("tg-event-segment-first");
      }
      if (item.segmentIndex === item.totalSegments - 1) {
        el.classList.add("tg-event-segment-last");
      }
      // Middle segments
      if (item.segmentIndex > 0 && item.segmentIndex < item.totalSegments - 1) {
        el.classList.add("tg-event-segment-middle");
      }
    }

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

    // Use left/top for correct positioning relative to parent container
    // (transform with % is relative to element's own width, causing misalignment)
    el.style.left = `calc(${xOffset}% + 2px)`;
    el.style.top = `${yOffset}px`;
    el.style.width = `calc(${item.span * colWidth}% - 4px)`;
    el.style.backgroundColor = bgColor;

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

  /**
   * Render the "+N more" indicator for a column
   */
  private renderMoreIndicator(
    colIdx: number,
    hiddenEvents: CalendarEvent[],
    day: { date: T; dateStr: string },
    columnCount: number,
    visibleMaxSlot: number,
    onEventClick?: (event: CalendarEvent) => void,
  ): HTMLElement {
    const el = createElement("div", "tg-more-indicator");
    el.textContent = `+${hiddenEvents.length} more`;

    // Calculate position
    const colWidth = 100 / columnCount;
    const xOffset = colIdx * colWidth;
    const yOffset = 26 + (visibleMaxSlot + 1) * 28 + 2; // Position below visible events

    el.style.left = `calc(${xOffset}% + 2px)`;
    el.style.top = `${yOffset}px`;
    el.style.width = `calc(${colWidth}% - 4px)`;

    // Convert adapter date to native Date
    const dateObj = new Date(
      this.adapter.year(day.date),
      this.adapter.month(day.date),
      this.adapter.date(day.date),
    );

    // Click handler for popover
    el.addEventListener("click", (e) => {
      e.stopPropagation();

      const defaultRender = () => {
        this.renderDefaultPopover(el, hiddenEvents, dateObj, onEventClick);
      };

      if (this.onRenderMoreEventsPopover) {
        this.onRenderMoreEventsPopover(
          hiddenEvents,
          dateObj,
          el,
          defaultRender,
        );
      } else {
        defaultRender();
      }
    });

    return el;
  }

  /**
   * Render the default popover for hidden events
   */
  private renderDefaultPopover(
    anchorEl: HTMLElement,
    events: CalendarEvent[],
    date: Date,
    onEventClick?: (event: CalendarEvent) => void,
  ): void {
    // Close any existing popover
    this.closePopover();

    // Create popover container
    const popover = createElement("div", "tg-more-popover");
    this.activePopover = popover;

    // Header with date
    const header = createElement("div", "tg-more-popover-header");
    header.textContent = date.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
    popover.appendChild(header);

    // Event list
    const list = createElement("div", "tg-more-popover-list");
    for (const event of events) {
      const item = createElement("div", "tg-more-popover-item");

      // Color indicator
      const colorDot = createElement("span", "tg-more-popover-dot");
      colorDot.style.backgroundColor = event.color || "#3b82f6";
      item.appendChild(colorDot);

      // Title
      const title = createElement("span", "tg-more-popover-title");
      title.textContent = event.title;
      item.appendChild(title);

      // Click handler
      if (onEventClick) {
        item.addEventListener("click", (e) => {
          e.stopPropagation();
          this.closePopover();
          onEventClick(event);
        });
        item.style.cursor = "pointer";
      }

      list.appendChild(item);
    }
    popover.appendChild(list);

    // Position the popover
    document.body.appendChild(popover);
    this.positionPopover(popover, anchorEl);

    // Set up close handler
    this.popoverCloseHandler = (e: MouseEvent) => {
      if (!popover.contains(e.target as Node) && e.target !== anchorEl) {
        this.closePopover();
      }
    };

    // Delay adding the click listener to prevent immediate close
    setTimeout(() => {
      document.addEventListener("click", this.popoverCloseHandler!);
    }, 0);
  }

  /**
   * Position the popover relative to the anchor element
   */
  private positionPopover(popover: HTMLElement, anchorEl: HTMLElement): void {
    const anchorRect = anchorEl.getBoundingClientRect();
    const popoverRect = popover.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    // Default: position below the anchor
    let top = anchorRect.bottom + 4;
    let left = anchorRect.left;

    // Adjust if popover would go off the bottom
    if (top + popoverRect.height > viewportHeight - 8) {
      top = anchorRect.top - popoverRect.height - 4;
    }

    // Adjust if popover would go off the right
    if (left + popoverRect.width > viewportWidth - 8) {
      left = viewportWidth - popoverRect.width - 8;
    }

    // Ensure popover doesn't go off the left
    if (left < 8) {
      left = 8;
    }

    popover.style.top = `${top}px`;
    popover.style.left = `${left}px`;
  }

  /**
   * Close the active popover
   */
  private closePopover(): void {
    if (this.activePopover) {
      this.activePopover.remove();
      this.activePopover = null;
    }

    if (this.popoverCloseHandler) {
      document.removeEventListener("click", this.popoverCloseHandler);
      this.popoverCloseHandler = null;
    }
  }
}
