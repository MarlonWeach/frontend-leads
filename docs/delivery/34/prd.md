# PBI-34: Hardening de segurança Supabase (linter)

## Overview
Aplicar hardening orientado pelos alertas atuais do linter do Supabase, priorizando riscos reais de segurança e evitando mudanças desnecessárias em tabelas técnicas internas.

## Problem Statement
- O linter aponta warning de `function_search_path_mutable` para `public.update_cache_stats_updated_at`.
- O Auth está com `Leaked Password Protection` desabilitado.
- Há múltiplos alertas de `RLS Enabled No Policy`, com risco de configuração inconsistente e baixa governança.
- Sem uma trilha formal, correções podem ficar parciais ou gerar regressão em migrações futuras.

## User Stories
- Como responsável por segurança, quero reduzir alertas relevantes no Supabase para diminuir superfície de risco.
- Como equipe técnica, quero uma matriz de decisão por tabela para tratar RLS de forma consistente.
- Como produto, quero manter rastreabilidade das decisões (o que foi corrigido e o que foi aceito como exceção).

## Technical Approach
1. Levantar e classificar alertas por criticidade e impacto operacional.
2. Corrigir funções SQL com `SET search_path` explícito e revisão de permissões.
3. Definir política para `Leaked Password Protection` no Auth (habilitar e validar fluxo).
4. Tratar `RLS Enabled No Policy` em lotes:
   - adicionar policy mínima quando houver acesso por usuários autenticados;
   - restringir a `service_role` em tabelas internas de backend;
   - registrar exceção com justificativa quando não houver ação imediata.
5. Consolidar evidência de validação com nova leitura do linter.

## UI
- Sem impacto direto de UI (escopo de infraestrutura e segurança).

## Conditions of Satisfaction (CoS)
1. Warning `function_search_path_mutable` resolvido para as funções em escopo deste PBI.
2. Decisão de segurança sobre `Leaked Password Protection` implementada ou formalmente registrada.
3. Alertas de `RLS Enabled No Policy` avaliados com plano executado por grupo de tabelas.
4. Linter do Supabase reexecutado com evidência de redução dos alertas alvo.
5. Documentação de decisões e exceções publicada no diretório do PBI.

## Dependencies
- Acesso administrativo ao projeto Supabase (Database + Auth settings).
- Janela segura para aplicar migrations em ambiente alvo.

## Open Questions
- Quais tabelas devem manter acesso exclusivo `service_role` sem policy para `authenticated`?
- Leaked password protection deve ser habilitada em todos os ambientes ou apenas produção?

## Related Tasks
- [tasks.md](./tasks.md)

[Back to Backlog](../backlog.md)
