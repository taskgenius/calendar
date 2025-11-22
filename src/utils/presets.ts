/**
 * Preset filter and formatter functions for common use cases
 *
 * @module utils/presets
 */

import type {
  DayFilterContext,
  DayFilterResult,
  TimeFilterResult,
  TimeFormatter,
} from "../types";

// =============================================================================
// Day Filter Presets
// =============================================================================

/**
 * Hide weekends (Saturday and Sunday)
 *
 * @returns Day filter function that excludes weekends
 * @example
 * ```typescript
 * new Calendar({
 *   view: {
 *     type: 'week',
 *     dayFilter: hideWeekends()
 *   }
 * });
 * ```
 */
export function hideWeekends(): (
  date: unknown,
  context: DayFilterContext,
) => DayFilterResult {
  return (_date: unknown, context: DayFilterContext) => {
    return !context.isWeekend;
  };
}

/**
 * Hide weekdays (Monday to Friday)
 *
 * @returns Day filter function that excludes weekdays
 * @example
 * ```typescript
 * new Calendar({
 *   view: {
 *     type: 'week',
 *     dayFilter: hideWeekdays()
 *   }
 * });
 * ```
 */
export function hideWeekdays(): (
  date: unknown,
  context: DayFilterContext,
) => DayFilterResult {
  return (_date: unknown, context: DayFilterContext) => {
    return context.isWeekend;
  };
}

/**
 * Show only specific days of the week
 *
 * @param days - Array of day indices to show (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
 * @returns Day filter function that shows only the specified days
 * @example
 * ```typescript
 * // Show only Monday to Friday
 * new Calendar({
 *   view: {
 *     type: 'week',
 *     dayFilter: onlyDays([1, 2, 3, 4, 5])
 *   }
 * });
 * ```
 */
export function onlyDays(days: number[]): (
  date: unknown,
  context: DayFilterContext,
) => DayFilterResult {
  return (_date: unknown, context: DayFilterContext) => {
    return days.includes(context.dayOfWeek);
  };
}

/**
 * Hide specific days of the week
 *
 * @param days - Array of day indices to hide (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
 * @returns Day filter function that hides the specified days
 * @example
 * ```typescript
 * // Hide Tuesday and Thursday
 * new Calendar({
 *   view: {
 *     type: 'week',
 *     dayFilter: hideDays([2, 4])
 *   }
 * });
 * ```
 */
export function hideDays(days: number[]): (
  date: unknown,
  context: DayFilterContext,
) => DayFilterResult {
  return (_date: unknown, context: DayFilterContext) => {
    return !days.includes(context.dayOfWeek);
  };
}

// =============================================================================
// Time Filter Presets
// =============================================================================

/**
 * Show only working hours
 *
 * @param startHour - Start hour (default: 8)
 * @param endHour - End hour, exclusive (default: 18)
 * @returns Time filter function that shows only the specified hour range
 * @example
 * ```typescript
 * // Show 9:00 AM to 5:00 PM
 * new Calendar({
 *   view: {
 *     type: 'day',
 *     timeFilter: workingHours(9, 17)
 *   }
 * });
 * ```
 */
export function workingHours(
  startHour = 8,
  endHour = 18,
): (hour: number) => TimeFilterResult {
  return (hour: number) => {
    return hour >= startHour && hour < endHour;
  };
}

/**
 * Hide specific hours
 *
 * @param hours - Array of hour values to hide (0-23)
 * @returns Time filter function that hides the specified hours
 * @example
 * ```typescript
 * // Hide midnight and lunch hour
 * new Calendar({
 *   view: {
 *     type: 'day',
 *     timeFilter: hideHours([0, 12])
 *   }
 * });
 * ```
 */
export function hideHours(hours: number[]): (hour: number) => TimeFilterResult {
  return (hour: number) => {
    return !hours.includes(hour);
  };
}

/**
 * Show only specific hours
 *
 * @param hours - Array of hour values to show (0-23)
 * @returns Time filter function that shows only the specified hours
 * @example
 * ```typescript
 * // Show only 9, 10, 11, 14, 15, 16
 * new Calendar({
 *   view: {
 *     type: 'day',
 *     timeFilter: onlyHours([9, 10, 11, 14, 15, 16])
 *   }
 * });
 * ```
 */
export function onlyHours(hours: number[]): (hour: number) => TimeFilterResult {
  return (hour: number) => {
    return hours.includes(hour);
  };
}

// =============================================================================
// Time Formatter Presets
// =============================================================================

/**
 * Format time in 12-hour format with AM/PM
 *
 * @returns Time formatter function for 12-hour format
 * @example
 * ```typescript
 * new Calendar({
 *   view: {
 *     type: 'day',
 *     timeFormatter: format12h()
 *   }
 * });
 * // Output: "8 AM", "12 PM", "3:30 PM"
 * ```
 */
export function format12h(): TimeFormatter {
  return (hour: number, minute = 0) => {
    const period = hour >= 12 ? "PM" : "AM";
    const h = hour % 12 || 12;
    return minute > 0
      ? `${h}:${minute.toString().padStart(2, "0")} ${period}`
      : `${h} ${period}`;
  };
}

/**
 * Format time in 24-hour format (HH:mm or HH:00)
 *
 * @returns Time formatter function for 24-hour format
 * @example
 * ```typescript
 * new Calendar({
 *   view: {
 *     type: 'day',
 *     timeFormatter: format24h()
 *   }
 * });
 * // Output: "08:00", "12:00", "15:30"
 * ```
 */
export function format24h(): TimeFormatter {
  return (hour: number, minute = 0) => {
    return minute > 0
      ? `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`
      : `${hour}:00`;
  };
}

/**
 * Custom time labels for specific hours
 *
 * @param labels - Mapping of hour to label string
 * @param fallback - Optional fallback formatter for unlabeled hours (defaults to "HH:00")
 * @returns Time formatter function with custom labels
 * @example
 * ```typescript
 * new Calendar({
 *   view: {
 *     type: 'day',
 *     timeFormatter: customTimeLabels({
 *       9: 'Morning Standup',
 *       12: 'Lunch Break',
 *       17: 'End of Day'
 *     })
 *   }
 * });
 * // Output: "Morning Standup" at 9:00, "12:00" at other hours
 * ```
 */
export function customTimeLabels(
  labels: Record<number, string>,
  fallback?: TimeFormatter,
): TimeFormatter {
  const defaultFormatter = fallback || format24h();
  return (hour: number, minute = 0) => {
    return labels[hour] || defaultFormatter(hour, minute);
  };
}

/**
 * Compact time format (no leading zeros, no ":00" for whole hours)
 *
 * @returns Time formatter function for compact format
 * @example
 * ```typescript
 * new Calendar({
 *   view: {
 *     type: 'day',
 *     timeFormatter: formatCompact()
 *   }
 * });
 * // Output: "8", "12", "3:30"
 * ```
 */
export function formatCompact(): TimeFormatter {
  return (hour: number, minute = 0) => {
    return minute > 0 ? `${hour}:${minute.toString().padStart(2, "0")}` : `${hour}`;
  };
}
