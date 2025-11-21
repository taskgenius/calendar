import { describe, it, expect } from "vitest";
import { DEFAULT_DATE_FORMATS } from "../../../src/constants";
import type { DateFormatConfig } from "../../../src/types";

describe("DateFormats", () => {
  describe("DEFAULT_DATE_FORMATS", () => {
    it("should have correct default values for Day.js", () => {
      expect(DEFAULT_DATE_FORMATS.date).toBe("YYYY-MM-DD");
      expect(DEFAULT_DATE_FORMATS.dateTime).toBe("YYYY-MM-DD HH:mm");
      expect(DEFAULT_DATE_FORMATS.time).toBe("HH:mm");
      expect(DEFAULT_DATE_FORMATS.monthHeader).toBe("YYYY年 M月");
      expect(DEFAULT_DATE_FORMATS.dayHeader).toBe("YYYY年M月D日");
    });

    it("should be fully required (no optional fields)", () => {
      const keys = Object.keys(DEFAULT_DATE_FORMATS);
      expect(keys).toHaveLength(5);
      expect(keys).toContain("date");
      expect(keys).toContain("dateTime");
      expect(keys).toContain("time");
      expect(keys).toContain("monthHeader");
      expect(keys).toContain("dayHeader");
    });
  });

  describe("DateFormatConfig type", () => {
    it("should allow partial configuration", () => {
      const partial: Partial<DateFormatConfig> = {
        date: "yyyy/MM/dd",
      };
      expect(partial.date).toBe("yyyy/MM/dd");
    });

    it("should allow full configuration", () => {
      const full: Required<DateFormatConfig> = {
        date: "yyyy-MM-dd",
        dateTime: "yyyy-MM-dd HH:mm",
        time: "HH:mm",
        monthHeader: "MMMM yyyy",
        dayHeader: "MMMM d, yyyy",
      };
      expect(full.date).toBe("yyyy-MM-dd");
      expect(full.monthHeader).toBe("MMMM yyyy");
    });
  });
});
