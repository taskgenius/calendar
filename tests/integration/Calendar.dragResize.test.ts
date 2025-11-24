import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { Calendar } from "../../src/core/Calendar";
import type { CalendarEvent } from "../../src/types";

describe("Calendar drag vs resize callbacks", () => {
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

  it("calls onEventDrop for move operations and updates event time range", () => {
    const events: CalendarEvent[] = [
      {
        id: "evt-move",
        title: "Move Me",
        start: "2025-11-20 10:00",
        end: "2025-11-20 11:00",
      },
    ];

    const onDrop = vi.fn();
    const onResize = vi.fn();

    calendar = new Calendar("#test-calendar", {
      events,
      onEventDrop: onDrop,
      onEventResize: onResize,
    });

    const dragController = (calendar as any).dragController as any;
    const adapter = (calendar as any).adapter as any;

    const newStart = adapter.parse("2025-11-21 09:00");
    const newEnd = adapter.parse("2025-11-21 10:30");

    dragController.state = {
      type: "month",
      mode: "move",
      event: events[0],
      startX: 0,
      startY: 0,
      startDate: adapter.parse(events[0].start),
      endDate: adapter.parse(events[0].end),
      tentativeStart: newStart,
      tentativeEnd: newEnd,
      renderCallback: vi.fn(),
    };

    (dragController as any).onUp(new MouseEvent("mouseup"));

    expect(onDrop).toHaveBeenCalledTimes(1);
    expect(onResize).not.toHaveBeenCalled();

    const [, dropStart, dropEnd] = onDrop.mock.calls[0];
    expect(dropStart.getFullYear()).toBe(2025);
    expect(dropStart.getHours()).toBe(9);
    expect(dropEnd.getHours()).toBe(10);

    const updated = calendar.getEvents().find((evt) => evt.id === "evt-move");
    expect(updated?.start).toBe("2025-11-21 09:00");
    expect(updated?.end).toBe("2025-11-21 10:30");
  });

  it("calls onEventResize for resize operations and updates event time range", () => {
    const events: CalendarEvent[] = [
      {
        id: "evt-resize",
        title: "Resize Me",
        start: "2025-11-22 08:00",
        end: "2025-11-22 09:00",
      },
    ];

    const onDrop = vi.fn();
    const onResize = vi.fn();

    calendar = new Calendar("#test-calendar", {
      events,
      onEventDrop: onDrop,
      onEventResize: onResize,
    });

    const dragController = (calendar as any).dragController as any;
    const adapter = (calendar as any).adapter as any;

    const newStart = adapter.parse("2025-11-22 08:00");
    const newEnd = adapter.parse("2025-11-22 10:15");

    dragController.state = {
      type: "time",
      mode: "resize-bottom",
      event: events[0],
      startX: 0,
      startY: 0,
      startDate: adapter.parse(events[0].start),
      endDate: adapter.parse(events[0].end),
      tentativeStart: newStart,
      tentativeEnd: newEnd,
      renderCallback: vi.fn(),
    };

    (dragController as any).onUp(new MouseEvent("mouseup"));

    expect(onResize).toHaveBeenCalledTimes(1);
    expect(onDrop).not.toHaveBeenCalled();

    const [, resizeStart, resizeEnd] = onResize.mock.calls[0];
    expect(resizeStart.getMinutes()).toBe(0);
    expect(resizeEnd.getHours()).toBe(10);
    expect(resizeEnd.getMinutes()).toBe(15);

    const updated = calendar.getEvents().find((evt) => evt.id === "evt-resize");
    expect(updated?.start).toBe("2025-11-22 08:00");
    expect(updated?.end).toBe("2025-11-22 10:15");
  });
});

