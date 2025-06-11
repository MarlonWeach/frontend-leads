// Função para buscar métricas de campanhas
const fetchCampaignMetrics = async (dateFrom, dateTo) => {
  const { data, error } = await supabase
    .from('meta_leads')
    .select(`
      campaign_name,
      lead_count,
      spend,
      impressions,
      clicks,
      created_time
    `)
    .gte('created_time', dateFrom.toISOString())
    .lte('created_time', dateTo.toISOString());

  if (error) {
    console.error('Erro ao buscar métricas:', error);
    return [];
  }

  // Agrupar métricas por campanha
  const campaignMetrics = data.reduce((acc, record) => {
    const campaignName = record.campaign_name;
    if (!acc[campaignName]) {
      acc[campaignName] = {
        campaign_name: campaignName,
        leads: 0,
        spend: 0,
        impressions: 0,
        clicks: 0,
        ctr: 0,
        cpm: 0,
        cpl: 0
      };
    }

    // Acumular métricas
    acc[campaignName].leads += (record.lead_count || 0);
    acc[campaignName].spend += parseFloat(record.spend || 0);
    acc[campaignName].impressions += parseInt(record.impressions || 0);
    acc[campaignName].clicks += parseInt(record.clicks || 0);

    return acc;
  }, {});

  // Calcular métricas derivadas
  return Object.values(campaignMetrics).map(metrics => ({
    ...metrics,
    ctr: metrics.impressions > 0 ? (metrics.clicks / metrics.impressions) * 100 : 0,
    cpm: metrics.impressions > 0 ? (metrics.spend / metrics.impressions) * 1000 : 0,
    cpl: metrics.leads > 0 ? metrics.spend / metrics.leads : 0
  }));
}; 