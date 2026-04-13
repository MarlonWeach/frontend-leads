-- Compatibilidade: varios scripts usam ads.ad_id; a PK da Meta no projeto e ads.id.
-- Adiciona ad_id como espelho de id para PostgREST e consultas legadas.

ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS ad_id VARCHAR(255);

UPDATE public.ads SET ad_id = id WHERE ad_id IS NULL AND id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_ads_ad_id ON public.ads(ad_id);

CREATE OR REPLACE FUNCTION public.ads_sync_ad_id()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.ad_id IS NULL OR NEW.ad_id = '' THEN
    NEW.ad_id := NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ads_sync_ad_id ON public.ads;
CREATE TRIGGER trg_ads_sync_ad_id
  BEFORE INSERT OR UPDATE ON public.ads
  FOR EACH ROW
  EXECUTE FUNCTION public.ads_sync_ad_id();
