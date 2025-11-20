'use client';

import { useState } from 'react';
import { RegularContactTemplate } from '@/types';

interface RegularContactFormProps {
  template?: RegularContactTemplate | null;
  onSubmit: (template: RegularContactTemplate) => void;
  onCancel: () => void;
}

export default function RegularContactForm({ template, onSubmit, onCancel }: RegularContactFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: template?.title || '',
    content: template?.content || '',
    isActive: template?.isActive !== undefined ? template.isActive : true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = template ? `/api/regular-contacts/${template.id}` : '/api/regular-contacts';
      const method = template ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to save template');
      }

      const savedTemplate = await response.json();
      onSubmit(savedTemplate);
    } catch (error) {
      console.error('Failed to save template:', error);
      alert('テンプレートの保存に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">タイトル *</label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="例: 月次定期連絡文"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">連絡文 *</label>
        <textarea
          name="content"
          value={formData.content}
          onChange={handleChange}
          required
          rows={12}
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="定期連絡文の内容を入力してください..."
        />
      </div>

      <div className="flex items-center gap-2">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="isActive"
            checked={formData.isActive}
            onChange={handleChange}
            className="rounded"
          />
          <span className="text-sm">アクティブなテンプレートとして設定</span>
        </label>
        <div className="text-xs text-gray-500 ml-2">
          ※ アクティブなテンプレートは定期連絡文として表示されます
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-600 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
          disabled={loading}
        >
          キャンセル
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-50"
        >
          {loading ? '保存中...' : template ? '更新' : '作成'}
        </button>
      </div>
    </form>
  );
}