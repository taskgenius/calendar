import { describe, it, expect } from "vitest";
import { MonthEngine } from "../../../src/engines/MonthEngine";
import { DayJsAdapter } from "../../../src/adapters/DayJsAdapter";
import { DEFAULT_DATE_FORMATS } from "../../../src/constants";
import type { CalendarEvent, VisibleDay } from "../../../src/types";

describe("MonthEngine", () => {
  const adapter = new DayJsAdapter();
  const engine = new MonthEngine(adapter, 0, true, DEFAULT_DATE_FORMATS);

  describe("generateGrid", () => {
    it("should generate grid with correct number of weeks", () => {
      const date = adapter.create("2025-11-20");
      const grid = engine.generateGrid(date);

      // November 2025 should have 5 or 6 weeks depending on start day
      expect(grid.length).toBeGreaterThanOrEqual(4);
      expect(grid.length).toBeLessThanOrEqual(6);
    });

    it("should have 7 days per week", () => {
      const date = adapter.create("2025-11-20");
      const grid = engine.generateGrid(date);

      for (const week of grid) {
        expect(week).toHaveLength(7);
      }
    });

    it("should start week on Sunday", () => {
      const date = adapter.create("2025-11-20");
      const grid = engine.generateGrid(date);

      const firstDay = grid[0]![0]!;
      expect(adapter.day(firstDay.date)).toBe(0); // Sunday
    });

    it("should include dateStr for each cell", () => {
      const date = adapter.create("2025-11-20");
      const grid = engine.generateGrid(date);

      for (const week of grid) {
        for (const day of week) {
          expect(day.dateStr).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        }
      }
    });
  });

  describe("calculateLayout", () => {
    const weekStart = adapter.create("2025-11-16"); // Sunday
    const weekEnd = adapter.create("2025-11-22"); // Saturday

    it("should return empty array for no events", () => {
      const layout = engine.calculateLayout([], weekStart, weekEnd);
      expect(layout).toHaveLength(0);
    });

    it("should calculate layout for single event", () => {
      const events: CalendarEvent[] = [
        {
          id: "1",
          title: "Test Event",
          start: "2025-11-17 10:00",
          end: "2025-11-17 11:00",
          color: "#3b82f6",
        },
      ];

      const layout = engine.calculateLayout(events, weekStart, weekEnd);

      expect(layout).toHaveLength(1);
      expect(layout[0]!.event.id).toBe("1");
      expect(layout[0]!.startIdx).toBe(1); // Monday = index 1
      expect(layout[0]!.span).toBe(1);
      expect(layout[0]!.slot).toBe(0);
    });

    it("should calculate layout for multi-day event", () => {
      const events: CalendarEvent[] = [
        {
          id: "1",
          title: "Multi-day",
          start: "2025-11-17 10:00",
          end: "2025-11-19 11:00",
          color: "#3b82f6",
        },
      ];

      const layout = engine.calculateLayout(events, weekStart, weekEnd);

      expect(layout).toHaveLength(1);
      expect(layout[0]!.startIdx).toBe(1);
      expect(layout[0]!.span).toBe(3); // Mon-Wed
    });

    it("should include truncated partial days in span calculation", () => {
      const events: CalendarEvent[] = [
        {
          id: "span-normalized",
          title: "Partial day edges",
          start: "2025-11-17 18:00",
          end: "2025-11-19 09:00",
          color: "#f97316",
        },
      ];

      const layout = engine.calculateLayout(events, weekStart, weekEnd);

      expect(layout).toHaveLength(1);
      expect(layout[0]!.startIdx).toBe(1);
      expect(layout[0]!.span).toBe(3); // Mon-Wed even with partial times
    });

    it("should allocate different slots for overlapping events", () => {
      const events: CalendarEvent[] = [
        {
          id: "1",
          title: "Event 1",
          start: "2025-11-17 10:00",
          end: "2025-11-19 11:00",
          color: "#3b82f6",
        },
        {
          id: "2",
          title: "Event 2",
          start: "2025-11-18 10:00",
          end: "2025-11-18 11:00",
          color: "#22c55e",
        },
      ];

      const layout = engine.calculateLayout(events, weekStart, weekEnd);

      expect(layout).toHaveLength(2);
      // First event should be in slot 0, second in slot 1
      const slots = layout.map((l) => l.slot);
      expect(slots).toContain(0);
      expect(slots).toContain(1);
    });

    it("should handle event spanning beyond week", () => {
      const events: CalendarEvent[] = [
        {
          id: "1",
          title: "Cross-week",
          start: "2025-11-14 10:00", // Before week start
          end: "2025-11-24 11:00", // After week end
          color: "#3b82f6",
        },
      ];

      const layout = engine.calculateLayout(events, weekStart, weekEnd);

      expect(layout).toHaveLength(1);
      expect(layout[0]!.startIdx).toBe(0);
      expect(layout[0]!.span).toBe(7);
      expect(layout[0]!.isStart).toBe(false);
      expect(layout[0]!.isEnd).toBe(false);
    });

    it("should mark isStart and isEnd correctly", () => {
      const events: CalendarEvent[] = [
        {
          id: "1",
          title: "Full event",
          start: "2025-11-18 10:00",
          end: "2025-11-19 11:00",
          color: "#3b82f6",
        },
      ];

      const layout = engine.calculateLayout(events, weekStart, weekEnd);

      expect(layout[0]!.isStart).toBe(true);
      expect(layout[0]!.isEnd).toBe(true);
    });

    it("should filter out events outside the week", () => {
      const events: CalendarEvent[] = [
        {
          id: "1",
          title: "Outside",
          start: "2025-11-10 10:00",
          end: "2025-11-11 11:00",
          color: "#3b82f6",
        },
      ];

      const layout = engine.calculateLayout(events, weekStart, weekEnd);
      expect(layout).toHaveLength(0);
    });
  });

  describe("getWeekCount", () => {
    it("should return correct week count", () => {
      const date = adapter.create("2025-11-20");
      const count = engine.getWeekCount(date);

      expect(count).toBeGreaterThanOrEqual(4);
      expect(count).toBeLessThanOrEqual(6);
    });
  });

  describe("calculateLayoutWithVisibleDays", () => {
    it("should split event when hidden days create calendar gaps (Tuesday hidden)", () => {
      // Event spans Mon-Wed (Nov 3-5, 2025)
      const events: CalendarEvent[] = [
        {
          id: "1",
          title: "Event 1",
          start: "2025-11-03 10:00", // Monday
          end: "2025-11-05 12:00", // Wednesday
          color: "#3b82f6",
        },
      ];

      // Visible days: Sun, Mon, Wed, Thu, Fri, Sat (Tuesday hidden)
      // Week of Nov 2-8, 2025 with Tuesday (Nov 4) filtered out
      // Note: colIndex is sequential (0, 1, 2...) because these are the visible column positions
      const visibleDays: VisibleDay<any>[] = [
        {
          date: adapter.create("2025-11-02"),
          dateStr: "2025-11-02",
          colIndex: 0,
        }, // Sun
        {
          date: adapter.create("2025-11-03"),
          dateStr: "2025-11-03",
          colIndex: 1,
        }, // Mon
        // Tuesday (Nov 4) is filtered out - not in visibleDays
        {
          date: adapter.create("2025-11-05"),
          dateStr: "2025-11-05",
          colIndex: 2,
        }, // Wed
        {
          date: adapter.create("2025-11-06"),
          dateStr: "2025-11-06",
          colIndex: 3,
        }, // Thu
        {
          date: adapter.create("2025-11-07"),
          dateStr: "2025-11-07",
          colIndex: 4,
        }, // Fri
        {
          date: adapter.create("2025-11-08"),
          dateStr: "2025-11-08",
          colIndex: 5,
        }, // Sat
      ];

      const layout = engine.calculateLayoutWithVisibleDays(events, visibleDays);

      // Event SHOULD be split because Mon and Wed are NOT consecutive calendar days
      // (Tuesday is hidden, creating a gap in actual dates)
      expect(layout.length).toBe(2);

      // First segment: Monday only
      expect(layout[0]!.startIdx).toBe(1); // Monday at colIndex 1
      expect(layout[0]!.span).toBe(1);
      expect(layout[0]!.isStart).toBe(true);
      expect(layout[0]!.isEnd).toBe(false);
      expect(layout[0]!.segmentIndex).toBe(0);
      expect(layout[0]!.totalSegments).toBe(2);

      // Second segment: Wednesday only
      expect(layout[1]!.startIdx).toBe(2); // Wednesday at colIndex 2
      expect(layout[1]!.span).toBe(1);
      expect(layout[1]!.isStart).toBe(false);
      expect(layout[1]!.isEnd).toBe(true);
      expect(layout[1]!.segmentIndex).toBe(1);
      expect(layout[1]!.totalSegments).toBe(2);
    });

    it("should split event when weekends are hidden (Fri-Mon event)", () => {
      // Event spans Fri-Mon (Nov 7-10, 2025) - crosses weekend
      const events: CalendarEvent[] = [
        {
          id: "1",
          title: "Weekend Cross",
          start: "2025-11-07 10:00", // Friday
          end: "2025-11-10 12:00", // Monday
          color: "#3b82f6",
        },
      ];

      // Visible days: Mon-Fri only (weekends hidden)
      // Week spanning Nov 3-14, 2025
      const visibleDays: VisibleDay<any>[] = [
        {
          date: adapter.create("2025-11-03"),
          dateStr: "2025-11-03",
          colIndex: 0,
        }, // Mon
        {
          date: adapter.create("2025-11-04"),
          dateStr: "2025-11-04",
          colIndex: 1,
        }, // Tue
        {
          date: adapter.create("2025-11-05"),
          dateStr: "2025-11-05",
          colIndex: 2,
        }, // Wed
        {
          date: adapter.create("2025-11-06"),
          dateStr: "2025-11-06",
          colIndex: 3,
        }, // Thu
        {
          date: adapter.create("2025-11-07"),
          dateStr: "2025-11-07",
          colIndex: 4,
        }, // Fri
        // Saturday (Nov 8) hidden
        // Sunday (Nov 9) hidden
        {
          date: adapter.create("2025-11-10"),
          dateStr: "2025-11-10",
          colIndex: 5,
        }, // Mon (next week)
        {
          date: adapter.create("2025-11-11"),
          dateStr: "2025-11-11",
          colIndex: 6,
        }, // Tue
        {
          date: adapter.create("2025-11-12"),
          dateStr: "2025-11-12",
          colIndex: 7,
        }, // Wed
      ];

      const layout = engine.calculateLayoutWithVisibleDays(events, visibleDays);

      // Event should be split into 2 segments due to hidden weekend
      expect(layout.length).toBe(2);

      // First segment: Friday only
      expect(layout[0]!.startIdx).toBe(4);
      expect(layout[0]!.span).toBe(1);
      expect(layout[0]!.isStart).toBe(true);
      expect(layout[0]!.isEnd).toBe(false);
      expect(layout[0]!.segmentIndex).toBe(0);
      expect(layout[0]!.totalSegments).toBe(2);

      // Second segment: Monday only
      expect(layout[1]!.startIdx).toBe(5);
      expect(layout[1]!.span).toBe(1);
      expect(layout[1]!.isStart).toBe(false);
      expect(layout[1]!.isEnd).toBe(true);
      expect(layout[1]!.segmentIndex).toBe(1);
      expect(layout[1]!.totalSegments).toBe(2);
    });

    it("should handle event with multiple hidden day gaps (two visible islands)", () => {
      // Event spans Mon-Fri (Nov 3-7, 2025)
      const events: CalendarEvent[] = [
        {
          id: "1",
          title: "Event 1",
          start: "2025-11-03 10:00", // Monday
          end: "2025-11-07 12:00", // Friday
          color: "#3b82f6",
        },
      ];

      // Visible days with Wednesday hidden - creates two islands
      const visibleDays: VisibleDay<any>[] = [
        {
          date: adapter.create("2025-11-03"),
          dateStr: "2025-11-03",
          colIndex: 0,
        }, // Mon
        {
          date: adapter.create("2025-11-04"),
          dateStr: "2025-11-04",
          colIndex: 1,
        }, // Tue
        // Wednesday (Nov 5) hidden
        {
          date: adapter.create("2025-11-06"),
          dateStr: "2025-11-06",
          colIndex: 2,
        }, // Thu
        {
          date: adapter.create("2025-11-07"),
          dateStr: "2025-11-07",
          colIndex: 3,
        }, // Fri
      ];

      const layout = engine.calculateLayoutWithVisibleDays(events, visibleDays);

      // Event should be split into 2 segments due to hidden Wednesday
      expect(layout.length).toBe(2);

      // First segment: Mon-Tue (colIndex 0-1)
      expect(layout[0]!.startIdx).toBe(0);
      expect(layout[0]!.span).toBe(2);
      expect(layout[0]!.isStart).toBe(true);
      expect(layout[0]!.isEnd).toBe(false);
      expect(layout[0]!.segmentIndex).toBe(0);
      expect(layout[0]!.totalSegments).toBe(2);

      // Second segment: Thu-Fri (colIndex 2-3)
      expect(layout[1]!.startIdx).toBe(2);
      expect(layout[1]!.span).toBe(2);
      expect(layout[1]!.isStart).toBe(false);
      expect(layout[1]!.isEnd).toBe(true);
      expect(layout[1]!.segmentIndex).toBe(1);
      expect(layout[1]!.totalSegments).toBe(2);
    });

    it("should not split event when all days are visible", () => {
      const events: CalendarEvent[] = [
        {
          id: "1",
          title: "Event 1",
          start: "2025-11-03 10:00", // Monday
          end: "2025-11-05 12:00", // Wednesday
          color: "#3b82f6",
        },
      ];

      // All days visible
      const visibleDays: VisibleDay<any>[] = [
        {
          date: adapter.create("2025-11-02"),
          dateStr: "2025-11-02",
          colIndex: 0,
        }, // Sun
        {
          date: adapter.create("2025-11-03"),
          dateStr: "2025-11-03",
          colIndex: 1,
        }, // Mon
        {
          date: adapter.create("2025-11-04"),
          dateStr: "2025-11-04",
          colIndex: 2,
        }, // Tue
        {
          date: adapter.create("2025-11-05"),
          dateStr: "2025-11-05",
          colIndex: 3,
        }, // Wed
        {
          date: adapter.create("2025-11-06"),
          dateStr: "2025-11-06",
          colIndex: 4,
        }, // Thu
        {
          date: adapter.create("2025-11-07"),
          dateStr: "2025-11-07",
          colIndex: 5,
        }, // Fri
        {
          date: adapter.create("2025-11-08"),
          dateStr: "2025-11-08",
          colIndex: 6,
        }, // Sat
      ];

      const layout = engine.calculateLayoutWithVisibleDays(events, visibleDays);

      // Event should NOT be split
      expect(layout.length).toBe(1);
      expect(layout[0]!.startIdx).toBe(1); // Monday
      expect(layout[0]!.span).toBe(3); // Mon-Wed
      expect(layout[0]!.isStart).toBe(true);
      expect(layout[0]!.isEnd).toBe(true);
      expect(layout[0]!.segmentIndex).toBeUndefined();
      expect(layout[0]!.totalSegments).toBeUndefined();
    });

    it("should handle event spanning outside visible range with hidden gaps", () => {
      // Long event spanning beyond visible range
      const events: CalendarEvent[] = [
        {
          id: "1",
          title: "Long Event",
          start: "2025-11-01 10:00", // Saturday (before visible range)
          end: "2025-11-15 12:00", // Saturday (after visible range)
          color: "#3b82f6",
        },
      ];

      // Visible days: Only weekdays of one week (Mon-Fri)
      const visibleDays: VisibleDay<any>[] = [
        {
          date: adapter.create("2025-11-03"),
          dateStr: "2025-11-03",
          colIndex: 0,
        }, // Mon
        {
          date: adapter.create("2025-11-04"),
          dateStr: "2025-11-04",
          colIndex: 1,
        }, // Tue
        {
          date: adapter.create("2025-11-05"),
          dateStr: "2025-11-05",
          colIndex: 2,
        }, // Wed
        {
          date: adapter.create("2025-11-06"),
          dateStr: "2025-11-06",
          colIndex: 3,
        }, // Thu
        {
          date: adapter.create("2025-11-07"),
          dateStr: "2025-11-07",
          colIndex: 4,
        }, // Fri
      ];

      const layout = engine.calculateLayoutWithVisibleDays(events, visibleDays);

      // Event should be a single segment spanning all visible days
      // (no gaps within the visible range)
      expect(layout.length).toBe(1);
      expect(layout[0]!.startIdx).toBe(0);
      expect(layout[0]!.span).toBe(5);
      expect(layout[0]!.isStart).toBe(false); // Event starts before visible range
      expect(layout[0]!.isEnd).toBe(false); // Event ends after visible range
    });

    it("should exclude events from disabled days (HalfMonth scenario)", () => {
      // Event spans days 14-17 (Nov 14-17, 2025)
      const events: CalendarEvent[] = [
        {
          id: "1",
          title: "Cross Half Event",
          start: "2025-11-14 10:00", // Friday (day 14, in first half)
          end: "2025-11-17 12:00", // Monday (day 17, in second half)
          color: "#3b82f6",
        },
      ];

      // HalfMonth scenario: days 1-15 enabled, days 16+ disabled
      const visibleDays: VisibleDay<any>[] = [
        {
          date: adapter.create("2025-11-13"),
          dateStr: "2025-11-13",
          colIndex: 0,
        }, // Day 13
        {
          date: adapter.create("2025-11-14"),
          dateStr: "2025-11-14",
          colIndex: 1,
        }, // Day 14
        {
          date: adapter.create("2025-11-15"),
          dateStr: "2025-11-15",
          colIndex: 2,
        }, // Day 15
        {
          date: adapter.create("2025-11-16"),
          dateStr: "2025-11-16",
          colIndex: 3,
          disabled: true, // Day 16 - disabled
        },
        {
          date: adapter.create("2025-11-17"),
          dateStr: "2025-11-17",
          colIndex: 4,
          disabled: true, // Day 17 - disabled
        },
        {
          date: adapter.create("2025-11-18"),
          dateStr: "2025-11-18",
          colIndex: 5,
          disabled: true, // Day 18 - disabled
        },
      ];

      const layout = engine.calculateLayoutWithVisibleDays(events, visibleDays);

      // Event should only appear on enabled days (14-15)
      expect(layout.length).toBe(1);
      expect(layout[0]!.startIdx).toBe(1); // Day 14 at colIndex 1
      expect(layout[0]!.span).toBe(2); // Days 14-15 only
      expect(layout[0]!.isStart).toBe(true);
      expect(layout[0]!.isEnd).toBe(false); // Event continues beyond visible enabled days
    });

    it("should not render events that only cover disabled days", () => {
      // Event spans days 16-17 (only in disabled range)
      const events: CalendarEvent[] = [
        {
          id: "1",
          title: "Disabled Range Event",
          start: "2025-11-16 10:00",
          end: "2025-11-17 12:00",
          color: "#3b82f6",
        },
      ];

      // HalfMonth scenario: days 1-15 enabled, days 16+ disabled
      const visibleDays: VisibleDay<any>[] = [
        {
          date: adapter.create("2025-11-14"),
          dateStr: "2025-11-14",
          colIndex: 0,
        },
        {
          date: adapter.create("2025-11-15"),
          dateStr: "2025-11-15",
          colIndex: 1,
        },
        {
          date: adapter.create("2025-11-16"),
          dateStr: "2025-11-16",
          colIndex: 2,
          disabled: true,
        },
        {
          date: adapter.create("2025-11-17"),
          dateStr: "2025-11-17",
          colIndex: 3,
          disabled: true,
        },
      ];

      const layout = engine.calculateLayoutWithVisibleDays(events, visibleDays);

      // Event should not appear at all (only covers disabled days)
      expect(layout.length).toBe(0);
    });

    it("should split event when disabled days create gaps", () => {
      // Event spans days 14-18 (Nov 14-18, 2025)
      const events: CalendarEvent[] = [
        {
          id: "1",
          title: "Split Event",
          start: "2025-11-14 10:00",
          end: "2025-11-18 12:00",
          color: "#3b82f6",
        },
      ];

      // Days 14-15 enabled, 16 disabled, 17-18 enabled
      const visibleDays: VisibleDay<any>[] = [
        {
          date: adapter.create("2025-11-14"),
          dateStr: "2025-11-14",
          colIndex: 0,
        },
        {
          date: adapter.create("2025-11-15"),
          dateStr: "2025-11-15",
          colIndex: 1,
        },
        {
          date: adapter.create("2025-11-16"),
          dateStr: "2025-11-16",
          colIndex: 2,
          disabled: true, // Day 16 disabled - creates gap
        },
        {
          date: adapter.create("2025-11-17"),
          dateStr: "2025-11-17",
          colIndex: 3,
        },
        {
          date: adapter.create("2025-11-18"),
          dateStr: "2025-11-18",
          colIndex: 4,
        },
      ];

      const layout = engine.calculateLayoutWithVisibleDays(events, visibleDays);

      // Event should be split into 2 segments due to disabled day 16
      expect(layout.length).toBe(2);

      // First segment: Days 14-15
      expect(layout[0]!.startIdx).toBe(0);
      expect(layout[0]!.span).toBe(2);
      expect(layout[0]!.isStart).toBe(true);
      expect(layout[0]!.isEnd).toBe(false);
      expect(layout[0]!.segmentIndex).toBe(0);
      expect(layout[0]!.totalSegments).toBe(2);

      // Second segment: Days 17-18
      expect(layout[1]!.startIdx).toBe(3);
      expect(layout[1]!.span).toBe(2);
      expect(layout[1]!.isStart).toBe(false);
      expect(layout[1]!.isEnd).toBe(true);
      expect(layout[1]!.segmentIndex).toBe(1);
      expect(layout[1]!.totalSegments).toBe(2);
    });
  });
});
