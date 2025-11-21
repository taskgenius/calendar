import { describe, it, expect } from "vitest";
import { NativeDateAdapter } from "../../../src/adapters/NativeDateAdapter";

describe("NativeDateAdapter - Custom Format Support", () => {
  const adapter = new NativeDateAdapter();

  describe("parse with slash separator", () => {
    it("should parse date with / separator", () => {
      const date = adapter.parse("2025/11/20");
      expect(date.getFullYear()).toBe(2025);
      expect(date.getMonth()).toBe(10); // 0-indexed
      expect(date.getDate()).toBe(20);
    });

    it("should parse datetime with / separator", () => {
      const date = adapter.parse("2025/11/20 14:30");
      expect(date.getFullYear()).toBe(2025);
      expect(date.getMonth()).toBe(10);
      expect(date.getDate()).toBe(20);
      expect(date.getHours()).toBe(14);
      expect(date.getMinutes()).toBe(30);
    });

    it("should parse date with - separator (ISO)", () => {
      const date = adapter.parse("2025-11-20");
      expect(date.getFullYear()).toBe(2025);
      expect(date.getMonth()).toBe(10);
      expect(date.getDate()).toBe(20);
    });

    it("should handle mixed separators consistently", () => {
      // After normalization, both should produce same result
      const dateSlash = adapter.parse("2025/11/20 14:30");
      const dateDash = adapter.parse("2025-11-20 14:30");

      expect(dateSlash.getTime()).toBe(dateDash.getTime());
    });
  });

  describe("format with various tokens", () => {
    const date = new Date(2025, 10, 20, 14, 30, 45); // Nov 20, 2025 14:30:45

    it("should format with yyyy token (date-fns style)", () => {
      const result = adapter.format(date, "yyyy-MM-dd");
      expect(result).toBe("2025-11-20");
    });

    it("should format with YYYY token (Day.js style)", () => {
      const result = adapter.format(date, "YYYY-MM-DD");
      expect(result).toBe("2025-11-20");
    });

    it("should format with / separator", () => {
      const result = adapter.format(date, "yyyy/MM/dd");
      expect(result).toBe("2025/11/20");
    });

    it("should format with single digit month/day", () => {
      const result = adapter.format(date, "yyyy年M月d日");
      expect(result).toBe("2025年11月20日");
    });

    it("should format datetime with custom separator", () => {
      const result = adapter.format(date, "yyyy/MM/dd HH:mm");
      expect(result).toBe("2025/11/20 14:30");
    });
  });

  describe("round-trip consistency", () => {
    it("should maintain consistency with / separator", () => {
      const original = "2025/11/20 14:30";
      const parsed = adapter.parse(original);
      const formatted = adapter.format(parsed, "yyyy/MM/dd HH:mm");
      expect(formatted).toBe("2025/11/20 14:30");
    });

    it("should maintain consistency with - separator", () => {
      const original = "2025-11-20 14:30";
      const parsed = adapter.parse(original);
      const formatted = adapter.format(parsed, "YYYY-MM-DD HH:mm");
      expect(formatted).toBe("2025-11-20 14:30");
    });

    it("should handle cross-format round-trip", () => {
      // Parse with /, format with -
      const parsed = adapter.parse("2025/11/20");
      const formatted = adapter.format(parsed, "YYYY-MM-DD");
      expect(formatted).toBe("2025-11-20");
    });
  });
});
