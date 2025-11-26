import {
  Calendar,
  ViewRegistry,
  MonthView,
  WeekView,
  DayView,
} from "../../../src";
import type { ExtendedCalendarConfig } from "../../../src/core/Calendar";
import type { CalendarEvent, ViewType } from "../../../src/types";
import "../../../src/styles/styles.css";
import "./index.css";

// Import custom views
import { customViews, getCustomViewInfo } from "./custom-views";

// =============================================================================
// View Registry Setup
// =============================================================================

/**
 * Create a custom registry with built-in and custom views
 */
function createViewRegistry(): ViewRegistry {
  const registry = new ViewRegistry();

  // Register built-in views
  registry.register(MonthView);
  registry.register(WeekView);
  registry.register(DayView);

  // Register all custom views
  for (const ViewClass of customViews) {
    registry.register(ViewClass);
  }

  return registry;
}

const viewRegistry = createViewRegistry();

// =============================================================================
// Configuration State
// =============================================================================
interface ConfigState {
  view: string; // Changed from ViewType to string to support custom views
  showWeekends: boolean;
  firstDayOfWeek: 0 | 1 | 6;
  maxEventsPerRow: number;
  activeDays: number[];
  draggable: boolean;
  snapMinutes: number;
}

const state: ConfigState = {
  view: "month",
  showWeekends: true,
  firstDayOfWeek: 0,
  maxEventsPerRow: 3,
  activeDays: [0, 1, 2, 3, 4, 5, 6],
  draggable: true,
  snapMinutes: 15,
};

// =============================================================================
// Calendar Instance
// =============================================================================
let calendar: Calendar;

function createCalendar(): void {
  const container = document.getElementById("app");
  if (!container) return;

  // Clear existing
  container.innerHTML = "";

  // Build day filter based on active days (only for built-in views)
  const dayFilter = (date: unknown, context: { dayOfWeek: number }) => {
    return state.activeDays.includes(context.dayOfWeek);
  };

  // Only use dayFilter for built-in views (custom views handle their own filtering)
  const isBuiltInView = ["month", "week", "day"].includes(state.view);
  const shouldUseDayFilter = isBuiltInView && state.activeDays.length < 7;

  const config: ExtendedCalendarConfig = {
    // Pass custom view registry
    viewRegistry,
    registerBuiltInViews: false, // We already registered them
    view: {
      type: state.view as ViewType,
      showDateHeader: true,
      maxEventsPerRow: state.maxEventsPerRow,
      firstDayOfWeek: state.firstDayOfWeek,
      showWeekends: state.showWeekends,
      dayFilter: shouldUseDayFilter ? dayFilter : undefined,
    },
    events: getInitialEvents(),
    draggable: {
      enabled: state.draggable,
      snapMinutes: state.snapMinutes,
    },
    theme: {
      primaryColor: "#2b4fff",
      cellHeight: 60,
    },
    // Event interactions
    onEventClick: (event) => {
      log(`[Click] ${event.title}`);
    },
    onEventDoubleClick: (event) => {
      log(`[DblClick] ${event.title}`);
    },
    onEventContextMenu: (event, x, y) => {
      log(`[ContextMenu] ${event.title} @ (${x}, ${y})`);
    },
    onEventDrop: (event, newStart, newEnd) => {
      log(`[Move] ${event.title} → ${formatDateTime(newStart)}`);
    },
    onEventResize: (event, newStart, newEnd) => {
      log(
        `[Resize] ${event.title} → ${formatDateTime(newStart)} - ${formatDateTime(newEnd)}`,
      );
    },
    // Date interactions
    onDateClick: (date) => {
      log(`[DateClick] ${formatDate(date)}`);
    },
    onDateDoubleClick: (date) => {
      log(`[DateDblClick] ${formatDate(date)}`);
    },
    // Time slot interactions
    onTimeSlotClick: (dateTime) => {
      log(`[TimeSlotClick] ${formatDateTime(dateTime)}`);
    },
    onTimeSlotDoubleClick: (dateTime) => {
      log(`[TimeSlotDblClick] ${formatDateTime(dateTime)}`);
    },
    // Range selection
    onDateRangeSelect: (startDate, endDate) => {
      log(`[DateRange] ${formatDate(startDate)} → ${formatDate(endDate)}`);
    },
    onTimeRangeSelect: (startDateTime, endDateTime) => {
      log(
        `[TimeRange] ${formatDateTime(startDateTime)} → ${formatDateTime(endDateTime)}`,
      );
    },
    // View changes
    onViewChange: (viewType) => {
      log(`[ViewChange] ${viewType}`);
      state.view = viewType;
      updateViewButtons();
      updateConfigDisplay();
    },
    onDateChange: (date) => {
      log(`[Navigate] ${formatDate(date)}`);
    },
  };

  // Create calendar with custom registry
  calendar = new Calendar("#app", config);
  updateConfigDisplay();
}

