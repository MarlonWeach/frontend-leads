# Tasks for PBI 29: Avaliação de segurança (ênfase Supabase)

**Parent PBI**: [PBI 29](./prd.md)  
**Assessment (draft):** [security-assessment-2026-04-13.md](./security-assessment-2026-04-13.md)  
**APIs:** [api-routes-supabase-inventory.md](./api-routes-supabase-inventory.md)  
**RLS / DB:** [29-5.md](./29-5.md) · migração `supabase/migrations/20260414140000_security_rls_and_function_hardening.sql`

## Task Summary

| Task ID | Name | Status | Description |
|---------|------|--------|-------------|
| 29-1 | Auditoria Supabase: RLS, GRANTs e painel | Done | SQL + checklist em 29-1.md; Vercel (remover NEXT_PUBLIC_META_ACCESS_TOKEN); Auth/login pendente; wp_* legado; Free tier |
| 29-2 | Mapeamento de rotas API e chaves | Done | `api-routes-supabase-inventory.md`; service / anon / fallback; achado A4 no assessment |
| 29-3 | CI/CD, GitHub e Vercel | Done | Secções 3.1–3.2 no `security-assessment-2026-04-13.md` |
| 29-4 | Consolidação e sign-off | Done | Documento final consolidado com aprovação e riscos residuais aceites |
| 29-5 | Endurecimento DB: RLS + funções + exec_sql | Done | Migrações aplicadas + smoke/deploy ok + linter sem errors/warnings críticos; ver [29-5.md](./29-5.md) |

## Regra de WIP
**29-5** e **29-4** em paralelo: fechar endurecimento DB antes do sign-off final.
