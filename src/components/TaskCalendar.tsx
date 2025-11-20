'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { TaskWithRelations, TASK_PRIORITY_LABELS } from '@/types';
import { clsx } from 'clsx';

interface TaskCalendarProps {
  tasks: TaskWithRelations[];
  onTaskClick?: (task: TaskWithRelations) => void;
  onTaskToggle?: (task: TaskWithRelations) => void;
}

export function TaskCalendar({ tasks, onTaskClick, onTaskToggle }: TaskCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // 月の最初の日と最後の日
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  // カレンダーの開始日（前月の日付を含む）
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay());

  // カレンダーの終了日（次月の日付を含む）
  const endDate = new Date(lastDay);
  endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()));

  // カレンダーの日付配列を生成
  const days: Date[] = [];
  const current = new Date(startDate);
  while (current <= endDate) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  // 各日付のタスクを取得
  const getTasksForDate = (date: Date) => {
    return tasks.filter(task => {
      if (!task.dueDate) return false;
      const taskDate = new Date(task.dueDate);
      return (
        taskDate.getFullYear() === date.getFullYear() &&
        taskDate.getMonth() === date.getMonth() &&
        taskDate.getDate() === date.getDate()
      );
    });
  };

  // 前月へ
  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  // 次月へ
  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // 今日の日付
  const today = new Date();
  const isToday = (date: Date) => {
    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    );
  };

  return (
    <div className="bg-white rounded-lg border p-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          {year}年{month + 1}月
        </h3>
        <div className="flex gap-2">
          <button
            onClick={prevMonth}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={nextMonth}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* 曜日ヘッダー */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['日', '月', '火', '水', '木', '金', '土'].map((day, i) => (
          <div
            key={day}
            className={clsx(
              'text-center text-sm font-medium py-2',
              i === 0 ? 'text-red-600' : i === 6 ? 'text-blue-600' : 'text-gray-700'
            )}
          >
            {day}
          </div>
        ))}
      </div>

      {/* カレンダー本体 */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((date, i) => {
          const dayTasks = getTasksForDate(date);
          const isCurrentMonth = date.getMonth() === month;
          const isSunday = date.getDay() === 0;
          const isSaturday = date.getDay() === 6;

          return (
            <div
              key={i}
              className={clsx(
                'min-h-[80px] border rounded p-1',
                isCurrentMonth ? 'bg-white' : 'bg-gray-50',
                isToday(date) && 'ring-2 ring-orange-500'
              )}
            >
              <div
                className={clsx(
                  'text-sm font-medium mb-1',
                  !isCurrentMonth && 'text-gray-400',
                  isCurrentMonth && isSunday && 'text-red-600',
                  isCurrentMonth && isSaturday && 'text-blue-600',
                  isCurrentMonth && !isSunday && !isSaturday && 'text-gray-700',
                  isToday(date) && 'font-bold'
                )}
              >
                {date.getDate()}
              </div>
              <div className="space-y-1">
                {dayTasks.slice(0, 3).map((task) => {
                  const taskTime = task.dueDate ? new Date(task.dueDate) : null;
                  const timeStr = taskTime
                    ? `${taskTime.getHours().toString().padStart(2, '0')}:${taskTime.getMinutes().toString().padStart(2, '0')}`
                    : '';

                  return (
                    <div
                      key={task.id}
                      className={clsx(
                        'flex items-center gap-1 px-1 py-0.5 rounded text-xs',
                        task.completed
                          ? 'bg-gray-200 text-gray-600'
                          : task.priority === 'URGENT'
                          ? 'bg-red-100 text-red-700'
                          : task.priority === 'HIGH'
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-blue-100 text-blue-700'
                      )}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onTaskToggle?.(task);
                        }}
                        className={clsx(
                          'flex-shrink-0 w-3 h-3 rounded-sm border flex items-center justify-center',
                          task.completed
                            ? 'bg-green-500 border-green-500'
                            : 'border-current hover:bg-current hover:bg-opacity-20'
                        )}
                      >
                        {task.completed && <Check className="h-2 w-2 text-white" />}
                      </button>
                      {timeStr && <span className="text-[10px] font-medium">{timeStr}</span>}
                      <button
                        onClick={() => onTaskClick?.(task)}
                        className={clsx(
                          'flex-1 truncate text-left hover:opacity-80',
                          task.completed && 'line-through'
                        )}
                        title={task.title}
                      >
                        {task.title}
                      </button>
                    </div>
                  );
                })}
                {dayTasks.length > 3 && (
                  <div className="text-xs text-gray-500 text-center">
                    +{dayTasks.length - 3}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
