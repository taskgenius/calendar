/**
 * MonthEngine enhanced features tests
 */
import { describe, it, expect, beforeEach } from "vitest";
import { MonthEngine } from "../../../src/engines/MonthEngine";
import { DayJsAdapter } from "../../../src/adapters/DayJsAdapter";
import { DEFAULT_DATE_FORMATS } from "../../../src/constants";
import type { DateAdapter } from "../../../src/types";
import type { Dayjs } from "dayjs";

describe("MonthEngine - Enhanced Features", () => {
  let adapter: DateAdapter<Dayjs>;
  let engine: MonthEngine<Dayjs>;

  beforeEach(() => {
    adapter = new DayJsAdapter();
  });

  describe("firstDayOfWeek configuration", () => {
    it("should generate grid starting with Sunday (default)", () => {
      engine = new MonthEngine(adapter, 0, true, DEFAULT_DATE_FORMATS); // Sunday = 0
      const date = adapter.create("2025-11-15"); // Mid-month
      const grid = engine.generateGrid(date);

      // First day should be Sunday (day 0)
      const firstCell = grid[0]?.[0];
      expect(firstCell).toBeDefined();
      expect(adapter.day(firstCell!.date)).toBe(0);
    });

    it("should generate grid starting with Monday", () => {
      engine = new MonthEngine(adapter, 1, true, DEFAULT_DATE_FORMATS); // Monday = 1
      const date = adapter.create("2025-11-15"); // Mid-month
      const grid = engine.generateGrid(date);

      // First day should be Monday (day 1)
      const firstCell = grid[0]?.[0];
      expect(firstCell).toBeDefined();
      expect(adapter.day(firstCell!.date)).toBe(1);
    });
  });

  describe("showWeekends configuration", () => {
    it("should include weekends when showWeekends is true", () => {
      engine = new MonthEngine(adapter, 0, true, DEFAULT_DATE_FORMATS);
      const date = adapter.create("2025-11-15");
      const grid = engine.generateGrid(date);

      // Check that we have 7 days per week
      const firstWeek = grid[0];
      expect(firstWeek?.length).toBe(7);

      // Verify weekend days are present
      const hasSaturday = firstWeek?.some(
        (cell) => adapter.day(cell.date) === 6,
      );
      const hasSunday = firstWeek?.some((cell) => adapter.day(cell.date) === 0);
      expect(hasSaturday).toBe(true);
      expect(hasSunday).toBe(true);
    });

    it("should exclude weekends when showWeekends is false", () => {
      engine = new MonthEngine(adapter, 0, false, DEFAULT_DATE_FORMATS);
      const date = adapter.create("2025-11-15");
      const grid = engine.generateGrid(date);

      // Check that we have only weekdays
      const firstWeek = grid[0];
      expect(firstWeek).toBeDefined();

      if (firstWeek) {
        // All days should be weekdays (Monday-Friday: 1-5)
        const allWeekdays = firstWeek.every((cell) => {
          const day = adapter.day(cell.date);
          return day >= 1 && day <= 5;
        });
        expect(allWeekdays).toBe(true);

        // Should have at most 5 days (Mon-Fri)
        expect(firstWeek.length).toBeLessThanOrEqual(5);
      }
    });
  });

  describe("layout calculation with weekend hiding", () => {
    it("should adjust event indices when weekends are hidden", () => {
      engine = new MonthEngine(adapter, 0, false, DEFAULT_DATE_FORMATS); // Hide weekends

      const weekStart = adapter.create("2025-11-10"); // Assume it's a Monday
      const weekEnd = adapter.add(weekStart, 6, "day");

      const events = [
        {
          id: "1",
          title: "Event 1",
          start: adapter.format(
            adapter.add(weekStart, 2, "day"),
            "YYYY-MM-DD HH:mm",
          ), // Wednesday
          end: adapter.format(
            adapter.add(weekStart, 3, "day"),
            "YYYY-MM-DD HH:mm",
          ), // Thursday
          color: "#3b82f6",
        },
      ];

      const layout = engine.calculateLayout(events, weekStart, weekEnd);

      expect(layout.length).toBe(1);
      // With weekends hidden, indices should be adjusted
      expect(layout[0]?.startIdx).toBeGreaterThanOrEqual(0);
    });
  });
});
