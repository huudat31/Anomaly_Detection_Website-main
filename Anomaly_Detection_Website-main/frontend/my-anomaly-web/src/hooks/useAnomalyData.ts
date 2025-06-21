import { useState, useEffect, useCallback } from 'react';
import type { Anomaly, Statistics } from '../types';
import { anomalyService } from '../services/anomalyServer';
interface UseAnomalyDataReturn {
  anomalies: Anomaly[];
  statistics: Statistics | null;
  loading: boolean;
  error: string | null;
  refetch: (params?: Record<string, any>) => Promise<void>;
  fetchStatistics: () => Promise<void>;
}

export const useAnomalyData = (autoFetch: boolean = true): UseAnomalyDataReturn => {
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnomalies = useCallback(async (params?: Record<string, any>) => {
    setLoading(true);
    setError(null);

    try {
      const result = await anomalyService.getAnomalyData(params);
      if (result.success && result.data) {
        setAnomalies(result.data.anomalies || []);
      } else {
        setError(result.error || 'Failed to fetch data');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStatistics = useCallback(async () => {
    try {
      const result = await anomalyService.getStatistics();
      if (result.success && result.data) {
        setStatistics(result.data);
      }
    } catch (err) {
      console.error('Failed to fetch statistics:', err);
    }
  }, []);

  useEffect(() => {
    if (autoFetch) {
      fetchAnomalies();
      fetchStatistics();
    }
  }, [autoFetch, fetchAnomalies, fetchStatistics]);

  return {
    anomalies,
    statistics,
    loading,
    error,
    refetch: fetchAnomalies,
    fetchStatistics,
  };
};