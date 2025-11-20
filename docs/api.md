# API Reference

Complete API documentation for @taskgenius/calendar.

## Calendar

The main entry point for creating and managing calendar instances.

### Constructor

```typescript
new Calendar(container: string | HTMLElement, config?: CalendarConfig)
```

Creates a new calendar instance.

**Parameters:**

- `container` - CSS selector string (e.g., `'#calendar'`) or HTMLElement
- `config` - Optional configuration object

**Example:**

```typescript
import { Calendar } from '@taskgenius/calendar';

const calendar = new Calendar('#app', {
  view: { type: 'week' },
  events: [...],
  onEventClick: (event) => console.log(event)
});
```

### Methods

#### View Management

##### `setView(type: ViewType): void`

Switch between different calendar views.

**Parameters:**
- `type` - One of `'month'`, `'week'`, or `'day'`

**Example:**
```typescript
calendar.setView('month');
```

##### `getView(): ViewType`

Get the current view type.

**Returns:** The current view type (`'month'`, `'week'`, or `'day'`)

#### Event Management

##### `addEvent(event: CalendarEvent): void`

Add a new event to the calendar.

**Parameters:**
- `event` - Event object conforming to `CalendarEvent` interface

**Example:**
```typescript
calendar.addEvent({
  id: 'evt-1',
  title: 'Team Meeting',
  start: '2025-11-20 10:00',
  end: '2025-11-20 11:30',
  color: '#3b82f6'
});
```

##### `removeEvent(id: string): void`

Remove an event by its ID.

**Parameters:**
- `id` - Unique identifier of the event to remove

##### `updateEvent(id: string, updates: Partial<CalendarEvent>): void`

Update properties of an existing event.

**Parameters:**
- `id` - Event identifier
- `updates` - Partial event object with properties to update

**Example:**
```typescript
calendar.updateEvent('evt-1', {
  title: 'Updated Meeting Title',
  color: '#ef4444'
});
```

##### `getEvents(): CalendarEvent[]`

Get all events.

**Returns:** Array of all calendar events

##### `setEvents(events: CalendarEvent[]): void`

Replace all events with a new array.

**Parameters:**
- `events` - New array of events

#### Navigation

##### `next(): void`

Navigate to the next time period (month/week/day depending on current view).

##### `prev(): void`

Navigate to the previous time period.

##### `today(): void`

Navigate to today's date.

##### `goToDate(date: string | Date): void`

Navigate to a specific date.

**Parameters:**
- `date` - Target date (string in ISO format or Date object)

**Example:**
```typescript
calendar.goToDate('2025-12-25');
```

##### `getCurrentDate(): string`

Get the current displayed date.

**Returns:** Date string in ISO format

#### Lifecycle

##### `refresh(): void`

Force a re-render of the calendar.

##### `destroy(): void`

Cleanup and remove the calendar instance. Removes all event listeners and DOM elements.

**Example:**
```typescript
calendar.destroy();
```

---

## Configuration

### CalendarConfig

Main configuration interface for the calendar.

```typescript
interface CalendarConfig {
  view?: ViewConfig;
  events?: CalendarEvent[];
  draggable?: DraggableConfig;
  theme?: ThemeConfig;
  dateAdapter?: DateAdapter<unknown>;
  onEventClick?: (event: CalendarEvent) => void;
  onEventDrop?: (event: CalendarEvent, newStart: string, newEnd: string) => void;
  onViewChange?: (viewType: ViewType) => void;
  onDateChange?: (date: string) => void;
}
```

### ViewConfig

Configuration for calendar views.

```typescript
interface ViewConfig {
  type: 'month' | 'week' | 'day';
  showDateHeader?: boolean;      // Default: true
  showWeekNumbers?: boolean;     // Default: false
}
```

**Properties:**
- `type` - Initial view type
- `showDateHeader` - Show date headers in time-based views
- `showWeekNumbers` - Show week numbers in month view

### DraggableConfig

Configuration for drag-and-drop functionality.

```typescript
interface DraggableConfig {
  enabled: boolean;              // Default: true
  snapMinutes?: number;          // Default: 15
  ghostOpacity?: number;         // Default: 0.5
}
```

**Properties:**
- `enabled` - Enable/disable drag-and-drop
- `snapMinutes` - Snap dragged events to minute intervals
- `ghostOpacity` - Opacity of ghost element during drag (0-1)

