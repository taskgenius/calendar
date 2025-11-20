/**
 * Drag and drop controller for calendar events
 */
import type {
  DateAdapter,
  CalendarEvent,
  DraggableConfig,
  DragState,
  DragMode,
} from "../types";
import { createElement, setStyles, querySelectorAll } from "../utils/dom";

/**
 * Handles drag and drop interactions for calendar events
 */
export class DragController<T> {
  private state: DragState<T> | null = null;
  private proxyElement: HTMLElement | null = null;
  private boundOnMove: (e: MouseEvent) => void;
  private boundOnUp: (e: MouseEvent) => void;

  constructor(
    private adapter: DateAdapter<T>,
    private config: Required<DraggableConfig>,
    private onDrop: (
      event: CalendarEvent,
      newStart: string,
      newEnd: string,
    ) => void,
    private cellHeight: number = 60,
  ) {
    this.boundOnMove = this.onMove.bind(this);
    this.boundOnUp = this.onUp.bind(this);
  }

  /**
   * Initialize drag for a month view event
   */
  initMonthDrag(
    el: HTMLElement,
    event: CalendarEvent,
    renderCallback: () => void,
  ): void {
    if (!this.config.enabled) return;

    el.onmousedown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      e.stopPropagation();

      const row = el.closest(".tg-month-row") as HTMLElement | null;
      if (!row) return;

      const cellW = row.offsetWidth / 7;
      let mode: DragMode = "move";

      const target = e.target as HTMLElement;
      if (target.classList.contains("tg-left")) mode = "resize-left";
      if (target.classList.contains("tg-right")) mode = "resize-right";

      this.startDrag({
        type: "month",
        mode,
        event,
        startX: e.clientX,
        startY: e.clientY,
        startDate: this.adapter.parse(event.start),
        endDate: this.adapter.parse(event.end),
        cellW,
        renderCallback,
        clickOffsetDays: Math.floor(
          (e.clientX - el.getBoundingClientRect().left) / cellW,
        ),
      });
    };
  }

  /**
   * Initialize drag for a time view event
   */
  initTimeDrag(
    el: HTMLElement,
    event: CalendarEvent,
    renderCallback: () => void,
  ): void {
    if (!this.config.enabled) return;

    el.onmousedown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      e.stopPropagation();

      const col = el.closest(".tg-day-column") as HTMLElement | null;
      if (!col) return;

      const colRect = col.getBoundingClientRect();
      let mode: DragMode = "move";

      const target = e.target as HTMLElement;
      if (target.classList.contains("tg-resize-v")) mode = "resize-bottom";

      const startDate = this.adapter.parse(event.start);
      const endDate = this.adapter.parse(event.end);

      this.startDrag({
        type: "time",
        mode,
        event,
        startX: e.clientX,
        startY: e.clientY,
        startDate,
        endDate,
        colW: colRect.width,
        renderCallback,
        origStartMin:
          this.adapter.hour(startDate) * 60 + this.adapter.minute(startDate),
        origDuration: this.adapter.diff(endDate, startDate, "minute"),
      });
    };
  }

  /**
   * Update cell height for time calculations
   */
  setCellHeight(height: number): void {
    this.cellHeight = height;
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    document.removeEventListener("mousemove", this.boundOnMove);
    document.removeEventListener("mouseup", this.boundOnUp);
    this.removeProxy();
    this.state = null;
  }

  // ==========================================================================
  // Private Methods
  // ==========================================================================

  private startDrag(stateData: DragState<T>): void {
    this.state = stateData;
    document.body.style.cursor = "grabbing";

    // Mark source element
    querySelectorAll(`[data-eid="${stateData.event.id}"]`).forEach((el) => {
      el.classList.add("tg-is-dragging-source");
    });

    // Create proxy element
    this.createProxy(stateData.event);

    document.addEventListener("mousemove", this.boundOnMove);
    document.addEventListener("mouseup", this.boundOnUp);
  }

  private createProxy(event: CalendarEvent): void {
    // Check for existing proxy
    this.proxyElement = document.getElementById(
      "tg-drag-proxy",
    ) as HTMLElement | null;

    if (!this.proxyElement) {
      this.proxyElement = createElement("div", undefined, {
        id: "tg-drag-proxy",
      });
      document.body.appendChild(this.proxyElement);
    }

    this.proxyElement.textContent = event.title;
    setStyles(this.proxyElement, {
      backgroundColor: event.color || "#3b82f6",
      color: "white",
      padding: "4px 8px",
      fontSize: "12px",
    });
  }

  private removeProxy(): void {
    if (this.proxyElement) {
      this.proxyElement.style.visibility = "hidden";
    }
  }

  private onMove(e: MouseEvent): void {
    if (!this.state) return;

    // Update proxy position
    if (this.proxyElement) {
      setStyles(this.proxyElement, {
        visibility: "visible",
        left: `${e.clientX + 10}px`,
        top: `${e.clientY + 10}px`,
        transform: "none",
      });
    }

    if (this.state.type === "month") {
      this.handleMonthMove(e);
    } else {
      this.handleTimeMove(e);
    }
  }

  private handleMonthMove(e: MouseEvent): void {
    const s = this.state!;
    const row = document
      .elementFromPoint(e.clientX, e.clientY)
      ?.closest(".tg-month-row") as HTMLElement | null;

    if (!row?.dataset["date"]) return;

    const rowStart = this.adapter.parse(row.dataset["date"]);
    const cellIdx = Math.floor(
      (e.clientX - row.getBoundingClientRect().left) / (s.cellW || 1),
    );
    const hoverDate = this.adapter.add(
      rowStart,
      Math.max(0, Math.min(6, cellIdx)),
      "day",
    );

    let newStart = s.startDate;
    let newEnd = s.endDate;

    if (s.mode === "move") {
      const duration = this.adapter.diff(s.endDate, s.startDate, "day");
      newStart = hoverDate;
      newEnd = this.adapter.add(newStart, duration, "day");
    } else if (s.mode === "resize-right") {
      newEnd = hoverDate;
      if (this.adapter.isBefore(newEnd, newStart)) {
        newEnd = newStart;
      }
    } else if (s.mode === "resize-left") {
      newStart = hoverDate;
      if (this.adapter.isAfter(newStart, newEnd)) {
        newStart = newEnd;
      }
    }

    this.renderMonthGhost(newStart, newEnd);
    s.tentativeStart = newStart;
    s.tentativeEnd = newEnd;
  }

  private handleTimeMove(e: MouseEvent): void {
    const s = this.state!;
    const col = document
      .elementFromPoint(e.clientX, e.clientY)
      ?.closest(".tg-day-column") as HTMLElement | null;

    if (!col?.dataset["date"]) return;

    const newDateBase = this.adapter.parse(col.dataset["date"]);
    const rect = col.getBoundingClientRect();
    const relY = e.clientY - rect.top;

    const rawMins = (relY / this.cellHeight) * 60;
    const snapMinutes = this.config.snapMinutes || 15;
    const snappedMins = Math.max(
      0,
      Math.min(1440, Math.round(rawMins / snapMinutes) * snapMinutes),
    );

    let newStart: T;
    let newEnd: T;

    if (s.mode === "move") {
      newStart = this.adapter.setMinute(
        this.adapter.setHour(newDateBase, 0),
        snappedMins,
      );
      newEnd = this.adapter.add(newStart, s.origDuration || 60, "minute");
    } else {
      // resize-bottom
      newStart = s.startDate;

      if (this.adapter.isSame(newDateBase, s.startDate, "day")) {
        const endMins = Math.max((s.origStartMin || 0) + 15, snappedMins);
        newEnd = this.adapter.setMinute(
          this.adapter.setHour(newDateBase, 0),
          endMins,
        );
      } else {
        newEnd = s.endDate;
      }
    }

    this.renderTimeGhost(newStart, newEnd);
    s.tentativeStart = newStart;
    s.tentativeEnd = newEnd;
  }

  private renderMonthGhost(start: T, end: T): void {
    // Remove existing ghosts
    querySelectorAll(".tg-ghost-event").forEach((el) => el.remove());

    const rows = querySelectorAll<HTMLElement>(".tg-month-row");

    for (const row of rows) {
      if (!row.dataset["date"]) continue;

      const rStart = this.adapter.parse(row.dataset["date"]);
      const rEnd = this.adapter.add(rStart, 6, "day");

      // Check if event overlaps this row
      if (
        !this.adapter.isBefore(end, rStart) &&
        !this.adapter.isAfter(start, rEnd)
      ) {
        const dStart = this.adapter.isBefore(start, rStart) ? rStart : start;
        const dEnd = this.adapter.isAfter(end, rEnd) ? rEnd : end;

        const left = this.adapter.diff(dStart, rStart, "day") * 14.2857;
        const width = (this.adapter.diff(dEnd, dStart, "day") + 1) * 14.2857;

        const ghost = createElement("div", "tg-ghost-event");
        setStyles(ghost, {
          left: `${left}%`,
          width: `${width}%`,
          top: "30px",
          height: "26px",
        });

        row.appendChild(ghost);
      }
    }
  }

  private renderTimeGhost(start: T, end: T): void {
    // Remove existing ghosts
    querySelectorAll(".tg-ghost-event").forEach((el) => el.remove());

    const dateStr = this.adapter.format(start, "YYYY-MM-DD");
    const col = document.querySelector(
      `.tg-day-column[data-date="${dateStr}"]`,
    ) as HTMLElement | null;

    if (!col) return;

    const startMin = this.adapter.hour(start) * 60 + this.adapter.minute(start);
    const top = startMin * (this.cellHeight / 60);
    const height =
      this.adapter.diff(end, start, "minute") * (this.cellHeight / 60);

    const ghost = createElement("div", "tg-ghost-event");
    setStyles(ghost, {
      top: `${top}px`,
      height: `${height}px`,
      width: "90%",
      left: "5%",
    });

    ghost.textContent = `${this.adapter.format(start, "HH:mm")} - ${this.adapter.format(end, "HH:mm")}`;
    setStyles(ghost, {
      color: "#3b82f6",
      fontSize: "10px",
      padding: "2px",
    });

    col.appendChild(ghost);
  }

  private onUp(_e: MouseEvent): void {
    if (!this.state) return;

    const s = this.state;

    // Cleanup
    document.body.style.cursor = "";
    this.removeProxy();

    querySelectorAll(".tg-ghost-event").forEach((el) => el.remove());
    querySelectorAll(".tg-is-dragging-source").forEach((el) => {
      el.classList.remove("tg-is-dragging-source");
    });

    document.removeEventListener("mousemove", this.boundOnMove);
    document.removeEventListener("mouseup", this.boundOnUp);

    // Apply changes if we have tentative dates
    if (s.tentativeStart && s.tentativeEnd) {
      const newStart = this.adapter.format(
        s.tentativeStart,
        "YYYY-MM-DD HH:mm",
      );
      const newEnd = this.adapter.format(s.tentativeEnd, "YYYY-MM-DD HH:mm");

      this.onDrop(s.event, newStart, newEnd);
      s.renderCallback();
    }

    this.state = null;
  }
}
