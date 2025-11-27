/**
 * Interaction controller for calendar user interactions
 * Handles clicks, double-clicks, context menus, and range selections
 */
import type {
	DateAdapter,
	CalendarEvent,
	ResolvedCalendarConfig,
	ViewType,
	RangeSelectionState,
} from "../types";
import type { DragController } from "./DragController";
import type { EventManager } from "./EventManager";
import { createElement, setStyles, querySelectorAll } from "../utils/dom";

/**
 * Manages all user interactions with the calendar
 * Uses event delegation pattern for performance
 */
export class InteractionController<T> {
	private container: HTMLElement | null = null;
	private rangeState: RangeSelectionState<T> | null = null;

	// Bound event handlers for cleanup
	private boundHandleClick: (e: MouseEvent) => void;
	private boundHandleDblClick: (e: MouseEvent) => void;
	private boundHandleContextMenu: (e: MouseEvent) => void;
	private boundHandleMouseDown: (e: MouseEvent) => void;
	private boundHandleRangeMove: (e: MouseEvent) => void;
	private boundHandleRangeEnd: (e: MouseEvent) => void;

	constructor(
		private adapter: DateAdapter<T>,
		private config: ResolvedCalendarConfig,
		private dragController: DragController<T>,
		private currentView: () => ViewType,
		private eventManager: EventManager,
	) {
		// Bind event handlers
		this.boundHandleClick = this.handleClick.bind(this);
		this.boundHandleDblClick = this.handleDblClick.bind(this);
		this.boundHandleContextMenu = this.handleContextMenu.bind(this);
		this.boundHandleMouseDown = this.handleMouseDown.bind(this);
		this.boundHandleRangeMove = this.handleRangeMove.bind(this);
		this.boundHandleRangeEnd = this.handleRangeEnd.bind(this);
	}

	// ==========================================================================
	// Public Methods
	// ==========================================================================

	/**
	 * Initialize interaction listeners on the calendar container
	 */
	init(container: HTMLElement): void {
		// Clean up previous listeners if any
		this.destroy();

		this.container = container;

		// Add event listeners using event delegation
		container.addEventListener("click", this.boundHandleClick);
		container.addEventListener("dblclick", this.boundHandleDblClick);
		container.addEventListener("contextmenu", this.boundHandleContextMenu);
		container.addEventListener("mousedown", this.boundHandleMouseDown);
	}

	/**
	 * Clean up all event listeners
	 */
	destroy(): void {
		if (this.container) {
			this.container.removeEventListener("click", this.boundHandleClick);
			this.container.removeEventListener(
				"dblclick",
				this.boundHandleDblClick,
			);
			this.container.removeEventListener(
				"contextmenu",
				this.boundHandleContextMenu,
			);
			this.container.removeEventListener(
				"mousedown",
				this.boundHandleMouseDown,
			);
		}

		// Clean up range selection listeners
		document.removeEventListener("mousemove", this.boundHandleRangeMove);
		document.removeEventListener("mouseup", this.boundHandleRangeEnd);

		this.clearRangePreview();
		this.rangeState = null;
		this.container = null;
	}

	// ==========================================================================
	// Event Handlers
	// ==========================================================================

	/**
	 * Handle click events
	 */
	private handleClick(e: MouseEvent): void {
		const target = e.target as HTMLElement;

		// 1. Check if clicking on an event - already handled by existing onEventClick
		const eventEl = target.closest(".tg-event-block, .tg-event-bar");
		if (eventEl) {
			return; // Let existing event click handler deal with it
		}

		// 2. Check if clicking on a date cell (month view)
		if (this.currentView() === "month") {
			const cellEl = target.closest(".tg-month-cell");
			if (cellEl) {
				this.handleDateClick(cellEl as HTMLElement);
				return;
			}
		}

		// 3. Check if clicking on a time slot (week/day view)
		if (this.currentView() === "week" || this.currentView() === "day") {
			const colEl = target.closest(".tg-day-column");
			if (colEl && !target.closest(".tg-event-block")) {
				this.handleTimeSlotClick(e, colEl as HTMLElement);
				return;
			}
		}
	}

	/**
	 * Handle double-click events
	 */
	private handleDblClick(e: MouseEvent): void {
		const target = e.target as HTMLElement;

		// 1. Event double-click
		const eventEl = target.closest(".tg-event-block, .tg-event-bar");
		if (eventEl) {
			const eventId = eventEl.getAttribute("data-eid");
			const event = this.getEventById(eventId);
			if (event) {
				this.config.onEventDoubleClick?.(event);
			}
			return;
		}

		// 2. Date double-click (month view)
		if (this.currentView() === "month") {
			const cellEl = target.closest(".tg-month-cell");
			if (cellEl) {
				const date = this.getDateFromCell(cellEl as HTMLElement);
				if (date) {
					this.config.onDateDoubleClick?.(this.toDate(date));
				}
				return;
			}
		}

		// 3. Time slot double-click (week/day view)
		if (this.currentView() === "week" || this.currentView() === "day") {
			const colEl = target.closest(".tg-day-column");
			if (colEl && !target.closest(".tg-event-block")) {
				const dateTime = this.getDateTimeFromSlot(
					e,
					colEl as HTMLElement,
				);
				if (dateTime) {
					this.config.onTimeSlotDoubleClick?.(this.toDate(dateTime));
				}
				return;
			}
		}
	}

