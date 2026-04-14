import { useState, useEffect, useCallback } from 'react';
import { MetaCampaignsService } from '../services/meta/campaigns';
import { supabase } from '../lib/supabaseClient';

export function useCampaignsData(dateFrom, dateTo) {
  const [campaigns, setCampaigns] = useState([]);
  const [summaryMetrics, setSummaryMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  const withTimeout = async (promise, timeoutMs = 15000) => {
    let timeoutId;
    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error('Tempo limite excedido ao buscar dados')), timeoutMs);
    });

    try {
      return await Promise.race([promise, timeoutPromise]);
    } finally {
      clearTimeout(timeoutId);
    }
  };

  const fetchCampaigns = useCallback(async () => {
    if (!dateFrom || !dateTo) return;

    try {
      setLoading(true);
      setError(null);

      // Verificar se as variáveis de ambiente estão disponíveis
      const accessToken = process.env.NEXT_PUBLIC_META_ACCESS_TOKEN;
      const accountId = process.env.NEXT_PUBLIC_META_ACCOUNT_ID || process.env.META_ACCOUNT_ID;
      
      if (!accessToken || !accountId) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('Variáveis de ambiente da Meta API:', {
            accessToken: accessToken ? 'Configurado' : 'Não configurado',
            accountId: accountId ? 'Configurado' : 'Não configurado'
          });
        }
        
        // Em produção, buscar do endpoint server-side para evitar travas no client.
        if (process.env.NODE_ENV === 'production') {
          try {
            const startDate = dateFrom.split('T')[0];
            const endDate = dateTo.split('T')[0];

            const response = await withTimeout(
              fetch(`/api/performance?startDate=${startDate}&endDate=${endDate}&page=1&limit=500&status=ALL`)
            );
            const payload = await response.json();

            if (!response.ok || payload?.error) {
              throw new Error(payload?.details || payload?.error || 'Falha ao buscar performance');
            }

            const mappedCampaigns = (payload.campaigns || []).map((item) => ({
              id: item.id,
              name: item.campaign_name || item.name || item.id,
              status: item.status || 'ACTIVE',
              effective_status: item.status || 'ACTIVE',
              spend: Number(item.spend || 0),
              impressions: Number(item.impressions || 0),
              clicks: Number(item.clicks || 0),
              leads: Number(item.leads || 0),
              ctr: Number(item.ctr || 0),
              cpl: Number(item.cpl || 0),
              is_active: (item.status || '').toUpperCase() === 'ACTIVE'
            }));

            const apiMetrics = payload.metrics || {};
            setSummaryMetrics({
              total: payload.pagination?.total || mappedCampaigns.length,
              active: mappedCampaigns.filter(c => c.is_active).length,
              spend: apiMetrics.totalSpend || 0,
              impressions: apiMetrics.totalImpressions || 0,
              clicks: apiMetrics.totalClicks || 0,
              leads: apiMetrics.totalLeads || 0,
              ctr: apiMetrics.averageCTR || 0,
              cpl: apiMetrics.averageCPL || 0
            });
            setCampaigns(mappedCampaigns);
            setLastUpdate(new Date());
          } catch (error) {
            console.error('Erro ao buscar dados do dashboard no endpoint server:', error);
            setSummaryMetrics(null);
            setCampaigns([]);
          }
          
          setLoading(false);
          return;
        }
        
        throw new Error('Configuração da Meta API não encontrada');
      }

      // Adicionar prefixo 'act_' se não existir
      const normalizedAccountId = accountId.startsWith('act_') ? accountId : `act_${accountId}`;

      const campaignsService = new MetaCampaignsService({
        accessToken: accessToken,
        accountId: normalizedAccountId,
        retryAttempts: 3,
        retryDelay: 1000
      });

      // Buscar campanhas da Meta API
      const metaCampaigns = await campaignsService.getCampaigns();
      
      // Para cada campanha, buscar insights se necessário
      const campaignsWithInsights = await Promise.all(
        metaCampaigns.map(async (campaign) => {
          try {
            const insights = await campaignsService.getCampaignInsights(
              campaign.id,
              dateFrom.split('T')[0],
              dateTo.split('T')[0]
            );

            // Agregar insights do período
            const aggregatedInsights = insights.reduce((acc, insight) => {
              acc.spend += parseFloat(insight.spend || 0);
              acc.impressions += parseInt(insight.impressions || 0);
              acc.clicks += parseInt(insight.clicks || 0);
              
              // Contar leads se disponível
              if (insight.results) {
                const leadResult = insight.results.find(r => r.indicator === 'actions:onsite_conversion.lead_grouped');
                if (leadResult?.values?.[0]?.value) {
                  acc.leads += parseInt(leadResult.values[0].value);
                }
              }
              
              return acc;
            }, { spend: 0, impressions: 0, clicks: 0, leads: 0 });

            return {
              id: campaign.id,
              name: campaign.name,
              status: campaign.status,
              effective_status: campaign.effective_status,
              created_time: campaign.created_time,
              updated_time: campaign.updated_time,
              objective: campaign.objective,
              ...aggregatedInsights,
              ctr: aggregatedInsights.impressions > 0 ? (aggregatedInsights.clicks / aggregatedInsights.impressions) * 100 : 0,
              cpl: aggregatedInsights.leads > 0 ? aggregatedInsights.spend / aggregatedInsights.leads : 0,
              is_active: campaign.effective_status === 'ACTIVE' || campaign.status === 'ACTIVE'
            };
          } catch (error) {
            console.error(`Erro ao buscar insights da campanha ${campaign.name}:`, error);
            // Retornar campanha sem insights
            return {
              id: campaign.id,
              name: campaign.name,
              status: campaign.status,
              effective_status: campaign.effective_status,
              created_time: campaign.created_time,
              updated_time: campaign.updated_time,
              objective: campaign.objective,
              spend: 0,
              impressions: 0,
              clicks: 0,
              leads: 0,
              ctr: 0,
              cpl: 0,
              is_active: campaign.effective_status === 'ACTIVE' || campaign.status === 'ACTIVE'
            };
          }
        })
      );

      setCampaigns(campaignsWithInsights);
      setSummaryMetrics(null);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err.message);
      console.error('Erro ao carregar campanhas:', err);
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const refetch = useCallback(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  return {
    campaigns,
    summaryMetrics,
    loading,
    error,
    lastUpdate,
    refetch
  };
} 