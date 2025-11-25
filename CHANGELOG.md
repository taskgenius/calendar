# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.9.0] - 2025-11-24

### ⚠️ BREAKING CHANGES

#### `onEventDrop` Callback Parameters Changed to Date Objects

The `onEventDrop` callback parameters have been changed from `string` to `Date` for consistency with other callbacks updated in v0.8.0.

**Migration Guide:**

```typescript
// Before (v0.8.x)
onEventDrop: (event, newStart: string, newEnd: string) => {
  saveToServer(event.id, { start: newStart, end: newEnd });
}

// After (v0.9.0)
onEventDrop: (event, newStart: Date, newEnd: Date) => {
  saveToServer(event.id, {
    start: newStart.toISOString(),
    end: newEnd.toISOString()
  });
}
```

### ✨ Features

- **New `onEventResize` callback**: Separate callback for resize operations, distinguishing between moving an event and changing its duration
  - Triggered when dragging event edges (start/end time) in week/day views
  - Receives same parameters as `onEventDrop`: `(event, newStart: Date, newEnd: Date)`

### 🏗️ Internal

- **DragController refactoring**: Now properly distinguishes between `move` and `resize` modes
  - `onDrop` callback triggered only for move operations
  - `onResize` callback triggered for resize-left, resize-right, resize-top, resize-bottom operations
- Added `toDate()` helper method in `DragController` for adapter-to-Date conversion

### 📚 Documentation

- Updated README with `onEventResize` callback example
- Updated API documentation with detailed callback descriptions
- Clarified that `onEventDrop` is only for move operations

## [0.8.0] - 2025-11-23

### ⚠️ BREAKING CHANGES

#### 1. Callback Parameters Changed to Date Objects

All date-related callback parameters have been changed from `string` to `Date` for better type safety and developer experience.

**Migration Guide:**

```typescript
// Before (v0.7.x)
onDateClick: (dateStr: string) => {
  const date = new Date(dateStr);  // Manual parsing required
  console.log(date);
}

// After (v0.8.0)
onDateClick: (date: Date) => {
  console.log(date);  // Date object directly available
}
```

**Affected callbacks:**
- `onDateChange`: `(date: string) => void` → `(date: Date) => void`
- `onDateClick`: `(date: string) => void` → `(date: Date) => void`
- `onDateDoubleClick`: `(date: string) => void` → `(date: Date) => void`
- `onDateContextMenu`: `(date: string, x, y) => void` → `(date: Date, x, y) => void`
- `onTimeSlotClick`: `(dateTime: string) => void` → `(dateTime: Date) => void`
- `onTimeSlotDoubleClick`: `(dateTime: string) => void` → `(dateTime: Date) => void`
- `onTimeSlotContextMenu`: `(dateTime: string, x, y) => void` → `(dateTime: Date, x, y) => void`
- `onDateRangeSelect`: `(start: string, end: string) => void` → `(start: Date, end: Date) => void`
- `onTimeRangeSelect`: `(start: string, end: string) => void` → `(start: Date, end: Date) => void`

#### 2. Default Date Format Tokens Changed to Unicode Standard

Default date format tokens have been updated from Day.js-specific tokens to standard Unicode tokens for better cross-library compatibility and date-fns v4 support.

**Migration Guide:**

If you were relying on the default formats (without providing custom `dateFormats`), your UI display will remain the same, but if you were referencing `DEFAULT_DATE_FORMATS` constant in your code, update as follows:

```typescript
// Before (v0.7.x)
import { DEFAULT_DATE_FORMATS } from '@taskgenius/calendar';
// DEFAULT_DATE_FORMATS.date === "YYYY-MM-DD"
// DEFAULT_DATE_FORMATS.monthHeader === "YYYY年 M月"

// After (v0.8.0)
import { DEFAULT_DATE_FORMATS } from '@taskgenius/calendar';
// DEFAULT_DATE_FORMATS.date === "yyyy-MM-dd"
// DEFAULT_DATE_FORMATS.monthHeader === "yyyy年 M月"
```

**Changed default formats:**
- `date`: `"YYYY-MM-DD"` → `"yyyy-MM-dd"`
- `dateTime`: `"YYYY-MM-DD HH:mm"` → `"yyyy-MM-dd HH:mm"`
- `monthHeader`: `"YYYY年 M月"` → `"yyyy年 M月"`
- `dayHeader`: `"YYYY年M月D日"` → `"yyyy年M月d日"`