	/**
	 * Handle context menu (right-click) events
	 */
	private handleContextMenu(e: MouseEvent): void {
		const target = e.target as HTMLElement;

		// Check if any context menu callback is defined
		const hasContextMenu =
			this.config.onEventContextMenu ||
			this.config.onDateContextMenu ||
			this.config.onTimeSlotContextMenu;

		if (!hasContextMenu) {
			return; // Let default context menu show
		}

		// 1. Event context menu
		const eventEl = target.closest(".tg-event-block, .tg-event-bar");
		if (eventEl && this.config.onEventContextMenu) {
			e.preventDefault();
			const eventId = eventEl.getAttribute("data-eid");
			const event = this.getEventById(eventId);
			// Debug logging
			console.log("[InteractionController] Context menu on event:", {
				eventId,
				eventFound: !!event,
				eventEl: eventEl.className,
				allEvents: this.eventManager.getEvents().map((e) => e.id),
			});
			if (event) {
				this.config.onEventContextMenu(event, e.clientX, e.clientY);
			}
			return;
		}

		// 2. Date context menu (month view)
		if (this.currentView() === "month" && this.config.onDateContextMenu) {
			const cellEl = target.closest(".tg-month-cell");
			if (cellEl) {
				e.preventDefault();
				const date = this.getDateFromCell(cellEl as HTMLElement);
				if (date) {
					this.config.onDateContextMenu(
						this.toDate(date),
						e.clientX,
						e.clientY,
					);
				}
				return;
			}
		}

		// 3. Time slot context menu (week/day view)
		if (
			(this.currentView() === "week" || this.currentView() === "day") &&
			this.config.onTimeSlotContextMenu
		) {
			const colEl = target.closest(".tg-day-column");
			if (colEl && !target.closest(".tg-event-block")) {
				e.preventDefault();
				const dateTime = this.getDateTimeFromSlot(
					e,
					colEl as HTMLElement,
				);
				if (dateTime) {
					this.config.onTimeSlotContextMenu(
						this.toDate(dateTime),
						e.clientX,
						e.clientY,
					);
				}
				return;
			}
		}
	}

	/**
	 * Handle mouse down for range selection
	 */
	private handleMouseDown(e: MouseEvent): void {
		// Only left button
		if (e.button !== 0) return;

		const target = e.target as HTMLElement;

		// Don't start range selection if clicking on events
		if (target.closest(".tg-event-block, .tg-event-bar")) return;

		// Don't start range selection if drag controller is active
		if (this.dragController.isDragging()) return;

		// Check if range selection callbacks are defined
		const hasRangeSelect =
			this.config.onDateRangeSelect || this.config.onTimeRangeSelect;
		if (!hasRangeSelect) return;

		// Handle month view range selection
		if (this.currentView() === "month" && this.config.onDateRangeSelect) {
			const cellEl = target.closest(".tg-month-cell");
			if (!cellEl) return;

			const date = this.getDateFromCell(cellEl as HTMLElement);
			if (!date) return;

			this.rangeState = {
				isSelecting: true,
				startDate: date,
				startX: e.clientX,
				startY: e.clientY,
				currentDate: date,
				viewType: "month",
			};

			document.addEventListener("mousemove", this.boundHandleRangeMove);
			document.addEventListener("mouseup", this.boundHandleRangeEnd);

			// Add selecting class to prevent text selection
			if (this.container) {
				this.container.classList.add("tg-selecting");
			}

			return;
		}

		// Handle time view range selection
		if (
			(this.currentView() === "week" || this.currentView() === "day") &&
			this.config.onTimeRangeSelect
		) {
			const colEl = target.closest(".tg-day-column");
			if (!colEl) return;

			const dateTime = this.getDateTimeFromSlot(e, colEl as HTMLElement);
			if (!dateTime) return;

			this.rangeState = {
				isSelecting: true,
				startDate: dateTime,
				startX: e.clientX,
				startY: e.clientY,
				currentDate: dateTime,
				viewType: "time",
				columnEl: colEl as HTMLElement,
			};

			document.addEventListener("mousemove", this.boundHandleRangeMove);
			document.addEventListener("mouseup", this.boundHandleRangeEnd);

			// Add selecting class to prevent text selection
			if (this.container) {
				this.container.classList.add("tg-selecting");
			}

			return;
		}
	}

