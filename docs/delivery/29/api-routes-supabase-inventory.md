# Inventário: rotas `app/api` e uso de Supabase (PBI 29)

**Data:** 2026-04-14  
**Escopo:** rotas que instanciam cliente Supabase ou `supabaseServer`; exclusões abaixo.

**Legenda de chave**

| Tipo | Comportamento |
|------|----------------|
| **service_role** | Ignora RLS; acesso total às tabelas (conforme GRANT). |
| **anon** | Respeita RLS (mas muitas tabelas do projeto **sem RLS** — ver assessment). |
| **service \| anon** | Usa service se env existir; senão cai em anon (ex.: dev sem service). |

**Autenticação nas rotas:** não foi encontrado padrão global (ex. `getServerSession` / Supabase Auth) nas rotas listadas; qualquer cliente que consiga chamar `/api/*` recebe a resposta (salvo proteção à frente — Vercel, middleware `middleware.ts`, etc.). Isto é **risco operacional** até existir login (já documentado em 29-1).

---

## 1. `supabaseServer` → sempre **service_role**

Ficheiro: [`src/lib/supabaseServer.ts`](../../../src/lib/supabaseServer.ts)

| Rota | Notas |
|------|--------|
| `/api/alerts` | GET/POST |
| `/api/goals` | GET/POST |
| `/api/goals/progress` | |
| `/api/goals/[adset_id]` | GET/PATCH/DELETE |
| `/api/goals/[adset_id]/alerts` | |
| `/api/goals/[adset_id]/progress` | |
| `/api/adset-goals/dashboard` | |
| `/api/budget-adjustments/stats` | |
| `/api/audience-suggestions/job` | |

---

## 2. `createClient` explícito — **service_role**

| Rota | Chave |
|------|--------|
| `/api/dashboard/overview` | `SUPABASE_SERVICE_ROLE_KEY` (sem `!`; se URL/chave ausentes em runtime, `createClient` pode falhar) |
| `/api/meta/adsets` | service_role |
| `/api/ai/billing` | service_role |
| `/api/ai/optimization` | service_role |
| `/api/ai/anomalies` | service_role |
| `/api/ai/chat` | service_role |
| `/api/sync/trigger` | service_role |
| `/api/sync/status` | service_role |

---

## 3. `createClient` — **anon** (chave pública)

| Rota | Risco / nota |
|------|----------------|
| `/api/meta/ads` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` — queries a ads/insights; sem RLS nas tabelas sensíveis o anon pode expor dados. |
| `/api/dashboard/search` | anon — pesquisa ads + meta_leads. |
| `/api/dashboard/performance` | anon — lista ads ativos. |

---

## 4. `createClient` — **service_role \| anon** (fallback)

Se `SUPABASE_SERVICE_ROLE_KEY` ausente no ambiente, usa **anon** (comportamento mais fraco / RLS onde existir).

| Rota |
|------|
| `/api/performance` |
| `/api/performance/comparisons` |
| `/api/performance/forecast` |
| `/api/meta/activity` |

**Recomendação:** em produção (Vercel) garantir sempre `SUPABASE_SERVICE_ROLE_KEY` definida para estas rotas, para não degradar silenciosamente para anon.

---

## 5. Indireto — **`src/lib/supabaseClient`** (anon)

Vários serviços importam [`src/lib/supabaseClient.js`](../../../src/lib/supabaseClient.js) (`NEXT_PUBLIC_SUPABASE_ANON_KEY`). Apesar de `'use client'` no ficheiro, estes serviços são chamados a partir de **rotas API** (servidor): o cliente criado continua a ser **anon**.

| Rota | Serviço / cadena |
|------|-------------------|
| `/api/goals/calculate` | `LeadsCalculationService` |
| `/api/goals/[adset_id]/calculations` | `LeadsCalculationService` |
| `/api/audience-suggestions` | `audienceSuggestionService` |
| `/api/audience-suggestions/[suggestion_id]/status` | `audienceSuggestionService` |
| `/api/leads/[lead_id]/quality` | `leadQualityService` |
| `/api/leads/quality/report` | `leadQualityService` |
| `/api/leads/[lead_id]/quality/recalculate` | `leadQualityService` |
| `/api/budget-adjustments/apply` | `budgetAdjustmentEngine` → `budgetAdjustmentLogService` |
| `/api/budget-adjustments/batch` | idem |
| `/api/budget-adjustments/validate` | `budgetAdjustmentLogService` |
| `/api/goals/[adset_id]/budget/adjust` | `budgetAdjustmentService` |

---

## 5b. Indireto — **anon** em [`src/lib/ai/logger.ts`](../../../src/lib/ai/logger.ts)

`logAIUsage` usa `createClient` com `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Rotas que registam uso de IA disparam escritos em `ai_analysis_logs` (ou tabelas afins) como **anon**.

