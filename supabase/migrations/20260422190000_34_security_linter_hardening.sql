-- PBI 34
-- 34-2: Corrigir function_search_path_mutable
-- 34-4: Mitigar RLS Enabled No Policy sem ampliar acesso

-- 34-2: garantir search_path imutável na função de trigger de cache_stats
CREATE OR REPLACE FUNCTION public.update_cache_stats_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.update_cache_stats_updated_at()
IS 'PBI 34: trigger com search_path explícito para evitar role-mutable search_path';

-- 34-4: para tabelas com RLS habilitado e sem policies, criar policies
-- explícitas de deny-by-default para anon/authenticated.
DO $$
DECLARE
  target_table TEXT;
  target_tables TEXT[] := ARRAY[
    'ad_insights',
    'adset_budget_adjustments',
    'adset_insights',
    'adset_progress_alerts',
    'adset_progress_tracking',
    'ai_analysis_logs',
    'ai_anomalies',
    'alert_notifications',
    'alert_rules',
    'alert_stats',
    'alerts',
    'audience_suggestions_logs',
    'audit_logs',
    'budget_adjustment_logs',
    'cache_stats',
    'lead_quality_logs',
    'meta_leads',
    'optimization_recommendation_decisions',
    'optimization_recommendations',
    'sync_logs',
    'wp_Configuracao',
    'wp_Cotacao',
    'wp_HistoricoIA',
    'wp_LogAlteracaoPreco',
    'wp_PrecoBase',
    'wp_Usuario'
  ];
BEGIN
  FOREACH target_table IN ARRAY target_tables
  LOOP
    IF EXISTS (
      SELECT 1
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public'
        AND c.relname = target_table
        AND c.relkind = 'r'
    ) THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', target_table);

      IF NOT EXISTS (
        SELECT 1
        FROM pg_policies p
        WHERE p.schemaname = 'public'
          AND p.tablename = target_table
      ) THEN
        EXECUTE format(
          'CREATE POLICY %I ON public.%I FOR ALL TO anon USING (false) WITH CHECK (false)',
          'pbi34_deny_all_anon',
          target_table
        );

        EXECUTE format(
          'CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (false) WITH CHECK (false)',
          'pbi34_deny_all_authenticated',
          target_table
        );
      END IF;
    END IF;
  END LOOP;
END $$;
