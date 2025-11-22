import { describe, it, expect, beforeEach } from "vitest";
import { TimeRenderer } from "../../../src/renderers/TimeRenderer";
import { TimeEngine } from "../../../src/engines/TimeEngine";
import { DayJsAdapter } from "../../../src/adapters/DayJsAdapter";
import { DragController } from "../../../src/core/DragController";
import { DEFAULT_DATE_FORMATS } from "../../../src/constants";
import type { CalendarEvent, ThemeConfig } from "../../../src/types";

describe("TimeRenderer", () => {
  const adapter = new DayJsAdapter();
  const theme: Required<ThemeConfig> & {
    fontSize: Required<NonNullable<ThemeConfig["fontSize"]>>;
  } = {
    primaryColor: "#3b82f6",
    cellHeight: 60,
    fontSize: {
      header: "14px",
      event: "12px",
    },
  };

  let container: HTMLElement;
  let engine: TimeEngine<any>;
  let renderer: TimeRenderer<any>;
  let dragController: DragController<any>;

  beforeEach(() => {
    container = document.createElement("div");
    engine = new TimeEngine(adapter, 60, true, 0, DEFAULT_DATE_FORMATS);
    renderer = new TimeRenderer(engine, adapter, theme, DEFAULT_DATE_FORMATS);
    dragController = new DragController(
      adapter,
      { enabled: true, snapMinutes: 15, ghostOpacity: 0.5, dateOnly: false },
      () => {},
      60,
      DEFAULT_DATE_FORMATS,
    );
  });

  describe("Bug Fix: Weekday Labels", () => {
    it("should render English weekday labels in week view (not Chinese)", () => {
      const date = adapter.create("2025-11-20"); // Thursday
      const events: CalendarEvent[] = [];

      renderer.render(
        container,
        date,
        "week",
        events,
        dragController,
        () => {},
        undefined,
        null,
      );

      const header = container.querySelector(".tg-time-header");
      expect(header).toBeTruthy();

      const headerCells = header?.querySelectorAll(".tg-time-header-cell");
      expect(headerCells).toHaveLength(7);

      // Verify English labels appear in the header
      const headerText = header?.textContent || "";
      const expectedLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

      // At least some English labels should be present
      const hasEnglishLabels = expectedLabels.some((label) =>
        headerText.includes(label),
      );
      expect(hasEnglishLabels).toBeTruthy();
    });

    it("should render English weekday label in day view (not Chinese)", () => {
      const date = adapter.create("2025-11-20"); // Thursday
      const events: CalendarEvent[] = [];

      renderer.render(
        container,
        date,
        "day",
        events,
        dragController,
        () => {},
        undefined,
        null,
      );

      const header = container.querySelector(".tg-time-header");
      expect(header).toBeTruthy();

      const headerCells = header?.querySelectorAll(".tg-time-header-cell");
      expect(headerCells).toHaveLength(1);

      const headerText = header?.textContent || "";
      // Should contain "Thu" (Thursday)
      expect(headerText).toContain("Thu");
    });

    it("should not render Chinese characters in time view headers (避免乱码)", () => {
      const date = adapter.create("2025-11-20");
      const events: CalendarEvent[] = [];

      // Test both week and day views
      const viewTypes: Array<"week" | "day"> = ["week", "day"];

      viewTypes.forEach((viewType) => {
        container.innerHTML = "";

        renderer.render(
          container,
          date,
          viewType,
          events,
          dragController,
          () => {},
          undefined,
          null,
        );

        const header = container.querySelector(".tg-time-header");
        const headerText = header?.textContent || "";

        // Should not contain Chinese weekday characters
        expect(
          headerText,
          `${viewType} view should not have Chinese characters`,
        ).not.toMatch(/[周日一二三四五六]/);

        // Should contain English characters
        expect(
          headerText,
          `${viewType} view should have English characters`,
        ).toMatch(/[A-Za-z]/);
      });
    });
  });

  describe("Dynamic Column Layout with dayFilter", () => {
    it("should render correct number of columns when dayFilter hides weekends", () => {
      const date = adapter.create("2025-11-20");
      const events: CalendarEvent[] = [];

      // dayFilter to hide weekends
      const dayFilter = (_: any, context: any) => !context.isWeekend;

      renderer.render(
        container,
        date,
        "week",
        events,
        dragController,
        () => {},
        undefined,
        null,
        dayFilter,
      );

      const headerCells = container.querySelectorAll(".tg-time-header-cell");
      // Should only have 5 columns (Mon-Fri)
      expect(headerCells).toHaveLength(5);

      const dayColumns = container.querySelectorAll(".tg-day-column");
      expect(dayColumns).toHaveLength(5);
    });

    it("should render correct number of columns when dayFilter shows only specific days", () => {
      const date = adapter.create("2025-11-20");
      const events: CalendarEvent[] = [];

      // dayFilter to show only Mon, Wed, Fri
      const dayFilter = (_: any, context: any) => {
        return [1, 3, 5].includes(context.dayOfWeek);
      };

      renderer.render(
        container,
        date,
        "week",
        events,
        dragController,
        () => {},
        undefined,
        null,
        dayFilter,
      );

      const headerCells = container.querySelectorAll(".tg-time-header-cell");
      // Should only have 3 columns (Mon, Wed, Fri)
      expect(headerCells).toHaveLength(3);

      const dayColumns = container.querySelectorAll(".tg-day-column");
      expect(dayColumns).toHaveLength(3);
    });
  });

  describe("Time Slot Filtering", () => {
    it("should render only visible time slots when timeFilter is applied", () => {
      const date = adapter.create("2025-11-20");
      const events: CalendarEvent[] = [];

      // timeFilter to show only working hours (9-17)
      const timeFilter = (hour: number) => hour >= 9 && hour < 17;

      renderer.render(
        container,
        date,
        "day",
        events,
        dragController,
        () => {},
        undefined,
        null,
        undefined,
        timeFilter,
      );

      const timeLabels = container.querySelectorAll(".tg-time-axis-label");
      // Should have 8 time slots (9, 10, 11, 12, 13, 14, 15, 16)
      expect(timeLabels).toHaveLength(8);
    });

    it("should render all 24 time slots when no timeFilter is applied", () => {
      const date = adapter.create("2025-11-20");
      const events: CalendarEvent[] = [];

      renderer.render(
        container,
        date,
        "day",
        events,
        dragController,
        () => {},
        undefined,
        null,
      );

      const timeLabels = container.querySelectorAll(".tg-time-axis-label");
      expect(timeLabels).toHaveLength(24);
    });
  });

  describe("Time Formatter", () => {
    it("should use custom time formatter when provided", () => {
      const date = adapter.create("2025-11-20");
      const events: CalendarEvent[] = [];

      // 12-hour format
      const timeFormatter = (hour: number) => {
        const h = hour % 12 || 12;
        const period = hour >= 12 ? "PM" : "AM";
        return `${h} ${period}`;
      };

      renderer.render(
        container,
        date,
        "day",
        events,
        dragController,
        () => {},
        undefined,
        null,
        undefined,
        undefined,
        timeFormatter,
      );

      const firstLabel = container.querySelector(".tg-time-axis-label");
      expect(firstLabel?.textContent).toBe("12 AM"); // 0:00 -> 12 AM
    });

    it("should use default format when no timeFormatter is provided", () => {
      const date = adapter.create("2025-11-20");
      const events: CalendarEvent[] = [];

      renderer.render(
        container,
        date,
        "day",
        events,
        dragController,
        () => {},
        undefined,
        null,
      );

      const firstLabel = container.querySelector(".tg-time-axis-label");
      expect(firstLabel?.textContent).toBe("0:00");
    });
  });
});
