'use client';

import { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import { TaskWithRelations, TaskCategory, TaskPriority, TaskStatus, TASK_CATEGORY_LABELS, TASK_PRIORITY_LABELS, TASK_STATUS_LABELS } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: TaskWithRelations | null;
  parentTask?: TaskWithRelations;
}

export function TaskModal({ isOpen, onClose, task, parentTask }: TaskModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'OTHER' as TaskCategory,
    priority: 'MEDIUM' as TaskPriority,
    status: 'PENDING' as TaskStatus,
    projectId: null as number | null,
    startDate: '',
    dueDate: '',
    isAllDay: false,
    subTaskInput: '',
  });
  const [subTasks, setSubTasks] = useState<Array<{ title: string; completed: boolean }>>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description || '',
        category: task.category,
        priority: task.priority,
        status: task.status,
        projectId: task.projectId,
        startDate: task.startDate ? new Date(task.startDate).toISOString().slice(0, 16) : '',
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 16) : '',
        isAllDay: task.isAllDay || false,
        subTaskInput: '',
      });
      // 既存のサブタスクを読み込む
      if (task.subTasks && task.subTasks.length > 0) {
        setSubTasks(task.subTasks.map(st => ({ title: st.title, completed: st.completed })));
      } else {
        setSubTasks([]);
      }
    } else if (parentTask) {
      // サブタスクとして作成する場合、親タスクの情報を引き継ぐ
      setFormData({
        title: '',
        description: '',
        category: parentTask.category,
        priority: parentTask.priority,
        status: parentTask.status,
        projectId: parentTask.projectId,
        startDate: '',
        dueDate: '',
        isAllDay: false,
        subTaskInput: '',
      });
    } else {
      // 新規作成時はリセット
      setFormData({
        title: '',
        description: '',
        category: 'OTHER' as TaskCategory,
        priority: 'MEDIUM' as TaskPriority,
        status: 'PENDING' as TaskStatus,
        projectId: null,
        startDate: '',
        dueDate: '',
        isAllDay: false,
        subTaskInput: '',
      });
      setSubTasks([]);
    }
  }, [task, parentTask]);

  useEffect(() => {
    // 案件一覧を取得
    const fetchProjects = async () => {
      try {
        const response = await fetch('/api/projects');
        if (response.ok) {
          const data = await response.json();
          setProjects(data);
        }
      } catch (err) {
        console.error('Failed to fetch projects:', err);
      }
    };

    if (isOpen) {
      fetchProjects();
    }
  }, [isOpen]);

  const handleAddSubTask = () => {
    if (formData.subTaskInput.trim()) {
      setSubTasks([...subTasks, { title: formData.subTaskInput.trim(), completed: false }]);
      setFormData({ ...formData, subTaskInput: '' });
    }
  };

  const handleRemoveSubTask = (index: number) => {
    setSubTasks(subTasks.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = task ? `/api/tasks/${task.id}` : '/api/tasks';
      const method = task ? 'PUT' : 'POST';

      const payload: any = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        priority: formData.priority,
        status: formData.status,
        projectId: formData.projectId || null,
        startDate: formData.startDate || null,
        dueDate: formData.dueDate || null,
        isAllDay: formData.isAllDay,
      };

      // サブタスクとして作成する場合
      if (parentTask && !task) {
        payload.parentId = parentTask.id;
      }

      // 既存タスクの更新の場合は order を保持
      if (task) {
        payload.order = task.order;
      }

      // サブタスク（新規作成時のみ）
      if (!parentTask && !task) {
        payload.subTasks = subTasks;
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Failed to save task');

      onClose();
    } catch (err) {
      alert('タスクの保存に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {task ? 'タスク編集' : parentTask ? 'サブタスク作成' : 'タスク作成'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* フォーム */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* タイトル */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              タスク名 <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              placeholder="例: デザインデータの確認"
            />
          </div>

          {/* 説明 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              説明
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              rows={3}
              placeholder="タスクの詳細や注意事項など"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* カテゴリー */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                カテゴリー <span className="text-red-500">*</span>
              </label>
              <Select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as TaskCategory })}
                required
              >
                {Object.entries(TASK_CATEGORY_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>

            {/* 優先度 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                優先度 <span className="text-red-500">*</span>
              </label>
              <Select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as TaskPriority })}
                required
              >
                {Object.entries(TASK_PRIORITY_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {/* ステータス */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ステータス <span className="text-red-500">*</span>
            </label>
            <Select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as TaskStatus })}
              required
            >
              {Object.entries(TASK_STATUS_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </Select>
          </div>

          {/* 案件選択（カテゴリーがPROJECTの場合のみ） */}
          {formData.category === 'PROJECT' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                関連案件
              </label>
              <Select
                value={formData.projectId?.toString() || ''}
                onChange={(e) => setFormData({ ...formData, projectId: e.target.value ? parseInt(e.target.value) : null })}
              >
                <option value="">選択なし</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name} - {project.client.name}
                  </option>
                ))}
              </Select>
            </div>
          )}

          {/* 終日チェック */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isAllDay"
              checked={formData.isAllDay}
              onChange={(e) => setFormData({ ...formData, isAllDay: e.target.checked })}
              className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
            />
            <label htmlFor="isAllDay" className="text-sm font-medium text-gray-700">
              終日
            </label>
          </div>

          {/* 開始日時 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              開始日時
            </label>
            <Input
              type={formData.isAllDay ? "date" : "datetime-local"}
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            />
          </div>

          {/* 終了日時（期限） */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              終了日時（期限）
            </label>
            <Input
              type={formData.isAllDay ? "date" : "datetime-local"}
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
            />
          </div>

          {/* 既存タスク編集時のサブタスク表示 */}
          {task && task.subTasks && task.subTasks.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <div className="text-sm font-medium text-blue-900 mb-2">
                サブタスク ({task.subTasks.length}件)
              </div>
              <div className="text-xs text-blue-700">
                サブタスクの編集は、タスク一覧から個別に編集してください
              </div>
            </div>
          )}

          {parentTask && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <div className="text-sm text-blue-700">
                親タスク: {parentTask.title}
              </div>
            </div>
          )}

          {/* ボタン */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
            >
              キャンセル
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? '保存中...' : task ? '更新' : '作成'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
