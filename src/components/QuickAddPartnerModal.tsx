'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { PartnerType, PARTNER_TYPE_LABELS } from '@/types';

interface QuickAddPartnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (partner: { id: number; name: string; type: PartnerType }) => void;
}

export function QuickAddPartnerModal({ isOpen, onClose, onCreated }: QuickAddPartnerModalProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<PartnerType>(PartnerType.DESIGNER);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      alert('パートナー名を入力してください');
      return;
    }

    setSaving(true);

    try {
      const response = await fetch('/api/outsourcing-partners', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          type,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create partner');
      }

      const newPartner = await response.json();
      onCreated({ id: newPartner.id, name: newPartner.name, type: newPartner.type });
      setName('');
      setType(PartnerType.DESIGNER);
      onClose();
    } catch (error) {
      alert('パートナーの登録に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setName('');
    setType(PartnerType.DESIGNER);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="パートナーを追加"
      size="sm"
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            パートナー名 *
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="パートナー名を入力"
            autoFocus
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            種別
          </label>
          <Select value={type} onChange={(e) => setType(e.target.value as PartnerType)}>
            <option value={PartnerType.DESIGNER}>{PARTNER_TYPE_LABELS[PartnerType.DESIGNER]}</option>
            <option value={PartnerType.CODER}>{PARTNER_TYPE_LABELS[PartnerType.CODER]}</option>
          </Select>
        </div>

        <p className="text-xs text-gray-500">
          ※ 詳細情報は外注パートナー管理画面から編集できます
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
