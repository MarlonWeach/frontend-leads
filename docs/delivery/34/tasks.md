# Tasks for PBI 34: Hardening de segurança Supabase (linter)

This document lists all tasks associated with PBI 34.

**Parent PBI**: [PBI 34: Hardening de segurança Supabase (linter)](./prd.md)

## Task Summary

| Task ID | Name | Status | Description |
|---------|------|--------|-------------|
| 34-1 | [Classificar alertas e definir matriz de decisão](./34-1.md) | Done | Inventário consolidado por tipo de alerta com decisões de execução contínua e divisão entre SQL x ação manual |
| 34-2 | [Corrigir function search_path mutable](./34-2.md) | Done | Função `public.update_cache_stats_updated_at` ajustada com `SET search_path = public` em migration versionada |
| 34-3 | [Definir e aplicar política de leaked password protection](./34-3.md) | Blocked | Recurso bloqueado por plano (disponível apenas no Supabase Pro), com exceção registrada |
| 34-4 | [Aplicar políticas RLS por grupo de tabelas](./34-4.md) | Done | Migration criou policies explícitas deny-by-default para tabelas com RLS habilitado e sem policy |
| 34-5 | [Validação final e evidências de segurança](./34-5.md) | Done | Review concluído com pendência residual formalizada: `34-3` bloqueada por limitação de plano (Supabase Pro) |
| 34-6 | [Corrigir build do deploy Vercel em `/login`](./34-6.md) | Done | `app/login/page.tsx` refatorado com `Suspense` boundary para `useSearchParams()`, com build local validado sem erro de prerender |