| Rota | Nota |
|------|------|
| `/api/ai/analyze` | Chama `logAIUsage` / logger |

---

## 5c. Sem Supabase (ou não DB)

| Rota | Nota |
|------|------|
| `/api/ai/test-connection` | Apenas OpenAI / Anthropic / AIService |
| `/api/goals/progress/trigger` | `exec` em `scripts/adset-progress-tracking.js` (o script pode usar env próprio) |
| `/api/dashboard/cache/invalidate` | Cache em memória (`src/utils/cache`) |
| `/api/dashboard/cache/stats` | idem |
| `/api/cache-stats` | Dados mock em memória no handler |

---

## 6. Índice rápido — todas as rotas `app/api` (41)

| Rota | Padrão Supabase |
|------|-----------------|
| `/api/alerts` | `supabaseServer` → service |
| `/api/adset-goals/dashboard` | `supabaseServer` → service |
| `/api/ai/analyze` | Indireto anon (logger) |
| `/api/ai/anomalies` | createClient service |
| `/api/ai/billing` | createClient service |
| `/api/ai/chat` | createClient service |
| `/api/ai/optimization` | createClient service |
| `/api/ai/test-connection` | Sem DB |
| `/api/audience-suggestions` | Indireto anon (`supabaseClient`) |
| `/api/audience-suggestions/job` | `supabaseServer` → service |
| `/api/audience-suggestions/[suggestion_id]/status` | Indireto anon |
| `/api/budget-adjustments/apply` | Indireto anon |
| `/api/budget-adjustments/batch` | Indireto anon |
| `/api/budget-adjustments/stats` | `supabaseServer` → service |
| `/api/budget-adjustments/validate` | Indireto anon |
| `/api/cache-stats` | Sem DB |
| `/api/dashboard/cache/invalidate` | Sem DB |
| `/api/dashboard/cache/stats` | Sem DB |
| `/api/dashboard/overview` | createClient service |
| `/api/dashboard/performance` | anon (ficheiro) |
| `/api/dashboard/search` | anon (ficheiro) |
| `/api/goals` | `supabaseServer` → service |
| `/api/goals/calculate` | Indireto anon |
| `/api/goals/progress` | `supabaseServer` → service |
| `/api/goals/progress/trigger` | Sem DB (script) |
| `/api/goals/[adset_id]` | `supabaseServer` → service |
| `/api/goals/[adset_id]/alerts` | `supabaseServer` → service |
| `/api/goals/[adset_id]/budget/adjust` | Indireto anon |
| `/api/goals/[adset_id]/calculations` | Indireto anon |
| `/api/goals/[adset_id]/progress` | `supabaseServer` → service |
| `/api/leads/[lead_id]/quality` | Indireto anon |
| `/api/leads/[lead_id]/quality/recalculate` | Indireto anon |
| `/api/leads/quality/report` | Indireto anon |
| `/api/meta/ads` | anon (ficheiro) |
| `/api/meta/adsets` | createClient service |
| `/api/meta/activity` | service \| anon (fallback) |
| `/api/performance` | service \| anon (fallback) |
| `/api/performance/comparisons` | service \| anon (fallback) |
| `/api/performance/forecast` | service \| anon (fallback) |
| `/api/sync/status` | createClient service |
| `/api/sync/trigger` | createClient service |

---

## 7. Conclusões para remediação (prioridade)

1. **Curto prazo:** manter `SUPABASE_SERVICE_ROLE_KEY` em Vercel (produção) em todas as rotas que hoje fazem fallback para anon; monitorar erros se anon não tiver permissão.
2. **Médio prazo:** **RLS** em `meta_leads`, `campaigns`, `ads`, etc., ou revogar privilégios `anon` nessas tabelas se o único acesso for API server com service role.
3. **Com login:** após Auth, filtrar por utilizador ou token interno nas rotas sensíveis; não depender só de “URL secreta”.
4. **Serviços server com `supabaseClient`:** migrar para `supabaseServer` (ou cliente com `SUPABASE_SERVICE_ROLE_KEY` só em API) onde a rota precisar de privilégios de escrita/leitura fiáveis; ou endurecer RLS + JWT.

---

[Back to 29-2](./29-2.md) · [PBI 29](./prd.md)
