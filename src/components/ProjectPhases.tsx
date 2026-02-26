'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { DatePicker } from '@/components/ui/DatePicker';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

interface ProjectPhase {
  id: number;
  projectId: number;
  type: 'DESIGN' | 'CODING' | 'OTHER';
  name: string;
  startDate: string | null;
  firstDraftDate: string | null;
  deliveryDate: string | null;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'FIRST_DRAFT' | 'REVISING' | 'COMPLETED';
  notes: string | null;
}

interface ProjectPhasesProps {
  projectId: number;
}

const PHASE_TYPE_LABELS = {
  DESIGN: 'デザイン',
  CODING: 'コーディング',
  OTHER: 'その他',
};

const PHASE_TYPE_COLORS = {
  DESIGN: { bg: 'bg-pink-200', text: 'text-pink-800' },
  CODING: { bg: 'bg-blue-200', text: 'text-blue-800' },
  OTHER: { bg: 'bg-gray-200', text: 'text-gray-800' },
};

const PHASE_STATUS_LABELS = {
  NOT_STARTED: '未着手',
  IN_PROGRESS: '進行中',
  FIRST_DRAFT: '初稿提出済み',
  REVISING: '修正中',
  COMPLETED: '完了',
};

export function ProjectPhases({ projectId }: ProjectPhasesProps) {
  const [phases, setPhases] = useState<ProjectPhase[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const [formData, setFormData] = useState<{
    type: 'DESIGN' | 'CODING' | 'OTHER';
    name: string;
    startDate: Date | null;
    firstDraftDate: Date | null;
    deliveryDate: Date | null;
    status: 'NOT_STARTED' | 'IN_PROGRESS' | 'FIRST_DRAFT' | 'REVISING' | 'COMPLETED';
    notes: string;
  }>({
    type: 'DESIGN',
    name: '',
    startDate: null,
    firstDraftDate: null,
    deliveryDate: null,
    status: 'NOT_STARTED',
    notes: '',
  });

  useEffect(() => {
    fetchPhases();
  }, [projectId]);

  const fetchPhases = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/phases`);
      if (!response.ok) throw new Error('Failed to fetch phases');
      const data = await response.json();
      setPhases(data);
    } catch (error) {
      console.error('Failed to fetch phases:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setIsAdding(true);
    setEditingId(null);
    setFormData({
      type: 'DESIGN',
      name: '',
      startDate: null,
      firstDraftDate: null,
      deliveryDate: null,
      status: 'NOT_STARTED',
      notes: '',
    });
  };

  const handleEdit = (phase: ProjectPhase) => {
    setEditingId(phase.id);
    setIsAdding(false);
    setFormData({
      type: phase.type,
      name: phase.name,
      startDate: phase.startDate ? new Date(phase.startDate) : null,
      firstDraftDate: phase.firstDraftDate ? new Date(phase.firstDraftDate) : null,
      deliveryDate: phase.deliveryDate ? new Date(phase.deliveryDate) : null,
      status: phase.status,
      notes: phase.notes || '',
    });
  };

  const handleSave = async () => {
    try {
      const payload = {
        ...formData,
        startDate: formData.startDate?.toISOString(),
        firstDraftDate: formData.firstDraftDate?.toISOString(),
        deliveryDate: formData.deliveryDate?.toISOString(),
      };

      if (isAdding) {
        const response = await fetch(`/api/projects/${projectId}/phases`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error('Failed to create phase');
      } else if (editingId) {
        const response = await fetch(`/api/projects/${projectId}/phases/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error('Failed to update phase');
      }

      setIsAdding(false);
      setEditingId(null);
      fetchPhases();
    } catch (error) {
      alert('工程の保存に失敗しました');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('この工程を削除してもよろしいですか？')) return;

    try {
      const response = await fetch(`/api/projects/${projectId}/phases/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete phase');
      fetchPhases();
    } catch (error) {
      alert('工程の削除に失敗しました');
    }
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
  };

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return format(new Date(date), 'yyyy/MM/dd', { locale: ja });
  };

  if (loading) {
    return <div className="text-sm text-gray-500">読み込み中...</div>;
  }

  return (
    <div className="space-y-4">
      {/* 工程リスト */}
      {phases.length === 0 && !isAdding && (
        <div className="text-sm text-gray-500 text-center py-4">
          工程が登録されていません
        </div>
      )}

      {phases.map((phase) => (
        <div key={phase.id} className="border border-gray-200 rounded-lg p-4">
          {editingId === phase.id ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    工程タイプ
                  </label>
                  <Select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as ProjectPhase['type'] })}
                  >
                    <option value="DESIGN">デザイン</option>
                    <option value="CODING">コーディング</option>
                    <option value="OTHER">その他</option>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    工程名
                  </label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="例: トップページデザイン"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    着手日
                  </label>
                  <DatePicker
                    selected={formData.startDate}
                    onChange={(date) => setFormData({ ...formData, startDate: date })}
                    placeholderText="着手日を選択"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    初稿日
                  </label>
                  <DatePicker
                    selected={formData.firstDraftDate}
                    onChange={(date) => setFormData({ ...formData, firstDraftDate: date })}
                    placeholderText="初稿日を選択"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    納品日
                  </label>
                  <DatePicker
                    selected={formData.deliveryDate}
                    onChange={(date) => setFormData({ ...formData, deliveryDate: date })}
                    placeholderText="納品日を選択"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ステータス
                </label>
                <Select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as ProjectPhase['status'] })}
                >
                  <option value="NOT_STARTED">未着手</option>
                  <option value="IN_PROGRESS">進行中</option>
                  <option value="FIRST_DRAFT">初稿提出済み</option>
                  <option value="REVISING">修正中</option>
                  <option value="COMPLETED">完了</option>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  備考
                </label>
                <Input
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="補足情報があれば記入"
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="secondary" size="sm" onClick={handleCancel}>
                  キャンセル
                </Button>
                <Button type="button" size="sm" onClick={handleSave}>
                  保存
                </Button>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-block px-2 py-1 text-xs font-medium ${PHASE_TYPE_COLORS[phase.type].bg} ${PHASE_TYPE_COLORS[phase.type].text} rounded`}>
                      {PHASE_TYPE_LABELS[phase.type]}
                    </span>
                    <h4 className="font-medium text-gray-900">{phase.name}</h4>
                  </div>
                  <div className="mt-1 text-sm text-gray-600">
                    ステータス: {PHASE_STATUS_LABELS[phase.status]}
                  </div>
                </div>
                <div className="flex space-x-1">
                  <button
                    type="button"
                    onClick={() => handleEdit(phase)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(phase.id)}
                    className="p-1 text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">着手日:</span>{' '}
                  <span className="text-gray-900">{formatDate(phase.startDate)}</span>
                </div>
                <div>
                  <span className="text-gray-500">初稿日:</span>{' '}
                  <span className="text-gray-900">{formatDate(phase.firstDraftDate)}</span>
                </div>
                <div>
                  <span className="text-gray-500">納品日:</span>{' '}
                  <span className="text-gray-900">{formatDate(phase.deliveryDate)}</span>
                </div>
              </div>

              {phase.notes && (
                <div className="mt-2 text-sm text-gray-600">
                  備考: {phase.notes}
                </div>
              )}
            </div>
          )}
        </div>
      ))}

      {/* 新規追加フォーム */}
      {isAdding && (
        <div className="border border-gray-200 rounded-lg p-4 space-y-4 bg-gray-50">
          <h4 className="font-medium text-gray-900">新規工程追加</h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                工程タイプ
              </label>
              <Select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as ProjectPhase['type'] })}
              >
                <option value="DESIGN">デザイン</option>
                <option value="CODING">コーディング</option>
                <option value="OTHER">その他</option>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                工程名
              </label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="例: トップページデザイン"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                着手日
              </label>
              <DatePicker
                selected={formData.startDate}
                onChange={(date) => setFormData({ ...formData, startDate: date })}
                placeholderText="着手日を選択"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                初稿日
              </label>
              <DatePicker
                selected={formData.firstDraftDate}
                onChange={(date) => setFormData({ ...formData, firstDraftDate: date })}
                placeholderText="初稿日を選択"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                納品日
              </label>
              <DatePicker
                selected={formData.deliveryDate}
                onChange={(date) => setFormData({ ...formData, deliveryDate: date })}
                placeholderText="納品日を選択"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ステータス
            </label>
            <Select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as ProjectPhase['status'] })}
            >
              <option value="NOT_STARTED">未着手</option>
              <option value="IN_PROGRESS">進行中</option>
              <option value="FIRST_DRAFT">初稿提出済み</option>
              <option value="REVISING">修正中</option>
              <option value="COMPLETED">完了</option>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              備考
            </label>
            <Input
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="補足情報があれば記入"
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="secondary" size="sm" onClick={handleCancel}>
              キャンセル
            </Button>
            <Button type="button" size="sm" onClick={handleSave}>
              追加
            </Button>
          </div>
        </div>
      )}

      {/* 追加ボタン */}
      {!isAdding && !editingId && (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={handleAdd}
          className="w-full flex items-center justify-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>工程を追加</span>
        </Button>
      )}
    </div>
  );
}
