/**
 * Main Calendar class - the primary public API
 */
import type { Dayjs } from "dayjs";
import type {
  CalendarConfig,
  CalendarEvent,
  ViewType,
  ResolvedCalendarConfig,
  DateAdapter,
} from "../types";
import { DayJsAdapter } from "../adapters/DayJsAdapter";
import { MonthEngine } from "../engines/MonthEngine";
import { TimeEngine } from "../engines/TimeEngine";
import { MonthRenderer } from "../renderers/MonthRenderer";
import { TimeRenderer } from "../renderers/TimeRenderer";
import { DragController } from "./DragController";
import { EventManager } from "./EventManager";
import { InteractionController } from "./InteractionController";
import { applyThemeVariables } from "../styles";
import { createElement, clearElement } from "../utils/dom";
import { DEFAULT_DATE_FORMATS, INTERNAL_DATA_FORMAT } from "../constants";

/**
 * TaskGenius Calendar Component
 *
 * A lightweight, configurable calendar with drag-and-drop support.
 *
 * @example
 * ```typescript
 * const calendar = new Calendar('#app', {
 *   view: { type: 'week' },
 *   events: [
 *     { id: '1', title: 'Meeting', start: '2025-11-20 10:00', end: '2025-11-20 11:30' }
 *   ]
 * });
 * ```
 */
export class Calendar<T = Dayjs> {
  private container: HTMLElement;
  private config: ResolvedCalendarConfig;
  private adapter: DateAdapter<T>;
  private currentDate: T;
  private currentView: ViewType;
  private eventManager: EventManager;
  private dragController: DragController<T>;
  private interactionController: InteractionController<T>;

  // Engines
  private monthEngine: MonthEngine<T>;
  private timeEngine: TimeEngine<T>;

  // Renderers
  private monthRenderer: MonthRenderer<T>;
  private timeRenderer: TimeRenderer<T>;

  /**
   * Create a new Calendar instance
   *
   * @param containerSelector - CSS selector or HTMLElement for the calendar container
   * @param config - Calendar configuration options
   */
  constructor(
    containerSelector: string | HTMLElement,
    config: CalendarConfig = {},
  ) {
    // 1. Initialize container
    if (typeof containerSelector === "string") {
      const el = document.querySelector(containerSelector);
      if (!el) {
        throw new Error(`Calendar container not found: ${containerSelector}`);
      }
      this.container = el as HTMLElement;
    } else {
      this.container = containerSelector;
    }

    // 2. Merge configuration with defaults
    this.config = this.mergeConfig(config);

    // 3. Initialize date adapter
    this.adapter = (config.dateAdapter || new DayJsAdapter()) as DateAdapter<T>;
    this.currentDate = this.adapter.create();
    this.currentView = this.config.view.type;

    // 4. Initialize event manager
    this.eventManager = new EventManager(config.events);

    // 5. Initialize drag controller
    this.dragController = new DragController<T>(
      this.adapter,
      this.config.draggable,
      this.handleEventDrop.bind(this),
      this.config.theme.cellHeight,
      this.config.dateFormats,
    );

    // 5.5. Initialize interaction controller
    this.interactionController = new InteractionController<T>(
      this.adapter,
      this.config,
      this.dragController,
      () => this.currentView,
      this.eventManager,
    );

    // 6. Initialize engines
    this.monthEngine = new MonthEngine<T>(
      this.adapter,
      this.config.view.firstDayOfWeek,
      this.config.view.showWeekends,
      this.config.dateFormats,
    );
    this.timeEngine = new TimeEngine<T>(
      this.adapter,
      this.config.theme.cellHeight,
      this.config.view.showWeekends,
      this.config.view.firstDayOfWeek,
      this.config.dateFormats,
    );

    // 7. Initialize renderers
    this.monthRenderer = new MonthRenderer<T>(
      this.monthEngine,
      this.adapter,
      this.config.theme,
      this.config.showEventCounts,
      this.config.dateFormats,
      this.config.onRenderDateCell,
      this.config.onStyleEvent,
    );
    this.timeRenderer = new TimeRenderer<T>(
      this.timeEngine,
      this.adapter,
      this.config.theme,
      this.config.dateFormats,
      this.config.onStyleEvent,
    );

    // 8. Initial render
    this.render();
  }

