'use client';

import { useState, useRef } from 'react';
import { useProjects } from '@/hooks/useProjects';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ProjectWithRelations, SALES_STATUS_LABELS } from '@/types';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { ja } from 'date-fns/locale';

interface ProjectPhase {
  id: number;
  projectId: number;
  type: 'DESIGN' | 'CODING' | 'OTHER';
  name: string;
  startDate: string | null;
  firstDraftDate: string | null;
  deliveryDate: string | null;
  status: string;
}

export function GanttChart() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const { projects, loading, error } = useProjects();
  const headerScrollRef = useRef<HTMLDivElement>(null);
  const contentScrollRef = useRef<HTMLDivElement>(null);

  // カレンダー部分の横スクロールを同期
  const handleHorizontalScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollLeft = e.currentTarget.scrollLeft;
    if (headerScrollRef.current) {
      headerScrollRef.current.scrollLeft = scrollLeft;
    }
  };

  const handleHeaderHorizontalScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollLeft = e.currentTarget.scrollLeft;
    if (contentScrollRef.current) {
      contentScrollRef.current.scrollLeft = scrollLeft;
    }
  };

  const getProjectsWithDates = () => {
    return projects.filter(project => {
      // 納品済みの案件は表示しない
      if (project.salesStatus === 'DELIVERED') return false;

      const hasProjectDates = project.startDate || project.deliveryDate;
      // 日付が入っている工程のみをカウント
      const phasesWithDates = (project.phases || []).filter((phase: ProjectPhase) =>
        phase.startDate || phase.deliveryDate
      );
      return hasProjectDates || phasesWithDates.length > 0;
    });
  };

  // 日付が入っている工程のみを取得
  const getPhasesWithDates = (phases: ProjectPhase[]) => {
    return phases.filter(phase => phase.startDate || phase.deliveryDate);
  };

  const getDaysInMonth = () => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    return eachDayOfInterval({ start, end });
  };

  const getBarStyle = (startDateStr: string | null, endDateStr: string | null, days: Date[]) => {
    const startDate = startDateStr ? new Date(startDateStr) : null;
    const endDate = endDateStr ? new Date(endDateStr) : null;

    if (!startDate && !endDate) return null;

    const monthStart = days[0];
    const monthEnd = days[days.length - 1];

    const effectiveStart = startDate || endDate;
    const effectiveEnd = endDate || startDate;

    if (!effectiveStart || !effectiveEnd) return null;

    const barStart = effectiveStart < monthStart ? monthStart : effectiveStart;
    const barEnd = effectiveEnd > monthEnd ? monthEnd : effectiveEnd;

    if (barStart > monthEnd || barEnd < monthStart) return null;

    const startIndex = days.findIndex(day => isSameDay(day, barStart));
    const endIndex = days.findIndex(day => isSameDay(day, barEnd));

    if (startIndex === -1 || endIndex === -1) return null;

    const left = startIndex * 25;
    const width = (endIndex - startIndex + 1) * 25;

    return { left: `${left}px`, width: `${width}px` };
  };

  const getPhaseColor = (type: string) => {
    switch (type) {
      case 'DESIGN': return { bg: 'bg-pink-200', text: 'text-pink-800' };
      case 'CODING': return { bg: 'bg-blue-200', text: 'text-blue-800' };
      case 'OTHER': return { bg: 'bg-gray-200', text: 'text-gray-800' };
      default: return { bg: 'bg-gray-200', text: 'text-gray-800' };
    }
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
      {/* スクロールバー非表示用スタイル */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>

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
          <div className="flex flex-col" style={{ maxHeight: '600px' }}>
            {/* ヘッダー行（固定） */}
            <div className="flex border-b border-gray-200 flex-shrink-0">
              {/* 左側ヘッダー */}
              <div className="w-64 flex-shrink-0 bg-gray-50 border-r border-gray-200">
                <div className="flex items-center px-4" style={{ height: '44px' }}>
                  <div className="text-sm font-medium text-gray-900">案件名</div>
                </div>
              </div>
              {/* 右側カレンダーヘッダー */}
              <div
                ref={headerScrollRef}
                className="flex-1 overflow-x-auto scrollbar-hide"
                onScroll={handleHeaderHorizontalScroll}
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                <div className="flex" style={{ minWidth: `${getDaysInMonth().length * 25}px`, height: '44px' }}>
                  {getDaysInMonth().map((day) => (
                    <div
                      key={day.getTime()}
                      className={`text-center text-xs flex items-center justify-center border-r border-gray-200 ${
                        isSameDay(day, new Date()) ? 'bg-blue-100 text-blue-800' : 'text-gray-500 bg-white'
                      }`}
                      style={{ minWidth: '25px', width: '25px' }}
                    >
                      {format(day, 'd', { locale: ja })}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* コンテンツ行（縦スクロール） */}
            <div className="flex-1 overflow-y-auto">
              <div className="flex">
                {/* 左側: 案件名リスト */}
                <div className="w-64 flex-shrink-0 bg-gray-50 border-r border-gray-200">
                  {getProjectsWithDates().map((project, projectIndex) => {
                    const phases = getPhasesWithDates((project.phases || []) as ProjectPhase[]);
                    const rowCount = 1 + phases.length;
                    const rowHeight = 72;

                    return (
                      <div
                        key={project.id}
                        style={{ height: `${rowCount * rowHeight}px` }}
                        className={`border-b-2 border-gray-300 ${projectIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                      >
                        {/* 案件全体の行 */}
                        <div className="p-4 hover:bg-gray-100 flex flex-col justify-center" style={{ height: `${rowHeight}px` }}>
                          <div className="text-sm font-bold text-gray-900 truncate" title={project.name}>
                            {project.name}
                          </div>
                          <div className="text-xs text-gray-500 mt-1 truncate" title={project.client.name}>
                            {project.client.name}
                          </div>
                        </div>

                        {/* 工程の行 */}
                        {phases.map((phase) => {
                          const colors = getPhaseColor(phase.type);
                          return (
                            <div
                              key={phase.id}
                              className="px-4 py-2 hover:bg-gray-100 border-t border-gray-200 flex items-center"
                              style={{ height: `${rowHeight}px` }}
                            >
                              <div className="flex items-center space-x-2 ml-4">
                                <span className={`inline-block px-2 py-0.5 text-xs font-medium ${colors.bg} ${colors.text} rounded`}>
                                  {phase.type === 'DESIGN' ? 'デザイン' : phase.type === 'CODING' ? 'コーディング' : 'その他'}
                                </span>
                                <span className="text-xs text-gray-600 truncate">{phase.name}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>

                {/* 右側: カレンダー部分（横スクロール） */}
                <div
                  ref={contentScrollRef}
                  className="flex-1 overflow-x-auto"
                  onScroll={handleHorizontalScroll}
                >
                  <div style={{ minWidth: `${getDaysInMonth().length * 25}px` }}>
                    {getProjectsWithDates().map((project, projectIndex) => {
                      const days = getDaysInMonth();
                      const phases = getPhasesWithDates((project.phases || []) as ProjectPhase[]);
                      const rowCount = 1 + phases.length;
                      const rowHeight = 72;

                      return (
                        <div
                          key={project.id}
                          style={{ height: `${rowCount * rowHeight}px` }}
                          className={`border-b-2 border-gray-300 ${projectIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                        >
                          {/* 案件全体のバー */}
                          <div className="hover:bg-gray-100 flex items-center justify-center" style={{ height: `${rowHeight}px` }}>
                            <div className="relative w-full" style={{ height: '40px' }}>
                              {(() => {
                                const barStyle = getBarStyle(project.startDate, project.deliveryDate, days);
                                if (!barStyle) return null;
                                return (
                                  <div
                                    className={`absolute rounded ${getStatusColor(project.salesStatus)} opacity-60 flex items-center`}
                                    style={{ ...barStyle, top: '0', height: '40px' }}
                                    title={`${project.name}: 全体期間`}
                                  >
                                    <div className="text-sm text-white px-2 truncate overflow-hidden">
                                      全体
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          </div>

                          {/* 工程別のバー */}
                          {phases.map((phase) => (
                            <div
                              key={phase.id}
                              className="hover:bg-gray-100 border-t border-gray-200 flex items-center justify-center"
                              style={{ height: `${rowHeight}px` }}
                            >
                              <div className="relative w-full" style={{ height: '40px' }}>
                                {(() => {
                                  const barStyle = getBarStyle(phase.startDate, phase.deliveryDate, days);
                                  if (!barStyle) return null;
                                  const colors = getPhaseColor(phase.type);
                                  return (
                                    <div
                                      className={`absolute rounded ${colors.bg} flex items-center`}
                                      style={{ ...barStyle, top: '0', height: '40px' }}
                                      title={`${phase.name}: ${phase.startDate ? format(new Date(phase.startDate), 'M/d', { locale: ja }) : ''} - ${phase.deliveryDate ? format(new Date(phase.deliveryDate), 'M/d', { locale: ja }) : ''}`}
                                    >
                                      <div className={`text-sm ${colors.text} px-2 truncate overflow-hidden font-medium`}>
                                        {phase.name}
                                      </div>
                                    </div>
                                  );
                                })()}
                                {/* 初稿日マーカー */}
                                {phase.firstDraftDate && (() => {
                                  const milestoneDate = new Date(phase.firstDraftDate);
                                  const dayIndex = days.findIndex(day => isSameDay(day, milestoneDate));
                                  if (dayIndex === -1) return null;
                                  const left = (dayIndex * 25) + 12.5;
                                  return (
                                    <div
                                      className="absolute w-3 h-3 bg-yellow-400 rounded-full border-2 border-white shadow-sm z-20"
                                      style={{ left: `${left}px`, top: '18px' }}
                                      title={`初稿: ${format(milestoneDate, 'M/d', { locale: ja })}`}
                                    />
                                  );
                                })()}
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
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
            <div className="w-4 h-4 bg-pink-200 rounded border border-pink-300"></div>
            <span className="text-sm text-gray-600">デザイン工程</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-blue-200 rounded border border-blue-300"></div>
            <span className="text-sm text-gray-600">コーディング工程</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-gray-200 rounded border border-gray-300"></div>
            <span className="text-sm text-gray-600">その他工程</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-yellow-400 rounded-full border border-white"></div>
            <span className="text-sm text-gray-600">初稿日</span>
          </div>
        </div>
      </div>
    </div>
  );
}
