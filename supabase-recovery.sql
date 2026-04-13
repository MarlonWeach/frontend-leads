-- ============================================
-- Script de Recuperação de Tabelas do Supabase
-- ============================================
-- Gerado em: 2025-11-24T19:54:29.309Z
-- 
-- IMPORTANTE: 
-- 1. Este script recria apenas a ESTRUTURA das tabelas
-- 2. Os DADOS precisam ser restaurados manualmente via Supabase Dashboard > Backups
-- 3. Execute este script no Supabase Dashboard > SQL Editor
-- 4. Após executar, rode os scripts de sincronização para repovoar os dados
--
-- ============================================
-- TABELAS BASE (devem ser criadas primeiro)
-- ============================================


-- ============================================
-- TABELAS BASE (devem ser criadas primeiro)
-- ============================================

-- Criar tabela adsets se não existir (estrutura mínima)
-- As colunas adicionais serão adicionadas pela migration 20250624_alter_adsets_add_insights.sql
CREATE TABLE IF NOT EXISTS public.adsets (
    id VARCHAR(255) PRIMARY KEY,
    status TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar tabela meta_leads se não existir (estrutura básica)
-- Colunas adicionais podem ser adicionadas pela migration 20240515_add_meta_leads_columns.sql
CREATE TABLE IF NOT EXISTS public.meta_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id VARCHAR(255) UNIQUE,
    ad_id VARCHAR(255),
    adset_id VARCHAR(255),
    campaign_id VARCHAR(255),
    form_id VARCHAR(255),
    created_time TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar índices básicos
CREATE INDEX IF NOT EXISTS idx_adsets_id ON public.adsets(id);
CREATE INDEX IF NOT EXISTS idx_meta_leads_lead_id ON public.meta_leads(lead_id);
CREATE INDEX IF NOT EXISTS idx_meta_leads_ad_id ON public.meta_leads(ad_id);
CREATE INDEX IF NOT EXISTS idx_meta_leads_adset_id ON public.meta_leads(adset_id);
CREATE INDEX IF NOT EXISTS idx_meta_leads_campaign_id ON public.meta_leads(campaign_id);
CREATE INDEX IF NOT EXISTS idx_meta_leads_created_time ON public.meta_leads(created_time);


-- ============================================
-- MIGRATIONS (executar na ordem)
-- ============================================


-- ============================================
-- Migration 1: 20250625_create_campaigns_table.sql
-- ============================================

-- Criar tabela campaigns para armazenar dados da Meta API
CREATE TABLE IF NOT EXISTS campaigns (
    id VARCHAR(255) PRIMARY KEY,
    name TEXT NOT NULL,
    status VARCHAR(50),
    effective_status VARCHAR(50),
    created_time TIMESTAMP WITH TIME ZONE,
    updated_time TIMESTAMP WITH TIME ZONE,
    objective VARCHAR(100),
    special_ad_categories JSONB,
    special_ad_category_country JSONB,
    start_time TIMESTAMP WITH TIME ZONE,
    stop_time TIMESTAMP WITH TIME ZONE,
    daily_budget INTEGER,
    lifetime_budget INTEGER,
    budget_remaining INTEGER,
    spend_cap INTEGER,
    source_campaign_id VARCHAR(255),
    source_campaign_name TEXT,
    source_campaign_status VARCHAR(50),
    source_campaign_effective_status VARCHAR(50),
    source_campaign_created_time TIMESTAMP WITH TIME ZONE,
    source_campaign_updated_time TIMESTAMP WITH TIME ZONE,
    source_campaign_objective VARCHAR(100),
    source_campaign_special_ad_categories JSONB,
    source_campaign_special_ad_category_country JSONB,
    source_campaign_start_time TIMESTAMP WITH TIME ZONE,
    source_campaign_stop_time TIMESTAMP WITH TIME ZONE,
    source_campaign_daily_budget INTEGER,
    source_campaign_lifetime_budget INTEGER,
    source_campaign_budget_remaining INTEGER,
    source_campaign_spend_cap INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_effective_status ON campaigns(effective_status);
CREATE INDEX IF NOT EXISTS idx_campaigns_created_time ON campaigns(created_time);
CREATE INDEX IF NOT EXISTS idx_campaigns_updated_time ON campaigns(updated_time);

-- Criar trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_campaigns_updated_at 
    BEFORE UPDATE ON campaigns 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();


-- ============================================
-- Migration 2: 20250627_add_ads_creative_fields.sql
-- ============================================

-- Adicionar campos de criativo à tabela ads
-- Primeiro, verificar se a tabela ads existe e criar se necessário
CREATE TABLE IF NOT EXISTS ads (
    id VARCHAR(255) PRIMARY KEY,
    name TEXT,
    status VARCHAR(50),
    effective_status VARCHAR(50),
    adset_id VARCHAR(255),
    campaign_id VARCHAR(255),
    created_time TIMESTAMPTZ,
    updated_time TIMESTAMPTZ,
    spend NUMERIC DEFAULT 0,
    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    ctr NUMERIC DEFAULT 0,
    cpc NUMERIC DEFAULT 0,
    cpm NUMERIC DEFAULT 0,
    leads INTEGER DEFAULT 0,
    frequency NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Adicionar campos de criativo se não existirem
ALTER TABLE ads 
ADD COLUMN IF NOT EXISTS creative_type VARCHAR(50) DEFAULT 'TEXT',
ADD COLUMN IF NOT EXISTS creative_images JSONB,
ADD COLUMN IF NOT EXISTS creative_video JSONB,
ADD COLUMN IF NOT EXISTS creative_slideshow JSONB,
ADD COLUMN IF NOT EXISTS creative_text TEXT,
ADD COLUMN IF NOT EXISTS creative_title TEXT,
ADD COLUMN IF NOT EXISTS creative_description TEXT,
ADD COLUMN IF NOT EXISTS creative_body TEXT,
ADD COLUMN IF NOT EXISTS creative_link_url TEXT,
ADD COLUMN IF NOT EXISTS creative_link_title TEXT,
ADD COLUMN IF NOT EXISTS creative_link_description TEXT,
ADD COLUMN IF NOT EXISTS creative_link_image_url TEXT,
ADD COLUMN IF NOT EXISTS creative_link_image_hash TEXT,
ADD COLUMN IF NOT EXISTS creative_link_image_width INTEGER,
ADD COLUMN IF NOT EXISTS creative_link_image_height INTEGER,
ADD COLUMN IF NOT EXISTS creative_link_image_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS creative_link_image_format VARCHAR(50),
ADD COLUMN IF NOT EXISTS creative_link_image_size INTEGER,
ADD COLUMN IF NOT EXISTS creative_link_image_original_width INTEGER,
ADD COLUMN IF NOT EXISTS creative_link_image_original_height INTEGER,
ADD COLUMN IF NOT EXISTS creative_link_image_original_format VARCHAR(50),
ADD COLUMN IF NOT EXISTS creative_link_image_original_size INTEGER,
ADD COLUMN IF NOT EXISTS creative_link_image_original_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS creative_link_image_original_hash TEXT,
ADD COLUMN IF NOT EXISTS creative_link_image_original_url TEXT,
ADD COLUMN IF NOT EXISTS creative_link_image_original_name TEXT,
ADD COLUMN IF NOT EXISTS creative_link_image_original_alt TEXT,
ADD COLUMN IF NOT EXISTS creative_link_image_original_title TEXT,
ADD COLUMN IF NOT EXISTS creative_link_image_original_description TEXT,
ADD COLUMN IF NOT EXISTS creative_link_image_original_caption TEXT,
ADD COLUMN IF NOT EXISTS creative_link_image_original_credit TEXT,
ADD COLUMN IF NOT EXISTS creative_link_image_original_source TEXT,
ADD COLUMN IF NOT EXISTS creative_link_image_original_author TEXT,
ADD COLUMN IF NOT EXISTS creative_link_image_original_date TEXT,
ADD COLUMN IF NOT EXISTS creative_link_image_original_location TEXT,
ADD COLUMN IF NOT EXISTS creative_link_image_original_tags TEXT[],
ADD COLUMN IF NOT EXISTS creative_link_image_original_categories TEXT[],
ADD COLUMN IF NOT EXISTS creative_link_image_original_rating NUMERIC,
ADD COLUMN IF NOT EXISTS creative_link_image_original_views INTEGER,
ADD COLUMN IF NOT EXISTS creative_link_image_original_downloads INTEGER,
ADD COLUMN IF NOT EXISTS creative_link_image_original_likes INTEGER,
ADD COLUMN IF NOT EXISTS creative_link_image_original_comments INTEGER,
ADD COLUMN IF NOT EXISTS creative_link_image_original_shares INTEGER,
ADD COLUMN IF NOT EXISTS creative_link_image_original_favorites INTEGER,
ADD COLUMN IF NOT EXISTS creative_link_image_original_bookmarks INTEGER,
ADD COLUMN IF NOT EXISTS creative_link_image_original_embeds INTEGER,
ADD COLUMN IF NOT EXISTS creative_link_image_original_prints INTEGER,
ADD COLUMN IF NOT EXISTS creative_link_image_original_edits INTEGER,
ADD COLUMN IF NOT EXISTS creative_link_image_original_versions INTEGER,
ADD COLUMN IF NOT EXISTS creative_link_image_original_metadata JSONB;

-- Criar índices para otimizar consultas
CREATE INDEX IF NOT EXISTS idx_ads_adset_id ON ads(adset_id);
CREATE INDEX IF NOT EXISTS idx_ads_campaign_id ON ads(campaign_id);
CREATE INDEX IF NOT EXISTS idx_ads_status ON ads(status);
CREATE INDEX IF NOT EXISTS idx_ads_effective_status ON ads(effective_status);
CREATE INDEX IF NOT EXISTS idx_ads_creative_type ON ads(creative_type);
CREATE INDEX IF NOT EXISTS idx_ads_created_time ON ads(created_time);
CREATE INDEX IF NOT EXISTS idx_ads_updated_time ON ads(updated_time);

-- Criar trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_ads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_ads_updated_at ON ads;
CREATE TRIGGER update_ads_updated_at 
    BEFORE UPDATE ON ads 
    FOR EACH ROW 
    EXECUTE FUNCTION update_ads_updated_at();

-- Comentários para documentação
COMMENT ON TABLE ads IS 'Tabela de anúncios individuais da Meta API';
COMMENT ON COLUMN ads.id IS 'ID único do anúncio na Meta API';
COMMENT ON COLUMN ads.name IS 'Nome do anúncio';
COMMENT ON COLUMN ads.status IS 'Status do anúncio (ACTIVE, PAUSED, etc.)';
COMMENT ON COLUMN ads.effective_status IS 'Status efetivo do anúncio';
COMMENT ON COLUMN ads.adset_id IS 'ID do adset ao qual o anúncio pertence';
COMMENT ON COLUMN ads.campaign_id IS 'ID da campanha ao qual o anúncio pertence';
COMMENT ON COLUMN ads.creative_type IS 'Tipo de criativo (IMAGE, VIDEO, SLIDESHOW, TEXT)';
COMMENT ON COLUMN ads.creative_images IS 'Array de imagens do criativo em formato JSONB';
COMMENT ON COLUMN ads.creative_video IS 'Dados do vídeo do criativo em formato JSONB';
COMMENT ON COLUMN ads.creative_slideshow IS 'Dados do slideshow do criativo em formato JSONB';
COMMENT ON COLUMN ads.creative_text IS 'Texto principal do anúncio';
COMMENT ON COLUMN ads.creative_title IS 'Título do anúncio';
COMMENT ON COLUMN ads.creative_description IS 'Descrição do anúncio';
COMMENT ON COLUMN ads.creative_body IS 'Corpo do texto do anúncio';
COMMENT ON COLUMN ads.creative_link_url IS 'URL do link do anúncio';
COMMENT ON COLUMN ads.creative_link_title IS 'Título do link do anúncio';
COMMENT ON COLUMN ads.creative_link_description IS 'Descrição do link do anúncio';
COMMENT ON COLUMN ads.creative_link_image_url IS 'URL da imagem do link do anúncio';
COMMENT ON COLUMN ads.spend IS 'Gasto total do anúncio';
COMMENT ON COLUMN ads.impressions IS 'Número total de impressões';
COMMENT ON COLUMN ads.clicks IS 'Número total de cliques';
COMMENT ON COLUMN ads.ctr IS 'Taxa de clique (clicks/impressions)';
COMMENT ON COLUMN ads.cpc IS 'Custo por clique';
COMMENT ON COLUMN ads.cpm IS 'Custo por mil impressões';
COMMENT ON COLUMN ads.leads IS 'Número total de leads/conversões';
COMMENT ON COLUMN ads.frequency IS 'Frequência média de visualização';


-- ============================================
-- Migration 3: 20250624_alter_adsets_add_insights.sql
-- ============================================

-- Adicionar colunas de insights e metadados à tabela existente de adsets
ALTER TABLE public.adsets
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS effective_status TEXT,
ADD COLUMN IF NOT EXISTS campaign_id TEXT,
ADD COLUMN IF NOT EXISTS created_time TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS start_time TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS end_time TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS daily_budget NUMERIC,
ADD COLUMN IF NOT EXISTS lifetime_budget NUMERIC,
ADD COLUMN IF NOT EXISTS optimization_goal TEXT,
ADD COLUMN IF NOT EXISTS billing_event TEXT,
ADD COLUMN IF NOT EXISTS targeting JSONB,
ADD COLUMN IF NOT EXISTS spend NUMERIC,
ADD COLUMN IF NOT EXISTS impressions INTEGER,
ADD COLUMN IF NOT EXISTS clicks INTEGER,
ADD COLUMN IF NOT EXISTS ctr NUMERIC,
ADD COLUMN IF NOT EXISTS cpc NUMERIC,
ADD COLUMN IF NOT EXISTS cpm NUMERIC,
ADD COLUMN IF NOT EXISTS leads INTEGER,
ADD COLUMN IF NOT EXISTS last_synced TIMESTAMPTZ DEFAULT NOW();

-- Garantir que a coluna 'status' e 'updated_at' existam, caso o schema base seja diferente
ALTER TABLE public.adsets
ADD COLUMN IF NOT EXISTS status TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

-- Adicionar índices para otimizar as consultas mais comuns
CREATE INDEX IF NOT EXISTS idx_adsets_campaign_id ON public.adsets(campaign_id);
CREATE INDEX IF NOT EXISTS idx_adsets_status ON public.adsets(status);
CREATE INDEX IF NOT EXISTS idx_adsets_effective_status ON public.adsets(effective_status);
CREATE INDEX IF NOT EXISTS idx_adsets_last_synced ON public.adsets(last_synced);

COMMENT ON COLUMN public.adsets.last_synced IS 'Timestamp da última vez que este registro foi sincronizado com a Meta API.';


-- ============================================
-- Migration 4: 20250626_create_adset_insights_table.sql
-- ============================================

-- Criar tabela de insights diários de adsets
CREATE TABLE IF NOT EXISTS adset_insights (
    id SERIAL PRIMARY KEY,
    adset_id VARCHAR(255) NOT NULL,
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
    CONSTRAINT unique_adset_date UNIQUE (adset_id, date),
    CONSTRAINT fk_adset_insights_adset FOREIGN KEY (adset_id) REFERENCES adsets(id) ON DELETE CASCADE
);

-- Criar índices para otimizar consultas
CREATE INDEX IF NOT EXISTS idx_adset_insights_adset_id ON adset_insights(adset_id);
CREATE INDEX IF NOT EXISTS idx_adset_insights_date ON adset_insights(date);
CREATE INDEX IF NOT EXISTS idx_adset_insights_adset_date ON adset_insights(adset_id, date);

-- Criar trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_adset_insights_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_adset_insights_updated_at ON adset_insights;
CREATE TRIGGER update_adset_insights_updated_at 
    BEFORE UPDATE ON adset_insights 
    FOR EACH ROW 
    EXECUTE FUNCTION update_adset_insights_updated_at();

-- Comentários para documentação
COMMENT ON TABLE adset_insights IS 'Métricas diárias de performance de adsets da Meta API';
COMMENT ON COLUMN adset_insights.adset_id IS 'ID do adset na Meta API';
COMMENT ON COLUMN adset_insights.date IS 'Data das métricas (YYYY-MM-DD)';
COMMENT ON COLUMN adset_insights.spend IS 'Gasto total do dia em centavos';
COMMENT ON COLUMN adset_insights.impressions IS 'Número de impressões do dia';
COMMENT ON COLUMN adset_insights.clicks IS 'Número de cliques do dia';
COMMENT ON COLUMN adset_insights.ctr IS 'Taxa de clique (clicks/impressions)';
COMMENT ON COLUMN adset_insights.cpc IS 'Custo por clique em centavos';
COMMENT ON COLUMN adset_insights.cpm IS 'Custo por mil impressões em centavos';
COMMENT ON COLUMN adset_insights.leads IS 'Número de leads/conversões do dia';
COMMENT ON COLUMN adset_insights.reach IS 'Alcance único do dia';
COMMENT ON COLUMN adset_insights.frequency IS 'Frequência média de visualização';
COMMENT ON COLUMN adset_insights.unique_clicks IS 'Cliques únicos do dia';
COMMENT ON COLUMN adset_insights.unique_ctr IS 'Taxa de clique único';
COMMENT ON COLUMN adset_insights.unique_link_clicks IS 'Cliques únicos em links';
COMMENT ON COLUMN adset_insights.unique_link_clicks_ctr IS 'Taxa de clique único em links';
COMMENT ON COLUMN adset_insights.social_spend IS 'Gasto em anúncios sociais';
COMMENT ON COLUMN adset_insights.social_impressions IS 'Impressões sociais';
COMMENT ON COLUMN adset_insights.social_clicks IS 'Cliques sociais';
COMMENT ON COLUMN adset_insights.social_reach IS 'Alcance social';
COMMENT ON COLUMN adset_insights.social_frequency IS 'Frequência social';
COMMENT ON COLUMN adset_insights.social_unique_clicks IS 'Cliques únicos sociais';
COMMENT ON COLUMN adset_insights.social_unique_link_clicks IS 'Cliques únicos em links sociais';


-- ============================================
-- Migration 5: 20250627_create_ad_insights_table.sql
-- ============================================

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


-- ============================================
-- Migration 6: 20250621_create_sync_status_table.sql
-- ============================================

-- Tabela para armazenar o status da sincronização
CREATE TABLE IF NOT EXISTS public.sync_status (
  id TEXT PRIMARY KEY,
  last_sync_start TIMESTAMPTZ,
  last_sync_end TIMESTAMPTZ,
  status TEXT NOT NULL,
  error_message TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Inserir um registro inicial se a tabela estiver vazia
INSERT INTO public.sync_status (id, status)
VALUES ('meta_leads_sync', 'idle')
ON CONFLICT (id) DO NOTHING;

-- Habilitar RLS
ALTER TABLE public.sync_status ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
DROP POLICY IF EXISTS "Permitir leitura para todos" ON public.sync_status;
CREATE POLICY "Permitir leitura para todos"
ON public.sync_status
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Permitir atualização para service_role" ON public.sync_status;
CREATE POLICY "Permitir atualização para service_role"
ON public.sync_status
FOR UPDATE
USING (auth.role() = 'service_role');


-- ============================================
-- Migration 7: 20240618_create_audit_logs_table.sql
-- ============================================

-- Criação da tabela audit_logs para armazenar resultados de auditorias diárias
-- Data: 2024-06-18

CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGSERIAL PRIMARY KEY,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  date_from DATE NOT NULL,
  date_to DATE NOT NULL,
  has_discrepancies BOOLEAN NOT NULL,
  discrepancies_count INTEGER DEFAULT 0,
  meta_leads INTEGER DEFAULT 0,
  supabase_leads INTEGER DEFAULT 0,
  meta_spend DECIMAL(15,2) DEFAULT 0,
  supabase_spend DECIMAL(15,2) DEFAULT 0,
  meta_impressions BIGINT DEFAULT 0,
  supabase_impressions BIGINT DEFAULT 0,
  meta_clicks INTEGER DEFAULT 0,
  supabase_clicks INTEGER DEFAULT 0,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para otimizar consultas
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_date_range ON audit_logs(date_from, date_to);
CREATE INDEX IF NOT EXISTS idx_audit_logs_discrepancies ON audit_logs(has_discrepancies);

-- Comentários para documentação
COMMENT ON TABLE audit_logs IS 'Logs de auditoria diária comparando dados do Supabase com Meta API';
COMMENT ON COLUMN audit_logs.has_discrepancies IS 'Indica se foram encontradas divergências entre os sistemas';
COMMENT ON COLUMN audit_logs.discrepancies_count IS 'Número de métricas com divergências';
COMMENT ON COLUMN audit_logs.details IS 'Detalhes das divergências encontradas em formato JSON';


-- ============================================
-- Migration 8: 20250626_create_cache_stats_table.sql
-- ============================================

-- Criar tabela cache_stats para monitoramento de performance
CREATE TABLE IF NOT EXISTS cache_stats (
  id SERIAL PRIMARY KEY,
  cache_type TEXT NOT NULL,
  hits INTEGER DEFAULT 0,
  misses INTEGER DEFAULT 0,
  size_bytes BIGINT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_cache_stats_type ON cache_stats(cache_type);
CREATE INDEX IF NOT EXISTS idx_cache_stats_created_at ON cache_stats(created_at);

-- Inserir dados iniciais
INSERT INTO cache_stats (cache_type, hits, misses, size_bytes) VALUES
  ('general', 150, 25, 1024000),
  ('api', 89, 12, 512000),
  ('dashboard', 234, 45, 2048000)
ON CONFLICT DO NOTHING;

-- Criar função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_cache_stats_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para atualizar updated_at automaticamente
DROP TRIGGER IF EXISTS trigger_update_cache_stats_updated_at ON cache_stats;
CREATE TRIGGER trigger_update_cache_stats_updated_at
  BEFORE UPDATE ON cache_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_cache_stats_updated_at();


-- ============================================
-- Migration 9: 20250627_create_ai_analysis_logs_table.sql
-- ============================================

-- Criar tabela para logs de análise de IA
CREATE TABLE IF NOT EXISTS ai_analysis_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  analysis_type TEXT NOT NULL, -- 'performance', 'anomalies', 'optimization', 'chat'
  campaign_ids TEXT[], -- IDs das campanhas analisadas
  date_range JSONB, -- Período analisado
  tokens_used INTEGER, -- Tokens estimados utilizados
  cost_estimated DECIMAL(10,4), -- Custo estimado
  model_used TEXT DEFAULT 'gpt-4', -- Modelo utilizado
  status TEXT DEFAULT 'completed', -- 'completed', 'error', 'processing'
  error_message TEXT, -- Mensagem de erro se houver
  metadata JSONB, -- Dados adicionais
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_ai_analysis_logs_created_at ON ai_analysis_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_logs_analysis_type ON ai_analysis_logs(analysis_type);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_logs_status ON ai_analysis_logs(status);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ai_analysis_logs_updated_at 
  BEFORE UPDATE ON ai_analysis_logs 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comentários
COMMENT ON TABLE ai_analysis_logs IS 'Log de análises de IA realizadas para monitoramento de uso e custos';
COMMENT ON COLUMN ai_analysis_logs.analysis_type IS 'Tipo de análise: performance, anomalies, optimization, chat';
COMMENT ON COLUMN ai_analysis_logs.tokens_used IS 'Estimativa de tokens utilizados na análise';
COMMENT ON COLUMN ai_analysis_logs.cost_estimated IS 'Custo estimado da análise em USD';


-- ============================================
-- Migration 10: 20250627_create_ai_anomalies_table.sql
-- ============================================

-- Criar tabela para armazenar anomalias detectadas pela IA
CREATE TABLE IF NOT EXISTS ai_anomalies (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    confidence DECIMAL(3,2) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    affected_campaigns TEXT[] DEFAULT '{}',
    metrics JSONB DEFAULT '{}',
    recommendations TEXT[] DEFAULT '{}',
    resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_ai_anomalies_type ON ai_anomalies(type);
CREATE INDEX IF NOT EXISTS idx_ai_anomalies_severity ON ai_anomalies(severity);
CREATE INDEX IF NOT EXISTS idx_ai_anomalies_created_at ON ai_anomalies(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_anomalies_resolved ON ai_anomalies(resolved);
CREATE INDEX IF NOT EXISTS idx_ai_anomalies_confidence ON ai_anomalies(confidence);

-- Criar trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_ai_anomalies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ai_anomalies_updated_at
    BEFORE UPDATE ON ai_anomalies
    FOR EACH ROW
    EXECUTE FUNCTION update_ai_anomalies_updated_at();

-- Comentários na tabela e colunas
COMMENT ON TABLE ai_anomalies IS 'Anomalias detectadas pelo sistema de IA';
COMMENT ON COLUMN ai_anomalies.id IS 'Identificador único da anomalia';
COMMENT ON COLUMN ai_anomalies.type IS 'Tipo de anomalia (HIGH_CONVERSION_RATE, SUSPICIOUS_TRAFFIC, etc.)';
COMMENT ON COLUMN ai_anomalies.severity IS 'Nível de severidade da anomalia';
COMMENT ON COLUMN ai_anomalies.title IS 'Título da anomalia';
COMMENT ON COLUMN ai_anomalies.description IS 'Descrição detalhada da anomalia';
COMMENT ON COLUMN ai_anomalies.confidence IS 'Nível de confiança na detecção (0-1)';
COMMENT ON COLUMN ai_anomalies.affected_campaigns IS 'Array com nomes das campanhas afetadas';
COMMENT ON COLUMN ai_anomalies.metrics IS 'Métricas relacionadas à anomalia (JSON)';
COMMENT ON COLUMN ai_anomalies.recommendations IS 'Array com recomendações para resolver a anomalia';
COMMENT ON COLUMN ai_anomalies.resolved IS 'Se a anomalia foi marcada como resolvida';
COMMENT ON COLUMN ai_anomalies.resolved_at IS 'Timestamp de quando foi resolvida';
COMMENT ON COLUMN ai_anomalies.resolved_by IS 'Usuário que marcou como resolvida';


-- ============================================
-- Migration 11: 20250122_create_adset_goals_table.sql
-- ============================================

-- Migration: Create adset_goals table for PBI 25 - Task 25-1
-- Created: 2025-01-22
-- Purpose: Store contractual goals per adset (budget, CPL target, volume, dates)

CREATE TABLE adset_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  adset_id VARCHAR NOT NULL,
  adset_name VARCHAR, -- Cache do nome para facilitar queries
  budget_total DECIMAL(10,2) NOT NULL,
  cpl_target DECIMAL(8,2) NOT NULL,
  volume_contracted INTEGER NOT NULL,
  volume_captured INTEGER DEFAULT 0,
  contract_start_date DATE NOT NULL,
  contract_end_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE UNIQUE INDEX idx_adset_goals_adset_id ON adset_goals(adset_id);
CREATE INDEX idx_adset_goals_dates ON adset_goals(contract_start_date, contract_end_date);
-- Removido índice parcial inválido:
-- CREATE INDEX idx_adset_goals_active ON adset_goals(contract_end_date) WHERE contract_end_date >= CURRENT_DATE;
-- Substituído por índice simples:
CREATE INDEX idx_adset_goals_end_date ON adset_goals(contract_end_date);

-- Constraints
ALTER TABLE adset_goals ADD CONSTRAINT valid_dates 
  CHECK (contract_end_date > contract_start_date);

ALTER TABLE adset_goals ADD CONSTRAINT positive_budget 
  CHECK (budget_total > 0);

ALTER TABLE adset_goals ADD CONSTRAINT positive_cpl 
  CHECK (cpl_target > 0);

ALTER TABLE adset_goals ADD CONSTRAINT positive_volume 
  CHECK (volume_contracted > 0);

ALTER TABLE adset_goals ADD CONSTRAINT valid_captured_volume 
  CHECK (volume_captured >= 0 AND volume_captured <= volume_contracted);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_adset_goals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER trigger_update_adset_goals_updated_at
  BEFORE UPDATE ON adset_goals
  FOR EACH ROW
  EXECUTE FUNCTION update_adset_goals_updated_at();

-- Comments for documentation
COMMENT ON TABLE adset_goals IS 'Contractual goals and targets per adset for optimization system';
COMMENT ON COLUMN adset_goals.adset_id IS 'Meta API adset ID';
COMMENT ON COLUMN adset_goals.budget_total IS 'Total budget allocated for the contract period in BRL';
COMMENT ON COLUMN adset_goals.cpl_target IS 'Target cost per lead in BRL';
COMMENT ON COLUMN adset_goals.volume_contracted IS 'Total number of leads contracted for the period';
COMMENT ON COLUMN adset_goals.volume_captured IS 'Number of leads already captured by client (manually updated)';
COMMENT ON COLUMN adset_goals.contract_start_date IS 'Start date of the contract period';
COMMENT ON COLUMN adset_goals.contract_end_date IS 'End date of the contract period';


-- ============================================
-- Migration 12: 20250122_create_adset_progress_tracking.sql
-- ============================================

-- Migration: Create adset_progress_tracking table for PBI 25 - Task 25-3
-- Created: 2025-01-22
-- Purpose: Store daily progress tracking for adset goals

CREATE TABLE adset_progress_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  adset_id VARCHAR NOT NULL,
  date DATE NOT NULL,
  leads_captured INTEGER NOT NULL,
  daily_target NUMERIC(8,2) NOT NULL,
  status VARCHAR(16) NOT NULL, -- on_track, behind, ahead, at_risk, completed
  deviation_pct NUMERIC(6,2) NOT NULL,
  alert_id UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (adset_id, date)
);

CREATE INDEX idx_adset_progress_tracking_adset_id ON adset_progress_tracking(adset_id);
CREATE INDEX idx_adset_progress_tracking_date ON adset_progress_tracking(date);

COMMENT ON TABLE adset_progress_tracking IS 'Daily progress tracking for adset goals';
COMMENT ON COLUMN adset_progress_tracking.status IS 'on_track, behind, ahead, at_risk, completed';


-- ============================================
-- Migration 13: 20250122_create_adset_progress_alerts.sql
-- ============================================

-- Migration: Create adset_progress_alerts table for PBI 25 - Task 25-3
-- Created: 2025-01-22
-- Purpose: Store persistent alerts for adset progress deviations

CREATE TABLE adset_progress_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  adset_id VARCHAR NOT NULL,
  date DATE NOT NULL,
  type VARCHAR(24) NOT NULL, -- behind, ahead, at_risk, completed
  severity VARCHAR(12) NOT NULL, -- info, warning, error, critical
  message TEXT NOT NULL,
  resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_adset_progress_alerts_adset_id ON adset_progress_alerts(adset_id);
CREATE INDEX idx_adset_progress_alerts_date ON adset_progress_alerts(date);

COMMENT ON TABLE adset_progress_alerts IS 'Persistent alerts for adset progress deviations';
COMMENT ON COLUMN adset_progress_alerts.type IS 'behind, ahead, at_risk, completed';


-- ============================================
-- Migration 14: 20250122_create_adset_budget_adjustments.sql
-- ============================================

-- Migration: Create adset_budget_adjustments table for PBI 25 - Task 25-4
-- Created: 2025-01-22
-- Purpose: Store all budget adjustment logs for adsets (20% rule, audit)

CREATE TABLE adset_budget_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  adset_id VARCHAR NOT NULL,
  timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  old_budget NUMERIC(12,2) NOT NULL,
  new_budget NUMERIC(12,2) NOT NULL,
  percent_change NUMERIC(5,2) NOT NULL,
  user_id VARCHAR NOT NULL,
  reason VARCHAR(32) NOT NULL, -- atraso_meta, estrategia, correcao_erro, manual
  status VARCHAR(16) NOT NULL, -- success, blocked, error
  message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_budget_adjustments_adset_id ON adset_budget_adjustments(adset_id);
CREATE INDEX idx_budget_adjustments_timestamp ON adset_budget_adjustments(timestamp);

COMMENT ON TABLE adset_budget_adjustments IS 'Logs of all budget adjustments for adsets (20% rule, audit)';
COMMENT ON COLUMN adset_budget_adjustments.reason IS 'atraso_meta, estrategia, correcao_erro, manual';
COMMENT ON COLUMN adset_budget_adjustments.status IS 'success, blocked, error';


-- ============================================
-- Migration 15: 20250122_create_alerts_system.sql
-- ============================================

-- Migration: Create alerts system
-- PBI 25 - Task 25-10: Sistema de Alertas Inteligentes
-- Created: 2025-01-22

-- Create alert_rules table (configurações de alertas)
CREATE TABLE IF NOT EXISTS alert_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identificação
    name TEXT NOT NULL,
    description TEXT,
    adset_id TEXT, -- NULL = regra global
    campaign_id TEXT,
    user_id TEXT,
    
    -- Configuração da regra
    alert_type TEXT NOT NULL, -- 'goal_deviation', 'high_cpl', 'budget_depletion', 'quality_drop'
    severity TEXT NOT NULL DEFAULT 'warning', -- 'info', 'warning', 'critical'
    is_active BOOLEAN DEFAULT true,
    
    -- Thresholds específicos por tipo
    thresholds JSONB NOT NULL DEFAULT '{}',
    
    -- Configuração de notificações
    notification_channels TEXT[] DEFAULT ARRAY['dashboard'], -- 'email', 'webhook', 'dashboard'
    notification_template TEXT,
    
    -- Cooldown e rate limiting
    cooldown_minutes INTEGER DEFAULT 60,
    max_notifications_per_hour INTEGER DEFAULT 5,
    
    -- Metadados
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by TEXT,
    
    -- Constraints
    CONSTRAINT alert_rules_type_check 
        CHECK (alert_type IN ('goal_deviation', 'high_cpl', 'budget_depletion', 'quality_drop', 'performance_anomaly')),
    CONSTRAINT alert_rules_severity_check 
        CHECK (severity IN ('info', 'warning', 'critical'))
);

-- Create alerts table (alertas gerados)
CREATE TABLE IF NOT EXISTS alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identificação
    rule_id UUID REFERENCES alert_rules(id) ON DELETE CASCADE,
    adset_id TEXT NOT NULL,
    campaign_id TEXT,
    
    -- Dados do alerta
    alert_type TEXT NOT NULL,
    severity TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    
    -- Contexto e dados
    context JSONB DEFAULT '{}', -- métricas que geraram o alerta
    suggested_actions TEXT[],
    
    -- Status
    status TEXT DEFAULT 'active', -- 'active', 'acknowledged', 'resolved', 'snoozed'
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    acknowledged_by TEXT,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by TEXT,
    snoozed_until TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT alerts_type_check 
        CHECK (alert_type IN ('goal_deviation', 'high_cpl', 'budget_depletion', 'quality_drop', 'performance_anomaly')),
    CONSTRAINT alerts_severity_check 
        CHECK (severity IN ('info', 'warning', 'critical')),
    CONSTRAINT alerts_status_check 
        CHECK (status IN ('active', 'acknowledged', 'resolved', 'snoozed'))
);

-- Create alert_notifications table (histórico de notificações)
CREATE TABLE IF NOT EXISTS alert_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Relacionamento
    alert_id UUID REFERENCES alerts(id) ON DELETE CASCADE,
    rule_id UUID REFERENCES alert_rules(id) ON DELETE CASCADE,
    
    -- Configuração da notificação
    channel TEXT NOT NULL, -- 'email', 'webhook', 'dashboard'
    recipient TEXT, -- email ou webhook URL
    
    -- Conteúdo
    subject TEXT,
    content TEXT NOT NULL,
    template_used TEXT,
    
    -- Status de entrega
    status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'failed', 'skipped'
    sent_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    
    -- Metadados
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT alert_notifications_channel_check 
        CHECK (channel IN ('email', 'webhook', 'dashboard', 'sms')),
    CONSTRAINT alert_notifications_status_check 
        CHECK (status IN ('pending', 'sent', 'failed', 'skipped'))
);

-- Create alert_stats table (estatísticas de alertas)
CREATE TABLE IF NOT EXISTS alert_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Período
    date_period DATE NOT NULL,
    hour_period INTEGER, -- NULL para stats diárias, 0-23 para stats horárias
    
    -- Identificação
    adset_id TEXT,
    campaign_id TEXT,
    alert_type TEXT,
    
    -- Estatísticas
    total_alerts INTEGER DEFAULT 0,
    critical_alerts INTEGER DEFAULT 0,
    warning_alerts INTEGER DEFAULT 0,
    info_alerts INTEGER DEFAULT 0,
    resolved_alerts INTEGER DEFAULT 0,
    avg_resolution_time_minutes INTEGER,
    
    -- Metadados
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(date_period, hour_period, adset_id, campaign_id, alert_type)
);

-- Create indexes for performance
CREATE INDEX idx_alert_rules_adset_id ON alert_rules(adset_id);
CREATE INDEX idx_alert_rules_campaign_id ON alert_rules(campaign_id);
CREATE INDEX idx_alert_rules_type_active ON alert_rules(alert_type, is_active);

CREATE INDEX idx_alerts_adset_id ON alerts(adset_id);
CREATE INDEX idx_alerts_campaign_id ON alerts(campaign_id);
CREATE INDEX idx_alerts_type_severity ON alerts(alert_type, severity);
CREATE INDEX idx_alerts_status_created ON alerts(status, created_at);
CREATE INDEX idx_alerts_rule_id ON alerts(rule_id);

CREATE INDEX idx_alert_notifications_alert_id ON alert_notifications(alert_id);
CREATE INDEX idx_alert_notifications_channel_status ON alert_notifications(channel, status);
CREATE INDEX idx_alert_notifications_created_at ON alert_notifications(created_at);

CREATE INDEX idx_alert_stats_period ON alert_stats(date_period, hour_period);
CREATE INDEX idx_alert_stats_adset ON alert_stats(adset_id, date_period);

-- Create functions for alert management

-- Function to check if alert should be suppressed due to cooldown
CREATE OR REPLACE FUNCTION should_suppress_alert(
    p_rule_id UUID,
    p_adset_id TEXT,
    p_alert_type TEXT
) RETURNS BOOLEAN AS $$
DECLARE
    rule_cooldown INTEGER;
    last_alert_time TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Get rule cooldown
    SELECT cooldown_minutes INTO rule_cooldown
    FROM alert_rules 
    WHERE id = p_rule_id;
    
    IF rule_cooldown IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Get last alert of same type for same adset
    SELECT MAX(created_at) INTO last_alert_time
    FROM alerts
    WHERE rule_id = p_rule_id 
      AND adset_id = p_adset_id 
      AND alert_type = p_alert_type
      AND status IN ('active', 'acknowledged');
    
    -- If no previous alert, don't suppress
    IF last_alert_time IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Suppress if within cooldown period
    RETURN (NOW() - last_alert_time) < (rule_cooldown || ' minutes')::INTERVAL;
END;
$$ LANGUAGE plpgsql;

-- Function to get active alerts for adset
CREATE OR REPLACE FUNCTION get_active_alerts_for_adset(
    p_adset_id TEXT,
    p_severity TEXT DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_agg(
        json_build_object(
            'id', id,
            'alert_type', alert_type,
            'severity', severity,
            'title', title,
            'message', message,
            'context', context,
            'suggested_actions', suggested_actions,
            'created_at', created_at,
            'snoozed_until', snoozed_until
        )
    )
    INTO result
    FROM alerts
    WHERE adset_id = p_adset_id
      AND status IN ('active', 'snoozed')
      AND (p_severity IS NULL OR severity = p_severity)
      AND (snoozed_until IS NULL OR snoozed_until < NOW())
    ORDER BY 
        CASE severity 
            WHEN 'critical' THEN 1 
            WHEN 'warning' THEN 2 
            WHEN 'info' THEN 3 
        END,
        created_at DESC;
    
    RETURN COALESCE(result, '[]'::JSON);
END;
$$ LANGUAGE plpgsql;

-- Function to update alert stats
CREATE OR REPLACE FUNCTION update_alert_stats(
    p_date DATE,
    p_hour INTEGER,
    p_adset_id TEXT,
    p_campaign_id TEXT,
    p_alert_type TEXT,
    p_severity TEXT
) RETURNS VOID AS $$
BEGIN
    INSERT INTO alert_stats (
        date_period, hour_period, adset_id, campaign_id, alert_type,
        total_alerts,
        critical_alerts,
        warning_alerts,
        info_alerts
    )
    VALUES (
        p_date, p_hour, p_adset_id, p_campaign_id, p_alert_type,
        1,
        CASE WHEN p_severity = 'critical' THEN 1 ELSE 0 END,
        CASE WHEN p_severity = 'warning' THEN 1 ELSE 0 END,
        CASE WHEN p_severity = 'info' THEN 1 ELSE 0 END
    )
    ON CONFLICT (date_period, hour_period, adset_id, campaign_id, alert_type)
    DO UPDATE SET
        total_alerts = alert_stats.total_alerts + 1,
        critical_alerts = alert_stats.critical_alerts + 
            CASE WHEN p_severity = 'critical' THEN 1 ELSE 0 END,
        warning_alerts = alert_stats.warning_alerts + 
            CASE WHEN p_severity = 'warning' THEN 1 ELSE 0 END,
        info_alerts = alert_stats.info_alerts + 
            CASE WHEN p_severity = 'info' THEN 1 ELSE 0 END,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Trigger to update stats when alerts are created
CREATE OR REPLACE FUNCTION trigger_update_alert_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Update hourly stats
    PERFORM update_alert_stats(
        DATE(NEW.created_at),
        EXTRACT(HOUR FROM NEW.created_at)::INTEGER,
        NEW.adset_id,
        NEW.campaign_id,
        NEW.alert_type,
        NEW.severity
    );
    
    -- Update daily stats (hour_period = NULL)
    PERFORM update_alert_stats(
        DATE(NEW.created_at),
        NULL,
        NEW.adset_id,
        NEW.campaign_id,
        NEW.alert_type,
        NEW.severity
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_alerts_update_stats
    AFTER INSERT ON alerts
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_alert_stats();

-- Insert default alert rules
INSERT INTO alert_rules (name, description, alert_type, severity, thresholds, notification_channels) VALUES
('Desvio de Meta Crítico', 'Alerta quando meta está com desvio > 30%', 'goal_deviation', 'critical', 
 '{"deviation_threshold": 30, "min_days_elapsed": 3}', ARRAY['email', 'dashboard']),
 
('Desvio de Meta Atenção', 'Alerta quando meta está com desvio > 15%', 'goal_deviation', 'warning', 
 '{"deviation_threshold": 15, "min_days_elapsed": 2}', ARRAY['dashboard']),
 
('CPL Elevado Crítico', 'Alerta quando CPL > 50% da meta', 'high_cpl', 'critical', 
 '{"cpl_threshold_percentage": 50, "min_leads": 5}', ARRAY['email', 'dashboard']),
 
('CPL Elevado Atenção', 'Alerta quando CPL > 20% da meta', 'high_cpl', 'warning', 
 '{"cpl_threshold_percentage": 20, "min_leads": 3}', ARRAY['dashboard']),
 
('Budget Esgotando', 'Alerta quando budget > 90% usado mas meta < 70%', 'budget_depletion', 'warning', 
 '{"budget_used_threshold": 90, "goal_progress_threshold": 70}', ARRAY['email', 'dashboard']);

-- Add comments
COMMENT ON TABLE alert_rules IS 'Regras configuráveis para geração de alertas';
COMMENT ON TABLE alerts IS 'Alertas gerados pelo sistema de monitoramento';
COMMENT ON TABLE alert_notifications IS 'Histórico de notificações enviadas';
COMMENT ON TABLE alert_stats IS 'Estatísticas agregadas de alertas por período';

-- Grant permissions (adjust according to your RLS policies)
-- ALTER TABLE alert_rules ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE alert_notifications ENABLE ROW LEVEL SECURITY;


-- ============================================
-- Migration 16: 20250122_create_audience_suggestions_logs.sql
-- ============================================

-- Migration: Create audience_suggestions_logs table for PBI 25 - Task 25-6
-- Created: 2025-01-22
-- Purpose: Store logs of audience optimization suggestions for adsets/campaigns

CREATE TABLE audience_suggestions_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  adset_id VARCHAR,
  campaign_id VARCHAR,
  type VARCHAR(16) NOT NULL, -- ajuste, exclusao, expansao, reducao
  segment VARCHAR(128),
  suggestion TEXT NOT NULL,
  justification TEXT,
  impact VARCHAR(32), -- ex: '+15% leads', '-10% CPL'
  status VARCHAR(16) NOT NULL DEFAULT 'pendente', -- pendente, aceita, rejeitada
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audience_suggestions_adset_id ON audience_suggestions_logs(adset_id);
CREATE INDEX idx_audience_suggestions_campaign_id ON audience_suggestions_logs(campaign_id);
CREATE INDEX idx_audience_suggestions_status ON audience_suggestions_logs(status);

COMMENT ON TABLE audience_suggestions_logs IS 'Logs of audience optimization suggestions for adsets/campaigns.';
COMMENT ON COLUMN audience_suggestions_logs.type IS 'ajuste, exclusao, expansao, reducao';
COMMENT ON COLUMN audience_suggestions_logs.status IS 'pendente, aceita, rejeitada';


-- ============================================
-- Migration 17: 20250122_create_budget_adjustment_logs.sql
-- ============================================

-- Migration: Create budget_adjustment_logs table
-- PBI 25 - Task 25-8: Sistema de Logs e Controle de Ajustes
-- Created: 2025-01-22

-- Create budget_adjustment_logs table
CREATE TABLE IF NOT EXISTS budget_adjustment_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identificação do adset
    adset_id TEXT NOT NULL,
    campaign_id TEXT,
    
    -- Dados do ajuste
    old_budget DECIMAL(10,2) NOT NULL,
    new_budget DECIMAL(10,2) NOT NULL,
    adjustment_amount DECIMAL(10,2) NOT NULL, -- new_budget - old_budget
    adjustment_percentage DECIMAL(5,2) NOT NULL, -- percentual de mudança
    
    -- Motivo e contexto
    reason TEXT NOT NULL, -- motivo do ajuste (automático/manual)
    trigger_type TEXT NOT NULL, -- 'automatic', 'manual', 'api'
    context JSONB, -- dados adicionais sobre o contexto
    
    -- Auditoria
    user_id TEXT,
    applied_by TEXT, -- sistema/usuário que aplicou
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    applied_at TIMESTAMP WITH TIME ZONE,
    
    -- Status
    status TEXT DEFAULT 'pending', -- 'pending', 'applied', 'failed', 'cancelled'
    error_message TEXT,
    
    -- Metadados
    meta_response JSONB, -- resposta da API Meta (se aplicável)
    
    -- Constraints
    CONSTRAINT budget_adjustment_logs_adjustment_percentage_check 
        CHECK (adjustment_percentage >= -100 AND adjustment_percentage <= 100),
    CONSTRAINT budget_adjustment_logs_status_check 
        CHECK (status IN ('pending', 'applied', 'failed', 'cancelled')),
    CONSTRAINT budget_adjustment_logs_trigger_type_check 
        CHECK (trigger_type IN ('automatic', 'manual', 'api'))
);

-- Create indexes for fast queries
CREATE INDEX idx_budget_adjustment_logs_adset_id ON budget_adjustment_logs(adset_id);
CREATE INDEX idx_budget_adjustment_logs_campaign_id ON budget_adjustment_logs(campaign_id);
CREATE INDEX idx_budget_adjustment_logs_created_at ON budget_adjustment_logs(created_at);
CREATE INDEX idx_budget_adjustment_logs_applied_at ON budget_adjustment_logs(applied_at);
CREATE INDEX idx_budget_adjustment_logs_status ON budget_adjustment_logs(status);
CREATE INDEX idx_budget_adjustment_logs_trigger_type ON budget_adjustment_logs(trigger_type);

-- Composite index for frequency control (adset + last hour)
CREATE INDEX idx_budget_adjustment_logs_frequency_control 
ON budget_adjustment_logs(adset_id, created_at) 
WHERE status = 'applied';

-- Index for user audit queries
CREATE INDEX idx_budget_adjustment_logs_user_audit 
ON budget_adjustment_logs(user_id, created_at);

-- Add comments
COMMENT ON TABLE budget_adjustment_logs IS 'Log de todos os ajustes de budget com controle de frequência';
COMMENT ON COLUMN budget_adjustment_logs.adjustment_percentage IS 'Percentual de mudança do budget (positivo = aumento, negativo = redução)';
COMMENT ON COLUMN budget_adjustment_logs.trigger_type IS 'Tipo de trigger: automatic (sistema), manual (usuário), api (externa)';
COMMENT ON COLUMN budget_adjustment_logs.context IS 'Dados JSON com contexto do ajuste (métricas, alertas, etc)';
COMMENT ON COLUMN budget_adjustment_logs.meta_response IS 'Resposta completa da Meta API quando ajuste é aplicado';

-- Create function to validate adjustment frequency (max 4 per hour)
CREATE OR REPLACE FUNCTION validate_budget_adjustment_frequency(
    p_adset_id TEXT,
    p_exclude_log_id UUID DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    adjustment_count INTEGER;
BEGIN
    -- Count adjustments in the last hour for this adset
    SELECT COUNT(*)
    INTO adjustment_count
    FROM budget_adjustment_logs
    WHERE adset_id = p_adset_id
      AND status = 'applied'
      AND created_at >= NOW() - INTERVAL '1 hour'
      AND (p_exclude_log_id IS NULL OR id != p_exclude_log_id);
    
    -- Return true if less than 4 adjustments
    RETURN adjustment_count < 4;
END;
$$ LANGUAGE plpgsql;

-- Create function to get adjustment stats for an adset
CREATE OR REPLACE FUNCTION get_budget_adjustment_stats(
    p_adset_id TEXT,
    p_period_hours INTEGER DEFAULT 24
) RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_adjustments', COUNT(*),
        'successful_adjustments', COUNT(*) FILTER (WHERE status = 'applied'),
        'failed_adjustments', COUNT(*) FILTER (WHERE status = 'failed'),
        'avg_adjustment_percentage', ROUND(AVG(adjustment_percentage), 2),
        'total_budget_change', SUM(adjustment_amount) FILTER (WHERE status = 'applied'),
        'last_adjustment', MAX(created_at) FILTER (WHERE status = 'applied'),
        'can_adjust_now', validate_budget_adjustment_frequency(p_adset_id)
    )
    INTO result
    FROM budget_adjustment_logs
    WHERE adset_id = p_adset_id
      AND created_at >= NOW() - INTERVAL '1 hour' * p_period_hours;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions (adjust according to your RLS policies)
-- ALTER TABLE budget_adjustment_logs ENABLE ROW LEVEL SECURITY;

-- Example RLS policy (uncomment and adjust as needed)
-- CREATE POLICY "budget_adjustment_logs_select_policy" ON budget_adjustment_logs
--     FOR SELECT USING (true); -- Adjust based on your auth system

-- CREATE POLICY "budget_adjustment_logs_insert_policy" ON budget_adjustment_logs
--     FOR INSERT WITH CHECK (true); -- Adjust based on your auth system


-- ============================================
-- Migration 18: 20250122_create_lead_quality_logs.sql
-- ============================================

-- Migration: Create lead_quality_logs table for PBI 25 - Task 25-5
-- Created: 2025-01-22
-- Purpose: Store logs of quality score changes and reasons for each lead

CREATE TABLE lead_quality_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id VARCHAR NOT NULL,
  adset_id VARCHAR,
  old_score NUMERIC(5,2),
  new_score NUMERIC(5,2),
  reason VARCHAR(32) NOT NULL,
  details TEXT,
  timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_lead_quality_logs_lead_id ON lead_quality_logs(lead_id);
CREATE INDEX idx_lead_quality_logs_adset_id ON lead_quality_logs(adset_id);
CREATE INDEX idx_lead_quality_logs_timestamp ON lead_quality_logs(timestamp);

COMMENT ON TABLE lead_quality_logs IS 'Logs of quality score changes and reasons for each lead.';
COMMENT ON COLUMN lead_quality_logs.reason IS 'Reason for score change (conversion, update, penalty, manual, etc)';


-- ============================================
-- Migration 19: 20250718_create_meta_activity_logs_table.sql
-- ============================================

-- Criação da tabela de logs de atividades da Meta
create table if not exists meta_activity_logs (
  id bigserial primary key,
  account_id text not null,
  event_type text not null,
  event_time timestamptz not null,
  object_id text,
  object_name text,
  value_old text,
  value_new text,
  application_id text,
  extra_data jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Índice para busca rápida por data
create index if not exists idx_meta_activity_logs_event_time on meta_activity_logs(event_time desc);
create index if not exists idx_meta_activity_logs_account_id on meta_activity_logs(account_id);


-- ============================================
-- Migration 20: 20250129_create_ad_creatives_table.sql
-- ============================================

-- Criar tabela para dados de criativos de anúncios
CREATE TABLE IF NOT EXISTS ad_creatives (
    id SERIAL PRIMARY KEY,
    ad_id VARCHAR(255) NOT NULL UNIQUE,
    creative_id VARCHAR(255),
    title TEXT,
    body TEXT,
    image_url TEXT,
    image_hash VARCHAR(255),
    thumbnail_url TEXT,
    video_url TEXT,
    slideshow_data JSONB,
    object_story_spec JSONB,
    call_to_action_type VARCHAR(100),
    instagram_permalink_url TEXT,
    effective_instagram_media_id VARCHAR(255),
    raw_creative_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_ad_creatives_ad_id ON ad_creatives(ad_id);
CREATE INDEX IF NOT EXISTS idx_ad_creatives_creative_id ON ad_creatives(creative_id);

-- Adicionar comentários
COMMENT ON TABLE ad_creatives IS 'Dados de criativos de anúncios extraídos da Meta API';
COMMENT ON COLUMN ad_creatives.ad_id IS 'ID do anúncio (chave estrangeira para ads.ad_id)';
COMMENT ON COLUMN ad_creatives.raw_creative_data IS 'Dados brutos do criativo da Meta API';
COMMENT ON COLUMN ad_creatives.object_story_spec IS 'Especificações do story do objeto (link_data, etc)';

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_ad_creatives_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER trigger_update_ad_creatives_updated_at
    BEFORE UPDATE ON ad_creatives
    FOR EACH ROW
    EXECUTE FUNCTION update_ad_creatives_updated_at();


-- ============================================
-- Migration 21: 20250625_add_campaigns_columns.sql
-- ============================================

-- Adicionar colunas necessárias à tabela campaigns existente
ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS created_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS updated_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS objective VARCHAR(100),
ADD COLUMN IF NOT EXISTS special_ad_categories JSONB,
ADD COLUMN IF NOT EXISTS special_ad_category_country JSONB,
ADD COLUMN IF NOT EXISTS start_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS stop_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS daily_budget INTEGER,
ADD COLUMN IF NOT EXISTS lifetime_budget INTEGER,
ADD COLUMN IF NOT EXISTS budget_remaining INTEGER,
ADD COLUMN IF NOT EXISTS spend_cap INTEGER;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_effective_status ON campaigns(effective_status);
CREATE INDEX IF NOT EXISTS idx_campaigns_created_time ON campaigns(created_time);
CREATE INDEX IF NOT EXISTS idx_campaigns_updated_time ON campaigns(updated_time);


-- ============================================
-- Migration 22: 20250626_add_account_id_to_adset_insights.sql
-- ============================================

ALTER TABLE adset_insights ADD COLUMN account_id text;
-- Permitir nulo para compatibilidade retroativa


-- ============================================
-- Migration 23: 20250626_add_adset_name_to_insights.sql
-- ============================================

-- Adicionar coluna adset_name à tabela adset_insights
ALTER TABLE adset_insights 
ADD COLUMN IF NOT EXISTS adset_name TEXT;

-- Criar índice para otimizar consultas por nome
CREATE INDEX IF NOT EXISTS idx_adset_insights_name ON adset_insights(adset_name);

-- Comentário para documentação
COMMENT ON COLUMN adset_insights.adset_name IS 'Nome do adset para facilitar consultas e exibição';


-- ============================================
-- Migration 24: 20250626_recreate_adset_insights_columns.sql
-- ============================================

ALTER TABLE adset_insights
  ADD COLUMN IF NOT EXISTS id text,
  ADD COLUMN IF NOT EXISTS adset_id text,
  ADD COLUMN IF NOT EXISTS date date,
  ADD COLUMN IF NOT EXISTS spend numeric,
  ADD COLUMN IF NOT EXISTS impressions integer,
  ADD COLUMN IF NOT EXISTS clicks integer,
  ADD COLUMN IF NOT EXISTS ctr numeric,
  ADD COLUMN IF NOT EXISTS cpc numeric,
  ADD COLUMN IF NOT EXISTS cpm numeric,
  ADD COLUMN IF NOT EXISTS leads integer,
  ADD COLUMN IF NOT EXISTS reach integer,
  ADD COLUMN IF NOT EXISTS frequency numeric,
  ADD COLUMN IF NOT EXISTS unique_clicks integer,
  ADD COLUMN IF NOT EXISTS unique_ctr numeric,
  ADD COLUMN IF NOT EXISTS unique_link_clicks integer,
  ADD COLUMN IF NOT EXISTS unique_link_clicks_ctr numeric,
  ADD COLUMN IF NOT EXISTS social_spend numeric,
  ADD COLUMN IF NOT EXISTS social_impressions integer,
  ADD COLUMN IF NOT EXISTS social_clicks integer,
  ADD COLUMN IF NOT EXISTS social_reach integer,
  ADD COLUMN IF NOT EXISTS social_frequency numeric,
  ADD COLUMN IF NOT EXISTS social_unique_clicks integer,
  ADD COLUMN IF NOT EXISTS social_unique_link_clicks integer,
  ADD COLUMN IF NOT EXISTS created_at timestamptz,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz,
  ADD COLUMN IF NOT EXISTS adset_name text,
  ADD COLUMN IF NOT EXISTS account_id text,
  ADD COLUMN IF NOT EXISTS campaign_id text,
  ADD COLUMN IF NOT EXISTS status text;


-- ============================================
-- Migration 25: 20250629_add_cpl_to_adset_insights.sql
-- ============================================

-- Adicionar coluna CPL (Cost Per Lead) à tabela adset_insights
-- Esta coluna é fundamental para análises de performance e detecção de anomalias

ALTER TABLE adset_insights 
ADD COLUMN IF NOT EXISTS cpl DECIMAL(10,4);

-- Atualizar registros existentes calculando CPL = spend / leads
-- Apenas quando leads > 0 para evitar divisão por zero
UPDATE adset_insights 
SET cpl = CASE 
    WHEN leads > 0 THEN spend / leads 
    ELSE NULL 
END
WHERE cpl IS NULL;

-- Criar índice para otimizar consultas por CPL
CREATE INDEX IF NOT EXISTS idx_adset_insights_cpl ON adset_insights(cpl);

-- Adicionar comentário explicativo
COMMENT ON COLUMN adset_insights.cpl IS 'Cost Per Lead - Custo por lead gerado (spend / leads)';


-- ============================================
-- Migration 26: 20250122_add_quality_score_to_leads.sql
-- ============================================

-- Migration: Add quality_score to meta_leads table for PBI 25 - Task 25-5
-- Created: 2025-01-22
-- Purpose: Store quality score (0-100) for each lead

ALTER TABLE meta_leads
ADD COLUMN IF NOT EXISTS quality_score NUMERIC(5,2);

COMMENT ON COLUMN meta_leads.quality_score IS 'Quality score (0-100) for each lead, calculated by scoring system.';


-- ============================================
-- Migration 27: 20250627_create_exec_sql_function.sql
-- ============================================

-- Criar função para executar SQL dinâmico
-- Esta função permite executar queries SQL complexas via RPC
CREATE OR REPLACE FUNCTION exec_sql(sql text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result json;
BEGIN
    EXECUTE 'SELECT json_agg(t) FROM (' || sql || ') t' INTO result;
    RETURN COALESCE(result, '[]'::json);
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Erro na execução do SQL: %', SQLERRM;
END;
$$;

-- Dar permissão para executar a função
GRANT EXECUTE ON FUNCTION exec_sql(text) TO authenticated;
GRANT EXECUTE ON FUNCTION exec_sql(text) TO service_role;


-- ============================================
-- Migration 28: 20250130_fix_function_search_paths.sql
-- ============================================

-- Migration: Fix function search paths for security
-- Created: 2025-01-30
-- Purpose: Fix security warnings about mutable search_path in functions

-- Fix update_adset_goals_updated_at function
CREATE OR REPLACE FUNCTION public.update_adset_goals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix update_ad_creatives_updated_at function
CREATE OR REPLACE FUNCTION public.update_ad_creatives_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix trigger_update_alert_stats function
CREATE OR REPLACE FUNCTION public.trigger_update_alert_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Update hourly stats
    PERFORM update_alert_stats(
        DATE(NEW.created_at),
        EXTRACT(HOUR FROM NEW.created_at)::INTEGER,
        NEW.adset_id,
        NEW.campaign_id,
        NEW.alert_type,
        NEW.severity
    );
    
    -- Update daily stats (hour_period = NULL)
    PERFORM update_alert_stats(
        DATE(NEW.created_at),
        NULL,
        NEW.adset_id,
        NEW.campaign_id,
        NEW.alert_type,
        NEW.severity
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix validate_budget_adjustment_frequency function
CREATE OR REPLACE FUNCTION public.validate_budget_adjustment_frequency(
    p_adset_id TEXT,
    p_exclude_log_id UUID DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    adjustment_count INTEGER;
BEGIN
    -- Count adjustments in the last hour for this adset
    SELECT COUNT(*)
    INTO adjustment_count
    FROM budget_adjustment_logs
    WHERE adset_id = p_adset_id
      AND status = 'applied'
      AND created_at >= NOW() - INTERVAL '1 hour'
      AND (p_exclude_log_id IS NULL OR id != p_exclude_log_id);
    
    -- Return true if less than 4 adjustments
    RETURN adjustment_count < 4;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix get_budget_adjustment_stats function
CREATE OR REPLACE FUNCTION public.get_budget_adjustment_stats(
    p_adset_id TEXT,
    p_period_hours INTEGER DEFAULT 24
) RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_adjustments', COUNT(*),
        'successful_adjustments', COUNT(*) FILTER (WHERE status = 'applied'),
        'failed_adjustments', COUNT(*) FILTER (WHERE status = 'failed'),
        'avg_adjustment_percentage', ROUND(AVG(adjustment_percentage), 2),
        'total_budget_change', SUM(adjustment_amount) FILTER (WHERE status = 'applied'),
        'last_adjustment', MAX(created_at) FILTER (WHERE status = 'applied'),
        'can_adjust_now', validate_budget_adjustment_frequency(p_adset_id)
    )
    INTO result
    FROM budget_adjustment_logs
    WHERE adset_id = p_adset_id
      AND created_at >= NOW() - INTERVAL '1 hour' * p_period_hours;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix should_suppress_alert function
CREATE OR REPLACE FUNCTION public.should_suppress_alert(
    p_rule_id UUID,
    p_adset_id TEXT,
    p_alert_type TEXT
) RETURNS BOOLEAN AS $$
DECLARE
    rule_cooldown INTEGER;
    last_alert_time TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Get rule cooldown
    SELECT cooldown_minutes INTO rule_cooldown
    FROM alert_rules 
    WHERE id = p_rule_id;
    
    IF rule_cooldown IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Get last alert of same type for same adset
    SELECT MAX(created_at) INTO last_alert_time
    FROM alerts
    WHERE rule_id = p_rule_id 
      AND adset_id = p_adset_id 
      AND alert_type = p_alert_type
      AND status IN ('active', 'acknowledged');
    
    -- If no previous alert, don't suppress
    IF last_alert_time IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Suppress if within cooldown period
    RETURN (NOW() - last_alert_time) < (rule_cooldown || ' minutes')::INTERVAL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix get_active_alerts_for_adset function
CREATE OR REPLACE FUNCTION public.get_active_alerts_for_adset(
    p_adset_id TEXT,
    p_severity TEXT DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_agg(
        json_build_object(
            'id', id,
            'alert_type', alert_type,
            'severity', severity,
            'title', title,
            'message', message,
            'context', context,
            'suggested_actions', suggested_actions,
            'created_at', created_at,
            'snoozed_until', snoozed_until
        )
    )
    INTO result
    FROM alerts
    WHERE adset_id = p_adset_id
      AND status IN ('active', 'snoozed')
      AND (p_severity IS NULL OR severity = p_severity)
      AND (snoozed_until IS NULL OR snoozed_until < NOW())
    ORDER BY 
        CASE severity 
            WHEN 'critical' THEN 1 
            WHEN 'warning' THEN 2 
            WHEN 'info' THEN 3 
        END,
        created_at DESC;
    
    RETURN COALESCE(result, '[]'::JSON);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix update_alert_stats function
CREATE OR REPLACE FUNCTION public.update_alert_stats(
    p_date DATE,
    p_hour INTEGER,
    p_adset_id TEXT,
    p_campaign_id TEXT,
    p_alert_type TEXT,
    p_severity TEXT
) RETURNS VOID AS $$
BEGIN
    INSERT INTO alert_stats (
        date_period, hour_period, adset_id, campaign_id, alert_type,
        total_alerts,
        critical_alerts,
        warning_alerts,
        info_alerts
    )
    VALUES (
        p_date, p_hour, p_adset_id, p_campaign_id, p_alert_type,
        1,
        CASE WHEN p_severity = 'critical' THEN 1 ELSE 0 END,
        CASE WHEN p_severity = 'warning' THEN 1 ELSE 0 END,
        CASE WHEN p_severity = 'info' THEN 1 ELSE 0 END
    )
    ON CONFLICT (date_period, hour_period, adset_id, campaign_id, alert_type)
    DO UPDATE SET
        total_alerts = alert_stats.total_alerts + 1,
        critical_alerts = alert_stats.critical_alerts + 
            CASE WHEN p_severity = 'critical' THEN 1 ELSE 0 END,
        warning_alerts = alert_stats.warning_alerts + 
            CASE WHEN p_severity = 'warning' THEN 1 ELSE 0 END,
        info_alerts = alert_stats.info_alerts + 
            CASE WHEN p_severity = 'info' THEN 1 ELSE 0 END,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix update_cache_stats_updated_at function
CREATE OR REPLACE FUNCTION public.update_cache_stats_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Comments for documentation
COMMENT ON FUNCTION public.update_adset_goals_updated_at() IS 'Trigger function to update updated_at timestamp for adset_goals table';
COMMENT ON FUNCTION public.update_ad_creatives_updated_at() IS 'Trigger function to update updated_at timestamp for ad_creatives table';
COMMENT ON FUNCTION public.trigger_update_alert_stats() IS 'Trigger function to update alert statistics when new alerts are created';
COMMENT ON FUNCTION public.validate_budget_adjustment_frequency(TEXT, UUID) IS 'Validates if budget adjustment frequency limit is respected (max 4 per hour)';
COMMENT ON FUNCTION public.get_budget_adjustment_stats(TEXT, INTEGER) IS 'Returns budget adjustment statistics for an adset over a specified period';
COMMENT ON FUNCTION public.should_suppress_alert(UUID, TEXT, TEXT) IS 'Checks if alert should be suppressed due to cooldown period';
COMMENT ON FUNCTION public.get_active_alerts_for_adset(TEXT, TEXT) IS 'Returns active alerts for an adset with optional severity filter';
COMMENT ON FUNCTION public.update_alert_stats(DATE, INTEGER, TEXT, TEXT, TEXT, TEXT) IS 'Updates alert statistics for a given period and adset';
COMMENT ON FUNCTION public.update_cache_stats_updated_at() IS 'Trigger function to update updated_at timestamp for cache_stats table';


-- ============================================
-- Migration 29: 20240516_clean_duplicate_leads.sql
-- ============================================

-- Função para limpar leads duplicados
CREATE OR REPLACE FUNCTION clean_duplicate_leads()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Remove registros duplicados mantendo apenas o mais recente
  WITH duplicates AS (
    SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY created_time, ad_id
             ORDER BY created_at DESC
           ) as rn
    FROM meta_leads
  )
  DELETE FROM meta_leads
  WHERE id IN (
    SELECT id FROM duplicates WHERE rn > 1
  );

  -- Log da operação
  INSERT INTO sync_logs (
    operation,
    status,
    details,
    created_at
  ) VALUES (
    'clean_duplicate_leads',
    'success',
    jsonb_build_object(
      'message', 'Limpeza de leads duplicados concluída',
      'timestamp', now()
    ),
    now()
  );
END;
$$;

-- Comentário na função
COMMENT ON FUNCTION clean_duplicate_leads IS 'Remove registros duplicados da tabela meta_leads mantendo apenas o registro mais recente para cada combinação de created_time e ad_id';

-- Tabela de logs de sincronização (se não existir)
CREATE TABLE IF NOT EXISTS sync_logs (
  id BIGSERIAL PRIMARY KEY,
  operation TEXT NOT NULL,
  status TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_sync_logs_operation ON sync_logs(operation);
CREATE INDEX IF NOT EXISTS idx_sync_logs_created_at ON sync_logs(created_at);

-- Comentários
COMMENT ON TABLE sync_logs IS 'Registra operações de sincronização e limpeza de dados';
COMMENT ON COLUMN sync_logs.operation IS 'Nome da operação executada';
COMMENT ON COLUMN sync_logs.status IS 'Status da operação (success/error)';
COMMENT ON COLUMN sync_logs.details IS 'Detalhes adicionais da operação em formato JSON';
COMMENT ON COLUMN sync_logs.created_at IS 'Data e hora da operação';


-- ============================================
-- Migration 30: 20250130_enable_rls_on_public_tables.sql
-- ============================================

-- Habilitar RLS nas tabelas públicas para resolver erros de segurança
-- Data: 2025-01-30

-- Habilitar RLS na tabela ad_creatives
ALTER TABLE public.ad_creatives ENABLE ROW LEVEL SECURITY;

-- Habilitar RLS na tabela meta_activity_logs
ALTER TABLE public.meta_activity_logs ENABLE ROW LEVEL SECURITY;

-- Habilitar RLS na tabela adset_goals
ALTER TABLE public.adset_goals ENABLE ROW LEVEL SECURITY;

-- Criar políticas de acesso para ad_creatives
-- Permitir leitura para todos os usuários autenticados
CREATE POLICY "Allow read access to ad_creatives" ON public.ad_creatives
    FOR SELECT USING (true);

-- Permitir inserção/atualização apenas para usuários autenticados
CREATE POLICY "Allow insert/update access to ad_creatives" ON public.ad_creatives
    FOR ALL USING (auth.role() = 'authenticated');

-- Criar políticas de acesso para meta_activity_logs
-- Permitir leitura para todos os usuários autenticados
CREATE POLICY "Allow read access to meta_activity_logs" ON public.meta_activity_logs
    FOR SELECT USING (true);

-- Permitir inserção apenas para usuários autenticados
CREATE POLICY "Allow insert access to meta_activity_logs" ON public.meta_activity_logs
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Criar políticas de acesso para adset_goals
-- Permitir leitura para todos os usuários autenticados
CREATE POLICY "Allow read access to adset_goals" ON public.adset_goals
    FOR SELECT USING (true);

-- Permitir inserção/atualização apenas para usuários autenticados
CREATE POLICY "Allow insert/update access to adset_goals" ON public.adset_goals
    FOR ALL USING (auth.role() = 'authenticated');

-- Comentários para documentação
COMMENT ON TABLE public.ad_creatives IS 'Dados de criativos de anúncios com RLS habilitado';
COMMENT ON TABLE public.meta_activity_logs IS 'Logs de atividade da Meta API com RLS habilitado';
COMMENT ON TABLE public.adset_goals IS 'Metas e objetivos dos adsets com RLS habilitado';


-- ============================================
-- FIM DO SCRIPT DE RECUPERAÇÃO
-- ============================================
-- Total de migrations executadas: 30
-- Data de geração: 2025-11-24T19:54:29.319Z
