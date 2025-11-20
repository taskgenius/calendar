/**
 * Event data management
 */
import type { CalendarEvent } from '../types';

/**
 * Manages calendar event data with CRUD operations
 */
export class EventManager {
  private events: CalendarEvent[] = [];

  /**
   * Initialize with optional events
   *
   * @param initialEvents - Initial events to load
   */
  constructor(initialEvents?: CalendarEvent[]) {
    if (initialEvents) {
      this.events = [...initialEvents];
    }
  }

  /**
   * Add a new event
   *
   * @param event - Event to add
   */
  addEvent(event: CalendarEvent): void {
    this.events.push(event);
  }

  /**
   * Remove an event by ID
   *
   * @param id - Event ID to remove
   * @returns true if event was found and removed
   */
  removeEvent(id: string): boolean {
    const index = this.events.findIndex(e => e.id === id);

    if (index > -1) {
      this.events.splice(index, 1);
      return true;
    }

    return false;
  }

  /**
   * Update an existing event
   *
   * @param id - Event ID to update
   * @param updates - Partial event data to merge
   * @returns true if event was found and updated
   */
  updateEvent(id: string, updates: Partial<CalendarEvent>): boolean {
    const event = this.events.find(e => e.id === id);

    if (event) {
      Object.assign(event, updates);
      return true;
    }

    return false;
  }

  /**
   * Get all events
   *
   * @returns Copy of events array
   */
  getEvents(): CalendarEvent[] {
    return [...this.events];
  }

  /**
   * Find an event by ID
   *
   * @param id - Event ID to find
   * @returns Event or undefined if not found
   */
  findEvent(id: string): CalendarEvent | undefined {
    return this.events.find(e => e.id === id);
  }

  /**
   * Clear all events
   */
  clear(): void {
    this.events = [];
  }

  /**
   * Set events (replaces all existing)
   *
   * @param events - New events array
   */
  setEvents(events: CalendarEvent[]): void {
    this.events = [...events];
  }

  /**
   * Get number of events
   */
  get count(): number {
    return this.events.length;
  }
}
