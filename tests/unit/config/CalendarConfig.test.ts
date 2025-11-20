/**
 * Calendar configuration tests
 */
import { describe, it, expect } from 'vitest';
import { Calendar } from '../../../src/core/Calendar';

describe('CalendarConfig - New Features', () => {
  it('should apply default values for new config options', () => {
    const container = document.createElement('div');
    const calendar = new Calendar(container, {});

    // @ts-expect-error accessing private field for testing
    const config = calendar.config;

    expect(config.view.firstDayOfWeek).toBe(0); // Sunday by default
    expect(config.view.showWeekends).toBe(true);
    expect(config.draggable.dateOnly).toBe(false);
    expect(config.showEventCounts).toBe(false);
  });

  it('should accept custom firstDayOfWeek configuration', () => {
    const container = document.createElement('div');
    const calendar = new Calendar(container, {
      view: {
        type: 'week',
        firstDayOfWeek: 1, // Monday
      },
    });

    // @ts-expect-error accessing private field for testing
    const config = calendar.config;

    expect(config.view.firstDayOfWeek).toBe(1);
  });

  it('should accept showWeekends: false configuration', () => {
    const container = document.createElement('div');
    const calendar = new Calendar(container, {
      view: {
        type: 'month',
        showWeekends: false,
      },
    });

    // @ts-expect-error accessing private field for testing
    const config = calendar.config;

    expect(config.view.showWeekends).toBe(false);
  });

  it('should accept dateOnly drag configuration', () => {
    const container = document.createElement('div');
    const calendar = new Calendar(container, {
      draggable: {
        enabled: true,
        dateOnly: true,
      },
    });

    // @ts-expect-error accessing private field for testing
    const config = calendar.config;

    expect(config.draggable.dateOnly).toBe(true);
  });

  it('should accept showEventCounts configuration', () => {
    const container = document.createElement('div');
    const calendar = new Calendar(container, {
      showEventCounts: true,
    });

    // @ts-expect-error accessing private field for testing
    const config = calendar.config;

    expect(config.showEventCounts).toBe(true);
  });

  it('should accept render hooks', () => {
    const container = document.createElement('div');
    const onRenderDateCell = vi.fn();
    const onStyleEvent = vi.fn();

    const calendar = new Calendar(container, {
      onRenderDateCell,
      onStyleEvent,
    });

    // @ts-expect-error accessing private field for testing
    const config = calendar.config;

    expect(config.onRenderDateCell).toBe(onRenderDateCell);
    expect(config.onStyleEvent).toBe(onStyleEvent);
  });
});
