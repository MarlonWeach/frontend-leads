-- Legado: a view public.leads_analysis não é mais criada (conteúdo original foi removido).
-- Mantemos esta migração como no-op para não quebrar `supabase db push` quando o remoto
-- aplica o histórico a partir do zero (COMMENT ON VIEW falhava se a view não existisse).

SELECT 1;
