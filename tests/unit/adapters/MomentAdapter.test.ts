import { describe, it, expect, beforeAll } from "vitest";
import { MomentAdapter } from "../../../src/adapters/MomentAdapter";

// Mock moment.js for testing
// In real usage, users would pass the actual moment library
const createMockMoment = () => {
  const createInstance = (input?: string | Date | ReturnType<typeof createInstance>) => {
    let date: Date;

    if (!input) {
      date = new Date();
    } else if (input instanceof Date) {
      date = new Date(input);
    } else if (typeof input === "string") {
      date = new Date(input);
    } else {
      // Clone from another mock instance
      date = new Date((input as { _date: Date })._date);
    }

    const instance = {
      _date: date,

      clone() {
        return createInstance(this);
      },

      year(value?: number) {
        if (value !== undefined) {
          const newDate = new Date(this._date);
          newDate.setFullYear(value);
          return createInstance(newDate);
        }
        return this._date.getFullYear();
      },

      month(value?: number) {
        if (value !== undefined) {
          const newDate = new Date(this._date);
          newDate.setMonth(value);
          return createInstance(newDate);
        }
        return this._date.getMonth();
      },

      date(value?: number) {
        if (value !== undefined) {
          const newDate = new Date(this._date);
          newDate.setDate(value);
          return createInstance(newDate);
        }
        return this._date.getDate();
      },

      day() {
        return this._date.getDay();
      },

      hour(value?: number) {
        if (value !== undefined) {
          const newDate = new Date(this._date);
          newDate.setHours(value);
          return createInstance(newDate);
        }
        return this._date.getHours();
      },

      minute(value?: number) {
        if (value !== undefined) {
          const newDate = new Date(this._date);
          newDate.setMinutes(value);
          return createInstance(newDate);
        }
        return this._date.getMinutes();
      },

      add(amount: number, unit: string) {
        const newDate = new Date(this._date);
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
        return createInstance(newDate);
      },

      diff(other: ReturnType<typeof createInstance>, unit: string) {
        const ms = this._date.getTime() - (other as { _date: Date })._date.getTime();
        switch (unit) {
          case "year":
            return this._date.getFullYear() - (other as { _date: Date })._date.getFullYear();
          case "month":
            return (
              (this._date.getFullYear() - (other as { _date: Date })._date.getFullYear()) * 12 +
              (this._date.getMonth() - (other as { _date: Date })._date.getMonth())
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
      },

      startOf(unit: string) {
        const newDate = new Date(this._date);
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
        return createInstance(newDate);
      },

      endOf(unit: string) {
        const newDate = new Date(this._date);
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
        return createInstance(newDate);
      },

      isBefore(other: ReturnType<typeof createInstance>, unit?: string) {
        if (!unit) {
          return this._date.getTime() < (other as { _date: Date })._date.getTime();
        }
        return this.startOf(unit)._date.getTime() < (other as ReturnType<typeof createInstance>).startOf(unit)._date.getTime();
      },

      isAfter(other: ReturnType<typeof createInstance>, unit?: string) {
        if (!unit) {
          return this._date.getTime() > (other as { _date: Date })._date.getTime();
        }
        return this.startOf(unit)._date.getTime() > (other as ReturnType<typeof createInstance>).startOf(unit)._date.getTime();
      },

      isSame(other: ReturnType<typeof createInstance>, unit?: string) {
        if (!unit) {
          return this._date.getTime() === (other as { _date: Date })._date.getTime();
        }
        return this.startOf(unit)._date.getTime() === (other as ReturnType<typeof createInstance>).startOf(unit)._date.getTime();
      },

      format(formatStr: string) {
        const year = this._date.getFullYear();
        const month = String(this._date.getMonth() + 1).padStart(2, "0");
        const day = String(this._date.getDate()).padStart(2, "0");
        const hour = String(this._date.getHours()).padStart(2, "0");
        const minute = String(this._date.getMinutes()).padStart(2, "0");
        const second = String(this._date.getSeconds()).padStart(2, "0");

        return formatStr
          .replace(/YYYY/g, String(year))
          .replace(/MM/g, month)
          .replace(/DD/g, day)
          .replace(/HH/g, hour)
          .replace(/mm/g, minute)
          .replace(/ss/g, second)
          .replace(/\bM\b/g, String(this._date.getMonth() + 1))
          .replace(/\bD\b/g, String(this._date.getDate()));
      },
    };

    return instance;
  };

  return createInstance;
};

describe("MomentAdapter", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let adapter: MomentAdapter;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockMoment: any;

  beforeAll(() => {
    mockMoment = createMockMoment();
    adapter = new MomentAdapter(mockMoment);
  });

  describe("create", () => {
    it("should create current date when no argument", () => {
      const date = adapter.create();
      expect(date).toBeDefined();
    });

    it("should create from Date object", () => {
      const input = new Date("2025-01-15T10:30:00");
      const result = adapter.create(input);
      expect(adapter.year(result)).toBe(2025);
      expect(adapter.month(result)).toBe(0);
      expect(adapter.date(result)).toBe(15);
    });

    it("should create from string", () => {
      const result = adapter.create("2025-01-15");
      expect(adapter.year(result)).toBe(2025);
      expect(adapter.month(result)).toBe(0);
      expect(adapter.date(result)).toBe(15);
    });
  });

  describe("parse", () => {
    it("should parse date-only string", () => {
      const result = adapter.parse("2025-01-15");
      expect(adapter.year(result)).toBe(2025);
      expect(adapter.month(result)).toBe(0);
      expect(adapter.date(result)).toBe(15);
    });

    it("should parse ISO 8601 format", () => {
      const result = adapter.parse("2025-01-15T14:30:45");
      expect(adapter.year(result)).toBe(2025);
      expect(adapter.month(result)).toBe(0);
      expect(adapter.date(result)).toBe(15);
      expect(adapter.hour(result)).toBe(14);
      expect(adapter.minute(result)).toBe(30);
    });
  });

  describe("format", () => {
    it("should format date with Moment.js tokens", () => {
      const date = adapter.create("2025-01-05T08:09:07");
      const result = adapter.format(date, "YYYY-MM-DD");
      expect(result).toBe("2025-01-05");
    });

    it("should format date with unicode tokens (converts to Moment.js)", () => {
      const date = adapter.create("2025-01-05T08:09:07");
      const result = adapter.format(date, "yyyy-MM-dd");
      expect(result).toBe("2025-01-05");
    });

    it("should format date with time", () => {
      const date = adapter.create("2025-01-05T08:09:07");
      const result = adapter.format(date, "YYYY-MM-DD HH:mm:ss");
      expect(result).toBe("2025-01-05 08:09:07");
    });
  });

  describe("getters", () => {
    it("should get year", () => {
      const date = adapter.create("2025-03-15T14:30:45");
      expect(adapter.year(date)).toBe(2025);
    });

    it("should get month (0-indexed)", () => {
      const date = adapter.create("2025-03-15T14:30:45");
      expect(adapter.month(date)).toBe(2);
    });

    it("should get date", () => {
      const date = adapter.create("2025-03-15T14:30:45");
      expect(adapter.date(date)).toBe(15);
    });

    it("should get day of week", () => {
      const date = adapter.create("2025-03-15T14:30:45");
      // 2025-03-15 is a Saturday (6)
      expect(adapter.day(date)).toBe(6);
    });

    it("should get hour", () => {
      const date = adapter.create("2025-03-15T14:30:45");
      expect(adapter.hour(date)).toBe(14);
    });

    it("should get minute", () => {
      const date = adapter.create("2025-03-15T14:30:45");
      expect(adapter.minute(date)).toBe(30);
    });
  });

  describe("setters", () => {
    it("should set hour (immutably)", () => {
      const date = adapter.create("2025-01-15T10:30:00");
      const result = adapter.setHour(date, 15);
      expect(adapter.hour(result)).toBe(15);
      expect(adapter.hour(date)).toBe(10); // Original unchanged
    });

    it("should set minute (immutably)", () => {
      const date = adapter.create("2025-01-15T10:30:00");
      const result = adapter.setMinute(date, 45);
      expect(adapter.minute(result)).toBe(45);
      expect(adapter.minute(date)).toBe(30); // Original unchanged
    });
  });

  describe("add", () => {
    it("should add years", () => {
      const date = adapter.create("2025-01-15T10:30:00");
      const result = adapter.add(date, 2, "year");
      expect(adapter.year(result)).toBe(2027);
    });

    it("should add months", () => {
      const date = adapter.create("2025-01-15T10:30:00");
      const result = adapter.add(date, 3, "month");
      expect(adapter.month(result)).toBe(3);
    });

    it("should add weeks", () => {
      const date = adapter.create("2025-01-15T10:30:00");
      const result = adapter.add(date, 2, "week");
      expect(adapter.date(result)).toBe(29);
    });

    it("should add days", () => {
      const date = adapter.create("2025-01-15T10:30:00");
      const result = adapter.add(date, 5, "day");
      expect(adapter.date(result)).toBe(20);
    });

    it("should add hours", () => {
      const date = adapter.create("2025-01-15T10:30:00");
      const result = adapter.add(date, 3, "hour");
      expect(adapter.hour(result)).toBe(13);
    });

    it("should add minutes", () => {
      const date = adapter.create("2025-01-15T10:30:00");
      const result = adapter.add(date, 45, "minute");
      expect(adapter.hour(result)).toBe(11);
      expect(adapter.minute(result)).toBe(15);
    });
  });

  describe("diff", () => {
    it("should calculate month difference", () => {
      const date1 = adapter.create("2025-03-15T10:00:00");
      const date2 = adapter.create("2025-01-10T08:00:00");
      expect(adapter.diff(date1, date2, "month")).toBe(2);
    });

    it("should calculate day difference", () => {
      const date1 = adapter.create("2025-03-15T10:00:00");
      const date2 = adapter.create("2025-01-10T08:00:00");
      const diff = adapter.diff(date1, date2, "day");
      expect(diff).toBeGreaterThan(60);
    });
  });

  describe("startOf", () => {
    it("should get start of day", () => {
      const date = adapter.create("2025-03-15T14:30:45");
      const result = adapter.startOf(date, "day");
      expect(adapter.hour(result)).toBe(0);
      expect(adapter.minute(result)).toBe(0);
    });

    it("should get start of month", () => {
      const date = adapter.create("2025-03-15T14:30:45");
      const result = adapter.startOf(date, "month");
      expect(adapter.date(result)).toBe(1);
      expect(adapter.hour(result)).toBe(0);
    });
  });

  describe("endOf", () => {
    it("should get end of day", () => {
      const date = adapter.create("2025-03-15T14:30:45");
      const result = adapter.endOf(date, "day");
      expect(adapter.hour(result)).toBe(23);
      expect(adapter.minute(result)).toBe(59);
    });

    it("should get end of month", () => {
      const date = adapter.create("2025-03-15T14:30:45");
      const result = adapter.endOf(date, "month");
      expect(adapter.date(result)).toBe(31);
      expect(adapter.hour(result)).toBe(23);
    });
  });

  describe("comparisons", () => {
    it("should check isBefore", () => {
      const date1 = adapter.create("2025-01-15T10:00:00");
      const date2 = adapter.create("2025-01-20T15:00:00");
      expect(adapter.isBefore(date1, date2)).toBe(true);
      expect(adapter.isBefore(date2, date1)).toBe(false);
    });

    it("should check isBefore with unit", () => {
      const date1 = adapter.create("2025-01-15T10:00:00");
      const date2 = adapter.create("2025-01-15T14:00:00");
      expect(adapter.isBefore(date1, date2, "day")).toBe(false);
    });

    it("should check isAfter", () => {
      const date1 = adapter.create("2025-01-20T15:00:00");
      const date2 = adapter.create("2025-01-15T10:00:00");
      expect(adapter.isAfter(date1, date2)).toBe(true);
      expect(adapter.isAfter(date2, date1)).toBe(false);
    });

    it("should check isSame", () => {
      const date1 = adapter.create("2025-01-15T10:00:00");
      const date2 = adapter.create("2025-01-15T10:00:00");
      expect(adapter.isSame(date1, date2)).toBe(true);
    });

    it("should check isSame with unit", () => {
      const date1 = adapter.create("2025-01-15T10:00:00");
      const date2 = adapter.create("2025-01-15T14:00:00");
      expect(adapter.isSame(date1, date2, "day")).toBe(true);
    });
  });
});
