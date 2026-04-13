# PBI-29: Avaliação de segurança do projeto (ênfase Supabase)

## Overview
Após criação de um **novo projeto Supabase** e restauração a partir de backup, é necessário **revisar e endurecer critérios de segurança** de ponta a ponta: aplicação, integrações (Meta, OpenAI, Vercel), CI/CD e, com **foco prioritário**, configuração do Supabase (RLS, chaves, rede, auth e políticas de dados).

## Problem Statement
- Projeto Supabase novo pode manter **defaults permissivos** ou políticas herdadas/imperfeitas após restore.
- **Service role** e **anon** keys exigem uso correto no app e nos scripts; segredos em GitHub/Vercel precisam ser auditados.
- Falta um **registro explícito** de critérios de segurança aceitos e de gaps a corrigir.
- Risco de exposição de dados de leads e métricas se RLS, CORS ou APIs públicas não estiverem alinhados ao modelo de ameaça.

## User Stories
- Como **responsável pelo produto**, quero um inventário de riscos e recomendações priorizadas para reduzir superfície de ataque.
- Como **desenvolvedor**, quero políticas claras (Supabase RLS, uso de service role apenas server-side) e checklist aplicável.
- Como **equipe de operações**, quero que backups, logs e acesso ao painel Supabase sigam boas práticas após a migração.

## Technical Approach
1. **Descoberta:** revisar documentação Supabase do projeto (Auth, Database, API, Storage se houver), dashboard do projeto (Network, SSL, Auth providers).
2. **Supabase (prioridade):** RLS em tabelas sensíveis; políticas por papel; revisão de `public` schema; uso de funções `security definer`; chaves apenas em ambiente server; revisão de Realtime se habilitado.
3. **Aplicação Next.js:** rotas API que usam service role; ausência de chaves no client; `middleware` e headers de segurança quando aplicável.
4. **CI/CD e secrets:** GitHub Actions (escopos dos secrets); Vercel env vars; rotação de chaves se necessário.
5. **Entrega:** documento de avaliação (riscos + ações) e, quando acordado, tarefas de implementação em PBIs/tasks subsequentes.

## UI
Não aplicável neste PBI (avaliação e documentação técnica). Pode haver impacto futuro em telas de configuração se surgirem requisitos de auth.

## Acceptance Criteria (CoS)
1. Checklist de segurança **Supabase** cobrindo: RLS, papéis, API keys, Network restrictions (se usado), Auth, Database settings relevantes, PITR/backups conforme plano.
2. Checklist de segurança **aplicação** (API routes, exposição de env, CORS).
3. Checklist **CI/CD e secrets** (GitHub, Vercel).
4. Documento de **achados** classificados (crítico / alto / médio / baixo) com **ações recomendadas** e **responsáveis**.
5. Lista de **itens não resolvidos** com justificativa ou follow-up em backlog.
6. Aprovação do responsável pelo produto de que a avaliação foi suficiente para a fase atual.

## Dependencies
- Acesso ao painel Supabase do projeto novo (projeto owner ou admin).
- Acesso a GitHub (repositório) e Vercel (projeto) para revisão de secrets e variáveis.
- Contexto da arquitetura atual (documentado em `docs/operations/` onde aplicável).

## Open Questions
- Há requisitos de **compliance** específicos (LGPD, retenção de dados de leads)?
- Autenticação de usuários finais: apenas interno/equipe ou multi-tenant futuro?
- Plano Supabase (Free/Pro) afeta PITR e network restrictions?

## Related Tasks
Ver [tasks.md](./tasks.md) — tarefas serão detalhadas após acordo do PBI.

[Back to Backlog](../backlog.md)
