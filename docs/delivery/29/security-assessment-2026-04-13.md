# Avaliação de segurança (final) — PBI 29

**Data:** 2026-04-13  
**Escopo:** repositório + migrations Supabase (painel do projeto novo deve ser validado manualmente).  
**Próxima revisão:** quando houver mudança relevante de arquitetura, políticas RLS ou credenciais.

Legenda: **C** crítico · **A** alto · **M** médio · **B** baixo

---

## 1. Supabase — banco e RLS

| ID | Severidade | Achado | Evidência / risco | Ação recomendada |
|----|------------|--------|-------------------|------------------|
| S1 | **A** | **Confirmado (SQL):** `ad_creatives`, `meta_activity_logs`, `adset_goals` — SELECT com `qual = true` para role `public`. | Qualquer sessão que use PostgREST com RLS aplicável pode **ler todas as linhas** dessas tabelas (incl. `anon` se a política public permitir). INSERT em `meta_activity_logs` sem `qual` visível na view (revisar `with_check` no catálogo se necessário). | Restringir SELECT (ex.: só `service_role` / sem acesso anon) ou escopo por `auth.uid()`; evitar dados sensíveis só protegidos por essas políticas. |
| S2 | **A** | **Confirmado:** `sync_status` — "Permitir leitura para todos", `qual = true`; UPDATE só `service_role` (nota: cliente com **service_role** ignora RLS de qualquer forma). | Estado de sincronização visível a quem tiver SELECT conforme GRANT+RLS. | Se não precisar no browser, revogar SELECT ao `anon` ou política mais restrita. |
| S3 | **A** | **Mitigação concluída na task 29-5:** migrações [`20260414140000_security_rls_and_function_hardening.sql`](../../../supabase/migrations/20260414140000_security_rls_and_function_hardening.sql) e [`20260414183000_meta_activity_logs_unique_constraint.sql`](../../../supabase/migrations/20260414183000_meta_activity_logs_unique_constraint.sql) aplicadas. `ENABLE ROW LEVEL SECURITY` apenas em tabelas **existentes** (projeto sem `wp_*` não falha). Leitura anon limitada a `campaigns`/`adsets`/`ads` via políticas; resto efetivamente via **service_role**. | Inventário histórico (2026-04-13): 27 tabelas sem RLS antes da migração; erro `42P10` do workflow de activity logs mitigado com constraint única; Security Advisor com 0 errors e 0 warnings. | Manter no backlog técnico a evolução de políticas para tabelas com `INFO: rls_enabled_no_policy` (não bloqueante para fechamento da 29-5). |
| S4 | **M** | `budget_adjustment_logs`, sistema de alerts | RLS comentado / não habilitado nos SQLs | Habilitar RLS e políticas ao adotar essas features em produção. |
| S5 | **B** | Nomenclatura `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` em scripts | Vários `scripts/*.js` | Garantir que **nunca** seja referenciada em código `use client` ou bundles. Preferir só `SUPABASE_SERVICE_ROLE_KEY` server-side. Auditar `next build` / bundle. |

### Inventário SQL no projeto (2026-04-13)

**`relrowsecurity = false` (27 tabelas):**  
`ad_insights`, `ads`, `adset_budget_adjustments`, `adset_insights`, `adset_progress_alerts`, `adset_progress_tracking`, `adsets`, `ai_analysis_logs`, `ai_anomalies`, `alert_notifications`, `alert_rules`, `alert_stats`, `alerts`, `audience_suggestions_logs`, `audit_logs`, `budget_adjustment_logs`, `cache_stats`, `campaigns`, `lead_quality_logs`, `meta_leads`, `sync_logs`, `wp_Configuracao`, `wp_Cotacao`, `wp_HistoricoIA`, `wp_LogAlteracaoPreco`, `wp_PrecoBase`, `wp_Usuario`.

**`relrowsecurity = true` (4 tabelas):** `ad_creatives`, `adset_goals`, `meta_activity_logs`, `sync_status`.

