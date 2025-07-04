import { useState, useEffect, useCallback } from 'react';
import { MetaCampaignsService } from '../services/meta/campaigns';

export function useCampaignsData(dateFrom, dateTo) {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchCampaigns = useCallback(async () => {
    if (!dateFrom || !dateTo) return;

    try {
      setLoading(true);
      setError(null);

      // Verificar se as variáveis de ambiente estão disponíveis
      const accessToken = process.env.NEXT_PUBLIC_META_ACCESS_TOKEN;
      const accountId = process.env.NEXT_PUBLIC_META_ACCOUNT_ID || process.env.META_ACCOUNT_ID;
      
      if (!accessToken || !accountId) {
        console.error('Variáveis de ambiente:', {
          accessToken: accessToken ? 'Configurado' : 'Não configurado',
          accountId: accountId ? 'Configurado' : 'Não configurado'
        });
        
        // Em produção, retornar dados vazios em vez de erro
        if (process.env.NODE_ENV === 'production') {
          console.warn('Meta API não configurada em produção - retornando dados vazios');
          setCampaigns([]);
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
    loading,
    error,
    lastUpdate,
    refetch
  };
} 