/**
 * Main Calendar class - the primary public API
 *
 * Supports extensible view system with:
 * - Built-in views (month, week, day)
 * - Custom view registration
 * - View class extension via standard inheritance
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
import { DragController } from "./DragController";
import { EventManager } from "./EventManager";
import { InteractionController } from "./InteractionController";
import { applyThemeVariables } from "../styles";
import { createElement, clearElement } from "../utils/dom";
import { DEFAULT_DATE_FORMATS, INTERNAL_DATA_FORMAT } from "../constants";
import {
  ViewRegistry,
  defaultViewRegistry,
  BaseView,
  MonthView,
  WeekView,
  DayView,
  type ViewContext,
  type ViewMeta,
  type ViewClass,
  type ViewRegistrationOptions,
} from "../views";

/**
 * Extended calendar configuration with view registry support
 */
export interface ExtendedCalendarConfig extends CalendarConfig {
  /**
   * Custom view registry instance
   * If not provided, uses the default global registry
   */
  viewRegistry?: ViewRegistry;
  /**
   * Whether to register built-in views automatically
   * @default true
   */
  registerBuiltInViews?: boolean;
}

/**
 * TaskGenius Calendar Component
 *
 * A lightweight, configurable calendar with drag-and-drop support
 * and extensible view system.
 *
 * @example Basic usage
 * ```typescript
 * const calendar = new Calendar('#app', {
 *   view: { type: 'week' },
 *   events: [
 *     { id: '1', title: 'Meeting', start: '2025-11-20 10:00', end: '2025-11-20 11:30' }
 *   ]
 * });
 * ```
 *
 * @example Custom view registration
 * ```typescript
 * // Define a custom view with required static meta
 * class CustomView extends BaseView {
 *   static readonly meta: ViewMeta = { type: 'custom', label: 'Custom', shortLabel: 'C', order: 40 };
 *
 *   render(container, events) {
 *     // Custom rendering logic
 *   }
 * }
 *
 * // Register and use
 * const calendar = new Calendar('#app', {});
 * calendar.registerView(CustomView);
 * calendar.setView('custom');
 * ```
 *
 * @example Extending existing views via class inheritance
 * ```typescript
 * class ExtendedMonthView extends MonthView {
 *   static readonly meta: ViewMeta = { type: 'extended-month', label: 'Extended Month', shortLabel: 'EM' };
 *
 *   render(container, events, options) {
 *     super.render(container, events, options);
 *     // Add custom elements after base rendering
 *   }
 * }
 *
 * calendar.registerView(ExtendedMonthView);
 * ```
 */
export class Calendar<T = Dayjs> {
  private container: HTMLElement;
  private config: ResolvedCalendarConfig;
  private adapter: DateAdapter<T>;
  private currentDate: T;
  private currentViewType: string;
  private eventManager: EventManager;
  private dragController: DragController<T>;
  private interactionController: InteractionController<T>;

  // View system
  private viewRegistry: ViewRegistry;
  private activeView: BaseView<T> | null = null;
  private viewContext!: ViewContext<T>;

  /**
   * Create a new Calendar instance
   *
   * @param containerSelector - CSS selector or HTMLElement for the calendar container
   * @param config - Calendar configuration options
   */
  constructor(
    containerSelector: string | HTMLElement,
    config: ExtendedCalendarConfig = {},
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
    this.currentViewType = this.config.view.type;

    // 4. Initialize event manager
    this.eventManager = new EventManager(config.events);

    // 5. Initialize drag controller
    this.dragController = new DragController<T>(
      this.adapter,
      this.config.draggable,
      this.handleEventDrop.bind(this),
      this.handleEventResize.bind(this),
      this.config.theme.cellHeight,
      this.config.dateFormats,
    );

    // 5.5. Initialize interaction controller
    this.interactionController = new InteractionController<T>(
      this.adapter,
      this.config,
      this.dragController,
      () => this.currentViewType as ViewType,
      this.eventManager,
    );

    // 6. Initialize view registry
    this.viewRegistry = config.viewRegistry || defaultViewRegistry;

    // 7. Register built-in views if needed
    if (config.registerBuiltInViews !== false) {
      this.registerBuiltInViews();
    }

    // 8. Create view context
    this.viewContext = this.createViewContext();

    // 9. Initial render
    this.render();
  }

  // ==========================================================================
  // View Management Public API
  // ==========================================================================

  /**
   * Register a custom view
   *
   * @param ViewClassArg - View class extending BaseView with static meta
   * @param options - Registration options
   *
   * @example
   * ```typescript
   * class CustomView extends BaseView {
   *   static readonly meta: ViewMeta = { type: 'custom', label: 'Custom', shortLabel: 'C' };
   *   render(container, events) { ... }
   * }
   *
   * calendar.registerView(CustomView);
   * ```
   */
  registerView(
    ViewClassArg: ViewClass<T>,
    options?: ViewRegistrationOptions,
  ): void {
    this.viewRegistry.register(ViewClassArg, options);
    // Re-render to update view switcher if needed
    this.render();
  }

