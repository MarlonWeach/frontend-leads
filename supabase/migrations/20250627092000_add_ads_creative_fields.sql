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