# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.3.0] - 2025-11-21

### ✨ Features

- **Custom Header Format**: Add `headerFormat` configuration option to customize calendar header title formats for month and day views
  - `headerFormat.month`: Custom format for month/week view headers (default: "YYYY年 M月")
  - `headerFormat.day`: Custom format for day view headers (default: "YYYY年M月D日")
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

[Unreleased]: https://github.com/taskgenius/calendar/compare/v0.3.0...HEAD
[0.3.0]: https://github.com/taskgenius/calendar/compare/v0.2.1...v0.3.0
[0.2.1]: https://github.com/taskgenius/calendar/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/taskgenius/calendar/compare/v0.1.1...v0.2.0
[0.1.1]: https://github.com/taskgenius/calendar/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/taskgenius/calendar/releases/tag/v0.1.0