  /**
   * Unregister a view by type
   *
   * @param type - View type to unregister
   * @returns true if view was removed
   */
  unregisterView(type: string): boolean {
    const result = this.viewRegistry.unregister(type);
    if (result) {
      // If current view was unregistered, switch to first available
      if (this.currentViewType === type) {
        const types = this.viewRegistry.getTypes();
        if (types.length > 0) {
          this.setView(types[0]!);
        }
      }
      this.render();
    }
    return result;
  }

  /**
   * Get all registered view metadata
   *
   * @returns Array of view metadata sorted by order
   */
  getRegisteredViews(): ViewMeta[] {
    return this.viewRegistry.getAll();
  }

  /**
   * Check if a view type is registered
   *
   * @param type - View type to check
   */
  hasView(type: string): boolean {
    return this.viewRegistry.has(type);
  }

  /**
   * Get the view registry for advanced manipulation
   */
  getViewRegistry(): ViewRegistry {
    return this.viewRegistry;
  }

  /**
   * Set the calendar view type
   *
   * @param type - View type (built-in or custom registered type)
   */
  setView(type: string): void {
    if (!this.viewRegistry.has(type)) {
      console.warn(`View type '${type}' is not registered. Ignoring.`);
      return;
    }

    // Unmount previous view
    if (this.activeView) {
      this.activeView.onUnmount();
    }

    this.currentViewType = type;
    this.config.onViewChange?.(type as ViewType);
    this.render();
  }

  /**
   * Get the current view type
   */
  getView(): string {
    return this.currentViewType;
  }

  /**
   * Get the active view instance
   */
  getActiveView(): BaseView<T> | null {
    return this.activeView;
  }

  // ==========================================================================
  // Event Management Public API
  // ==========================================================================

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

  // ==========================================================================
  // Navigation Public API
  // ==========================================================================

  /**
   * Navigate to next period
   */
  next(): void {
    const unit = this.getNavigationUnit();
    this.currentDate = this.adapter.add(this.currentDate, 1, unit);
    this.viewContext.currentDate = this.currentDate;
    this.config.onDateChange?.(this.toDate(this.currentDate));
    this.render();
  }

  /**
   * Navigate to previous period
   */
  prev(): void {
    const unit = this.getNavigationUnit();
    this.currentDate = this.adapter.add(this.currentDate, -1, unit);
    this.viewContext.currentDate = this.currentDate;
    this.config.onDateChange?.(this.toDate(this.currentDate));
    this.render();
  }

  /**
   * Navigate to today
   */
  today(): void {
    this.currentDate = this.adapter.create();
    this.viewContext.currentDate = this.currentDate;
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
    this.viewContext.currentDate = this.currentDate;
    this.config.onDateChange?.(this.toDate(this.currentDate));
    this.render();
  }

  /**
   * Get the current date in ISO format
   *
   * @returns Date string in YYYY-MM-DD format (ISO 8601)
   */
  getCurrentDate(): string {
    return this.adapter.format(this.currentDate, INTERNAL_DATA_FORMAT.date);
  }

  // ==========================================================================
  // Utility Public API
  // ==========================================================================

  /**
   * Destroy the calendar instance and cleanup
   */
  destroy(): void {
    if (this.activeView) {
      this.activeView.onUnmount();
    }
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

  private registerBuiltInViews(): void {
    // Register built-in views if not already registered
    if (!this.viewRegistry.has("month")) {
      this.viewRegistry.register(MonthView as ViewClass);
    }
    if (!this.viewRegistry.has("week")) {
      this.viewRegistry.register(WeekView as ViewClass);
    }
    if (!this.viewRegistry.has("day")) {
      this.viewRegistry.register(DayView as ViewClass);
    }
  }

  private createViewContext(): ViewContext<T> {
    return {
      currentDate: this.currentDate,
      adapter: this.adapter,
      eventManager: this.eventManager,
      dragController: this.dragController,
      config: this.config,
      requestRender: () => this.render(),
      goToDate: (date: T | string | Date) => {
        // Handle all date input types via the adapter
        if (typeof date === "string" || date instanceof Date) {
          this.goToDate(date);
        } else {
          // For adapter-native type T, convert to Date first
          const nativeDate = this.toDate(date);
          this.goToDate(nativeDate);
        }
      },
      getCurrentView: () => this.currentViewType as ViewType,
    };
  }

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
    const mainContainer = createElement("div", "tg-calendar");
    this.applyTheme(mainContainer);

    // Get or create view instance BEFORE rendering header
    // This ensures activeView is set correctly for getHeaderTitle()
    const view = this.getOrCreateView();
    if (view) {
      // Update context
      this.viewContext.currentDate = this.currentDate;
    }

    // Render header with dynamic view switcher (after view is created)
    const header = this.renderHeader();
    mainContainer.appendChild(header);

    // Render view body
    const viewBody = createElement("div", "tg-view-container");

    if (view) {
      // Render view
      view.render(viewBody, this.eventManager.getEvents(), {
        preservedScrollTop,
      });
    }

    mainContainer.appendChild(viewBody);
    this.container.appendChild(mainContainer);

    // Initialize interaction listeners
    this.interactionController.init(mainContainer);
  }

