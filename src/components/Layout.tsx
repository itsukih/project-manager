'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Briefcase,
  Users,
  Building2,
  Calendar,
  BarChart3,
  FileText,
  Menu,
  X,
  LayoutGrid,
  CheckSquare,
  CalendarDays,
  Folder,
  ClipboardCheck,
  AlertCircle,
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { clsx } from 'clsx';
import { format } from 'date-fns';

const navigation = [
  { name: 'デイリーチェック', href: '/daily-check', icon: ClipboardCheck },
  { name: '案件一覧', href: '/', icon: Briefcase },
  { name: '案件ボード', href: '/board', icon: LayoutGrid },
  { name: 'ガントチャート', href: '/gantt', icon: Calendar },
  { name: 'タスク管理', href: '/tasks', icon: CheckSquare },
  { name: 'カレンダー', href: '/calendar', icon: CalendarDays },
  { name: 'クライアント管理', href: '/clients', icon: Users },
  { name: '外注パートナー管理', href: '/partners', icon: Building2 },
  { name: '定期連絡テンプレート', href: '/regular-contacts', icon: FileText },
  { name: 'テンプレート管理', href: '/templates', icon: Folder },
  { name: '集計・分析', href: '/analytics', icon: BarChart3 },
];

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dailyCheckComplete, setDailyCheckComplete] = useState<boolean | null>(null);
  const [showBlockModal, setShowBlockModal] = useState(false);

  const fetchDailyCheckStatus = useCallback(async () => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const response = await fetch(`/api/daily-checks?date=${today}`);
      if (!response.ok) return;
      const data = await response.json();
      const totalProjects = data.projects.length;
      const checkedCount = data.checks.length;
      setDailyCheckComplete(totalProjects === 0 || checkedCount >= totalProjects);
    } catch {
      // エラー時はブロックしない
      setDailyCheckComplete(true);
    }
  }, []);

  useEffect(() => {
    fetchDailyCheckStatus();
  }, [fetchDailyCheckStatus, pathname]);

  // チェック変更時にステータスを再取得
  useEffect(() => {
    const handler = () => fetchDailyCheckStatus();
    window.addEventListener('daily-check-updated', handler);
    return () => window.removeEventListener('daily-check-updated', handler);
  }, [fetchDailyCheckStatus]);

  const handleNavClick = (e: React.MouseEvent, href: string) => {
    // デイリーチェックページ自体は常にアクセス可能
    if (href === '/daily-check') return;
    // チェック未完了ならブロック
    if (dailyCheckComplete === false) {
      e.preventDefault();
      setShowBlockModal(true);
    }
  };

  const renderNavItem = (item: typeof navigation[0], isMobile: boolean) => {
    const isActive = pathname === item.href;
    const Icon = item.icon;
    const isBlocked = item.href !== '/daily-check' && dailyCheckComplete === false;

    return (
      <Link
        key={item.name}
        href={item.href}
        onClick={(e) => {
          handleNavClick(e, item.href);
          if (isMobile) setSidebarOpen(false);
        }}
        className={clsx(
          isActive
            ? 'bg-orange-100 text-orange-800 border-r-2 border-orange-500'
            : isBlocked
            ? 'text-gray-400 cursor-not-allowed'
            : 'text-gray-600 hover:bg-orange-50 hover:text-orange-700',
          isMobile
            ? 'group flex items-center px-2 py-2 text-base font-medium rounded-md'
            : 'group flex items-center px-2 py-2 text-sm font-medium rounded-l-md'
        )}
      >
        <Icon
          className={clsx(
            isActive
              ? 'text-orange-500'
              : isBlocked
              ? 'text-gray-300'
              : 'text-gray-400 group-hover:text-orange-500',
            isMobile ? 'mr-4 flex-shrink-0 h-6 w-6' : 'mr-3 flex-shrink-0 h-5 w-5'
          )}
        />
        {item.name}
        {item.href === '/daily-check' && dailyCheckComplete === false && (
          <span className="ml-auto inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
            未完了
          </span>
        )}
      </Link>
    );
  };

  return (
    <div className="min-h-screen">
      {/* ブロックモーダル */}
      {showBlockModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="h-6 w-6 text-orange-500 flex-shrink-0" />
              <h3 className="text-lg font-semibold text-gray-900">デイリーチェック未完了</h3>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              本日のデイリーチェックが完了していません。<br />
              全案件のチェックを完了してから他のページに移動してください。
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowBlockModal(false);
                  router.push('/daily-check');
                }}
                className="flex-1 px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-md hover:bg-orange-700"
              >
                デイリーチェックへ
              </button>
              <button
                onClick={() => setShowBlockModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-200"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}

      {/* サイドバー（デスクトップ） */}
      <div className="hidden md:flex md:w-64 md:flex-col fixed h-screen z-30">
        <div className="flex flex-col flex-grow pt-5 pb-4 bg-white border-r border-orange-200 overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-4">
            <h1 className="text-xl font-bold text-orange-800">案件管理システム</h1>
          </div>
          <div className="mt-5 flex-grow flex flex-col">
            <nav className="flex-1 px-2 space-y-1">
              {navigation.map((item) => renderNavItem(item, false))}
            </nav>
          </div>
        </div>
      </div>

      {/* サイドバー（モバイル） */}
      {sidebarOpen && (
        <div className="fixed inset-0 flex z-40 md:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                type="button"
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-6 w-6 text-white" />
              </button>
            </div>
            <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
              <div className="flex-shrink-0 flex items-center px-4">
                <h1 className="text-xl font-bold text-orange-800">案件管理</h1>
              </div>
              <nav className="mt-5 flex-1 px-2 space-y-1">
                {navigation.map((item) => renderNavItem(item, true))}
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* メインコンテンツエリア */}
      <div className="flex-1 md:ml-64">
        <div className="md:hidden">
          <div className="relative z-10 flex-shrink-0 flex h-16 bg-white shadow">
            <button
              type="button"
              className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-orange-500 md:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex-1 px-4 flex justify-between">
              <div className="flex-1 flex">
                <h1 className="text-xl font-semibold text-gray-900 self-center">案件管理システム</h1>
              </div>
            </div>
          </div>
        </div>
        <main className="focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
