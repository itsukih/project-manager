'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Check } from 'lucide-react';
import { TaskWithRelations } from '@/types';
import { Button } from '@/components/ui/Button';
import { TaskModal } from '@/components/TaskModal';

export default function CalendarPage() {
  const [tasks, setTasks] = useState<TaskWithRelations[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedTask, setSelectedTask] = useState<TaskWithRelations | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [dayTasksModalOpen, setDayTasksModalOpen] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/tasks?includeCompleted=true');
      if (response.ok) {
        const data = await response.json();
        setTasks(data);
      }
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTask(null);
    fetchTasks();
  };

  const handleTaskClick = (task: TaskWithRelations) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const handleToggleComplete = async (task: TaskWithRelations, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...task,
          completed: !task.completed,
          order: task.order,
        }),
      });
      if (response.ok) {
        fetchTasks();
      }
    } catch (err) {
      console.error('Failed to toggle task:', err);
    }
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleDayClick = (day: Date) => {
    setSelectedDay(day);
    setDayTasksModalOpen(true);
  };

  const getTasksForDay = (day: Date) => {
    const dayStr = day.toDateString();
    return tasks.filter(task => {
      if (!task.startDate && !task.dueDate) return false;
      const start = task.startDate ? new Date(task.startDate) : null;
      const end = task.dueDate ? new Date(task.dueDate) : null;

      if (start && end) {
        return day >= new Date(start.toDateString()) && day <= new Date(end.toDateString());
      } else if (start) {
        return dayStr === start.toDateString();
      } else if (end) {
        return dayStr === end.toDateString();
      }
      return false;
    });
  };

  // カレンダーのグリッドを生成
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDate.getDay());

    const days = [];
    const current = new Date(startDate);

    for (let i = 0; i < 42; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return days;
  };

  // 週ごとにタスクの期間バーを計算
  const getTaskBarsForWeek = (weekStart: Date) => {
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart);
      day.setDate(day.getDate() + i);
      weekDays.push(day);
    }

    const taskBars: Array<{
      task: TaskWithRelations;
      startCol: number;
      span: number;
      row: number;
    }> = [];

    // 各行で使用されている列の範囲を記録
    const rowOccupancy: Array<Array<{ start: number; end: number }>> = [];

    tasks.forEach(task => {
      if (!task.startDate && !task.dueDate) return;

      const taskStart = task.startDate ? new Date(task.startDate) : null;
      const taskEnd = task.dueDate ? new Date(task.dueDate) : null;

      const startDate = taskStart || taskEnd;
      const endDate = taskEnd || taskStart;

      if (!startDate || !endDate) return;

      // ローカルの日付文字列を取得（タイムゾーンの影響を避ける）
      const getLocalDateStr = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      const startDateStr = getLocalDateStr(startDate);
      const endDateStr = getLocalDateStr(endDate);

      // この週で表示する範囲を計算
      let startCol = -1;
      let endCol = -1;

      weekDays.forEach((day, index) => {
        const dayStr = getLocalDateStr(day);
        if (dayStr >= startDateStr && dayStr <= endDateStr) {
          if (startCol === -1) startCol = index;
          endCol = index;
        }
      });

      if (startCol !== -1 && endCol !== -1) {
        // 重複しない行を探す
        let row = 0;
        let foundRow = false;

        while (!foundRow) {
          if (!rowOccupancy[row]) {
            rowOccupancy[row] = [];
          }

          // この行で重複するタスクがあるかチェック
          const hasOverlap = rowOccupancy[row].some(occupied => {
            return !(endCol < occupied.start || startCol > occupied.end);
          });

          if (!hasOverlap) {
            // この行を使用
            rowOccupancy[row].push({ start: startCol, end: endCol });
            foundRow = true;
          } else {
            row++;
          }
        }

        taskBars.push({
          task,
          startCol,
          span: endCol - startCol + 1,
          row
        });
      }
    });

    return taskBars;
  };

  const calendarDays = generateCalendarDays();
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">カレンダー</h1>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="h-5 w-5 mr-2" />
          タスク作成
        </Button>
      </div>

      {/* カレンダーコントロール */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {year}年 {month + 1}月
            </h2>
            <Button variant="secondary" onClick={handleToday}>
              今日
            </Button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handlePrevMonth}
              className="p-2 hover:bg-gray-100 rounded-md"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-2 hover:bg-gray-100 rounded-md"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* カレンダーグリッド */}
      <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
        {/* 曜日ヘッダー */}
        <div className="grid grid-cols-7 border-b border-gray-200">
          {['日', '月', '火', '水', '木', '金', '土'].map((day, i) => (
            <div
              key={day}
              className={`p-2 text-center text-sm font-semibold ${
                i === 0 ? 'text-red-600' : i === 6 ? 'text-blue-600' : 'text-gray-700'
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* 週ごとの日付グリッド */}
        {Array.from({ length: 6 }).map((_, weekIndex) => {
          const weekStart = calendarDays[weekIndex * 7];
          const weekDays = calendarDays.slice(weekIndex * 7, (weekIndex + 1) * 7);
          const allTaskBars = getTaskBarsForWeek(weekStart);
          const MAX_VISIBLE_ROWS = 2;
          const taskBars = allTaskBars.filter(bar => bar.row < MAX_VISIBLE_ROWS);
          const hiddenCount = allTaskBars.length - taskBars.length;

          return (
            <div key={weekIndex} className="border-b border-gray-200 last:border-b-0">
              {/* 日付セル */}
              <div className="grid grid-cols-7 relative">
                {weekDays.map((day, dayIndex) => {
                  const isCurrentMonth = day.getMonth() === month;
                  const isToday = day.toDateString() === new Date().toDateString();
                  const dayOfWeek = day.getDay();
                  const dayTasks = getTasksForDay(day);
                  const hasMoreTasks = dayTasks.length > 0 && hiddenCount > 0;

                  return (
                    <div
                      key={dayIndex}
                      className={`min-h-[100px] border-r border-gray-200 last:border-r-0 p-2 relative ${
                        !isCurrentMonth ? 'bg-gray-50' : 'bg-white'
                      } ${dayTasks.length > 0 ? 'cursor-pointer hover:bg-gray-50' : ''}`}
                      onClick={() => dayTasks.length > 0 && handleDayClick(day)}
                    >
                      {/* 日付 */}
                      <div
                        className={`text-sm mb-1 ${
                          isToday
                            ? 'bg-orange-500 text-white rounded-full w-6 h-6 flex items-center justify-center font-bold'
                            : dayOfWeek === 0
                            ? 'text-red-600'
                            : dayOfWeek === 6
                            ? 'text-blue-600'
                            : isCurrentMonth
                            ? 'text-gray-700'
                            : 'text-gray-400'
                        }`}
                      >
                        {day.getDate()}
                      </div>

                      {/* タスク数表示（タスクがある場合） */}
                      {dayTasks.length > 0 && (
                        <div className="absolute top-1 right-1 text-xs bg-blue-500 text-white px-2 py-1 rounded-full font-semibold shadow-sm z-10">
                          {dayTasks.length}件
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* タスク期間バー（オーバーレイ） */}
                <div className="absolute inset-0 pointer-events-none" style={{ top: '32px' }}>
                  <div className="relative h-full">
                    {taskBars.map((bar, barIndex) => {
                      const getCategoryColor = (category: string) => {
                        switch (category) {
                          case 'PROJECT':
                            return 'bg-blue-200 hover:bg-blue-300 border-blue-400 text-blue-900';
                          case 'ADMIN':
                            return 'bg-green-200 hover:bg-green-300 border-green-400 text-green-900';
                          case 'SALES':
                            return 'bg-purple-200 hover:bg-purple-300 border-purple-400 text-purple-900';
                          default:
                            return 'bg-orange-200 hover:bg-orange-300 border-orange-400 text-orange-900';
                        }
                      };

                      return (
                        <div
                          key={barIndex}
                          className="absolute pointer-events-auto group"
                          style={{
                            left: `${(bar.startCol / 7) * 100}%`,
                            width: `${(bar.span / 7) * 100}%`,
                            top: `${bar.row * 28}px`,
                            height: '24px',
                            padding: '2px 4px'
                          }}
                        >
                          <div
                            className={`h-full rounded border-l-4 px-2 text-xs flex items-center gap-2 cursor-pointer ${getCategoryColor(bar.task.category)} ${bar.task.completed ? 'opacity-50 line-through' : ''}`}
                            title={`${bar.task.title}\n開始: ${bar.task.startDate ? new Date(bar.task.startDate).toLocaleDateString('ja-JP') : ''}\n終了: ${bar.task.dueDate ? new Date(bar.task.dueDate).toLocaleDateString('ja-JP') : ''}`}
                          >
                            {/* チェックボックス */}
                            <button
                              onClick={(e) => handleToggleComplete(bar.task, e)}
                              className={`flex-shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center ${
                                bar.task.completed
                                  ? 'bg-green-500 border-green-500'
                                  : 'border-gray-400 hover:border-gray-600'
                              }`}
                            >
                              {bar.task.completed && <Check className="h-3 w-3 text-white" />}
                            </button>

                            {/* タスク名 */}
                            <div
                              onClick={() => handleTaskClick(bar.task)}
                              className="flex-1 truncate"
                            >
                              {bar.task.title}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* タスク編集モーダル */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        task={selectedTask}
      />

      {/* 日付のタスク一覧モーダル */}
      {dayTasksModalOpen && selectedDay && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">
                {selectedDay.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}のタスク
              </h2>
              <button
                onClick={() => setDayTasksModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="overflow-y-auto p-4 space-y-2">
              {getTasksForDay(selectedDay).map(task => {
                const getCategoryColor = (category: string) => {
                  switch (category) {
                    case 'PROJECT':
                      return 'bg-blue-100 border-blue-400 text-blue-900';
                    case 'ADMIN':
                      return 'bg-green-100 border-green-400 text-green-900';
                    case 'SALES':
                      return 'bg-purple-100 border-purple-400 text-purple-900';
                    default:
                      return 'bg-orange-100 border-orange-400 text-orange-900';
                  }
                };

                return (
                  <div
                    key={task.id}
                    className={`p-3 rounded border-l-4 ${getCategoryColor(task.category)} ${task.completed ? 'opacity-50 line-through' : ''} cursor-pointer hover:shadow-md transition-shadow`}
                    onClick={() => {
                      setDayTasksModalOpen(false);
                      handleTaskClick(task);
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleComplete(task, e);
                        }}
                        className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center ${
                          task.completed
                            ? 'bg-green-500 border-green-500'
                            : 'border-gray-400 hover:border-gray-600'
                        }`}
                      >
                        {task.completed && <Check className="h-4 w-4 text-white" />}
                      </button>
                      <div className="flex-1">
                        <div className="font-medium">{task.title}</div>
                        {(task.startDate || task.dueDate) && (
                          <div className="text-xs text-gray-600 mt-1">
                            {task.startDate && `開始: ${new Date(task.startDate).toLocaleDateString('ja-JP')}`}
                            {task.startDate && task.dueDate && ' 〜 '}
                            {task.dueDate && `終了: ${new Date(task.dueDate).toLocaleDateString('ja-JP')}`}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {getTasksForDay(selectedDay).length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  この日のタスクはありません
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
