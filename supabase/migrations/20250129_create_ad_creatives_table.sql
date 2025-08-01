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