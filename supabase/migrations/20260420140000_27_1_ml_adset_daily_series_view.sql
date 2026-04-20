-- Task 27-1 (PBI 27): contrato de série temporal diária por adset para ML.
-- Decisão: fonte canônica = public.adset_insights (UNIQUE adset_id + date).
-- View estável para consumo pela 27-2; security_invoker = respeita RLS das tabelas base.

CREATE OR REPLACE VIEW public.v_ml_adset_daily_series AS
SELECT
  ai.adset_id,
  ai.date AS metric_date,
  ai.spend,
  ai.impressions,
  ai.clicks,
  ai.leads,
  ai.cpl,
  ai.ctr,
  ai.cpc,
  ai.cpm,
  ai.reach,
  ai.frequency,
  ai.adset_name,
  ai.campaign_id,
  ai.account_id,
  ai.status,
  ai.created_at,
  ai.updated_at
FROM public.adset_insights ai
WITH (security_invoker = true);

COMMENT ON VIEW public.v_ml_adset_daily_series IS
  'PBI 27 / 27-1: série diária por adset para treino/inferência (27-2). '
  'Grão (adset_id, metric_date) alinhado a adset_insights; dias sem linha = ausência de dado (esparso). '
  'Regra de negócio de calendário: America/Sao_Paulo (o campo date é civil; boundary do dia vem do pipeline que grava em adset_insights). '
  'Unidades: mesmas colunas da tabela base (ex.: spend/cpc/cpm conforme migrações históricas do projeto).';

COMMENT ON COLUMN public.v_ml_adset_daily_series.adset_id IS 'Identificador do adset (mesmo de adset_insights.adset_id).';
COMMENT ON COLUMN public.v_ml_adset_daily_series.metric_date IS 'Dia civil da métrica (DATE); chave temporal junto com adset_id.';
COMMENT ON COLUMN public.v_ml_adset_daily_series.leads IS 'Leads do dia; zeros explícitos só quando a origem gravou 0.';
COMMENT ON COLUMN public.v_ml_adset_daily_series.cpl IS 'CPL derivado na origem quando disponível; ver regra do dashboard.';

-- Consumo previsto: backend com service_role. Sem SELECT amplo para anon/authenticated.
REVOKE ALL ON public.v_ml_adset_daily_series FROM PUBLIC;
GRANT SELECT ON public.v_ml_adset_daily_series TO service_role;
