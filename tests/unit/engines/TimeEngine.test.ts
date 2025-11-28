import { describe, it, expect } from "vitest";
import { TimeEngine } from "../../../src/engines/TimeEngine";
import { DayJsAdapter } from "../../../src/adapters/DayJsAdapter";
import { DEFAULT_DATE_FORMATS } from "../../../src/constants";
import type { CalendarEvent, TimeColumn } from "../../../src/types";

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
      // Uniform width distribution: offset = 100/2 = 50%
      // Col 0: left=0%, Col 1: left=50%
      expect(layout[0]!.leftPercent).toBe(0);
      expect(layout[1]!.leftPercent).toBe(50);
      // Width multiplier for 2 cols = 1.6, baseWidth = 50 * 1.6 = 80%
      // Col 0: min(80, 100-0) = 80%
      // Col 1: min(80, 100-50) = 50%
      expect(layout[0]!.widthPercent).toBe(80);
      expect(layout[1]!.widthPercent).toBe(50);
    });

    it("should handle three overlapping events with cascading layout", () => {
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
      // Uniform distribution: offset = 100/3 = 33.33%
      // Width multiplier for 3 cols = 1.6, baseWidth = 33.33 * 1.6 = 53.33%
      const offset = 100 / 3; // ~33.33
      const baseWidth = offset * 1.6; // ~53.33
      expect(layout[0]!.leftPercent).toBeCloseTo(0, 1);
      expect(layout[1]!.leftPercent).toBeCloseTo(offset, 1);
      expect(layout[2]!.leftPercent).toBeCloseTo(offset * 2, 1);
      // Col 0: min(53.33, 100) = 53.33%
      // Col 1: min(53.33, 66.67) = 53.33%
      // Col 2: min(53.33, 33.33) = 33.33%
      expect(layout[0]!.widthPercent).toBeCloseTo(baseWidth, 1);
      expect(layout[1]!.widthPercent).toBeCloseTo(baseWidth, 1);
      expect(layout[2]!.widthPercent).toBeCloseTo(100 - offset * 2, 1);
    });

    it("should use cascading layout for staircase overlap scenario", () => {
      // Staircase overlap scenario - now uses uniform width distribution
      const events: CalendarEvent[] = [
        {
          id: "23",
          title: "Meeting A",
          start: "2025-11-26 10:00",
          end: "2025-11-26 11:30",
          color: "#2b4fff",
        },
        {
          id: "24",
          title: "Meeting B",
          start: "2025-11-26 10:30",
          end: "2025-11-26 12:00",
          color: "#ef4444",
        },
        {
          id: "25",
          title: "Meeting C",
          start: "2025-11-26 11:00",
          end: "2025-11-26 12:30",
          color: "#f59e0b",
        },
      ];

      const layout = engine.calculateLayout(events, "2025-11-26");

      expect(layout).toHaveLength(3);

      const meetingA = layout.find((l) => l.event.id === "23")!;
      const meetingB = layout.find((l) => l.event.id === "24")!;
      const meetingC = layout.find((l) => l.event.id === "25")!;

      // Column assignment remains the same
      expect(meetingA.colIndex).toBe(0);
      expect(meetingB.colIndex).toBe(1);
      expect(meetingC.colIndex).toBe(2);

      // 3 columns: offset = 100/3 = 33.33%
      const offset = 100 / 3;
      expect(meetingA.leftPercent).toBeCloseTo(0, 1);
      expect(meetingB.leftPercent).toBeCloseTo(offset, 1);
      expect(meetingC.leftPercent).toBeCloseTo(offset * 2, 1);

      // Each event has reasonable width with uniform distribution
      // baseWidth = 33.33 * 1.6 = 53.33%
      expect(meetingA.widthPercent).toBeGreaterThan(50);
      expect(meetingB.widthPercent).toBeGreaterThan(50);
      expect(meetingC.widthPercent).toBeCloseTo(100 - offset * 2, 1); // ~33.33%
    });

    it("should use cascading layout for true staircase pattern", () => {
      // True staircase: A overlaps B, B overlaps C, but A does NOT overlap C
      const events: CalendarEvent[] = [
        {
          id: "A",
          title: "Event A",
          start: "2025-11-26 10:00",
          end: "2025-11-26 10:45",
          color: "#2b4fff",
        },
        {
          id: "B",
          title: "Event B",
          start: "2025-11-26 10:30",
          end: "2025-11-26 11:15",
          color: "#ef4444",
        },
        {
          id: "C",
          title: "Event C",
          start: "2025-11-26 11:00",
          end: "2025-11-26 11:45",
          color: "#f59e0b",
        },
      ];

      const layout = engine.calculateLayout(events, "2025-11-26");

      expect(layout).toHaveLength(3);

      const eventA = layout.find((l) => l.event.id === "A")!;
      const eventB = layout.find((l) => l.event.id === "B")!;
      const eventC = layout.find((l) => l.event.id === "C")!;

      // Column assignment with greedy algorithm:
      // A -> col 0, B -> col 1, C -> col 0 (reuses since A ended)
      expect(eventA.colIndex).toBe(0);
      expect(eventB.colIndex).toBe(1);
      expect(eventC.colIndex).toBe(0);

      // With 2 columns: offset = 100/2 = 50%
      expect(eventA.leftPercent).toBe(0);
      expect(eventB.leftPercent).toBe(50);
      expect(eventC.leftPercent).toBe(0); // Same column as A

      // Width multiplier for 2 cols = 1.6, baseWidth = 50 * 1.6 = 80%
      // Col 0: min(80, 100) = 80%
      // Col 1: min(80, 50) = 50%
      expect(eventA.widthPercent).toBe(80);
      expect(eventB.widthPercent).toBe(50);
      expect(eventC.widthPercent).toBe(80);
    });

    it("should use cascading layout for 4-event staircase", () => {
      // 4-event staircase where greedy algorithm reuses columns
      const events: CalendarEvent[] = [
        {
          id: "A",
          title: "Event A",
          start: "2025-11-26 10:00",
          end: "2025-11-26 10:30",
          color: "#2b4fff",
        },
        {
          id: "B",
          title: "Event B",
          start: "2025-11-26 10:15",
          end: "2025-11-26 10:45",
          color: "#ef4444",
        },
        {
          id: "C",
          title: "Event C",
          start: "2025-11-26 10:30",
          end: "2025-11-26 11:00",
          color: "#f59e0b",
        },
        {
          id: "D",
          title: "Event D",
          start: "2025-11-26 10:45",
          end: "2025-11-26 11:15",
          color: "#00a82d",
        },
      ];

      const layout = engine.calculateLayout(events, "2025-11-26");

      expect(layout).toHaveLength(4);

      const eventA = layout.find((l) => l.event.id === "A")!;
      const eventB = layout.find((l) => l.event.id === "B")!;
      const eventC = layout.find((l) => l.event.id === "C")!;
      const eventD = layout.find((l) => l.event.id === "D")!;

      // Column assignment with greedy algorithm (columns are reused)
      expect(eventA.colIndex).toBe(0);
      expect(eventB.colIndex).toBe(1);
      expect(eventC.colIndex).toBe(0);
      expect(eventD.colIndex).toBe(1);

      // With 2 columns: offset = 100/2 = 50%
      expect(eventA.leftPercent).toBe(0);
      expect(eventB.leftPercent).toBe(50);
      expect(eventC.leftPercent).toBe(0);
      expect(eventD.leftPercent).toBe(50);

      // Width multiplier for 2 cols = 1.6, baseWidth = 50 * 1.6 = 80%
      // Col 0: min(80, 100) = 80%
      // Col 1: min(80, 50) = 50%
      expect(eventA.widthPercent).toBe(80);
      expect(eventB.widthPercent).toBe(50);
      expect(eventC.widthPercent).toBe(80);
      expect(eventD.widthPercent).toBe(50);
    });

    it("should handle separate groups with different layouts", () => {
      // A and B overlap (one group), C is separate (own group)
      const events: CalendarEvent[] = [
        {
          id: "A",
          title: "Event A",
          start: "2025-11-26 10:00",
          end: "2025-11-26 10:30",
          color: "#2b4fff",
        },
        {
          id: "B",
          title: "Event B",
          start: "2025-11-26 10:15",
          end: "2025-11-26 10:45",
          color: "#ef4444",
        },
        {
          id: "C",
          title: "Event C",
          start: "2025-11-26 11:00",
          end: "2025-11-26 11:30",
          color: "#f59e0b",
        },
      ];

      const layout = engine.calculateLayout(events, "2025-11-26");

      const eventA = layout.find((l) => l.event.id === "A")!;
      const eventB = layout.find((l) => l.event.id === "B")!;
      const eventC = layout.find((l) => l.event.id === "C")!;

      // A and B in one group, C in separate group
      expect(eventA.colIndex).toBe(0);
      expect(eventB.colIndex).toBe(1);
      expect(eventC.colIndex).toBe(0);

      // A and B have uniform layout (2 cols, offset=50%)
      expect(eventA.leftPercent).toBe(0);
      expect(eventB.leftPercent).toBe(50);

      // C is alone, gets full width
      expect(eventC.leftPercent).toBe(0);
      expect(eventC.widthPercent).toBe(100);
    });

    it("should handle real-world Nov 26 scenario with uniform layout", () => {
      // Real scenario: 4 events overlapping at 11:00-11:05
      const events: CalendarEvent[] = [
        {
          id: "23",
          title: "Meeting A",
          start: "2025-11-26 10:00",
          end: "2025-11-26 11:30",
          color: "#2b4fff",
        },
        {
          id: "24",
          title: "Meeting B",
          start: "2025-11-26 10:30",
          end: "2025-11-26 12:00",
          color: "#ef4444",
        },
        {
          id: "21",
          title: "5min Check-in",
          start: "2025-11-26 11:00",
          end: "2025-11-26 11:05",
          color: "#14b8a6",
        },
        {
          id: "25",
          title: "Meeting C",
          start: "2025-11-26 11:00",
          end: "2025-11-26 12:30",
          color: "#f59e0b",
        },
      ];

      const layout = engine.calculateLayout(events, "2025-11-26");

      expect(layout).toHaveLength(4);

      const meetingA = layout.find((l) => l.event.id === "23")!;
      const meetingB = layout.find((l) => l.event.id === "24")!;
      const checkin = layout.find((l) => l.event.id === "21")!;
      const meetingC = layout.find((l) => l.event.id === "25")!;

      // 4 columns needed
      expect(meetingA.colIndex).toBe(0);
      expect(meetingB.colIndex).toBe(1);
      expect(meetingC.colIndex).toBe(2);
      expect(checkin.colIndex).toBe(3);

      // 4 columns: offset = 100/4 = 25%
      // Width multiplier for 4 cols = 1.5, baseWidth = 25 * 1.5 = 37.5%
      const offset = 25;
      const baseWidth = 37.5;
      expect(meetingA.leftPercent).toBe(0);
      expect(meetingB.leftPercent).toBe(offset);
      expect(meetingC.leftPercent).toBe(offset * 2);
      expect(checkin.leftPercent).toBe(offset * 3);

      // Col 0: min(37.5, 100) = 37.5%
      // Col 1: min(37.5, 75) = 37.5%
      // Col 2: min(37.5, 50) = 37.5%
      // Col 3: min(37.5, 25) = 25%
      expect(meetingA.widthPercent).toBe(baseWidth);
      expect(meetingB.widthPercent).toBe(baseWidth);
      expect(meetingC.widthPercent).toBe(baseWidth);
      expect(checkin.widthPercent).toBe(25); // Last column capped
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

    it("should show cross-midnight events on first day", () => {
      const events: CalendarEvent[] = [
        {
          id: "1",
          title: "Cross-midnight",
          start: "2025-11-20 22:00",
          end: "2025-11-21 02:00", // Ends next day at 2 AM
          color: "#3b82f6",
        },
      ];

      const layout = engine.calculateLayout(events, "2025-11-20");

      expect(layout).toHaveLength(1);
      expect(layout[0]!.startMin).toBe(22 * 60); // 22:00
      expect(layout[0]!.endMin).toBe(24 * 60); // End of day
      expect(layout[0]!.isStart).toBe(true);
      expect(layout[0]!.isEnd).toBe(false);
      expect(layout[0]!.segmentIndex).toBe(0);
      expect(layout[0]!.totalSegments).toBe(2);
    });

    it("should show cross-midnight events on second day", () => {
      const events: CalendarEvent[] = [
        {
          id: "1",
          title: "Cross-midnight",
          start: "2025-11-20 22:00",
          end: "2025-11-21 02:00", // Ends next day at 2 AM
          color: "#3b82f6",
        },
      ];

      const layout = engine.calculateLayout(events, "2025-11-21");

      expect(layout).toHaveLength(1);
      expect(layout[0]!.startMin).toBe(0); // Start of day
      expect(layout[0]!.endMin).toBe(2 * 60); // 02:00
      expect(layout[0]!.isStart).toBe(false);
      expect(layout[0]!.isEnd).toBe(true);
      expect(layout[0]!.segmentIndex).toBe(1);
      expect(layout[0]!.totalSegments).toBe(2);
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

  describe("isCrossMidnightEvent", () => {
    it("should return true for event crossing midnight", () => {
      const event: CalendarEvent = {
        id: "1",
        title: "Night Event",
        start: "2025-11-20 22:00",
        end: "2025-11-21 02:00",
        color: "#3b82f6",
      };

      expect(engine.isCrossMidnightEvent(event)).toBe(true);
    });

    it("should return false for single-day event", () => {
      const event: CalendarEvent = {
        id: "1",
        title: "Day Event",
        start: "2025-11-20 10:00",
        end: "2025-11-20 12:00",
        color: "#3b82f6",
      };

      expect(engine.isCrossMidnightEvent(event)).toBe(false);
    });

    it("should return false for all-day event", () => {
      const event: CalendarEvent = {
        id: "1",
        title: "All Day",
        start: "2025-11-20 00:00",
        end: "2025-11-21 00:00",
        color: "#3b82f6",
      };

      expect(engine.isCrossMidnightEvent(event)).toBe(false);
    });
  });

  describe("getEventDaySpan", () => {
    it("should return 1 for single-day event", () => {
      const event: CalendarEvent = {
        id: "1",
        title: "Single Day",
        start: "2025-11-20 10:00",
        end: "2025-11-20 12:00",
        color: "#3b82f6",
      };

      expect(engine.getEventDaySpan(event)).toBe(1);
    });

    it("should return 2 for cross-midnight event", () => {
      const event: CalendarEvent = {
        id: "1",
        title: "Cross Midnight",
        start: "2025-11-20 22:00",
        end: "2025-11-21 02:00",
        color: "#3b82f6",
      };

      expect(engine.getEventDaySpan(event)).toBe(2);
    });

    it("should return 3 for three-day event", () => {
      const event: CalendarEvent = {
        id: "1",
        title: "Three Days",
        start: "2025-11-20 10:00",
        end: "2025-11-22 10:00",
        color: "#3b82f6",
      };

      expect(engine.getEventDaySpan(event)).toBe(3);
    });
  });

  describe("cross-midnight event layout", () => {
    it("should handle event spanning 3 days", () => {
      const events: CalendarEvent[] = [
        {
          id: "1",
          title: "Long Event",
          start: "2025-11-20 20:00",
          end: "2025-11-22 06:00",
          color: "#3b82f6",
        },
      ];

      // First day: 20:00 - 24:00
      const day1 = engine.calculateLayout(events, "2025-11-20");
      expect(day1).toHaveLength(1);
      expect(day1[0]!.startMin).toBe(20 * 60);
      expect(day1[0]!.endMin).toBe(24 * 60);
      expect(day1[0]!.isStart).toBe(true);
      expect(day1[0]!.isEnd).toBe(false);
      expect(day1[0]!.segmentIndex).toBe(0);
      expect(day1[0]!.totalSegments).toBe(3);

      // Middle day: 00:00 - 24:00 (full day)
      const day2 = engine.calculateLayout(events, "2025-11-21");
      expect(day2).toHaveLength(1);
      expect(day2[0]!.startMin).toBe(0);
      expect(day2[0]!.endMin).toBe(24 * 60);
      expect(day2[0]!.isStart).toBe(false);
      expect(day2[0]!.isEnd).toBe(false);
      expect(day2[0]!.segmentIndex).toBe(1);
      expect(day2[0]!.totalSegments).toBe(3);

      // Last day: 00:00 - 06:00
      const day3 = engine.calculateLayout(events, "2025-11-22");
      expect(day3).toHaveLength(1);
      expect(day3[0]!.startMin).toBe(0);
      expect(day3[0]!.endMin).toBe(6 * 60);
      expect(day3[0]!.isStart).toBe(false);
      expect(day3[0]!.isEnd).toBe(true);
      expect(day3[0]!.segmentIndex).toBe(2);
      expect(day3[0]!.totalSegments).toBe(3);
    });

    it("should handle cross-midnight event ending at midnight", () => {
      const events: CalendarEvent[] = [
        {
          id: "1",
          title: "Until Midnight",
          start: "2025-11-20 22:00",
          end: "2025-11-21 00:00", // Ends exactly at midnight
          color: "#3b82f6",
        },
      ];

      // First day should show the event
      const day1 = engine.calculateLayout(events, "2025-11-20");
      expect(day1).toHaveLength(1);
      expect(day1[0]!.startMin).toBe(22 * 60);
      expect(day1[0]!.endMin).toBe(24 * 60);

      // Second day should NOT show the event (ends at 00:00, no duration)
      const day2 = engine.calculateLayout(events, "2025-11-21");
      expect(day2).toHaveLength(0);
    });

    it("should include isStart/isEnd for single-day events", () => {
      const events: CalendarEvent[] = [
        {
          id: "1",
          title: "Single Day",
          start: "2025-11-20 10:00",
          end: "2025-11-20 12:00",
          color: "#3b82f6",
        },
      ];

      const layout = engine.calculateLayout(events, "2025-11-20");

      expect(layout).toHaveLength(1);
      expect(layout[0]!.isStart).toBe(true);
      expect(layout[0]!.isEnd).toBe(true);
      expect(layout[0]!.segmentIndex).toBeUndefined();
      expect(layout[0]!.totalSegments).toBeUndefined();
    });

    it("should not show cross-midnight events on unrelated days", () => {
      const events: CalendarEvent[] = [
        {
          id: "1",
          title: "Cross Midnight",
          start: "2025-11-20 22:00",
          end: "2025-11-21 02:00",
          color: "#3b82f6",
        },
      ];

      // Day before - should not show
      const dayBefore = engine.calculateLayout(events, "2025-11-19");
      expect(dayBefore).toHaveLength(0);

      // Day after - should not show
      const dayAfter = engine.calculateLayout(events, "2025-11-22");
      expect(dayAfter).toHaveLength(0);
    });

    it("should filter all-day events from calculateLayout", () => {
      const events: CalendarEvent[] = [
        {
          id: "1",
          title: "All Day Event",
          start: "2025-11-20 00:00",
          end: "2025-11-21 00:00",
          color: "#3b82f6",
        },
      ];

      const layout = engine.calculateLayout(events, "2025-11-20");
      // All-day events should be handled by calculateAllDayLayout, not calculateLayout
      expect(layout).toHaveLength(0);
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

  describe("calculateAllDayLayout", () => {
    it("should split all-day event when hidden days create calendar gaps", () => {
      // All-day event spans Mon-Wed (Nov 3-5, 2025)
      const events: CalendarEvent[] = [
        {
          id: "1",
          title: "All Day Event",
          start: "2025-11-03 00:00", // Monday
          end: "2025-11-05 00:00", // Wednesday (end exclusive, so covers Mon-Tue)
          color: "#3b82f6",
        },
      ];

      // Visible columns: Mon, Wed (Tuesday hidden)
      const columns: TimeColumn<any>[] = [
        { date: adapter.create("2025-11-03"), dateStr: "2025-11-03" }, // Mon
        // Tuesday (Nov 4) hidden
        { date: adapter.create("2025-11-05"), dateStr: "2025-11-05" }, // Wed
      ];

      const layout = engine.calculateAllDayLayout(events, columns);

      // Event should be split because Mon and Wed are NOT consecutive calendar days
      expect(layout.length).toBe(2);

      // First segment: Monday only
      expect(layout[0]!.startIdx).toBe(0);
      expect(layout[0]!.span).toBe(1);
      expect(layout[0]!.isStart).toBe(true);
      expect(layout[0]!.isEnd).toBe(false);
      expect(layout[0]!.segmentIndex).toBe(0);
      expect(layout[0]!.totalSegments).toBe(2);

      // Second segment: Wednesday only
      expect(layout[1]!.startIdx).toBe(1);
      expect(layout[1]!.span).toBe(1);
      expect(layout[1]!.isStart).toBe(false);
      expect(layout[1]!.isEnd).toBe(true);
      expect(layout[1]!.segmentIndex).toBe(1);
      expect(layout[1]!.totalSegments).toBe(2);
    });

    it("should split all-day event when weekends are hidden (Fri-Mon)", () => {
      // All-day event Fri-Mon (Nov 7-10, 2025) - crosses weekend
      // Note: end date is inclusive in this implementation
      const events: CalendarEvent[] = [
        {
          id: "1",
          title: "Weekend Cross",
          start: "2025-11-07 00:00", // Friday
          end: "2025-11-10 00:00", // Monday (inclusive)
          color: "#3b82f6",
        },
      ];

      // Visible columns: Mon-Fri (weekends hidden) - two weeks
      const columns: TimeColumn<any>[] = [
        { date: adapter.create("2025-11-03"), dateStr: "2025-11-03" }, // Mon
        { date: adapter.create("2025-11-04"), dateStr: "2025-11-04" }, // Tue
        { date: adapter.create("2025-11-05"), dateStr: "2025-11-05" }, // Wed
        { date: adapter.create("2025-11-06"), dateStr: "2025-11-06" }, // Thu
        { date: adapter.create("2025-11-07"), dateStr: "2025-11-07" }, // Fri
        // Saturday (Nov 8) hidden
        // Sunday (Nov 9) hidden
        { date: adapter.create("2025-11-10"), dateStr: "2025-11-10" }, // Mon
        { date: adapter.create("2025-11-11"), dateStr: "2025-11-11" }, // Tue
      ];

      const layout = engine.calculateAllDayLayout(events, columns);

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

    it("should not split all-day event when all days are visible", () => {
      // All-day event Mon-Wed (end date is inclusive)
      const events: CalendarEvent[] = [
        {
          id: "1",
          title: "Continuous Event",
          start: "2025-11-03 00:00", // Monday
          end: "2025-11-05 00:00", // Wednesday (inclusive)
          color: "#3b82f6",
        },
      ];

      // All days visible
      const columns: TimeColumn<any>[] = [
        { date: adapter.create("2025-11-03"), dateStr: "2025-11-03" }, // Mon
        { date: adapter.create("2025-11-04"), dateStr: "2025-11-04" }, // Tue
        { date: adapter.create("2025-11-05"), dateStr: "2025-11-05" }, // Wed
        { date: adapter.create("2025-11-06"), dateStr: "2025-11-06" }, // Thu
        { date: adapter.create("2025-11-07"), dateStr: "2025-11-07" }, // Fri
      ];

      const layout = engine.calculateAllDayLayout(events, columns);

      // Event should NOT be split
      expect(layout.length).toBe(1);
      expect(layout[0]!.startIdx).toBe(0);
      expect(layout[0]!.span).toBe(3); // Mon-Wed
      expect(layout[0]!.isStart).toBe(true);
      expect(layout[0]!.isEnd).toBe(true);
      expect(layout[0]!.segmentIndex).toBeUndefined();
      expect(layout[0]!.totalSegments).toBeUndefined();
    });

    it("should handle multiple non-contiguous visible islands", () => {
      // All-day event spanning full week (end date is inclusive)
      const events: CalendarEvent[] = [
        {
          id: "1",
          title: "Week Long",
          start: "2025-11-03 00:00", // Monday
          end: "2025-11-07 00:00", // Friday (inclusive)
          color: "#3b82f6",
        },
      ];

      // Only Mon, Wed, Fri visible (Tue and Thu hidden)
      const columns: TimeColumn<any>[] = [
        { date: adapter.create("2025-11-03"), dateStr: "2025-11-03" }, // Mon
        // Tue hidden
        { date: adapter.create("2025-11-05"), dateStr: "2025-11-05" }, // Wed
        // Thu hidden
        { date: adapter.create("2025-11-07"), dateStr: "2025-11-07" }, // Fri
      ];

      const layout = engine.calculateAllDayLayout(events, columns);

      // Event should be split into 3 segments
      expect(layout.length).toBe(3);

      // First segment: Monday
      expect(layout[0]!.startIdx).toBe(0);
      expect(layout[0]!.span).toBe(1);
      expect(layout[0]!.isStart).toBe(true);
      expect(layout[0]!.isEnd).toBe(false);
      expect(layout[0]!.segmentIndex).toBe(0);
      expect(layout[0]!.totalSegments).toBe(3);

      // Second segment: Wednesday
      expect(layout[1]!.startIdx).toBe(1);
      expect(layout[1]!.span).toBe(1);
      expect(layout[1]!.isStart).toBe(false);
      expect(layout[1]!.isEnd).toBe(false);
      expect(layout[1]!.segmentIndex).toBe(1);
      expect(layout[1]!.totalSegments).toBe(3);

      // Third segment: Friday
      expect(layout[2]!.startIdx).toBe(2);
      expect(layout[2]!.span).toBe(1);
      expect(layout[2]!.isStart).toBe(false);
      expect(layout[2]!.isEnd).toBe(true);
      expect(layout[2]!.segmentIndex).toBe(2);
      expect(layout[2]!.totalSegments).toBe(3);
    });

    it("should return empty array for empty events", () => {
      const columns: TimeColumn<any>[] = [
        { date: adapter.create("2025-11-03"), dateStr: "2025-11-03" },
      ];

      const layout = engine.calculateAllDayLayout([], columns);
      expect(layout).toHaveLength(0);
    });

    it("should return empty array for empty columns", () => {
      const events: CalendarEvent[] = [
        {
          id: "1",
          title: "Event",
          start: "2025-11-03 00:00",
          end: "2025-11-04 00:00",
          color: "#3b82f6",
        },
      ];

      const layout = engine.calculateAllDayLayout(events, []);
      expect(layout).toHaveLength(0);
    });
  });
});
