'use client';

import { useState, useEffect } from 'react';
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
import { ProjectWithRelations, SalesStatus, ProgressStatus } from '@/types';
import { addMonths, endOfMonth } from 'date-fns';

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

export function ProjectModal({ isOpen, onClose, project }: ProjectModalProps) {
  const [loading, setLoading] = useState(false);
  const { clients } = useClients();
  const { partners } = useOutsourcingPartners();

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
      amount: 0,
      outsourcingCost: 0,
      invoiceIssued: false,
      paymentConfirmed: false,
    },
  });

  const watchHasOutsourcing = watch('hasOutsourcing');
  const watchInvoiceIssued = watch('invoiceIssued');
  const watchOrderDate = watch('orderDate');
  const watchOutsourcingPartnerIds = watch('outsourcingPartnerIds') || [];

  useEffect(() => {
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
        clientSheetUrl: project.clientSheetUrl || '',
        amount: project.amount,
        outsourcingCost: project.outsourcingCost || 0,
        invoiceIssued: project.invoiceIssued,
        paymentConfirmed: project.paymentConfirmed,
        paymentDueDate: project.paymentDueDate ? new Date(project.paymentDueDate) : null,
      });
    } else {
      reset({
        salesStatus: SalesStatus.CONSULTING,
        progressStatus: ProgressStatus.NOT_STARTED,
        hasOutsourcing: false,
        outsourcingPartnerIds: [],
        amount: 0,
        outsourcingCost: 0,
        invoiceIssued: false,
        paymentConfirmed: false,
      });
    }
  }, [project, reset]);

  useEffect(() => {
    if (watchInvoiceIssued && watchOrderDate && !watch('paymentDueDate')) {
      const dueDate = endOfMonth(addMonths(watchOrderDate, 1));
      setValue('paymentDueDate', dueDate);
    }
  }, [watchInvoiceIssued, watchOrderDate, setValue, watch]);

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
              <Select {...register('clientId')}>
                <option value="">クライアントを選択</option>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  外注パートナー（複数選択可）
                </label>
                <div className="border border-gray-300 rounded-md p-3 max-h-48 overflow-y-auto bg-white">
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
    </Modal>
  );
}