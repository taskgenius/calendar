import { describe, it, expect, beforeEach } from "vitest";
import { MonthRenderer } from "../../../src/renderers/MonthRenderer";
import { MonthEngine } from "../../../src/engines/MonthEngine";
import { DayJsAdapter } from "../../../src/adapters/DayJsAdapter";
import { DragController } from "../../../src/core/DragController";
import { DEFAULT_DATE_FORMATS } from "../../../src/constants";
import type { CalendarEvent, ThemeConfig } from "../../../src/types";

describe("MonthRenderer", () => {
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
  let engine: MonthEngine<any>;
  let renderer: MonthRenderer<any>;
  let dragController: DragController<any>;

  beforeEach(() => {
    container = document.createElement("div");
    engine = new MonthEngine(adapter, 0, true, DEFAULT_DATE_FORMATS);
    renderer = new MonthRenderer(engine, adapter, theme, DEFAULT_DATE_FORMATS);
    dragController = new DragController(
      adapter,
      { enabled: true, snapMinutes: 15, ghostOpacity: 0.5, dateOnly: false },
      () => {},
      60,
      DEFAULT_DATE_FORMATS,
    );
  });

  describe("Bug Fix: Weekday Labels", () => {
    it("should render English weekday labels (not Chinese)", () => {
      const date = adapter.create("2025-11-20");
      const events: CalendarEvent[] = [];

      renderer.render(
        container,
        date,
        events,
        dragController,
        () => {},
        undefined,
        undefined,
      );

      const header = container.querySelector(".tg-month-header");
      expect(header).toBeTruthy();

      const headerCells = header?.querySelectorAll(".tg-month-header-cell");
      expect(headerCells).toHaveLength(7);

      // Verify English labels (starting from Sunday)
      const expectedLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      headerCells?.forEach((cell, index) => {
        expect(cell.textContent).toBe(expectedLabels[index]);
      });
    });

    it("should not render Chinese characters (避免乱码)", () => {
      const date = adapter.create("2025-11-20");
      const events: CalendarEvent[] = [];

      renderer.render(
        container,
        date,
        events,
        dragController,
        () => {},
        undefined,
        undefined,
      );

      const header = container.querySelector(".tg-month-header");
      const headerText = header?.textContent || "";

      // Should not contain Chinese characters
      expect(headerText).not.toMatch(/[日一二三四五六]/);
      // Should contain English characters
      expect(headerText).toMatch(/[A-Za-z]/);
    });
  });

  describe("Bug Fix: Event Bar Positioning with dayFilter", () => {
    const events: CalendarEvent[] = [
      {
        id: "1",
        title: "Event 1",
        start: "2025-11-03 10:00", // Monday
        end: "2025-11-05 12:00", // Wednesday (spans 3 days)
        color: "#3b82f6",
      },
    ];

    it("should correctly position event bars when all days are visible (7 columns)", () => {
      const date = adapter.create("2025-11-03"); // Week of Nov 2-8, 2025

      renderer.render(
        container,
        date,
        events,
        dragController,
        () => {},
        undefined,
        undefined, // No dayFilter - all 7 days visible
      );

      const eventBar = container.querySelector(
        '.tg-event-bar[data-eid="1"]',
      ) as HTMLElement;
      expect(eventBar).toBeTruthy();

      // With 7 columns, each column is 100/7 ≈ 14.28% width
      // Event spans 3 days, so width should be ~42.86%
      const expectedWidth = (3 / 7) * 100;
      // Width is in format: calc(42.8571% - 4px)
      expect(eventBar.style.width).toMatch(/calc\(42\.\d+%/);
    });

    it("should correctly position event bars when weekends are hidden (5 columns)", () => {
      const date = adapter.create("2025-11-03");

      // dayFilter to hide weekends
      const dayFilter = (_: any, context: any) => !context.isWeekend;

      renderer.render(
        container,
        date,
        events,
        dragController,
        () => {},
        undefined,
        dayFilter,
      );

      const eventBar = container.querySelector(
        '.tg-event-bar[data-eid="1"]',
      ) as HTMLElement;
      expect(eventBar).toBeTruthy();

      // With 5 columns (Mon-Fri), each column is 20% width
      // Event spans 3 weekdays (Mon-Wed), so width should be 60%
      const expectedWidth = (3 / 5) * 100;
      expect(eventBar.style.width).toContain(`${expectedWidth}`);
    });

    it("should correctly position event bars when arbitrary days are filtered (e.g., 4 columns)", () => {
      const date = adapter.create("2025-11-03");

      // dayFilter to show only Mon, Tue, Wed, Thu (hide Fri, Sat, Sun)
      const dayFilter = (_: any, context: any) => {
        return context.dayOfWeek >= 1 && context.dayOfWeek <= 4;
      };

      renderer.render(
        container,
        date,
        events,
        dragController,
        () => {},
        undefined,
        dayFilter,
      );

      const eventBar = container.querySelector(
        '.tg-event-bar[data-eid="1"]',
      ) as HTMLElement;
      expect(eventBar).toBeTruthy();

      // With 4 columns (Mon-Thu), each column is 25% width
      // Event spans 3 days (Mon-Wed), so width should be 75%
      const expectedWidth = (3 / 4) * 100;
      expect(eventBar.style.width).toContain(`${expectedWidth}`);
    });

    it("should align event bars to correct columns regardless of dayFilter", () => {
      const date = adapter.create("2025-11-03");

      // Test with different column counts
      const testCases = [
        { name: "7 columns (all days)", dayFilter: undefined, expectedColumns: 7 },
        {
          name: "5 columns (no weekends)",
          dayFilter: (_: any, ctx: any) => !ctx.isWeekend,
          expectedColumns: 5,
        },
        {
          name: "3 columns (Mon, Wed, Fri)",
          dayFilter: (_: any, ctx: any) => [1, 3, 5].includes(ctx.dayOfWeek),
          expectedColumns: 3,
        },
      ];

      testCases.forEach(({ name, dayFilter, expectedColumns }) => {
        container.innerHTML = ""; // Clear container

        renderer.render(
          container,
          date,
          events,
          dragController,
          () => {},
          undefined,
          dayFilter,
        );

        const eventBar = container.querySelector(
          '.tg-event-bar[data-eid="1"]',
        ) as HTMLElement;
        expect(eventBar, `${name}: event bar should exist`).toBeTruthy();

        // Verify that column width calculation uses actual column count
        const width = eventBar.style.width;
        const expectedColWidth = 100 / expectedColumns;

        // Width should be based on actual column count, not hardcoded 7 or 5
        // Format is: calc(XX.XXXX% - 4px) where XX.XXXX is a multiple of expectedColWidth
        expect(
          width.startsWith("calc("),
          `${name}: width should use calc() format`,
        ).toBeTruthy();

        // Extract percentage from calc(XX.XX% - 4px)
        const percentMatch = width.match(/calc\(([\d.]+)%/);
        expect(percentMatch, `${name}: should have percentage in width`).toBeTruthy();

        if (percentMatch) {
          const actualPercent = parseFloat(percentMatch[1]!);
          // Check if it's a multiple of the column width (allowing for floating point precision)
          const ratio = actualPercent / expectedColWidth;
          expect(
            Math.abs(ratio - Math.round(ratio)) < 0.01,
            `${name}: width ${actualPercent}% should be multiple of column width ${expectedColWidth.toFixed(2)}%`,
          ).toBeTruthy();
        }
      });
    });

    it("should not drift event bars when non-weekend days are filtered", () => {
      const date = adapter.create("2025-11-03");

      // Hide Tuesday (dayOfWeek = 2)
      const dayFilter = (_: any, context: any) => context.dayOfWeek !== 2;

      renderer.render(
        container,
        date,
        events,
        dragController,
        () => {},
        undefined,
        dayFilter,
      );

      const rows = container.querySelectorAll(".tg-month-row");
      const firstRow = rows[0];
      expect(firstRow).toBeTruthy();

      // Verify grid has 6 columns (7 - 1 hidden)
      const cells = firstRow?.querySelectorAll(".tg-month-cell");
      expect(cells).toHaveLength(6);

      // Verify event bar uses 6-column layout
      const eventBar = container.querySelector(
        '.tg-event-bar[data-eid="1"]',
      ) as HTMLElement;
      expect(eventBar).toBeTruthy();

      // Event spans Mon-Wed (3 calendar days)
      // Even though Tue is hidden, the event bar maintains its 3-day span for continuity
      // With 6 visible columns, event spans 3/6 = 50%
      const width = eventBar.style.width;

      // Format should be: calc(XX.XX% - 4px)
      expect(width.startsWith("calc(")).toBeTruthy();

      // Extract and verify percentage
      const percentMatch = width.match(/calc\(([\d.]+)%/);
      expect(percentMatch).toBeTruthy();

      if (percentMatch) {
        const actualPercent = parseFloat(percentMatch[1]!);
        // Event maintains 3-day span even with hidden day = 50% (3/6 columns)
        const expectedPercent = (3 / 6) * 100;
        expect(
          Math.abs(actualPercent - expectedPercent) < 0.1,
          `Width should be 50% (3-day span across 6 visible columns), got ${actualPercent}%`,
        ).toBeTruthy();
      }
    });
  });

  describe("Dynamic Grid Layout", () => {
    it("should render correct number of header cells based on dayFilter", () => {
      const date = adapter.create("2025-11-20");
      const events: CalendarEvent[] = [];

      // Test different column counts
      const testCases = [
        { filter: undefined, expectedCols: 7, name: "all days" },
        {
          filter: (_: any, ctx: any) => !ctx.isWeekend,
          expectedCols: 5,
          name: "weekdays only",
        },
        {
          filter: (_: any, ctx: any) => ctx.isWeekend,
          expectedCols: 2,
          name: "weekends only",
        },
        {
          filter: (_: any, ctx: any) => ctx.dayOfWeek === 1,
          expectedCols: 1,
          name: "Monday only",
        },
      ];

      testCases.forEach(({ filter, expectedCols, name }) => {
        container.innerHTML = "";

        renderer.render(
          container,
          date,
          events,
          dragController,
          () => {},
          undefined,
          filter,
        );

        const header = container.querySelector(".tg-month-header");
        const headerCells = header?.querySelectorAll(".tg-month-header-cell");

        expect(
          headerCells?.length,
          `${name} should have ${expectedCols} header cells`,
        ).toBe(expectedCols);
      });
    });
  });
});
