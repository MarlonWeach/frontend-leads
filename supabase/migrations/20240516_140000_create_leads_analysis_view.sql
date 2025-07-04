-- Removido: criação da view leads_analysis baseada em meta_leads

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