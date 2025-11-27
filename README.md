# @taskgenius/calendar

[![npm version](https://badge.fury.io/js/@taskgenius%2Fcalendar.svg)](https://www.npmjs.com/package/@taskgenius/calendar)
[![CI](https://github.com/taskgenius/calendar/actions/workflows/ci.yml/badge.svg)](https://github.com/taskgenius/calendar/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm downloads](https://img.shields.io/npm/dm/@taskgenius/calendar.svg)](https://www.npmjs.com/package/@taskgenius/calendar)

Used in [taskgenius/taskgenius-plugin](https://github.com/taskgenius/taskgenius-plugin)

A lightweight, configurable TypeScript calendar component library with drag-and-drop support.

## Features

- Three view modes - month, week, and day views with dedicated all-day lane
- Extensible view system - register custom views or extend built-ins
- Cross-midnight & multi-day support - timed/all-day events render and drag correctly across days
- Drag-and-drop/resize - move or resize events with optional date-only mode
- Flexible layout controls - first day of week, hide weekends, custom day/time filters
- Overflow handling - event count badges plus configurable "+N more" popover renderer
- Custom rendering hooks - date cells, event styling, event content, and popovers
- Lightweight - <12KB gzipped with zero runtime deps
- Pluggable adapters - Day.js by default, custom adapters supported
- TypeScript first - complete type definitions and SOLID architecture


## Installation

```bash
npm install @taskgenius/calendar dayjs
```

## 🚀 Quick Start

```typescript
import { Calendar } from '@taskgenius/calendar';
import '@taskgenius/calendar/styles.css'; // ⚠️ Required - component uses CSS classes

// Method 1: Pass CSS selector string
const calendar = new Calendar('#app', {
  view: { type: 'week' },
  events: [
    {
      id: '1',
      title: 'Team Meeting',
      start: '2025-11-20 10:00',
      end: '2025-11-20 11:30',
      color: '#3b82f6'
    }
  ],
  onEventClick: (event) => {
    console.log('Clicked:', event.title);
  },
  onEventDrop: (event, newStart, newEnd) => {
    console.log('Moved:', event.title, newStart.toISOString(), newEnd.toISOString());
  }
});

// Method 2: Pass HTMLElement directly
const container = document.getElementById('app');
const calendar2 = new Calendar(container, {
  view: { type: 'month' }
});
```

## 🎨 Styles

**⚠️ Important**: The component **requires** `@taskgenius/calendar/styles.css` to render correctly. Since v0.4.0, all layout and styling use external CSS classes instead of inline styles.

**Import options**:
- **ES modules**: `import '@taskgenius/calendar/styles.css';` (recommended)
- **HTML link**: `<link rel="stylesheet" href="/node_modules/@taskgenius/calendar/dist/styles.css">`

**Customization**:
- Theme settings are delivered via CSS variables: `--tg-primary-color`, `--tg-primary-rgb`, `--tg-cell-height`, `--tg-font-header`, `--tg-font-event`. The library sets these on the `.tg-calendar` root; you can override them in your own styles.
- To fully customize the look, you can override the default CSS or provide your own styles using the exposed `tg-*` class names.

## 📖 API Reference

### Calendar Class

The main entry point for the calendar component.

#### Constructor

```typescript
new Calendar(container: string | HTMLElement, config?: CalendarConfig)
```

**Parameters:**
- `container` - CSS selector string (e.g., `'#app'`) or HTMLElement reference
- `config` - Optional configuration object

**Example:**
```typescript
// Using CSS selector
const cal1 = new Calendar('#calendar', { view: { type: 'week' } });

// Using HTMLElement
const element = document.getElementById('calendar');
const cal2 = new Calendar(element, { view: { type: 'week' } });
```

#### Methods

| Method | Description |
|--------|-------------|
| `registerView(ViewClass, options?)` | Register a custom view (class must expose static `meta`) |
| `unregisterView(type)` | Remove a registered view type |
| `getRegisteredViews()` | Get metadata for all registered views |
| `getViewRegistry()` | Access the view registry instance |
| `hasView(type)` | Check whether a view type is registered |
| `setView(type: ViewType \| string)` | Switch between registered views (built-in or custom) |
| `getView()` | Get current view type |
| `getActiveView()` | Get the active view instance |
| `addEvent(event: CalendarEvent)` | Add a new event |
| `removeEvent(id: string)` | Remove event by ID |
| `updateEvent(id: string, updates: Partial<CalendarEvent>)` | Update event properties |
| `setEvents(events: CalendarEvent[])` | Replace all events |
| `getEvents()` | Get all events |
| `next()` | Navigate to next period |
| `prev()` | Navigate to previous period |
| `today()` | Navigate to today |
| `goToDate(date: string \| Date)` | Navigate to specific date |
| `getCurrentDate()` | Get current displayed date (ISO string) |
| `setDraggable(enabled: boolean)` | Enable or disable drag-and-drop at runtime |
| `isDraggable()` | Check whether drag-and-drop is enabled |
| `refresh()` | Force re-render |
| `destroy()` | Cleanup and remove calendar |

### Configuration

```typescript
interface CalendarConfig {
  view?: ViewConfig;
  events?: CalendarEvent[];
  draggable?: DraggableConfig;
  theme?: ThemeConfig;
  dateAdapter?: DateAdapter<unknown>;  // Custom date adapter (default: Day.js)
  dateFormats?: Partial<DateFormatConfig>;  // Custom date display formats (unicode tokens recommended)
  headerFormat?: {                    // Deprecated: mapped to dateFormats
    month?: string;
    day?: string;
  };
  showEventCounts?: boolean;          // Default: false - Show event count badges on date cells
  
  // Event interactions
  onEventClick?: (event: CalendarEvent) => void;
  onEventDoubleClick?: (event: CalendarEvent) => void;
  onEventContextMenu?: (event: CalendarEvent, x: number, y: number) => void;
  onEventDrop?: (event: CalendarEvent, newStart: Date, newEnd: Date) => void;    // v0.8.0+: Date objects
  onEventResize?: (event: CalendarEvent, newStart: Date, newEnd: Date) => void;  // v0.9.0+: Resize callback
  
  // View and navigation
  onViewChange?: (viewType: ViewType) => void;
  onDateChange?: (date: Date) => void;
  
  // Date cell interactions (month view)
  onDateClick?: (date: Date) => void;
  onDateDoubleClick?: (date: Date) => void;
  onDateContextMenu?: (date: Date, x: number, y: number) => void;
  
  // Time slot interactions (week/day view)
  onTimeSlotClick?: (dateTime: Date) => void;
  onTimeSlotDoubleClick?: (dateTime: Date) => void;
  onTimeSlotContextMenu?: (dateTime: Date, x: number, y: number) => void;
  
  // Range selection (drag to select multiple cells)
  onDateRangeSelect?: (startDate: Date, endDate: Date) => void;
  onTimeRangeSelect?: (startDateTime: Date, endDateTime: Date) => void;
  
  // Rendering hooks
  onRenderDateCell?: (ctx: DateCellContext) => void;      // Custom date cell rendering
  onStyleEvent?: (event: CalendarEvent) => EventStyle;    // Custom event styling
  onRenderEvent?: (ctx: EventRenderContext) => void;      // v0.12.0+: Custom event content
  onRenderMoreEventsPopover?: (                          // v0.10.0+: Custom "+N more" popover renderer
    events: CalendarEvent[],
    date: Date,
    anchorEl: HTMLElement,
    defaultRender: () => void
  ) => void;
}
```

For custom view registries, the constructor also accepts:

```typescript
interface ExtendedCalendarConfig extends CalendarConfig {
  viewRegistry?: ViewRegistry;       // Provide a custom registry
  registerBuiltInViews?: boolean;    // Default: true - auto-register Month/Week/Day views
}
```

#### ViewConfig

```typescript
interface ViewConfig {
  type: 'month' | 'week' | 'day';   // Default: 'week'
  showDateHeader?: boolean;          // Default: true (time views)
  showWeekNumbers?: boolean;         // Default: false (month view)
  firstDayOfWeek?: 0 | 1 | 2 | 3 | 4 | 5 | 6;  // Default: 0 (supports full 0-6 range)
  showWeekends?: boolean;            // Default: true (false is converted to a dayFilter)
  maxEventsPerRow?: number;          // Month view: cap events per row before showing "+N more"
  dayFilter?: (date: unknown, ctx: DayFilterContext) => DayFilterResult; // Hide/customize days
  timeFilter?: (hour: number) => TimeFilterResult;   // Hide/customize time slots
  timeFormatter?: TimeFormatter;     // Custom time axis labels
}
```
`dayFilter`/`timeFilter` can return boolean or config objects (`DayRenderConfig` / `TimeSlotConfig`). Setting `DayRenderConfig.disabled` keeps the cell visible but hides events for that date.

#### DraggableConfig

```typescript
interface DraggableConfig {
  enabled: boolean;      // Default: true
  snapMinutes?: number;  // Default: 15
  ghostOpacity?: number; // Default: 0.5
  dateOnly?: boolean;    // Default: false - Only adjust dates, keep time unchanged
}
```

#### ThemeConfig

```typescript
interface ThemeConfig {
  primaryColor?: string;  // Default: '#3b82f6'
  cellHeight?: number;    // Default: 60 (pixels per hour)
  fontSize?: {
    header?: string;      // Default: '14px'
    event?: string;       // Default: '12px'
  };
}
```

### CalendarEvent

```typescript
interface CalendarEvent {
  id: string;                        // Unique identifier
  title: string;                     // Display title
  start: string;                     // ISO format: 'yyyy-MM-dd HH:mm' (supports cross-midnight spans)
  end: string;                       // ISO format: 'yyyy-MM-dd HH:mm' (use 00:00/23:59 for all-day)
  color?: string;                    // CSS color value
  metadata?: Record<string, unknown>; // Custom data
}
```

## 🎨 Examples

### Basic Usage

```typescript
import { Calendar } from '@taskgenius/calendar';
import '@taskgenius/calendar/styles.css'; // ⚠️ Required

// Initialize with CSS selector
const calendar = new Calendar('#calendar-container');

// Or initialize with DOM element
const element = document.querySelector('.my-calendar');
const calendar2 = new Calendar(element);

// Add event
calendar.addEvent({
  id: '1',
  title: 'Meeting',
  start: '2025-11-20 10:00',
  end: '2025-11-20 11:30',
  color: '#3b82f6'
});

// Switch view
calendar.setView('month');

// Navigate
calendar.next();
calendar.prev();
calendar.today();

// Clean up when done (important to prevent memory leaks)
calendar.destroy();
```

### With Callbacks

```typescript
const calendar = new Calendar('#app', {
  events: myEvents,
  onEventClick: (event) => {
    showEventDetails(event);
  },
  onEventDrop: (event, newStart, newEnd) => {
    // Event was moved to a new position
    console.log('Event moved:', event.title);
    saveEventToServer(event.id, { 
      start: newStart.toISOString(), 
      end: newEnd.toISOString() 
    });
  },
  onEventResize: (event, newStart, newEnd) => {
    // Event duration was changed
    console.log('Event resized:', event.title);
    saveEventToServer(event.id, { 
      start: newStart.toISOString(), 
      end: newEnd.toISOString() 
    });
  },
  onViewChange: (view) => {
    analytics.track('view_changed', { view });
  }
});
```

### Custom Theme

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

### Disable Drag-and-Drop

```typescript
const calendar = new Calendar('#app', {
  draggable: {
    enabled: false
  }
});
```

### Date-Only Drag Mode

```typescript
const calendar = new Calendar('#app', {
  draggable: {
    enabled: true,
    dateOnly: true  // Only adjust dates, preserve original time
  }
});
```

### Week Configuration

```typescript
const calendar = new Calendar('#app', {
  view: {
    type: 'week',
    firstDayOfWeek: 1,  // Start week on Monday
    showWeekends: false  // Hide Saturday and Sunday
  }
});
```

### Day/Time Filtering

```typescript
const calendar = new Calendar('#app', {
  view: {
    type: 'week',
    firstDayOfWeek: 1,
    dayFilter: (_date, ctx) => ctx.isWeekend ? { visible: false } : true, // Hide weekends with config
    timeFilter: (hour) => hour >= 8 && hour < 18,  // Working hours only
    timeFormatter: (hour) => `${hour}:00`          // Custom time axis labels
  }
});
```

### Event Count Badges

```typescript
const calendar = new Calendar('#app', {
  view: { type: 'month' },
  showEventCounts: true  // Display event count on each date cell
});
```

### Month Overflow & "+N more" Popover (v0.10.0+)

```typescript
const calendar = new Calendar('#app', {
  view: {
    type: 'month',
    maxEventsPerRow: 3
  },
  onRenderMoreEventsPopover: (events, date, anchorEl, defaultRender) => {
    console.log('Hidden events on', date.toISOString(), events.length);
    defaultRender(); // Or render a custom popover
  }
});
```

### User Interactions (v0.7.0+)

```typescript
const calendar = new Calendar('#app', {
  view: { type: 'month' },
  
  // Date cell interactions (month view)
  onDateClick: (date) => {
    console.log('Clicked date:', date); // Date object
    showCreateEventDialog(date);
  },
  
  onDateDoubleClick: (date) => {
    console.log('Double-clicked date:', date);
    createQuickEvent(date);
  },
  
  onDateContextMenu: (date, x, y) => {
    console.log('Right-clicked date:', date, 'at position:', x, y);
    showContextMenu(date, x, y);
  },
  
  // Range selection (drag to select)
  onDateRangeSelect: (startDate, endDate) => {
    console.log('Selected range:', startDate, 'to', endDate);
    createMultiDayEvent(startDate, endDate);
  }
});

// For week/day views with time slots
const weekCalendar = new Calendar('#app', {
  view: { type: 'week' },
  
  // Time slot interactions
  onTimeSlotClick: (dateTime) => {
    console.log('Clicked time slot:', dateTime); // Date object with time
    createEventAt(dateTime);
  },
  
  onTimeSlotDoubleClick: (dateTime) => {
    console.log('Double-clicked time slot:', dateTime);
    quickCreateEvent(dateTime);
  },
  
  onTimeSlotContextMenu: (dateTime, x, y) => {
    console.log('Right-clicked time slot:', dateTime);
    showTimeSlotMenu(dateTime, x, y);
  },
  
  // Time range selection (drag to select multiple slots)
  onTimeRangeSelect: (startDateTime, endDateTime) => {
    console.log('Selected time range:', startDateTime, 'to', endDateTime);
    createTimedEvent(startDateTime, endDateTime);
  }
});
```

### Custom Date Formats (v0.8.0+)

```typescript
const calendar = new Calendar('#app', {
  // Customize date display formats (uses Unicode tokens)
  dateFormats: {
    date: 'yyyy/MM/dd',           // Default: 'yyyy-MM-dd'
    dateTime: 'yyyy/MM/dd HH:mm', // Default: 'yyyy-MM-dd HH:mm'
    time: 'HH:mm',                // Default: 'HH:mm'
    monthHeader: 'MMMM yyyy',     // Default: 'yyyy\u5e74M\u6708'
    dayHeader: 'MMMM d, yyyy'     // Default: 'yyyy\u5e74M\u6708d\u65e5'
  }
});
```

**Note**: Date format tokens use Unicode standard (compatible with date-fns, Day.js, and native adapter):
- Year: `yyyy` (2025), `yy` (25)
- Month: `MM` (01-12), `M` (1-12), `MMMM` (January), `MMM` (Jan)
- Day: `dd` (01-31), `d` (1-31)
- Hour: `HH` (00-23), `H` (0-23)
- Minute: `mm` (00-59), `m` (0-59)
- Legacy `headerFormat` is deprecated; it maps to `dateFormats.monthHeader`/`dayHeader` for backward compatibility.

### Custom Date Cell Rendering

```typescript
const calendar = new Calendar('#app', {
  onRenderDateCell: (ctx) => {
    // Add custom badge for past due dates with events
    if (ctx.isPastDue && ctx.events.length > 0) {
      const badge = document.createElement('div');
      badge.className = 'overdue-badge';
      badge.textContent = '!';
      ctx.cellEl.appendChild(badge);
    }
    
    // Add custom class for weekends
    if (ctx.date.getDay() === 0 || ctx.date.getDay() === 6) {
      ctx.cellEl.classList.add('weekend');
    }
  }
});
```

Add corresponding CSS for custom elements:

```css
/* Style custom overdue badge */
.overdue-badge {
  position: absolute;
  top: 2px;
  right: 2px;
  background: #ef4444;
  color: white;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
}

/* Style weekend cells */
.weekend {
  background-color: #fef3c7;
}
```

### Custom Event Styling

```typescript
const calendar = new Calendar('#app', {
  onStyleEvent: (event) => {
    // Style based on metadata
    const priority = event.metadata?.priority as number;
    const isCompleted = event.metadata?.completed as boolean;
    
    return {
      color: priority >= 2 ? '#ef4444' : '#3b82f6',
      opacity: isCompleted ? 0.5 : 1,
      className: isCompleted ? 'completed-event' : ''
    };
  }
});
```

Add CSS for custom event classes (optional):

```css
/* Additional styling for completed events */
.completed-event {
  text-decoration: line-through;
}
```

### Custom Event Rendering (v0.12.0+)

```typescript
const calendar = new Calendar('#app', {
  onRenderEvent: (ctx) => {
    ctx.defaultRender(); // Keep default title/time rendering

    if (ctx.event.metadata?.priority === 'high') {
      const badge = document.createElement('span');
      badge.className = 'priority-badge';
      badge.textContent = '!';
      ctx.el.appendChild(badge);
    }
  }
});
```

## 🏗️ Architecture

The library follows SOLID principles with a modular architecture:

```
src/
├── core/           # Main Calendar class, EventManager, DragController
├── adapters/       # Date library adapters (DayJs, etc.)
├── engines/        # Layout calculation (MonthEngine, TimeEngine)
├── renderers/      # DOM rendering (MonthRenderer, TimeRenderer)
├── styles/         # Static CSS + theme variable helpers (no auto-injection)
├── types/          # TypeScript type definitions
└── utils/          # DOM utilities
```

### Key Components

- **Calendar** - Main API and orchestration
- **EventManager** - CRUD operations for events
- **DragController** - Drag-and-drop interactions
- **MonthEngine/TimeEngine** - Layout calculations
- **MonthRenderer/TimeRenderer** - DOM generation
- **DateAdapter** - Pluggable date library interface

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

## 💡 Best Practices

### Memory Management

Always call `destroy()` when you no longer need the calendar instance to prevent memory leaks:

```typescript
// In React
useEffect(() => {
  const calendar = new Calendar(containerRef.current, config);
  
  return () => {
    calendar.destroy(); // Cleanup on unmount
  };
}, []);

// In Vue
onMounted(() => {
  calendar = new Calendar(el.value, config);
});

onUnmounted(() => {
  calendar.destroy(); // Cleanup on unmount
});

// In vanilla JS
function createCalendar() {
  const calendar = new Calendar('#app', config);
  
  // When removing the calendar
  function cleanup() {
    calendar.destroy();
    document.getElementById('app').innerHTML = '';
  }
  
  return { calendar, cleanup };
}
```

### Initialization Options

You can initialize the calendar using either a CSS selector or a direct DOM element reference:

```typescript
// Option 1: CSS Selector (simple and convenient)
const calendar = new Calendar('#calendar', config);

// Option 2: DOM Element (useful in frameworks)
const container = document.getElementById('calendar');
const calendar = new Calendar(container, config);

// Option 3: Dynamic element (e.g., in React with refs)
const containerRef = useRef<HTMLDivElement>(null);
useEffect(() => {
  if (containerRef.current) {
    const calendar = new Calendar(containerRef.current, config);
    return () => calendar.destroy();
  }
}, []);
```

## 🔨 Development

```bash
# Install dependencies
npm install

# Run demo
npm run demo

# Build library
npm run build

# Type check
npx tsc --noEmit
```

## 📁 Project Structure

```
@taskgenius/calendar/
├── src/                 # Source code
├── tests/               # Test files
│   ├── unit/           # Unit tests
│   ├── integration/    # Integration tests
│   └── fixtures/       # Test data
├── examples/
│   └── demo/           # Vite demo project
├── dist/               # Built output
└── docs/               # Documentation
```

## 🔄 Date Adapters

The library uses a pluggable date adapter system. By default, it uses Day.js.

### Using Day.js (Default)

```typescript
import { Calendar } from '@taskgenius/calendar';
// Automatically uses DayJsAdapter
```

### Custom Adapter

Implement the `DateAdapter` interface to use a different date library:

```typescript
interface DateAdapter<T> {
  create(date?: string | Date | T): T;
  parse(dateStr: string, format?: string): T;
  format(date: T, format: string): string;
  // ... other methods
}
```

## 📄 License

MIT ©TaskGenius

## 🤝 Contributing

Contributions are welcome! Please read the contributing guidelines before submitting a PR.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
