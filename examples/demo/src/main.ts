import { Calendar } from '../../../src';
import type { CalendarEvent } from '../../../src/types';

// Initialize calendar
const calendar = new Calendar('#app', {
  view: { type: 'week', showDateHeader: true },
  events: getInitialEvents(),
  draggable: { enabled: true, snapMinutes: 15 },
  theme: {
    primaryColor: '#3b82f6',
    cellHeight: 60
  },
  onEventClick: (event) => {
    log(`点击事件: ${event.title} (${event.id})`);
  },
  onEventDrop: (event, newStart, newEnd) => {
    log(`事件移动: ${event.title}\n  从: ${event.start}\n  到: ${newStart} - ${newEnd}`);
  },
  onViewChange: (viewType) => {
    log(`视图切换: ${viewType}`);
  },
  onDateChange: (date) => {
    log(`日期导航: ${date}`);
  }
});

// Helper functions
function getInitialEvents(): CalendarEvent[] {
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());

  return [
    {
      id: '1',
      title: '冲刺会议',
      start: formatDate(addDays(startOfWeek, 1), 10, 0),
      end: formatDate(addDays(startOfWeek, 1), 11, 30),
      color: '#3b82f6'
    },
    {
      id: '2',
      title: '技术评审',
      start: formatDate(addDays(startOfWeek, 1), 10, 30),
      end: formatDate(addDays(startOfWeek, 1), 12, 0),
      color: '#6366f1'
    },
    {
      id: '3',
      title: '长期项目 (跨天)',
      start: formatDate(addDays(startOfWeek, -1), 0, 0),
      end: formatDate(addDays(startOfWeek, 2), 0, 0),
      color: '#a855f7'
    },
    {
      id: '4',
      title: '午餐',
      start: formatDate(addDays(startOfWeek, 2), 12, 0),
      end: formatDate(addDays(startOfWeek, 2), 13, 0),
      color: '#22c55e'
    },
    {
      id: '5',
      title: '代码评审',
      start: formatDate(addDays(startOfWeek, 3), 14, 0),
      end: formatDate(addDays(startOfWeek, 3), 16, 0),
      color: '#ef4444'
    },
    {
      id: '6',
      title: '周五总结',
      start: formatDate(addDays(startOfWeek, 5), 16, 0),
      end: formatDate(addDays(startOfWeek, 5), 17, 0),
      color: '#f97316'
    }
  ];
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function formatDate(date: Date, hours: number, minutes: number): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const h = String(hours).padStart(2, '0');
  const m = String(minutes).padStart(2, '0');
  return `${year}-${month}-${day} ${h}:${m}`;
}

function log(message: string): void {
  const logEl = document.getElementById('log');
  if (logEl) {
    const timestamp = new Date().toLocaleTimeString();
    logEl.textContent = `[${timestamp}] ${message}\n\n${logEl.textContent}`;
  }
}

// Global functions for demo controls
let eventCounter = 100;

(window as any).addRandomEvent = () => {
  const colors = ['#3b82f6', '#22c55e', '#ef4444', '#f97316', '#8b5cf6', '#ec4899'];
  const titles = ['新会议', '工作任务', '电话会议', '项目讨论', '培训', '面试'];

  const today = new Date();
  const hour = Math.floor(Math.random() * 8) + 9; // 9-16
  const duration = Math.floor(Math.random() * 3) + 1; // 1-3 hours

  const event: CalendarEvent = {
    id: String(++eventCounter),
    title: titles[Math.floor(Math.random() * titles.length)]!,
    start: formatDate(today, hour, 0),
    end: formatDate(today, hour + duration, 0),
    color: colors[Math.floor(Math.random() * colors.length)]
  };

  calendar.addEvent(event);
  log(`添加事件: ${event.title} (${event.start})`);
};

(window as any).clearEvents = () => {
  calendar.setEvents([]);
  log('已清空所有事件');
};

let dragEnabled = true;
(window as any).toggleDrag = () => {
  dragEnabled = !dragEnabled;
  // Note: This would require re-initializing the calendar with new config
  // For demo purposes, we just log the action
  log(`拖拽功能: ${dragEnabled ? '已启用' : '已禁用'} (需要重新初始化生效)`);
};

// Initial log
log('日历初始化完成');