### ThemeConfig

Configuration for styling and theming.

```typescript
interface ThemeConfig {
  primaryColor?: string;         // Default: '#3b82f6'
  cellHeight?: number;           // Default: 60 (pixels per hour)
  fontSize?: {
    header?: string;             // Default: '14px'
    event?: string;              // Default: '12px'
  };
}
```

**Properties:**
- `primaryColor` - Primary accent color (CSS color value)
- `cellHeight` - Height of each hour cell in pixels
- `fontSize.header` - Font size for headers
- `fontSize.event` - Font size for events

---

## Types

### CalendarEvent

Represents a calendar event.

```typescript
interface CalendarEvent {
  id: string;
  title: string;
  start: string;                 // ISO 8601: 'YYYY-MM-DD HH:mm'
  end: string;                   // ISO 8601: 'YYYY-MM-DD HH:mm'
  color?: string;                // CSS color value
  metadata?: Record<string, unknown>;
}
```

**Properties:**
- `id` - Unique identifier (required)
- `title` - Display title (required)
- `start` - Start date/time in ISO format (required)
- `end` - End date/time in ISO format (required)
- `color` - Custom color (optional, defaults to theme primary color)
- `metadata` - Custom data for the event (optional)

### ViewType

```typescript
type ViewType = 'month' | 'week' | 'day';
```

Available calendar view types.

---

## Callbacks

### onEventClick

Called when an event is clicked.

```typescript
onEventClick?: (event: CalendarEvent) => void
```

**Example:**
```typescript
const calendar = new Calendar('#app', {
  onEventClick: (event) => {
    alert(`Clicked: ${event.title}`);
  }
});
```

### onEventDrop

Called when an event is moved or resized via drag-and-drop.

```typescript
onEventDrop?: (event: CalendarEvent, newStart: string, newEnd: string) => void
```

**Parameters:**
- `event` - The event that was moved
- `newStart` - New start date/time in ISO format
- `newEnd` - New end date/time in ISO format

**Example:**
```typescript
const calendar = new Calendar('#app', {
  onEventDrop: (event, newStart, newEnd) => {
    // Update backend
    updateEventInDatabase(event.id, { start: newStart, end: newEnd });
  }
});
```

### onViewChange

Called when the view type changes.

```typescript
onViewChange?: (viewType: ViewType) => void
```

### onDateChange

Called when navigating to a different date.

```typescript
onDateChange?: (date: string) => void
```

**Parameters:**
- `date` - New date in ISO format

---

## Examples

### Basic Usage

```typescript
import { Calendar } from '@taskgenius/calendar';

const calendar = new Calendar('#calendar-container', {
  view: { type: 'week' },
  events: [
    {
      id: '1',
      title: 'Meeting',
      start: '2025-11-20 10:00',
      end: '2025-11-20 11:30'
    }
  ]
});
```

### With Custom Theme

```typescript
const calendar = new Calendar('#app', {
  theme: {
    primaryColor: '#8b5cf6',
    cellHeight: 80,
    fontSize: {
      header: '16px',
      event: '14px'
    }
  }
});
```

### With Event Handlers

```typescript
const calendar = new Calendar('#app', {
  onEventClick: (event) => {
    showEventModal(event);
  },
  onEventDrop: async (event, newStart, newEnd) => {
    try {
      await updateEvent(event.id, { start: newStart, end: newEnd });
      console.log('Event updated successfully');
    } catch (error) {
      console.error('Failed to update event:', error);
      calendar.refresh(); // Revert on error
    }
  }
});
```

### Dynamic Event Management

```typescript
// Add event
calendar.addEvent({
  id: 'new-event',
  title: 'New Task',
  start: '2025-11-20 14:00',
  end: '2025-11-20 15:00'
});

// Update event
calendar.updateEvent('new-event', {
  title: 'Updated Task',
  color: '#22c55e'
});

// Remove event
calendar.removeEvent('new-event');

// Replace all events
calendar.setEvents(fetchedEvents);
```

### View Switching

```typescript
// Switch views
calendar.setView('month');
calendar.setView('week');
calendar.setView('day');

// Navigate
calendar.next();
calendar.prev();
calendar.today();
calendar.goToDate('2025-12-25');

// Get current view
const currentView = calendar.getView(); // 'month', 'week', or 'day'
```
