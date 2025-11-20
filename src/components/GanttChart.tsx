'use client';

import { useState } from 'react';
import { useProjects } from '@/hooks/useProjects';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ProjectWithRelations, SALES_STATUS_LABELS } from '@/types';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isWithinInterval } from 'date-fns';
import { ja } from 'date-fns/locale';

export function GanttChart() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const { projects, loading, error } = useProjects();

  const getProjectsWithDates = () => {
    return projects.filter(project =>
      project.startDate || project.deliveryDate || project.consultationDate
    );
  };

  const getDaysInMonth = () => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    return eachDayOfInterval({ start, end });
  };

  const getProjectBarStyle = (project: ProjectWithRelations, days: Date[]) => {
    const startDate = project.startDate ? new Date(project.startDate) : null;
    const deliveryDate = project.deliveryDate ? new Date(project.deliveryDate) : null;

    if (!startDate && !deliveryDate) return null;

    const monthStart = days[0];
    const monthEnd = days[days.length - 1];

    const effectiveStart = startDate || deliveryDate;
    const effectiveEnd = deliveryDate || startDate;

    if (!effectiveStart || !effectiveEnd) return null;

    const barStart = effectiveStart < monthStart ? monthStart : effectiveStart;
    const barEnd = effectiveEnd > monthEnd ? monthEnd : effectiveEnd;

    if (barStart > monthEnd || barEnd < monthStart) return null;

    const startIndex = days.findIndex(day => isSameDay(day, barStart));
    const endIndex = days.findIndex(day => isSameDay(day, barEnd));

    const left = startIndex * 25; // 25px per day
    const width = (endIndex - startIndex + 1) * 25; // 25px per day

    return { left: `${left}px`, width: `${width}px` };
  };

  const getStatusColor = (salesStatus: string) => {
    switch (salesStatus) {
      case 'CONSULTING': return 'bg-yellow-500';
      case 'QUOTE_SUBMITTED': return 'bg-blue-500';
      case 'IN_PROGRESS': return 'bg-orange-500';
      case 'DELIVERED': return 'bg-green-500';
      case 'WAITING_CONTACT': return 'bg-gray-500';
      case 'LOST': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
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
      {/* 月ナビゲーション */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-gray-500" />
          <h2 className="text-xl font-semibold text-gray-900">
            {currentDate.getFullYear()}年{currentDate.getMonth() + 1}月
          </h2>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigateMonth('prev')}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setCurrentDate(new Date())}
          >
            今月
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigateMonth('next')}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* ガントチャート表示エリア */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {getProjectsWithDates().length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">
              日程が設定された案件がありません
            </div>
            <div className="text-sm text-gray-400">
              案件に開始日または納期を設定するとガントチャートで表示されます
            </div>
          </div>
        ) : (
          <div className="flex max-h-[600px]">
            {/* 左側: 案件名リスト */}
            <div className="w-64 flex-shrink-0 bg-gray-50 border-r border-gray-200">
              {/* ヘッダー */}
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <div className="text-sm font-medium text-gray-900">案件名</div>
              </div>

              {/* プロジェクト名リスト - 固定高さで対応 */}
              <div className="max-h-[550px] overflow-y-auto">
                {getProjectsWithDates().map((project) => (
                  <div key={project.id} className="p-4 border-b border-gray-100 hover:bg-gray-100">
                    <div className="text-sm font-medium text-gray-900 truncate" title={project.name}>
                      {project.name}
                    </div>
                    <div className="text-xs text-gray-500 mt-1 truncate" title={project.client.name}>
                      {project.client.name}
                    </div>
                    <div className="mt-1">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        project.salesStatus === 'DELIVERED'
                          ? 'bg-green-100 text-green-800'
                          : project.salesStatus === 'LOST'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {SALES_STATUS_LABELS[project.salesStatus]}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 右側: カレンダー部分 */}
            <div className="flex-1 overflow-x-auto">
              <div style={{ minWidth: `${getDaysInMonth().length * 25}px` }}>
                {/* カレンダーヘッダー */}
                <div className="flex p-2 border-b border-gray-200 bg-white">
                  {getDaysInMonth().map((day, index) => (
                    <div
                      key={day.getTime()}
                      className={`text-center text-xs p-1 border-r border-gray-100 ${
                        isSameDay(day, new Date()) ? 'bg-blue-100 text-blue-800' : 'text-gray-500'
                      }`}
                      style={{ minWidth: '25px', width: '25px' }}
                    >
                      {format(day, 'd', { locale: ja })}
                    </div>
                  ))}
                </div>

                {/* プロジェクト行のカレンダー部分 */}
                <div className="max-h-[550px] overflow-y-auto">
                  {getProjectsWithDates().map((project) => {
                    const days = getDaysInMonth();
                    const barStyle = getProjectBarStyle(project, days);

                    return (
                      <div key={project.id} className="p-2 border-b border-gray-100 hover:bg-gray-50">
                        <div className="relative h-10">
                          {barStyle && (
                            <div
                              className={`absolute top-1 h-6 rounded ${getStatusColor(project.salesStatus)} opacity-80 flex items-center`}
                              style={barStyle}
                              title={`${project.name}: ${
                                project.startDate ? format(new Date(project.startDate), 'M/d', { locale: ja }) : ''
                              } - ${
                                project.deliveryDate ? format(new Date(project.deliveryDate), 'M/d', { locale: ja }) : ''
                              }`}
                            >
                              <div className="text-xs text-white px-2 truncate overflow-hidden">
                                {project.name}
                              </div>
                            </div>
                          )}
                          {/* マイルストーン表示 */}
                          {[
                            { date: project.consultationDate, label: '相談', color: 'bg-yellow-400' },
                            { date: project.orderDate, label: '受注', color: 'bg-blue-400' },
                            { date: project.firstDraftDate, label: '初稿', color: 'bg-purple-400' },
                          ].map(({ date, label, color }, index) => {
                            if (!date) return null;
                            const milestoneDate = new Date(date);
                            const dayIndex = days.findIndex(day => isSameDay(day, milestoneDate));
                            if (dayIndex === -1) return null;

                            const left = (dayIndex * 25) + 12.5; // 25px幅の中央に配置
                            return (
                              <div
                                key={index}
                                className={`absolute w-3 h-3 ${color} rounded-full border-2 border-white shadow-sm z-20`}
                                style={{ left: `${left}px`, top: '16px' }}
                                title={`${label}: ${format(milestoneDate, 'M/d', { locale: ja })}`}
                              />
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 凡例 */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-3">凡例</h3>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-yellow-500 rounded"></div>
            <span className="text-sm text-gray-600">相談中</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span className="text-sm text-gray-600">お見積り提示中</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-orange-500 rounded"></div>
            <span className="text-sm text-gray-600">進行中</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span className="text-sm text-gray-600">納品</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-yellow-400 rounded-full border border-white"></div>
            <span className="text-sm text-gray-600">相談日</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-400 rounded-full border border-white"></div>
            <span className="text-sm text-gray-600">受注日</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-purple-400 rounded-full border border-white"></div>
            <span className="text-sm text-gray-600">初稿日</span>
          </div>
        </div>
      </div>
    </div>
  );
}