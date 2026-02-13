'use client';

import { useState } from 'react';
import { format, addDays, subDays, differenceInDays } from 'date-fns';
import { ja } from 'date-fns/locale';
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Circle,
  AlertTriangle,
  Pencil,
  Clock,
  FileText,
  MessageSquare,
  CreditCard,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useDailyChecks } from '@/hooks/useDailyChecks';
import { SALES_STATUS_LABELS, PROGRESS_STATUS_LABELS, TASK_PRIORITY_LABELS } from '@/types';
import { ProjectModal } from '@/components/ProjectModal';
import type { ProjectWithRelations } from '@/types';

function formatDateStr(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

function getSalesStatusStyle(status: string): string {
  switch (status) {
    case 'CONSULTING': return 'bg-gray-100 text-gray-800';
    case 'QUOTE_SUBMITTED': return 'bg-yellow-100 text-yellow-800';
    case 'ORDER_CONFIRMED': return 'bg-purple-100 text-purple-800';
    case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800';
    case 'DELIVERED': return 'bg-green-100 text-green-800';
    case 'WAITING_CONTACT': return 'bg-orange-100 text-orange-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

function getProgressStatusStyle(status: string): string {
  switch (status) {
    case 'NOT_STARTED': return 'bg-gray-100 text-gray-800';
    case 'DESIGNING': return 'bg-pink-100 text-pink-800';
    case 'CODING': return 'bg-indigo-100 text-indigo-800';
    case 'REVIEWING': return 'bg-yellow-100 text-yellow-800';
    case 'REVISING': return 'bg-orange-100 text-orange-800';
    case 'DELIVERED': return 'bg-green-100 text-green-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

// 案件のチェック観点を返す
function getCheckPoints(project: ProjectWithRelations): { icon: React.ReactNode; text: string; warn: boolean }[] {
  const points: { icon: React.ReactNode; text: string; warn: boolean }[] = [];
  const status = project.salesStatus;

  if (status === 'CONSULTING' || status === 'QUOTE_SUBMITTED' || status === 'WAITING_CONTACT') {
    points.push({
      icon: <MessageSquare className="h-3.5 w-3.5" />,
      text: '進捗確認・連絡できているか',
      warn: false,
    });
  }

  if (status === 'ORDER_CONFIRMED' || status === 'IN_PROGRESS') {
    // スケジュールチェック
    if (project.deliveryDate) {
      const daysLeft = differenceInDays(new Date(project.deliveryDate), new Date());
      if (daysLeft < 0) {
        points.push({ icon: <Clock className="h-3.5 w-3.5" />, text: `納期超過（${Math.abs(daysLeft)}日）`, warn: true });
      } else if (daysLeft <= 7) {
        points.push({ icon: <Clock className="h-3.5 w-3.5" />, text: `納期まで${daysLeft}日`, warn: true });
      } else {
        points.push({ icon: <Clock className="h-3.5 w-3.5" />, text: `納期まで${daysLeft}日`, warn: false });
      }
    } else {
      points.push({ icon: <Clock className="h-3.5 w-3.5" />, text: '納期未設定', warn: true });
    }
  }

  if (status === 'DELIVERED') {
    if (!project.invoiceIssued) {
      points.push({ icon: <FileText className="h-3.5 w-3.5" />, text: '請求書未発行', warn: true });
    } else {
      points.push({ icon: <FileText className="h-3.5 w-3.5" />, text: '請求書発行済', warn: false });
    }
    if (!project.paymentConfirmed) {
      points.push({ icon: <CreditCard className="h-3.5 w-3.5" />, text: '入金未確認', warn: true });
    }
  }

  return points;
}

// ステータスグループの定義
interface StatusGroup {
  key: string;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  statuses: string[];
}

const STATUS_GROUPS: StatusGroup[] = [
  {
    key: 'in_progress',
    label: '進行中の案件',
    color: 'text-blue-800',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    statuses: ['ORDER_CONFIRMED', 'IN_PROGRESS'],
  },
  {
    key: 'consulting',
    label: '相談・見積り中の案件',
    color: 'text-yellow-800',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    statuses: ['CONSULTING', 'QUOTE_SUBMITTED', 'WAITING_CONTACT'],
  },
  {
    key: 'delivered',
    label: '納品済み（請求・入金確認）',
    color: 'text-green-800',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    statuses: ['DELIVERED'],
  },
];

export function DailyCheck() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const dateStr = formatDateStr(selectedDate);
  const { projects, checks, upcomingTasks, loading, toggleCheck, refresh } = useDailyChecks(dateStr);

  const [editingProject, setEditingProject] = useState<ProjectWithRelations | null>(null);

  const totalCount = projects.length;
  const checkedCount = checks.size;
  const uncheckedCount = totalCount - checkedCount;
  const percentage = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;

  const goToPreviousDay = () => setSelectedDate(prev => subDays(prev, 1));
  const goToNextDay = () => setSelectedDate(prev => addDays(prev, 1));
  const goToToday = () => setSelectedDate(new Date());

  // ステータス別にグルーピング
  const groupedProjects = STATUS_GROUPS.map(group => ({
    ...group,
    projects: projects.filter(p => group.statuses.includes(p.salesStatus)),
  })).filter(g => g.projects.length > 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 日付ナビゲーション */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">デイリーチェック</h1>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" onClick={goToPreviousDay}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="primary" size="sm" onClick={goToToday}>
            今日
          </Button>
          <span className="text-lg font-semibold text-gray-900 min-w-[200px] text-center">
            {format(selectedDate, 'yyyy年M月d日（E）', { locale: ja })}
          </span>
          <Button variant="ghost" size="sm" onClick={goToNextDay}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* サマリーカード */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-sm font-medium text-gray-500 mb-1">全案件</div>
          <div className="text-3xl font-bold text-gray-900">{totalCount}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-sm font-medium text-gray-500 mb-1">チェック済み</div>
          <div className="text-3xl font-bold text-green-600">{checkedCount}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-sm font-medium text-gray-500 mb-1">未チェック</div>
          <div className="text-3xl font-bold text-gray-900">{uncheckedCount}</div>
        </div>
      </div>

      {/* 進捗バー */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">進捗</span>
          <span className="text-sm font-bold text-green-600">{percentage}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-green-500 h-3 rounded-full transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* ステータス別 案件グループ */}
      {groupedProjects.map(group => (
        <div key={group.key} className={`rounded-lg border ${group.borderColor} overflow-hidden`}>
          <div className={`${group.bgColor} px-4 py-3 border-b ${group.borderColor}`}>
            <h3 className={`text-sm font-semibold ${group.color}`}>
              {group.label}
              <span className="ml-2 text-xs font-normal">（{group.projects.length}件）</span>
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 w-12">
                    チェック
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">
                    案件名
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">
                    クライアント
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">
                    営業ステータス
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">
                    進行ステータス
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">
                    納期
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">
                    チェック観点
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 w-12">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {group.projects.map(project => {
                  const isChecked = checks.has(project.id);
                  const checkPoints = getCheckPoints(project);
                  return (
                    <tr
                      key={project.id}
                      className={`hover:bg-gray-50 ${isChecked ? 'bg-green-50/50' : ''}`}
                    >
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleCheck(project.id)}
                          className="focus:outline-none"
                        >
                          {isChecked ? (
                            <CheckCircle2 className="h-6 w-6 text-green-500" />
                          ) : (
                            <Circle className="h-6 w-6 text-gray-300 hover:text-gray-400" />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {project.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {project.client?.name || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSalesStatusStyle(project.salesStatus)}`}>
                          {SALES_STATUS_LABELS[project.salesStatus as keyof typeof SALES_STATUS_LABELS] || project.salesStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getProgressStatusStyle(project.progressStatus)}`}>
                          {PROGRESS_STATUS_LABELS[project.progressStatus as keyof typeof PROGRESS_STATUS_LABELS] || project.progressStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {project.deliveryDate
                          ? format(new Date(project.deliveryDate), 'M/d', { locale: ja })
                          : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          {checkPoints.map((point, i) => (
                            <span
                              key={i}
                              className={`inline-flex items-center gap-1 text-xs ${
                                point.warn ? 'text-red-600 font-medium' : 'text-gray-500'
                              }`}
                            >
                              {point.icon}
                              {point.text}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setEditingProject(project)}
                          className="text-gray-400 hover:text-orange-600"
                          title="編集"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {projects.length === 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500">
          対象の案件がありません
        </div>
      )}

      {/* 期限間近のタスク */}
      {upcomingTasks.length > 0 && (
        <div className="bg-white rounded-lg border border-orange-200 overflow-hidden">
          <div className="bg-orange-50 px-4 py-3 border-b border-orange-200">
            <h3 className="text-sm font-semibold text-orange-800 flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2" />
              期限間近のタスク（7日以内）
              <span className="ml-2 text-xs font-normal">（{upcomingTasks.length}件）</span>
            </h3>
          </div>
          <div className="divide-y divide-gray-100">
            {upcomingTasks.map(task => {
              const daysLeft = task.dueDate
                ? differenceInDays(new Date(task.dueDate), new Date())
                : null;
              return (
                <div
                  key={task.id}
                  className="flex items-center justify-between px-4 py-3 hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium">
                      {TASK_PRIORITY_LABELS[task.priority as keyof typeof TASK_PRIORITY_LABELS] || task.priority}
                    </span>
                    <span className="text-sm text-gray-900">{task.title}</span>
                    {task.project && (
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                        {task.project.name}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {daysLeft !== null && daysLeft < 0 && (
                      <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded">
                        {Math.abs(daysLeft)}日超過
                      </span>
                    )}
                    {daysLeft !== null && daysLeft === 0 && (
                      <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded">
                        今日
                      </span>
                    )}
                    {daysLeft !== null && daysLeft > 0 && daysLeft <= 3 && (
                      <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-0.5 rounded">
                        あと{daysLeft}日
                      </span>
                    )}
                    <span className="text-sm text-gray-500">
                      {task.dueDate
                        ? format(new Date(task.dueDate), 'M/d（E）', { locale: ja })
                        : '-'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 案件編集モーダル */}
      {editingProject && (
        <ProjectModal
          isOpen={true}
          onClose={() => {
            setEditingProject(null);
            refresh();
          }}
          project={editingProject}
        />
      )}
    </div>
  );
}
