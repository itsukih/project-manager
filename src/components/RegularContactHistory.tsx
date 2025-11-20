'use client';

import { useState, useEffect } from 'react';
import { Copy, Check } from 'lucide-react';
import { RegularContactHistory as History } from '@/types';

export default function RegularContactHistory() {
  const [histories, setHistories] = useState<History[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterYear, setFilterYear] = useState<number>(new Date().getFullYear());
  const [filterMonth, setFilterMonth] = useState<number>(0); // 0 = 全て
  const [copiedId, setCopiedId] = useState<number | null>(null);

  useEffect(() => {
    fetchHistories();
  }, [filterYear, filterMonth]);

  const fetchHistories = async () => {
    try {
      const params = new URLSearchParams();
      if (filterYear) {
        params.append('year', filterYear.toString());
      }
      if (filterMonth > 0) {
        params.append('month', filterMonth.toString());
      }

      const response = await fetch(`/api/regular-contacts/histories?${params}`);
      const data = await response.json();
      setHistories(data);
    } catch (error) {
      console.error('Failed to fetch histories:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAvailableYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear; i >= currentYear - 5; i--) {
      years.push(i);
    }
    return years;
  };

  const getMonthName = (month: number) => {
    const monthNames = [
      '1月', '2月', '3月', '4月', '5月', '6月',
      '7月', '8月', '9月', '10月', '11月', '12月'
    ];
    return monthNames[month - 1];
  };

  const handleCopyContent = async (history: History) => {
    try {
      await navigator.clipboard.writeText(history.content);
      setCopiedId(history.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      alert('コピーに失敗しました');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">読み込み中...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">定期連絡文履歴</h2>
        <div className="flex gap-4 items-center">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">年:</label>
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(parseInt(e.target.value))}
              className="px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {getAvailableYears().map(year => (
                <option key={year} value={year}>{year}年</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">月:</label>
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(parseInt(e.target.value))}
              className="px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={0}>全て</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                <option key={month} value={month}>{getMonthName(month)}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {histories.length === 0 ? (
        <div className="text-center text-gray-500 py-8 bg-white rounded-lg shadow">
          指定した期間の履歴がありません
        </div>
      ) : (
        <div className="space-y-4">
          {histories.map((history) => (
            <div key={history.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold">{history.title}</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                    <span className="font-medium text-blue-600">
                      {history.year}年{getMonthName(history.month)}
                    </span>
                    <span>
                      保存日: {new Date(history.createdAt).toLocaleDateString()}
                    </span>
                    {history.template && (
                      <span className={`px-2 py-1 rounded text-xs ${
                        history.template.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {history.template.isActive ? '使用中' : '未使用'}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleCopyContent(history)}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-500 hover:bg-green-600 text-white rounded transition-colors"
                >
                  {copiedId === history.id ? (
                    <>
                      <Check className="h-4 w-4" />
                      コピー完了
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      全文コピー
                    </>
                  )}
                </button>
              </div>

              <div className="bg-gray-50 p-4 rounded whitespace-pre-wrap">
                {history.content}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}