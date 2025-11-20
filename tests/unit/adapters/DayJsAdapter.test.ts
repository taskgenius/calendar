import { describe, it, expect } from 'vitest';
import { DayJsAdapter } from '../../../src/adapters/DayJsAdapter';

describe('DayJsAdapter', () => {
  const adapter = new DayJsAdapter();

  describe('create', () => {
    it('should create date from string', () => {
      const date = adapter.create('2025-11-20');
      expect(adapter.format(date, 'YYYY-MM-DD')).toBe('2025-11-20');
    });

    it('should create current date when no argument', () => {
      const date = adapter.create();
      expect(date).toBeDefined();
    });

    it('should create date from Date object', () => {
      const jsDate = new Date(2025, 10, 20);
      const date = adapter.create(jsDate);
      expect(adapter.format(date, 'YYYY-MM-DD')).toBe('2025-11-20');
    });
  });

  describe('format', () => {
    it('should format date correctly', () => {
      const date = adapter.create('2025-11-20 14:30');
      expect(adapter.format(date, 'YYYY-MM-DD')).toBe('2025-11-20');
      expect(adapter.format(date, 'HH:mm')).toBe('14:30');
      expect(adapter.format(date, 'YYYY年M月D日')).toBe('2025年11月20日');
    });
  });

  describe('getters', () => {
    const date = adapter.create('2025-11-20 14:30');

    it('should get year', () => {
      expect(adapter.year(date)).toBe(2025);
    });

    it('should get month (0-indexed)', () => {
      expect(adapter.month(date)).toBe(10); // November = 10
    });

    it('should get date', () => {
      expect(adapter.date(date)).toBe(20);
    });

    it('should get day of week', () => {
      expect(adapter.day(date)).toBe(4); // Thursday
    });

    it('should get hour', () => {
      expect(adapter.hour(date)).toBe(14);
    });

    it('should get minute', () => {
      expect(adapter.minute(date)).toBe(30);
    });
  });

  describe('setters', () => {
    it('should set hour', () => {
      const date = adapter.create('2025-11-20 14:30');
      const newDate = adapter.setHour(date, 16);
      expect(adapter.hour(newDate)).toBe(16);
      expect(adapter.minute(newDate)).toBe(30); // minute unchanged
    });

    it('should set minute', () => {
      const date = adapter.create('2025-11-20 14:30');
      const newDate = adapter.setMinute(date, 45);
      expect(adapter.hour(newDate)).toBe(14); // hour unchanged
      expect(adapter.minute(newDate)).toBe(45);
    });
  });

  describe('add', () => {
    it('should add days', () => {
      const date = adapter.create('2025-11-20');
      const next = adapter.add(date, 1, 'day');
      expect(adapter.format(next, 'YYYY-MM-DD')).toBe('2025-11-21');
    });

    it('should add weeks', () => {
      const date = adapter.create('2025-11-20');
      const next = adapter.add(date, 1, 'week');
      expect(adapter.format(next, 'YYYY-MM-DD')).toBe('2025-11-27');
    });

    it('should add months', () => {
      const date = adapter.create('2025-11-20');
      const next = adapter.add(date, 1, 'month');
      expect(adapter.format(next, 'YYYY-MM-DD')).toBe('2025-12-20');
    });

    it('should handle negative values', () => {
      const date = adapter.create('2025-11-20');
      const prev = adapter.add(date, -5, 'day');
      expect(adapter.format(prev, 'YYYY-MM-DD')).toBe('2025-11-15');
    });
  });

  describe('diff', () => {
    it('should calculate day difference', () => {
      const d1 = adapter.create('2025-11-20');
      const d2 = adapter.create('2025-11-25');
      expect(adapter.diff(d2, d1, 'day')).toBe(5);
    });

    it('should calculate minute difference', () => {
      const d1 = adapter.create('2025-11-20 10:00');
      const d2 = adapter.create('2025-11-20 11:30');
      expect(adapter.diff(d2, d1, 'minute')).toBe(90);
    });

    it('should handle negative differences', () => {
      const d1 = adapter.create('2025-11-25');
      const d2 = adapter.create('2025-11-20');
      expect(adapter.diff(d2, d1, 'day')).toBe(-5);
    });
  });

  describe('startOf/endOf', () => {
    it('should get start of week', () => {
      const date = adapter.create('2025-11-20'); // Thursday
      const start = adapter.startOf(date, 'week');
      expect(adapter.day(start)).toBe(0); // Sunday
    });

    it('should get start of month', () => {
      const date = adapter.create('2025-11-20');
      const start = adapter.startOf(date, 'month');
      expect(adapter.format(start, 'YYYY-MM-DD')).toBe('2025-11-01');
    });

    it('should get end of month', () => {
      const date = adapter.create('2025-11-20');
      const end = adapter.endOf(date, 'month');
      expect(adapter.date(end)).toBe(30);
    });
  });

  describe('comparisons', () => {
    const d1 = adapter.create('2025-11-20');
    const d2 = adapter.create('2025-11-25');
    const d3 = adapter.create('2025-11-20');

    it('should check isBefore', () => {
      expect(adapter.isBefore(d1, d2)).toBe(true);
      expect(adapter.isBefore(d2, d1)).toBe(false);
    });

    it('should check isAfter', () => {
      expect(adapter.isAfter(d2, d1)).toBe(true);
      expect(adapter.isAfter(d1, d2)).toBe(false);
    });

    it('should check isSame', () => {
      expect(adapter.isSame(d1, d3, 'day')).toBe(true);
      expect(adapter.isSame(d1, d2, 'day')).toBe(false);
    });

    it('should check isSame with unit', () => {
      const a = adapter.create('2025-11-20 10:00');
      const b = adapter.create('2025-11-20 15:00');
      expect(adapter.isSame(a, b, 'day')).toBe(true);
      expect(adapter.isSame(a, b, 'hour')).toBe(false);
    });
  });
});
