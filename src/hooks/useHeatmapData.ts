import { useState, useEffect, useMemo } from 'react';
import { format, eachDayOfInterval, startOfWeek, endOfWeek, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '../lib/supabaseClient';
import type { 
  HeatmapData, 
  HeatmapFilters, 
  ProcessedHeatmapData,
  HeatmapMetric
} from '../types/heatmap';

export const HEATMAP_METRICS: HeatmapMetric[] = [
  {
    key: 'leads',
    label: 'Leads',
    unit: 'leads',
    format: (value: number) => Math.round(value).toString(),
    colorScale: {
      low: '#dbeafe',    // blue-100
      medium: '#3b82f6', // blue-500
      high: '#1e40af'    // blue-700
    }
  },
  {
    key: 'cpl',
    label: 'CPL',
    unit: 'R$',
    format: (value: number) => `R$ ${value.toFixed(2)}`,
    colorScale: {
      low: '#dcfce7',    // green-100 (baixo CPL é bom)
      medium: '#f59e0b', // amber-500
      high: '#dc2626'    // red-600 (alto CPL é ruim)
    }
  },
  {
    key: 'ctr',
    label: 'CTR',
    unit: '%',
    format: (value: number) => `${value.toFixed(2)}%`,
    colorScale: {
      low: '#fef3c7',    // amber-100
      medium: '#f59e0b', // amber-500
      high: '#d97706'    // amber-600
    }
  },
  {
    key: 'spend',
    label: 'Gastos',
    unit: 'R$',
    format: (value: number) => `R$ ${value.toFixed(2)}`,
    colorScale: {
      low: '#f3e8ff',    // violet-100
      medium: '#8b5cf6', // violet-500
      high: '#6d28d9'    // violet-700
    }
  },
  {
    key: 'impressions',
    label: 'Impressões',
    unit: '',
    format: (value: number) => {
      if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
      if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
      return Math.round(value).toString();
    },
    colorScale: {
      low: '#ecfdf5',    // emerald-50
      medium: '#10b981', // emerald-500
      high: '#047857'    // emerald-700
    }
  },
  {
    key: 'clicks',
    label: 'Cliques',
    unit: '',
    format: (value: number) => {
      if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
      return Math.round(value).toString();
    },
    colorScale: {
      low: '#fef7cd',    // yellow-100
      medium: '#eab308', // yellow-500
      high: '#ca8a04'    // yellow-600
    }
  }
];

/**
 * Hook para buscar e processar dados do heatmap
 */
export const useHeatmapData = (filters: HeatmapFilters) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rawData, setRawData] = useState<any[]>([]);

  // Buscar dados da API
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const startDate = format(filters.startDate, 'yyyy-MM-dd');
        const endDate = format(filters.endDate, 'yyyy-MM-dd');
        
        // Buscar dados diretamente da tabela campaign_insights
        let query = supabase
          .from('campaign_insights')
          .select('*')
          .gte('date', startDate)
          .lte('date', endDate);

        // Filtrar por campanhas específicas se fornecido
        if (filters.campaignIds?.length) {
          query = query.in('campaign_id', filters.campaignIds);
        }

        const { data: insightsData, error: insightsError } = await query;

        if (insightsError) {
          throw new Error(`Erro ao buscar dados do Supabase: ${insightsError.message}`);
        }

        setRawData(insightsData || []);

      } catch (err) {
        console.error('Erro no useHeatmapData:', err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filters.startDate, filters.endDate, filters.campaignIds]);

  // Processar dados para heatmap
  const processedData: ProcessedHeatmapData = useMemo(() => {
    if (!rawData.length) {
      return {
        data: [],
        weeks: [],
        stats: { min: 0, max: 0, avg: 0, total: 0 },
        intensityScale: [0, 0, 0, 0, 0]
      };
    }

    // Gerar todos os dias no período
    const allDays = eachDayOfInterval({
      start: filters.startDate,
      end: filters.endDate
    });

    // Agrupar dados por data
    const dataByDate = rawData.reduce((acc: Record<string, any[]>, item) => {
      // Assumindo que os dados vêm com campo 'date' ou similar
      const date = item.date || item.created_at?.split('T')[0];
      if (!date) return acc;
      
      if (!acc[date]) acc[date] = [];
      acc[date].push(item);
      return acc;
    }, {});

    // Criar dados do heatmap
    const heatmapData: HeatmapData[] = allDays.map(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const dayData = dataByDate[dateStr] || [];

      // Agregar métricas do dia
      const aggregated = dayData.reduce((acc, item) => {
        acc.leads += Number(item.leads) || 0;
        acc.spend += Number(item.spend) || 0;
        acc.impressions += Number(item.impressions) || 0;
        acc.clicks += Number(item.clicks) || 0;
        return acc;
      }, { leads: 0, spend: 0, impressions: 0, clicks: 0 });

      // Calcular métricas derivadas
      const ctr = aggregated.impressions > 0 
        ? (aggregated.clicks / aggregated.impressions) * 100 
        : 0;
      const cpl = aggregated.leads > 0 
        ? aggregated.spend / aggregated.leads 
        : 0;

      const rawDataForDay = {
        leads: aggregated.leads,
        spend: aggregated.spend,
        impressions: aggregated.impressions,
        clicks: aggregated.clicks,
        ctr,
        cpl
      };

      // Valor baseado na métrica selecionada
      let value = 0;
      switch (filters.metric) {
        case 'leads':
          value = aggregated.leads;
          break;
        case 'cpl':
          value = cpl;
          break;
        case 'ctr':
          value = ctr;
          break;
        case 'spend':
          value = aggregated.spend;
          break;
        case 'impressions':
          value = aggregated.impressions;
          break;
        case 'clicks':
          value = aggregated.clicks;
          break;
        default:
          value = aggregated.leads;
      }

      const metric = HEATMAP_METRICS.find(m => m.key === filters.metric) || HEATMAP_METRICS[0];

      return {
        date: dateStr,
        value,
        metric: filters.metric,
        campaigns: dayData.length,
        formattedValue: metric.format(value),
        rawData: rawDataForDay
      };
    });

    // Calcular estatísticas
    const values = heatmapData.map(d => d.value).filter(v => v > 0);
    const stats = {
      min: Math.min(...values, 0),
      max: Math.max(...values, 0),
      avg: values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0,
      total: values.reduce((a, b) => a + b, 0)
    };

    // Criar escala de intensidade (quintis)
    const sortedValues = [...values].sort((a, b) => a - b);
    const intensityScale = [
      0,
      sortedValues[Math.floor(sortedValues.length * 0.2)] || 0,
      sortedValues[Math.floor(sortedValues.length * 0.4)] || 0,
      sortedValues[Math.floor(sortedValues.length * 0.6)] || 0,
      sortedValues[Math.floor(sortedValues.length * 0.8)] || 0
    ];

    // Organizar em semanas (para layout de calendário)
    const weeks: HeatmapData[][] = [];
    let currentWeek: HeatmapData[] = [];

    heatmapData.forEach((day, index) => {
      const dayOfWeek = getDay(new Date(day.date));
      
      // Começar nova semana na segunda-feira (1)
      if (dayOfWeek === 1 && currentWeek.length > 0) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
      
      currentWeek.push(day);
      
      // Última iteração
      if (index === heatmapData.length - 1) {
        weeks.push(currentWeek);
      }
    });

    return {
      data: heatmapData,
      weeks,
      stats,
      intensityScale
    };
  }, [rawData, filters.metric, filters.startDate, filters.endDate]);

  // Função para obter intensidade da cor
  const getIntensity = (value: number): string => {
    if (value === 0) return 'none';
    
    const { intensityScale } = processedData;
    if (value <= intensityScale[1]) return 'low';
    if (value <= intensityScale[2]) return 'medium';
    if (value <= intensityScale[3]) return 'high';
    return 'max';
  };

  // Função para obter cor baseada no valor
  const getColor = (value: number): string => {
    const metric = HEATMAP_METRICS.find(m => m.key === filters.metric) || HEATMAP_METRICS[0];
    const intensity = getIntensity(value);
    
    switch (intensity) {
      case 'none':
        return '#f3f4f6'; // gray-100
      case 'low':
        return metric.colorScale.low;
      case 'medium':
        return metric.colorScale.medium;
      case 'high':
      case 'max':
        return metric.colorScale.high;
      default:
        return '#f3f4f6';
    }
  };

  return {
    data: processedData,
    loading,
    error,
    getIntensity,
    getColor,
    metric: HEATMAP_METRICS.find(m => m.key === filters.metric) || HEATMAP_METRICS[0]
  };
}; 