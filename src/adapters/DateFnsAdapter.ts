import type { DateAdapter, TimeUnit } from "../types";

// Type-only imports to avoid bundling date-fns if not used
type DateFnsDate = Date;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DateFns = any;

/**
 * date-fns adapter implementation
 * Requires date-fns to be installed as a peer dependency
 */
export class DateFnsAdapter implements DateAdapter<DateFnsDate> {
  private fns: DateFns;

  constructor(dateFns: DateFns) {
    this.fns = dateFns;
  }

  // =============================================================================
  // Creation
  // =============================================================================

  create(date?: string | Date): Date {
    if (!date) return new Date();
    if (date instanceof Date) return new Date(date);
    return this.fns.parseISO(date);
  }

  parse(dateStr: string, formatStr?: string): Date {
    if (!formatStr) {
      // Default to ISO format
      return this.fns.parseISO(dateStr);
    }
    return this.fns.parse(dateStr, formatStr, new Date());
  }

  format(date: Date, formatStr: string): string {
    return this.fns.format(date, formatStr);
  }

  // =============================================================================
  // Getters
  // =============================================================================

  year(date: Date): number {
    return this.fns.getYear(date);
  }

  month(date: Date): number {
    return this.fns.getMonth(date);
  }

  date(date: Date): number {
    return this.fns.getDate(date);
  }

  day(date: Date): number {
    return this.fns.getDay(date);
  }

  hour(date: Date): number {
    return this.fns.getHours(date);
  }

  minute(date: Date): number {
    return this.fns.getMinutes(date);
  }

  // =============================================================================
  // Setters
  // =============================================================================

  setHour(date: Date, hour: number): Date {
    return this.fns.setHours(date, hour);
  }

  setMinute(date: Date, minute: number): Date {
    return this.fns.setMinutes(date, minute);
  }

  // =============================================================================
  // Calculations
  // =============================================================================

  add(date: Date, amount: number, unit: TimeUnit): Date {
    switch (unit) {
      case "year":
        return this.fns.addYears(date, amount);
      case "month":
        return this.fns.addMonths(date, amount);
      case "week":
        return this.fns.addWeeks(date, amount);
      case "day":
        return this.fns.addDays(date, amount);
      case "hour":
        return this.fns.addHours(date, amount);
      case "minute":
        return this.fns.addMinutes(date, amount);
      default:
        return date;
    }
  }

  diff(date1: Date, date2: Date, unit: TimeUnit): number {
    switch (unit) {
      case "year":
        return this.fns.differenceInYears(date1, date2);
      case "month":
        return this.fns.differenceInMonths(date1, date2);
      case "week":
        return this.fns.differenceInWeeks(date1, date2);
      case "day":
        return this.fns.differenceInDays(date1, date2);
      case "hour":
        return this.fns.differenceInHours(date1, date2);
      case "minute":
        return this.fns.differenceInMinutes(date1, date2);
      default:
        return 0;
    }
  }

  // =============================================================================
  // Boundaries
  // =============================================================================

  startOf(date: Date, unit: TimeUnit): Date {
    switch (unit) {
      case "year":
        return this.fns.startOfYear(date);
      case "month":
        return this.fns.startOfMonth(date);
      case "week":
        return this.fns.startOfWeek(date);
      case "day":
        return this.fns.startOfDay(date);
      case "hour":
        return this.fns.startOfHour(date);
      case "minute":
        return this.fns.startOfMinute(date);
      default:
        return date;
    }
  }

  endOf(date: Date, unit: TimeUnit): Date {
    switch (unit) {
      case "year":
        return this.fns.endOfYear(date);
      case "month":
        return this.fns.endOfMonth(date);
      case "week":
        return this.fns.endOfWeek(date);
      case "day":
        return this.fns.endOfDay(date);
      case "hour":
        return this.fns.endOfHour(date);
      case "minute":
        return this.fns.endOfMinute(date);
      default:
        return date;
    }
  }

  // =============================================================================
  // Comparisons
  // =============================================================================

  isBefore(date1: Date, date2: Date, unit?: TimeUnit): boolean {
    if (!unit) return this.fns.isBefore(date1, date2);
    return this.fns.isBefore(
      this.startOf(date1, unit),
      this.startOf(date2, unit),
    );
  }

  isAfter(date1: Date, date2: Date, unit?: TimeUnit): boolean {
    if (!unit) return this.fns.isAfter(date1, date2);
    return this.fns.isAfter(
      this.startOf(date1, unit),
      this.startOf(date2, unit),
    );
  }

  isSame(date1: Date, date2: Date, unit?: TimeUnit): boolean {
    if (!unit) return this.fns.isEqual(date1, date2);
    return this.fns.isEqual(
      this.startOf(date1, unit),
      this.startOf(date2, unit),
    );
  }
}
