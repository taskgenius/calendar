import { describe, it, expect } from "vitest";
import { NativeDateAdapter } from "../../../src/adapters/NativeDateAdapter";

describe("NativeDateAdapter", () => {
  const adapter = new NativeDateAdapter();

  describe("create", () => {
    it("should create current date when no argument", () => {
      const date = adapter.create();
      expect(date).toBeInstanceOf(Date);
    });

    it("should create from Date object", () => {
      const input = new Date("2025-01-15T10:30:00");
      const result = adapter.create(input);
      expect(result.getTime()).toBe(input.getTime());
    });

    it("should create from string", () => {
      const result = adapter.create("2025-01-15");
      expect(result.getFullYear()).toBe(2025);
      expect(result.getMonth()).toBe(0);
      expect(result.getDate()).toBe(15);
    });
  });

  describe("parse", () => {
    it("should parse date-only string", () => {
      const result = adapter.parse("2025-01-15");
      expect(result.getFullYear()).toBe(2025);
      expect(result.getMonth()).toBe(0);
      expect(result.getDate()).toBe(15);
    });

    it("should parse date-time string", () => {
      const result = adapter.parse("2025-01-15 14:30");
      expect(result.getFullYear()).toBe(2025);
      expect(result.getMonth()).toBe(0);
      expect(result.getDate()).toBe(15);
      expect(result.getHours()).toBe(14);
      expect(result.getMinutes()).toBe(30);
    });
  });

  describe("format", () => {
    it("should format date with YYYY-MM-DD", () => {
      const date = new Date("2025-01-05T08:09:07");
      const result = adapter.format(date, "YYYY-MM-DD");
      expect(result).toBe("2025-01-05");
    });

    it("should format date with time", () => {
      const date = new Date("2025-01-05T08:09:07");
      const result = adapter.format(date, "YYYY-MM-DD HH:mm:ss");
      expect(result).toBe("2025-01-05 08:09:07");
    });
  });

  describe("getters", () => {
    const date = new Date("2025-03-15T14:30:45");

    it("should get year", () => {
      expect(adapter.year(date)).toBe(2025);
    });

    it("should get month (0-indexed)", () => {
      expect(adapter.month(date)).toBe(2);
    });

    it("should get date", () => {
      expect(adapter.date(date)).toBe(15);
    });

    it("should get day of week", () => {
      // 2025-03-15 is a Saturday (6)
      expect(adapter.day(date)).toBe(6);
    });

    it("should get hour", () => {
      expect(adapter.hour(date)).toBe(14);
    });

    it("should get minute", () => {
      expect(adapter.minute(date)).toBe(30);
    });
  });

  describe("setters", () => {
    const date = new Date("2025-01-15T10:30:00");

    it("should set hour", () => {
      const result = adapter.setHour(date, 15);
      expect(result.getHours()).toBe(15);
      expect(date.getHours()).toBe(10); // Original unchanged
    });

    it("should set minute", () => {
      const result = adapter.setMinute(date, 45);
      expect(result.getMinutes()).toBe(45);
      expect(date.getMinutes()).toBe(30); // Original unchanged
    });
  });

  describe("add", () => {
    const date = new Date("2025-01-15T10:30:00");

    it("should add years", () => {
      const result = adapter.add(date, 2, "year");
      expect(result.getFullYear()).toBe(2027);
    });

    it("should add months", () => {
      const result = adapter.add(date, 3, "month");
      expect(result.getMonth()).toBe(3);
    });

    it("should add weeks", () => {
      const result = adapter.add(date, 2, "week");
      expect(result.getDate()).toBe(29);
    });

    it("should add days", () => {
      const result = adapter.add(date, 5, "day");
      expect(result.getDate()).toBe(20);
    });

    it("should add hours", () => {
      const result = adapter.add(date, 3, "hour");
      expect(result.getHours()).toBe(13);
    });

    it("should add minutes", () => {
      const result = adapter.add(date, 45, "minute");
      expect(result.getHours()).toBe(11);
      expect(result.getMinutes()).toBe(15);
    });
  });

  describe("diff", () => {
    const date1 = new Date("2025-03-15T10:00:00");
    const date2 = new Date("2025-01-10T08:00:00");

    it("should calculate year difference", () => {
      expect(adapter.diff(date1, date2, "year")).toBe(0);
    });

    it("should calculate month difference", () => {
      expect(adapter.diff(date1, date2, "month")).toBe(2);
    });

    it("should calculate day difference", () => {
      const diff = adapter.diff(date1, date2, "day");
      expect(diff).toBeGreaterThan(60);
    });

    it("should calculate hour difference", () => {
      const diff = adapter.diff(date1, date2, "hour");
      expect(diff).toBeGreaterThan(1400);
    });
  });

  describe("startOf", () => {
    const date = new Date("2025-03-15T14:30:45");

    it("should get start of year", () => {
      const result = adapter.startOf(date, "year");
      expect(result.getMonth()).toBe(0);
      expect(result.getDate()).toBe(1);
      expect(result.getHours()).toBe(0);
    });

    it("should get start of month", () => {
      const result = adapter.startOf(date, "month");
      expect(result.getDate()).toBe(1);
      expect(result.getHours()).toBe(0);
    });

    it("should get start of week", () => {
      const result = adapter.startOf(date, "week");
      expect(result.getDay()).toBe(0); // Sunday
    });

    it("should get start of day", () => {
      const result = adapter.startOf(date, "day");
      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
    });

    it("should get start of hour", () => {
      const result = adapter.startOf(date, "hour");
      expect(result.getMinutes()).toBe(0);
      expect(result.getSeconds()).toBe(0);
    });

    it("should get start of minute", () => {
      const result = adapter.startOf(date, "minute");
      expect(result.getSeconds()).toBe(0);
    });
  });

  describe("endOf", () => {
    const date = new Date("2025-03-15T14:30:45");

    it("should get end of year", () => {
      const result = adapter.endOf(date, "year");
      expect(result.getMonth()).toBe(11);
      expect(result.getDate()).toBe(31);
      expect(result.getHours()).toBe(23);
    });

    it("should get end of month", () => {
      const result = adapter.endOf(date, "month");
      expect(result.getDate()).toBe(31);
      expect(result.getHours()).toBe(23);
    });

    it("should get end of week", () => {
      const result = adapter.endOf(date, "week");
      expect(result.getDay()).toBe(6); // Saturday
    });

    it("should get end of day", () => {
      const result = adapter.endOf(date, "day");
      expect(result.getHours()).toBe(23);
      expect(result.getMinutes()).toBe(59);
    });
  });

  describe("comparisons", () => {
    const date1 = new Date("2025-01-15T10:00:00");
    const date2 = new Date("2025-01-20T15:00:00");
    const date3 = new Date("2025-01-15T14:00:00");

    it("should check isBefore", () => {
      expect(adapter.isBefore(date1, date2)).toBe(true);
      expect(adapter.isBefore(date2, date1)).toBe(false);
    });

    it("should check isBefore with unit", () => {
      expect(adapter.isBefore(date1, date3, "day")).toBe(false);
      expect(adapter.isBefore(date1, date2, "day")).toBe(true);
    });

    it("should check isAfter", () => {
      expect(adapter.isAfter(date2, date1)).toBe(true);
      expect(adapter.isAfter(date1, date2)).toBe(false);
    });

    it("should check isAfter with unit", () => {
      expect(adapter.isAfter(date3, date1, "day")).toBe(false);
      expect(adapter.isAfter(date2, date1, "day")).toBe(true);
    });

    it("should check isSame", () => {
      expect(adapter.isSame(date1, date1)).toBe(true);
      expect(adapter.isSame(date1, date2)).toBe(false);
    });

    it("should check isSame with unit", () => {
      expect(adapter.isSame(date1, date3, "day")).toBe(true);
      expect(adapter.isSame(date1, date2, "day")).toBe(false);
    });
  });
});
