import { describe, it, expect } from 'vitest';
import { MonthEngine } from '../../../src/engines/MonthEngine';
import { DayJsAdapter } from '../../../src/adapters/DayJsAdapter';
import type { CalendarEvent } from '../../../src/types';

describe('MonthEngine', () => {
  const adapter = new DayJsAdapter();
  const engine = new MonthEngine(adapter);

  describe('generateGrid', () => {
    it('should generate grid with correct number of weeks', () => {
      const date = adapter.create('2025-11-20');
      const grid = engine.generateGrid(date);

      // November 2025 should have 5 or 6 weeks depending on start day
      expect(grid.length).toBeGreaterThanOrEqual(4);
      expect(grid.length).toBeLessThanOrEqual(6);
    });

    it('should have 7 days per week', () => {
      const date = adapter.create('2025-11-20');
      const grid = engine.generateGrid(date);

      for (const week of grid) {
        expect(week).toHaveLength(7);
      }
    });

    it('should start week on Sunday', () => {
      const date = adapter.create('2025-11-20');
      const grid = engine.generateGrid(date);

      const firstDay = grid[0]![0]!;
      expect(adapter.day(firstDay.date)).toBe(0); // Sunday
    });

    it('should include dateStr for each cell', () => {
      const date = adapter.create('2025-11-20');
      const grid = engine.generateGrid(date);

      for (const week of grid) {
        for (const day of week) {
          expect(day.dateStr).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        }
      }
    });
  });

  describe('calculateLayout', () => {
    const weekStart = adapter.create('2025-11-16'); // Sunday
    const weekEnd = adapter.create('2025-11-22'); // Saturday

    it('should return empty array for no events', () => {
      const layout = engine.calculateLayout([], weekStart, weekEnd);
      expect(layout).toHaveLength(0);
    });

    it('should calculate layout for single event', () => {
      const events: CalendarEvent[] = [
        {
          id: '1',
          title: 'Test Event',
          start: '2025-11-17 10:00',
          end: '2025-11-17 11:00',
          color: '#3b82f6'
        }
      ];

      const layout = engine.calculateLayout(events, weekStart, weekEnd);

      expect(layout).toHaveLength(1);
      expect(layout[0]!.event.id).toBe('1');
      expect(layout[0]!.startIdx).toBe(1); // Monday = index 1
      expect(layout[0]!.span).toBe(1);
      expect(layout[0]!.slot).toBe(0);
    });

    it('should calculate layout for multi-day event', () => {
      const events: CalendarEvent[] = [
        {
          id: '1',
          title: 'Multi-day',
          start: '2025-11-17 10:00',
          end: '2025-11-19 11:00',
          color: '#3b82f6'
        }
      ];

      const layout = engine.calculateLayout(events, weekStart, weekEnd);

      expect(layout).toHaveLength(1);
      expect(layout[0]!.startIdx).toBe(1);
      expect(layout[0]!.span).toBe(3); // Mon-Wed
    });

    it('should allocate different slots for overlapping events', () => {
      const events: CalendarEvent[] = [
        {
          id: '1',
          title: 'Event 1',
          start: '2025-11-17 10:00',
          end: '2025-11-19 11:00',
          color: '#3b82f6'
        },
        {
          id: '2',
          title: 'Event 2',
          start: '2025-11-18 10:00',
          end: '2025-11-18 11:00',
          color: '#22c55e'
        }
      ];

      const layout = engine.calculateLayout(events, weekStart, weekEnd);

      expect(layout).toHaveLength(2);
      // First event should be in slot 0, second in slot 1
      const slots = layout.map(l => l.slot);
      expect(slots).toContain(0);
      expect(slots).toContain(1);
    });

    it('should handle event spanning beyond week', () => {
      const events: CalendarEvent[] = [
        {
          id: '1',
          title: 'Cross-week',
          start: '2025-11-14 10:00', // Before week start
          end: '2025-11-24 11:00', // After week end
          color: '#3b82f6'
        }
      ];

      const layout = engine.calculateLayout(events, weekStart, weekEnd);

      expect(layout).toHaveLength(1);
      expect(layout[0]!.startIdx).toBe(0);
      expect(layout[0]!.span).toBe(7);
      expect(layout[0]!.isStart).toBe(false);
      expect(layout[0]!.isEnd).toBe(false);
    });

    it('should mark isStart and isEnd correctly', () => {
      const events: CalendarEvent[] = [
        {
          id: '1',
          title: 'Full event',
          start: '2025-11-18 10:00',
          end: '2025-11-19 11:00',
          color: '#3b82f6'
        }
      ];

      const layout = engine.calculateLayout(events, weekStart, weekEnd);

      expect(layout[0]!.isStart).toBe(true);
      expect(layout[0]!.isEnd).toBe(true);
    });

    it('should filter out events outside the week', () => {
      const events: CalendarEvent[] = [
        {
          id: '1',
          title: 'Outside',
          start: '2025-11-10 10:00',
          end: '2025-11-11 11:00',
          color: '#3b82f6'
        }
      ];

      const layout = engine.calculateLayout(events, weekStart, weekEnd);
      expect(layout).toHaveLength(0);
    });
  });

  describe('getWeekCount', () => {
    it('should return correct week count', () => {
      const date = adapter.create('2025-11-20');
      const count = engine.getWeekCount(date);

      expect(count).toBeGreaterThanOrEqual(4);
      expect(count).toBeLessThanOrEqual(6);
    });
  });
});
