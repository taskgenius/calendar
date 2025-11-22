import { Calendar, hideWeekends, workingHours, format12h } from "../../../src";
import type { CalendarEvent } from "../../../src/types";
import "../../../src/styles/styles.css";

// Initialize calendar
const calendar = new Calendar("#app", {
  view: {
    type: "week",
    showDateHeader: true,

    // ===== Filter Examples (uncomment to test) =====

    // Example 1: Hide weekends (simple preset)
    // dayFilter: hideWeekends(),

    // Example 2: Show only working hours (9 AM - 6 PM)
    // timeFilter: workingHours(9, 18),

    // Example 3: 12-hour time format
    // timeFormatter: format12h(),

    // Example 4: Advanced - Custom holiday styling
    // dayFilter: (date, context) => {
    //   const holidays = ['2025-01-01', '2025-12-25'];
    //   const dateStr = new Date(
    //     date.year(),
    //     date.month(),
    //     date.date()
    //   ).toISOString().split('T')[0];
    //
    //   if (holidays.includes(dateStr)) {
    //     return {
    //       visible: true,
    //       className: 'holiday',
    //       style: { backgroundColor: '#fee2e2', border: '2px solid #ef4444' },
    //       disabled: true
    //     };
    //   }
    //   return true;
    // },

    // Example 5: Advanced - Custom time labels
    // timeFormatter: (hour) => {
    //   const labels = {
    //     9: '🌅 Morning Standup',
    //     12: '🍽️ Lunch Time',
    //     14: '💻 Focus Time',
    //     17: '🏠 End of Day'
    //   };
    //   return labels[hour] || `${hour}:00`;
    // },

    // Example 6: Hide specific days (e.g., Tuesday and Thursday)
    // dayFilter: (date, context) => {
    //   return context.dayOfWeek !== 2 && context.dayOfWeek !== 4;
    // },
  },
  events: getInitialEvents(),
  draggable: { enabled: true, snapMinutes: 15 },
  theme: {
    primaryColor: "#3b82f6",
    cellHeight: 60,
  },
  // Event interactions
  onEventClick: (event) => {
    log(`[Event] Click: ${event.title} (${event.id})`);
  },
  onEventDoubleClick: (event) => {
    log(`[Event] Double Click: ${event.title} (${event.id})`);
  },
  onEventContextMenu: (event, x, y) => {
    log(`[Event] Context Menu: ${event.title} at (${x}, ${y})`);
  },
  onEventDrop: (event, newStart, newEnd) => {
    log(
      `[Event] Move: ${event.title}\n  From: ${event.start}\n  To: ${newStart} - ${newEnd}`,
    );
  },

  // Date interactions (month view)
  onDateClick: (date) => {
    log(`[Date] click: ${date}`);
  },
  onDateDoubleClick: (date) => {
    log(`[Date] double click: ${date}`);
  },
  onDateContextMenu: (date, x, y) => {
    log(`[Date] context menu: ${date} at (${x}, ${y})`);
  },

  // Time slot interactions (week/day view)
  onTimeSlotClick: (dateTime) => {
    log(`[Time Slot] click: ${dateTime}`);
  },
  onTimeSlotDoubleClick: (dateTime) => {
    log(`[Time Slot] double click: ${dateTime}`);
  },
  onTimeSlotContextMenu: (dateTime, x, y) => {
    log(`[Time Slot] context menu: ${dateTime} at (${x}, ${y})`);
  },

  // Range selection
  onDateRangeSelect: (startDate, endDate) => {
    log(`[Time Range Selection] Date Range: ${startDate} to ${endDate}`);
  },
  onTimeRangeSelect: (startDateTime, endDateTime) => {
    log(
      `[Time Range Selection] Time Range: ${startDateTime} to ${endDateTime}`,
    );
  },

  // Other callbacks
  onViewChange: (viewType) => {
    log(`[View] Switch: ${viewType}`);
  },
  onDateChange: (date) => {
    log(`[Navigation] Date: ${date}`);
  },
});

// Helper functions
function getInitialEvents(): CalendarEvent[] {
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());

  return [
    {
      id: "1",
      title: "Meeting",
      start: formatDate(addDays(startOfWeek, 1), 10, 0),
      end: formatDate(addDays(startOfWeek, 1), 11, 30),
      color: "#3b82f6",
    },
    {
      id: "2",
      title: "Technical Review",
      start: formatDate(addDays(startOfWeek, 1), 10, 30),
      end: formatDate(addDays(startOfWeek, 1), 12, 0),
      color: "#6366f1",
    },
    {
      id: "3",
      title: "Long-term Project (Cross-day)",
      start: formatDate(addDays(startOfWeek, -1), 0, 0),
      end: formatDate(addDays(startOfWeek, 2), 0, 0),
      color: "#a855f7",
    },
    {
      id: "4",
      title: "Lunch",
      start: formatDate(addDays(startOfWeek, 2), 12, 0),
      end: formatDate(addDays(startOfWeek, 2), 13, 0),
      color: "#22c55e",
    },
    {
      id: "5",
      title: "Code Review",
      start: formatDate(addDays(startOfWeek, 3), 14, 0),
      end: formatDate(addDays(startOfWeek, 3), 16, 0),
      color: "#ef4444",
    },
    {
      id: "6",
      title: "Friday Summary",
      start: formatDate(addDays(startOfWeek, 5), 16, 0),
      end: formatDate(addDays(startOfWeek, 5), 17, 0),
      color: "#f97316",
    },
  ];
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function formatDate(date: Date, hours: number, minutes: number): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const h = String(hours).padStart(2, "0");
  const m = String(minutes).padStart(2, "0");
  return `${year}-${month}-${day} ${h}:${m}`;
}

function log(message: string): void {
  const logEl = document.getElementById("log");
  if (logEl) {
    const timestamp = new Date().toLocaleTimeString();
    logEl.textContent = `[${timestamp}] ${message}\n\n${logEl.textContent}`;
  }
}

// Global functions for demo controls
let eventCounter = 100;

(window as any).addRandomEvent = () => {
  const colors = [
    "#3b82f6",
    "#22c55e",
    "#ef4444",
    "#f97316",
    "#8b5cf6",
    "#ec4899",
  ];
  const titles = [
    "New Event",
    "Task",
    "Phone Meeting",
    "Project Discussion",
    "Training",
    "Interview",
  ];

  const today = new Date();
  const hour = Math.floor(Math.random() * 8) + 9; // 9-16
  const duration = Math.floor(Math.random() * 3) + 1; // 1-3 hours

  const event: CalendarEvent = {
    id: String(++eventCounter),
    title: titles[Math.floor(Math.random() * titles.length)]!,
    start: formatDate(today, hour, 0),
    end: formatDate(today, hour + duration, 0),
    color: colors[Math.floor(Math.random() * colors.length)],
  };

  calendar.addEvent(event);
  log(`Added Event: ${event.title} (${event.start})`);
};

(window as any).clearEvents = () => {
  calendar.setEvents([]);
  log("Cleared all events");
};

(window as any).toggleDrag = () => {
  const newState = !calendar.isDraggable();
  calendar.setDraggable(newState);
  log(`Drag: ${newState ? "Enabled" : "Disabled"}`);
};

// Initial log
log("Calendar initialized");
