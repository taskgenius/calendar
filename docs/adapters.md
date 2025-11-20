# Date Adapters

@taskgenius/calendar uses a pluggable date adapter system to support different date libraries. This allows you to use your preferred date manipulation library without adding unnecessary dependencies.

## Available Adapters

### 1. DayJsAdapter (Default)

The default adapter using [Day.js](https://day.js.org/).

**Installation:**
```bash
npm install @taskgenius/calendar dayjs
```

**Usage:**
```typescript
import { Calendar } from '@taskgenius/calendar';
import { DayJsAdapter } from '@taskgenius/calendar/dayjs';
import dayjs from 'dayjs';

const calendar = new Calendar('#app', {
  dateAdapter: new DayJsAdapter(dayjs),
  // ... other config
});
```

**Note:** DayJsAdapter is used by default if no adapter is specified and dayjs is available.

---

### 2. NativeDateAdapter

Zero-dependency adapter using native JavaScript Date API.

**Installation:**
```bash
npm install @taskgenius/calendar
```

**Usage:**
```typescript
import { Calendar } from '@taskgenius/calendar';
import { NativeDateAdapter } from '@taskgenius/calendar/native';

const calendar = new Calendar('#app', {
  dateAdapter: new NativeDateAdapter(),
  // ... other config
});
```

**Pros:**
- ✅ Zero dependencies
- ✅ Smallest bundle size
- ✅ Works everywhere

**Cons:**
- ⚠️ Limited formatting options
- ⚠️ No timezone support
- ⚠️ Less feature-rich than libraries

**Best for:**
- Simple use cases
- Bundle size critical applications
- No complex date manipulation needs

---

### 3. DateFnsAdapter

Adapter for [date-fns](https://date-fns.org/), a modern date utility library.

**Installation:**
```bash
npm install @taskgenius/calendar date-fns
```

**Usage:**
```typescript
import { Calendar } from '@taskgenius/calendar';
import { DateFnsAdapter } from '@taskgenius/calendar/date-fns';
import * as dateFns from 'date-fns';

const calendar = new Calendar('#app', {
  dateAdapter: new DateFnsAdapter(dateFns),
  // ... other config
});
```

**Pros:**
- ✅ Tree-shakeable (only imports what you use)
- ✅ Immutable & pure functions
- ✅ TypeScript first
- ✅ Comprehensive locale support

**Best for:**
- Applications needing strong locale support
- Projects prioritizing tree-shaking
- Modern TypeScript codebases

---

## Choosing an Adapter

| Feature | Native | Day.js | date-fns |
|---------|--------|--------|----------|
| **Bundle Size** | Smallest (~0KB) | Small (~2KB) | Medium (~4-12KB)* |
| **Formatting** | Basic | Advanced | Advanced |
| **Timezones** | ❌ | Plugin | ✅ |
| **Locales** | Limited | Plugin | ✅ |
| **Tree-shaking** | N/A | ❌ | ✅ |
| **Immutability** | ❌ | ✅ | ✅ |
| **Dependencies** | 0 | 1 | 1 |

\* *Depends on what functions you import*

**Recommendation:**
- **Small projects / simple needs:** NativeDateAdapter
- **Medium complexity / good balance:** DayJsAdapter (default)
- **i18n / locale support / tree-shaking:** DateFnsAdapter

---

## DateAdapter Interface

All adapters implement the `DateAdapter<T>` interface:

```typescript
interface DateAdapter<T> {
  // Creation
  create(date?: string | Date | T): T;
  parse(dateStr: string, format?: string): T;
  format(date: T, format: string): string;

  // Getters
  year(date: T): number;
  month(date: T): number;      // 0-11
  date(date: T): number;       // 1-31
  day(date: T): number;        // 0-6 (Sunday = 0)
  hour(date: T): number;       // 0-23
  minute(date: T): number;     // 0-59

  // Setters
  setHour(date: T, hour: number): T;
  setMinute(date: T, minute: number): T;

  // Calculations
  add(date: T, amount: number, unit: TimeUnit): T;
  diff(date1: T, date2: T, unit: TimeUnit): number;

  // Boundaries
  startOf(date: T, unit: TimeUnit): T;
  endOf(date: T, unit: TimeUnit): T;

  // Comparisons
  isBefore(date1: T, date2: T, unit?: TimeUnit): boolean;
  isAfter(date1: T, date2: T, unit?: TimeUnit): boolean;
  isSame(date1: T, date2: T, unit?: TimeUnit): boolean;
}

type TimeUnit = 'year' | 'month' | 'week' | 'day' | 'hour' | 'minute';
```

---

## Creating a Custom Adapter

You can create your own adapter by implementing the `DateAdapter` interface.

**Example: Moment.js Adapter**

```typescript
import type { DateAdapter, TimeUnit } from '@taskgenius/calendar';
import moment, { Moment } from 'moment';

export class MomentAdapter implements DateAdapter<Moment> {
  create(date?: string | Date | Moment): Moment {
    return moment(date);
  }

  parse(dateStr: string, format?: string): Moment {
    return format ? moment(dateStr, format) : moment(dateStr);
  }

  format(date: Moment, format: string): string {
    return date.format(format);
  }

  year(date: Moment): number {
    return date.year();
  }

  month(date: Moment): number {
    return date.month();
  }

  date(date: Moment): number {
    return date.date();
  }

  day(date: Moment): number {
    return date.day();
  }

  hour(date: Moment): number {
    return date.hour();
  }

  minute(date: Moment): number {
    return date.minute();
  }

  setHour(date: Moment, hour: number): Moment {
    return date.clone().hour(hour);
  }

  setMinute(date: Moment, minute: number): Moment {
    return date.clone().minute(minute);
  }

  add(date: Moment, amount: number, unit: TimeUnit): Moment {
    return date.clone().add(amount, unit);
  }

  diff(date1: Moment, date2: Moment, unit: TimeUnit): number {
    return date1.diff(date2, unit);
  }

  startOf(date: Moment, unit: TimeUnit): Moment {
    return date.clone().startOf(unit);
  }

  endOf(date: Moment, unit: TimeUnit): Moment {
    return date.clone().endOf(unit);
  }

  isBefore(date1: Moment, date2: Moment, unit?: TimeUnit): boolean {
    return date1.isBefore(date2, unit);
  }

  isAfter(date1: Moment, date2: Moment, unit?: TimeUnit): boolean {
    return date1.isAfter(date2, unit);
  }

  isSame(date1: Moment, date2: Moment, unit?: TimeUnit): boolean {
    return date1.isSame(date2, unit);
  }
}

// Usage
const calendar = new Calendar('#app', {
  dateAdapter: new MomentAdapter()
});
```

---

## Adapter Considerations

### Immutability

All adapter methods that modify dates should return **new instances** rather than mutating the original date. This prevents bugs and makes the code more predictable.

✅ **Good:**
```typescript
setHour(date: Date, hour: number): Date {
  const newDate = new Date(date); // Create new instance
  newDate.setHours(hour);
  return newDate;
}
```

❌ **Bad:**
```typescript
setHour(date: Date, hour: number): Date {
  date.setHours(hour); // Mutates original!
  return date;
}
```

### Performance

The calendar may call adapter methods frequently during rendering and interaction. Ensure your adapter implementation is efficient:

- Cache format strings if possible
- Avoid unnecessary object creation
- Use native methods when available

### Type Safety

Leverage TypeScript's generics to ensure type safety:

```typescript
class MyAdapter implements DateAdapter<MyDateType> {
  // T is MyDateType throughout
  create(date?: string | Date | MyDateType): MyDateType {
    // Implementation
  }
}
```

---

## FAQ

### Q: Can I use multiple adapters in one application?

A: Each `Calendar` instance uses one adapter. If you need multiple calendars with different adapters, create separate instances:

```typescript
const calendar1 = new Calendar('#cal1', {
  dateAdapter: new DayJsAdapter(dayjs)
});

const calendar2 = new Calendar('#cal2', {
  dateAdapter: new NativeDateAdapter()
});
```

### Q: What happens if I don't specify an adapter?

A: The calendar will use `DayJsAdapter` by default if dayjs is available. If dayjs is not installed, you must provide an adapter.

### Q: Can I switch adapters after initialization?

A: No, the adapter is set during initialization and cannot be changed. You would need to destroy and recreate the calendar instance.

### Q: Do I need to install the date library separately?

A: Yes, date libraries (dayjs, date-fns) are peer dependencies. Install them separately:

```bash
npm install @taskgenius/calendar dayjs
# or
npm install @taskgenius/calendar date-fns
```

NativeDateAdapter requires no additional installation.
