import type { DateAdapter, TimeUnit } from "../types";

/**
 * Native JavaScript Date adapter implementation
 * Zero dependencies, uses built-in Date API
 */
export class NativeDateAdapter implements DateAdapter<Date> {
  // =============================================================================
  // Creation
  // =============================================================================

  create(date?: string | Date): Date {
    if (!date) return new Date();
    if (date instanceof Date) return new Date(date);
    return new Date(date);
  }

  parse(dateStr: string, _format?: string): Date {
    // Support multiple formats:
    // - Date only: yyyy-MM-dd, yyyy/MM/dd
    // - DateTime with space: yyyy-MM-dd HH:mm, yyyy-MM-dd HH:mm:ss
    // - ISO 8601 with T: yyyy-MM-ddTHH:mm:ss, yyyy-MM-ddTHH:mm:ss.sssZ
    // Format parameter is ignored as native Date is limited

    // Normalize separators to - for consistent parsing
    const normalized = dateStr.replace(/\//g, "-");

    // ISO 8601 format with T separator
    if (normalized.includes("T")) {
      const [datePart, timePart] = normalized.split("T");
      const [year, month, day] = datePart!.split("-").map(Number);
      // Remove timezone suffix (Z, +08:00, -05:00) to treat as local time
      const timeOnly = timePart!.replace(/[Z+-].*$/, "");
      const timeParts = timeOnly.split(":").map(Number);
      const [hour, minute, second] = timeParts;
      return new Date(
        year!,
        month! - 1,
        day!,
        hour ?? 0,
        minute ?? 0,
        second ?? 0,
      );
    }

    // Space-separated datetime format
    if (normalized.includes(" ")) {
      const [datePart, timePart] = normalized.split(" ");
      const [year, month, day] = datePart!.split("-").map(Number);
      const timeParts = timePart!.split(":").map(Number);
      const [hour, minute, second] = timeParts;
      return new Date(
        year!,
        month! - 1,
        day!,
        hour ?? 0,
        minute ?? 0,
        second ?? 0,
      );
    }

    // Date only
    const [year, month, day] = normalized.split("-").map(Number);
    return new Date(year!, month! - 1, day!);
  }

  format(date: Date, format: string): string {
    const year = date.getFullYear();
    const monthNum = date.getMonth() + 1;
    const dayNum = date.getDate();
    const month = String(monthNum).padStart(2, "0");
    const day = String(dayNum).padStart(2, "0");
    const hour = String(date.getHours()).padStart(2, "0");
    const minute = String(date.getMinutes()).padStart(2, "0");
    const second = String(date.getSeconds()).padStart(2, "0");

    // Support both legacy tokens (YYYY, DD, D) and unicode tokens (yyyy, dd, d)
    // IMPORTANT: Replace multi-character tokens first, then single-character tokens
    return format
      .replace(/YYYY/g, String(year))
      .replace(/yyyy/g, String(year))
      .replace(/MM/g, month)
      .replace(/DD/g, day)
      .replace(/dd/g, day)
      .replace(/HH/g, hour)
      .replace(/mm/g, minute)
      .replace(/ss/g, second)
      .replace(/\bM\b/g, String(monthNum)) // Single M without padding
      .replace(/\bD\b/g, String(dayNum)) // Single D without padding
      .replace(/\bd\b/g, String(dayNum)); // Single d without padding
  }

  // =============================================================================
  // Getters
  // =============================================================================

  year(date: Date): number {
    return date.getFullYear();
  }

  month(date: Date): number {
    return date.getMonth();
  }

  date(date: Date): number {
    return date.getDate();
  }

  day(date: Date): number {
    return date.getDay();
  }

  hour(date: Date): number {
    return date.getHours();
  }

  minute(date: Date): number {
    return date.getMinutes();
  }

  // =============================================================================
  // Setters
  // =============================================================================

  setHour(date: Date, hour: number): Date {
    const newDate = new Date(date);
    newDate.setHours(hour);
    return newDate;
  }

  setMinute(date: Date, minute: number): Date {
    const newDate = new Date(date);
    newDate.setMinutes(minute);
    return newDate;
  }

  // =============================================================================
  // Calculations
  // =============================================================================

  add(date: Date, amount: number, unit: TimeUnit): Date {
    const newDate = new Date(date);
    switch (unit) {
      case "year":
        newDate.setFullYear(newDate.getFullYear() + amount);
        break;
      case "month":
        newDate.setMonth(newDate.getMonth() + amount);
        break;
      case "week":
        newDate.setDate(newDate.getDate() + amount * 7);
        break;
      case "day":
        newDate.setDate(newDate.getDate() + amount);
        break;
      case "hour":
        newDate.setHours(newDate.getHours() + amount);
        break;
      case "minute":
        newDate.setMinutes(newDate.getMinutes() + amount);
        break;
    }
    return newDate;
  }

  diff(date1: Date, date2: Date, unit: TimeUnit): number {
    const ms = date1.getTime() - date2.getTime();
    switch (unit) {
      case "year":
        return date1.getFullYear() - date2.getFullYear();
      case "month":
        return (
          (date1.getFullYear() - date2.getFullYear()) * 12 +
          (date1.getMonth() - date2.getMonth())
        );
      case "week":
        return Math.floor(ms / (7 * 24 * 60 * 60 * 1000));
      case "day":
        return Math.floor(ms / (24 * 60 * 60 * 1000));
      case "hour":
        return Math.floor(ms / (60 * 60 * 1000));
      case "minute":
        return Math.floor(ms / (60 * 1000));
      default:
        return 0;
    }
  }

  // =============================================================================
  // Boundaries
  // =============================================================================

  startOf(date: Date, unit: TimeUnit): Date {
    const newDate = new Date(date);
    switch (unit) {
      case "year":
        newDate.setMonth(0, 1);
        newDate.setHours(0, 0, 0, 0);
        break;
      case "month":
        newDate.setDate(1);
        newDate.setHours(0, 0, 0, 0);
        break;
      case "week": {
        const day = newDate.getDay();
        newDate.setDate(newDate.getDate() - day);
        newDate.setHours(0, 0, 0, 0);
        break;
      }
      case "day":
        newDate.setHours(0, 0, 0, 0);
        break;
      case "hour":
        newDate.setMinutes(0, 0, 0);
        break;
      case "minute":
        newDate.setSeconds(0, 0);
        break;
    }
    return newDate;
  }

  endOf(date: Date, unit: TimeUnit): Date {
    const newDate = new Date(date);
    switch (unit) {
      case "year":
        newDate.setMonth(11, 31);
        newDate.setHours(23, 59, 59, 999);
        break;
      case "month":
        newDate.setMonth(newDate.getMonth() + 1, 0);
        newDate.setHours(23, 59, 59, 999);
        break;
      case "week": {
        const day = newDate.getDay();
        newDate.setDate(newDate.getDate() + (6 - day));
        newDate.setHours(23, 59, 59, 999);
        break;
      }
      case "day":
        newDate.setHours(23, 59, 59, 999);
        break;
      case "hour":
        newDate.setMinutes(59, 59, 999);
        break;
      case "minute":
        newDate.setSeconds(59, 999);
        break;
    }
    return newDate;
  }

  // =============================================================================
  // Comparisons
  // =============================================================================

  isBefore(date1: Date, date2: Date, unit?: TimeUnit): boolean {
    if (!unit) return date1.getTime() < date2.getTime();
    return (
      this.startOf(date1, unit).getTime() < this.startOf(date2, unit).getTime()
    );
  }

  isAfter(date1: Date, date2: Date, unit?: TimeUnit): boolean {
    if (!unit) return date1.getTime() > date2.getTime();
    return (
      this.startOf(date1, unit).getTime() > this.startOf(date2, unit).getTime()
    );
  }

  isSame(date1: Date, date2: Date, unit?: TimeUnit): boolean {
    if (!unit) return date1.getTime() === date2.getTime();
    return (
      this.startOf(date1, unit).getTime() ===
      this.startOf(date2, unit).getTime()
    );
  }
}
