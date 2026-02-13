'use client';

import { useState, useEffect, useCallback } from 'react';
import { ProjectWithRelations } from '@/types';

interface DailyCheck {
  id: number;
  projectId: number;
  date: string;
  note: string | null;
}

interface TaskWithProject {
  id: number;
  title: string;
  priority: string;
  status: string;
  dueDate: string | null;
  completed: boolean;
  project: ProjectWithRelations | null;
}

interface UseDailyChecksReturn {
  projects: ProjectWithRelations[];
  checks: Map<number, DailyCheck>;
  upcomingTasks: TaskWithProject[];
  loading: boolean;
  error: string | null;
  toggleCheck: (projectId: number) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useDailyChecks(date: string): UseDailyChecksReturn {
  const [projects, setProjects] = useState<ProjectWithRelations[]>([]);
  const [checks, setChecks] = useState<Map<number, DailyCheck>>(new Map());
  const [upcomingTasks, setUpcomingTasks] = useState<TaskWithProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/daily-checks?date=${date}`);
      if (!response.ok) throw new Error('Failed to fetch daily checks');

      const data = await response.json();
      setProjects(data.projects);
      setUpcomingTasks(data.upcomingTasks);

      const checkMap = new Map<number, DailyCheck>();
      data.checks.forEach((c: DailyCheck) => checkMap.set(c.projectId, c));
      setChecks(checkMap);

      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleCheck = async (projectId: number) => {
    const existing = checks.get(projectId);

    if (existing) {
      // 楽観的UI: チェック解除
      setChecks(prev => {
        const next = new Map(prev);
        next.delete(projectId);
        return next;
      });

      try {
        const response = await fetch(`/api/daily-checks/${existing.id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error();
      } catch {
        // 失敗時はロールバック
        setChecks(prev => {
          const next = new Map(prev);
          next.set(projectId, existing);
          return next;
        });
      }
      window.dispatchEvent(new Event('daily-check-updated'));
    } else {
      // 楽観的UI: チェック追加
      const tempCheck: DailyCheck = { id: -1, projectId, date, note: null };
      setChecks(prev => {
        const next = new Map(prev);
        next.set(projectId, tempCheck);
        return next;
      });

      try {
        const response = await fetch('/api/daily-checks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId, date }),
        });
        if (!response.ok) throw new Error();

        const created = await response.json();
        setChecks(prev => {
          const next = new Map(prev);
          next.set(projectId, created);
          return next;
        });
      } catch {
        // 失敗時はロールバック
        setChecks(prev => {
          const next = new Map(prev);
          next.delete(projectId);
          return next;
        });
      }
      window.dispatchEvent(new Event('daily-check-updated'));
    }
  };

  return {
    projects,
    checks,
    upcomingTasks,
    loading,
    error,
    toggleCheck,
    refresh: fetchData,
  };
}