**Why this change:**
- `YYYY` (ISO week-numbering year) → `yyyy` (calendar year) - prevents date-fns v4 protected token warnings
- `DD` (day of year 001-365) → `dd` (day of month 01-31) - aligns with intended behavior
- Ensures consistent behavior across all date adapters (Native, Day.js, date-fns)

**Action required:** Only if you explicitly use `DEFAULT_DATE_FORMATS` constant in your code. If you provide custom `dateFormats` config, no changes needed.

### ✨ Features

- **Enhanced type safety**: Callback parameters now provide native Date objects for better developer experience and type safety

### 🏗️ Internal

- Simplified callback implementations by using native Date objects instead of formatted strings
- Removed unnecessary `INTERNAL_DATA_FORMAT` usage in callback code paths
- Added `toDate()` helper methods in `Calendar` and `InteractionController` for adapter-to-Date conversion
- Updated all type definitions and documentation to reflect unicode token usage

### 📚 Documentation

- Updated `CalendarEvent` interface documentation to show `yyyy-MM-dd HH:mm` format
- Updated `DateFormatConfig` with comprehensive examples showing unicode tokens as recommended
- Added backward compatibility notes for legacy token support
- Clarified adapter token compatibility in comments

## [0.7.0] - 2025-11-22

### 🔧 Maintenance

- Update package version to 0.7.0

## [0.6.0] - 2025-11-22

### 🐛 Bug Fixes

- **Fixed event bar positioning with dayFilter**: Event bars in month view now correctly align with columns when arbitrary days are filtered out. Previously, positioning assumed exactly 7 or 5 columns (based on `showWeekends`), causing misalignment when `dayFilter` hid non-weekend days.
- **Changed weekday labels to English**: Replaced Chinese weekday labels ("日", "一", etc.) with English abbreviations ("Sun", "Mon", etc.) to avoid encoding issues and allow developers to customize labels as needed.

### ✨ Features

- **Unified filter architecture for rendering control**: Introduced comprehensive filtering system for day and time rendering
  - `dayFilter`: Control which days are rendered and how they appear (all views)
  - `timeFilter`: Control which time slots are displayed (week/day views only)
  - `timeFormatter`: Customize time label formatting (week/day views only)
- **11 preset utility functions** for common use cases:
  - Day filters: `hideWeekends()`, `hideWeekdays()`, `onlyDays()`, `hideDays()`
  - Time filters: `workingHours()`, `hideHours()`, `onlyHours()`
  - Time formatters: `format12h()`, `format24h()`, `customTimeLabels()`, `formatCompact()`
- **Advanced rendering customization**: Filters can return simple boolean or detailed configuration objects
  - `DayRenderConfig`: control visibility, className, inline styles, and disabled state
  - `TimeSlotConfig`: control visibility, custom labels, and className
- **Dynamic grid layout**: Calendar automatically adjusts column count based on visible days
- **Backward compatibility**: Existing `showWeekends` config automatically converts to `dayFilter`
- **Comprehensive user interaction handlers**: Add `InteractionController` to centralize all calendar interactions
  - Event interactions: `onEventClick`, `onEventDoubleClick`, `onEventContextMenu`
  - Date interactions (month view): `onDateClick`, `onDateDoubleClick`, `onDateContextMenu`
  - Time slot interactions (week/day view): `onTimeSlotClick`, `onTimeSlotDoubleClick`, `onTimeSlotContextMenu`
  - Range selection: `onDateRangeSelect`, `onTimeRangeSelect`
  - Dynamic drag toggle: `setDraggable()` method to enable/disable drag functionality at runtime

### 📦 New Exports

- Preset functions: `hideWeekends`, `hideWeekdays`, `onlyDays`, `hideDays`, `workingHours`, `hideHours`, `onlyHours`, `format12h`, `format24h`, `customTimeLabels`, `formatCompact`
- Types: `DayFilterContext`, `DayRenderConfig`, `TimeSlotConfig`, `TimeFormatter`, `DayFilterResult`, `TimeFilterResult`
- `InteractionController` for managing user interactions

### 🎨 Styles

