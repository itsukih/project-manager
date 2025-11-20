import { Analytics } from '@/components/Analytics';

export default function AnalyticsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">集計・分析</h1>
        <p className="mt-1 text-sm text-gray-600">
          売上や案件の状況を分析できます
        </p>
      </div>
      <Analytics />
    </div>
  );
}