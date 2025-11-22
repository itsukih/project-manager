'use client';

import { useState, useEffect } from 'react';
import { Plus, ExternalLink, FileText, Edit, Trash2, X, Upload } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

interface Template {
  id: number;
  name: string;
  description: string | null;
  url: string | null;
  pdfPath: string | null;
  pdfName: string | null;
  category: string;
  createdAt: string;
  updatedAt: string;
}

const CATEGORIES = [
  '案件管理',
  '請求書',
  '契約書',
  '提案書',
  '議事録',
  'その他',
];

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    url: '',
    category: 'その他',
    pdfPath: '',
    pdfName: '',
  });

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/templates');
      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
      }
    } catch (err) {
      console.error('Failed to fetch templates:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleCreate = () => {
    setEditingTemplate(null);
    setFormData({
      name: '',
      description: '',
      url: '',
      category: 'その他',
      pdfPath: '',
      pdfName: '',
    });
    setModalOpen(true);
  };

  const handleEdit = (template: Template) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description || '',
      url: template.url || '',
      category: template.category,
      pdfPath: template.pdfPath || '',
      pdfName: template.pdfName || '',
    });
    setModalOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // PDFファイルのみ許可
    if (file.type !== 'application/pdf') {
      alert('PDFファイルのみアップロード可能です');
      return;
    }

    setUploading(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);

      const response = await fetch('/api/templates/upload', {
        method: 'POST',
        body: uploadFormData,
      });

      if (!response.ok) throw new Error('Failed to upload file');

      const data = await response.json();
      setFormData({
        ...formData,
        pdfPath: data.pdfPath,
        pdfName: data.pdfName,
      });
    } catch (err) {
      alert('ファイルのアップロードに失敗しました');
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePdf = () => {
    setFormData({
      ...formData,
      pdfPath: '',
      pdfName: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingTemplate
        ? `/api/templates/${editingTemplate.id}`
        : '/api/templates';
      const method = editingTemplate ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to save template');

      setModalOpen(false);
      fetchTemplates();
    } catch (err) {
      alert('テンプレートの保存に失敗しました');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('このテンプレートを削除してもよろしいですか？')) return;

    try {
      const response = await fetch(`/api/templates/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete template');
      fetchTemplates();
    } catch (err) {
      alert('テンプレートの削除に失敗しました');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-lg text-gray-600">読み込み中...</div>
      </div>
    );
  }

  // カテゴリー別にグループ化
  const groupedTemplates = CATEGORIES.map(category => ({
    category,
    templates: templates.filter(t => t.category === category),
  })).filter(group => group.templates.length > 0);

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">テンプレート管理</h1>
          <p className="text-sm text-gray-600 mt-1">
            仕事で使うテンプレート（URLやPDF）を管理します
          </p>
        </div>
        <Button onClick={handleCreate} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          新規作成
        </Button>
      </div>

      {/* テンプレート一覧 */}
      {groupedTemplates.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">テンプレートが登録されていません</p>
          <Button onClick={handleCreate} variant="secondary" className="mt-4">
            最初のテンプレートを作成
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          {groupedTemplates.map(group => (
            <div key={group.category}>
              <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm">
                  {group.category}
                </span>
                <span className="text-sm text-gray-500">({group.templates.length}件)</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {group.templates.map(template => (
                  <div
                    key={template.id}
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{template.name}</h3>
                        {template.description && (
                          <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-3">
                      {template.url && (
                        <a
                          href={template.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                        >
                          <ExternalLink className="h-4 w-4" />
                          開く
                        </a>
                      )}
                      {template.pdfPath && (
                        <a
                          href={template.pdfPath}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                        >
                          <FileText className="h-4 w-4" />
                          PDF
                        </a>
                      )}
                      <div className="flex-1" />
                      <button
                        onClick={() => handleEdit(template)}
                        className="p-2 hover:bg-gray-100 rounded"
                      >
                        <Edit className="h-4 w-4 text-gray-500" />
                      </button>
                      <button
                        onClick={() => handleDelete(template.id)}
                        className="p-2 hover:bg-red-100 rounded"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* モーダル */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* ヘッダー */}
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingTemplate ? 'テンプレート編集' : 'テンプレート作成'}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* フォーム */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  テンプレート名 <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="例: 案件管理シート"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  説明
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  rows={3}
                  placeholder="テンプレートの用途や内容"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  カテゴリー <span className="text-red-500">*</span>
                </label>
                <Select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL
                </label>
                <Input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://docs.google.com/spreadsheets/..."
                />
                <p className="mt-1 text-xs text-gray-500">
                  GoogleスプレッドシートやGoogleドキュメントのURLなど
                </p>
              </div>

              {/* PDFアップロード */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  PDFファイル
                </label>
                {formData.pdfPath ? (
                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-md">
                    <FileText className="h-5 w-5 text-blue-500" />
                    <span className="text-sm text-gray-700 flex-1">{formData.pdfName}</span>
                    <button
                      type="button"
                      onClick={handleRemovePdf}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-md cursor-pointer hover:border-orange-400 hover:bg-orange-50 transition-colors">
                      <Upload className="h-5 w-5 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {uploading ? 'アップロード中...' : 'PDFファイルを選択'}
                      </span>
                      <input
                        type="file"
                        accept="application/pdf"
                        onChange={handleFileUpload}
                        disabled={uploading}
                        className="hidden"
                      />
                    </label>
                    <p className="mt-1 text-xs text-gray-500">
                      PDFファイルをアップロードできます
                    </p>
                  </div>
                )}
              </div>

              {/* ボタン */}
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setModalOpen(false)}
                >
                  キャンセル
                </Button>
                <Button type="submit">
                  {editingTemplate ? '更新' : '作成'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