- Added `.tg-disabled` class for filtered-out day cells (opacity: 0.5, pointer-events: none)
- Added `.tg-time-axis-label.custom` placeholder class for custom time slot styling
- Added interaction-related styles for better user feedback

### 📝 Examples

- Updated demo with 6 comprehensive filter examples (commented out by default)
- Added comprehensive interaction examples showing all supported callbacks

### 🧪 Testing

- Added comprehensive test coverage for bug fixes (17 new tests)
  - `MonthRenderer.test.ts`: 8 tests covering weekday labels, event positioning with dayFilter, and dynamic grid layout
  - `TimeRenderer.test.ts`: 9 tests covering weekday labels, dynamic column layout, time slot filtering, and time formatters
  - All tests verify English labels (no Chinese characters) and correct positioning with filtered days

## [0.5.0] - 2025-11-21

### ⚠️ Breaking Changes

- **CSS file is now required**: The component no longer uses inline styles. You must import `@taskgenius/calendar/styles.css` for the calendar to render correctly.

### 🏗️ Refactoring

- **Extract inline styles to CSS**: Moved all inline styles from TypeScript to external CSS file
  - Main container layout styles moved from `Calendar.ts` to `.tg-calendar` class
  - View container styles moved to `.tg-view-container` class
  - Event count badge styles moved to `.tg-event-count-badge` class
- **CSS code formatting**: Standardized indentation and formatting in `styles.css`

### 📚 Documentation

- Updated README to clarify that CSS import is required (not optional)
- Added CSS examples for custom element styling (`onRenderDateCell` hook)
- Improved style customization documentation

## [0.4.0] - 2025-11-21

### ✨ Features

- **Comprehensive Date Format Configuration**: Add `dateFormats` configuration option for complete control over all date/time formats
  - `dateFormats.date`: Date format for internal rendering (default: "YYYY-MM-DD")
  - `dateFormats.dateTime`: Date-time format for events (default: "YYYY-MM-DD HH:mm")
  - `dateFormats.time`: Time format for time displays (default: "HH:mm")
  - `dateFormats.monthHeader`: Month view header format (default: "YYYY M")
  - `dateFormats.dayHeader`: Day view header format (default: "YYYY M D")
  - Supports Day.js (`YYYY`, `DD`) and date-fns (`yyyy`, `dd`) format tokens
  - Display formats are fully customizable while maintaining stable ISO format for APIs

### 🏗️ Architecture

- **Separation of Concerns**: Clear distinction between data formats (ISO 8601) and display formats (user-configurable)
  - Public APIs (`getCurrentDate`, `onDateChange`, `onEventDrop`) always use ISO format for reliability and backward compatibility
  - UI rendering uses configurable `dateFormats` for flexible display
  - Internal data exchange uses `INTERNAL_DATA_FORMAT` constant (ISO 8601)

### 🔧 Improvements

- **NativeDateAdapter Enhancement**: Add support for multiple date separators
  - Now supports both `/` (e.g., "2025/11/20") and `-` (e.g., "2025-11-20") separators
  - Automatic normalization for consistent parsing
  - Better compatibility with custom format configurations

- **MonthRenderer Reliability**: Improve date cell rendering hook
  - Use adapter API directly instead of string parsing for `onRenderDateCell` context
  - Eliminates Invalid Date issues with custom format tokens
  - More reliable across different date adapters

### 🐛 Bug Fixes

- Remove all hard-coded format strings from internal components
  - Calendar navigation methods now use format constants
  - Engines and renderers use configurable formats
  - Drag controller uses configurable formats

### 📚 Documentation

- Add comprehensive inline documentation for format configuration
  - Clear explanation of data format vs. display format separation
  - Design rationale documented in constants
  - JSDoc comments for all format-related APIs

### 🧪 Testing

- Add 19 new tests for custom format scenarios (175 total tests, 100% pass rate)
  - `NativeDateAdapter.customFormat.test.ts`: 12 tests for adapter format handling
  - `Calendar.customFormats.test.ts`: 7 integration tests for custom format configurations
  - Tests cover slash/dash separators, round-trip consistency, and API stability

### ⚠️ Deprecation Notice

- `headerFormat` configuration is now deprecated (still supported for backward compatibility)
  - Use `dateFormats.monthHeader` and `dateFormats.dayHeader` instead
  - Old configurations will continue to work but are mapped internally to the new system

