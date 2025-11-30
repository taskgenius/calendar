import type { DateAdapter, TimeUnit } from "../types";

/**
 * Moment.js type definition (minimal interface for adapter usage)
 * Avoids importing moment.js directly to keep it as peer dependency
 */
interface MomentInstance {
  clone(): MomentInstance;
  year(): number;
  month(): number;
  date(): number;
  day(): number;
  hour(): number;
  minute(): number;
  hour(value: number): MomentInstance;
  minute(value: number): MomentInstance;
  add(amount: number, unit: string): MomentInstance;
  diff(other: MomentInstance, unit: string): number;
  startOf(unit: string): MomentInstance;
  endOf(unit: string): MomentInstance;
  isBefore(other: MomentInstance, unit?: string): boolean;
  isAfter(other: MomentInstance, unit?: string): boolean;
  isSame(other: MomentInstance, unit?: string): boolean;
  format(formatStr: string): string;
}

interface MomentStatic {
  (input?: string | Date | MomentInstance): MomentInstance;
}

/**
 * Moment.js adapter implementation
 *
 * Designed for legacy projects and Obsidian plugins that already use Moment.js.
 * Obsidian provides moment globally, making this adapter zero-cost for Obsidian users.
 *
 * @example
 * ```typescript
 * // In Obsidian environment
 * import { MomentAdapter } from '@taskgenius/calendar';
 * import { moment } from 'moment';
 * const adapter = new MomentAdapter(moment);
 *
 * // In Node.js/browser with moment installed
 * import moment from 'moment';
 * import { MomentAdapter } from '@taskgenius/calendar';
 * const adapter = new MomentAdapter(moment);
 * ```
 */
export class MomentAdapter implements DateAdapter<MomentInstance> {
  private moment: MomentStatic;

  constructor(moment: MomentStatic) {
    this.moment = moment;
  }

  // ===========================================================================
  // Creation
  // ===========================================================================

  create(date?: string | Date | MomentInstance): MomentInstance {
    return this.moment(date);
  }

  parse(dateStr: string, _format?: string): MomentInstance {
    // Moment auto-parses ISO 8601 and common formats
    return this.moment(dateStr);
  }

  format(date: MomentInstance, formatStr: string): string {
    // Convert unicode tokens to Moment.js tokens for compatibility
    // yyyy → YYYY, dd → DD, d → D
    const momentFormat = formatStr
      .replace(/yyyy/g, "YYYY")
      .replace(/dd/g, "DD")
      .replace(/\bd\b/g, "D");

    return date.format(momentFormat);
  }

  // ===========================================================================
  // Getters
  // ===========================================================================

  year(date: MomentInstance): number {
    return date.year();
  }

  month(date: MomentInstance): number {
    return date.month();
  }

  date(date: MomentInstance): number {
    return date.date();
  }

  day(date: MomentInstance): number {
    return date.day();
  }

  hour(date: MomentInstance): number {
    return date.hour();
  }

  minute(date: MomentInstance): number {
    return date.minute();
  }

  // ===========================================================================
  // Setters
  // ===========================================================================

  setHour(date: MomentInstance, hour: number): MomentInstance {
    return date.clone().hour(hour);
  }

  setMinute(date: MomentInstance, minute: number): MomentInstance {
    return date.clone().minute(minute);
  }

  // ===========================================================================
  // Calculations
  // ===========================================================================

  add(date: MomentInstance, amount: number, unit: TimeUnit): MomentInstance {
    return date.clone().add(amount, unit);
  }

  diff(date1: MomentInstance, date2: MomentInstance, unit: TimeUnit): number {
    return date1.diff(date2, unit);
  }

  // ===========================================================================
  // Boundaries
  // ===========================================================================

  startOf(date: MomentInstance, unit: TimeUnit): MomentInstance {
    return date.clone().startOf(unit);
  }

  endOf(date: MomentInstance, unit: TimeUnit): MomentInstance {
    return date.clone().endOf(unit);
  }

  // ===========================================================================
  // Comparisons
  // ===========================================================================

  isBefore(
    date1: MomentInstance,
    date2: MomentInstance,
    unit?: TimeUnit,
  ): boolean {
    return date1.isBefore(date2, unit);
  }

  isAfter(
    date1: MomentInstance,
    date2: MomentInstance,
    unit?: TimeUnit,
  ): boolean {
    return date1.isAfter(date2, unit);
  }

  isSame(
    date1: MomentInstance,
    date2: MomentInstance,
    unit?: TimeUnit,
  ): boolean {
    return date1.isSame(date2, unit);
  }
}
