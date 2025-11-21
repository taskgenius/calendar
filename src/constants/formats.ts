/**
 * Default date format configurations for the calendar
 * Uses Day.js format tokens by default (YYYY, MM, DD, HH, mm)
 */
import type { DateFormatConfig } from "../types";

/**
 * Default date formats using Day.js tokens
 * These are used when no custom dateFormats configuration is provided
 */
export const DEFAULT_DATE_FORMATS: Required<DateFormatConfig> = {
  date: "YYYY-MM-DD",
  dateTime: "YYYY-MM-DD HH:mm",
  time: "HH:mm",
  monthHeader: "YYYY年 M月",
  dayHeader: "YYYY年M月D日",
};

/**
 * Internal data exchange format (ISO 8601)
 *
 * Used for:
 * - Public API return values (getCurrentDate)
 * - Event callbacks (onDateChange, onEventDrop)
 * - Internal data passing between components
 *
 * Design rationale:
 * - Ensures reliability: ISO format is standardized and unambiguous
 * - Maintains backward compatibility: External APIs don't change format
 * - Separation of concerns: Data format ≠ Display format
 * - Parse reliability: All adapters can reliably parse ISO format
 *
 * Note: Display formats (dateFormats config) are used only for UI rendering
 */
export const INTERNAL_DATA_FORMAT = {
  date: "YYYY-MM-DD",
  dateTime: "YYYY-MM-DD HH:mm",
} as const;