// =============================================================================
// Helper Functions
// =============================================================================
function getInitialEvents(): CalendarEvent[] {
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());

  const colors = {
    blue: "#2b4fff",
    orange: "#ff4800",
    green: "#00a82d",
    yellow: "#ffcc00",
    purple: "#8b5cf6",
    pink: "#ec4899",
  };

  return [
    {
      id: "1",
      title: "Sprint Planning",
      start: formatDate(addDays(startOfWeek, 1), 10, 0),
      end: formatDate(addDays(startOfWeek, 1), 11, 30),
      color: colors.blue,
    },
    {
      id: "2",
      title: "Design Review",
      start: formatDate(addDays(startOfWeek, 1), 10, 30),
      end: formatDate(addDays(startOfWeek, 1), 12, 0),
      color: colors.yellow,
    },
    {
      id: "3",
      title: "Product Launch Week",
      start: formatDate(addDays(startOfWeek, -1), 0, 0),
      end: formatDate(addDays(startOfWeek, 2), 0, 0),
      color: colors.orange,
    },
    {
      id: "4",
      title: "Client Lunch",
      start: formatDate(addDays(startOfWeek, 2), 12, 0),
      end: formatDate(addDays(startOfWeek, 2), 13, 30),
      color: colors.green,
    },
    {
      id: "5",
      title: "Code Review",
      start: formatDate(addDays(startOfWeek, 3), 14, 0),
      end: formatDate(addDays(startOfWeek, 3), 16, 0),
      color: colors.blue,
    },
    {
      id: "6",
      title: "Team Building",
      start: formatDate(addDays(startOfWeek, 4), 0, 0),
      end: formatDate(addDays(startOfWeek, 4), 0, 0),
      color: colors.green,
    },
    {
      id: "7",
      title: "Weekly Summary",
      start: formatDate(addDays(startOfWeek, 5), 16, 0),
      end: formatDate(addDays(startOfWeek, 5), 17, 0),
      color: colors.purple,
    },
    // Weekend events for testing weekend view
    {
      id: "8",
      title: "Weekend Brunch",
      start: formatDate(addDays(startOfWeek, 6), 11, 0),
      end: formatDate(addDays(startOfWeek, 6), 13, 0),
      color: colors.pink,
    },
    {
      id: "9",
      title: "Family Time",
      start: formatDate(addDays(startOfWeek, 0), 14, 0),
      end: formatDate(addDays(startOfWeek, 0), 18, 0),
      color: colors.orange,
    },
    // Additional events to test row height adjustment
    {
      id: "10",
      title: "Event A",
      start: formatDate(addDays(startOfWeek, 1), 0, 0),
      end: formatDate(addDays(startOfWeek, 1), 0, 0),
      color: colors.pink,
    },
    {
      id: "11",
      title: "Event B",
      start: formatDate(addDays(startOfWeek, 1), 0, 0),
      end: formatDate(addDays(startOfWeek, 1), 0, 0),
      color: colors.orange,
    },
    {
      id: "12",
      title: "Event C",
      start: formatDate(addDays(startOfWeek, 1), 0, 0),
      end: formatDate(addDays(startOfWeek, 1), 0, 0),
      color: colors.green,
    },
    {
      id: "13",
      title: "Event D",
      start: formatDate(addDays(startOfWeek, 1), 0, 0),
      end: formatDate(addDays(startOfWeek, 1), 0, 0),
      color: colors.blue,
    },
  ];
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function formatDate(date: Date, hours?: number, minutes?: number): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  if (hours !== undefined && minutes !== undefined) {
    const h = String(hours).padStart(2, "0");
    const m = String(minutes).padStart(2, "0");
    return `${year}-${month}-${day} ${h}:${m}`;
  }

  return `${year}-${month}-${day}`;
}