	/**
	 * Handle mouse move during range selection
	 */
	private handleRangeMove(e: MouseEvent): void {
		if (!this.rangeState?.isSelecting) return;

		const target = document.elementFromPoint(e.clientX, e.clientY);
		if (!target) return;

		if (this.rangeState.viewType === "month") {
			const cellEl = target.closest(".tg-month-cell");
			if (cellEl) {
				const date = this.getDateFromCell(cellEl as HTMLElement);
				if (date) {
					this.rangeState.currentDate = date;
					this.renderMonthRangePreview();
				}
			}
		} else {
			// Time view
			const colEl = target.closest(".tg-day-column");
			if (colEl) {
				const dateTime = this.getDateTimeFromSlot(
					e,
					colEl as HTMLElement,
				);
				if (dateTime) {
					this.rangeState.currentDate = dateTime;
					this.renderTimeRangePreview();
				}
			}
		}
	}

	/**
	 * Handle mouse up to complete range selection
	 */
	private handleRangeEnd(_e: MouseEvent): void {
		if (!this.rangeState?.isSelecting) return;

		// Clean up
		document.removeEventListener("mousemove", this.boundHandleRangeMove);
		document.removeEventListener("mouseup", this.boundHandleRangeEnd);

		if (this.container) {
			this.container.classList.remove("tg-selecting");
		}

		// Trigger callback if we have both start and end dates
		if (this.rangeState.startDate && this.rangeState.currentDate) {
			const startDate = this.rangeState.startDate;
			const endDate = this.rangeState.currentDate;

			// Ensure start is before end
			const isStartAfterEnd = this.adapter.isAfter(startDate, endDate);

			if (this.rangeState.viewType === "month") {
				const start = this.toDate(
					isStartAfterEnd ? endDate : startDate,
				);
				const end = this.toDate(isStartAfterEnd ? startDate : endDate);
				this.config.onDateRangeSelect?.(start, end);
			} else {
				const start = this.toDate(
					isStartAfterEnd ? endDate : startDate,
				);
				const end = this.toDate(isStartAfterEnd ? startDate : endDate);
				this.config.onTimeRangeSelect?.(start, end);
			}
		}

		this.clearRangePreview();
		this.rangeState = null;
	}

	// ==========================================================================
	// Helper Methods
	// ==========================================================================

	/**
	 * Convert adapter date to native Date object
	 */
	private toDate(adapterDate: T): Date {
		return new Date(
			this.adapter.year(adapterDate),
			this.adapter.month(adapterDate),
			this.adapter.date(adapterDate),
			this.adapter.hour(adapterDate),
			this.adapter.minute(adapterDate),
		);
	}

	/**
	 * Get event by ID from event manager
	 */
	private getEventById(eventId: string | null): CalendarEvent | undefined {
		if (!eventId) return undefined;
		return this.eventManager.findEvent(eventId);
	}

	/**
	 * Get date from a month view cell
	 */
	private getDateFromCell(cellEl: HTMLElement): T | null {
		const row = cellEl.closest(".tg-month-row") as HTMLElement;
		if (!row?.dataset["date"]) return null;

		const cells = Array.from(row.querySelectorAll(".tg-month-cell"));
		const index = cells.indexOf(cellEl);
		if (index < 0) return null;

		const rowStart = this.adapter.parse(row.dataset["date"]);
		const clickedDate = this.adapter.add(rowStart, index, "day");
		return clickedDate;
	}

	/**
	 * Get date-time from a time slot click
	 */
	private getDateTimeFromSlot(e: MouseEvent, colEl: HTMLElement): T | null {
		const dateStr = colEl.dataset["date"];
		if (!dateStr) return null;

		const rect = colEl.getBoundingClientRect();
		const relY = e.clientY - rect.top;

		const cellHeight = this.config.theme.cellHeight;
		const snapMinutes = this.config.draggable.snapMinutes;

		const rawMinutes = (relY / cellHeight) * 60;
		const snappedMinutes = Math.max(
			0,
			Math.min(1440, Math.round(rawMinutes / snapMinutes) * snapMinutes),
		);

		const date = this.adapter.parse(dateStr);
		const dateTime = this.adapter.setMinute(
			this.adapter.setHour(date, Math.floor(snappedMinutes / 60)),
			snappedMinutes % 60,
		);

		return dateTime;
	}

	/**
	 * Handle date cell click
	 */
	private handleDateClick(cellEl: HTMLElement): void {
		const date = this.getDateFromCell(cellEl);
		if (date) {
			this.config.onDateClick?.(this.toDate(date));
		}
	}

