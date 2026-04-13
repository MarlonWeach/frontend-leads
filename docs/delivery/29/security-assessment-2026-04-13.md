# Avaliação de segurança (rascunho) — PBI 29

**Data:** 2026-04-13  
**Escopo:** repositório + migrations Supabase (painel do projeto novo deve ser validado manualmente).  
**Próxima revisão:** após checagem no dashboard Supabase (Network, Auth, Database).

Legenda: **C** crítico · **A** alto · **M** médio · **B** baixo

---

## 1. Supabase — banco e RLS

| ID | Severidade | Achado | Evidência / risco | Ação recomendada |
|----|------------|--------|-------------------|------------------|
| S1 | **A** | Políticas `FOR SELECT USING (true)` em tabelas com RLS | `20250130_enable_rls_on_public_tables.sql`: `ad_creatives`, `meta_activity_logs`, `adset_goals` permitem leitura a qualquer papel que passe pelo PostgREST com RLS aplicável. Com chave **anon** no browser, leitura ampla se os GRANTs permitirem. | Revisar modelo de ameaça: restringir por `auth.uid()` / tenant ou remover leitura direta do client; preferir APIs server-side com service role + validação. |
| S2 | **A** | `sync_status`: política "Permitir leitura para todos" (`USING (true)`) | `20250621_create_sync_status_table.sql` | Mesma linha: expõe estado de sync a qualquer cliente que use anon e tenha SELECT. Avaliar se tabela deve ser só server-side. |
| S3 | **M** | Tabelas centrais (`campaigns`, `ads`, `meta_leads`, `adsets`, etc.) sem RLS nas migrations revisadas | Migrations de criação não habilitam RLS nessas tabelas. | Confirmar no SQL Editor (`relrowsecurity` em `pg_tables`) no projeto novo. Se RLS desligado, acesso depende só de GRANT — típico default expõe dados ao anon. |
| S4 | **M** | `budget_adjustment_logs`, sistema de alerts | RLS comentado / não habilitado nos SQLs | Habilitar RLS e políticas ao adotar essas features em produção. |
| S5 | **B** | Nomenclatura `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` em scripts | Vários `scripts/*.js` | Garantir que **nunca** seja referenciada em código `use client` ou bundles. Preferir só `SUPABASE_SERVICE_ROLE_KEY` server-side. Auditar `next build` / bundle. |

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

## 4. Checklist manual (dashboard Supabase — projeto novo)

- [ ] **Settings → API:** URLs e chaves; confirmar quem recebe service role (só backend/CI).
- [ ] **Authentication:** providers necessários; política de senha / MFA se houver usuários reais.
- [ ] **Database:** Extensions; conexões diretas desabilitadas se não usadas.
- [ ] **Network:** restrições de IP (plano Pro+), se aplicável.
- [ ] **Backups / PITR:** alinhado ao plano e RPO/RTO desejados.

---

## 5. Próximos passos (tarefas)

| Task | Foco |
|------|------|
| 29-1 | Fechar itens S3–S5 e checklist §4 no painel; SQL ad-hoc de inventário RLS/GRANT |
| 29-2 | Mapear rotas API públicas e decisão service vs anon vs auth |
| 29-3 | Checklist GitHub + Vercel |
| 29-4 | Versão final deste documento + sign-off |

---

[Back to PBI 29](./prd.md)
