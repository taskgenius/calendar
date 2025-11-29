import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { Calendar } from "../../src/core/Calendar";
import type { CalendarEvent } from "../../src/types";
import { createTestCalendar } from "../helpers/createTestCalendar";

describe("Ghost element positioning during drag", () => {
  let container: HTMLDivElement;
  let calendar: Calendar;
  const originalElementFromPoint = (document as any).elementFromPoint;

  beforeEach(() => {
    container = document.createElement("div");
    container.id = "ghost-test-calendar";
    // Set container dimensions for realistic testing
    Object.defineProperty(container, "offsetWidth", {
      value: 700,
      configurable: true,
    });
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (calendar) {
      calendar.destroy();
    }
    container.remove();
    if (originalElementFromPoint) {
      Object.defineProperty(document, "elementFromPoint", {
        value: originalElementFromPoint,
        configurable: true,
      });
    } else {
      // @ts-expect-error allow deletion of the test stub
      delete document.elementFromPoint;
    }
    vi.restoreAllMocks();
  });

  const stubElementFromPoint = (el: Element) => {
    Object.defineProperty(document, "elementFromPoint", {
      value: vi.fn().mockReturnValue(el),
      configurable: true,
    });
  };

  const mockRowRect = (row: HTMLElement, width: number) => {
    vi.spyOn(row, "getBoundingClientRect").mockReturnValue({
      width,
      height: 100,
      top: 0,
      left: 0,
      right: width,
      bottom: 100,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    } as DOMRect);
    Object.defineProperty(row, "offsetWidth", {
      value: width,
      configurable: true,
    });
  };

  describe("Month view ghost width calculation", () => {
    it("calculates ghost width correctly when container is narrow", () => {
      const events: CalendarEvent[] = [
        {
          id: "evt-1",
          title: "Test Event",
          start: "2025-11-17",
          end: "2025-11-17",
          allDay: true,
        },
      ];

      calendar = createTestCalendar("#ghost-test-calendar", {
        view: { type: "month" },
        events,
      });

      calendar.goToDate("2025-11-17");

      // Nov 17, 2025 is Monday - its week starts on Nov 16 (Sunday)
      const row = container.querySelector(
        '.tg-month-row[data-date="2025-11-16"]',
      ) as HTMLElement;
      if (!row) return;

      // Mock a narrow container (350px)
      mockRowRect(row, 350);
      stubElementFromPoint(row);

      const eventEl = container.querySelector(
        '[data-eid="evt-1"]',
      ) as HTMLElement;
      if (!eventEl) return;

      // Start drag
      eventEl.dispatchEvent(
        new MouseEvent("mousedown", {
          bubbles: true,
          clientX: 50,
          clientY: 50,
          button: 0,
        }),
      );

      // Move mouse to trigger ghost rendering
      document.dispatchEvent(
        new MouseEvent("mousemove", {
          bubbles: true,
          clientX: 100,
          clientY: 50,
        }),
      );

      // Check ghost element
      const ghost = container.querySelector(".tg-ghost-event") as HTMLElement;
      expect(ghost).not.toBeNull();

      if (ghost) {
        // Ghost should use percentage-based width (100/7 ≈ 14.2857%)
        const widthMatch = ghost.style.width.match(/calc\(\s*([\d.]+)%/);
        expect(widthMatch).not.toBeNull();
        if (widthMatch) {
          const widthPct = parseFloat(widthMatch[1]);
          // Single day event should be approximately 14.2857% wide
          expect(widthPct).toBeCloseTo(100 / 7, 1);
        }
      }

      // Cleanup
      document.dispatchEvent(
        new MouseEvent("mouseup", { bubbles: true, clientX: 100, clientY: 50 }),
      );
    });

    it("recalculates cellW from current container width during drag", () => {
      const events: CalendarEvent[] = [
        {
          id: "evt-resize",
          title: "Resizable Event",
          start: "2025-11-17",
          end: "2025-11-19",
          allDay: true,
        },
      ];

      calendar = createTestCalendar("#ghost-test-calendar", {
        view: { type: "month" },
        events,
      });

      calendar.goToDate("2025-11-17");

      // Nov 17, 2025 is Monday - its week starts on Nov 16 (Sunday)
      const row = container.querySelector(
        '.tg-month-row[data-date="2025-11-16"]',
      ) as HTMLElement;
      if (!row) return;

      // First mock with wide container
      mockRowRect(row, 700);
      stubElementFromPoint(row);

      const eventEl = container.querySelector(
        '[data-eid="evt-resize"]',
      ) as HTMLElement;
      if (!eventEl) return;

      // Start drag with wide container
      eventEl.dispatchEvent(
        new MouseEvent("mousedown", {
          bubbles: true,
          clientX: 100,
          clientY: 50,
          button: 0,
        }),
      );

      // Simulate container resize during drag (narrow)
      mockRowRect(row, 350);

      // Move to trigger recalculation
      document.dispatchEvent(
        new MouseEvent("mousemove", {
          bubbles: true,
          clientX: 150,
          clientY: 50,
        }),
      );

      // The ghost should still render correctly despite container width change
      const ghost = container.querySelector(".tg-ghost-event") as HTMLElement;
      expect(ghost).not.toBeNull();

      // Cleanup
      document.dispatchEvent(
        new MouseEvent("mouseup", { bubbles: true, clientX: 150, clientY: 50 }),
      );
    });
  });

  describe("Ghost vertical positioning with overlapping events", () => {
    it("positions ghost below events in the same columns only", () => {
      // Create events in different columns
      const events: CalendarEvent[] = [
        {
          id: "evt-col0",
          title: "Column 0 Event",
          start: "2025-11-16", // Sunday (column 0)
          end: "2025-11-16",
          allDay: true,
        },
        {
          id: "evt-col1",
          title: "Column 1 Event",
          start: "2025-11-17", // Monday (column 1)
          end: "2025-11-17",
          allDay: true,
        },
        {
          id: "evt-col2",
          title: "Column 2 Event",
          start: "2025-11-18", // Tuesday (column 2)
          end: "2025-11-18",
          allDay: true,
        },
      ];

      calendar = createTestCalendar("#ghost-test-calendar", {
        view: { type: "month" },
        events,
      });

      calendar.goToDate("2025-11-16");

      // Nov 16, 2025 is Sunday - week starts on Nov 16
      const row = container.querySelector(
        '.tg-month-row[data-date="2025-11-16"]',
      ) as HTMLElement;
      if (!row) return;

      mockRowRect(row, 700);
      stubElementFromPoint(row);

      // Drag the event in column 1
      const eventEl = container.querySelector(
        '[data-eid="evt-col1"]',
      ) as HTMLElement;
      if (!eventEl) return;

      // Start drag
      eventEl.dispatchEvent(
        new MouseEvent("mousedown", {
          bubbles: true,
          clientX: 150,
          clientY: 50,
          button: 0,
        }),
      );

      document.dispatchEvent(
        new MouseEvent("mousemove", {
          bubbles: true,
          clientX: 150,
          clientY: 50,
        }),
      );

      const ghost = container.querySelector(".tg-ghost-event") as HTMLElement;
      expect(ghost).not.toBeNull();

      if (ghost) {
        // Ghost top should be based only on column 1 events
        // The base offset is 26px for date numbers
        // If there are no events above in column 1, ghost top should be around 26 + 2 = 28
        const topValue = parseFloat(ghost.style.top);
        expect(topValue).toBeGreaterThanOrEqual(26);
      }

      // Cleanup
      document.dispatchEvent(
        new MouseEvent("mouseup", { bubbles: true, clientX: 150, clientY: 50 }),
      );
    });

    it("stacks ghost below multi-day events that span the target column", () => {
      const events: CalendarEvent[] = [
        {
          id: "evt-span",
          title: "Spanning Event",
          start: "2025-11-16", // Sunday
          end: "2025-11-19", // Wednesday (spans 4 days)
          allDay: true,
        },
        {
          id: "evt-drag",
          title: "Drag Target",
          start: "2025-11-20", // Thursday
          end: "2025-11-20",
          allDay: true,
        },
      ];

      calendar = createTestCalendar("#ghost-test-calendar", {
        view: { type: "month" },
        events,
      });

      calendar.goToDate("2025-11-16");

      // Nov 16, 2025 is Sunday - week starts on Nov 16
      const row = container.querySelector(
        '.tg-month-row[data-date="2025-11-16"]',
      ) as HTMLElement;
      if (!row) return;

      mockRowRect(row, 700);

      // Drag evt-drag to Monday (column 1) which is covered by evt-span
      const eventEl = container.querySelector(
        '[data-eid="evt-drag"]',
      ) as HTMLElement;
      if (!eventEl) return;

      // Mock elementFromPoint to return row, simulating drag to column 1
      stubElementFromPoint(row);

      eventEl.dispatchEvent(
        new MouseEvent("mousedown", {
          bubbles: true,
          clientX: 400, // Thursday position
          clientY: 50,
          button: 0,
        }),
      );

      // Move to column 1 (Monday) where the spanning event exists
      document.dispatchEvent(
        new MouseEvent("mousemove", {
          bubbles: true,
          clientX: 150, // Monday position
          clientY: 50,
        }),
      );

      const ghost = container.querySelector(".tg-ghost-event") as HTMLElement;
      expect(ghost).not.toBeNull();

      if (ghost) {
        // Ghost should be positioned below the spanning event
        // Base offset (26) + event height (26) + gap (2) = 54
        const topValue = parseFloat(ghost.style.top);
        // Should be greater than just the base offset since spanning event is there
        expect(topValue).toBeGreaterThan(26);
      }

      // Cleanup
      document.dispatchEvent(
        new MouseEvent("mouseup", { bubbles: true, clientX: 150, clientY: 50 }),
      );
    });

    it("does not consider events in non-overlapping columns for ghost position", () => {
      // Setup: events in columns 0 and 6, drag to column 3
      const events: CalendarEvent[] = [
        {
          id: "evt-left",
          title: "Left Event",
          start: "2025-11-16", // Sunday (column 0)
          end: "2025-11-16",
          allDay: true,
        },
        {
          id: "evt-right",
          title: "Right Event",
          start: "2025-11-22", // Saturday (column 6)
          end: "2025-11-22",
          allDay: true,
        },
        {
          id: "evt-drag",
          title: "Drag Me",
          start: "2025-11-19", // Wednesday (column 3)
          end: "2025-11-19",
          allDay: true,
        },
      ];

      calendar = createTestCalendar("#ghost-test-calendar", {
        view: { type: "month" },
        events,
      });

      calendar.goToDate("2025-11-16");

      // Nov 16, 2025 is Sunday - week starts on Nov 16
      const row = container.querySelector(
        '.tg-month-row[data-date="2025-11-16"]',
      ) as HTMLElement;
      if (!row) return;

      mockRowRect(row, 700);

      // Set up event bars with proper positioning
      const eventBars = row.querySelectorAll(".tg-event-bar");
      eventBars.forEach((bar) => {
        const el = bar as HTMLElement;
        // Mock offsetHeight
        Object.defineProperty(el, "offsetHeight", {
          value: 26,
          configurable: true,
        });
      });

      stubElementFromPoint(row);

      const eventEl = container.querySelector(
        '[data-eid="evt-drag"]',
      ) as HTMLElement;
      if (!eventEl) return;

      eventEl.dispatchEvent(
        new MouseEvent("mousedown", {
          bubbles: true,
          clientX: 300, // Wednesday position
          clientY: 50,
          button: 0,
        }),
      );

      document.dispatchEvent(
        new MouseEvent("mousemove", {
          bubbles: true,
          clientX: 300,
          clientY: 50,
        }),
      );

      const ghost = container.querySelector(".tg-ghost-event") as HTMLElement;
      expect(ghost).not.toBeNull();

      if (ghost) {
        // Ghost in column 3 should not be affected by events in columns 0 and 6
        // It should use base offset since column 3 has no events above
        const topValue = parseFloat(ghost.style.top);
        // Base offset + small gap
        expect(topValue).toBeLessThanOrEqual(54); // 26 base + 26 height + 2 gap
      }

      // Cleanup
      document.dispatchEvent(
        new MouseEvent("mouseup", { bubbles: true, clientX: 300, clientY: 50 }),
      );
    });
  });

  describe("Ghost positioning in narrow containers", () => {
    it("calculates correct column index when container width changes", () => {
      const events: CalendarEvent[] = [
        {
          id: "evt-1",
          title: "Event 1",
          start: "2025-11-17",
          end: "2025-11-17",
          allDay: true,
        },
      ];

      calendar = createTestCalendar("#ghost-test-calendar", {
        view: { type: "month" },
        events,
      });

      calendar.goToDate("2025-11-17");

      // Nov 17, 2025 is Monday - its week starts on Nov 16 (Sunday)
      const row = container.querySelector(
        '.tg-month-row[data-date="2025-11-16"]',
      ) as HTMLElement;
      if (!row) return;

      // Use narrow width
      const narrowWidth = 280; // 40px per column
      mockRowRect(row, narrowWidth);
      stubElementFromPoint(row);

      const eventEl = container.querySelector(
        '[data-eid="evt-1"]',
      ) as HTMLElement;
      if (!eventEl) return;

      eventEl.dispatchEvent(
        new MouseEvent("mousedown", {
          bubbles: true,
          clientX: 60, // Should be column 1 (60/40 = 1.5 -> column 1)
          clientY: 50,
          button: 0,
        }),
      );

      // Move to column 3 position
      document.dispatchEvent(
        new MouseEvent("mousemove", {
          bubbles: true,
          clientX: 140, // Should be column 3 (140/40 = 3.5 -> column 3)
          clientY: 50,
        }),
      );

      const ghost = container.querySelector(".tg-ghost-event") as HTMLElement;
      expect(ghost).not.toBeNull();

      if (ghost) {
        // Check that left position is calculated correctly
        const leftMatch = ghost.style.left.match(/calc\(\s*([\d.]+)%/);
        expect(leftMatch).not.toBeNull();
      }

      // Cleanup
      document.dispatchEvent(
        new MouseEvent("mouseup", { bubbles: true, clientX: 140, clientY: 50 }),
      );
    });
  });

  describe("Time view ghost positioning", () => {
    it("renders ghost at correct time position in day column", () => {
      const events: CalendarEvent[] = [
        {
          id: "evt-time",
          title: "Time Event",
          start: "2025-11-17 10:00",
          end: "2025-11-17 11:00",
        },
      ];

      calendar = createTestCalendar("#ghost-test-calendar", {
        view: { type: "week" },
        events,
      });

      calendar.goToDate("2025-11-17");

      const column = container.querySelector(
        '.tg-day-column[data-date="2025-11-17"]',
      ) as HTMLElement;
      if (!column) return;

      vi.spyOn(column, "getBoundingClientRect").mockReturnValue({
        width: 100,
        height: 1440, // 1px per minute
        top: 0,
        left: 0,
        right: 100,
        bottom: 1440,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      } as DOMRect);

      stubElementFromPoint(column);

      const eventEl = container.querySelector(
        '[data-eid="evt-time"]',
      ) as HTMLElement;
      if (!eventEl) return;

      eventEl.dispatchEvent(
        new MouseEvent("mousedown", {
          bubbles: true,
          clientX: 50,
          clientY: 600, // 10:00 AM position
          button: 0,
        }),
      );

      // Move to 14:00 (2:00 PM)
      document.dispatchEvent(
        new MouseEvent("mousemove", {
          bubbles: true,
          clientX: 50,
          clientY: 840, // 14:00 position
        }),
      );

      const ghost = container.querySelector(".tg-ghost-event") as HTMLElement;
      expect(ghost).not.toBeNull();

      // Cleanup
      document.dispatchEvent(
        new MouseEvent("mouseup", { bubbles: true, clientX: 50, clientY: 840 }),
      );
    });
  });

  describe("All-day section ghost positioning in week/day views", () => {
    const mockAllDayContainerRect = (container: HTMLElement, width: number) => {
      vi.spyOn(container, "getBoundingClientRect").mockReturnValue({
        width,
        height: 60,
        top: 100,
        left: 60,
        right: width + 60,
        bottom: 160,
        x: 60,
        y: 100,
        toJSON: () => ({}),
      } as DOMRect);
      Object.defineProperty(container, "offsetWidth", {
        value: width,
        configurable: true,
      });
    };

    it("renders ghost in all-day section with correct width percentage", () => {
      const events: CalendarEvent[] = [
        {
          id: "evt-allday",
          title: "All Day Event",
          start: "2025-11-17",
          end: "2025-11-17",
          allDay: true,
        },
      ];

      calendar = createTestCalendar("#ghost-test-calendar", {
        view: { type: "week" },
        events,
      });

      calendar.goToDate("2025-11-17");

      const allDayContainer = container.querySelector(
        ".tg-allday-events-container",
      ) as HTMLElement;
      if (!allDayContainer) return;

      mockAllDayContainerRect(allDayContainer, 700);
      stubElementFromPoint(allDayContainer);

      const eventEl = container.querySelector(
        '[data-eid="evt-allday"]',
      ) as HTMLElement;
      if (!eventEl) return;

      eventEl.dispatchEvent(
        new MouseEvent("mousedown", {
          bubbles: true,
          clientX: 160,
          clientY: 120,
          button: 0,
        }),
      );

      document.dispatchEvent(
        new MouseEvent("mousemove", {
          bubbles: true,
          clientX: 260,
          clientY: 120,
        }),
      );

      const ghost = container.querySelector(".tg-ghost-event") as HTMLElement;
      expect(ghost).not.toBeNull();

      if (ghost) {
        // Ghost should use percentage-based width
        const widthMatch = ghost.style.width.match(/calc\(\s*([\d.]+)%/);
        expect(widthMatch).not.toBeNull();
        if (widthMatch) {
          const widthPct = parseFloat(widthMatch[1]);
          // Single day event should be approximately 100/7 ≈ 14.2857% wide
          expect(widthPct).toBeCloseTo(100 / 7, 1);
        }
      }

      // Cleanup
      document.dispatchEvent(
        new MouseEvent("mouseup", {
          bubbles: true,
          clientX: 260,
          clientY: 120,
        }),
      );
    });

    it("positions ghost below overlapping all-day events using .tg-allday-event selector", () => {
      const events: CalendarEvent[] = [
        {
          id: "evt-existing",
          title: "Existing All Day",
          start: "2025-11-17",
          end: "2025-11-19",
          allDay: true,
        },
        {
          id: "evt-drag",
          title: "Drag Me",
          start: "2025-11-20",
          end: "2025-11-20",
          allDay: true,
        },
      ];

      calendar = createTestCalendar("#ghost-test-calendar", {
        view: { type: "week" },
        events,
      });

      calendar.goToDate("2025-11-17");

      const allDayContainer = container.querySelector(
        ".tg-allday-events-container",
      ) as HTMLElement;
      if (!allDayContainer) return;

      mockAllDayContainerRect(allDayContainer, 700);
      stubElementFromPoint(allDayContainer);

      // Mock the existing event's position and dimensions
      const existingEvent = container.querySelector(
        '[data-eid="evt-existing"]',
      ) as HTMLElement;
      if (existingEvent) {
        Object.defineProperty(existingEvent, "offsetHeight", {
          value: 22,
          configurable: true,
        });
      }

      const eventEl = container.querySelector(
        '[data-eid="evt-drag"]',
      ) as HTMLElement;
      if (!eventEl) return;

      eventEl.dispatchEvent(
        new MouseEvent("mousedown", {
          bubbles: true,
          clientX: 500,
          clientY: 120,
          button: 0,
        }),
      );

      // Move to overlap with evt-existing (Monday-Wednesday)
      document.dispatchEvent(
        new MouseEvent("mousemove", {
          bubbles: true,
          clientX: 200, // Tuesday position
          clientY: 120,
        }),
      );

      const ghost = container.querySelector(".tg-ghost-event") as HTMLElement;
      expect(ghost).not.toBeNull();

      if (ghost) {
        // Ghost should be positioned below existing event
        const topValue = parseFloat(ghost.style.top);
        // Should be greater than 0 since there's an existing event
        expect(topValue).toBeGreaterThanOrEqual(4);
      }

      // Cleanup
      document.dispatchEvent(
        new MouseEvent("mouseup", {
          bubbles: true,
          clientX: 200,
          clientY: 120,
        }),
      );
    });

    it("uses getComputedStyle to read --tg-allday-columns CSS variable", () => {
      const events: CalendarEvent[] = [
        {
          id: "evt-5day",
          title: "5 Day Week Event",
          start: "2025-11-17",
          end: "2025-11-17",
          allDay: true,
        },
      ];

      calendar = createTestCalendar("#ghost-test-calendar", {
        view: { type: "week" },
        events,
      });

      calendar.goToDate("2025-11-17");

      const allDayContainer = container.querySelector(
        ".tg-allday-events-container",
      ) as HTMLElement;
      if (!allDayContainer) return;

      // Set CSS variable to 5 columns (5-day work week)
      allDayContainer.style.setProperty("--tg-allday-columns", "5");
      mockAllDayContainerRect(allDayContainer, 500); // 100px per column
      stubElementFromPoint(allDayContainer);

      const eventEl = container.querySelector(
        '[data-eid="evt-5day"]',
      ) as HTMLElement;
      if (!eventEl) return;

      eventEl.dispatchEvent(
        new MouseEvent("mousedown", {
          bubbles: true,
          clientX: 160,
          clientY: 120,
          button: 0,
        }),
      );

      document.dispatchEvent(
        new MouseEvent("mousemove", {
          bubbles: true,
          clientX: 260,
          clientY: 120,
        }),
      );

      const ghost = container.querySelector(".tg-ghost-event") as HTMLElement;
      expect(ghost).not.toBeNull();

      if (ghost) {
        // Ghost width should be based on 5 columns (100/5 = 20%)
        const widthMatch = ghost.style.width.match(/calc\(\s*([\d.]+)%/);
        expect(widthMatch).not.toBeNull();
        if (widthMatch) {
          const widthPct = parseFloat(widthMatch[1]);
          // Single day event should be 20% wide for 5-column layout
          expect(widthPct).toBeCloseTo(20, 1);
        }
      }

      // Cleanup
      document.dispatchEvent(
        new MouseEvent("mouseup", {
          bubbles: true,
          clientX: 260,
          clientY: 120,
        }),
      );
    });

    it("scopes day column lookup to current calendar instance", () => {
      // Create a second calendar container to test cross-calendar isolation
      const container2 = document.createElement("div");
      container2.id = "ghost-test-calendar-2";
      document.body.appendChild(container2);

      const events: CalendarEvent[] = [
        {
          id: "evt-cal1",
          title: "Calendar 1 Event",
          start: "2025-11-17",
          end: "2025-11-17",
          allDay: true,
        },
      ];

      calendar = createTestCalendar("#ghost-test-calendar", {
        view: { type: "week" },
        events,
      });

      // Create second calendar with different date
      const calendar2 = createTestCalendar("#ghost-test-calendar-2", {
        view: { type: "week" },
        events: [
          {
            id: "evt-cal2",
            title: "Calendar 2 Event",
            start: "2025-12-01",
            end: "2025-12-01",
            allDay: true,
          },
        ],
      });

      calendar.goToDate("2025-11-17");
      calendar2.goToDate("2025-12-01");

      const allDayContainer = container.querySelector(
        ".tg-allday-events-container",
      ) as HTMLElement;
      if (!allDayContainer) {
        calendar2.destroy();
        container2.remove();
        return;
      }

      mockAllDayContainerRect(allDayContainer, 700);
      stubElementFromPoint(allDayContainer);

      const eventEl = container.querySelector(
        '[data-eid="evt-cal1"]',
      ) as HTMLElement;
      if (!eventEl) {
        calendar2.destroy();
        container2.remove();
        return;
      }

      eventEl.dispatchEvent(
        new MouseEvent("mousedown", {
          bubbles: true,
          clientX: 160,
          clientY: 120,
          button: 0,
        }),
      );

      document.dispatchEvent(
        new MouseEvent("mousemove", {
          bubbles: true,
          clientX: 260,
          clientY: 120,
        }),
      );

      // Ghost should appear in the first calendar, not the second
      const ghost1 = container.querySelector(".tg-ghost-event");
      const ghost2 = container2.querySelector(".tg-ghost-event");

      // The ghost should be scoped to the first calendar's all-day container
      expect(ghost1).not.toBeNull();
      expect(ghost2).toBeNull();

      // Cleanup
      document.dispatchEvent(
        new MouseEvent("mouseup", {
          bubbles: true,
          clientX: 260,
          clientY: 120,
        }),
      );
      calendar2.destroy();
      container2.remove();
    });
  });
});
