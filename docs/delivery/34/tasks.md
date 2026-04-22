# Tasks for PBI 34: Hardening de segurança Supabase (linter)

This document lists all tasks associated with PBI 34.

**Parent PBI**: [PBI 34: Hardening de segurança Supabase (linter)](./prd.md)

## Task Summary

| Task ID | Name | Status | Description |
|---------|------|--------|-------------|
| 34-1 | [Classificar alertas e definir matriz de decisão](./34-1.md) | Proposed | Inventariar warnings/sugestões do linter por tipo, impacto e ação recomendada |
| 34-2 | [Corrigir function search_path mutable](./34-2.md) | Proposed | Ajustar `public.update_cache_stats_updated_at` e funções relacionadas com `SET search_path` explícito |
| 34-3 | [Definir e aplicar política de leaked password protection](./34-3.md) | Proposed | Habilitar e validar em ambiente alvo ou registrar exceção formal com justificativa |
| 34-4 | [Aplicar políticas RLS por grupo de tabelas](./34-4.md) | Proposed | Implementar policies mínimas e/ou ajustes de acesso para tabelas com RLS sem policy |
| 34-5 | [Validação final e evidências de segurança](./34-5.md) | Proposed | Reexecutar linter, consolidar evidências e registrar pendências remanescentes |
| 34-6 | [Corrigir build do deploy Vercel em `/login`](./34-6.md) | Done | `app/login/page.tsx` refatorado com `Suspense` boundary para `useSearchParams()`, com build local validado sem erro de prerender |
