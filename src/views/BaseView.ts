/**
 * BaseView - Abstract base class for all calendar views
 *
 * Provides a foundation for creating custom views with:
 * - Lifecycle hooks (mount, unmount, update)
 * - Access to calendar context (events, date, adapter)
 * - Headless mode support for custom rendering
 */
import type {
  CalendarEvent,
  DateAdapter,
  ResolvedCalendarConfig,
  ViewType,
} from "../types";
import type { DragController } from "../core/DragController";
import type { EventManager } from "../core/EventManager";

/**
 * Context provided to views for rendering and interaction
 */
export interface ViewContext<T = unknown> {
  /** Current display date */
  currentDate: T;
  /** Date adapter for date operations */
  adapter: DateAdapter<T>;
  /** Event manager for CRUD operations */
  eventManager: EventManager;
  /** Drag controller for drag-and-drop */
  dragController: DragController<T>;
  /** Resolved calendar configuration */
  config: ResolvedCalendarConfig;
  /** Trigger a re-render of the view */
  requestRender: () => void;
  /**
   * Navigate to a specific date
   * Accepts adapter date type T, string (ISO format), or native Date
   */
  goToDate: (date: T | string | Date) => void;
  /** Get the current view type */
  getCurrentView: () => ViewType;
}

/**
 * View metadata for registration
 * Required for all view classes
 */
export interface ViewMeta {
  /** Unique view type identifier */
  type: string;
  /** Display label for the view switcher */
  label: string;
  /** Short label for compact display (1-2 chars) */
  shortLabel?: string;
  /** Icon class or SVG string (optional) */
  icon?: string;
  /** Sort order in view switcher (lower = first) */
  order?: number;
}

/**
 * Options for view rendering
 */
export interface ViewRenderOptions {
  /** Preserved scroll position from previous render */
  preservedScrollTop?: number | null;
}

/**
 * Interface for view class constructor with required static meta
 * This ensures compile-time type safety for view registration
 */
export interface ViewClass<T = unknown> {
  /** Static metadata required for registration */
  readonly meta: ViewMeta;
  /** Constructor that creates a BaseView instance */
  new (): BaseView<T>;
}

/**
 * Abstract base class for calendar views
 *
 * Subclasses MUST define a static `meta` property with at least `type` and `label`.
 * This is enforced at compile-time via the ViewClass interface.
 *
 * @example Extending BaseView for a custom view
 * ```typescript
 * class CustomView extends BaseView {
 *   static readonly meta: ViewMeta = {
 *     type: 'custom',
 *     label: 'Custom View',
 *     shortLabel: 'C',
 *     order: 100
 *   };
 *
 *   render(container: HTMLElement, events: CalendarEvent[], options?: ViewRenderOptions): void {
 *     // Custom rendering logic
 *   }
 * }
 * ```
 *
 * @example Headless mode (using provided engines/utilities)
 * ```typescript
 * class HeadlessCustomView extends BaseView {
 *   static readonly meta: ViewMeta = { type: 'headless', label: 'Headless' };
 *
 *   render(container: HTMLElement, events: CalendarEvent[]): void {
 *     // Use this.context.adapter for date operations
 *     const weekStart = this.context.adapter.startOf(this.context.currentDate, 'week');
 *
 *     // Use this.context.eventManager for event operations
 *     const allEvents = this.context.eventManager.getEvents();
 *
 *     // Completely custom rendering...
 *   }
 * }
 * ```
 */
export abstract class BaseView<T = unknown> {
  /**
   * View metadata - MUST be defined by subclasses as a static readonly property
   * Used for registration and display in view switcher
   *
   * @example
   * static readonly meta: ViewMeta = { type: 'myview', label: 'My View' };
   */
  static readonly meta: ViewMeta;

  /** View context with calendar state and utilities */
  protected context!: ViewContext<T>;

  /** Whether the view is currently mounted */
  protected mounted = false;

  /**
   * Initialize the view with context
   * Called by the Calendar when switching to this view
   */
  init(context: ViewContext<T>): void {
    this.context = context;
  }

  /**
   * Render the view into the container
   *
   * @param container - DOM element to render into
   * @param events - Events to display
   * @param options - Additional render options
   */
  abstract render(
    container: HTMLElement,
    events: CalendarEvent[],
    options?: ViewRenderOptions,
  ): void;

  /**
   * Called when the view is mounted (first render)
   * Override to add setup logic
   */
  onMount(): void {
    this.mounted = true;
  }

  /**
   * Called when the view is unmounted (switching away)
   * Override to add cleanup logic
   */
  onUnmount(): void {
    this.mounted = false;
  }

  /**
   * Called when events are updated
   * Override for optimized partial updates instead of full re-render
   *
   * @param events - Updated events array
   * @returns true if handled, false to trigger full re-render
   */
  onEventsUpdate(_events: CalendarEvent[]): boolean {
    return false; // Default: trigger full re-render
  }

  /**
   * Called when the current date changes
   * Override for optimized date navigation
   *
   * @param newDate - New current date
   * @returns true if handled, false to trigger full re-render
   */
  onDateChange(_newDate: T): boolean {
    return false; // Default: trigger full re-render
  }

  /**
   * Get the navigation unit for prev/next buttons
   * Override to customize navigation behavior
   */
  getNavigationUnit(): "year" | "month" | "week" | "day" {
    return "month";
  }

  /**
   * Get the header title for this view
   * Override to customize the header display
   */
  getHeaderTitle(): string {
    const format =
      this.getNavigationUnit() === "day"
        ? this.context.config.dateFormats.dayHeader
        : this.context.config.dateFormats.monthHeader;
    return this.context.adapter.format(this.context.currentDate, format);
  }

  /**
   * Check if the view is currently mounted
   */
  isMounted(): boolean {
    return this.mounted;
  }

  /**
   * Get the view metadata from the constructor
   */
  getMeta(): ViewMeta {
    return (this.constructor as ViewClass<T>).meta;
  }
}

/**
 * Type for view constructor (legacy alias for ViewClass)
 * @deprecated Use ViewClass instead for better type safety
 */
export type ViewConstructor<T = unknown> = ViewClass<T>;
