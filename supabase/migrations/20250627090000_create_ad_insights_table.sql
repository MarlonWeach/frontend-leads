-- Criar tabela de insights diários de ads
CREATE TABLE IF NOT EXISTS ad_insights (
    id SERIAL PRIMARY KEY,
    ad_id VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    spend NUMERIC(10,2) DEFAULT 0,
    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    ctr NUMERIC(5,4) DEFAULT 0,
    cpc NUMERIC(10,2) DEFAULT 0,
    cpm NUMERIC(10,2) DEFAULT 0,
    leads INTEGER DEFAULT 0,
    reach INTEGER DEFAULT 0,
    frequency NUMERIC(5,2) DEFAULT 0,
    unique_clicks INTEGER DEFAULT 0,
    unique_ctr NUMERIC(5,4) DEFAULT 0,
    unique_link_clicks INTEGER DEFAULT 0,
    unique_link_clicks_ctr NUMERIC(5,4) DEFAULT 0,
    social_spend NUMERIC(10,2) DEFAULT 0,
    social_impressions INTEGER DEFAULT 0,
    social_clicks INTEGER DEFAULT 0,
    social_reach INTEGER DEFAULT 0,
    social_frequency NUMERIC(5,2) DEFAULT 0,
    social_unique_clicks INTEGER DEFAULT 0,
    social_unique_link_clicks INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_ad_date UNIQUE (ad_id, date),
    CONSTRAINT fk_ad_insights_ad FOREIGN KEY (ad_id) REFERENCES ads(id) ON DELETE CASCADE
);

-- Criar índices para otimizar consultas
CREATE INDEX IF NOT EXISTS idx_ad_insights_ad_id ON ad_insights(ad_id);
CREATE INDEX IF NOT EXISTS idx_ad_insights_date ON ad_insights(date);
CREATE INDEX IF NOT EXISTS idx_ad_insights_ad_date ON ad_insights(ad_id, date);

-- Criar trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_ad_insights_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_ad_insights_updated_at ON ad_insights;
CREATE TRIGGER update_ad_insights_updated_at 
    BEFORE UPDATE ON ad_insights 
    FOR EACH ROW 
    EXECUTE FUNCTION update_ad_insights_updated_at();

-- Comentários para documentação
COMMENT ON TABLE ad_insights IS 'Métricas diárias de performance de ads da Meta API';
COMMENT ON COLUMN ad_insights.ad_id IS 'ID do ad na Meta API';
COMMENT ON COLUMN ad_insights.date IS 'Data das métricas (YYYY-MM-DD)';
COMMENT ON COLUMN ad_insights.spend IS 'Gasto total do dia em centavos';
COMMENT ON COLUMN ad_insights.impressions IS 'Número de impressões do dia';
COMMENT ON COLUMN ad_insights.clicks IS 'Número de cliques do dia';
COMMENT ON COLUMN ad_insights.ctr IS 'Taxa de clique (clicks/impressions)';
COMMENT ON COLUMN ad_insights.cpc IS 'Custo por clique em centavos';
COMMENT ON COLUMN ad_insights.cpm IS 'Custo por mil impressões em centavos';
COMMENT ON COLUMN ad_insights.leads IS 'Número de leads/conversões do dia';
COMMENT ON COLUMN ad_insights.reach IS 'Alcance único do dia';
COMMENT ON COLUMN ad_insights.frequency IS 'Frequência média de visualização';
COMMENT ON COLUMN ad_insights.unique_clicks IS 'Cliques únicos do dia';
COMMENT ON COLUMN ad_insights.unique_ctr IS 'Taxa de clique único';
COMMENT ON COLUMN ad_insights.unique_link_clicks IS 'Cliques únicos em links';
COMMENT ON COLUMN ad_insights.unique_link_clicks_ctr IS 'Taxa de clique único em links';
COMMENT ON COLUMN ad_insights.social_spend IS 'Gasto em anúncios sociais';
COMMENT ON COLUMN ad_insights.social_impressions IS 'Impressões sociais';
COMMENT ON COLUMN ad_insights.social_clicks IS 'Cliques sociais';
COMMENT ON COLUMN ad_insights.social_reach IS 'Alcance social';
COMMENT ON COLUMN ad_insights.social_frequency IS 'Frequência social';
COMMENT ON COLUMN ad_insights.social_unique_clicks IS 'Cliques únicos sociais';
COMMENT ON COLUMN ad_insights.social_unique_link_clicks IS 'Cliques únicos em links sociais'; 