-- Criação da view para análise de leads
CREATE OR REPLACE VIEW leads_analysis AS
WITH daily_metrics AS (
  SELECT
    DATE(created_time) as date,
    campaign_name,
    SUM(lead_count) as total_leads,
    SUM(spend) as total_spend,
    SUM(impressions) as total_impressions,
    SUM(clicks) as total_clicks,
    COUNT(DISTINCT ad_name) as unique_ads,
    COUNT(DISTINCT adset_name) as unique_adsets
  FROM meta_leads
  GROUP BY DATE(created_time), campaign_name
),
campaign_metrics AS (
  SELECT
    campaign_name,
    DATE(created_time) as date,
    SUM(lead_count) as daily_leads,
    SUM(spend) as daily_spend,
    SUM(impressions) as daily_impressions,
    SUM(clicks) as daily_clicks,
    CASE 
      WHEN SUM(clicks) > 0 THEN (SUM(lead_count)::float / SUM(clicks)) * 100
      ELSE 0
    END as conversion_rate,
    CASE 
      WHEN SUM(lead_count) > 0 THEN SUM(spend) / SUM(lead_count)
      ELSE 0
    END as cost_per_lead,
    CASE 
      WHEN SUM(impressions) > 0 THEN (SUM(clicks)::float / SUM(impressions)) * 100
      ELSE 0
    END as ctr,
    CASE 
      WHEN SUM(impressions) > 0 THEN (SUM(spend) / SUM(impressions)) * 1000
      ELSE 0
    END as cpm
  FROM meta_leads
  GROUP BY campaign_name, DATE(created_time)
)
SELECT
  cm.date,
  cm.campaign_name,
  cm.daily_leads,
  cm.daily_spend,
  cm.daily_impressions,
  cm.daily_clicks,
  cm.conversion_rate,
  cm.cost_per_lead,
  cm.ctr,
  cm.cpm,
  dm.unique_ads,
  dm.unique_adsets,
  -- Métricas acumuladas
  SUM(cm.daily_leads) OVER (
    PARTITION BY cm.campaign_name 
    ORDER BY cm.date
  ) as cumulative_leads,
  SUM(cm.daily_spend) OVER (
    PARTITION BY cm.campaign_name 
    ORDER BY cm.date
  ) as cumulative_spend,
  -- Médias móveis (7 dias)
  AVG(cm.daily_leads) OVER (
    PARTITION BY cm.campaign_name 
    ORDER BY cm.date 
    ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
  ) as moving_avg_leads_7d,
  AVG(cm.cost_per_lead) OVER (
    PARTITION BY cm.campaign_name 
    ORDER BY cm.date 
    ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
  ) as moving_avg_cpl_7d
FROM campaign_metrics cm
JOIN daily_metrics dm 
  ON cm.campaign_name = dm.campaign_name 
  AND cm.date = dm.date
ORDER BY cm.date DESC, cm.campaign_name;

-- Comentários para documentação
COMMENT ON VIEW leads_analysis IS 'View para análise detalhada de leads do Meta, incluindo métricas diárias e acumuladas por campanha';
COMMENT ON COLUMN leads_analysis.date IS 'Data do registro';
COMMENT ON COLUMN leads_analysis.campaign_name IS 'Nome da campanha';
COMMENT ON COLUMN leads_analysis.daily_leads IS 'Número de leads no dia';
COMMENT ON COLUMN leads_analysis.daily_spend IS 'Gasto diário (R$)';
COMMENT ON COLUMN leads_analysis.daily_impressions IS 'Impressões diárias';
COMMENT ON COLUMN leads_analysis.daily_clicks IS 'Cliques diários';
COMMENT ON COLUMN leads_analysis.conversion_rate IS 'Taxa de conversão (%)';
COMMENT ON COLUMN leads_analysis.cost_per_lead IS 'Custo por lead (R$)';
COMMENT ON COLUMN leads_analysis.ctr IS 'Taxa de clique (%)';
COMMENT ON COLUMN leads_analysis.cpm IS 'Custo por mil impressões (R$)';
COMMENT ON COLUMN leads_analysis.unique_ads IS 'Número de anúncios únicos';
COMMENT ON COLUMN leads_analysis.unique_adsets IS 'Número de conjuntos de anúncios únicos';
COMMENT ON COLUMN leads_analysis.cumulative_leads IS 'Leads acumulados';
COMMENT ON COLUMN leads_analysis.cumulative_spend IS 'Gasto acumulado (R$)';
COMMENT ON COLUMN leads_analysis.moving_avg_leads_7d IS 'Média móvel de leads (7 dias)';
COMMENT ON COLUMN leads_analysis.moving_avg_cpl_7d IS 'Média móvel de custo por lead (7 dias)'; 