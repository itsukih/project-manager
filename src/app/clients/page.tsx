import { ClientManagement } from '@/components/ClientManagement';

export default function ClientsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">クライアント管理</h1>
        <p className="mt-1 text-sm text-gray-600">
          クライアント情報を管理できます
        </p>
      </div>
      <ClientManagement />
    </div>
  );
}