	/**
	 * Handle time slot click
	 */
	private handleTimeSlotClick(e: MouseEvent, colEl: HTMLElement): void {
		const dateTime = this.getDateTimeFromSlot(e, colEl);
		if (dateTime) {
			this.config.onTimeSlotClick?.(this.toDate(dateTime));
		}
	}

	// ==========================================================================
	// Range Preview Rendering
	// ==========================================================================

	/**
	 * Render visual preview for month view range selection
	 */
	private renderMonthRangePreview(): void {
		if (!this.rangeState?.startDate || !this.rangeState?.currentDate)
			return;

		// Clear existing preview
		this.clearRangePreview();

		const startDate = this.adapter.isBefore(
			this.rangeState.startDate,
			this.rangeState.currentDate,
		)
			? this.rangeState.startDate
			: this.rangeState.currentDate;
		const endDate = this.adapter.isAfter(
			this.rangeState.startDate,
			this.rangeState.currentDate,
		)
			? this.rangeState.startDate
			: this.rangeState.currentDate;

		const rows = querySelectorAll<HTMLElement>(".tg-month-row");

		for (const row of rows) {
			if (!row.dataset["date"]) continue;

			const rowStart = this.adapter.parse(row.dataset["date"]);
			const cells = Array.from(row.querySelectorAll(".tg-month-cell"));
			const rowEnd = this.adapter.add(rowStart, cells.length - 1, "day");

			// Check if selection overlaps this row
			if (
				!this.adapter.isBefore(endDate, rowStart) &&
				!this.adapter.isAfter(startDate, rowEnd)
			) {
				// Calculate selection range within this row
				for (let i = 0; i < cells.length; i++) {
					const cellDate = this.adapter.add(rowStart, i, "day");

					if (
						!this.adapter.isBefore(cellDate, startDate) &&
						!this.adapter.isAfter(cellDate, endDate)
					) {
						const cell = cells[i];
						if (cell) {
							cell.classList.add("tg-range-preview");
						}
					}
				}
			}
		}
	}

	/**
	 * Render visual preview for time view range selection
	 */
	private renderTimeRangePreview(): void {
		if (!this.rangeState?.startDate || !this.rangeState?.currentDate)
			return;

		// Clear existing preview
		this.clearRangePreview();

		const startDate = this.adapter.isBefore(
			this.rangeState.startDate,
			this.rangeState.currentDate,
		)
			? this.rangeState.startDate
			: this.rangeState.currentDate;
		const endDate = this.adapter.isAfter(
			this.rangeState.startDate,
			this.rangeState.currentDate,
		)
			? this.rangeState.startDate
			: this.rangeState.currentDate;

		// Check if selection is within a single day
		const isSameDay = this.adapter.isSame(startDate, endDate, "day");

		// Handle single column selection
		if (isSameDay) {
			// Find the column for this date
			const columns = querySelectorAll<HTMLElement>(".tg-day-column");
			let col: HTMLElement | null = null;
			for (const c of columns) {
				const colDateStr = c.dataset["date"];
				if (colDateStr) {
					const colDate = this.adapter.parse(colDateStr);
					if (this.adapter.isSame(colDate, startDate, "day")) {
						col = c;
						break;
					}
				}
			}
			if (!col) return;

			const startMin =
				this.adapter.hour(startDate) * 60 +
				this.adapter.minute(startDate);
			const endMin =
				this.adapter.hour(endDate) * 60 + this.adapter.minute(endDate);

			const cellHeight = this.config.theme.cellHeight;
			const top = (startMin / 60) * cellHeight;
			const height = ((endMin - startMin) / 60) * cellHeight;

			const preview = createElement("div", "tg-time-range-preview");
			setStyles(preview, {
				top: `${top}px`,
				height: `${Math.max(height, cellHeight / 4)}px`,
				width: "100%",
				left: "0",
			});

			col.appendChild(preview);
		} else {
			// Multi-column selection - add simple visual indicator for each column
			const columns = querySelectorAll<HTMLElement>(".tg-day-column");
			for (const col of columns) {
				const colDateStr = col.dataset["date"];
				if (!colDateStr) continue;

				const colDate = this.adapter.parse(colDateStr);

				if (
					!this.adapter.isBefore(colDate, startDate, "day") &&
					!this.adapter.isAfter(colDate, endDate, "day")
				) {
					col.classList.add("tg-range-preview");
				}
			}
		}
	}

	/**
	 * Clear all range preview elements and classes
	 */
	private clearRangePreview(): void {
		// Remove preview elements
		querySelectorAll(".tg-time-range-preview").forEach((el) => el.remove());

		// Remove preview classes
		querySelectorAll(".tg-range-preview").forEach((el) => {
			el.classList.remove("tg-range-preview");
		});
	}
}
