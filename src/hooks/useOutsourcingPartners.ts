'use client';

import { useState, useEffect } from 'react';
import { OutsourcingPartner } from '@/types';

export function useOutsourcingPartners() {
  const [partners, setPartners] = useState<OutsourcingPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPartners = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/outsourcing-partners');
      if (!response.ok) {
        throw new Error('Failed to fetch outsourcing partners');
      }

      const data = await response.json();
      setPartners(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, []);

  return {
    partners,
    loading,
    error,
    refresh: fetchPartners,
  };
}