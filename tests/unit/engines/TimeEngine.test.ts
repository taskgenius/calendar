import { describe, it, expect } from "vitest";
import { TimeEngine } from "../../../src/engines/TimeEngine";
import { DayJsAdapter } from "../../../src/adapters/DayJsAdapter";
import { DEFAULT_DATE_FORMATS } from "../../../src/constants";
import type { CalendarEvent } from "../../../src/types";

describe("TimeEngine", () => {
  const adapter = new DayJsAdapter();
  const engine = new TimeEngine(adapter, 60, true, 0, DEFAULT_DATE_FORMATS); // 60px per hour

  describe("generateColumns", () => {
    it("should generate 1 column for day view", () => {
      const date = adapter.create("2025-11-20");
      const columns = engine.generateColumns(date, "day");

      expect(columns).toHaveLength(1);
      expect(columns[0]!.dateStr).toBe("2025-11-20");
    });

    it("should generate 7 columns for week view", () => {
      const date = adapter.create("2025-11-20");
      const columns = engine.generateColumns(date, "week");

      expect(columns).toHaveLength(7);
    });

    it("should start week on Sunday", () => {
      const date = adapter.create("2025-11-20"); // Thursday
      const columns = engine.generateColumns(date, "week");

      expect(adapter.day(columns[0]!.date)).toBe(0); // Sunday
    });
  });

  describe("calculateLayout", () => {
    it("should return empty array for no events", () => {
      const layout = engine.calculateLayout([], "2025-11-20");
      expect(layout).toHaveLength(0);
    });

    it("should calculate single event layout", () => {
      const events: CalendarEvent[] = [
        {
          id: "1",
          title: "Meeting",
          start: "2025-11-20 10:00",
          end: "2025-11-20 11:30",
          color: "#3b82f6",
        },
      ];

      const layout = engine.calculateLayout(events, "2025-11-20");

      expect(layout).toHaveLength(1);
      expect(layout[0]!.top).toBe(600); // 10 hours * 60px
      expect(layout[0]!.height).toBe(90); // 1.5 hours * 60px
      expect(layout[0]!.widthPercent).toBe(100);
      expect(layout[0]!.leftPercent).toBe(0);
    });

    it("should handle overlapping events", () => {
      const events: CalendarEvent[] = [
        {
          id: "1",
          title: "Event 1",
          start: "2025-11-20 10:00",
          end: "2025-11-20 11:30",
          color: "#3b82f6",
        },
        {
          id: "2",
          title: "Event 2",
          start: "2025-11-20 10:30",
          end: "2025-11-20 12:00",
          color: "#22c55e",
        },
      ];

      const layout = engine.calculateLayout(events, "2025-11-20");

      expect(layout).toHaveLength(2);
      // Both should have 50% width
      expect(layout[0]!.widthPercent).toBe(50);
      expect(layout[1]!.widthPercent).toBe(50);
      // Different left positions
      expect(layout[0]!.leftPercent).toBe(0);
      expect(layout[1]!.leftPercent).toBe(50);
    });

    it("should handle three overlapping events", () => {
      const events: CalendarEvent[] = [
        {
          id: "1",
          title: "Event 1",
          start: "2025-11-20 10:00",
          end: "2025-11-20 12:00",
          color: "#3b82f6",
        },
        {
          id: "2",
          title: "Event 2",
          start: "2025-11-20 10:30",
          end: "2025-11-20 11:30",
          color: "#22c55e",
        },
        {
          id: "3",
          title: "Event 3",
          start: "2025-11-20 11:00",
          end: "2025-11-20 12:30",
          color: "#ef4444",
        },
      ];

      const layout = engine.calculateLayout(events, "2025-11-20");

      expect(layout).toHaveLength(3);
      // Should have approximately 33.33% width each
      expect(layout[0]!.widthPercent).toBeCloseTo(33.33, 1);
    });

    it("should handle non-overlapping events", () => {
      const events: CalendarEvent[] = [
        {
          id: "1",
          title: "Morning",
          start: "2025-11-20 09:00",
          end: "2025-11-20 10:00",
          color: "#3b82f6",
        },
        {
          id: "2",
          title: "Afternoon",
          start: "2025-11-20 14:00",
          end: "2025-11-20 15:00",
          color: "#22c55e",
        },
      ];

      const layout = engine.calculateLayout(events, "2025-11-20");

      expect(layout).toHaveLength(2);
      // Both should have 100% width
      expect(layout[0]!.widthPercent).toBe(100);
      expect(layout[1]!.widthPercent).toBe(100);
    });

    it("should filter out multi-day events", () => {
      const events: CalendarEvent[] = [
        {
          id: "1",
          title: "Multi-day",
          start: "2025-11-20 10:00",
          end: "2025-11-21 11:00", // Ends next day
          color: "#3b82f6",
        },
      ];

      const layout = engine.calculateLayout(events, "2025-11-20");
      expect(layout).toHaveLength(0);
    });

    it("should filter out events from other days", () => {
      const events: CalendarEvent[] = [
        {
          id: "1",
          title: "Other day",
          start: "2025-11-19 10:00",
          end: "2025-11-19 11:00",
          color: "#3b82f6",
        },
      ];

      const layout = engine.calculateLayout(events, "2025-11-20");
      expect(layout).toHaveLength(0);
    });

    it("should have minimum height of 20px", () => {
      const events: CalendarEvent[] = [
        {
          id: "1",
          title: "Quick",
          start: "2025-11-20 10:00",
          end: "2025-11-20 10:05", // Only 5 minutes
          color: "#3b82f6",
        },
      ];

      const layout = engine.calculateLayout(events, "2025-11-20");
      expect(layout[0]!.height).toBeGreaterThanOrEqual(20);
    });

    it("should include startMin and endMin", () => {
      const events: CalendarEvent[] = [
        {
          id: "1",
          title: "Meeting",
          start: "2025-11-20 10:30",
          end: "2025-11-20 12:00",
          color: "#3b82f6",
        },
      ];

      const layout = engine.calculateLayout(events, "2025-11-20");

      expect(layout[0]!.startMin).toBe(630); // 10:30 = 630 minutes
      expect(layout[0]!.endMin).toBe(720); // 12:00 = 720 minutes
    });
  });

  describe("isSingleDayEvent", () => {
    it("should return true for single-day event", () => {
      const event: CalendarEvent = {
        id: "1",
        title: "Single",
        start: "2025-11-20 10:00",
        end: "2025-11-20 11:00",
        color: "#3b82f6",
      };

      expect(engine.isSingleDayEvent(event)).toBe(true);
    });

    it("should return false for multi-day event", () => {
      const event: CalendarEvent = {
        id: "1",
        title: "Multi",
        start: "2025-11-20 10:00",
        end: "2025-11-21 11:00",
        color: "#3b82f6",
      };

      expect(engine.isSingleDayEvent(event)).toBe(false);
    });
  });

  describe("cellHeight", () => {
    it("should update cell height", () => {
      engine.setCellHeight(80);
      expect(engine.getCellHeight()).toBe(80);

      // Reset for other tests
      engine.setCellHeight(60);
    });

    it("should affect layout calculations", () => {
      engine.setCellHeight(120); // 2x default

      const events: CalendarEvent[] = [
        {
          id: "1",
          title: "Meeting",
          start: "2025-11-20 10:00",
          end: "2025-11-20 11:00",
          color: "#3b82f6",
        },
      ];

      const layout = engine.calculateLayout(events, "2025-11-20");

      expect(layout[0]!.top).toBe(1200); // 10 hours * 120px
      expect(layout[0]!.height).toBe(120); // 1 hour * 120px

      // Reset
      engine.setCellHeight(60);
    });
  });
});
