# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.13.1]

### ✨ Features

- **Smart event expansion**: Overlapping events now intelligently expand into available space
  - Events automatically extend width when adjacent columns are free during their time slot
  - Width multiplier adjusts based on column count (1.6 for ≤3 cols, 1.5 for ≤5 cols, 1.4 for more)
  - Last column events extend to container edge for clean visual appearance

### 🐛 Bug Fixes

- **Short event clickability**: Events with shorter duration now always appear on top
  - Z-index calculated based on event duration (shorter events get higher z-index)
  - Ensures 5-minute meetings are always clickable over longer overlapping events

### 🧪 Testing

- Comprehensive test coverage for smart expansion algorithm
  - Staircase overlap patterns with column reuse
  - 4-event cascading layout scenarios
  - Separate group handling verification
  - Real-world Nov 26 scenario with 4 overlapping events

## [0.13.0]

### ✨ Features

- **All-day section event limiting**: Support `maxEventsPerRow` config for week/day views
  - Limits visible all-day events to specified count
  - Shows "+N more" indicator when events exceed limit
  - Click indicator to view hidden events in popover
  - Support `onRenderMoreEventsPopover` hook for custom popover rendering

### 🐛 Bug Fixes

- **Multi-day event click offset**: Fix click offset calculation for multi-day events during drag
  - Calculate position relative to actual event element width
  - Correctly determine which day within the event was clicked

- **All-day ghost positioning**: Use correct `.tg-allday-event` selector instead of `.tg-event-bar`
  - Fixes ghost element vertical positioning in week/day view all-day section

- **Scroll restoration**: Use `requestAnimationFrame` instead of `setTimeout(0)` for scroll position restoration
  - Prevents visual "jump" when re-rendering time views

### 🏗️ Code Quality

- **Calendar.ts formatting**: Standardize indentation to 2 spaces for consistency

### 🧪 Testing

- Add ghost position integration tests for multi-day event drag operations

## [0.12.1]

### 🐛 Bug Fixes

- **Multi-day event drag preservation**: Fixed issue where multi-day events lost their duration when dragged
  - `clickOffsetDays` now correctly applied with bounds clamping to prevent negative or out-of-range values
  - Duration calculation uses date-only comparison for accurate day span calculation
  - Original time components preserved when dragging timed multi-day events

- **Cross-midnight event handling**: Fixed drag behavior for events spanning midnight (e.g., 22:00 - 02:00 next day)
  - Correct duration calculation that accounts for time-based day boundaries
  - Proper edge case handling in resize operations to prevent inverted date ranges

- **JSDOM compatibility**: Added `resolveCellWidth()` helper method in DragController
  - Fallback chain: `offsetWidth` → `getBoundingClientRect().width` → `getComputedStyle().width`
  - Ensures reliable cell width calculation in test environments

### ✨ Features

- **Demo events tab**: Added Events tab to config panel in demo page
  - View current calendar events as formatted JSON
  - Auto-updates on event add/clear operations
  - Copy events to clipboard functionality

### 🧪 Testing

- Fix ghost position test selectors to use `data-date` attribute for reliable row selection
- Add comprehensive multi-day drag integration tests (`Calendar.multiDayDrag.test.ts`):
  - Test duration preservation with `clickOffsetDays = 0`
  - Test middle-click offset handling (`clickOffsetDays > 0`)
  - Test time component preservation for timed events
  - Test `handleMonthMove` with DOM simulation
  - Test cross-row drag maintaining event duration
  - Test cross-midnight event drag behavior

## [0.12.0]

### ✨ Features

- **Cross-midnight event support**: Timed events spanning multiple days now display correctly in week/day views
  - First day shows event from start time to end of day (23:59)
  - Middle days show full-day segments (00:00 to 23:59)
  - Last day shows event from start of day (00:00) to end time
  - Visual indicators (dashed borders, arrow indicators) for event continuation
  - Segment info (`segmentIndex`, `totalSegments`) available in render hooks

- **Custom event render hook (`onRenderEvent`)**: Full control over event element content
  - Access to `EventRenderContext` with event, element, view type, and segment info
  - `defaultRender()` function for incremental customization
  - Works in both month and week/day views
  - Supports both all-day and timed events

- **Expanded `firstDayOfWeek` range**: Now supports any day of the week (0-6) instead of just 0, 1, or 6
  - 0 = Sunday, 1 = Monday, 2 = Tuesday, ..., 6 = Saturday

### 🐛 Bug Fixes

