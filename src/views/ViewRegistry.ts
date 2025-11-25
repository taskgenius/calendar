/**
 * ViewRegistry - Manages registration and retrieval of calendar views
 *
 * Supports:
 * - Type-safe view registration with compile-time validation
 * - Dynamic view discovery
 * - View ordering for UI display
 */
import { BaseView, type ViewClass, type ViewMeta } from "./BaseView";

/**
 * Registration options for custom views
 */
export interface ViewRegistrationOptions {
  /**
   * If true, replaces existing view with same type
   * @default false
   */
  override?: boolean;
}

/**
 * Internal view registration entry
 */
interface ViewEntry {
  /** View constructor */
  ctor: ViewClass;
  /** View metadata (cached from constructor) */
  meta: ViewMeta;
}

/**
 * ViewRegistry manages all registered calendar views
 *
 * @example Basic usage
 * ```typescript
 * const registry = new ViewRegistry();
 *
 * // Register a custom view
 * registry.register(CustomView);
 *
 * // Get all registered views for UI
 * const views = registry.getAll();
 *
 * // Create a view instance
 * const view = registry.create('custom');
 * ```
 *
 * @example Custom view definition
 * ```typescript
 * class CustomView extends BaseView {
 *   static readonly meta: ViewMeta = {
 *     type: 'custom',
 *     label: 'Custom View',
 *     shortLabel: 'C',
 *     order: 40
 *   };
 *
 *   render(container: HTMLElement, events: CalendarEvent[]): void {
 *     // Custom rendering...
 *   }
 * }
 *
 * registry.register(CustomView);
 * ```
 */
export class ViewRegistry {
  private views: Map<string, ViewEntry> = new Map();

  /**
   * Register a view class
   *
   * @param ViewClass - View class extending BaseView with static meta property
   * @param options - Registration options
   * @throws Error if view type already exists and override is false
   * @throws Error if ViewClass is missing required static meta property
   * @throws Error if ViewClass does not extend BaseView
   *
   * @example
   * ```typescript
   * // Define a view with required static meta
   * class MyView extends BaseView {
   *   static readonly meta: ViewMeta = { type: 'my', label: 'My View' };
   *   render(container, events) { ... }
   * }
   *
   * registry.register(MyView);
   * ```
   */
  register<T>(
    ViewClassArg: ViewClass<T>,
    options: ViewRegistrationOptions = {},
  ): void {
    // Validate that ViewClass extends BaseView
    if (
      !(ViewClassArg.prototype instanceof BaseView) &&
      ViewClassArg !== (BaseView as unknown as ViewClass<T>)
    ) {
      throw new Error(
        `View class must extend BaseView. Got: ${ViewClassArg.name || "anonymous class"}`,
      );
    }

    // Type-safe access to meta - ViewClass interface guarantees it exists
    const meta = ViewClassArg.meta;

    // Runtime validation for meta (in case of incorrect usage)
    if (!meta || typeof meta !== "object") {
      throw new Error(
        `View class '${ViewClassArg.name || "anonymous"}' must have a static 'meta' property of type ViewMeta`,
      );
    }

    if (!meta.type || typeof meta.type !== "string") {
      throw new Error(
        `View class '${ViewClassArg.name || "anonymous"}' meta must have a 'type' string property`,
      );
    }

    if (!meta.label || typeof meta.label !== "string") {
      throw new Error(
        `View class '${ViewClassArg.name || "anonymous"}' meta must have a 'label' string property`,
      );
    }

    // Check for existing registration
    if (this.views.has(meta.type) && !options.override) {
      throw new Error(
        `View type '${meta.type}' is already registered. Use { override: true } to replace.`,
      );
    }

    this.views.set(meta.type, {
      ctor: ViewClassArg as ViewClass,
      meta: { ...meta },
    });
  }

  /**
   * Unregister a view by type
   *
   * @param type - View type to unregister
   * @returns true if view was removed, false if not found
   */
  unregister(type: string): boolean {
    return this.views.delete(type);
  }

  /**
   * Check if a view type is registered
   *
   * @param type - View type to check
   */
  has(type: string): boolean {
    return this.views.has(type);
  }

  /**
   * Get view metadata by type
   *
   * @param type - View type
   * @returns View metadata or undefined if not found
   */
  getMeta(type: string): ViewMeta | undefined {
    return this.views.get(type)?.meta;
  }

  /**
   * Create a view instance
   *
   * @param type - View type to create
   * @returns New view instance or undefined if not found
   */
  create<T = unknown>(type: string): BaseView<T> | undefined {
    const entry = this.views.get(type);
    if (!entry) {
      return undefined;
    }

    return new entry.ctor() as BaseView<T>;
  }

  /**
   * Get all registered view metadata, sorted by order then type (stable sort)
   *
   * @returns Array of view metadata sorted by order (ascending), then by type (alphabetical) for stability
   */
  getAll(): ViewMeta[] {
    const metas = Array.from(this.views.values()).map((entry) => entry.meta);

    // Stable sort: primary by order (default 50), secondary by type (alphabetical)
    return metas.sort((a, b) => {
      const orderA = a.order ?? 50;
      const orderB = b.order ?? 50;

      if (orderA !== orderB) {
        return orderA - orderB;
      }

      // Tie-breaker: sort alphabetically by type for stable ordering
      return a.type.localeCompare(b.type);
    });
  }

  /**
   * Get all registered view types
   *
   * @returns Array of view type strings
   */
  getTypes(): string[] {
    return Array.from(this.views.keys());
  }

  /**
   * Clear all registered views
   */
  clear(): void {
    this.views.clear();
  }

  /**
   * Get the number of registered views
   */
  get size(): number {
    return this.views.size;
  }
}

/**
 * Default global view registry instance
 * Used when no custom registry is provided to Calendar
 */
export const defaultViewRegistry = new ViewRegistry();
