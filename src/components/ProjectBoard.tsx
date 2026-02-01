'use client';

import { useState } from 'react';
import { Plus, Edit, GripVertical } from 'lucide-react';
import { useProjects } from '@/hooks/useProjects';
import { ProjectWithRelations, SALES_STATUS_LABELS, SalesStatus } from '@/types';
import { Button } from '@/components/ui/Button';
import { ProjectModal } from './ProjectModal';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

const BOARD_COLUMNS = [
  { status: 'CONSULTING', label: '相談中', color: 'bg-blue-50 border-blue-200' },
  { status: 'QUOTE_SUBMITTED', label: 'お見積り提示中', color: 'bg-yellow-50 border-yellow-200' },
  { status: 'WAITING_CONTACT', label: '連絡待ち', color: 'bg-gray-50 border-gray-300' },
  { status: 'ORDER_CONFIRMED', label: '受注確定', color: 'bg-purple-50 border-purple-200' },
  { status: 'IN_PROGRESS', label: '進行中', color: 'bg-orange-50 border-orange-200' },
  { status: 'DELIVERED', label: '納品', color: 'bg-green-50 border-green-200' },
];

export function ProjectBoard() {
  const { projects, loading, error, refresh } = useProjects({
    sortBy: 'createdAt',
    sortOrder: 'desc',
    includeLost: false, // 失注案件を自動非表示
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectWithRelations | null>(null);
  const [draggedProject, setDraggedProject] = useState<ProjectWithRelations | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleCreate = () => {
    setEditingProject(null);
    setModalOpen(true);
  };

  const handleEdit = (project: ProjectWithRelations) => {
    setEditingProject(project);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setEditingProject(null);
    refresh();
  };

  const handleDragStart = (e: React.DragEvent, project: ProjectWithRelations) => {
    setIsDragging(true);
    setDraggedProject(project);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', project.id.toString());
  };

  const handleDragEnd = () => {
    setTimeout(() => setIsDragging(false), 100);
    setDraggedProject(null);
    setDragOverColumn(null);
  };

  const handleDragOver = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(status);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    setDragOverColumn(null);

    if (!draggedProject || draggedProject.salesStatus === newStatus) {
      setDraggedProject(null);
      return;
    }

    try {
      const response = await fetch(`/api/projects/${draggedProject.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: draggedProject.name,
          description: draggedProject.description,
          clientId: draggedProject.clientId,
          salesStatus: newStatus,
          progressStatus: draggedProject.progressStatus,
          consultationDate: draggedProject.consultationDate,
          orderDate: draggedProject.orderDate,
          startDate: draggedProject.startDate,
          firstDraftDate: draggedProject.firstDraftDate,
          deliveryDate: draggedProject.deliveryDate,
          hasOutsourcing: draggedProject.hasOutsourcing,
          outsourcingPartnerSheetUrl: draggedProject.outsourcingPartnerSheetUrl,
          clientSheetUrl: draggedProject.clientSheetUrl,
          amount: draggedProject.amount,
          outsourcingCost: draggedProject.outsourcingCost,
          invoiceIssued: draggedProject.invoiceIssued,
          paymentConfirmed: draggedProject.paymentConfirmed,
          paymentDueDate: draggedProject.paymentDueDate,
          outsourcingPartnerIds: draggedProject.projectPartners?.map(pp => pp.outsourcingPartner.id) || [],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error('Failed to update project status');
      }

      refresh();
    } catch (error) {
      console.error('Drop error:', error);
      alert('ステータスの更新に失敗しました');
    } finally {
      setDraggedProject(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
    }).format(amount);
  };

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return format(new Date(date), 'MM/dd', { locale: ja });
  };

  const getProjectsByStatus = (status: string) => {
    return projects.filter(p => {
      // 営業ステータスが一致
      if (p.salesStatus !== status) return false;

      // 納品済みで、請求書発行済みかつ入金確認済みの案件は非表示
      if (status === 'DELIVERED' && p.invoiceIssued && p.paymentConfirmed) {
        return false;
      }

      return true;
    });
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
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold text-gray-900">案件ボード</h2>
          <span className="text-sm text-gray-500">
            {projects.length}件の案件（失注・完了済み案件は非表示）
          </span>
        </div>
        <Button onClick={handleCreate} className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>新規案件</span>
        </Button>
      </div>

      {/* カンバンボード */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {BOARD_COLUMNS.map((column) => {
          const columnProjects = getProjectsByStatus(column.status);

          return (
            <div key={column.status} className="flex flex-col flex-shrink-0 w-80">
              {/* カラムヘッダー */}
              <div className={`${column.color} border rounded-t-lg px-4 py-3`}>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-800">{column.label}</h3>
                  <span className="bg-white px-2 py-1 rounded-full text-xs font-medium text-gray-600">
                    {columnProjects.length}
                  </span>
                </div>
              </div>

              {/* カード一覧 */}
              <div
                className={`flex-1 bg-gray-50 border-l border-r border-b rounded-b-lg p-2 space-y-2 min-h-[500px] transition-colors ${
                  dragOverColumn === column.status ? 'bg-blue-100' : ''
                }`}
                onDragOver={(e) => handleDragOver(e, column.status)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, column.status)}
              >
                {columnProjects.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    案件なし
                  </div>
                ) : (
                  columnProjects.map((project) => (
                    <div
                      key={project.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, project)}
                      onDragEnd={handleDragEnd}
                      className={`bg-white rounded-lg border border-gray-200 p-3 hover:shadow-md transition-shadow cursor-move ${
                        draggedProject?.id === project.id ? 'opacity-50' : ''
                      }`}
                      onClick={() => {
                        if (!isDragging) {
                          handleEdit(project);
                        }
                      }}
                    >
                      {/* ドラッグハンドル */}
                      <div className="flex items-start gap-2">
                        <GripVertical className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5 cursor-grab active:cursor-grabbing" />
                        {/* 案件名 */}
                        <div className="font-medium text-gray-900 text-sm mb-2 line-clamp-2 flex-1">
                          {project.name}
                        </div>
                      </div>

                      {/* クライアント名 */}
                      <div className="text-xs text-gray-600 mb-2">
                        {project.client.name}
                      </div>

                      {/* 金額 */}
                      <div className="text-sm font-semibold text-gray-900 mb-2">
                        {formatCurrency(project.amount)}
                      </div>

                      {/* 日付情報 */}
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                        {project.orderDate && (
                          <div>受注: {formatDate(project.orderDate)}</div>
                        )}
                        {project.deliveryDate && (
                          <div>納期: {formatDate(project.deliveryDate)}</div>
                        )}
                      </div>

                      {/* 進行ステータス */}
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                          {project.progressStatus === 'NOT_STARTED' && '未着手'}
                          {project.progressStatus === 'DESIGNING' && 'デザイン中'}
                          {project.progressStatus === 'CODING' && 'コーディング中'}
                          {project.progressStatus === 'REVIEWING' && '確認中'}
                          {project.progressStatus === 'REVISING' && '修正中'}
                          {project.progressStatus === 'DELIVERED' && '納品済'}
                        </span>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(project);
                          }}
                          className="p-1 hover:bg-gray-100 rounded"
                        >
                          <Edit className="h-3 w-3 text-gray-500" />
                        </button>
                      </div>

                      {/* 請求・入金ステータス */}
                      {(project.invoiceIssued || project.paymentConfirmed) && (
                        <div className="flex gap-1 mt-2">
                          {project.invoiceIssued && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700">
                              請求済
                            </span>
                          )}
                          {project.paymentConfirmed && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                              入金済
                            </span>
                          )}
                        </div>
                      )}

                      {/* 外注パートナー */}
                      {project.hasOutsourcing && project.projectPartners && project.projectPartners.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-gray-100">
                          <div className="text-xs text-gray-500">
                            外注: {project.projectPartners.map(pp => pp.outsourcingPartner.name).join(', ')}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
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
