-- PBI 34 bug fix: preserve existing browser-read data paths after RLS hardening.
-- The 34 security hardening added deny-by-default policies to tables that are still
-- read directly by client-side Supabase hooks. Restore SELECT only; writes remain denied.

DO $$
DECLARE
  target_table TEXT;
  browser_read_tables TEXT[] := ARRAY[
    'ad_insights',
    'adset_insights',
    'meta_leads'
  ];
BEGIN
  FOREACH target_table IN ARRAY browser_read_tables
  LOOP
    IF EXISTS (
      SELECT 1
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public'
        AND c.relname = target_table
        AND c.relkind = 'r'
    ) THEN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_policies p
        WHERE p.schemaname = 'public'
          AND p.tablename = target_table
          AND p.policyname = 'pbi34_allow_browser_read_anon'
      ) THEN
        EXECUTE format(
          'CREATE POLICY %I ON public.%I FOR SELECT TO anon USING (true)',
          'pbi34_allow_browser_read_anon',
          target_table
        );
      END IF;

      IF NOT EXISTS (
        SELECT 1
        FROM pg_policies p
        WHERE p.schemaname = 'public'
          AND p.tablename = target_table
          AND p.policyname = 'pbi34_allow_browser_read_authenticated'
      ) THEN
        EXECUTE format(
          'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (true)',
          'pbi34_allow_browser_read_authenticated',
          target_table
        );
      END IF;
    END IF;
  END LOOP;
END $$;
