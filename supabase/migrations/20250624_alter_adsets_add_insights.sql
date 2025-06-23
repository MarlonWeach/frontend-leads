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