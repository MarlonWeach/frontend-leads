import { useState, useEffect } from 'react';

interface MetaActivity {
  id: number;
  account_id: string;
  event_type: string;
  event_time: string;
  object_id?: string;
  object_name?: string;
  value_old?: string;
  value_new?: string;
  application_id?: string;
  extra_data?: any;
  created_at?: string;
  updated_at?: string;
}

interface UseMetaActivitiesOptions {
  eventType?: string;
  limit?: number;
  order?: 'asc' | 'desc';
}

interface UseMetaActivitiesReturn {
  activities: MetaActivity[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useMetaActivities(options: UseMetaActivitiesOptions = {}): UseMetaActivitiesReturn {
  const {
    eventType,
    limit = 50,
    order = 'desc',
  } = options;

  const [activities, setActivities] = useState<MetaActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchActivities = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        order,
      });
      if (eventType) params.append('event_type', eventType);
      const res = await fetch(`/api/meta/activity?${params}`);
      if (!res.ok) throw new Error('Erro ao buscar logs');
      const data = await res.json();
      setActivities(data.activities || []);
    } catch (err: any) {
      setError(err.message || 'Erro ao buscar logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventType, limit, order]);

  return {
    activities,
    loading,
    error,
    refresh: fetchActivities,
  };
} 