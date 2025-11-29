import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { Calendar } from "../../src/core/Calendar";
import type { CalendarEvent } from "../../src/types";
import { createTestCalendar } from "../helpers/createTestCalendar";

/**
 * Tests for multi-day event drag behavior
 *
 * Bug context: When dragging a multi-day event in month view, the event's duration
 * was not preserved because clickOffsetDays was calculated but not used.
 *
 * Expected behavior:
 * - When user clicks on day 2 of a 3-day event and drags to a new position,
 *   the event should maintain its 3-day duration
 * - The new start date should account for where the user clicked (clickOffsetDays)
 */
describe("Multi-day event drag preserves duration", () => {
  let container: HTMLDivElement;
  let calendar: Calendar;

  beforeEach(() => {
    container = document.createElement("div");
    container.id = "test-calendar";
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (calendar) {
      calendar.destroy();
    }
    container.remove();
  });

  it("preserves multi-day event duration when dragged (clickOffsetDays = 0)", () => {
    // 3-day event: Nov 18-20
    const events: CalendarEvent[] = [
      {
        id: "multi-day-1",
        title: "3-Day Event",
        start: "2025-11-18 00:00",
        end: "2025-11-20 00:00",
      },
    ];

    const onDrop = vi.fn();

    calendar = createTestCalendar("#test-calendar", {
      view: { type: "month" },
      events,
      onEventDrop: onDrop,
    });

    const dragController = (calendar as any).dragController as any;
    const adapter = (calendar as any).adapter as any;

    // Simulate dragging from the first day (clickOffsetDays = 0) to Nov 25
    const originalStart = adapter.parse("2025-11-18 00:00");
    const originalEnd = adapter.parse("2025-11-20 00:00");
    const hoverDate = adapter.parse("2025-11-25 00:00");

    // Expected: event moves to Nov 25-27 (maintains 2-day span)
    const expectedStart = adapter.parse("2025-11-25 00:00");
    const expectedEnd = adapter.parse("2025-11-27 00:00");

    dragController.state = {
      type: "month",
      mode: "move",
      event: events[0],
      startX: 0,
      startY: 0,
      startDate: originalStart,
      endDate: originalEnd,
      clickOffsetDays: 0, // User clicked on the first day
      tentativeStart: expectedStart,
      tentativeEnd: expectedEnd,
      renderCallback: vi.fn(),
    };

    (dragController as any).onUp(new MouseEvent("mouseup"));

    expect(onDrop).toHaveBeenCalledTimes(1);

    const updated = calendar.getEvents().find((e) => e.id === "multi-day-1");
    expect(updated?.start).toBe("2025-11-25 00:00");
    expect(updated?.end).toBe("2025-11-27 00:00");
  });

  it("preserves multi-day event duration when clicked in the middle (clickOffsetDays > 0)", () => {
    // 3-day event: Nov 18-20
    const events: CalendarEvent[] = [
      {
        id: "multi-day-2",
        title: "3-Day Event",
        start: "2025-11-18 00:00",
        end: "2025-11-20 00:00",
      },
    ];

    const onDrop = vi.fn();

    calendar = createTestCalendar("#test-calendar", {
      view: { type: "month" },
      events,
      onEventDrop: onDrop,
    });

    const dragController = (calendar as any).dragController as any;
    const adapter = (calendar as any).adapter as any;

    // User clicked on the second day (Nov 19), clickOffsetDays = 1
    // Then dragged to Nov 26
    // Expected: new start = Nov 26 - 1 = Nov 25, new end = Nov 25 + 2 = Nov 27
    const originalStart = adapter.parse("2025-11-18 00:00");
    const originalEnd = adapter.parse("2025-11-20 00:00");

    // The tentative dates should account for clickOffsetDays
    // hoverDate = Nov 26, clickOffsetDays = 1
    // adjustedStart = Nov 26 - 1 = Nov 25
    // adjustedEnd = Nov 25 + 2 days = Nov 27
    const expectedStart = adapter.parse("2025-11-25 00:00");
    const expectedEnd = adapter.parse("2025-11-27 00:00");

    dragController.state = {
      type: "month",
      mode: "move",
      event: events[0],
      startX: 0,
      startY: 0,
      startDate: originalStart,
      endDate: originalEnd,
      clickOffsetDays: 1, // User clicked on the second day
      tentativeStart: expectedStart,
      tentativeEnd: expectedEnd,
      renderCallback: vi.fn(),
    };

    (dragController as any).onUp(new MouseEvent("mouseup"));

    expect(onDrop).toHaveBeenCalledTimes(1);

    const updated = calendar.getEvents().find((e) => e.id === "multi-day-2");
    expect(updated?.start).toBe("2025-11-25 00:00");
    expect(updated?.end).toBe("2025-11-27 00:00");
  });

  it("preserves time components for timed multi-day events", () => {
    // Timed multi-day event: Nov 18 10:00 - Nov 20 14:00
    const events: CalendarEvent[] = [
      {
        id: "timed-multi-day",
        title: "Conference",
        start: "2025-11-18 10:00",
        end: "2025-11-20 14:00",
      },
    ];

    const onDrop = vi.fn();

    calendar = createTestCalendar("#test-calendar", {
      view: { type: "month" },
      events,
      onEventDrop: onDrop,
    });

    const dragController = (calendar as any).dragController as any;
    const adapter = (calendar as any).adapter as any;

    const originalStart = adapter.parse("2025-11-18 10:00");
    const originalEnd = adapter.parse("2025-11-20 14:00");

    // Expected: times should be preserved when dragging
    const expectedStart = adapter.parse("2025-11-25 10:00");
    const expectedEnd = adapter.parse("2025-11-27 14:00");

    dragController.state = {
      type: "month",
      mode: "move",
      event: events[0],
      startX: 0,
      startY: 0,
      startDate: originalStart,
      endDate: originalEnd,
      clickOffsetDays: 0,
      tentativeStart: expectedStart,
      tentativeEnd: expectedEnd,
      renderCallback: vi.fn(),
    };

    (dragController as any).onUp(new MouseEvent("mouseup"));

    const updated = calendar
      .getEvents()
      .find((e) => e.id === "timed-multi-day");
    expect(updated?.start).toBe("2025-11-25 10:00");
    expect(updated?.end).toBe("2025-11-27 14:00");
  });
});

