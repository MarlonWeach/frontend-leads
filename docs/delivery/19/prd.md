# PBI-19: Página de Performance Detalhada

[View in Backlog](../backlog.md#user-content-19)

## Overview

Implementar uma página dedicada para análise detalhada de performance de campanhas, permitindo que gestores de marketing analisem profundamente o desempenho de suas campanhas com métricas avançadas, filtros funcionais e ordenação por coluna.

## Problem Statement

Atualmente, o dashboard principal oferece uma visão geral das métricas, mas falta uma página específica para análise detalhada de performance que permita:
- Visualizar métricas detalhadas por campanha
- Filtrar dados por período e status
- Ordenar resultados por diferentes métricas
- Analisar tendências e identificar oportunidades de otimização

## User Stories

Como gestor de marketing, eu quero:
- Ver uma listagem detalhada de todas as campanhas com métricas completas
- Filtrar campanhas por período de data e status
- Ordenar campanhas por diferentes métricas (leads, gasto, CTR, CPL)
- Identificar rapidamente as campanhas de melhor e pior performance
- Analisar tendências de performance ao longo do tempo

## Technical Approach

### Arquitetura
- **Frontend**: Página `/performance` com React/Next.js
- **Backend**: API route `/api/performance` para buscar dados
- **Dados**: Integração com tabelas `campaigns` e `campaign_insights` do Supabase
- **Cache**: Implementar cache inteligente para otimizar performance

### Componentes Principais
1. **PerformanceTable**: Tabela principal com listagem de campanhas
2. **PerformanceFilters**: Filtros de data, status e métricas
3. **PerformanceMetrics**: Cards com métricas agregadas
4. **PerformanceCharts**: Gráficos de tendências e distribuição

### Integração de Dados
- Buscar dados da tabela `campaigns` com insights agregados
- Calcular métricas derivadas (CPL, ROI, etc.)
- Implementar paginação para grandes volumes de dados
- Sincronizar com Meta API para dados atualizados

## UX/UI Considerations

### Design System
- Seguir padrão visual estabelecido (dark mode, glassmorphism)
- Usar componentes existentes (cards, filtros, tabelas)
- Manter consistência com outras páginas do dashboard

### Layout
- Header com título e métricas agregadas
- Seção de filtros avançados
- Tabela principal com ordenação por coluna
- Gráficos de tendências e distribuição
- Paginação e controles de navegação

### Interatividade
- Filtros em tempo real
- Ordenação clicável nas colunas
- Tooltips com informações detalhadas
- Estados de loading e erro

## Acceptance Criteria

### Funcionalidades Core
1. **Listagem de Campanhas**
   - Exibir todas as campanhas com métricas completas
   - Colunas: Nome, Status, Leads, Gasto, CTR, CPL, ROI
   - Paginação para grandes volumes de dados

2. **Filtros Funcionais**
   - Filtro por período de data (últimos 7 dias, 30 dias, customizado)
   - Filtro por status (ativo, pausado, arquivado)
   - Filtro por campanha específica
   - Aplicação em tempo real

3. **Ordenação por Coluna**
   - Ordenação ascendente/descendente por qualquer coluna
   - Indicador visual de coluna ordenada
   - Manter estado de ordenação durante filtros

4. **Métricas Agregadas**
   - Total de leads, gasto, CTR médio
   - CPL médio e ROI agregado
   - Comparação com período anterior

### Performance e UX
1. **Performance**
   - Carregamento inicial em menos de 2 segundos
   - Filtros aplicados em menos de 500ms
   - Cache inteligente para dados frequentes

2. **Responsividade**
   - Funcionar em desktop, tablet e mobile
   - Tabela responsiva com scroll horizontal
   - Filtros adaptáveis para telas pequenas

3. **Estados de Interface**
   - Loading state durante carregamento
   - Empty state quando não há dados
   - Error state com mensagem amigável
   - Estados de filtro aplicado

### Integração
1. **Dados Reais**
   - Usar dados da Meta API via Supabase
   - Sincronização automática de dados
   - Fallback para dados em cache

2. **Consistência**
   - Seguir padrões de nomenclatura existentes
   - Usar componentes UI estabelecidos
   - Manter padrão de tratamento de erros

## Dependencies

- PBI 16 (Filtragem Automática) - ✅ Concluído
- PBI 18 (Problemas Críticos) - ✅ Concluído
- Componentes UI existentes
- Integração com Meta API
- Estrutura de cache implementada

## Open Questions

1. **Métricas Específicas**: Quais métricas adicionais são mais importantes para análise de performance?
2. **Gráficos**: Que tipos de gráficos seriam mais úteis (tendências, distribuição, comparação)?
3. **Exportação**: É necessário funcionalidade de exportação de dados?
4. **Alertas**: Implementar sistema de alertas para campanhas com baixa performance?

## Related Tasks

[View Tasks](./tasks.md) 