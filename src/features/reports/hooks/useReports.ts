import { useState, useEffect, useCallback } from 'react';
import type { Report, ReportFilters } from '../types/report.types';
import { reportService } from '../services/report.service';
import { getApiErrorMessage } from '@/lib/apiError';

// Lista as denúncias do usuário aplicando os filtros no backend (GET /api/report/my)
export function useReports(initialFilters: ReportFilters = {}) {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ReportFilters>(initialFilters);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await reportService.getMyReports(filters);
      setReports(data ?? []);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Erro ao buscar denúncias'));
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const updateFilters = (newFilters: ReportFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const clearFilters = () => {
    setFilters(initialFilters);
  };

  return {
    reports,
    loading,
    error,
    filters,
    updateFilters,
    clearFilters,
    refetch: fetchReports
  };
}
