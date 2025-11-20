'use client';

import { useState } from 'react';
import { Plus, Edit, Trash2, Eye, Filter, Search } from 'lucide-react';
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

        <div className="text-sm text-gray-600">
          {projects.length}件の案件
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
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {projects.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">案件がありません</div>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              最初の案件を作成
            </Button>
          </div>
        ) : (
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
                  <tr key={project.id} className="hover:bg-gray-50">
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
                        onClick={() => handleEdit(project)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(project)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

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