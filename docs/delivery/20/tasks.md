# Tasks for PBI 20: Páginas de Análise Granular de Adsets e Ads

This document lists all tasks associated with PBI 20.

**Parent PBI**: [PBI 20: Páginas de Análise Granular de Adsets e Ads](./prd.md)

## Task Summary

| Task ID | Name | Status | Description |
| :------ | :--------------------------------------- | :------- | :--------------------------------- |
| 20-1 | [Investigar e ajustar tabela `adsets`](./20-1.md) | Done | Verificar a estrutura da tabela `adsets` existente e criar uma migração para adicionar as colunas de insights, se necessário. |
| 20-1a | [Adicionar colunas extras na tabela `campaigns`](./20-1a.md) | Done | Criar migração para adicionar colunas extras (ex: created_time, effective_status, etc) na tabela `campaigns` existente. |
| 20-2 | [Implementar endpoint `/api/meta/adsets`](./20-2.md) | Done | Criar endpoint para buscar adsets com métricas da Meta API, incluindo filtros por campanha, status e período. |
| 20-3 | [Implementar hook `useAdsetsData`](./20-3.md) | Done | Hook para buscar dados de adsets com cache, retry e tratamento de erros. |
| 20-4 | [Refatorar hook `useAdsetsData`](./20-4.md) | Done | Hook refatorado com sucesso. Implementados: logs estruturados, melhor tratamento de erros, cache otimizado, retry inteligente, compatibilidade com rota refatorada, métricas agregadas corretas. |
| 20-5 | [Implementar página `/adsets`](./20-5.md) | Done | Página implementada com sucesso. Funcionalidades: tabela responsiva com métricas completas, filtros funcionais (data, status), ordenação por coluna, paginação, métricas agregadas, interface consistente com design system. Responsividade total implementada com separação da tabela do container visual. |
| 20-6 | [Implementar página `/ads`](./20-6.md) | Done | Criar a página de listagem de ads individuais com preview de criativos e métricas detalhadas, seguindo o mesmo padrão da página /adsets. |
| 20-7 | [Adicionar página `/ads` ao menu de navegação](./20-7.md) | Done | Adicionar o link para a página /ads no menu lateral de navegação, garantindo que seja acessível através da interface principal. |
| 20-8 | [Implementar busca completa de dados de criativo via Meta API](./20-8.md) | Done | Buscar dados completos de criativos (imagens, vídeos, texto) via Meta API para enriquecer os dados de ads. |
| 20-9 | [Refinar layout e UX dos filtros e cards na página /ads](./20-9.md) | Done | Ajuste visual e funcional dos filtros, dropdowns e cards na página de anúncios |