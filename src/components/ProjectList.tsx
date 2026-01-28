'use client';

import { useState, useMemo } from 'react';
import { Plus, Edit, Trash2, Eye, Filter, Search, List, CalendarDays, MessageSquare } from 'lucide-react';
import clsx from 'clsx';
import { useProjects } from '@/hooks/useProjects';
import { useClients } from '@/hooks/useClients';
import { ProjectWithRelations, SALES_STATUS_LABELS, PROGRESS_STATUS_LABELS } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { ProjectModal } from './ProjectModal';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

export function ProjectList() {
  const [filters, setFilters] = useState({
    clientId: '',
    salesStatus: '',
    orderMonth: '',
    consultationMonth: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    includeLost: false,
  });

  const { projects, loading, error, refresh } = useProjects(filters);
  const { clients } = useClients();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectWithRelations | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'orderMonth' | 'consultationMonth'>('list');

  const groupByDate = (
    dateKey: 'orderDate' | 'consultationDate',
    noDateLabel: string
  ) => {
    const groups: Record<string, ProjectWithRelations[]> = {};
    for (const project of projects) {
      const dateVal = project[dateKey];
      const key = dateVal
        ? format(new Date(dateVal), 'yyyy-MM')
        : '__none__';
      if (!groups[key]) groups[key] = [];
      groups[key].push(project);
    }
    return Object.entries(groups)
      .sort(([a], [b]) => {
        if (a === '__none__') return 1;
        if (b === '__none__') return -1;
        return b.localeCompare(a);
      })
      .map(([key, items]) => ({
        label: key === '__none__'
          ? noDateLabel
          : format(new Date(key + '-01'), 'yyyy年M月', { locale: ja }),
        projects: items,
      }));
  };

  const projectsByMonth = useMemo(
    () => groupByDate('orderDate', '受注日未設定'),
    [projects]
  );

  const projectsByConsultation = useMemo(
    () => groupByDate('consultationDate', '相談日未設定'),
    [projects]
  );

  const handleEdit = (project: ProjectWithRelations) => {
    setEditingProject(project);
    setModalOpen(true);
  };

  const handleCreate = () => {
    setEditingProject(null);
    setModalOpen(true);
  };

  const handleDelete = async (project: ProjectWithRelations) => {
    if (!confirm(`案件「${project.name}」を削除してもよろしいですか？`)) {
      return;
    }

    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete project');
      }

      refresh();
    } catch (error) {
      alert('案件の削除に失敗しました');
    }
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setEditingProject(null);
    refresh();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
    }).format(amount);
  };

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return format(new Date(date), 'yyyy/MM/dd', { locale: ja });
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

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center space-x-2">
          <Button onClick={handleCreate} className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>新規案件</span>
          </Button>
          <Button
            variant="secondary"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2"
          >
            <Filter className="h-4 w-4" />
            <span>フィルター</span>
          </Button>
        </div>

        <div className="flex items-center gap-4">
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
              onClick={() => setViewMode('orderMonth')}
              className={clsx(
                'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                viewMode === 'orderMonth'
                  ? 'bg-white text-orange-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              <CalendarDays className="h-4 w-4" />
              受注月別
            </button>
            <button
              onClick={() => setViewMode('consultationMonth')}
              className={clsx(
                'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                viewMode === 'consultationMonth'
                  ? 'bg-white text-orange-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              <MessageSquare className="h-4 w-4" />
              相談月別
            </button>
          </div>
          <div className="text-sm text-gray-600">
            {projects.length}件の案件
          </div>
        </div>
      </div>

      {/* フィルター */}
      {showFilters && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
          <h3 className="font-medium text-gray-900">フィルター条件</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                クライアント
              </label>
              <Select
                value={filters.clientId}
                onChange={(e) => setFilters({ ...filters, clientId: e.target.value })}
              >
                <option value="">すべて</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                営業ステータス
              </label>
              <Select
                value={filters.salesStatus}
                onChange={(e) => setFilters({ ...filters, salesStatus: e.target.value })}
              >
                <option value="">すべて</option>
                {Object.entries(SALES_STATUS_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                並び順
              </label>
              <Select
                value={`${filters.sortBy}_${filters.sortOrder}`}
                onChange={(e) => {
                  const [sortBy, sortOrder] = e.target.value.split('_');
                  setFilters({ ...filters, sortBy, sortOrder });
                }}
              >
                <option value="createdAt_desc">作成日（新しい順）</option>
                <option value="createdAt_asc">作成日（古い順）</option>
                <option value="deliveryDate_asc">納期（早い順）</option>
                <option value="deliveryDate_desc">納期（遅い順）</option>
                <option value="amount_desc">金額（高い順）</option>
                <option value="amount_asc">金額（低い順）</option>
              </Select>
            </div>

            <div className="flex items-center">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={filters.includeLost}
                  onChange={(e) => setFilters({ ...filters, includeLost: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">失注案件も表示</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* プロジェクト一覧 */}
      {projects.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 text-center py-12">
          <div className="text-gray-500 mb-4">案件がありません</div>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            最初の案件を作成
          </Button>
        </div>
      ) : viewMode === 'list' ? (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    案件名・クライアント
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ステータス
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    金額・利益
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    納期
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {projects.map((project) => (
                  <ProjectRow
                    key={project.id}
                    project={project}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    formatCurrency={formatCurrency}
                    formatDate={formatDate}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {(viewMode === 'orderMonth' ? projectsByMonth : projectsByConsultation).map((group) => (
            <div key={group.label}>
              <h3 className="text-lg font-semibold mb-3 px-4 py-2 bg-orange-50 text-orange-900 rounded-lg border border-orange-200">
                {group.label}（{group.projects.length}件）
              </h3>
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          案件名・クライアント
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          ステータス
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          金額・利益
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          納期
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          操作
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {group.projects.map((project) => (
                        <ProjectRow
                          key={project.id}
                          project={project}
                          onEdit={handleEdit}
                          onDelete={handleDelete}
                          formatCurrency={formatCurrency}
                          formatDate={formatDate}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* モーダル */}
      {modalOpen && (
        <ProjectModal
          isOpen={modalOpen}
          onClose={handleModalClose}
          project={editingProject}
        />
      )}
    </div>
  );
}

function ProjectRow({
  project,
  onEdit,
  onDelete,
  formatCurrency,
  formatDate,
}: {
  project: ProjectWithRelations;
  onEdit: (p: ProjectWithRelations) => void;
  onDelete: (p: ProjectWithRelations) => void;
  formatCurrency: (n: number) => string;
  formatDate: (d: string | null) => string;
}) {
  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <div>
          <div className="text-sm font-medium text-gray-900">
            {project.name}
          </div>
          <div className="text-sm text-gray-500">
            {project.client.name}
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="space-y-1">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            project.salesStatus === 'LOST'
              ? 'bg-red-100 text-red-800'
              : project.salesStatus === 'DELIVERED'
              ? 'bg-green-100 text-green-800'
              : project.salesStatus === 'ORDER_CONFIRMED'
              ? 'bg-purple-100 text-purple-800'
              : 'bg-blue-100 text-blue-800'
          }`}>
            {SALES_STATUS_LABELS[project.salesStatus]}
          </span>
          <div className="text-xs text-gray-500">
            {PROGRESS_STATUS_LABELS[project.progressStatus]}
          </div>
          <div className="flex gap-1 mt-1">
            {project.invoiceIssued && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                請求書発行済
              </span>
            )}
            {project.paymentConfirmed && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                入金確認済
              </span>
            )}
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        <div>
          <div className="font-medium">
            {formatCurrency(project.amount)}
          </div>
          <div className="text-xs text-gray-500">
            利益: {formatCurrency(project.amount - (project.outsourcingCost || 0))}
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {formatDate(project.deliveryDate)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(project)}
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(project)}
          className="text-red-600 hover:text-red-700"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </td>
    </tr>
  );
}