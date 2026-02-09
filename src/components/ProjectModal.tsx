'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { DatePicker } from '@/components/ui/DatePicker';
import { useClients } from '@/hooks/useClients';
import { useOutsourcingPartners } from '@/hooks/useOutsourcingPartners';
import { ProjectWithRelations, SalesStatus, ProgressStatus, EstimateType, ProjectEstimate } from '@/types';
import { addMonths, endOfMonth } from 'date-fns';
import { ProjectPhases } from '@/components/ProjectPhases';
import { QuickAddClientModal } from '@/components/QuickAddClientModal';
import { QuickAddPartnerModal } from '@/components/QuickAddPartnerModal';
import { Plus, Trash2, ExternalLink, FileText, Pencil } from 'lucide-react';

const projectSchema = z.object({
  name: z.string().min(1, '案件名は必須です'),
  description: z.string().optional(),
  clientId: z.string().min(1, 'クライアントを選択してください'),
  salesStatus: z.nativeEnum(SalesStatus),
  progressStatus: z.nativeEnum(ProgressStatus),
  consultationDate: z.date().optional().nullable(),
  orderDate: z.date().optional().nullable(),
  startDate: z.date().optional().nullable(),
  firstDraftDate: z.date().optional().nullable(),
  deliveryDate: z.date().optional().nullable(),
  hasOutsourcing: z.boolean(),
  outsourcingPartnerIds: z.array(z.string()).optional(),
  outsourcingPartnerSheetUrl: z.string().optional(),
  outsourcingInvoiceReceived: z.boolean(),
  outsourcingPaymentMade: z.boolean(),
  outsourcingPaymentDate: z.date().optional().nullable(),
  clientSheetUrl: z.string().optional(),
  amount: z.number().min(0, '金額は0以上で入力してください'),
  outsourcingCost: z.number().min(0, '外注費は0以上で入力してください'),
  invoiceIssued: z.boolean(),
  paymentConfirmed: z.boolean(),
  paymentDueDate: z.date().optional().nullable(),
});

type ProjectForm = z.infer<typeof projectSchema>;

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project?: ProjectWithRelations | null;
}

// 見積り入力用の型
interface EstimateInput {
  type: 'CLIENT' | 'OUTSOURCING';
  description: string;
  url: string;
  pdfPath?: string;
  pdfName?: string;
}

