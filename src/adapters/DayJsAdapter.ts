/**
 * Day.js implementation of DateAdapter
 */
import dayjs, { Dayjs } from 'dayjs';
import type { DateAdapter, TimeUnit } from '../types';

/**
 * DateAdapter implementation using Day.js
 */
export class DayJsAdapter implements DateAdapter<Dayjs> {
  // ==========================================================================
  // Creation Methods
  // ==========================================================================

  create(date?: string | Date | Dayjs): Dayjs {
    return dayjs(date);
  }

  parse(dateStr: string, _format?: string): Dayjs {
    // Day.js auto-parses most formats
    return dayjs(dateStr);
  }

  format(date: Dayjs, formatStr: string): string {
    return date.format(formatStr);
  }

  // ==========================================================================
  // Getter Methods
  // ==========================================================================

  year(date: Dayjs): number {
    return date.year();
  }

  month(date: Dayjs): number {
    return date.month();
  }

  date(date: Dayjs): number {
    return date.date();
  }

  day(date: Dayjs): number {
    return date.day();
  }

  hour(date: Dayjs): number {
    return date.hour();
  }

  minute(date: Dayjs): number {
    return date.minute();
  }

  // ==========================================================================
  // Setter Methods
  // ==========================================================================

  setHour(date: Dayjs, hour: number): Dayjs {
    return date.hour(hour);
  }

  setMinute(date: Dayjs, minute: number): Dayjs {
    return date.minute(minute);
  }

  // ==========================================================================
  // Calculation Methods
  // ==========================================================================

  add(date: Dayjs, amount: number, unit: TimeUnit): Dayjs {
    return date.add(amount, unit);
  }

  diff(date1: Dayjs, date2: Dayjs, unit: TimeUnit): number {
    return date1.diff(date2, unit);
  }

  // ==========================================================================
  // Boundary Methods
  // ==========================================================================

  startOf(date: Dayjs, unit: TimeUnit): Dayjs {
    return date.startOf(unit);
  }

  endOf(date: Dayjs, unit: TimeUnit): Dayjs {
    return date.endOf(unit);
  }

  // ==========================================================================
  // Comparison Methods
  // ==========================================================================

  isBefore(date1: Dayjs, date2: Dayjs, unit?: TimeUnit): boolean {
    return date1.isBefore(date2, unit);
  }

  isAfter(date1: Dayjs, date2: Dayjs, unit?: TimeUnit): boolean {
    return date1.isAfter(date2, unit);
  }

  isSame(date1: Dayjs, date2: Dayjs, unit?: TimeUnit): boolean {
    return date1.isSame(date2, unit);
  }
}
