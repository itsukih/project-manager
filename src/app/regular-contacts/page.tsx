'use client';

import { useState, useEffect } from 'react';
import { Copy, Check } from 'lucide-react';
import { RegularContactTemplate } from '@/types';
import RegularContactForm from '@/components/RegularContactForm';
import RegularContactHistory from '@/components/RegularContactHistory';

export default function RegularContactsPage() {
  const [templates, setTemplates] = useState<RegularContactTemplate[]>([]);
  const [activeTemplate, setActiveTemplate] = useState<RegularContactTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<RegularContactTemplate | null>(null);
  const [view, setView] = useState<'templates' | 'history'>('templates');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/regular-contacts');
      const data = await response.json();
      setTemplates(data);

      // アクティブなテンプレートを設定
      const active = data.find((t: RegularContactTemplate) => t.isActive);
      if (active) {
        setActiveTemplate(active);
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveHistory = async () => {
    if (!activeTemplate) return;

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    try {
      const response = await fetch(`/api/regular-contacts/${activeTemplate.id}/save-history`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ year, month }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || '履歴の保存に失敗しました');
        return;
      }

      alert(`${year}年${month}月の定期連絡文を履歴に保存しました`);
      fetchTemplates();
    } catch (error) {
      console.error('Failed to save history:', error);
      alert('履歴の保存に失敗しました');
    }
  };

  const handleDeleteTemplate = async (id: number) => {
    if (!confirm('このテンプレートを削除しますか？')) {
      return;
    }

    try {
      const response = await fetch(`/api/regular-contacts/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete template');
      }

      fetchTemplates();
    } catch (error) {
      console.error('Failed to delete template:', error);
      alert('テンプレートの削除に失敗しました');
    }
  };

  const handleTemplateSubmit = () => {
    setShowForm(false);
    setEditingTemplate(null);
    fetchTemplates();
  };

  const handleCopyContent = async () => {
    if (!activeTemplate) return;

    try {
      await navigator.clipboard.writeText(activeTemplate.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      alert('コピーに失敗しました');
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">読み込み中...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">定期連絡文管理</h1>
        <div className="flex gap-4">
          <div className="flex bg-gray-200 rounded-lg p-1">
            <button
              onClick={() => setView('templates')}
              className={`px-4 py-2 rounded transition-colors ${
                view === 'templates'
                  ? 'bg-white text-gray-900 shadow'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              テンプレート管理
            </button>
            <button
              onClick={() => setView('history')}
              className={`px-4 py-2 rounded transition-colors ${
                view === 'history'
                  ? 'bg-white text-gray-900 shadow'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              履歴
            </button>
          </div>
        </div>
      </div>

      {view === 'templates' ? (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">現在の定期連絡文</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setShowForm(true)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors"
              >
                新規テンプレート作成
              </button>
              {activeTemplate && (
                <button
                  onClick={handleSaveHistory}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded transition-colors"
                >
                  今月分を履歴に保存
                </button>
              )}
            </div>
          </div>

          {showForm && (
            <div className="mb-6 p-4 bg-gray-50 rounded">
              <h3 className="text-lg font-medium mb-4">
                {editingTemplate ? 'テンプレート編集' : '新規テンプレート作成'}
              </h3>
              <RegularContactForm
                template={editingTemplate}
                onSubmit={handleTemplateSubmit}
                onCancel={() => {
                  setShowForm(false);
                  setEditingTemplate(null);
                }}
              />
            </div>
          )}

          {activeTemplate && (
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold">{activeTemplate.title}</h3>
                <div className="flex gap-2">
                  <button
                    onClick={handleCopyContent}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-500 hover:bg-green-600 text-white rounded transition-colors"
                  >
                    {copied ? (
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
                  <button
                    onClick={() => {
                      setEditingTemplate(activeTemplate);
                      setShowForm(true);
                    }}
                    className="text-blue-500 hover:text-blue-700 text-sm px-3 py-1.5"
                  >
                    編集
                  </button>
                </div>
              </div>
              <div className="whitespace-pre-wrap bg-gray-50 p-4 rounded">
                {activeTemplate.content}
              </div>
              <div className="mt-4 text-sm text-gray-500">
                最終更新: {new Date(activeTemplate.updatedAt).toLocaleString()}
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold">全テンプレート一覧</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {templates.map((template) => (
                <div key={template.id} className="p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium">{template.title}</h4>
                        {template.isActive && (
                          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                            使用中
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {template.content.substring(0, 100)}...
                      </p>
                      <p className="text-xs text-gray-500">
                        作成日: {new Date(template.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => {
                          setEditingTemplate(template);
                          setShowForm(true);
                        }}
                        className="text-blue-500 hover:text-blue-700 text-sm"
                      >
                        編集
                      </button>
                      <button
                        onClick={() => handleDeleteTemplate(template.id)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        削除
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <RegularContactHistory />
      )}
    </div>
  );
}