function formatDateTime(date: Date): string {
  return date.toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// =============================================================================
// Logging
// =============================================================================
function log(message: string): void {
  const logEl = document.getElementById("log");
  if (logEl) {
    const timestamp = new Date().toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    const entry = `<div class="log-entry"><span class="log-timestamp">[${timestamp}]</span>${message}</div>`;
    logEl.innerHTML = entry + logEl.innerHTML;

    // Limit log entries
    const entries = logEl.querySelectorAll(".log-entry");
    if (entries.length > 50) {
      for (let i = 50; i < entries.length; i++) {
        entries[i]?.remove();
      }
    }
  }
}

// =============================================================================
// Config Display
// =============================================================================
function updateConfigDisplay(): void {
  const configEl = document.getElementById("config-display");
  if (configEl) {
    const isCustomView = !["month", "week", "day"].includes(state.view);
    const displayConfig = {
      view: {
        type: state.view,
        isCustomView,
        ...(isCustomView && {
          customViewInfo: getCustomViewInfo().find(
            (v) => v.type === state.view,
          ),
        }),
        showWeekends: state.showWeekends,
        firstDayOfWeek: state.firstDayOfWeek,
        maxEventsPerRow: state.maxEventsPerRow,
        ...(state.activeDays.length < 7 && { activeDays: state.activeDays }),
      },
      draggable: {
        enabled: state.draggable,
        snapMinutes: state.snapMinutes,
      },
      registeredViews: viewRegistry.getAll().map((v) => v.type),
    };
    configEl.textContent = JSON.stringify(displayConfig, null, 2);
  }
}

// =============================================================================
// UI Control Functions (exposed to window)
// =============================================================================

// View control - supports both built-in and custom views
(window as any).setView = (view: string) => {
  state.view = view;
  calendar.setView(view as ViewType);
  updateViewButtons();
  updateConfigDisplay();
};

function updateViewButtons(): void {
  // Update built-in view buttons
  const builtInViews = ["month", "week", "day"];
  builtInViews.forEach((v) => {
    const btn = document.getElementById(`btn-${v}`);
    if (btn) {
      btn.classList.toggle("active", v === state.view);
    }
  });

  // Update custom view buttons
  const customViewTypes = customViews.map((V) => V.meta.type);
  customViewTypes.forEach((v) => {
    const btn = document.getElementById(`btn-${v}`);
    if (btn) {
      btn.classList.toggle("active", v === state.view);
    }
  });
}

// Navigation
(window as any).navigate = (direction: "prev" | "next" | "today") => {
  switch (direction) {
    case "prev":
      calendar.prev();
      break;
    case "next":
      calendar.next();
      break;
    case "today":
      calendar.today();
      break;
  }
};

// Display options
(window as any).toggleWeekends = () => {
  const checkbox = document.getElementById(
    "toggle-weekends",
  ) as HTMLInputElement;
  state.showWeekends = checkbox?.checked ?? true;

  if (state.showWeekends) {
    if (!state.activeDays.includes(0)) state.activeDays.push(0);
    if (!state.activeDays.includes(6)) state.activeDays.push(6);
    state.activeDays.sort((a, b) => a - b);
  } else {
    state.activeDays = state.activeDays.filter((d) => d !== 0 && d !== 6);
  }

  updateDayCheckboxes();
  createCalendar();
  log(`[Config] Weekends: ${state.showWeekends ? "ON" : "OFF"}`);
};

(window as any).setFirstDay = () => {
  const select = document.getElementById("first-day") as HTMLSelectElement;
  state.firstDayOfWeek = parseInt(select.value, 10) as 0 | 1 | 6;
  createCalendar();
  log(
    `[Config] First day: ${["Sun", "Mon", "", "", "", "", "Sat"][state.firstDayOfWeek]}`,
  );
};

(window as any).setMaxEvents = () => {
  const input = document.getElementById("max-events") as HTMLInputElement;
  state.maxEventsPerRow = Math.max(
    1,
    Math.min(10, parseInt(input.value, 10) || 3),
  );
  createCalendar();
  log(`[Config] Max events/row: ${state.maxEventsPerRow}`);
};

// Active days
function initDaysSelector(): void {
  const container = document.getElementById("days-selector");
  if (!container) return;

  const labels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  container.innerHTML = labels
    .map(
      (label, idx) => `
    <label class="day-checkbox">
      <input type="checkbox" class="checkbox-brutal" data-day="${idx}"
             ${state.activeDays.includes(idx) ? "checked" : ""}
             onchange="toggleDay(${idx})">
      <span>${label}</span>
    </label>
  `,
    )
    .join("");
}

function updateDayCheckboxes(): void {
  const checkboxes = document.querySelectorAll(
    "#days-selector input[type=checkbox]",
  );
  checkboxes.forEach((cb) => {
    const checkbox = cb as HTMLInputElement;
    const day = parseInt(checkbox.dataset.day || "0", 10);
    checkbox.checked = state.activeDays.includes(day);
  });
}

(window as any).toggleDay = (day: number) => {
  if (state.activeDays.includes(day)) {
    if (state.activeDays.length > 1) {
      state.activeDays = state.activeDays.filter((d) => d !== day);
    } else {
      // Keep at least one day active
      updateDayCheckboxes();
      log("[Config] Must keep at least one day active");
      return;
    }
  } else {
    state.activeDays.push(day);
    state.activeDays.sort((a, b) => a - b);
  }

  // Update weekends toggle
  const weekendsCheckbox = document.getElementById(
    "toggle-weekends",
  ) as HTMLInputElement;
  if (weekendsCheckbox) {
    weekendsCheckbox.checked =
      state.activeDays.includes(0) && state.activeDays.includes(6);
  }

  createCalendar();
  log(
    `[Config] Active days: ${state.activeDays.map((d) => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d]).join(", ")}`,
  );
};

// Drag options
(window as any).toggleDrag = () => {
  const checkbox = document.getElementById("toggle-drag") as HTMLInputElement;
  state.draggable = checkbox?.checked ?? true;
  calendar.setDraggable(state.draggable);
  updateConfigDisplay();
  log(`[Config] Drag: ${state.draggable ? "ON" : "OFF"}`);
};

(window as any).setSnapMinutes = () => {
  const select = document.getElementById("snap-minutes") as HTMLSelectElement;
  state.snapMinutes = parseInt(select.value, 10);
  createCalendar();
  log(`[Config] Snap: ${state.snapMinutes} min`);
};

// Event actions
let eventCounter = 100;

(window as any).addRandomEvent = () => {
  const colors = [
    "#2b4fff",
    "#ff4800",
    "#00a82d",
    "#ffcc00",
    "#8b5cf6",
    "#ec4899",
  ];
  const titles = ["Meeting", "Task", "Call", "Review", "Workshop", "Training"];

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
  log(`[Event] Added: ${event.title}`);
};

(window as any).clearEvents = () => {
  calendar.setEvents([]);
  log("[Event] All events cleared");
};

// Log control
(window as any).clearLog = () => {
  const logEl = document.getElementById("log");
  if (logEl) {
    logEl.innerHTML =
      '<div class="log-entry"><span class="log-timestamp">[--:--:--]</span>Log cleared</div>';
  }
};

// Config copy
(window as any).copyConfig = () => {
  const configEl = document.getElementById("config-display");
  if (configEl) {
    navigator.clipboard.writeText(configEl.textContent || "{}").then(() => {
      log("[Config] Copied to clipboard");
    });
  }
};

// =============================================================================
// Custom Views UI
// =============================================================================

/**
 * Initialize the custom views section in the sidebar
 */
function initCustomViewsSection(): void {
  const container = document.getElementById("custom-views-container");
  if (!container) return;

  const viewsInfo = getCustomViewInfo();

  container.innerHTML = viewsInfo
    .map(
      (view) => `
    <button
      class="btn-brutal custom-view-btn"
      id="btn-${view.type}"
      onclick="setView('${view.type}')"
      title="${view.description}"
    >
      <span class="view-label">${view.label}</span>
      <span class="view-short">${view.shortLabel}</span>
    </button>
  `,
    )
    .join("");
}

// =============================================================================
// Initialize
// =============================================================================
document.addEventListener("DOMContentLoaded", () => {
  initDaysSelector();
  initCustomViewsSection();
  createCalendar();
  log("Calendar initialized with custom views");
  log(
    `Registered views: ${viewRegistry
      .getAll()
      .map((v) => v.type)
      .join(", ")}`,
  );
});
