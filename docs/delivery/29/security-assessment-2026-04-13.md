# Avaliação de segurança (rascunho) — PBI 29

**Data:** 2026-04-13  
**Escopo:** repositório + migrations Supabase (painel do projeto novo deve ser validado manualmente).  
**Próxima revisão:** após checagem no dashboard Supabase (Network, Auth, Database).

Legenda: **C** crítico · **A** alto · **M** médio · **B** baixo

---

## 1. Supabase — banco e RLS

| ID | Severidade | Achado | Evidência / risco | Ação recomendada |
|----|------------|--------|-------------------|------------------|
| S1 | **A** | **Confirmado (SQL):** `ad_creatives`, `meta_activity_logs`, `adset_goals` — SELECT com `qual = true` para role `public`. | Qualquer sessão que use PostgREST com RLS aplicável pode **ler todas as linhas** dessas tabelas (incl. `anon` se a política public permitir). INSERT em `meta_activity_logs` sem `qual` visível na view (revisar `with_check` no catálogo se necessário). | Restringir SELECT (ex.: só `service_role` / sem acesso anon) ou escopo por `auth.uid()`; evitar dados sensíveis só protegidos por essas políticas. |
| S2 | **A** | **Confirmado:** `sync_status` — "Permitir leitura para todos", `qual = true`; UPDATE só `service_role` (nota: cliente com **service_role** ignora RLS de qualquer forma). | Estado de sincronização visível a quem tiver SELECT conforme GRANT+RLS. | Se não precisar no browser, revogar SELECT ao `anon` ou política mais restrita. |
| S3 | **A** | **Confirmado (SQL 2026-04-13):** 27 tabelas com `relrowsecurity = false`, incluindo `meta_leads`, `campaigns`, `ads`, `adsets`, `ad_insights`, `adset_insights`, alertas, auditoria, etc. | Sem RLS, o controle de acesso no PostgREST depende só de **GRANT** às roles `anon`/`authenticated`. No Supabase isso costuma ser permissivo se nunca revogaram privilégios. **Risco alto** de leitura/escrita via chave **anon** no front, se alguém chamar o REST direto. | Auditar `information_schema.role_table_grants` ou Supabase “Table editor” → permissões; habilitar RLS + políticas por tabela sensível ou revogar acesso `anon` e obrigar só APIs server-side com service role. |
| S4 | **M** | `budget_adjustment_logs`, sistema de alerts | RLS comentado / não habilitado nos SQLs | Habilitar RLS e políticas ao adotar essas features em produção. |
| S5 | **B** | Nomenclatura `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` em scripts | Vários `scripts/*.js` | Garantir que **nunca** seja referenciada em código `use client` ou bundles. Preferir só `SUPABASE_SERVICE_ROLE_KEY` server-side. Auditar `next build` / bundle. |

### Inventário SQL no projeto (2026-04-13)

**`relrowsecurity = false` (27 tabelas):**  
`ad_insights`, `ads`, `adset_budget_adjustments`, `adset_insights`, `adset_progress_alerts`, `adset_progress_tracking`, `adsets`, `ai_analysis_logs`, `ai_anomalies`, `alert_notifications`, `alert_rules`, `alert_stats`, `alerts`, `audience_suggestions_logs`, `audit_logs`, `budget_adjustment_logs`, `cache_stats`, `campaigns`, `lead_quality_logs`, `meta_leads`, `sync_logs`, `wp_Configuracao`, `wp_Cotacao`, `wp_HistoricoIA`, `wp_LogAlteracaoPreco`, `wp_PrecoBase`, `wp_Usuario`.

**`relrowsecurity = true` (4 tabelas):** `ad_creatives`, `adset_goals`, `meta_activity_logs`, `sync_status`.

**Obs.:** Tabelas `wp_*` — possível legado; avaliar segregação ou remoção.

---

## 2. Aplicação Next.js e APIs

| ID | Severidade | Achado | Evidência | Ação recomendada |
|----|------------|--------|-----------|------------------|
| A1 | **M** | Uso predominante de **service role** em rotas API | `app/api/**`: performance, dashboard, ai/*, sync/*, etc. | Service role **ignora RLS**. Aceitável se todas as rotas forem server-only e sem vazamento de chave. Revisar se alguma rota pode ser chamada sem autenticação de usuário e ainda assim expor dados sensíveis. |
| A2 | **M** | Fallback `SUPABASE_SERVICE_ROLE_KEY \|\| NEXT_PUBLIC_SUPABASE_ANON_KEY` em algumas rotas | Ex.: `app/api/performance/route.ts`, `comparisons`, `forecast`, `meta/activity` | Se cair no anon, RLS aplica — mas políticas fracas (S1) podem expor muito. Unificar estratégia: server só service role **ou** padrão com usuário JWT + RLS estrita. |
| A3 | **B** | Client `src/lib/supabaseClient.js` usa **anon** (`NEXT_PUBLIC_*`) | Esperado para uso no browser | Garantir que componentes client não consultem tabelas sensíveis sem políticas adequadas. |

---

## 3. CI/CD e segredos (revisão de processo)

| ID | Severidade | Achado | Ação recomendada |
|----|------------|--------|------------------|
| C1 | **M** | GitHub Actions com `META_*`, `SUPABASE_*` em secrets | Confirmar **não** commitar `.env.local`; revisar permissões de colaboradores no repositório. |
| C2 | **M** | Vercel / deploy | Conferir Environment Variables: production vs preview; service role só em server. |
| C3 | **B** | Rotação de chaves após migração | Após projeto Supabase novo, invalidar chaves do projeto antigo se ainda existirem em algum lugar. |

---

## 4. Checklist manual (dashboard Supabase)

**Onde marcar:** não existe checklist dentro do site do Supabase. Use o arquivo **[`29-1.md`](./29-1.md)** neste repositório: edite o ficheiro e troque `[ ]` por `[x]` em cada linha quando validar no painel.

Itens a cobrir: API (chaves), Authentication, Database/Extensions, Network (se o plano tiver), Backups/PITR.

---

## 5. Próximos passos (tarefas)

| Task | Foco |
|------|------|
| 29-1 | **Feito** — ver [`29-1.md`](./29-1.md): checklist, Vercel (apagar `NEXT_PUBLIC_META_ACCESS_TOKEN`), login dashboard por implementar, `wp_*`, Free tier. Opcional: GRANTs `anon`. |
| 29-2 | Mapear rotas API públicas e decisão service vs anon vs auth |
| 29-3 | Checklist GitHub + Vercel |
| 29-4 | Versão final deste documento + sign-off |

---

[Back to PBI 29](./prd.md)
