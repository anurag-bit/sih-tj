import { useState, useEffect } from 'react';
import { useApiWithRetry } from './useRetry';

interface DashboardStats {
  categories: Record<string, number>;
  top_keywords: [string, number][];
  top_organizations: Record<string, number>;
  total_problems: number;
}

interface UseDashboardReturn {
  stats: DashboardStats | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

const API_BASE_URL = 'http://localhost:8000/api';

export const useDashboard = (): UseDashboardReturn => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  
  const { apiCall, isRetrying, lastError, reset } = useApiWithRetry({
    maxAttempts: 3,
    baseDelay: 1000,
    onRetry: (attempt, error) => {
      console.log(`Dashboard fetch retry attempt ${attempt}:`, error.message);
    }
  });

  const fetchStats = async () => {
    reset(); // Reset retry state
    
    try {
      const data = await apiCall(`${API_BASE_URL}/dashboard/stats`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      // Validate the response structure
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid response format');
      }
      
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err);
      // Error is handled by the retry hook
    }
  };

  const refetch = () => {
    fetchStats();
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return {
    stats,
    loading: isRetrying,
    error: lastError?.message || null,
    refetch
  };
};