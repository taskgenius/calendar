# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/taskgenius/calendar/compare/v0.5.0...HEAD
[0.5.0]: https://github.com/taskgenius/calendar/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/taskgenius/calendar/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/taskgenius/calendar/compare/v0.2.1...v0.3.0
[0.2.1]: https://github.com/taskgenius/calendar/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/taskgenius/calendar/compare/v0.1.1...v0.2.0
[0.1.1]: https://github.com/taskgenius/calendar/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/taskgenius/calendar/releases/tag/v0.1.0
