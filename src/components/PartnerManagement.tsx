'use client';

import React, { useState } from 'react';
import { Plus, Edit, Trash2, FileText, Upload, Search } from 'lucide-react';
import { useOutsourcingPartners } from '@/hooks/useOutsourcingPartners';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { OutsourcingPartner, PartnerType, PARTNER_TYPE_LABELS } from '@/types';

export function PartnerManagement() {
  const { partners, loading, error, refresh } = useOutsourcingPartners();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<OutsourcingPartner | null>(null);
  const [partnerName, setPartnerName] = useState('');
  const [partnerType, setPartnerType] = useState<PartnerType>(PartnerType.DESIGNER);
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [contractPdfPath, setContractPdfPath] = useState('');
  const [contractPdfName, setContractPdfName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // 検索フィルター
  const filteredPartners = searchQuery.trim()
    ? partners.filter(partner =>
        partner.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : partners;

  // パートナーを種別ごとにグループ化
  const groupedPartners = filteredPartners.reduce((groups, partner) => {
    const type = partner.type;
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push(partner);
    return groups;
  }, {} as Record<PartnerType, OutsourcingPartner[]>);

  const handleCreate = () => {
    setEditingPartner(null);
    setPartnerName('');
    setPartnerType(PartnerType.DESIGNER);
    setPortfolioUrl('');
    setEmail('');
    setNotes('');
    setContractPdfPath('');
    setContractPdfName('');
    setModalOpen(true);
  };

  const handleEdit = (partner: OutsourcingPartner) => {
    setEditingPartner(partner);
    setPartnerName(partner.name);
    setPartnerType(partner.type);
    setPortfolioUrl(partner.portfolioUrl || '');
    setEmail(partner.email || '');
    setNotes(partner.notes || '');
    setContractPdfPath(partner.contractPdfPath || '');
    setContractPdfName(partner.contractPdfName || '');
    setModalOpen(true);
  };

  const handleContractUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('PDFファイルのみアップロード可能です');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('ファイルサイズは10MB以下にしてください');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'partner');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      setContractPdfPath(data.path);
      setContractPdfName(data.name);
    } catch (error) {
      alert('PDFのアップロードに失敗しました');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!partnerName.trim()) {
      alert('パートナー名を入力してください');
      return;
    }

    setSaving(true);

    try {
      const url = editingPartner ? `/api/outsourcing-partners/${editingPartner.id}` : '/api/outsourcing-partners';
      const method = editingPartner ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: partnerName.trim(),
          type: partnerType,
          portfolioUrl: portfolioUrl || null,
          email: email || null,
          notes: notes || null,
          contractPdfPath: contractPdfPath || null,
          contractPdfName: contractPdfName || null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save partner');
      }

      setModalOpen(false);
      setPartnerName('');
      setPartnerType(PartnerType.DESIGNER);
      setPortfolioUrl('');
      setEmail('');
      setNotes('');
      setContractPdfPath('');
      setContractPdfName('');
      setEditingPartner(null);
      refresh();
    } catch (error) {
      alert('パートナーの保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (partner: OutsourcingPartner) => {
    if (!confirm(`外注パートナー「${partner.name}」を削除してもよろしいですか？`)) {
      return;
    }

    try {
      const response = await fetch(`/api/outsourcing-partners/${partner.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete partner');
      }

      refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'パートナーの削除に失敗しました');
    }
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
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            新規パートナー
          </Button>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="パートナー名で検索"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent w-48"
            />
          </div>
        </div>
        <div className="text-sm text-gray-600">
          {filteredPartners.length}件の外注パートナー
          {searchQuery && ` (${partners.length}件中)`}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {filteredPartners.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">
              {searchQuery ? '該当するパートナーが見つかりません' : '外注パートナーが登録されていません'}
            </div>
            {!searchQuery && (
              <Button onClick={handleCreate}>
                <Plus className="h-4 w-4 mr-2" />
                最初のパートナーを登録
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    パートナー名
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    種別
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    登録日
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {Object.entries(groupedPartners).map(([type, typePartners]) => (
                  <React.Fragment key={type}>
                    <tr className="bg-gray-100">
                      <td colSpan={4} className="px-6 py-2 text-sm font-medium text-gray-700 border-t border-gray-200">
                        {PARTNER_TYPE_LABELS[type as PartnerType]} ({typePartners.length}件)
                      </td>
                    </tr>
                    {typePartners.map((partner, index) => (
                      <tr key={partner.id} className={`hover:bg-gray-50 ${index < typePartners.length - 1 ? 'border-b border-gray-200' : ''}`}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {partner.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            partner.type === 'DESIGNER'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {PARTNER_TYPE_LABELS[partner.type]}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(partner.createdAt).toLocaleDateString('ja-JP')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(partner)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(partner)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingPartner ? 'パートナーを編集' : '新規パートナー登録'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              パートナー名
            </label>
            <Input
              value={partnerName}
              onChange={(e) => setPartnerName(e.target.value)}
              placeholder="パートナー名を入力"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              種別
            </label>
            <Select
              value={partnerType}
              onChange={(e) => setPartnerType(e.target.value as PartnerType)}
            >
              <option value={PartnerType.DESIGNER}>デザイナー</option>
              <option value={PartnerType.CODER}>コーダー</option>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ポートフォリオURL
            </label>
            <Input
              value={portfolioUrl}
              onChange={(e) => setPortfolioUrl(e.target.value)}
              placeholder="https://example.com/portfolio"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              メールアドレス
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="partner@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              備考
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="備考を入力"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              業務委託契約書 (PDF)
            </label>
            <div className="flex items-center gap-2">
              <label className="flex-1 cursor-pointer">
                <div className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
                  <Upload className="h-4 w-4" />
                  <span className="text-sm">
                    {uploading ? 'アップロード中...' : contractPdfName || 'PDFを選択'}
                  </span>
                </div>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleContractUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
              {contractPdfPath && (
                <a
                  href={contractPdfPath}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-blue-600 hover:text-blue-700"
                >
                  <FileText className="h-5 w-5" />
                </a>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => setModalOpen(false)}
              disabled={saving}
            >
              キャンセル
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? '保存中...' : editingPartner ? '更新' : '登録'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}