  // ==========================================================================
  // Public API
  // ==========================================================================

  /**
   * Set the calendar view type
   *
   * @param type - View type ('month', 'week', or 'day')
   */
  setView(type: ViewType): void {
    this.currentView = type;
    this.config.onViewChange?.(type);
    this.render();
  }

  /**
   * Get the current view type
   */
  getView(): ViewType {
    return this.currentView;
  }

  /**
   * Add a new event
   *
   * @param event - Event to add
   */
  addEvent(event: CalendarEvent): void {
    this.eventManager.addEvent(event);
    this.render();
  }

  /**
   * Remove an event by ID
   *
   * @param id - Event ID to remove
   */
  removeEvent(id: string): void {
    this.eventManager.removeEvent(id);
    this.render();
  }

  /**
   * Update an existing event
   *
   * @param id - Event ID to update
   * @param updates - Partial event data to merge
   */
  updateEvent(id: string, updates: Partial<CalendarEvent>): void {
    this.eventManager.updateEvent(id, updates);
    this.render();
  }

  /**
   * Get all events
   */
  getEvents(): CalendarEvent[] {
    return this.eventManager.getEvents();
  }

  /**
   * Set all events (replaces existing)
   *
   * @param events - New events array
   */
  setEvents(events: CalendarEvent[]): void {
    this.eventManager.setEvents(events);
    this.render();
  }

  /**
   * Navigate to next period (month/week/day)
   */
  next(): void {
    const unit = this.getNavigationUnit();
    this.currentDate = this.adapter.add(this.currentDate, 1, unit);
    this.config.onDateChange?.(this.toDate(this.currentDate));
    this.render();
  }

  /**
   * Navigate to previous period (month/week/day)
   */
  prev(): void {
    const unit = this.getNavigationUnit();
    this.currentDate = this.adapter.add(this.currentDate, -1, unit);
    this.config.onDateChange?.(this.toDate(this.currentDate));
    this.render();
  }

  /**
   * Navigate to today
   */
  today(): void {
    this.currentDate = this.adapter.create();
    this.config.onDateChange?.(this.toDate(this.currentDate));
    this.render();
  }

  /**
   * Navigate to a specific date
   *
   * @param date - Date string or Date object
   */
  goToDate(date: string | Date): void {
    this.currentDate = this.adapter.create(date);
    this.config.onDateChange?.(this.toDate(this.currentDate));
    this.render();
  }

  /**
   * Get the current date in ISO format
   *
   * @returns Date string in YYYY-MM-DD format (ISO 8601)
   *
   * Note: This method intentionally returns ISO format regardless of
   * dateFormats configuration to ensure API stability and reliability
   */
  getCurrentDate(): string {
    return this.adapter.format(this.currentDate, INTERNAL_DATA_FORMAT.date);
  }

  /**
   * Destroy the calendar instance and cleanup
   */
  destroy(): void {
    this.dragController.destroy();
    this.interactionController.destroy();
    clearElement(this.container);
  }

  /**
   * Force re-render the calendar
   */
  refresh(): void {
    this.render();
  }

  /**
   * Enable or disable drag-and-drop functionality
   *
   * @param enabled - Whether drag-and-drop should be enabled
   */
  setDraggable(enabled: boolean): void {
    this.config.draggable.enabled = enabled;
  }

  /**
   * Check if drag-and-drop is currently enabled
   */
  isDraggable(): boolean {
    return this.config.draggable.enabled;
  }

  // ==========================================================================
  // Private Methods
  // ==========================================================================