- **Ghost element positioning during drag**: Fixed multiple issues with drag preview positioning
  - Ghost width now uses percentage-based calculation for consistent sizing
  - Ghost vertical position considers only events in overlapping columns
  - Fixed `cellW` recalculation when container width changes during drag
  - Scoped day column lookup to current calendar instance (prevents cross-calendar coupling)
  - Use `getComputedStyle` instead of inline style for `--tg-allday-columns` CSS variable

- **Resize top handle clamping**: Prevent inverted dates when dragging top resize handle past end time

### 🏗️ Code Quality

- **DRY refactoring in DragController**: Extract `getAllDayColumnCount()` helper method
- **Performance optimization in MonthRenderer**: Pre-parse events and group by date for O(1) lookup

### 📦 New Exports

- `EventRenderContext` type for custom event render hooks
- `DateCellContext` and `EventStyle` types (previously internal)

### 🧪 Testing

- Add comprehensive cross-midnight event tests in `TimeEngine.test.ts`:
  - Test events on first/second/middle days
  - Test `isCrossMidnightEvent()` and `getEventDaySpan()` methods
  - Test 3-day spanning events with correct segment info
  - Test events ending exactly at midnight (no zero-duration segments)
  - Test `isStart`/`isEnd` flags for single-day events
- Add ghost position integration tests in `Calendar.ghostPosition.test.ts`:
  - Test width calculation in narrow containers
  - Test vertical positioning with overlapping events
  - Test column index calculation with varying widths

## [0.11.1]

### 🐛 Bug Fixes

- **Fix event segmentation with hidden days**: Events spanning across filtered (hidden) days now correctly split into separate segments
  - Previously, segmentation used column indices to determine consecutive days, which failed when days were hidden via `dayFilter`
  - Now uses actual calendar date comparison (`date + 1 day`) to detect gaps
  - Example: With weekends hidden, a Fri→Mon event now correctly splits into two segments instead of appearing as one continuous bar
  - Affects both `MonthEngine.calculateLayoutWithVisibleDays()` and `TimeEngine.calculateAllDayLayout()`

- **Fix events displaying on disabled days**: Events no longer render on days marked as `disabled` in `dayFilter`
  - Added `disabled` property to `VisibleDay<T>` interface
  - `MonthRenderer` now passes `disabled` flag based on `dayFilter` result
  - `MonthEngine` excludes disabled days when calculating event coverage
  - Useful for "HalfMonth" style views where certain days should show no events

### 🏗️ Code Quality

- Remove unused `dateToColIdx` maps from both `MonthEngine` and `TimeEngine`
  - These maps were built but never used in layout calculations

### 🧪 Testing

- Add 8 new tests in `MonthEngine.test.ts`:
  - 5 tests for hidden-day gap segmentation (Tuesday hidden, weekends hidden, multiple gaps, all visible, outside range)
  - 3 tests for `disabled` day event exclusion (HalfMonth scenario, only disabled days, disabled creates gaps)
- Add 6 new tests in `TimeEngine.test.ts` for `calculateAllDayLayout`:
  - Hidden day gaps, weekends hidden, all visible, multiple non-contiguous islands, empty events, empty columns
- Total: 216 tests passing (100% success rate)

## [0.11.0] - 2025-11-25

### ✨ Features

- **Extensible view system**: Complete architecture refactoring to support custom view plugins
  - Introduce `BaseView` abstract class for custom view implementations
  - Add `ViewRegistry` for dynamic view registration and management
  - Built-in views (MonthView, WeekView, DayView) refactored to use new system
  - Support custom view registration via `Calendar.registerView()` API
  - Enable view extension through standard class inheritance
  - Dynamic view switcher in header based on registered views

### 🏗️ Architecture

- **View lifecycle management**: Add comprehensive lifecycle hooks
  - `onMount()`: Called when view is activated
  - `onUnmount()`: Called when view is deactivated
  - `getHeaderTitle()`: Custom header title generation
  - `getNavigationUnit()`: Custom navigation behavior
- **View context system**: Provide centralized context for view instances
  - Access to current date, adapter, event manager, and config
  - `requestRender()` callback for triggering re-renders
  - `goToDate()` for programmatic navigation
- **Backward compatibility**: Public API unchanged, internal refactoring only

### 📦 Exports

- Export view system classes: `BaseView`, `ViewRegistry`, `MonthView`, `TimeView`, `WeekView`, `DayView`
- Export view system types: `ViewContext`, `ViewMeta`, `ViewRenderOptions`, `ViewClass`, `ViewRegistrationOptions`
- Export `ExtendedCalendarConfig` type for TypeScript users

### 📚 Documentation

