'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, DollarSign, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

interface PaymentForecastProject {
  id: number;
  name: string;
  clientName: string;
  amount: number;
  outsourcingCost: number;
  deliveryDate: string;
}

interface MonthlyPaymentForecast {
  month: number;
  income: number;
  expense: number;
  profit: number;
  projects: PaymentForecastProject[];
}

interface AnalyticsData {
  year: number;
  totalOrderAmount: number;
  totalOrderOutsourcingCost: number;
  totalOrderProfit: number;
  totalDeliveryAmount: number;
  totalDeliveryOutsourcingCost: number;
  totalDeliveryProfit: number;
  monthlyOrderAmount: Array<{ month: number; amount: number; outsourcingCost: number; profit: number }>;
  monthlyDeliveryAmount: Array<{ month: number; amount: number; outsourcingCost: number; profit: number }>;
  monthlyCounts: Array<{ month: number; consultationCount: number; orderCount: number; deliveryCount: number }>;
  statusCounts: Array<{ salesStatus: string; _count: { id: number } }>;
  monthlyPaymentForecast?: MonthlyPaymentForecast[];
}

export function Analytics() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedMonth, setExpandedMonth] = useState<number | null>(null);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/analytics?year=${year}`);
      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }
      const result = await response.json();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [year]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
    }).format(amount);
  };

  const generateYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear - 5; i <= currentYear + 1; i++) {
      years.push(i);
    }
    return years;
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
      {/* 年選択 */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">
          {year}年の集計データ
        </h2>
        <div className="w-32">
          <Select
            value={year.toString()}
            onChange={(e) => setYear(parseInt(e.target.value))}
          >
            {generateYearOptions().map((y) => (
              <option key={y} value={y}>
                {y}年
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* サマリーカード */}
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-500">年間受注額</div>
              <div className="text-2xl font-bold text-gray-900">
                {data ? formatCurrency(data.totalOrderAmount) : '-'}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DollarSign className="h-8 w-8 text-red-600" />
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-500">年間外注費</div>
              <div className="text-2xl font-bold text-gray-900">
                {data ? formatCurrency(data.totalOrderOutsourcingCost) : '-'}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-500">年間利益額</div>
              <div className="text-2xl font-bold text-gray-900">
                {data ? formatCurrency(data.totalOrderProfit) : '-'}
              </div>
            </div>
          </div>
        </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-500">納品済売上</div>
              <div className="text-2xl font-bold text-gray-900">
                {data ? formatCurrency(data.totalDeliveryAmount) : '-'}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DollarSign className="h-8 w-8 text-red-600" />
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-500">納品済外注費</div>
              <div className="text-2xl font-bold text-gray-900">
                {data ? formatCurrency(data.totalDeliveryOutsourcingCost) : '-'}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-500">納品済利益額</div>
              <div className="text-2xl font-bold text-gray-900">
                {data ? formatCurrency(data.totalDeliveryProfit) : '-'}
              </div>
            </div>
          </div>
        </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Calendar className="h-8 w-8 text-orange-600" />
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-500">進行中案件</div>
              <div className="text-2xl font-bold text-gray-900">
                {data ? data.statusCounts.reduce((sum, item) => sum + item._count.id, 0) : '-'}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingUp className="h-8 w-8 text-emerald-600" />
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-500">利益率</div>
              <div className="text-2xl font-bold text-gray-900">
                {data && data.totalOrderAmount > 0
                  ? `${((data.totalOrderProfit / data.totalOrderAmount) * 100).toFixed(1)}%`
                  : '-'}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                受注額ベース
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* 月別入金予定表 */}
      {data?.monthlyPaymentForecast && data.monthlyPaymentForecast.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="mb-1">
            <h3 className="text-lg font-medium text-gray-900">
              月別入金予定（納品翌月ベース）
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              納品月の翌月に入金される想定で算出しています
            </p>
          </div>
          <div className="overflow-x-auto mt-4">
            <table className="min-w-[1100px] w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="px-3 py-3 text-left font-medium text-gray-500 whitespace-nowrap w-24">
                    区分
                  </th>
                  {Array.from({ length: 12 }, (_, i) => (
                    <th
                      key={i}
                      className="px-3 py-3 text-right font-medium text-gray-500 whitespace-nowrap cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => setExpandedMonth(expandedMonth === i + 1 ? null : i + 1)}
                    >
                      <div className="flex items-center justify-end gap-1">
                        {i + 1}月
                        {expandedMonth === i + 1 ? (
                          <ChevronUp className="h-3 w-3" />
                        ) : (
                          <ChevronDown className="h-3 w-3" />
                        )}
                      </div>
                    </th>
                  ))}
                  <th className="px-3 py-3 text-right font-semibold text-gray-700 whitespace-nowrap bg-gray-50">
                    合計
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* 入金予定行 */}
                <tr className="border-b border-gray-100 bg-green-50/50">
                  <td className="px-3 py-3 font-medium text-green-700 whitespace-nowrap">
                    入金予定
                  </td>
                  {Array.from({ length: 12 }, (_, i) => {
                    const monthData = data.monthlyPaymentForecast?.find(m => m.month === i + 1);
                    const income = monthData?.income ?? 0;
                    return (
                      <td
                        key={i}
                        className={`px-3 py-3 text-right whitespace-nowrap cursor-pointer hover:bg-green-100 transition-colors ${
                          income === 0 ? 'text-gray-300' : 'text-green-700 font-medium'
                        }`}
                        onClick={() => setExpandedMonth(expandedMonth === i + 1 ? null : i + 1)}
                      >
                        {formatCurrency(income)}
                      </td>
                    );
                  })}
                  <td className="px-3 py-3 text-right font-semibold text-green-700 whitespace-nowrap bg-gray-50">
                    {formatCurrency(
                      data.monthlyPaymentForecast?.reduce((sum, m) => sum + m.income, 0) ?? 0
                    )}
                  </td>
                </tr>
                {/* 出金予定行 */}
                <tr className="border-b border-gray-100 bg-red-50/50">
                  <td className="px-3 py-3 font-medium text-red-700 whitespace-nowrap">
                    出金予定
                  </td>
                  {Array.from({ length: 12 }, (_, i) => {
                    const monthData = data.monthlyPaymentForecast?.find(m => m.month === i + 1);
                    const expense = monthData?.expense ?? 0;
                    return (
                      <td
                        key={i}
                        className={`px-3 py-3 text-right whitespace-nowrap cursor-pointer hover:bg-red-100 transition-colors ${
                          expense === 0 ? 'text-gray-300' : 'text-red-700 font-medium'
                        }`}
                        onClick={() => setExpandedMonth(expandedMonth === i + 1 ? null : i + 1)}
                      >
                        {formatCurrency(expense)}
                      </td>
                    );
                  })}
                  <td className="px-3 py-3 text-right font-semibold text-red-700 whitespace-nowrap bg-gray-50">
                    {formatCurrency(
                      data.monthlyPaymentForecast?.reduce((sum, m) => sum + m.expense, 0) ?? 0
                    )}
                  </td>
                </tr>
                {/* 利益行 */}
                <tr className="border-b border-gray-200 bg-blue-50/50">
                  <td className="px-3 py-3 font-medium text-blue-700 whitespace-nowrap">
                    利益
                  </td>
                  {Array.from({ length: 12 }, (_, i) => {
                    const monthData = data.monthlyPaymentForecast?.find(m => m.month === i + 1);
                    const profit = monthData?.profit ?? 0;
                    return (
                      <td
                        key={i}
                        className={`px-3 py-3 text-right whitespace-nowrap cursor-pointer hover:bg-blue-100 transition-colors font-medium ${
                          profit === 0
                            ? 'text-gray-300'
                            : profit < 0
                              ? 'text-red-600'
                              : 'text-blue-700'
                        }`}
                        onClick={() => setExpandedMonth(expandedMonth === i + 1 ? null : i + 1)}
                      >
                        {formatCurrency(profit)}
                      </td>
                    );
                  })}
                  <td className={`px-3 py-3 text-right font-semibold whitespace-nowrap bg-gray-50 ${
                    (data.monthlyPaymentForecast?.reduce((sum, m) => sum + m.profit, 0) ?? 0) < 0
                      ? 'text-red-600'
                      : 'text-blue-700'
                  }`}>
                    {formatCurrency(
                      data.monthlyPaymentForecast?.reduce((sum, m) => sum + m.profit, 0) ?? 0
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 案件詳細の展開 */}
          {expandedMonth !== null && (() => {
            const monthData = data.monthlyPaymentForecast?.find(m => m.month === expandedMonth);
            if (!monthData || monthData.projects.length === 0) {
              return (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-500">
                    {expandedMonth}月の案件データはありません
                  </p>
                </div>
              );
            }
            return (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-gray-700">
                    {expandedMonth}月の案件一覧（{monthData.projects.length}件）
                  </h4>
                  <button
                    onClick={() => setExpandedMonth(null)}
                    className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    閉じる
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="px-3 py-2 text-left font-medium text-gray-500">案件名</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-500">クライアント</th>
                        <th className="px-3 py-2 text-right font-medium text-gray-500">金額</th>
                        <th className="px-3 py-2 text-right font-medium text-gray-500">外注費</th>
                        <th className="px-3 py-2 text-right font-medium text-gray-500">利益</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-500">納品日</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthData.projects.map((project) => (
                        <tr key={project.id} className="border-b border-gray-100 hover:bg-white transition-colors">
                          <td className="px-3 py-2 text-gray-900">{project.name}</td>
                          <td className="px-3 py-2 text-gray-600">{project.clientName}</td>
                          <td className="px-3 py-2 text-right text-green-700 font-medium whitespace-nowrap">
                            {formatCurrency(project.amount)}
                          </td>
                          <td className="px-3 py-2 text-right text-red-600 whitespace-nowrap">
                            {formatCurrency(project.outsourcingCost)}
                          </td>
                          <td className={`px-3 py-2 text-right font-medium whitespace-nowrap ${
                            project.amount - project.outsourcingCost < 0 ? 'text-red-600' : 'text-blue-700'
                          }`}>
                            {formatCurrency(project.amount - project.outsourcingCost)}
                          </td>
                          <td className="px-3 py-2 text-gray-600 whitespace-nowrap">
                            {project.deliveryDate
                              ? new Date(project.deliveryDate).toLocaleDateString('ja-JP', {
                                  year: 'numeric',
                                  month: '2-digit',
                                  day: '2-digit',
                                })
                              : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* 月別数値テーブル */}
      {data && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">月別数値一覧</h3>
          <div className="overflow-x-auto">
            <table className="min-w-[1100px] w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-3 py-3 text-left font-medium text-gray-500 whitespace-nowrap">月</th>
                  <th className="px-3 py-3 text-right font-medium text-gray-500 whitespace-nowrap">相談数</th>
                  <th className="px-3 py-3 text-right font-medium text-gray-500 whitespace-nowrap">受注数</th>
                  <th className="px-3 py-3 text-right font-medium text-gray-500 whitespace-nowrap">受注額</th>
                  <th className="px-3 py-3 text-right font-medium text-gray-500 whitespace-nowrap">外注費</th>
                  <th className="px-3 py-3 text-right font-medium text-gray-500 whitespace-nowrap">利益額</th>
                  <th className="px-3 py-3 text-right font-medium text-gray-500 whitespace-nowrap">利益率</th>
                  <th className="px-3 py-3 text-right font-medium text-gray-500 whitespace-nowrap">納品数</th>
                  <th className="px-3 py-3 text-right font-medium text-gray-500 whitespace-nowrap">納品額</th>
                  <th className="px-3 py-3 text-right font-medium text-gray-500 whitespace-nowrap">納品利益</th>
                </tr>
              </thead>
              <tbody>
                {data.monthlyOrderAmount.map((order, i) => {
                  const delivery = data.monthlyDeliveryAmount[i];
                  const counts = data.monthlyCounts[i];
                  const profitRate = order.amount > 0
                    ? ((order.profit / order.amount) * 100).toFixed(1)
                    : '-';
                  return (
                    <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-3 py-3 font-medium text-gray-900 whitespace-nowrap">
                        {i + 1}月
                      </td>
                      <td className="px-3 py-3 text-right text-purple-600 font-medium">
                        {counts.consultationCount}
                      </td>
                      <td className="px-3 py-3 text-right text-green-600 font-medium">
                        {counts.orderCount}
                      </td>
                      <td className="px-3 py-3 text-right text-gray-900 whitespace-nowrap">
                        {formatCurrency(order.amount)}
                      </td>
                      <td className="px-3 py-3 text-right text-red-600 whitespace-nowrap">
                        {formatCurrency(order.outsourcingCost)}
                      </td>
                      <td className="px-3 py-3 text-right text-blue-600 font-medium whitespace-nowrap">
                        {formatCurrency(order.profit)}
                      </td>
                      <td className="px-3 py-3 text-right font-medium text-emerald-600">
                        {profitRate === '-' ? '-' : `${profitRate}%`}
                      </td>
                      <td className="px-3 py-3 text-right text-orange-600 font-medium">
                        {counts.deliveryCount}
                      </td>
                      <td className="px-3 py-3 text-right text-gray-900 whitespace-nowrap">
                        {formatCurrency(delivery.amount)}
                      </td>
                      <td className="px-3 py-3 text-right text-blue-600 font-medium whitespace-nowrap">
                        {formatCurrency(delivery.profit)}
                      </td>
                    </tr>
                  );
                })}
                <tr className="border-t-2 border-gray-300 bg-gray-50 font-semibold">
                  <td className="px-3 py-3 text-gray-900">合計</td>
                  <td className="px-3 py-3 text-right text-purple-600">
                    {data.monthlyCounts.reduce((sum, c) => sum + c.consultationCount, 0)}
                  </td>
                  <td className="px-3 py-3 text-right text-green-600">
                    {data.monthlyCounts.reduce((sum, c) => sum + c.orderCount, 0)}
                  </td>
                  <td className="px-3 py-3 text-right text-gray-900 whitespace-nowrap">
                    {formatCurrency(data.totalOrderAmount)}
                  </td>
                  <td className="px-3 py-3 text-right text-red-600 whitespace-nowrap">
                    {formatCurrency(data.totalOrderOutsourcingCost)}
                  </td>
                  <td className="px-3 py-3 text-right text-blue-600 whitespace-nowrap">
                    {formatCurrency(data.totalOrderProfit)}
                  </td>
                  <td className="px-3 py-3 text-right text-emerald-600">
                    {data.totalOrderAmount > 0
                      ? `${((data.totalOrderProfit / data.totalOrderAmount) * 100).toFixed(1)}%`
                      : '-'}
                  </td>
                  <td className="px-3 py-3 text-right text-orange-600">
                    {data.monthlyCounts.reduce((sum, c) => sum + c.deliveryCount, 0)}
                  </td>
                  <td className="px-3 py-3 text-right text-gray-900 whitespace-nowrap">
                    {formatCurrency(data.totalDeliveryAmount)}
                  </td>
                  <td className="px-3 py-3 text-right text-blue-600 whitespace-nowrap">
                    {formatCurrency(data.totalDeliveryProfit)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 月別グラフ（受注ベース） */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">月別推移（受注ベース）</h3>
        {data ? (
          <div className="w-full" style={{ height: '400px' }}>
            <Bar
              data={{
                labels: [
                  '1月', '2月', '3月', '4月', '5月', '6月',
                  '7月', '8月', '9月', '10月', '11月', '12月'
                ],
                datasets: [
                  {
                    label: '受注額',
                    data: data.monthlyOrderAmount.map(m => m.amount),
                    backgroundColor: 'rgba(34, 197, 94, 0.8)',
                    borderColor: 'rgba(34, 197, 94, 1)',
                    borderWidth: 1,
                  },
                  {
                    label: '外注費',
                    data: data.monthlyOrderAmount.map(m => m.outsourcingCost),
                    backgroundColor: 'rgba(239, 68, 68, 0.8)',
                    borderColor: 'rgba(239, 68, 68, 1)',
                    borderWidth: 1,
                  },
                  {
                    label: '利益額',
                    data: data.monthlyOrderAmount.map(m => m.profit),
                    backgroundColor: 'rgba(59, 130, 246, 0.8)',
                    borderColor: 'rgba(59, 130, 246, 1)',
                    borderWidth: 1,
                  }
                ]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'top' as const,
                  },
                  title: {
                    display: true,
                    text: `${year}年 月別受注額・外注費・利益推移`,
                  },
                  tooltip: {
                    callbacks: {
                      label: function(context) {
                        return `${context.dataset.label}: ${formatCurrency(context.raw as number)}`;
                      }
                    }
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      callback: function(value) {
                        return formatCurrency(value as number);
                      }
                    }
                  }
                }
              }}
            />
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-500">データを読み込み中...</div>
          </div>
        )}
      </div>

      {/* 月別グラフ（納品ベース） */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">月別推移（納品ベース）</h3>
        {data ? (
          <div className="w-full" style={{ height: '400px' }}>
            <Bar
              data={{
                labels: [
                  '1月', '2月', '3月', '4月', '5月', '6月',
                  '7月', '8月', '9月', '10月', '11月', '12月'
                ],
                datasets: [
                  {
                    label: '納品額',
                    data: data.monthlyDeliveryAmount.map(m => m.amount),
                    backgroundColor: 'rgba(16, 185, 129, 0.8)',
                    borderColor: 'rgba(16, 185, 129, 1)',
                    borderWidth: 1,
                  },
                  {
                    label: '外注費',
                    data: data.monthlyDeliveryAmount.map(m => m.outsourcingCost),
                    backgroundColor: 'rgba(239, 68, 68, 0.8)',
                    borderColor: 'rgba(239, 68, 68, 1)',
                    borderWidth: 1,
                  },
                  {
                    label: '利益額',
                    data: data.monthlyDeliveryAmount.map(m => m.profit),
                    backgroundColor: 'rgba(59, 130, 246, 0.8)',
                    borderColor: 'rgba(59, 130, 246, 1)',
                    borderWidth: 1,
                  }
                ]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'top' as const,
                  },
                  title: {
                    display: true,
                    text: `${year}年 月別納品額・外注費・利益推移`,
                  },
                  tooltip: {
                    callbacks: {
                      label: function(context) {
                        return `${context.dataset.label}: ${formatCurrency(context.raw as number)}`;
                      }
                    }
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      callback: function(value) {
                        return formatCurrency(value as number);
                      }
                    }
                  }
                }
              }}
            />
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-500">データを読み込み中...</div>
          </div>
        )}
      </div>
    </div>
  );
}