### 🔄 Migration Guide

```typescript
// Before (deprecated but still works)
new Calendar('#app', {
  headerFormat: {
    month: 'YYYY年 M',
    day: 'YYYY M D'
  }
});

// After (recommended)
new Calendar('#app', {
  dateFormats: {
    monthHeader: 'YYYY M',
    dayHeader: 'YYYY M D',
    // Optionally customize other formats
    date: 'YYYY/MM/DD',
    time: 'HH:mm'
  }
});
```

## [0.3.0] - 2025-11-21

### ✨ Features

- **Custom Header Format**: Add `headerFormat` configuration option to customize calendar header title formats for month and day views
  - `headerFormat.month`: Custom format for month/week view headers (default: "YYYY M")
  - `headerFormat.day`: Custom format for day view headers (default: "YYYY M D")
  - Format tokens depend on the date adapter being used (Day.js, date-fns, or native)

### 🧪 Testing

- Add comprehensive tests for header format configuration
- Add tests for partial configuration support
- Code style improvements (consistent quote formatting)

## [0.2.1] - 2025-11-20

### 🐛 Bug Fixes

- Fix TypeScript compilation error (unused variable in MonthRenderer)

## [0.2.0] - 2025-11-20

### ✨ Features

- **Date-Only Drag Mode**: Add `draggable.dateOnly` option to only adjust dates while preserving time
- **Week Configuration**: Add `view.firstDayOfWeek` (0=Sunday, 1=Monday, 6=Saturday) to customize week start day
- **Hide Weekends**: Add `view.showWeekends` option to hide Saturday and Sunday columns
- **Event Count Badges**: Add `showEventCounts` option to display event count badges on date cells in month view
- **Custom Date Cell Rendering**: Add `onRenderDateCell` hook for customizing date cell appearance and content
- **Custom Event Styling**: Add `onStyleEvent` hook for dynamic event colors, opacity, and class names based on metadata

### 🐛 Bug Fixes

- Fix `firstDayOfWeek` being ignored in week/day views - TimeEngine now respects the configuration
- Fix month view grid layout with custom week configurations - dynamic column layout based on actual day count
- Fix week start calculation for Saturday-first weeks - properly handle backward date adjustment
- Fix week end index calculation when weekends are hidden - use dynamic array length instead of hardcoded [6]

### 📝 Documentation

- Add 6 comprehensive usage examples in README
- Update API reference with all new configuration options
- Add detailed JSDoc comments for new interfaces (DateCellContext, EventStyle)

### 🧪 Testing

- Add configuration tests for new features
- Add enhanced MonthEngine tests for week configuration
- All 145 tests passing

### 🏗️ Technical Improvements

- Maintain SOLID principles with hook-based extensibility
- Keep DRY with unified configuration merging
- Follow KISS with simple built-in features + powerful hooks
- Ensure backward compatibility with sensible defaults

## [0.1.1] - 2025-11-XX

### 🔧 Maintenance

- Setup automated publishing with GitHub Actions and Trusted Publishing
- Add provenance support for enhanced security

## [0.1.0] - Initial Release

### ✨ Features

- Three view modes: month, week, and day
- Drag-and-drop event support
- Pluggable date adapters (Day.js, Native Date, date-fns)
- TypeScript first with complete type definitions
- Lightweight (<12KB gzipped)
- SOLID architecture

[Unreleased]: https://github.com/taskgenius/calendar/compare/v0.9.0...HEAD
[0.9.0]: https://github.com/taskgenius/calendar/compare/v0.8.0...v0.9.0
[0.8.0]: https://github.com/taskgenius/calendar/compare/v0.7.0...v0.8.0
[0.7.0]: https://github.com/taskgenius/calendar/compare/v0.6.0...v0.7.0
[0.6.0]: https://github.com/taskgenius/calendar/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/taskgenius/calendar/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/taskgenius/calendar/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/taskgenius/calendar/compare/v0.2.1...v0.3.0
[0.2.1]: https://github.com/taskgenius/calendar/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/taskgenius/calendar/compare/v0.1.1...v0.2.0
[0.1.1]: https://github.com/taskgenius/calendar/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/taskgenius/calendar/releases/tag/v0.1.0
