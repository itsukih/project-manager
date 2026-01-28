'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { RANK_OPTIONS, RANK_DESCRIPTIONS } from '@/types';

interface QuickAddClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (client: { id: number; name: string }) => void;
}

export function QuickAddClientModal({ isOpen, onClose, onCreated }: QuickAddClientModalProps) {
  const [name, setName] = useState('');
  const [rank, setRank] = useState('C');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      alert('会社名を入力してください');
      return;
    }

    setSaving(true);

    try {
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          rank,
          status: JSON.stringify([]),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create client');
      }

      const newClient = await response.json();
      onCreated({ id: newClient.id, name: newClient.name });
      setName('');
      setRank('C');
      onClose();
    } catch (error) {
      alert('クライアントの登録に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setName('');
    setRank('C');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="クライアントを追加"
      size="sm"
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            会社名 *
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="会社名を入力"
            autoFocus
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ランク
          </label>
          <Select value={rank} onChange={(e) => setRank(e.target.value)}>
            {RANK_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {RANK_DESCRIPTIONS[r]}
              </option>
            ))}
          </Select>
        </div>

        <p className="text-xs text-gray-500">
          ※ 詳細情報はクライアント管理画面から編集できます
        </p>

        <div className="flex justify-end space-x-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={saving}
          >
            キャンセル
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? '登録中...' : '登録'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
