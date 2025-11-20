'use client';

import { useState, useEffect } from 'react';
import { ProjectWithRelations } from '@/types';

interface UseProjectsParams {
  clientId?: string;
  salesStatus?: string;
  orderMonth?: string;
  consultationMonth?: string;
  sortBy?: string;
  sortOrder?: string;
  includeLost?: boolean;
}

export function useProjects(params: UseProjectsParams = {}) {
  const [projects, setProjects] = useState<ProjectWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const searchParams = new URLSearchParams();

      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.set(key, value.toString());
        }
      });

      const response = await fetch(`/api/projects?${searchParams.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }

      const data = await response.json();
      setProjects(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [JSON.stringify(params)]);

  return {
    projects,
    loading,
    error,
    refresh: fetchProjects,
  };
}

export function useProject(id: number) {
  const [project, setProject] = useState<ProjectWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchProject = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/projects/${id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch project');
        }

        const data = await response.json();
        setProject(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [id]);

  return {
    project,
    loading,
    error,
  };
}