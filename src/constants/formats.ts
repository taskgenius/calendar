/**
 * Default date format configurations for the calendar
 * Uses unicode format tokens (compatible with date-fns and Day.js)
 */
import type { DateFormatConfig } from "../types";

/**
 * Default date formats using unicode tokens
 * These are used when no custom dateFormats configuration is provided
 */
export const DEFAULT_DATE_FORMATS: Required<DateFormatConfig> = {
  date: "yyyy-MM-dd",
  dateTime: "yyyy-MM-dd HH:mm",
  time: "HH:mm",
  monthHeader: "yyyy年 M月",
  dayHeader: "yyyy年M月d日",
};

/**
 * Internal data exchange format (ISO 8601)
 *
 * Used for:
 * - Public API return values (getCurrentDate)
 * - Event callbacks (onEventDrop)
 * - Internal data passing between components
 *
 * Design rationale:
 * - Ensures reliability: ISO format is standardized and unambiguous
 * - Separation of concerns: Data format ≠ Display format
 * - Parse reliability: All adapters can reliably parse ISO format
 *
 * Note: Display formats (dateFormats config) are used only for UI rendering
 */
export const INTERNAL_DATA_FORMAT = {
  date: "yyyy-MM-dd",
  dateTime: "yyyy-MM-dd HH:mm",
} as const;
