-- PBI 29 / segurança: RLS nas tabelas públicas (linter 0013), search_path em funções (0011),
-- e endurecimento de exec_sql (só service_role).

-- =============================================================================
-- 1) Funções: search_path fixo (Supabase linter 0011)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.ads_sync_ad_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.ad_id IS NULL OR NEW.ad_id = '' THEN
    NEW.ad_id := NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_ad_insights_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_ads_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_adset_insights_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_ai_anomalies_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.clean_duplicate_leads()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  WITH duplicates AS (
    SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY created_time, ad_id
             ORDER BY created_at DESC
           ) AS rn
    FROM meta_leads
  )
  DELETE FROM meta_leads
  WHERE id IN (
    SELECT id FROM duplicates WHERE rn > 1
  );

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

-- exec_sql: apenas service_role; search_path fixo (evita hijack + uso acidental via PostgREST)
CREATE OR REPLACE FUNCTION public.exec_sql(sql text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
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

REVOKE ALL ON FUNCTION public.exec_sql(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.exec_sql(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.exec_sql(text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO service_role;

COMMENT ON FUNCTION public.exec_sql(text) IS 'Uso restrito a service_role / backend. Não expor a anon ou authenticated.';

-- =============================================================================
-- 2) Row Level Security (linter 0013) — só em tabelas que existem
--    Projetos restaurados podem não ter tabelas legado wp_*; não falhar.
-- =============================================================================

DO $rls$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT c.relname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'r'
      AND c.relname = ANY (
        ARRAY[
          'ad_insights',
          'adset_budget_adjustments',
          'adset_progress_alerts',
          'adset_progress_tracking',
          'adsets',
          'alert_notifications',
          'alerts',
          'alert_rules',
          'alert_stats',
          'audience_suggestions_logs',
          'audit_logs',
          'cache_stats',
          'budget_adjustment_logs',
          'campaigns',
          'ads',
          'adset_insights',
          'ai_analysis_logs',
          'ai_anomalies',
          'lead_quality_logs',
          'meta_leads',
          'sync_logs',
          'wp_Configuracao',
          'wp_Cotacao',
          'wp_HistoricoIA',
          'wp_LogAlteracaoPreco',
          'wp_PrecoBase',
          'wp_Usuario',
          'wp_configuracao',
          'wp_cotacao',
          'wp_historicoia',
          'wp_logalteracaopreco',
          'wp_precobase',
          'wp_usuario'
        ]::text[]
      )
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', r.relname);
  END LOOP;
END
$rls$;

-- =============================================================================
-- 3) Políticas: leitura (anon) só em campaigns / adsets / ads se as tabelas existirem
-- =============================================================================

DO $pol$
BEGIN
  IF to_regclass('public.campaigns') IS NOT NULL THEN
    DROP POLICY IF EXISTS "dashboard_select_campaigns" ON public.campaigns;
    CREATE POLICY "dashboard_select_campaigns" ON public.campaigns
      FOR SELECT
      USING (true);
  END IF;

  IF to_regclass('public.adsets') IS NOT NULL THEN
    DROP POLICY IF EXISTS "dashboard_select_adsets" ON public.adsets;
    CREATE POLICY "dashboard_select_adsets" ON public.adsets
      FOR SELECT
      USING (true);
  END IF;

  IF to_regclass('public.ads') IS NOT NULL THEN
    DROP POLICY IF EXISTS "dashboard_select_ads" ON public.ads;
    CREATE POLICY "dashboard_select_ads" ON public.ads
      FOR SELECT
      USING (true);
  END IF;
END
$pol$;