  private getOrCreateView(): BaseView<T> | null {
    // Check if we need to switch views
    if (
      this.activeView &&
      this.activeView.getMeta().type === this.currentViewType
    ) {
      return this.activeView;
    }

    // Unmount previous view
    if (this.activeView) {
      this.activeView.onUnmount();
    }

    // Create new view
    const view = this.viewRegistry.create<T>(this.currentViewType);
    if (!view) {
      console.error(`Failed to create view: ${this.currentViewType}`);
      return null;
    }

    // Initialize and mount
    view.init(this.viewContext);
    view.onMount();
    this.activeView = view;

    return view;
  }

  private renderHeader(): HTMLElement {
    const header = createElement("div", "tg-header");

    // Title
    const title = createElement("h1", "tg-title");
    title.textContent = this.getHeaderTitle();
    header.appendChild(title);

    // View switcher - dynamically populated from registry
    const viewSwitch = createElement("div", "tg-view-switch");
    const registeredViews = this.viewRegistry.getAll();

    for (const viewMeta of registeredViews) {
      const btn = createElement("button", "tg-view-btn");
      btn.textContent = viewMeta.shortLabel || viewMeta.label.charAt(0);
      btn.title = viewMeta.label;
      btn.dataset["viewType"] = viewMeta.type;

      if (this.currentViewType === viewMeta.type) {
        btn.classList.add("tg-active");
      }

      btn.onclick = () => this.setView(viewMeta.type);
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
    // Use active view's header title if available
    if (this.activeView) {
      return this.activeView.getHeaderTitle();
    }

    // Fallback to default
    const format =
      this.currentViewType === "day"
        ? this.config.headerFormat.day
        : this.config.headerFormat.month;
    return this.adapter.format(this.currentDate, format);
  }

  private getNavigationUnit(): "year" | "month" | "week" | "day" {
    // Use active view's navigation unit if available
    if (this.activeView) {
      return this.activeView.getNavigationUnit();
    }

    // Fallback to default based on view type
    switch (this.currentViewType) {
      case "month":
        return "month";
      case "week":
        return "week";
      case "day":
        return "day";
      default:
        return "month";
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
    newStart: Date,
    newEnd: Date,
  ): void {
    // IMPORTANT: Call the callback BEFORE updating internal state
    this.config.onEventDrop?.(event, newStart, newEnd);

    // Convert Date objects to ISO format strings for internal event storage
    const newStartStr = this.adapter.format(
      this.adapter.create(newStart),
      INTERNAL_DATA_FORMAT.dateTime,
    );
    const newEndStr = this.adapter.format(
      this.adapter.create(newEnd),
      INTERNAL_DATA_FORMAT.dateTime,
    );

    this.eventManager.updateEvent(event.id, {
      start: newStartStr,
      end: newEndStr,
    });
  }

  private handleEventResize(
    event: CalendarEvent,
    newStart: Date,
    newEnd: Date,
  ): void {
    // IMPORTANT: Call the callback BEFORE updating internal state
    this.config.onEventResize?.(event, newStart, newEnd);

    // Convert Date objects to ISO format strings for internal event storage
    const newStartStr = this.adapter.format(
      this.adapter.create(newStart),
      INTERNAL_DATA_FORMAT.dateTime,
    );
    const newEndStr = this.adapter.format(
      this.adapter.create(newEnd),
      INTERNAL_DATA_FORMAT.dateTime,
    );

    this.eventManager.updateEvent(event.id, {
      start: newStartStr,
      end: newEndStr,
    });
  }

  private mergeConfig(config: CalendarConfig): ResolvedCalendarConfig {
    // Merge dateFormats with defaults
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

    // Add optional properties only if they exist
    if (config.view?.maxEventsPerRow !== undefined) {
      resolvedView.maxEventsPerRow = config.view.maxEventsPerRow;
    }

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
    if (config.onEventResize) resolved.onEventResize = config.onEventResize;
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
    if (config.onRenderMoreEventsPopover)
      resolved.onRenderMoreEventsPopover = config.onRenderMoreEventsPopover;

    return resolved;
  }

  private applyTheme(target: HTMLElement): void {
    applyThemeVariables(target, this.config.theme);
  }
}