- Add comprehensive JSDoc comments for view system APIs
- Document custom view creation patterns
- Add examples for view extension via inheritance

### 🧪 Testing

- Add `ViewRegistry.test.ts` with 8 comprehensive tests
- Add `ViewUsage.test.ts` integration tests
- All tests passing (100% success rate)

## [0.10.0] - 2025-11-25

### ✨ Features

- **All-day events section**: Week and day views now include a dedicated all-day events section at the top
  - Automatic detection of all-day events (00:00-00:00 or 00:00-23:59 time ranges)
  - Multi-day spanning event support with proper visual continuity
  - Intelligent layout stacking to prevent overlaps
  - Full drag & drop support for repositioning all-day events
- **Month view event overflow handling**: Add `maxEventsPerRow` configuration to limit visible events per date cell
  - Automatic "+N more" indicator for hidden events
  - Interactive popover showing complete list of hidden events
  - Custom popover rendering with `onRenderMoreEventsPopover` hook
  - Dynamic row height calculation based on visible events
  - Smart viewport boundary detection for popover positioning
- **Enhanced demo page**: Complete redesign with Swiss Brutalist aesthetic
  - Interactive sidebar with real-time configuration controls
  - Active days selector for custom day filtering
  - Drag & drop configuration panel
  - Event log panel with activity tracking
  - Config export with copy-to-clipboard functionality

### 🎨 Styles

- **Improved layout system**: Calendar now uses flex layout to fill available container space
- **Better month view grid**: CSS grid with auto-rows for even row distribution
- **Enhanced event styling**: Improved hover effects with box-shadow and brightness adjustments
- **All-day section styling**: Dedicated styles for the new all-day events area
- **Popover styling**: Visual design for "+N more" indicators and event list popovers

### 🏗️ Refactoring

- **Modular CSS architecture**: Split monolithic styles.css into focused modules
  - `base.css`: Core layout and container styles
  - `month.css`: Month view specific styles
  - `time.css`: Week/day view specific styles
  - `events.css`: Event component styling
  - `styles.css`: Unified entry point importing all modules
- **Event positioning refinements**: Optimized positioning logic for all-day and regular events

### 📚 Documentation

- Updated type definitions with comprehensive JSDoc comments
- Added `AllDayLayoutItem` type for all-day event layout calculations
- Enhanced `CalendarConfig` with new options documentation

## [0.9.3] - 2025-11-25

### ⚡ Performance

- **GPU-accelerated event positioning**: Replace left/top CSS positioning with `transform: translate()` for hardware acceleration
  - Significantly improved rendering performance for calendars with many events
  - Smoother animations and interactions
  - Reduced browser reflow/repaint operations

### 🏗️ Refactoring

- **CSS modularization**: Split monolithic styles.css into focused modules (base, month, time, events)
- **Improved maintainability**: Better separation of concerns in styling architecture
- **Build optimization**: Vite config updated to properly merge CSS modules during build

### 🔧 Configuration

- Add `.release-it.json` for automated release workflow

## [0.9.2] - 2025-11-25

### 📦 Package

- Version bump to 0.9.2 for npm publishing

## [0.9.1] - 2025-11-25

### 🐛 Bug Fixes

- **Fix event callback timing**: Call `onEventDrop` and `onEventResize` callbacks **before** updating internal state, allowing callbacks to compare old vs new values correctly (event object is passed by reference)

### 📦 Package

- **Fix exports order**: Move `types` field to first position in package.json exports for better TypeScript module resolution
- **Add prepare script**: Add `npm run build` as prepare lifecycle hook
- **Extend date-fns support**: Update peer dependency to support date-fns v4.0.0

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

[Unreleased]: https://github.com/taskgenius/calendar/compare/v0.12.1...HEAD
[0.12.1]: https://github.com/taskgenius/calendar/compare/v0.12.0...v0.12.1
[0.12.0]: https://github.com/taskgenius/calendar/compare/v0.11.1...v0.12.0
[0.11.1]: https://github.com/taskgenius/calendar/compare/v0.11.0...v0.11.1
[0.11.0]: https://github.com/taskgenius/calendar/compare/v0.10.0...v0.11.0
[0.10.0]: https://github.com/taskgenius/calendar/compare/v0.9.3...v0.10.0
[0.9.3]: https://github.com/taskgenius/calendar/compare/v0.9.2...v0.9.3
[0.9.2]: https://github.com/taskgenius/calendar/compare/v0.9.1...v0.9.2
[0.9.1]: https://github.com/taskgenius/calendar/compare/v0.9.0...v0.9.1
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