export function ProjectModal({ isOpen, onClose, project }: ProjectModalProps) {
  const [loading, setLoading] = useState(false);
  const { clients, refresh: refreshClients } = useClients();
  const { partners, refresh: refreshPartners } = useOutsourcingPartners();
  const [showClientModal, setShowClientModal] = useState(false);
  const [showPartnerModal, setShowPartnerModal] = useState(false);

  // 見積り管理
  const [estimates, setEstimates] = useState<ProjectEstimate[]>([]);
  const [showEstimateForm, setShowEstimateForm] = useState(false);
  const [estimateFormType, setEstimateFormType] = useState<'CLIENT' | 'OUTSOURCING'>('CLIENT');
  const [newEstimate, setNewEstimate] = useState<EstimateInput>({
    type: 'CLIENT',
    description: '',
    url: '',
  });
  const [editingEstimateId, setEditingEstimateId] = useState<number | null>(null);
  const [uploadingPdf, setUploadingPdf] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<ProjectForm>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      salesStatus: SalesStatus.CONSULTING,
      progressStatus: ProgressStatus.NOT_STARTED,
      hasOutsourcing: false,
      outsourcingPartnerIds: [],
      outsourcingInvoiceReceived: false,
      outsourcingPaymentMade: false,
      amount: 0,
      outsourcingCost: 0,
      invoiceIssued: false,
      paymentConfirmed: false,
    },
  });

  const watchHasOutsourcing = watch('hasOutsourcing');
  const watchInvoiceIssued = watch('invoiceIssued');
  const watchOrderDate = watch('orderDate');
  const watchOutsourcingPartnerIds: string[] = watch('outsourcingPartnerIds') || [];

  useEffect(() => {
    // クライアント一覧がロードされるまで待つ（編集時のみ）
    if (project && clients.length === 0) {
      return;
    }

    if (project) {
      reset({
        name: project.name,
        description: project.description || '',
        clientId: project.clientId.toString(),
        salesStatus: project.salesStatus,
        progressStatus: project.progressStatus,
        consultationDate: project.consultationDate ? new Date(project.consultationDate) : null,
        orderDate: project.orderDate ? new Date(project.orderDate) : null,
        startDate: project.startDate ? new Date(project.startDate) : null,
        firstDraftDate: project.firstDraftDate ? new Date(project.firstDraftDate) : null,
        deliveryDate: project.deliveryDate ? new Date(project.deliveryDate) : null,
        hasOutsourcing: project.hasOutsourcing,
        outsourcingPartnerIds: project.projectPartners && project.projectPartners.length > 0
          ? project.projectPartners.map(pp => pp.outsourcingPartner.id.toString())
          : [],
        outsourcingPartnerSheetUrl: project.outsourcingPartnerSheetUrl || '',
        outsourcingInvoiceReceived: project.outsourcingInvoiceReceived || false,
        outsourcingPaymentMade: project.outsourcingPaymentMade || false,
        outsourcingPaymentDate: project.outsourcingPaymentDate ? new Date(project.outsourcingPaymentDate) : null,
        clientSheetUrl: project.clientSheetUrl || '',
        amount: project.amount,
        outsourcingCost: project.outsourcingCost || 0,
        invoiceIssued: project.invoiceIssued,
        paymentConfirmed: project.paymentConfirmed,
        paymentDueDate: project.paymentDueDate ? new Date(project.paymentDueDate) : null,
      });
      // 見積りをセット
      setEstimates(project.estimates || []);
    } else {
      reset({
        salesStatus: SalesStatus.CONSULTING,
        progressStatus: ProgressStatus.NOT_STARTED,
        hasOutsourcing: false,
        outsourcingPartnerIds: [],
        outsourcingInvoiceReceived: false,
        outsourcingPaymentMade: false,
        amount: 0,
        outsourcingCost: 0,
        invoiceIssued: false,
        paymentConfirmed: false,
      });
      // 新規作成時は見積りをリセット
      setEstimates([]);
    }
  }, [project, reset, clients]);

  // 請求書発行チェック時に、チェックした日の翌月末を支払い期限に設定
  const prevInvoiceIssued = useRef(watchInvoiceIssued);
  useEffect(() => {
    // チェックが false → true に変わった時のみ設定
    if (watchInvoiceIssued && !prevInvoiceIssued.current) {
      const today = new Date();
      const dueDate = endOfMonth(addMonths(today, 1));
      setValue('paymentDueDate', dueDate);
    }
    prevInvoiceIssued.current = watchInvoiceIssued;
  }, [watchInvoiceIssued, setValue]);

  // 外注請求書受領チェック時に、チェックした日の翌月末を振込予定日に設定
  const watchOutsourcingInvoiceReceived = watch('outsourcingInvoiceReceived');
  const prevOutsourcingInvoiceReceived = useRef(watchOutsourcingInvoiceReceived);
  useEffect(() => {
    // チェックが false → true に変わった時のみ設定
    if (watchOutsourcingInvoiceReceived && !prevOutsourcingInvoiceReceived.current) {
      const today = new Date();
      const paymentDate = endOfMonth(addMonths(today, 1));
      setValue('outsourcingPaymentDate', paymentDate);
    }
    prevOutsourcingInvoiceReceived.current = watchOutsourcingInvoiceReceived;
  }, [watchOutsourcingInvoiceReceived, setValue]);

  // 見積りPDFアップロード処理
  const handleEstimatePdfUpload = async (file: File) => {
    setUploadingPdf(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', newEstimate.type.toLowerCase());

      const response = await fetch('/api/projects/upload-estimate', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('アップロードに失敗しました');
      }

      const { pdfPath, pdfName } = await response.json();
      setNewEstimate(prev => ({ ...prev, pdfPath, pdfName }));
    } catch (error) {
      alert('PDFのアップロードに失敗しました');
    } finally {
      setUploadingPdf(false);
    }
  };

  // 見積り追加
  const handleAddEstimate = async () => {
    if (!project) return;
    if (!newEstimate.url && !newEstimate.pdfPath) {
      alert('URLまたはPDFを指定してください');
      return;
    }

    try {
      const response = await fetch(`/api/projects/${project.id}/estimates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEstimate),
      });

      if (!response.ok) throw new Error('見積りの追加に失敗しました');

      const addedEstimate = await response.json();
      setEstimates(prev => [addedEstimate, ...prev]);
      setNewEstimate({ type: estimateFormType, description: '', url: '' });
      setShowEstimateForm(false);
    } catch (error) {
      alert('見積りの追加に失敗しました');
    }
  };

  // 見積り削除
  const handleDeleteEstimate = async (estimateId: number) => {
    if (!project) return;
    if (!confirm('この見積りを削除しますか？')) return;

    try {
      const response = await fetch(`/api/projects/${project.id}/estimates/${estimateId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('見積りの削除に失敗しました');

      setEstimates(prev => prev.filter(e => e.id !== estimateId));
    } catch (error) {
      alert('見積りの削除に失敗しました');
    }
  };

  // 見積り更新
  const handleUpdateEstimate = async () => {
    if (!project || editingEstimateId === null) return;
    if (!newEstimate.url && !newEstimate.pdfPath) {
      alert('URLまたはPDFを指定してください');
      return;
    }

    try {
      const response = await fetch(`/api/projects/${project.id}/estimates/${editingEstimateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEstimate),
      });

      if (!response.ok) throw new Error('見積りの更新に失敗しました');

      const updatedEstimate = await response.json();
      setEstimates(prev => prev.map(e => e.id === editingEstimateId ? updatedEstimate : e));
      setNewEstimate({ type: estimateFormType, description: '', url: '' });
      setEditingEstimateId(null);
      setShowEstimateForm(false);
    } catch (error) {
      alert('見積りの更新に失敗しました');
    }
  };

  // 見積りフォームを開く（新規追加）
  const openEstimateForm = (type: 'CLIENT' | 'OUTSOURCING') => {
    setEstimateFormType(type);
    setNewEstimate({ type, description: '', url: '' });
    setEditingEstimateId(null);
    setShowEstimateForm(true);
  };

  // 見積り編集フォームを開く
  const openEstimateEditForm = (estimate: ProjectEstimate) => {
    setEstimateFormType(estimate.type as 'CLIENT' | 'OUTSOURCING');
    setNewEstimate({
      type: estimate.type as 'CLIENT' | 'OUTSOURCING',
      description: estimate.description || '',
      url: estimate.url || '',
      pdfPath: estimate.pdfPath || undefined,
      pdfName: estimate.pdfName || undefined,
    });
    setEditingEstimateId(estimate.id);
    setShowEstimateForm(true);
  };

  const onSubmit = async (data: ProjectForm) => {
    setLoading(true);

    try {
      const payload = {
        ...data,
        clientId: parseInt(data.clientId),
        outsourcingPartnerIds: data.outsourcingPartnerIds?.map(id => parseInt(id)) || [],
        consultationDate: data.consultationDate?.toISOString(),
        orderDate: data.orderDate?.toISOString(),
        startDate: data.startDate?.toISOString(),
        firstDraftDate: data.firstDraftDate?.toISOString(),
        deliveryDate: data.deliveryDate?.toISOString(),
        paymentDueDate: data.paymentDueDate?.toISOString(),
        outsourcingPaymentDate: data.outsourcingPaymentDate?.toISOString(),
      };

      const url = project ? `/api/projects/${project.id}` : '/api/projects';
      const method = project ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to save project');
      }

      onClose();
    } catch (error) {
      alert('案件の保存に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={project ? '案件を編集' : '新規案件作成'}
      size="xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* 基本情報 */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">基本情報</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                案件名 *
              </label>
              <Input
                {...register('name')}
                placeholder="案件名を入力"
              />
              {errors.name && (
                <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                クライアント *
              </label>
              <Select
                {...register('clientId')}
                onChange={(e) => {
                  if (e.target.value === '__add_new__') {
                    setShowClientModal(true);
                    e.target.value = watch('clientId') || '';
                  } else {
                    setValue('clientId', e.target.value);
                  }
                }}
              >
                <option value="">クライアントを選択</option>
                <option value="__add_new__" className="text-orange-600 font-medium">
                  + 新規クライアントを追加
                </option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </Select>
              {errors.clientId && (
                <p className="text-sm text-red-600 mt-1">{errors.clientId.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              案件の内容
            </label>
            <textarea
              {...register('description')}
              className="w-full h-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="案件の詳細を入力"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                営業ステータス
              </label>
              <Select {...register('salesStatus')}>
                <option value={SalesStatus.CONSULTING}>相談中</option>
                <option value={SalesStatus.QUOTE_SUBMITTED}>お見積り提示中</option>
                <option value="ORDER_CONFIRMED">受注確定</option>
                <option value={SalesStatus.IN_PROGRESS}>進行中</option>
                <option value={SalesStatus.DELIVERED}>納品</option>
                <option value={SalesStatus.WAITING_CONTACT}>連絡待ち</option>
                <option value={SalesStatus.LOST}>失注</option>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                進行ステータス
              </label>
              <Select {...register('progressStatus')}>
                <option value={ProgressStatus.NOT_STARTED}>未着手</option>
                <option value={ProgressStatus.DESIGNING}>デザイン中</option>
                <option value={ProgressStatus.CODING}>コーディング中</option>
                <option value={ProgressStatus.REVIEWING}>確認中</option>
                <option value={ProgressStatus.REVISING}>修正中</option>
                <option value={ProgressStatus.DELIVERED}>納品済</option>
              </Select>
            </div>
          </div>
        </div>

        {/* スケジュール */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">スケジュール</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                相談日
              </label>
              <DatePicker
                selected={watch('consultationDate')}
                onChange={(date) => setValue('consultationDate', date)}
                placeholderText="相談日を選択"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                受注日
              </label>
              <DatePicker
                selected={watch('orderDate')}
                onChange={(date) => setValue('orderDate', date)}
                placeholderText="受注日を選択"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                着手日
              </label>
              <DatePicker
                selected={watch('startDate')}
                onChange={(date) => setValue('startDate', date)}
                placeholderText="着手日を選択"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                初稿日
              </label>
              <DatePicker
                selected={watch('firstDraftDate')}
                onChange={(date) => setValue('firstDraftDate', date)}
                placeholderText="初稿日を選択"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                納品日
              </label>
              <DatePicker
                selected={watch('deliveryDate')}
                onChange={(date) => setValue('deliveryDate', date)}
                placeholderText="納品日を選択"
              />
            </div>
          </div>
        </div>

        {/* 工程管理 */}
        {project && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">工程管理</h3>
              <p className="text-sm text-gray-500">デザイン・コーディングなど工程ごとの日程を管理</p>
            </div>
            <ProjectPhases projectId={project.id} />
          </div>
        )}

        {/* 外注・共有 */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">外注・共有</h3>

          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                {...register('hasOutsourcing')}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">外注あり</span>
            </label>
          </div>

          {watchHasOutsourcing && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  外注パートナー（複数選択可）
                </label>
                <div className="border border-gray-300 rounded-md p-3 max-h-48 overflow-y-auto bg-white">
                  <button
                    type="button"
                    onClick={() => setShowPartnerModal(true)}
                    className="w-full text-left text-sm text-orange-600 font-medium hover:bg-orange-50 p-1 rounded mb-2 border-b border-gray-200 pb-2"
                  >
                    + 新規パートナーを追加
                  </button>
                  {partners.length === 0 ? (
                    <p className="text-sm text-gray-500">パートナーが登録されていません</p>
                  ) : (
                    <div className="space-y-2">
                      {partners.map((partner) => (
                        <label key={partner.id} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                          <input
                            type="checkbox"
                            value={partner.id}
                            checked={watchOutsourcingPartnerIds.includes(partner.id.toString())}
                            onChange={(e) => {
                              const currentIds = watchOutsourcingPartnerIds;
                              const partnerId = e.target.value;
                              if (e.target.checked) {
                                setValue('outsourcingPartnerIds', [...currentIds, partnerId]);
                              } else {
                                setValue('outsourcingPartnerIds', currentIds.filter(id => id !== partnerId));
                              }
                            }}
                            className="rounded border-gray-300"
                          />
                          <span className="text-sm text-gray-700">
                            {partner.name}
                            <span className="text-xs text-gray-500 ml-2">
                              ({partner.type === 'DESIGNER' ? 'デザイナー' : 'コーダー'})
                            </span>
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  外注パートナー共有用管理シートURL
                </label>
                <Input
                  {...register('outsourcingPartnerSheetUrl')}
                  placeholder="https://..."
                />
              </div>
            </div>

            {/* 外注パートナーからの見積り（リスト表示） */}
            {project && (
              <div className="mt-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-orange-800">📄 外注パートナーからの見積り</h4>
                  <button
                    type="button"
                    onClick={() => openEstimateForm('OUTSOURCING')}
                    className="flex items-center gap-1 text-xs text-orange-600 hover:text-orange-800"
                  >
                    <Plus size={14} />
                    追加
                  </button>
                </div>
                <div className="space-y-2">
                  {estimates.filter(e => e.type === 'OUTSOURCING').length === 0 ? (
                    <p className="text-sm text-gray-500">見積りがありません</p>
                  ) : (
                    estimates.filter(e => e.type === 'OUTSOURCING').map(estimate => (
                      <div key={estimate.id} className="flex items-center justify-between bg-white p-2 rounded border border-orange-100">
                        <div className="flex items-center gap-2 text-sm">
                          {estimate.pdfName ? (
                            <a href={estimate.pdfPath || '#'} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-orange-600 hover:underline">
                              <FileText size={14} />
                              {estimate.pdfName}
                            </a>
                          ) : estimate.url ? (
                            <a href={estimate.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-orange-600 hover:underline">
                              <ExternalLink size={14} />
                              {estimate.description || 'リンク'}
                            </a>
                          ) : null}
                          {estimate.description && !estimate.url && !estimate.pdfName && (
                            <span className="text-gray-600">{estimate.description}</span>
                          )}
                          {estimate.description && (estimate.url || estimate.pdfName) && (
                            <span className="text-gray-500 text-xs">({estimate.description})</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEstimateEditForm(estimate)}
                            className="text-gray-400 hover:text-orange-600"
                            title="編集"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteEstimate(estimate.id)}
                            className="text-red-500 hover:text-red-700"
                            title="削除"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* 外注支払い管理 */}
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-3">外注支払い管理</h4>
              <div className="flex flex-wrap gap-4 items-center">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register('outsourcingInvoiceReceived')}
                    className="rounded border-gray-300 text-blue-600"
                  />
                  <span className="text-sm text-gray-700">請求書受領</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register('outsourcingPaymentMade')}
                    className="rounded border-gray-300 text-green-600"
                  />
                  <span className="text-sm text-gray-700">振込済</span>
                </label>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-700">振込予定日:</span>
                  <DatePicker
                    selected={watch('outsourcingPaymentDate')}
                    onChange={(date) => setValue('outsourcingPaymentDate', date)}
                    placeholderText="振込予定日を選択"
                  />
                </div>
              </div>
            </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              クライアント共有用管理シートURL
            </label>
            <Input
              {...register('clientSheetUrl')}
              placeholder="https://..."
            />
          </div>

          {/* クライアント向け見積り（リスト表示） */}
          {project && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-blue-800">📄 クライアント向け見積り</h4>
                <button
                  type="button"
                  onClick={() => openEstimateForm('CLIENT')}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                >
                  <Plus size={14} />
                  追加
                </button>
              </div>
              <div className="space-y-2">
                {estimates.filter(e => e.type === 'CLIENT').length === 0 ? (
                  <p className="text-sm text-gray-500">見積りがありません</p>
                ) : (
                  estimates.filter(e => e.type === 'CLIENT').map(estimate => (
                    <div key={estimate.id} className="flex items-center justify-between bg-white p-2 rounded border border-blue-100">
                      <div className="flex items-center gap-2 text-sm">
                        {estimate.pdfName ? (
                          <a href={estimate.pdfPath || '#'} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-600 hover:underline">
                            <FileText size={14} />
                            {estimate.pdfName}
                          </a>
                        ) : estimate.url ? (
                          <a href={estimate.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-600 hover:underline">
                            <ExternalLink size={14} />
                            {estimate.description || 'リンク'}
                          </a>
                        ) : null}
                        {estimate.description && !estimate.url && !estimate.pdfName && (
                          <span className="text-gray-600">{estimate.description}</span>
                        )}
                        {estimate.description && (estimate.url || estimate.pdfName) && (
                          <span className="text-gray-500 text-xs">({estimate.description})</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEstimateEditForm(estimate)}
                          className="text-gray-400 hover:text-blue-600"
                          title="編集"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteEstimate(estimate.id)}
                          className="text-red-500 hover:text-red-700"
                          title="削除"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* 見積り追加フォーム（モーダル内モーダル） */}
          {showEstimateForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h3 className="text-lg font-medium mb-4">
                  {editingEstimateId
                    ? (estimateFormType === 'CLIENT' ? 'クライアント向け見積りを編集' : '外注パートナーからの見積りを編集')
                    : (estimateFormType === 'CLIENT' ? 'クライアント向け見積りを追加' : '外注パートナーからの見積りを追加')
                  }
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      説明（任意）
                    </label>
                    <Input
                      value={newEstimate.description}
                      onChange={(e) => setNewEstimate(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="例：初回見積り、追加見積り"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      URL（Googleドライブ等）
                    </label>
                    <Input
                      value={newEstimate.url}
                      onChange={(e) => setNewEstimate(prev => ({ ...prev, url: e.target.value }))}
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      またはPDFをアップロード
                    </label>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleEstimatePdfUpload(file);
                      }}
                      className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                      disabled={uploadingPdf}
                    />
                    {uploadingPdf && <span className="text-sm text-gray-500 ml-2">アップロード中...</span>}
                    {newEstimate.pdfName && (
                      <div className="mt-2 text-sm text-green-600">
                        📎 {newEstimate.pdfName}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-6">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setShowEstimateForm(false);
                      setEditingEstimateId(null);
                    }}
                  >
                    キャンセル
                  </Button>
                  <Button
                    type="button"
                    onClick={editingEstimateId ? handleUpdateEstimate : handleAddEstimate}
                  >
                    {editingEstimateId ? '更新' : '追加'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 請求・支払い */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">請求・支払い</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                売上金額（円）
              </label>
              <Input
                type="number"
                {...register('amount', { valueAsNumber: true })}
                placeholder="0"
              />
              {errors.amount && (
                <p className="text-sm text-red-600 mt-1">{errors.amount.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                外注費（円）
              </label>
              <Input
                type="number"
                {...register('outsourcingCost', { valueAsNumber: true })}
                placeholder="0"
              />
              {errors.outsourcingCost && (
                <p className="text-sm text-red-600 mt-1">{errors.outsourcingCost.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                利益額（円）
              </label>
              <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-sm font-medium">
                {(watch('amount') || 0) - (watch('outsourcingCost') || 0)}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              支払い期限
            </label>
            <DatePicker
              selected={watch('paymentDueDate')}
              onChange={(date) => setValue('paymentDueDate', date)}
              placeholderText="支払い期限を選択"
            />
          </div>

          <div className="flex space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                {...register('invoiceIssued')}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">請求書発行済</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                {...register('paymentConfirmed')}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">入金確認済</span>
            </label>
          </div>
        </div>

        {/* アクションボタン */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={loading}
          >
            キャンセル
          </Button>
          <Button
            type="submit"
            disabled={loading}
          >
            {loading ? '保存中...' : project ? '更新' : '作成'}
          </Button>
        </div>
      </form>

      {/* クライアント追加モーダル */}
      <QuickAddClientModal
        isOpen={showClientModal}
        onClose={() => setShowClientModal(false)}
        onCreated={(client) => {
          refreshClients();
          setValue('clientId', client.id.toString());
        }}
      />

      {/* パートナー追加モーダル */}
      <QuickAddPartnerModal
        isOpen={showPartnerModal}
        onClose={() => setShowPartnerModal(false)}
        onCreated={(partner) => {
          refreshPartners();
          const currentIds = watchOutsourcingPartnerIds;
          setValue('outsourcingPartnerIds', [...currentIds, partner.id.toString()]);
        }}
      />
    </Modal>
  );
}