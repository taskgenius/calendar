/**
 * Test fixtures for calendar events
 */
import type { CalendarEvent } from '../../src/types';

/**
 * Basic test events
 */
export const mockEvents: CalendarEvent[] = [
  {
    id: '1',
    title: '会议',
    start: '2025-11-20 10:00',
    end: '2025-11-20 11:30',
    color: '#3b82f6'
  },
  {
    id: '2',
    title: '午餐',
    start: '2025-11-20 12:00',
    end: '2025-11-20 13:00',
    color: '#22c55e'
  },
  {
    id: '3',
    title: '代码评审',
    start: '2025-11-21 14:00',
    end: '2025-11-21 16:00',
    color: '#ef4444'
  }
];

/**
 * Overlapping events for testing collision layout
 */
export const overlappingEvents: CalendarEvent[] = [
  {
    id: 'o1',
    title: '事件 1',
    start: '2025-11-20 10:00',
    end: '2025-11-20 11:30',
    color: '#3b82f6'
  },
  {
    id: 'o2',
    title: '事件 2',
    start: '2025-11-20 10:30',
    end: '2025-11-20 12:00',
    color: '#6366f1'
  },
  {
    id: 'o3',
    title: '事件 3',
    start: '2025-11-20 11:00',
    end: '2025-11-20 12:30',
    color: '#8b5cf6'
  }
];

/**
 * Multi-day events for month view testing
 */
export const multiDayEvents: CalendarEvent[] = [
  {
    id: 'm1',
    title: '长期项目',
    start: '2025-11-18 00:00',
    end: '2025-11-22 23:59',
    color: '#a855f7'
  },
  {
    id: 'm2',
    title: '周末活动',
    start: '2025-11-22 00:00',
    end: '2025-11-23 23:59',
    color: '#ec4899'
  }
];

/**
 * Events spanning across weeks
 */
export const crossWeekEvents: CalendarEvent[] = [
  {
    id: 'cw1',
    title: '跨周事件',
    start: '2025-11-14 00:00',
    end: '2025-11-24 23:59',
    color: '#f97316'
  }
];

/**
 * Full week of events for comprehensive testing
 */
export const weekOfEvents: CalendarEvent[] = [
  // Sunday
  {
    id: 'w1',
    title: '周日会议',
    start: '2025-11-16 10:00',
    end: '2025-11-16 11:00',
    color: '#3b82f6'
  },
  // Monday
  {
    id: 'w2',
    title: '周一站会',
    start: '2025-11-17 09:00',
    end: '2025-11-17 09:30',
    color: '#22c55e'
  },
  {
    id: 'w3',
    title: '周一项目讨论',
    start: '2025-11-17 14:00',
    end: '2025-11-17 16:00',
    color: '#ef4444'
  },
  // Tuesday - overlapping
  {
    id: 'w4',
    title: '周二培训',
    start: '2025-11-18 10:00',
    end: '2025-11-18 12:00',
    color: '#6366f1'
  },
  {
    id: 'w5',
    title: '周二技术分享',
    start: '2025-11-18 11:00',
    end: '2025-11-18 12:30',
    color: '#8b5cf6'
  },
  // Wednesday
  {
    id: 'w6',
    title: '周三代码评审',
    start: '2025-11-19 15:00',
    end: '2025-11-19 16:30',
    color: '#a855f7'
  },
  // Thursday
  {
    id: 'w7',
    title: '周四冲刺计划',
    start: '2025-11-20 10:00',
    end: '2025-11-20 11:00',
    color: '#ec4899'
  },
  // Friday
  {
    id: 'w8',
    title: '周五总结',
    start: '2025-11-21 16:00',
    end: '2025-11-21 17:00',
    color: '#f97316'
  },
  // Saturday
  {
    id: 'w9',
    title: '周六值班',
    start: '2025-11-22 09:00',
    end: '2025-11-22 12:00',
    color: '#14b8a6'
  }
];
