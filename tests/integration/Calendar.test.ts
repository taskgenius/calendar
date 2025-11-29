import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { Calendar } from "../../src/core/Calendar";
import type { CalendarEvent } from "../../src/types";
import { createTestCalendar } from "../helpers/createTestCalendar";

describe("Calendar Integration", () => {
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

  describe("initialization", () => {
    it("should create calendar with default config", () => {
      calendar = createTestCalendar("#test-calendar");

      expect(container.querySelector(".tg-calendar")).toBeTruthy();
      expect(calendar.getView()).toBe("week");
    });

    it("should create calendar with HTMLElement", () => {
      calendar = createTestCalendar(container);

      expect(container.querySelector(".tg-calendar")).toBeTruthy();
    });

    it("should throw error for invalid selector", () => {
      expect(() => createTestCalendar("#non-existent")).toThrow(
        "Calendar container not found",
      );
    });

    it("should initialize with custom view", () => {
      calendar = createTestCalendar("#test-calendar", {
        view: { type: "month" },
      });

      expect(calendar.getView()).toBe("month");
    });

    it("should initialize with events", () => {
      const events: CalendarEvent[] = [
        {
          id: "1",
          title: "Test",
          start: "2025-11-20 10:00",
          end: "2025-11-20 11:00",
        },
      ];

      calendar = createTestCalendar("#test-calendar", { events });

      expect(calendar.getEvents()).toHaveLength(1);
    });
  });

  describe("view switching", () => {
    beforeEach(() => {
      calendar = createTestCalendar("#test-calendar");
    });

    it("should switch to month view", () => {
      calendar.setView("month");

      expect(calendar.getView()).toBe("month");
      expect(container.querySelector(".tg-month-row")).toBeTruthy();
    });

    it("should switch to week view", () => {
      calendar.setView("month");
      calendar.setView("week");

      expect(calendar.getView()).toBe("week");
      expect(container.querySelector(".tg-time-grid-container")).toBeTruthy();
    });

    it("should switch to day view", () => {
      calendar.setView("day");

      expect(calendar.getView()).toBe("day");
      expect(container.querySelector(".tg-day-column")).toBeTruthy();
    });

    it("should call onViewChange callback", () => {
      let viewChanged: string | undefined;

      calendar = createTestCalendar("#test-calendar", {
        onViewChange: (view) => {
          viewChanged = view;
        },
      });

      calendar.setView("month");
      expect(viewChanged).toBe("month");
    });
  });

  describe("navigation", () => {
    beforeEach(() => {
      calendar = createTestCalendar("#test-calendar");
    });

    it("should navigate to next period", () => {
      const initialDate = calendar.getCurrentDate();
      calendar.next();

      expect(calendar.getCurrentDate()).not.toBe(initialDate);
    });

    it("should navigate to previous period", () => {
      const initialDate = calendar.getCurrentDate();
      calendar.prev();

      expect(calendar.getCurrentDate()).not.toBe(initialDate);
    });

    it("should navigate to today", () => {
      calendar.next();
      calendar.next();
      calendar.today();

      const today = new Date().toISOString().split("T")[0];
      expect(calendar.getCurrentDate()).toBe(today);
    });

    it("should navigate to specific date", () => {
      calendar.goToDate("2025-12-25");
      expect(calendar.getCurrentDate()).toBe("2025-12-25");
    });

    it("should call onDateChange callback", () => {
      let dateChanged: Date | undefined;

      calendar = createTestCalendar("#test-calendar", {
        onDateChange: (date) => {
          dateChanged = date;
        },
      });

      calendar.next();
      expect(dateChanged).toBeDefined();
    });
  });

  describe("event management", () => {
    beforeEach(() => {
      calendar = createTestCalendar("#test-calendar");
    });

    it("should add event", () => {
      const event: CalendarEvent = {
        id: "1",
        title: "New Event",
        start: "2025-11-20 10:00",
        end: "2025-11-20 11:00",
      };

      calendar.addEvent(event);

      expect(calendar.getEvents()).toHaveLength(1);
      expect(calendar.getEvents()[0]?.title).toBe("New Event");
    });

    it("should remove event", () => {
      calendar.addEvent({
        id: "1",
        title: "To Remove",
        start: "2025-11-20 10:00",
        end: "2025-11-20 11:00",
      });

      calendar.removeEvent("1");

      expect(calendar.getEvents()).toHaveLength(0);
    });

    it("should update event", () => {
      calendar.addEvent({
        id: "1",
        title: "Original",
        start: "2025-11-20 10:00",
        end: "2025-11-20 11:00",
      });

      calendar.updateEvent("1", { title: "Updated" });

      expect(calendar.getEvents()[0]?.title).toBe("Updated");
    });

    it("should set all events", () => {
      calendar.addEvent({
        id: "1",
        title: "Old",
        start: "2025-11-20 10:00",
        end: "2025-11-20 11:00",
      });

      const newEvents = [
        {
          id: "2",
          title: "New 1",
          start: "2025-11-21 10:00",
          end: "2025-11-21 11:00",
        },
        {
          id: "3",
          title: "New 2",
          start: "2025-11-22 10:00",
          end: "2025-11-22 11:00",
        },
      ];

      calendar.setEvents(newEvents);

      expect(calendar.getEvents()).toHaveLength(2);
    });
  });

  describe("rendering", () => {
    it("should render header with title", () => {
      calendar = createTestCalendar("#test-calendar");

      const title = container.querySelector(".tg-title");
      expect(title).toBeTruthy();
      expect(title?.textContent).toBeTruthy();
    });

    it("should render view switch buttons", () => {
      calendar = createTestCalendar("#test-calendar");

      const buttons = container.querySelectorAll(".tg-view-btn");
      expect(buttons).toHaveLength(3);
    });

    it("should render navigation buttons", () => {
      calendar = createTestCalendar("#test-calendar");

      const navButtons = container.querySelectorAll(".tg-nav-btn");
      expect(navButtons).toHaveLength(3);
    });

    it("should re-render on refresh", () => {
      calendar = createTestCalendar("#test-calendar");

      const initialHTML = container.innerHTML;
      calendar.refresh();

      // Should have re-rendered (same structure but different instance)
      expect(container.querySelector(".tg-calendar")).toBeTruthy();
    });

    it("should render header with default format for month view", () => {
      calendar = createTestCalendar("#test-calendar", {
        view: { type: "month" },
      });
      calendar.goToDate("2025-11-20");

      const title = container.querySelector(".tg-title");
      expect(title?.textContent).toContain("2025年");
      expect(title?.textContent).toContain("11月");
    });

    it("should render header with default format for day view", () => {
      calendar = createTestCalendar("#test-calendar", {
        view: { type: "day" },
      });
      calendar.goToDate("2025-11-20");

      const title = container.querySelector(".tg-title");
      expect(title?.textContent).toContain("2025年");
      expect(title?.textContent).toContain("11月");
      expect(title?.textContent).toContain("20日");
    });

    it("should render header with custom format", () => {
      calendar = createTestCalendar("#test-calendar", {
        view: { type: "month" },
        headerFormat: {
          month: "YYYY-MM",
        },
      });
      calendar.goToDate("2025-11-20");

      const title = container.querySelector(".tg-title");
      expect(title?.textContent).toBe("2025-11");
    });

    it("should use different formats for different views", () => {
      calendar = createTestCalendar("#test-calendar", {
        view: { type: "month" },
        headerFormat: {
          month: "YYYY-MM",
          day: "YYYY-MM-DD",
        },
      });
      calendar.goToDate("2025-11-20");

      let title = container.querySelector(".tg-title");
      expect(title?.textContent).toBe("2025-11");

      calendar.setView("day");
      title = container.querySelector(".tg-title");
      expect(title?.textContent).toBe("2025-11-20");
    });
  });

  describe("cleanup", () => {
    it("should destroy calendar properly", () => {
      calendar = createTestCalendar("#test-calendar");
      calendar.destroy();

      expect(container.innerHTML).toBe("");
      expect(document.getElementById("taskgenius-calendar-styles")).toBeNull();
    });
  });

  describe("event callbacks", () => {
    it("should call onEventClick when event is clicked", () => {
      let clickedEvent: CalendarEvent | undefined;

      calendar = createTestCalendar("#test-calendar", {
        view: { type: "week" },
        events: [
          {
            id: "1",
            title: "Clickable",
            start: "2025-11-20 10:00",
            end: "2025-11-20 11:00",
          },
        ],
        onEventClick: (event) => {
          clickedEvent = event;
        },
      });

      // Navigate to the correct date to ensure event is visible
      calendar.goToDate("2025-11-20");

      // Find and click the event
      const eventEl = container.querySelector('[data-eid="1"]');
      if (eventEl) {
        (eventEl as HTMLElement).click();
        expect(clickedEvent?.id).toBe("1");
      }
    });
  });
});
