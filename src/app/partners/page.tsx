import { PartnerManagement } from '@/components/PartnerManagement';

export default function PartnersPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">外注パートナー管理</h1>
        <p className="mt-1 text-sm text-gray-600">
          外注パートナー情報を管理できます
        </p>
      </div>
      <PartnerManagement />
    </div>
  );
}