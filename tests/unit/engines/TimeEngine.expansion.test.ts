import { describe, it, expect } from "vitest";
import { TimeEngine } from "../../../src/engines/TimeEngine";
import { DayJsAdapter } from "../../../src/adapters/DayJsAdapter";
import { DEFAULT_DATE_FORMATS } from "../../../src/constants";
import type { CalendarEvent } from "../../../src/types";

describe("TimeEngine - Expansion Logic", () => {
  const adapter = new DayJsAdapter();
  const engine = new TimeEngine(adapter, 60, true, 0, DEFAULT_DATE_FORMATS);

  it("should expand event to fill empty columns to the right", () => {
    // Scenario:
    // A: 10:00-10:15 (Col 0) - Long enough to group everything
    // B: 10:00-10:05 (Col 1)
    // C: 10:00-10:05 (Col 2)
    // D: 10:10-10:20 (Col 1) - Reuses Col 1 after B ends.
    // Col 2 is free after 10:05.
    // So D should expand to cover Col 2.
    
    const events: CalendarEvent[] = [
      { id: "A", title: "A", start: "2025-11-20 10:00", end: "2025-11-20 10:15", color: "red" },
      { id: "B", title: "B", start: "2025-11-20 10:00", end: "2025-11-20 10:05", color: "blue" },
      { id: "C", title: "C", start: "2025-11-20 10:00", end: "2025-11-20 10:05", color: "green" },
      { id: "D", title: "D", start: "2025-11-20 10:10", end: "2025-11-20 10:20", color: "yellow" },
    ];

    const layout = engine.calculateLayout(events, "2025-11-20");

    const eventD = layout.find(l => l.event.id === "D")!;
    
    // 3 columns total
    // Col 0: A
    // Col 1: B, D
    // Col 2: C
    
    expect(eventD.colIndex).toBe(1);
    
    // Offset = 33.33%
    expect(eventD.leftPercent).toBeCloseTo(33.33, 1);
    
    // D should expand to cover Col 2.
    // Col 1 + Col 2.
    // Since Col 2 is the last column, D extends to the edge (100%).
    // Width = 100 - 33.33 = 66.67%
    
    expect(eventD.widthPercent).toBeCloseTo(66.67, 1);
  });
  
  it("should not expand if collision exists", () => {
    // Add E in Col 2 (10:10-10:20)
    const events: CalendarEvent[] = [
      { id: "A", title: "A", start: "2025-11-20 10:00", end: "2025-11-20 10:15", color: "red" },
      { id: "B", title: "B", start: "2025-11-20 10:00", end: "2025-11-20 10:05", color: "blue" },
      { id: "C", title: "C", start: "2025-11-20 10:00", end: "2025-11-20 10:05", color: "green" },
      { id: "D", title: "D", start: "2025-11-20 10:10", end: "2025-11-20 10:20", color: "yellow" },
      { id: "E", title: "E", start: "2025-11-20 10:10", end: "2025-11-20 10:20", color: "purple" },
    ];

    const layout = engine.calculateLayout(events, "2025-11-20");
    const eventD = layout.find(l => l.event.id === "D")!;
    const eventE = layout.find(l => l.event.id === "E")!;
    
    // Greedy packing:
    // A -> 0.
    // B -> 1.
    // C -> 2.
    // D -> 1 (free after 5).
    // E -> 2 (free after 5).
    
    expect(eventD.colIndex).toBe(1);
    expect(eventE.colIndex).toBe(2);
    
    // D checks Col 2. E is there. Collision.
    // D should NOT expand.
    // Width = baseWidth (~53%).
    
    expect(eventD.widthPercent).toBeCloseTo(53.33, 1);
    
    // E is in last column (Col 2).
    // Width = 100 - 66.66 = 33.33%
    expect(eventE.widthPercent).toBeCloseTo(33.33, 1);
  });
});