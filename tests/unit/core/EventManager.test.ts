import { describe, it, expect, beforeEach } from 'vitest';
import { EventManager } from '../../../src/core/EventManager';
import type { CalendarEvent } from '../../../src/types';

describe('EventManager', () => {
  let manager: EventManager;

  beforeEach(() => {
    manager = new EventManager();
  });

  describe('constructor', () => {
    it('should initialize with empty events', () => {
      expect(manager.getEvents()).toHaveLength(0);
      expect(manager.count).toBe(0);
    });

    it('should initialize with provided events', () => {
      const events: CalendarEvent[] = [
        { id: '1', title: 'Event 1', start: '2025-11-20 10:00', end: '2025-11-20 11:00' }
      ];
      const mgr = new EventManager(events);

      expect(mgr.getEvents()).toHaveLength(1);
      expect(mgr.count).toBe(1);
    });
  });

  describe('addEvent', () => {
    it('should add event', () => {
      const event: CalendarEvent = {
        id: '1',
        title: 'Test Event',
        start: '2025-11-20 10:00',
        end: '2025-11-20 11:00'
      };

      manager.addEvent(event);

      expect(manager.getEvents()).toHaveLength(1);
      expect(manager.findEvent('1')).toEqual(event);
    });

    it('should add multiple events', () => {
      manager.addEvent({ id: '1', title: 'Event 1', start: '2025-11-20 10:00', end: '2025-11-20 11:00' });
      manager.addEvent({ id: '2', title: 'Event 2', start: '2025-11-21 10:00', end: '2025-11-21 11:00' });

      expect(manager.count).toBe(2);
    });
  });

  describe('removeEvent', () => {
    beforeEach(() => {
      manager.addEvent({ id: '1', title: 'Event 1', start: '2025-11-20 10:00', end: '2025-11-20 11:00' });
      manager.addEvent({ id: '2', title: 'Event 2', start: '2025-11-21 10:00', end: '2025-11-21 11:00' });
    });

    it('should remove event by id', () => {
      const result = manager.removeEvent('1');

      expect(result).toBe(true);
      expect(manager.count).toBe(1);
      expect(manager.findEvent('1')).toBeUndefined();
    });

    it('should return false for non-existent id', () => {
      const result = manager.removeEvent('999');

      expect(result).toBe(false);
      expect(manager.count).toBe(2);
    });
  });

  describe('updateEvent', () => {
    beforeEach(() => {
      manager.addEvent({
        id: '1',
        title: 'Original',
        start: '2025-11-20 10:00',
        end: '2025-11-20 11:00',
        color: '#3b82f6'
      });
    });

    it('should update event properties', () => {
      const result = manager.updateEvent('1', { title: 'Updated' });

      expect(result).toBe(true);
      expect(manager.findEvent('1')?.title).toBe('Updated');
    });

    it('should update multiple properties', () => {
      manager.updateEvent('1', {
        title: 'Updated',
        start: '2025-11-20 14:00',
        end: '2025-11-20 15:00'
      });

      const event = manager.findEvent('1');
      expect(event?.title).toBe('Updated');
      expect(event?.start).toBe('2025-11-20 14:00');
      expect(event?.end).toBe('2025-11-20 15:00');
    });

    it('should preserve unupdated properties', () => {
      manager.updateEvent('1', { title: 'Updated' });

      const event = manager.findEvent('1');
      expect(event?.color).toBe('#3b82f6');
    });

    it('should return false for non-existent id', () => {
      const result = manager.updateEvent('999', { title: 'Updated' });
      expect(result).toBe(false);
    });
  });

  describe('getEvents', () => {
    it('should return copy of events', () => {
      manager.addEvent({ id: '1', title: 'Event 1', start: '2025-11-20 10:00', end: '2025-11-20 11:00' });

      const events = manager.getEvents();
      events.push({ id: '2', title: 'Event 2', start: '2025-11-21 10:00', end: '2025-11-21 11:00' });

      // Original should not be affected
      expect(manager.count).toBe(1);
    });
  });

  describe('findEvent', () => {
    it('should find event by id', () => {
      const event = { id: '1', title: 'Event 1', start: '2025-11-20 10:00', end: '2025-11-20 11:00' };
      manager.addEvent(event);

      expect(manager.findEvent('1')).toEqual(event);
    });

    it('should return undefined for non-existent id', () => {
      expect(manager.findEvent('999')).toBeUndefined();
    });
  });

  describe('clear', () => {
    it('should remove all events', () => {
      manager.addEvent({ id: '1', title: 'Event 1', start: '2025-11-20 10:00', end: '2025-11-20 11:00' });
      manager.addEvent({ id: '2', title: 'Event 2', start: '2025-11-21 10:00', end: '2025-11-21 11:00' });

      manager.clear();

      expect(manager.count).toBe(0);
      expect(manager.getEvents()).toHaveLength(0);
    });
  });

  describe('setEvents', () => {
    it('should replace all events', () => {
      manager.addEvent({ id: '1', title: 'Old', start: '2025-11-20 10:00', end: '2025-11-20 11:00' });

      const newEvents = [
        { id: '2', title: 'New 1', start: '2025-11-21 10:00', end: '2025-11-21 11:00' },
        { id: '3', title: 'New 2', start: '2025-11-22 10:00', end: '2025-11-22 11:00' }
      ];

      manager.setEvents(newEvents);

      expect(manager.count).toBe(2);
      expect(manager.findEvent('1')).toBeUndefined();
      expect(manager.findEvent('2')).toBeDefined();
    });
  });
});