describe("Multi-day event drag with handleMonthMove", () => {
  let container: HTMLDivElement;
  let calendar: Calendar;
  const originalElementFromPoint = (document as any).elementFromPoint;

  beforeEach(() => {
    container = document.createElement("div");
    container.id = "multi-day-drag-calendar";
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

  it("handleMonthMove correctly uses clickOffsetDays for multi-day events", () => {
    // 3-day all-day event: Mon-Wed (Nov 17-19, 2025 - Mon is Nov 17)
    const events: CalendarEvent[] = [
      {
        id: "multi-day-dom",
        title: "Multi-Day Event",
        start: "2025-11-17 00:00",
        end: "2025-11-19 00:00",
      },
    ];

    const onDrop = vi.fn();

    calendar = createTestCalendar("#multi-day-drag-calendar", {
      view: { type: "month" },
      events,
      onEventDrop: onDrop,
      draggable: { enabled: true },
    });

    calendar.goToDate("2025-11-17");

    // Find the event element
    const eventEl = container.querySelector(
      '[data-eid="multi-day-dom"]',
    ) as HTMLElement;
    if (!eventEl) {
      throw new Error("Event element not found");
    }

    // Get the month row containing the event
    const monthRow = eventEl.closest(".tg-month-row") as HTMLElement | null;
    if (!monthRow) {
      throw new Error("Month row not found");
    }

    // Mock the row's getBoundingClientRect
    vi.spyOn(monthRow, "getBoundingClientRect").mockReturnValue({
      width: 700, // 100px per day
      height: 100,
      top: 0,
      left: 0,
      right: 700,
      bottom: 100,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    } as DOMRect);
    Object.defineProperty(monthRow, "offsetWidth", {
      value: 700,
      configurable: true,
    });

    // Mock event element's getBoundingClientRect (starts at day 1, spans 3 days)
    vi.spyOn(eventEl, "getBoundingClientRect").mockReturnValue({
      width: 300, // 3 days * 100px
      height: 26,
      top: 30,
      left: 100, // Starts at day 1 (Monday)
      right: 400,
      bottom: 56,
      x: 100,
      y: 30,
      toJSON: () => ({}),
    } as DOMRect);

    stubElementFromPoint(monthRow);

    // Set the row's data-date to the start of the week (Sunday Nov 16)
    monthRow.dataset["date"] = "2025-11-16";

    // Simulate clicking on Tuesday (day 2 of the event, clickOffsetDays should be 1)
    // Event starts Mon Nov 17, clicking on Tue Nov 18 means offset = 1
    // Click at x=200 (within the event bar, day 2 position relative to event start)
    const clickX = 200; // Middle of the 3-day event
    const cellWidth = 100;
    const eventLeft = 100; // Event starts at Monday (day 1)
    const clickOffsetInEvent = clickX - eventLeft; // 100px into the event
    const expectedClickOffsetDays = Math.floor(clickOffsetInEvent / cellWidth); // 1

    eventEl.dispatchEvent(
      new MouseEvent("mousedown", {
        bubbles: true,
        clientX: clickX,
        clientY: 40,
        button: 0,
      }),
    );

    // Verify that clickOffsetDays was calculated correctly
    const dragController = (calendar as any).dragController as any;
    expect(dragController.state).not.toBeNull();
    expect(dragController.state.cellW).toBeCloseTo(100);
    expect(dragController.state.clickOffsetDays).toBe(expectedClickOffsetDays);

    // Clean up - trigger mouseup to end drag
    document.dispatchEvent(
      new MouseEvent("mouseup", {
        bubbles: true,
        clientX: clickX,
        clientY: 40,
      }),
    );
  });

  it("maintains event duration when dragging multi-day event across rows", () => {
    // 3-day event: Nov 17-19 (Mon-Wed)
    const events: CalendarEvent[] = [
      {
        id: "cross-row-event",
        title: "Cross Row Event",
        start: "2025-11-17 00:00",
        end: "2025-11-19 00:00",
      },
    ];

    const onDrop = vi.fn();

    calendar = createTestCalendar("#multi-day-drag-calendar", {
      view: { type: "month" },
      events,
      onEventDrop: onDrop,
      draggable: { enabled: true },
    });

    calendar.goToDate("2025-11-17");

    const eventEl = container.querySelector(
      '[data-eid="cross-row-event"]',
    ) as HTMLElement;
    if (!eventEl) {
      throw new Error("Event element not found");
    }

    const sourceRow = eventEl.closest(".tg-month-row") as HTMLElement | null;
    if (!sourceRow) {
      throw new Error("Source row not found");
    }

    const dragController = (calendar as any).dragController as any;
    const adapter = (calendar as any).adapter as any;

    vi.spyOn(sourceRow, "getBoundingClientRect").mockReturnValue({
      width: 700,
      height: 100,
      top: 0,
      left: 0,
      right: 700,
      bottom: 100,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    } as DOMRect);
    Object.defineProperty(sourceRow, "offsetWidth", {
      value: 700,
      configurable: true,
    });

    vi.spyOn(eventEl, "getBoundingClientRect").mockReturnValue({
      width: 300,
      height: 26,
      top: 30,
      left: 100, // Starts at Monday column
      right: 400,
      bottom: 56,
      x: 100,
      y: 30,
      toJSON: () => ({}),
    } as DOMRect);

    const clickX = 200; // Click on second day of the bar
    eventEl.dispatchEvent(
      new MouseEvent("mousedown", {
        bubbles: true,
        clientX: clickX,
        clientY: 40,
        button: 0,
      }),
    );

    // Expected result after drag: event should move to Nov 27-29 (Thu-Sat)
    // Because hoverDate=Nov 28, clickOffsetDays=1

    // Create a mock month row for the target week
    const targetRow = document.createElement("div");
    targetRow.className = "tg-month-row";
    targetRow.dataset["date"] = "2025-11-23"; // Week starting Sunday Nov 23
    container.appendChild(targetRow);

    vi.spyOn(targetRow, "getBoundingClientRect").mockReturnValue({
      width: 700,
      height: 100,
      top: 100,
      left: 0,
      right: 700,
      bottom: 200,
      x: 0,
      y: 100,
      toJSON: () => ({}),
    } as DOMRect);
    Object.defineProperty(targetRow, "offsetWidth", {
      value: 700,
      configurable: true,
    });

    stubElementFromPoint(targetRow);

    // Simulate mouse move to Friday Nov 28 (column index 5 from Sunday)
    // Friday Nov 28 is at x position = 5 * 100 = 500
    document.dispatchEvent(
      new MouseEvent("mousemove", {
        bubbles: true,
        clientX: 550, // Middle of Friday column
        clientY: 150,
      }),
    );

    // Check tentative dates
    expect(dragController.state.tentativeStart).toBeDefined();
    expect(dragController.state.tentativeEnd).toBeDefined();

    // The tentative start should be Nov 27 (hoverDate Nov 28 - clickOffsetDays 1)
    const tentativeStartStr = adapter.format(
      dragController.state.tentativeStart,
      "yyyy-MM-dd",
    );
    const tentativeEndStr = adapter.format(
      dragController.state.tentativeEnd,
      "yyyy-MM-dd",
    );

    expect(tentativeStartStr).toBe("2025-11-27");
    expect(tentativeEndStr).toBe("2025-11-29");

    // Complete the drag
    document.dispatchEvent(
      new MouseEvent("mouseup", { bubbles: true, clientX: 550, clientY: 150 }),
    );

    expect(onDrop).toHaveBeenCalledTimes(1);

    // Verify final event dates
    const updated = calendar
      .getEvents()
      .find((e) => e.id === "cross-row-event");
    expect(updated?.start).toBe("2025-11-27 00:00");
    expect(updated?.end).toBe("2025-11-29 00:00");
  });
});

describe("Cross-midnight event drag behavior", () => {
  let container: HTMLDivElement;
  let calendar: Calendar;

  beforeEach(() => {
    container = document.createElement("div");
    container.id = "test-calendar";
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (calendar) {
      calendar.destroy();
    }
    container.remove();
  });

  it("preserves cross-midnight event times when dragged", () => {
    // Cross-midnight event: Nov 18 22:00 - Nov 19 02:00
    const events: CalendarEvent[] = [
      {
        id: "cross-midnight",
        title: "Late Night Coding",
        start: "2025-11-18 22:00",
        end: "2025-11-19 02:00",
      },
    ];

    const onDrop = vi.fn();

    calendar = createTestCalendar("#test-calendar", {
      view: { type: "month" },
      events,
      onEventDrop: onDrop,
    });

    const dragController = (calendar as any).dragController as any;
    const adapter = (calendar as any).adapter as any;

    const originalStart = adapter.parse("2025-11-18 22:00");
    const originalEnd = adapter.parse("2025-11-19 02:00");

    // Drag to Nov 25, should become Nov 25 22:00 - Nov 26 02:00
    const expectedStart = adapter.parse("2025-11-25 22:00");
    const expectedEnd = adapter.parse("2025-11-26 02:00");

    dragController.state = {
      type: "month",
      mode: "move",
      event: events[0],
      startX: 0,
      startY: 0,
      startDate: originalStart,
      endDate: originalEnd,
      clickOffsetDays: 0,
      tentativeStart: expectedStart,
      tentativeEnd: expectedEnd,
      renderCallback: vi.fn(),
    };

    (dragController as any).onUp(new MouseEvent("mouseup"));

    const updated = calendar.getEvents().find((e) => e.id === "cross-midnight");
    expect(updated?.start).toBe("2025-11-25 22:00");
    expect(updated?.end).toBe("2025-11-26 02:00");
  });
});
