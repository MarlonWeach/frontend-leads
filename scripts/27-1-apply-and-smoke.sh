#!/usr/bin/env bash
# 27-1: aplica a migração da view no Postgres informado e roda smoke SQL.
# Uso (na raiz do repo ou de qualquer pasta):
#   export DATABASE_URL='postgresql://...'   # connection string (pooler ou direto)
#   ./scripts/27-1-apply-and-smoke.sh
#
# Alternativa alinhada ao Supabase CLI (projeto linkado):
#   supabase db push
#   export DATABASE_URL='...'
#   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f scripts/27-1-smoke.sql

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "Erro: defina DATABASE_URL (string de conexão Postgres do Supabase) e execute de novo."
  echo "Ex.: export DATABASE_URL='postgresql://postgres.[ref]:[senha]@aws-0-[region].pooler.supabase.com:6543/postgres'"
  exit 1
fi

echo "==> Aplicando migração 20260420140000_27_1_ml_adset_daily_series_view.sql ..."
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/migrations/20260420140000_27_1_ml_adset_daily_series_view.sql

echo "==> Rodando scripts/27-1-smoke.sql ..."
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f scripts/27-1-smoke.sql

echo "==> Concluído. Marque os checkboxes em docs/delivery/27/27-1.md (Verification) se os resultados fizerem sentido."
