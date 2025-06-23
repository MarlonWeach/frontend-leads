# PBI-20: Páginas de Análise Granular de Adsets e Ads

[View in Backlog](../backlog.md#user-content-20)

## Overview
Este PBI visa implementar páginas de análise granular para adsets e ads individuais, seguindo a estrutura hierárquica da Meta API (campaigns → adsets → ads). Isso permitirá aos gestores de marketing analisar performance em nível detalhado e otimizar campanhas de forma mais eficaz.

## Problem Statement
Atualmente, o sistema possui apenas a página de campanhas (`/campaigns`), mas não oferece análise granular de adsets e ads individuais. Isso limita a capacidade de:
- Identificar quais adsets estão performando melhor dentro de uma campanha
- Analisar performance de ads individuais e seus criativos
- Otimizar campanhas em nível detalhado
- Tomar decisões baseadas em dados granulares

## User Stories
1. Como gestor de marketing, quero ver uma lista de adsets por campanha com métricas completas para identificar quais estão performando melhor
2. Como gestor de marketing, quero analisar ads individuais com preview de criativos para otimizar campanhas em nível granular
3. Como gestor de marketing, quero filtrar e ordenar dados por diferentes métricas para facilitar a análise
4. Como gestor de marketing, quero ver dados em tempo real da Meta API para tomar decisões baseadas em informações atualizadas

## Technical Approach
1. **Página /adsets**:
   - Listar adsets agrupados por campanha
   - Exibir métricas: impressões, cliques, CTR, gastos, leads
   - Filtros por data, status e campanha
   - Ordenação por coluna
   - Integração com Meta API `/adsets` endpoint

2. **Página /ads**:
   - Listar ads individuais com preview de criativos
   - Métricas detalhadas por ad
   - Filtros por data, status, campanha e adset
   - Ordenação por coluna
   - Integração com Meta API `/ads` endpoint

3. **Serviços e Hooks**:
   - Criar `MetaAdsetsService` para buscar adsets
   - Criar `MetaAdsService` para buscar ads
   - Criar hooks `useAdsetsData` e `useAdsData`
   - Implementar cache e tratamento de erros

4. **Navegação e UX**:
   - Adicionar links na sidebar para as novas páginas
   - Manter consistência com design system existente
   - Implementar breadcrumbs para navegação hierárquica

## UX/UI Considerations
1. **Layout Consistente**:
   - Seguir o mesmo padrão visual da página de campanhas
   - Usar glassmorphism e dark mode
   - Manter tipografia e espaçamentos consistentes

2. **Navegação Hierárquica**:
   - Breadcrumbs: Dashboard > Campanhas > Adsets > Ads
   - Links entre páginas relacionadas
   - Filtros contextuais por campanha

3. **Tabelas Interativas**:
   - Ordenação por coluna
   - Paginação para grandes volumes de dados
   - Tooltips com informações detalhadas
   - Estados de loading e erro

## Acceptance Criteria
1. Página `/adsets` deve listar adsets por campanha com métricas completas (impressões, cliques, CTR, gastos, leads)
2. Página `/ads` deve listar ads individuais com preview de criativos e métricas detalhadas
3. Filtros funcionais por data, status e campanha devem estar disponíveis em ambas as páginas
4. Ordenação por coluna deve funcionar em ambas as páginas
5. Integração com Meta API deve fornecer dados em tempo real
6. Interface deve ser consistente com o design system existente
7. Navegação hierárquica deve permitir navegar entre campanhas, adsets e ads
8. Performance deve ser adequada mesmo com grandes volumes de dados

## Dependencies
1. Meta API com permissões para endpoints `/adsets` e `/ads`
2. Sistema de cache existente (React Query)
3. Design system implementado (PBI 17)
4. Página de campanhas funcionando (PBI 18)

## Open Questions
1. Como lidar com adsets/ads que não possuem criativos?
2. Qual o volume máximo de dados que deve ser exibido por página?
3. Como implementar preview de criativos de forma eficiente?
4. Quais métricas específicas são mais importantes para cada nível?

## Related Tasks
[Ver Lista de Tasks](./tasks.md) 