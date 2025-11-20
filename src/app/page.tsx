import { ProjectList } from '@/components/ProjectList';

export default function Home() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">案件一覧</h1>
        <p className="mt-1 text-sm text-gray-600">
          すべての案件を管理・閲覧できます
        </p>
      </div>
      <ProjectList />
    </div>
  );
}