describe("Calendar drag vs resize (DOM-driven)", () => {
  let container: HTMLDivElement;
  let calendar: Calendar;
  const originalElementFromPoint = (document as any).elementFromPoint;

  beforeEach(() => {
    container = document.createElement("div");
    container.id = "drag-dom-calendar";
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
      // Cleanup our stub when JSDOM does not provide elementFromPoint
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

  it("fires onEventDrop when dragging an event block (time view)", () => {
    const events: CalendarEvent[] = [
      {
        id: "dom-move",
        title: "Move DOM",
        start: "2025-11-20 10:00",
        end: "2025-11-20 11:00",
      },
    ];

    const onDrop = vi.fn();
    const onResize = vi.fn();

    calendar = new Calendar("#drag-dom-calendar", {
      view: { type: "week" },
      events,
      onEventDrop: onDrop,
      onEventResize: onResize,
    });

    calendar.goToDate("2025-11-20");

    const eventEl = container.querySelector(
      '[data-eid="dom-move"]',
    ) as HTMLElement;
    const column = container.querySelector(
      '.tg-day-column[data-date="2025-11-20"]',
    ) as HTMLElement;

    // JSDOM does not provide layout; stub geometry and hit-testing.
    vi.spyOn(column, "getBoundingClientRect").mockReturnValue({
      width: 200,
      height: 1200,
      top: 0,
      left: 0,
      right: 200,
      bottom: 1200,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    } as DOMRect);
    stubElementFromPoint(column);

    eventEl.dispatchEvent(
      new MouseEvent("mousedown", {
        bubbles: true,
        clientX: 10,
        clientY: 10,
        button: 0,
      }),
    );
    document.dispatchEvent(
      new MouseEvent("mousemove", { bubbles: true, clientX: 10, clientY: 660 }),
    );
    document.dispatchEvent(
      new MouseEvent("mouseup", { bubbles: true, clientX: 10, clientY: 660 }),
    );

    expect(onDrop).toHaveBeenCalledTimes(1);
    expect(onResize).not.toHaveBeenCalled();

    const updated = calendar.getEvents().find((evt) => evt.id === "dom-move");
    expect(updated?.start).toBe("2025-11-20 11:00");
    expect(updated?.end).toBe("2025-11-20 12:00");
  });

  it("fires onEventResize when dragging resize handle (time view)", () => {
    const events: CalendarEvent[] = [
      {
        id: "dom-resize",
        title: "Resize DOM",
        start: "2025-11-22 08:00",
        end: "2025-11-22 09:00",
      },
    ];

    const onDrop = vi.fn();
    const onResize = vi.fn();

    calendar = new Calendar("#drag-dom-calendar", {
      view: { type: "week" },
      events,
      onEventDrop: onDrop,
      onEventResize: onResize,
    });

    calendar.goToDate("2025-11-22");

    const eventEl = container.querySelector(
      '[data-eid="dom-resize"]',
    ) as HTMLElement;
    const bottomHandle = eventEl.querySelector(".tg-bottom") as HTMLElement;
    const column = container.querySelector(
      '.tg-day-column[data-date="2025-11-22"]',
    ) as HTMLElement;

    vi.spyOn(column, "getBoundingClientRect").mockReturnValue({
      width: 200,
      height: 1200,
      top: 0,
      left: 0,
      right: 200,
      bottom: 1200,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    } as DOMRect);
    stubElementFromPoint(column);

    bottomHandle.dispatchEvent(
      new MouseEvent("mousedown", {
        bubbles: true,
        clientX: 20,
        clientY: 20,
        button: 0,
      }),
    );
    document.dispatchEvent(
      new MouseEvent("mousemove", { bubbles: true, clientX: 20, clientY: 600 }),
    );
    document.dispatchEvent(
      new MouseEvent("mouseup", { bubbles: true, clientX: 20, clientY: 600 }),
    );

    expect(onResize).toHaveBeenCalledTimes(1);
    expect(onDrop).not.toHaveBeenCalled();

    const updated = calendar.getEvents().find((evt) => evt.id === "dom-resize");
    expect(updated?.start).toBe("2025-11-22 08:00");
    expect(updated?.end).toBe("2025-11-22 10:00");
  });
});
