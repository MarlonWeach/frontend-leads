-- 27-1 smoke: exige view public.v_ml_adset_daily_series (migração 20260420140000).
-- Auto-seleciona um adset_id com pelo menos 1 linha nos últimos 90 dias.

\set ON_ERROR_STOP on

\echo '--- 27-1 smoke: amostra de adset (90d) ---'
WITH sample AS (
  SELECT adset_id
  FROM public.v_ml_adset_daily_series
  WHERE metric_date >= (current_date - interval '90 days')::date
  GROUP BY adset_id
  HAVING count(*) >= 1
  ORDER BY count(*) DESC
  LIMIT 1
)
SELECT s.adset_id AS sample_adset_id
FROM sample s;

\echo '--- 27-1 smoke: agregados 90d (mesmo adset acima) ---'
WITH sample AS (
  SELECT adset_id
  FROM public.v_ml_adset_daily_series
  WHERE metric_date >= (current_date - interval '90 days')::date
  GROUP BY adset_id
  HAVING count(*) >= 1
  ORDER BY count(*) DESC
  LIMIT 1
)
SELECT
  v.adset_id,
  count(*) AS rows_90d,
  min(v.metric_date) AS d0,
  max(v.metric_date) AS d1,
  sum(v.leads) AS leads_sum,
  sum(v.spend) AS spend_sum
FROM public.v_ml_adset_daily_series v
JOIN sample s ON s.adset_id = v.adset_id
WHERE v.metric_date >= (current_date - interval '90 days')::date
  AND v.metric_date <= current_date
GROUP BY v.adset_id;

\echo '--- 27-1 smoke: esparsidade 90d (calendário vs linhas) ---'
WITH sample AS (
  SELECT adset_id
  FROM public.v_ml_adset_daily_series
  WHERE metric_date >= (current_date - interval '90 days')::date
  GROUP BY adset_id
  HAVING count(*) >= 1
  ORDER BY count(*) DESC
  LIMIT 1
)
SELECT
  v.adset_id,
  (current_date - (current_date - interval '90 days')::date) AS calendar_days_approx,
  count(*) AS row_days
FROM public.v_ml_adset_daily_series v
JOIN sample s ON s.adset_id = v.adset_id
WHERE v.metric_date >= (current_date - interval '90 days')::date
GROUP BY v.adset_id;

\echo '--- 27-1 smoke: opcional 365d (contagem) ---'
WITH sample AS (
  SELECT adset_id
  FROM public.v_ml_adset_daily_series
  WHERE metric_date >= (current_date - interval '90 days')::date
  GROUP BY adset_id
  HAVING count(*) >= 1
  ORDER BY count(*) DESC
  LIMIT 1
)
SELECT
  v.adset_id,
  count(*) AS rows_365d
FROM public.v_ml_adset_daily_series v
JOIN sample s ON s.adset_id = v.adset_id
WHERE v.metric_date >= (current_date - interval '365 days')::date
  AND v.metric_date <= current_date
GROUP BY v.adset_id;

\echo '--- 27-1 smoke concluído ---'
