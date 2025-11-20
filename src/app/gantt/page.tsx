import { GanttChart } from '@/components/GanttChart';

export default function GanttPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">ガントチャート</h1>
        <p className="mt-1 text-sm text-gray-600">
          案件のスケジュールをタイムライン形式で管理できます
        </p>
      </div>
      <GanttChart />
    </div>
  );
}