**Obs.:** Tabelas `wp_*` — possível legado; a migração acima **ignora** nomes que não existirem no catálogo (evita erro `42P01`).

---

## 2. Aplicação Next.js e APIs

| ID | Severidade | Achado | Evidência | Ação recomendada |
|----|------------|--------|-----------|------------------|
| A1 | **M** | Uso predominante de **service role** em rotas API | `app/api/**`: performance, dashboard, ai/*, sync/*, etc. | Service role **ignora RLS**. Aceitável se todas as rotas forem server-only e sem vazamento de chave. Revisar se alguma rota pode ser chamada sem autenticação de usuário e ainda assim expor dados sensíveis. |
| A2 | **M** | Fallback `SUPABASE_SERVICE_ROLE_KEY \|\| NEXT_PUBLIC_SUPABASE_ANON_KEY` em algumas rotas | Ex.: `app/api/performance/route.ts`, `comparisons`, `forecast`, `meta/activity` | Se cair no anon, RLS aplica — mas políticas fracas (S1) podem expor muito. Unificar estratégia: server só service role **ou** padrão com usuário JWT + RLS estrita. |
| A3 | **B** | Client `src/lib/supabaseClient.js` usa **anon** (`NEXT_PUBLIC_*`) | Esperado para uso no browser | Garantir que componentes client não consultem tabelas sensíveis sem políticas adequadas. |
| A4 | **M** | Rotas API sem auth de utilizador; várias usam **anon** ou fallback **service \| anon** | Ver [`api-routes-supabase-inventory.md`](./api-routes-supabase-inventory.md) | Até haver login: garantir service role em prod; médio prazo RLS/revogar anon nas tabelas sensíveis. |

---

## 3. CI/CD e segredos (revisão de processo)

| ID | Severidade | Achado | Ação recomendada |
|----|------------|--------|------------------|
| C1 | **M** | GitHub Actions com `META_*`, `SUPABASE_*` em secrets | Confirmar **não** commitar `.env.local`; revisar permissões de colaboradores no repositório. |
| C2 | **M** | Vercel / deploy | Conferir Environment Variables: production vs preview; service role só em server. |
| C3 | **B** | Rotação de chaves após migração | Após projeto Supabase novo, invalidar chaves do projeto antigo se ainda existirem em algum lugar. |

### 3.1 GitHub Actions — secrets referenciados (valores **não** listados aqui)

| Workflow | Secrets usados |
|----------|----------------|
| [`vercel-deploy.yml`](../../../.github/workflows/vercel-deploy.yml) | `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, `VERCEL_TOKEN` |
| [`cache-stats.yml`](../../../.github/workflows/cache-stats.yml) | `VERCEL_URL` (opcional), `VERCEL_TOKEN` |
| [`sync-dados-3x-dia.yml`](../../../.github/workflows/sync-dados-3x-dia.yml) | `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `META_ACCESS_TOKEN`, `META_ACCOUNT_ID`, e em alguns jobs `META_USER_ACCESS_TOKEN`, `META_PAGE_ACCESS_TOKEN`, `META_FORM_ID`, `META_PAGE_ID` |
| [`sync-meta-activity-logs.yml`](../../../.github/workflows/sync-meta-activity-logs.yml) | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `META_ACCOUNT_ID`, `META_ACCESS_TOKEN` |
| [`playwright.yml`](../../../.github/workflows/playwright.yml) | Nenhum secret no YAML (apenas `npm ci` / testes locais ao runner). |

**Achado:** `sync-dados-3x-dia.yml` injeta `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` em ficheiros `.env` para scripts — alinha com o anti-padrão já referido na task 29-1 (service role em prefixo `NEXT_PUBLIC_*`); preferir só `SUPABASE_SERVICE_ROLE_KEY` server-side nos scripts.

**Branch protection / quem vê logs:** validar manualmente em GitHub → Settings → Branches e Actions → permissões da organização/equipa. Não é inferível a partir do repositório.

### 3.2 Vercel (checklist manual)

- [ ] Production: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (e demais env da app), sem duplicar service role em variável `NEXT_PUBLIC_*`.
- [ ] Preview: mesmas chaves só se necessário; evitar apontar preview a dados de produção sem intenção.
- [ ] Confirmar que logs de build/deploy na Vercel não imprimem valores de secrets (comportamento padrão mascara; evitar `console.log` de `process.env` sensível).

---

## 4. Checklist manual (dashboard Supabase)

**Onde marcar:** não existe checklist dentro do site do Supabase. Use o arquivo **[`29-1.md`](./29-1.md)** neste repositório: edite o ficheiro e troque `[ ]` por `[x]` em cada linha quando validar no painel.

Itens a cobrir: API (chaves), Authentication, Database/Extensions, Network (se o plano tiver), Backups/PITR.

---

## 5. Próximos passos (tarefas)

| Task | Foco |
|------|------|
| 29-1 | **Feito** — ver [`29-1.md`](./29-1.md): checklist, Vercel (apagar `NEXT_PUBLIC_META_ACCESS_TOKEN`), login dashboard por implementar, `wp_*`, Free tier. Opcional: GRANTs `anon`. |
| 29-2 | **Feito** — [`api-routes-supabase-inventory.md`](./api-routes-supabase-inventory.md) |
| 29-3 | **Feito** — secção 3.1–3.2 neste documento |
| 29-4 | Versão final deste documento + sign-off |
| 29-5 | **Feito** — [29-5.md](./29-5.md): migrações aplicadas + deploy validado + linter sem errors/warnings |

---

## 6. Sign-off (task 29-4)

Esta secção serve para o responsável do produto dizer: "revisei, entendi os riscos e aprovo encerrar o PBI 29".

| Campo | Valor |
|-------|--------|
| Documento | Este ficheiro (`security-assessment-2026-04-13.md`) como versão consolidada |
| Tarefas 29-1 a 29-3 | Concluídas no repositório (checklists e inventário API) |
| Aprovação responsável pelo produto | Aprovado — Marlon em 14/04/2026 |
| Riscos residuais aceites | Aceito, nesta etapa, apenas os riscos residuais já documentados como INFO no Security Advisor (ex.: `rls_enabled_no_policy`), sem erros ou warnings pendentes. |

### 6.1 Como preencher (passo a passo, sem ser programador)

1. Abra este arquivo e vá até a tabela acima (secção 6).
2. Em **Aprovação responsável pelo produto**, substitua por:
   - seu nome;
   - a data de hoje;
   - texto de aprovação.
3. Em **Riscos residuais aceites**, escolha um dos dois formatos:
   - `Nenhum além dos documentados`; ou
   - uma lista curta do que está sendo aceito por agora.
4. Salve o arquivo e me envie o texto que você colocou (copiar e colar já basta).

### 6.2 O que você precisa checar antes de aprovar

Checklist simples (já validado tecnicamente durante a task, mas aqui é confirmação de negócio):

- O sistema está funcionando nas páginas principais (`/dashboard`, `/performance`, `/campaigns`, `/adsets`, `/ads`, `/leads`).
- No Supabase Security Advisor você viu:
  - `Errors = 0`;
  - `Warnings = 0`;
  - somente `Info` (sugestões) como `rls_enabled_no_policy`.
- Você aceita manter, por agora, as sugestões `INFO` como backlog técnico (não bloqueante).

### 6.3 Texto pronto para você usar (copiar e colar)

**Aprovação responsável pelo produto**  
`Aprovado por <SEU NOME> em <DATA>.`

**Riscos residuais aceites**  
`Aceito, nesta etapa, apenas os riscos residuais já documentados como INFO no Security Advisor (ex.: rls_enabled_no_policy), sem erros ou warnings pendentes.`

### 6.4 Como me devolver (modelo para futuros PBIs)

Me envie só este bloco preenchido:

```md
Aprovação responsável pelo produto: Aprovado por <SEU NOME> em <DATA>.
Riscos residuais aceites: <SEU TEXTO FINAL>.
```

Neste PBI, o sign-off já foi recebido e registado na tabela acima.

---

[Back to PBI 29](./prd.md)