  private render(): void {
    // Save scroll position for time views
    let preservedScrollTop: number | null = null;
    const existingScroll = this.container.querySelector(
      ".tg-time-grid-container",
    );
    if (existingScroll) {
      preservedScrollTop = existingScroll.scrollTop;
    }

    clearElement(this.container);

    // Create main container
    // Layout styles applied via CSS class .tg-calendar
    const mainContainer = createElement("div", "tg-calendar");
    this.applyTheme(mainContainer);

    // Render header
    const header = this.renderHeader();
    mainContainer.appendChild(header);

    // Render view body
    // Layout styles applied via CSS class .tg-view-container
    const viewBody = createElement("div", "tg-view-container");

    const renderCallback = () => this.render();

    if (this.currentView === "month") {
      this.monthRenderer.render(
        viewBody,
        this.currentDate,
        this.eventManager.getEvents(),
        this.dragController,
        renderCallback,
        this.config.onEventClick,
        this.config.view.dayFilter,
      );
    } else {
      this.timeRenderer.render(
        viewBody,
        this.currentDate,
        this.currentView,
        this.eventManager.getEvents(),
        this.dragController,
        renderCallback,
        this.config.onEventClick,
        preservedScrollTop,
        this.config.view.dayFilter,
        this.config.view.timeFilter,
        this.config.view.timeFormatter,
      );
    }

    mainContainer.appendChild(viewBody);
    this.container.appendChild(mainContainer);

    // Initialize interaction listeners
    this.interactionController.init(mainContainer);
  }

  private renderHeader(): HTMLElement {
    const header = createElement("div", "tg-header");

    // Title
    const title = createElement("h1", "tg-title");
    title.textContent = this.getHeaderTitle();
    header.appendChild(title);

    // View switcher
    const viewSwitch = createElement("div", "tg-view-switch");
    const views: Array<{ type: ViewType; label: string }> = [
      { type: "month", label: "M" },
      { type: "week", label: "W" },
      { type: "day", label: "D" },
    ];

    for (const view of views) {
      const btn = createElement("button", "tg-view-btn");
      btn.textContent = view.label;

      if (this.currentView === view.type) {
        btn.classList.add("tg-active");
      }

      btn.onclick = () => this.setView(view.type);
      viewSwitch.appendChild(btn);
    }
    header.appendChild(viewSwitch);

    // Navigation
    const nav = createElement("div", "tg-nav");

    const prevBtn = createElement("button", "tg-nav-btn");
    prevBtn.textContent = "Previous";
    prevBtn.onclick = () => this.prev();
    nav.appendChild(prevBtn);

    const todayBtn = createElement("button", "tg-nav-btn tg-today");
    todayBtn.textContent = "Today";
    todayBtn.onclick = () => this.today();
    nav.appendChild(todayBtn);

    const nextBtn = createElement("button", "tg-nav-btn");
    nextBtn.textContent = "Next";
    nextBtn.onclick = () => this.next();
    nav.appendChild(nextBtn);

    header.appendChild(nav);

    return header;
  }

  private getHeaderTitle(): string {
    const format =
      this.currentView === "day"
        ? this.config.headerFormat.day
        : this.config.headerFormat.month;
    return this.adapter.format(this.currentDate, format);
  }

  private getNavigationUnit(): "month" | "week" | "day" {
    switch (this.currentView) {
      case "month":
        return "month";
      case "week":
        return "week";
      case "day":
        return "day";
    }
  }

  /**
   * Convert adapter date to native Date object
   */
  private toDate(adapterDate: T): Date {
    return new Date(
      this.adapter.year(adapterDate),
      this.adapter.month(adapterDate),
      this.adapter.date(adapterDate),
      this.adapter.hour(adapterDate),
      this.adapter.minute(adapterDate),
    );
  }

  private handleEventDrop(
    event: CalendarEvent,
    newStart: string,
    newEnd: string,
  ): void {
    this.eventManager.updateEvent(event.id, { start: newStart, end: newEnd });
    this.config.onEventDrop?.(event, newStart, newEnd);
  }

