'use client';

import { useState } from 'react';
import { Plus, Edit, Trash2, Download } from 'lucide-react';
import { useClients } from '@/hooks/useClients';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Client, STATUS_OPTIONS, RANK_OPTIONS, RANK_DESCRIPTIONS, CONTACT_TYPE_OPTIONS, CONTACT_TYPE_LABELS } from '@/types';
import { getCurrentMonth } from '@/lib/dateUtils';

export function ClientManagement() {
  const { clients, loading, error, refresh } = useClients();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [saving, setSaving] = useState(false);
  const [sortBy, setSortBy] = useState<'rank' | 'name' | 'updated'>('rank');
  const [showRankE, setShowRankE] = useState(false);

  const currentMonth = getCurrentMonth();

  const [formData, setFormData] = useState({
    name: '',
    homepageUrl: '',
    contactPerson: '',
    status: [] as string[],
    rank: 'C',
    history: '',
    salesIdea: '',
    needs: '',
    approach: '',
    messageToClient: '',
    firstContact: '',
    meetingDate: '',
    contractDate: '',
    contactType: '',
    email: '',
    notes: '',
    salesText: '',
    salesTextUpdated: false,
    regularContact: false,
    lastContact: '',
    contractPdfPath: '',
    contractPdfName: '',
  });
  const [uploadingContract, setUploadingContract] = useState(false);

  const resetForm = () => {
    setFormData({
      name: '',
      homepageUrl: '',
      contactPerson: '',
      status: [],
      rank: 'C',
      history: '',
      salesIdea: '',
      needs: '',
      approach: '',
      messageToClient: '',
      firstContact: '',
      meetingDate: '',
      contractDate: '',
      contactType: '',
      email: '',
      notes: '',
      salesText: '',
      salesTextUpdated: false,
      regularContact: false,
      lastContact: '',
      contractPdfPath: '',
      contractPdfName: '',
    });
  };

  const handleCreate = () => {
    setEditingClient(null);
    resetForm();
    setModalOpen(true);
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    const shouldResetSalesText = client.salesTextUpdatedMonth && client.salesTextUpdatedMonth !== currentMonth;
    const shouldResetRegularContact = client.regularContactMonth && client.regularContactMonth !== currentMonth;

    setFormData({
      name: client.name,
      homepageUrl: client.homepageUrl || '',
      contactPerson: client.contactPerson || '',
      status: typeof client.status === 'string' ? JSON.parse(client.status || '[]') : [],
      rank: client.rank,
      history: client.history || '',
      salesIdea: client.salesIdea || '',
      needs: client.needs || '',
      approach: client.approach || '',
      messageToClient: client.messageToClient || '',
      firstContact: client.firstContact ? new Date(client.firstContact).toISOString().split('T')[0] : '',
      meetingDate: client.meetingDate ? new Date(client.meetingDate).toISOString().split('T')[0] : '',
      contractDate: client.contractDate ? new Date(client.contractDate).toISOString().split('T')[0] : '',
      contactType: client.contactType || '',
      email: client.email || '',
      notes: client.notes || '',
      salesText: client.salesText || '',
      salesTextUpdated: shouldResetSalesText ? false : (client.salesTextUpdated || false),
      regularContact: shouldResetRegularContact ? false : (client.regularContact || false),
      lastContact: client.lastContact ? new Date(client.lastContact).toISOString().split('T')[0] : '',
      contractPdfPath: client.contractPdfPath || '',
      contractPdfName: client.contractPdfName || '',
    });
    setModalOpen(true);
  };

  const handleContractUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingContract(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'client');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      setFormData(prev => ({
        ...prev,
        contractPdfPath: data.path,
        contractPdfName: data.name,
      }));
    } catch (error) {
      alert('PDFのアップロードに失敗しました');
    } finally {
      setUploadingContract(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleStatusChange = (statusOption: string) => {
    setFormData(prev => {
      const currentStatus = prev.status;
      if (currentStatus.includes(statusOption)) {
        return { ...prev, status: currentStatus.filter(s => s !== statusOption) };
      } else {
        return { ...prev, status: [...currentStatus, statusOption] };
      }
    });
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert('会社名を入力してください');
      return;
    }

    setSaving(true);

    try {
      const url = editingClient ? `/api/clients/${editingClient.id}` : '/api/clients';
      const method = editingClient ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          status: JSON.stringify(formData.status),
          firstContact: formData.firstContact || null,
          meetingDate: formData.meetingDate || null,
          contractDate: formData.contractDate || null,
          lastContact: formData.lastContact || null,
          salesTextUpdatedMonth: formData.salesTextUpdated ? currentMonth : editingClient?.salesTextUpdatedMonth,
          regularContactMonth: formData.regularContact ? currentMonth : editingClient?.regularContactMonth,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save client');
      }

      setModalOpen(false);
      resetForm();
      setEditingClient(null);
      refresh();
    } catch (error) {
      alert('クライアントの保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (client: Client) => {
    if (!confirm(`クライアント「${client.name}」を削除してもよろしいですか？`)) {
      return;
    }

    try {
      const response = await fetch(`/api/clients/${client.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete client');
      }

      refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'クライアントの削除に失敗しました');
    }
  };

  const handleExportCSV = async () => {
    try {
      const response = await fetch('/api/clients/export');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = 'clients.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      alert('CSVエクスポートに失敗しました');
    }
  };

  const filteredClients = showRankE ? clients : clients.filter(client => client.rank !== 'E');

  const sortedClients = [...filteredClients].sort((a, b) => {
    if (sortBy === 'rank') {
      const rankOrder = { 'VIP': 0, 'A': 1, 'B': 2, 'C': 3, 'D': 4, 'E': 5 };
      return rankOrder[a.rank as keyof typeof rankOrder] - rankOrder[b.rank as keyof typeof rankOrder];
    } else if (sortBy === 'name') {
      return a.name.localeCompare(b.name);
    } else if (sortBy === 'updated') {
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    }
    return 0;
  });

  const clientsByRank = sortBy === 'rank'
    ? RANK_OPTIONS.reduce((acc, rank) => {
        acc[rank] = sortedClients.filter(client => client.rank === rank);
        return acc;
      }, {} as Record<string, Client[]>)
    : { 'all': sortedClients } as Record<string, Client[]>;

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
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div className="flex gap-3">
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            新規クライアント
          </Button>
          <Button onClick={handleExportCSV} variant="secondary">
            <Download className="h-4 w-4 mr-2" />
            CSV エクスポート
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">並び順:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'rank' | 'name' | 'updated')}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
            >
              <option value="rank">ランク順</option>
              <option value="name">会社名順</option>
              <option value="updated">更新日順</option>
            </select>
          </div>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showRankE}
              onChange={(e) => setShowRankE(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-gray-700">ランクEを表示</span>
          </label>
        </div>
      </div>

      {sortBy === 'rank' ? (
        // ランク別表示
        RANK_OPTIONS.map(rank => {
          const rankClients = clientsByRank[rank];
          if (!rankClients || rankClients.length === 0) return null;

          return (
            <div key={rank} className="mb-8">
              <h2 className="text-xl font-semibold mb-4 px-4 py-2 bg-orange-50 text-orange-900 rounded-lg border border-orange-200">
                {RANK_DESCRIPTIONS[rank]} ({rankClients.length}件)
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {rankClients.map(client => (
                  <ClientCard key={client.id} client={client} onEdit={handleEdit} onDelete={handleDelete} currentMonth={currentMonth} />
                ))}
              </div>
            </div>
          );
        })
      ) : (
        // リスト表示
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 px-4 py-2 bg-orange-50 text-orange-900 rounded-lg border border-orange-200">
            全クライアント ({sortedClients.length}件)
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sortedClients.map(client => (
              <ClientCard key={client.id} client={client} onEdit={handleEdit} onDelete={handleDelete} currentMonth={currentMonth} />
            ))}
          </div>
        </div>
      )}

      {filteredClients.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">クライアントが登録されていません</div>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            最初のクライアントを登録
          </Button>
        </div>
      )}

      {/* モーダル */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingClient ? 'クライアントを編集' : '新規クライアント登録'}
        size="xl"
      >
        <div className="space-y-6 max-h-[70vh] overflow-y-auto px-1">
          {/* 基本情報 */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-gray-900">基本情報</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">会社名 *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ホームページURL</label>
                <input
                  type="url"
                  name="homepageUrl"
                  value={formData.homepageUrl}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">担当/代表者</label>
                <input
                  type="text"
                  name="contactPerson"
                  value={formData.contactPerson}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">状況 *</label>
                <div className="grid grid-cols-2 gap-2">
                  {STATUS_OPTIONS.map(status => (
                    <label key={status} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.status.includes(status)}
                        onChange={() => handleStatusChange(status)}
                        className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                      />
                      <span className="text-sm">{status}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ランク *</label>
                <select
                  name="rank"
                  value={formData.rank}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  {RANK_OPTIONS.map(rank => (
                    <option key={rank} value={rank}>{RANK_DESCRIPTIONS[rank]}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">連絡先種別</label>
                <select
                  name="contactType"
                  value={formData.contactType}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">選択してください</option>
                  {CONTACT_TYPE_OPTIONS.map(type => (
                    <option key={type} value={type}>{CONTACT_TYPE_LABELS[type]}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">メールアドレス</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">初回コンタクト日</label>
                <input
                  type="date"
                  name="firstContact"
                  value={formData.firstContact}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">面談日</label>
                <input
                  type="date"
                  name="meetingDate"
                  value={formData.meetingDate}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">成約日</label>
                <input
                  type="date"
                  name="contractDate"
                  value={formData.contractDate}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">最終コンタクト日</label>
                <input
                  type="date"
                  name="lastContact"
                  value={formData.lastContact}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">業務委託契約書（PDF）</label>
              {formData.contractPdfPath ? (
                <div className="flex items-center gap-3">
                  <a
                    href={formData.contractPdfPath}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-orange-600 hover:underline text-sm"
                  >
                    {formData.contractPdfName}
                  </a>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, contractPdfPath: '', contractPdfName: '' }))}
                    className="text-red-600 hover:text-red-700 text-sm"
                  >
                    削除
                  </button>
                </div>
              ) : (
                <div>
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={handleContractUpload}
                    disabled={uploadingContract}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                  />
                  {uploadingContract && <p className="text-sm text-gray-500 mt-1">アップロード中...</p>}
                </div>
              )}
            </div>

            <div className="mt-4 flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="salesTextUpdated"
                  checked={formData.salesTextUpdated}
                  onChange={handleChange}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">営業文更新完了</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="regularContact"
                  checked={formData.regularContact}
                  onChange={handleChange}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">定期連絡完了</span>
              </label>
            </div>
          </div>

          {/* 詳細情報 */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-gray-900">詳細情報</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">経緯</label>
                <textarea
                  name="history"
                  value={formData.history}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">希望的観測/営業アイディア</label>
                <textarea
                  name="salesIdea"
                  value={formData.salesIdea}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">相手が求めていること</label>
                <textarea
                  name="needs"
                  value={formData.needs}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">アプローチの流れ</label>
                <textarea
                  name="approach"
                  value={formData.approach}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">クライアントに何を伝えたいか</label>
                <textarea
                  name="messageToClient"
                  value={formData.messageToClient}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">備考</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">営業文</label>
                <textarea
                  name="salesText"
                  value={formData.salesText}
                  onChange={handleChange}
                  rows={5}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 sticky bottom-0 bg-white border-t border-gray-200 -mx-1 px-1 py-3">
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
              {saving ? '保存中...' : editingClient ? '更新' : '登録'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function ClientCard({ client, onEdit, onDelete, currentMonth }: {
  client: Client;
  onEdit: (client: Client) => void;
  onDelete: (client: Client) => void;
  currentMonth: string;
}) {
  const isSalesTextUpToDate = client.salesTextUpdated && client.salesTextUpdatedMonth === currentMonth;
  const isRegularContactUpToDate = client.regularContact && client.regularContactMonth === currentMonth;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-medium text-lg truncate">{client.name}</h3>
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
          client.rank === 'VIP' ? 'bg-purple-100 text-purple-800' :
          client.rank === 'A' ? 'bg-red-100 text-red-800' :
          client.rank === 'B' ? 'bg-orange-100 text-orange-800' :
          client.rank === 'C' ? 'bg-yellow-100 text-yellow-800' :
          client.rank === 'D' ? 'bg-blue-100 text-blue-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {client.rank}
        </span>
      </div>

      <div className="text-sm text-gray-600 mb-2">
        <div>状況: {typeof client.status === 'string' ? JSON.parse(client.status || '[]').join(', ') : ''}</div>
        {client.contactPerson && <div>担当者: {client.contactPerson}</div>}
      </div>

      <div className="flex gap-2 mb-2 flex-wrap">
        <span className={`px-2 py-1 text-xs rounded ${
          isSalesTextUpToDate
            ? 'bg-green-100 text-green-800'
            : 'bg-gray-100 text-gray-600'
        }`}>
          営業文 {isSalesTextUpToDate ? '完了' : '未完了'}
        </span>
        <span className={`px-2 py-1 text-xs rounded ${
          isRegularContactUpToDate
            ? 'bg-blue-100 text-blue-800'
            : 'bg-gray-100 text-gray-600'
        }`}>
          定期連絡 {isRegularContactUpToDate ? '完了' : '未完了'}
        </span>
      </div>

      {client.homepageUrl && (
        <div className="text-sm mb-2">
          <a
            href={client.homepageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-orange-600 hover:underline truncate block"
          >
            {client.homepageUrl}
          </a>
        </div>
      )}

      <div className="text-xs text-gray-500 mb-3">
        {client.lastContact && (
          <div>最終連絡: {new Date(client.lastContact).toLocaleDateString('ja-JP')}</div>
        )}
        {client.meetingDate && (
          <div>面談日: {new Date(client.meetingDate).toLocaleDateString('ja-JP')}</div>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(client)}
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(client)}
          className="text-red-600 hover:text-red-700"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
