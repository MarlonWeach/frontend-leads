# Tasks for PBI 20: Páginas de Análise Granular de Adsets e Ads

This document lists all tasks associated with PBI 20.

**Parent PBI**: [PBI 20: Páginas de Análise Granular de Adsets e Ads](./prd.md)

## Task Summary

| Task ID | Name | Status | Description |
| :------ | :--------------------------------------- | :------- | :--------------------------------- |
| 20-1 | [Investigar e ajustar tabela `adsets`](./20-1.md) | Review | Verificar a estrutura da tabela `adsets` existente e criar uma migração para adicionar as colunas de insights, se necessário. |
| 20-1a | [Adicionar colunas extras na tabela `campaigns`](./20-1a.md) | Proposed | Criar migração para adicionar colunas extras (ex: created_time, effective_status, etc) na tabela `campaigns`. |
| 20-2 | [Criar script `sync-adsets.ts`](./20-2.md) | Proposed | Desenvolver um novo job para sincronizar adsets e seus insights da Meta API para a tabela `adsets` no Supabase. |
| 20-3 | [Refatorar rota da API `/api/meta/adsets`](./20-3.md) | Proposed | Modificar a rota da API para que ela consulte os dados da tabela `adsets` do Supabase, em vez de chamar a Meta API diretamente. |
| 20-4 | [Implementar hook `useAdsetsData`](./20-4.md) | Proposed | Criar ou ajustar o hook do React Query para buscar os dados da rota da API refatorada. |
| 20-5 | [Implementar página `/adsets`](./20-5.md) | Proposed | Criar a página de listagem de adsets com métricas, filtros e ordenação, consumindo os dados via hook. |
| 20-6 | [Implementar página `/ads`](./20-6.md) | Proposed | Criar página de listagem de ads individuais com preview de criativos e métricas detalhadas. |
| 20-7 | [Atualizar navegação e breadcrumbs](./20-7.md) | Proposed | Adicionar links na sidebar e implementar navegação hierárquica. |
| 20-8 | [Testes E2E e validação](./20-8.md) | Proposed | Implementar testes end-to-end e validar as funcionalidades de adsets e ads. | 