# Tasks for PBI 32: Otimizações Baseadas em Dados Reais da Meta API

This document lists all tasks associated with PBI 32.

**Parent PBI**: [PBI 32: Otimizações Baseadas em Dados Reais da Meta API](./prd.md)

## Task Summary

| Task ID | Name | Status | Description |
|---------|------|--------|-------------|
| 32-1 | [Definir escopo técnico e critérios de evidência](./32-1.md) | Done | Escopo e parâmetros de negócio consolidados (janela, pilotagem, guardrails, cadência e pesos de scoring) |
| 32-2 | [Definir arquitetura de dados e modelo de recomendação](./32-2.md) | Done | Arquitetura em camadas, scoring v1, guardrails, TTL, ponte com `optimization-context` (PBI 33) |
| 32-3 | [Definir contrato de API e modelo de persistência](./32-3.md) | Done | Contrato REST, `context_snapshot`, payloads por tipo, RLS (PBI 29), curl e semântica 409/defer |
| 32-4 | [Definir UX de recomendação e fluxo de decisão](./32-4.md) | Done | Lista `/recomendacoes`, detalhe, modais apply/discard/defer, filtros, cópias e a11y mínimo |
| 32-5 | [Definir estratégia de validação offline e piloto](./32-5.md) | Done | Simulação offline, piloto fase 0/1/2, métricas, gates de promoção e rollback |
| 32-6 | [Implementar coleta/agregação das dimensões do MVP](./32-6.md) | Done | Migration + RLS/grants; agregação 7d tipada e testada; sim offline → 32-7 |
| 32-7 | [Implementar motor de recomendações assistidas + auditoria](./32-7.md) | Done | APIs + motor stub v1 + UI `/dashboard/recomendacoes`; auditoria em `optimization_recommendation_decisions` |
| 32-8 | [Validar em ambiente real e fechar rollout controlado](./32-8.md) | Done | Piloto controlado com controles operacionais concluídos (limpeza em lote e geração com sobrescrita) |
