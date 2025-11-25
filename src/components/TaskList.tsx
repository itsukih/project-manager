'use client';

import { useState, useEffect } from 'react';
import { Plus, GripVertical, Check, ChevronDown, ChevronRight, Edit, Trash2, ListPlus, List, LayoutGrid } from 'lucide-react';
import { TaskWithRelations, TASK_CATEGORY_LABELS, TASK_PRIORITY_LABELS } from '@/types';
import { Button } from '@/components/ui/Button';
import { TaskModal } from './TaskModal';
import { clsx } from 'clsx';

interface TaskListProps {
  categoryFilter?: string;
}

export function TaskList({ categoryFilter }: TaskListProps) {
  const [tasks, setTasks] = useState<TaskWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskWithRelations | null>(null);
  const [parentTaskForSubTask, setParentTaskForSubTask] = useState<TaskWithRelations | null>(null);
  const [draggedTask, setDraggedTask] = useState<TaskWithRelations | null>(null);
  const [expandedTasks, setExpandedTasks] = useState<Set<number>>(new Set());
  const [viewMode, setViewMode] = useState<'list' | 'board'>('list');

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (categoryFilter) {
        params.append('category', categoryFilter);
      }
      const response = await fetch(`/api/tasks?${params}`);
      if (!response.ok) throw new Error('Failed to fetch tasks');
      const data = await response.json();
      setTasks(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [categoryFilter]);

  const handleCreate = () => {
    setEditingTask(null);
    setParentTaskForSubTask(null);
    setModalOpen(true);
  };

  const handleEdit = (task: TaskWithRelations) => {
    setEditingTask(task);
    setParentTaskForSubTask(null);
    setModalOpen(true);
  };

  const handleAddSubTask = (parentTask: TaskWithRelations) => {
    setEditingTask(null);
    setParentTaskForSubTask(parentTask);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setEditingTask(null);
    setParentTaskForSubTask(null);
    fetchTasks();
  };

  const handleToggleComplete = async (task: TaskWithRelations) => {
    try {
      const isCompleting = !task.completed;

      // 完了する場合は、リストの最後に移動
      if (isCompleting) {
        // すべてのタスクのorderを取得して最大値を計算
        const maxOrder = Math.max(...tasks.map(t => t.order), 0);

        const response = await fetch(`/api/tasks/${task.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...task,
            completed: true,
            order: maxOrder + 1,
            projectId: task.projectId || undefined,
          }),
        });

        if (!response.ok) throw new Error('Failed to update task');
      } else {
        // 未完了に戻す場合は通常の更新
        const response = await fetch(`/api/tasks/${task.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...task,
            completed: false,
            projectId: task.projectId || undefined,
          }),
        });

        if (!response.ok) throw new Error('Failed to update task');
      }

      fetchTasks();
    } catch (err) {
      alert('タスクの更新に失敗しました');
    }
  };

  const handleDelete = async (task: TaskWithRelations) => {
    if (!confirm(`タスク「${task.title}」を削除してもよろしいですか？${task.subTasks && task.subTasks.length > 0 ? '\n※サブタスクも一緒に削除されます' : ''}`)) {
      return;
    }

    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete task');
      fetchTasks();
    } catch (err) {
      alert('タスクの削除に失敗しました');
    }
  };

  const handleDragStart = (e: React.DragEvent, task: TaskWithRelations) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();

    if (!draggedTask) return;

    const dragIndex = tasks.findIndex(t => t.id === draggedTask.id);
    if (dragIndex === dropIndex) return;

    // 並び替え
    const newTasks = [...tasks];
    const [removed] = newTasks.splice(dragIndex, 1);
    newTasks.splice(dropIndex, 0, removed);

    // order を更新
    const taskOrders = newTasks.map((task, index) => ({
      id: task.id,
      order: index,
    }));

    try {
      const response = await fetch('/api/tasks/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskOrders }),
      });

      if (!response.ok) throw new Error('Failed to reorder tasks');

      setTasks(newTasks);
    } catch (err) {
      alert('並び替えに失敗しました');
      fetchTasks();
    }

    setDraggedTask(null);
  };

  const toggleExpand = (taskId: number) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedTasks(newExpanded);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-lg text-gray-600">読み込み中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="text-red-600">エラー: {error}</div>
      </div>
    );
  }

  // 24時間以上前の完了タスクを除外
  const filteredTasks = tasks.filter(task => {
    // 未完了タスクは常に表示
    if (!task.completed) return true;

    // completedAtがない場合は表示（安全策）
    if (!task.completedAt) return true;

    const completedAt = new Date(task.completedAt);
    const now = new Date();
    const hoursSinceCompletion = (now.getTime() - completedAt.getTime()) / (1000 * 60 * 60);

    // 24時間以内の完了タスクのみ表示
    return hoursSinceCompletion < 24;
  });

  // タスクをstatus基準で分類（フィルタリング適用）
  const tasksByStatus = {
    pending: filteredTasks.filter(t => t.status === 'PENDING' && !t.completed),
    inProgress: filteredTasks.filter(t => t.status === 'IN_PROGRESS' && !t.completed),
    completed: filteredTasks.filter(t => t.completed),
  };

  // ドラッグ&ドロップでステータス変更
  const handleStatusChange = async (taskId: number, newStatus: 'PENDING' | 'IN_PROGRESS') => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...task,
          status: newStatus,
          projectId: task.projectId || undefined,
        }),
      });

      if (!response.ok) throw new Error('Failed to update task status');
      fetchTasks();
    } catch (err) {
      alert('ステータスの更新に失敗しました');
    }
  };

  const handleBoardDragStart = (e: React.DragEvent, task: TaskWithRelations) => {
    e.dataTransfer.setData('taskId', task.id.toString());
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleBoardDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleBoardDrop = async (e: React.DragEvent, newStatus: 'PENDING' | 'IN_PROGRESS', dropIndex?: number) => {
    e.preventDefault();
    const taskId = parseInt(e.dataTransfer.getData('taskId'));
    if (!taskId) return;

    const draggedTaskItem = tasks.find(t => t.id === taskId);
    if (!draggedTaskItem) return;

    // ステータスが変わる場合
    if (draggedTaskItem.status !== newStatus) {
      await handleStatusChange(taskId, newStatus);
    }
    // 同じステータス内での並び替え
    else if (dropIndex !== undefined) {
      const statusTasks = tasks.filter(t => t.status === newStatus && !t.completed);
      const dragIndex = statusTasks.findIndex(t => t.id === taskId);

      if (dragIndex === dropIndex) return;

      // 並び替え後の順序を計算
      const reorderedTasks = [...statusTasks];
      const [removed] = reorderedTasks.splice(dragIndex, 1);
      reorderedTasks.splice(dropIndex, 0, removed);

      // order を更新
      const taskOrders = reorderedTasks.map((task, index) => ({
        id: task.id,
        order: index,
      }));

      try {
        const response = await fetch('/api/tasks/reorder', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ taskOrders }),
        });

        if (!response.ok) throw new Error('Failed to reorder tasks');
        fetchTasks();
      } catch (err) {
        alert('並び替えに失敗しました');
        fetchTasks();
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <h2 className="text-2xl font-bold text-gray-900">タスク管理</h2>
            <span className="text-sm text-gray-500">{filteredTasks.length}件</span>
          </div>

          {/* 表示切り替えタブ */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={clsx(
                'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                viewMode === 'list'
                  ? 'bg-white text-orange-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              <List className="h-4 w-4" />
              リスト
            </button>
            <button
              onClick={() => setViewMode('board')}
              className={clsx(
                'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                viewMode === 'board'
                  ? 'bg-white text-orange-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              <LayoutGrid className="h-4 w-4" />
              ボード
            </button>
          </div>
        </div>

        <Button onClick={handleCreate} className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>新規タスク</span>
        </Button>
      </div>

      {/* タスク一覧 / ボード表示 */}
      {viewMode === 'list' ? (
        /* リスト表示 */
        <div className="space-y-2">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <div className="text-gray-500 mb-4">タスクがありません</div>
              <Button onClick={handleCreate}>
                <Plus className="h-4 w-4 mr-2" />
                最初のタスクを作成
              </Button>
            </div>
          ) : (
          filteredTasks.map((task, index) => (
            <div key={task.id}>
              {/* メインタスク */}
              <div
                draggable
                onDragStart={(e) => handleDragStart(e, task)}
                onDragEnd={handleDragEnd}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
                className={`bg-white rounded-lg border p-4 hover:shadow-md transition-shadow ${
                  draggedTask?.id === task.id ? 'opacity-50' : ''
                } ${task.completed ? 'bg-gray-50' : ''}`}
              >
                <div className="flex items-start gap-3">
                  {/* ドラッグハンドル */}
                  <GripVertical className="h-5 w-5 text-gray-400 cursor-grab active:cursor-grabbing mt-0.5" />

                  {/* 完了チェックボックス */}
                  <button
                    onClick={() => handleToggleComplete(task)}
                    className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5 ${
                      task.completed
                        ? 'bg-green-500 border-green-500'
                        : 'border-gray-300 hover:border-green-500'
                    }`}
                  >
                    {task.completed && <Check className="h-4 w-4 text-white" />}
                  </button>

                  {/* サブタスク展開ボタン */}
                  {task.subTasks && task.subTasks.length > 0 && (
                    <button
                      onClick={() => toggleExpand(task.id)}
                      className="flex-shrink-0 text-gray-400 hover:text-gray-600 mt-0.5"
                    >
                      {expandedTasks.has(task.id) ? (
                        <ChevronDown className="h-5 w-5" />
                      ) : (
                        <ChevronRight className="h-5 w-5" />
                      )}
                    </button>
                  )}

                  {/* タスク内容 */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className={`text-base font-medium ${task.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                          {task.title}
                        </div>
                        {task.description && (
                          <div className="text-sm text-gray-600 mt-1">{task.description}</div>
                        )}

                        {/* メタ情報 */}
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                            {TASK_CATEGORY_LABELS[task.category]}
                          </span>
                          <span className="text-xs">
                            {TASK_PRIORITY_LABELS[task.priority]}
                          </span>
                          {task.project && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                              {task.project.name}
                            </span>
                          )}
                          {(task.startDate || task.dueDate) && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                              {task.startDate && task.dueDate ? (
                                <>
                                  {task.isAllDay ? (
                                    <>
                                      {new Date(task.startDate).toLocaleDateString('ja-JP', {
                                        year: 'numeric',
                                        month: '2-digit',
                                        day: '2-digit'
                                      })} 〜 {new Date(task.dueDate).toLocaleDateString('ja-JP', {
                                        year: 'numeric',
                                        month: '2-digit',
                                        day: '2-digit'
                                      })}
                                    </>
                                  ) : (
                                    <>
                                      {new Date(task.startDate).toLocaleString('ja-JP', {
                                        year: 'numeric',
                                        month: '2-digit',
                                        day: '2-digit',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })} 〜 {new Date(task.dueDate).toLocaleString('ja-JP', {
                                        year: 'numeric',
                                        month: '2-digit',
                                        day: '2-digit',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </>
                                  )}
                                </>
                              ) : task.startDate ? (
                                <>
                                  開始: {task.isAllDay ? (
                                    new Date(task.startDate).toLocaleDateString('ja-JP', {
                                      year: 'numeric',
                                      month: '2-digit',
                                      day: '2-digit'
                                    })
                                  ) : (
                                    new Date(task.startDate).toLocaleString('ja-JP', {
                                      year: 'numeric',
                                      month: '2-digit',
                                      day: '2-digit',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })
                                  )}
                                </>
                              ) : (
                                <>
                                  期限: {task.isAllDay ? (
                                    new Date(task.dueDate!).toLocaleDateString('ja-JP', {
                                      year: 'numeric',
                                      month: '2-digit',
                                      day: '2-digit'
                                    })
                                  ) : (
                                    new Date(task.dueDate!).toLocaleString('ja-JP', {
                                      year: 'numeric',
                                      month: '2-digit',
                                      day: '2-digit',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })
                                  )}
                                </>
                              )}
                            </span>
                          )}
                          {task.subTasks && task.subTasks.length > 0 && (
                            <span className="text-xs text-gray-500">
                              サブタスク: {task.subTasks.filter(st => st.completed).length}/{task.subTasks.length}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* アクション */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleAddSubTask(task)}
                          className="p-1 hover:bg-blue-100 rounded"
                          title="サブタスク追加"
                        >
                          <ListPlus className="h-4 w-4 text-blue-500" />
                        </button>
                        <button
                          onClick={() => handleEdit(task)}
                          className="p-1 hover:bg-gray-100 rounded"
                        >
                          <Edit className="h-4 w-4 text-gray-500" />
                        </button>
                        <button
                          onClick={() => handleDelete(task)}
                          className="p-1 hover:bg-red-100 rounded"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* サブタスク */}
              {expandedTasks.has(task.id) && task.subTasks && task.subTasks.length > 0 && (
                <div className="ml-12 mt-2 space-y-2">
                  {task.subTasks.map((subTask) => (
                    <div
                      key={subTask.id}
                      className={`bg-gray-50 rounded-lg border border-gray-200 p-3 ${
                        subTask.completed ? 'opacity-75' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => handleToggleComplete(subTask)}
                          className={`flex-shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center mt-0.5 ${
                            subTask.completed
                              ? 'bg-green-500 border-green-500'
                              : 'border-gray-300 hover:border-green-500'
                          }`}
                        >
                          {subTask.completed && <Check className="h-3 w-3 text-white" />}
                        </button>

                        <div className="flex-1">
                          <div className={`text-sm ${subTask.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                            {subTask.title}
                          </div>
                          {subTask.description && (
                            <div className="text-xs text-gray-600 mt-1">{subTask.description}</div>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleEdit(subTask)}
                            className="p-1 hover:bg-gray-100 rounded"
                          >
                            <Edit className="h-3 w-3 text-gray-500" />
                          </button>
                          <button
                            onClick={() => handleDelete(subTask)}
                            className="p-1 hover:bg-red-100 rounded"
                          >
                            <Trash2 className="h-3 w-3 text-red-500" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
        </div>
      ) : (
        /* ボード表示 */
        <div className="grid grid-cols-3 gap-4">
          {/* 未対応 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-700 mb-4 flex items-center justify-between">
              <span>未対応</span>
              <span className="text-sm bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
                {tasksByStatus.pending.length}
              </span>
            </h3>
            <div
              onDragOver={handleBoardDragOver}
              onDrop={(e) => handleBoardDrop(e, 'PENDING')}
              className="space-y-2 min-h-[200px]"
            >
              {tasksByStatus.pending.map((task, index) => (
                <div key={task.id}>
                  <div
                    draggable
                    onDragStart={(e) => handleBoardDragStart(e, task)}
                    onDragOver={handleBoardDragOver}
                    onDrop={(e) => {
                      e.stopPropagation();
                      handleBoardDrop(e, 'PENDING', index);
                    }}
                    className="bg-white rounded-lg border p-3 hover:shadow-md transition-shadow cursor-move"
                  >
                    <div className="flex items-start gap-2">
                      <button
                        onClick={() => handleToggleComplete(task)}
                        className="flex-shrink-0 w-5 h-5 rounded border-2 border-gray-300 hover:border-green-500 mt-0.5"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <div className="font-medium text-gray-900 flex-1">{task.title}</div>
                          <div className="flex items-center gap-1">
                            {task.subTasks && task.subTasks.length > 0 && (
                              <button
                                onClick={() => toggleExpand(task.id)}
                                className="text-gray-400 hover:text-gray-600"
                              >
                                {expandedTasks.has(task.id) ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </button>
                            )}
                            <button
                              onClick={() => handleEdit(task)}
                              className="text-gray-400 hover:text-gray-600"
                              title="編集"
                            >
                              <Edit className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => handleDelete(task)}
                              className="text-red-400 hover:text-red-600"
                              title="削除"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                        {task.description && (
                          <div className="text-xs text-gray-600 mt-1">{task.description}</div>
                        )}
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <span className="text-xs">{TASK_PRIORITY_LABELS[task.priority]}</span>
                          {task.dueDate && (
                            <span className="text-xs text-orange-600">
                              {new Date(task.dueDate).toLocaleString('ja-JP', {
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          )}
                          {task.subTasks && task.subTasks.length > 0 && (
                            <span className="text-xs text-gray-500">
                              サブタスク: {task.subTasks.filter(st => st.completed).length}/{task.subTasks.length}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* サブタスク展開 */}
                  {expandedTasks.has(task.id) && (
                    <div className="ml-6 mt-1 space-y-1">
                      {task.subTasks && task.subTasks.length > 0 && task.subTasks.map((subTask) => (
                        <div
                          key={subTask.id}
                          className="bg-gray-50 rounded p-2 text-xs flex items-center gap-2 group"
                        >
                          <button
                            onClick={() => handleToggleComplete(subTask)}
                            className={`flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center ${
                              subTask.completed
                                ? 'bg-green-500 border-green-500'
                                : 'border-gray-300'
                            }`}
                          >
                            {subTask.completed && <Check className="h-3 w-3 text-white" />}
                          </button>
                          <span className={`flex-1 ${subTask.completed ? 'line-through text-gray-500' : 'text-gray-700'}`}>
                            {subTask.title}
                          </span>
                          <button
                            onClick={() => handleDelete(subTask)}
                            className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-opacity"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => handleAddSubTask(task)}
                        className="bg-blue-50 hover:bg-blue-100 rounded p-2 text-xs text-blue-600 w-full flex items-center justify-center gap-1"
                      >
                        <ListPlus className="h-3 w-3" />
                        サブタスク追加
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 対応中 */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-semibold text-blue-700 mb-4 flex items-center justify-between">
              <span>対応中</span>
              <span className="text-sm bg-blue-200 text-blue-700 px-2 py-1 rounded-full">
                {tasksByStatus.inProgress.length}
              </span>
            </h3>
            <div
              onDragOver={handleBoardDragOver}
              onDrop={(e) => handleBoardDrop(e, 'IN_PROGRESS')}
              className="space-y-2 min-h-[200px]"
            >
              {tasksByStatus.inProgress.map((task, index) => (
                <div key={task.id}>
                  <div
                    draggable
                    onDragStart={(e) => handleBoardDragStart(e, task)}
                    onDragOver={handleBoardDragOver}
                    onDrop={(e) => {
                      e.stopPropagation();
                      handleBoardDrop(e, 'IN_PROGRESS', index);
                    }}
                    className="bg-white rounded-lg border border-blue-200 p-3 hover:shadow-md transition-shadow cursor-move"
                  >
                    <div className="flex items-start gap-2">
                      <button
                        onClick={() => handleToggleComplete(task)}
                        className="flex-shrink-0 w-5 h-5 rounded border-2 border-gray-300 hover:border-green-500 mt-0.5"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <div className="font-medium text-gray-900 flex-1">{task.title}</div>
                          <div className="flex items-center gap-1">
                            {task.subTasks && task.subTasks.length > 0 && (
                              <button
                                onClick={() => toggleExpand(task.id)}
                                className="text-gray-400 hover:text-gray-600"
                              >
                                {expandedTasks.has(task.id) ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </button>
                            )}
                            <button
                              onClick={() => handleEdit(task)}
                              className="text-gray-400 hover:text-gray-600"
                              title="編集"
                            >
                              <Edit className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => handleDelete(task)}
                              className="text-red-400 hover:text-red-600"
                              title="削除"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                        {task.description && (
                          <div className="text-xs text-gray-600 mt-1">{task.description}</div>
                        )}
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <span className="text-xs">{TASK_PRIORITY_LABELS[task.priority]}</span>
                          {task.dueDate && (
                            <span className="text-xs text-orange-600">
                              {new Date(task.dueDate).toLocaleString('ja-JP', {
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          )}
                          {task.subTasks && task.subTasks.length > 0 && (
                            <span className="text-xs text-gray-500">
                              サブタスク: {task.subTasks.filter(st => st.completed).length}/{task.subTasks.length}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* サブタスク展開 */}
                  {expandedTasks.has(task.id) && (
                    <div className="ml-6 mt-1 space-y-1">
                      {task.subTasks && task.subTasks.length > 0 && task.subTasks.map((subTask) => (
                        <div
                          key={subTask.id}
                          className="bg-gray-50 rounded p-2 text-xs flex items-center gap-2 group"
                        >
                          <button
                            onClick={() => handleToggleComplete(subTask)}
                            className={`flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center ${
                              subTask.completed
                                ? 'bg-green-500 border-green-500'
                                : 'border-gray-300'
                            }`}
                          >
                            {subTask.completed && <Check className="h-3 w-3 text-white" />}
                          </button>
                          <span className={`flex-1 ${subTask.completed ? 'line-through text-gray-500' : 'text-gray-700'}`}>
                            {subTask.title}
                          </span>
                          <button
                            onClick={() => handleDelete(subTask)}
                            className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-opacity"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => handleAddSubTask(task)}
                        className="bg-blue-50 hover:bg-blue-100 rounded p-2 text-xs text-blue-600 w-full flex items-center justify-center gap-1"
                      >
                        <ListPlus className="h-3 w-3" />
                        サブタスク追加
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 完了 */}
          <div className="bg-green-50 rounded-lg p-4">
            <h3 className="font-semibold text-green-700 mb-4 flex items-center justify-between">
              <span>完了</span>
              <span className="text-sm bg-green-200 text-green-700 px-2 py-1 rounded-full">
                {tasksByStatus.completed.length}
              </span>
            </h3>
            <div className="space-y-2">
              {tasksByStatus.completed.map((task) => (
                <div
                  key={task.id}
                  className="bg-white rounded-lg border border-green-200 p-3 hover:shadow-md transition-shadow opacity-75"
                >
                  <div className="flex items-start gap-2">
                    <button
                      onClick={() => handleToggleComplete(task)}
                      className="flex-shrink-0 w-5 h-5 rounded border-2 bg-green-500 border-green-500 flex items-center justify-center mt-0.5"
                    >
                      <Check className="h-4 w-4 text-white" />
                    </button>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 line-through">{task.title}</div>
                      {task.description && (
                        <div className="text-xs text-gray-600 mt-1 line-through">{task.description}</div>
                      )}
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className="text-xs">{TASK_PRIORITY_LABELS[task.priority]}</span>
                        {task.dueDate && (
                          <span className="text-xs text-gray-500">
                            {new Date(task.dueDate).toLocaleString('ja-JP', {
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        )}
                        {task.subTasks && task.subTasks.length > 0 && (
                          <span className="text-xs text-gray-500">
                            サブタスク: {task.subTasks.filter(st => st.completed).length}/{task.subTasks.length}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* モーダル */}
      {modalOpen && (
        <TaskModal
          isOpen={modalOpen}
          onClose={handleModalClose}
          task={editingTask}
          parentTask={parentTaskForSubTask}
        />
      )}
    </div>
  );
}
