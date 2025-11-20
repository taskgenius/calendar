# @taskgenius/calendar

[![npm version](https://badge.fury.io/js/@taskgenius%2Fcalendar.svg)](https://www.npmjs.com/package/@taskgenius/calendar)
[![CI](https://github.com/taskgenius/calendar/actions/workflows/ci.yml/badge.svg)](https://github.com/taskgenius/calendar/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm downloads](https://img.shields.io/npm/dm/@taskgenius/calendar.svg)](https://www.npmjs.com/package/@taskgenius/calendar)

Used in [taskgenius/taskgenius-plugin](https://github.com/taskgenius/taskgenius-plugin)

A lightweight, configurable TypeScript calendar component library with drag-and-drop support.

## ✨ Features

- 📅 **Three view modes** - Month, week, and day views
- 🎨 **Fully configurable** - Themes, colors, and styles
- 🔄 **Drag-and-drop** - Move and resize events (with date-only mode)
- 🗓️ **Flexible week layout** - Configure first day of week, hide weekends
- 🔢 **Event count badges** - Display event counts on date cells
- 🎨 **Custom rendering hooks** - Full control over date cells and event styling
- 📦 **Lightweight** - <12KB gzipped
- 🔌 **Pluggable adapters** - Support for different date libraries
- ⚡ **Zero dependencies** - Core with optional Day.js
- 📝 **TypeScript first** - Complete type definitions
- 🎯 **SOLID principles** - Clean, maintainable architecture

## 📦 Installation

```bash
npm install @taskgenius/calendar dayjs
```

## 🚀 Quick Start

```typescript
import { Calendar } from '@taskgenius/calendar';
import '@taskgenius/calendar/styles.css'; // Manually include default styles

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
    console.log('Moved:', event.title, newStart, newEnd);
  }
});

// Method 2: Pass HTMLElement directly
const container = document.getElementById('app');
const calendar2 = new Calendar(container, {
  view: { type: 'month' }
});
```

## 🎨 Styles

- Default styles are no longer injected automatically. Import `@taskgenius/calendar/styles.css` in your app entry, or reference `<link rel="stylesheet" href="/node_modules/@taskgenius/calendar/dist/styles.css">`.
- Theme settings are delivered via CSS variables: `--tg-primary-color`, `--tg-primary-rgb`, `--tg-cell-height`, `--tg-font-header`, `--tg-font-event`. The library sets these on the `.tg-calendar` root; you can override them in your own styles.
- To fully customize the look, skip the default CSS and style using the exposed `tg-*` class names.

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
| `setView(type: ViewType)` | Switch between 'month', 'week', 'day' views |
| `getView()` | Get current view type |
| `addEvent(event: CalendarEvent)` | Add a new event |
| `removeEvent(id: string)` | Remove event by ID |
| `updateEvent(id: string, updates: Partial<CalendarEvent>)` | Update event properties |
| `getEvents()` | Get all events |
| `setEvents(events: CalendarEvent[])` | Replace all events |
| `next()` | Navigate to next period |
| `prev()` | Navigate to previous period |
| `today()` | Navigate to today |
| `goToDate(date: string \| Date)` | Navigate to specific date |
| `getCurrentDate()` | Get current displayed date |
| `refresh()` | Force re-render |
| `destroy()` | Cleanup and remove calendar |

### Configuration

```typescript
interface CalendarConfig {
  view?: ViewConfig;
  events?: CalendarEvent[];
  draggable?: DraggableConfig;
  theme?: ThemeConfig;
  showEventCounts?: boolean;  // Default: false - Show event count badges on date cells
  onEventClick?: (event: CalendarEvent) => void;
  onEventDrop?: (event: CalendarEvent, newStart: string, newEnd: string) => void;
  onViewChange?: (viewType: ViewType) => void;
  onDateChange?: (date: string) => void;
  onRenderDateCell?: (ctx: DateCellContext) => void;  // Custom date cell rendering
  onStyleEvent?: (event: CalendarEvent) => EventStyle;  // Custom event styling
}
```

#### ViewConfig

```typescript
interface ViewConfig {
  type: 'month' | 'week' | 'day';  // Default: 'week'
  showDateHeader?: boolean;         // Default: true
  showWeekNumbers?: boolean;        // Default: false
  firstDayOfWeek?: 0 | 1 | 6;      // Default: 0 (Sunday)
  showWeekends?: boolean;           // Default: true
}
```

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
  start: string;                     // ISO format: 'YYYY-MM-DD HH:mm'
  end: string;                       // ISO format: 'YYYY-MM-DD HH:mm'
  color?: string;                    // CSS color value
  metadata?: Record<string, unknown>; // Custom data
}
```

## 🎨 Examples

### Basic Usage

```typescript
import { Calendar } from '@taskgenius/calendar';
import '@taskgenius/calendar/styles.css';

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
    // Update in database
    saveEventToServer(event.id, { start: newStart, end: newEnd });
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

### Event Count Badges

```typescript
const calendar = new Calendar('#app', {
  view: { type: 'month' },
  showEventCounts: true  // Display event count on each date cell
});
```

### Custom Date Cell Rendering

```typescript
const calendar = new Calendar('#app', {
  onRenderDateCell: (ctx) => {
    // Add custom badge for past due dates with events
    if (ctx.isPastDue && ctx.events.length > 0) {
      const badge = document.createElement('div');
      badge.className = 'overdue-badge';
      badge.textContent = '!';
      badge.style.cssText = 'position: absolute; top: 2px; right: 2px; background: #ef4444; color: white; border-radius: 50%; width: 16px; height: 16px; display: flex; align-items: center; justify-content: center; font-size: 10px;';
      ctx.cellEl.appendChild(badge);
    }
    
    // Add custom class for weekends
    if (ctx.date.getDay() === 0 || ctx.date.getDay() === 6) {
      ctx.cellEl.classList.add('weekend');
    }
  }
});
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

## 📦 Publishing

This package uses npm Trusted Publishing for secure, automated releases. See the [Publishing Guide](docs/PUBLISHING.md) for details on:

- Creating new releases
- Version management
- Trusted Publishing configuration
- Troubleshooting

## 🤝 Contributing

Contributions are welcome! Please read the contributing guidelines before submitting a PR.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
