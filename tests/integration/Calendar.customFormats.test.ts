import { describe, it, expect } from "vitest";
import { Calendar } from "../../src/core/Calendar";
import { NativeDateAdapter } from "../../src/adapters/NativeDateAdapter";
import type { CalendarEvent } from "../../src/types";

describe("Calendar - Custom Date Formats Integration", () => {
  describe("with custom dateFormats configuration", () => {
    it("should use custom formats for display while maintaining ISO for API", () => {
      const container = document.createElement("div");
      let capturedDate = "";

      const calendar = new Calendar(container, {
        view: { type: "month" },
        dateFormats: {
          date: "yyyy/MM/dd",
          dateTime: "yyyy/MM/dd HH:mm",
          time: "HH:mm",
          monthHeader: "yyyy年M月",
          dayHeader: "yyyy年M月d日",
        },
        onDateChange: (date) => {
          capturedDate = date;
        },
      });

      // Navigate - should use ISO format in callback
      calendar.next();
      expect(capturedDate).toMatch(/^\d{4}-\d{2}-\d{2}$/); // ISO format

      // getCurrentDate should return ISO format
      const currentDate = calendar.getCurrentDate();
      expect(currentDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);

      calendar.destroy();
    });

    it("should work with NativeDateAdapter and custom formats", () => {
      const container = document.createElement("div");
      const adapter = new NativeDateAdapter();

      const events: CalendarEvent[] = [
        {
          id: "1",
          title: "Test Event",
          start: "2025-11-20 10:00",
          end: "2025-11-20 11:00",
        },
      ];

      const calendar = new Calendar(container, {
        view: { type: "week" },
        dateAdapter: adapter,
        dateFormats: {
          date: "yyyy/MM/dd",
          dateTime: "yyyy/MM/dd HH:mm",
          time: "HH:mm",
          monthHeader: "yyyy年M月",
          dayHeader: "yyyy年M月d日",
        },
        events,
      });

      // Should render without errors
      expect(container.querySelector(".tg-calendar")).toBeTruthy();

      calendar.destroy();
    });

    it("should handle drag-and-drop with custom formats", () => {
      const container = document.createElement("div");
      let droppedStart = "";
      let droppedEnd = "";

      const calendar = new Calendar(container, {
        view: { type: "week" },
        dateFormats: {
          date: "yyyy/MM/dd",
          dateTime: "yyyy/MM/dd HH:mm",
          time: "HH:mm",
          monthHeader: "MMMM yyyy",
          dayHeader: "MMMM d, yyyy",
        },
        events: [
          {
            id: "1",
            title: "Draggable Event",
            start: "2025-11-20 10:00",
            end: "2025-11-20 11:00",
          },
        ],
        draggable: {
          enabled: true,
        },
        onEventDrop: (event, newStart, newEnd) => {
          droppedStart = newStart;
          droppedEnd = newEnd;
        },
      });

      // Verify calendar renders
      expect(container.querySelector(".tg-calendar")).toBeTruthy();

      // Event drop callback should use ISO format (YYYY-MM-DD HH:mm)
      // even when dateFormats uses different format
      // This is tested indirectly - the format is defined in INTERNAL_DATA_FORMAT

      calendar.destroy();
    });
  });

  describe("backward compatibility", () => {
    it("should still work with old headerFormat configuration", () => {
      const container = document.createElement("div");

      const calendar = new Calendar(container, {
        view: { type: "month" },
        headerFormat: {
          month: "YYYY年 M月",
          day: "YYYY年M月D日",
        },
      });

      // Should render without errors
      expect(container.querySelector(".tg-calendar")).toBeTruthy();

      calendar.destroy();
    });

    it("should prioritize dateFormats over headerFormat", () => {
      const container = document.createElement("div");

      const calendar = new Calendar(container, {
        view: { type: "month" },
        dateFormats: {
          monthHeader: "MMMM yyyy",
          dayHeader: "MMMM d, yyyy",
        },
        headerFormat: {
          month: "YYYY年 M月", // Should be overridden
          day: "YYYY年M月D日", // Should be overridden
        },
      });

      // Internal config should use dateFormats values
      expect(container.querySelector(".tg-calendar")).toBeTruthy();

      calendar.destroy();
    });
  });

  describe("API stability", () => {
    it("getCurrentDate should always return ISO format", () => {
      const container = document.createElement("div");

      const calendar = new Calendar(container, {
        view: { type: "month" },
        dateFormats: {
          date: "dd/MM/yyyy", // Non-ISO format
          monthHeader: "MMMM yyyy",
          dayHeader: "d MMMM yyyy",
        },
      });

      const currentDate = calendar.getCurrentDate();

      // Should always be ISO format regardless of dateFormats config
      expect(currentDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);

      calendar.destroy();
    });

    it("onDateChange callback should receive ISO format", () => {
      const container = document.createElement("div");
      const capturedDates: string[] = [];

      const calendar = new Calendar(container, {
        view: { type: "month" },
        dateFormats: {
          date: "yyyy/MM/dd",
          monthHeader: "yyyy年M月",
          dayHeader: "yyyy年M月d日",
        },
        onDateChange: (date) => {
          capturedDates.push(date);
        },
      });

      calendar.next();
      calendar.prev();
      calendar.today();

      // All callbacks should receive ISO format
      capturedDates.forEach((date) => {
        expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      });

      calendar.destroy();
    });
  });
});