  private mergeConfig(config: CalendarConfig): ResolvedCalendarConfig {
    // Merge dateFormats with defaults
    // Support backward compatibility: headerFormat takes precedence over dateFormats defaults
    const dateFormats = {
      date: config.dateFormats?.date || DEFAULT_DATE_FORMATS.date,
      dateTime: config.dateFormats?.dateTime || DEFAULT_DATE_FORMATS.dateTime,
      time: config.dateFormats?.time || DEFAULT_DATE_FORMATS.time,
      monthHeader:
        config.dateFormats?.monthHeader ||
        config.headerFormat?.month ||
        DEFAULT_DATE_FORMATS.monthHeader,
      dayHeader:
        config.dateFormats?.dayHeader ||
        config.headerFormat?.day ||
        DEFAULT_DATE_FORMATS.dayHeader,
    };

    // Backward compatibility: convert showWeekends=false to dayFilter
    let dayFilter = config.view?.dayFilter;
    if (!dayFilter && config.view?.showWeekends === false) {
      dayFilter = (
        _date: unknown,
        context: import("../types").DayFilterContext,
      ) => {
        return !context.isWeekend;
      };
    }

    const resolvedView: ResolvedCalendarConfig["view"] = {
      type: config.view?.type || "week",
      showDateHeader: config.view?.showDateHeader ?? true,
      showWeekNumbers: config.view?.showWeekNumbers ?? false,
      firstDayOfWeek: config.view?.firstDayOfWeek ?? 0,
      showWeekends: config.view?.showWeekends ?? true,
    };

    // Add filter functions only if they exist (for exactOptionalPropertyTypes)
    if (dayFilter) {
      resolvedView.dayFilter = dayFilter;
    }
    if (config.view?.timeFilter) {
      resolvedView.timeFilter = config.view.timeFilter;
    }
    if (config.view?.timeFormatter) {
      resolvedView.timeFormatter = config.view.timeFormatter;
    }

    const resolved: ResolvedCalendarConfig = {
      view: resolvedView,
      draggable: {
        enabled: config.draggable?.enabled ?? true,
        snapMinutes: config.draggable?.snapMinutes ?? 15,
        ghostOpacity: config.draggable?.ghostOpacity ?? 0.5,
        dateOnly: config.draggable?.dateOnly ?? false,
      },
      theme: {
        primaryColor: config.theme?.primaryColor || "#3b82f6",
        cellHeight: config.theme?.cellHeight || 60,
        fontSize: {
          header: config.theme?.fontSize?.header || "14px",
          event: config.theme?.fontSize?.event || "12px",
        },
      },
      showEventCounts: config.showEventCounts ?? false,
      dateFormats,
      headerFormat: {
        month: dateFormats.monthHeader,
        day: dateFormats.dayHeader,
      },
    };

    if (config.onEventClick) resolved.onEventClick = config.onEventClick;
    if (config.onEventDoubleClick)
      resolved.onEventDoubleClick = config.onEventDoubleClick;
    if (config.onEventContextMenu)
      resolved.onEventContextMenu = config.onEventContextMenu;
    if (config.onEventDrop) resolved.onEventDrop = config.onEventDrop;
    if (config.onViewChange) resolved.onViewChange = config.onViewChange;
    if (config.onDateChange) resolved.onDateChange = config.onDateChange;
    if (config.onDateClick) resolved.onDateClick = config.onDateClick;
    if (config.onDateDoubleClick)
      resolved.onDateDoubleClick = config.onDateDoubleClick;
    if (config.onDateContextMenu)
      resolved.onDateContextMenu = config.onDateContextMenu;
    if (config.onTimeSlotClick)
      resolved.onTimeSlotClick = config.onTimeSlotClick;
    if (config.onTimeSlotDoubleClick)
      resolved.onTimeSlotDoubleClick = config.onTimeSlotDoubleClick;
    if (config.onTimeSlotContextMenu)
      resolved.onTimeSlotContextMenu = config.onTimeSlotContextMenu;
    if (config.onDateRangeSelect)
      resolved.onDateRangeSelect = config.onDateRangeSelect;
    if (config.onTimeRangeSelect)
      resolved.onTimeRangeSelect = config.onTimeRangeSelect;
    if (config.onRenderDateCell)
      resolved.onRenderDateCell = config.onRenderDateCell;
    if (config.onStyleEvent) resolved.onStyleEvent = config.onStyleEvent;

    return resolved;
  }

  private applyTheme(target: HTMLElement): void {
    applyThemeVariables(target, this.config.theme);
  }
}
