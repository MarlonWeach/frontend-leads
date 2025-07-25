# PBI-28: Padronização de Layout, Dados e Funcionalidades do Dashboard

## Overview
Este PBI visa padronizar o layout, corrigir dados e aprimorar funcionalidades em todas as páginas do dashboard, garantindo experiência consistente, dados confiáveis e usabilidade para todos os perfis de usuário.

## Problem Statement
- Layout inconsistente entre páginas (botões, seleção de data, etc)
- Atividade recente exibe informações não relevantes
- Valores de spend exibidos sem formatação monetária e com casas decimais excessivas
- Gráfico de tendências de performance não agrega valor
- Tooltip do heatmap de performance desalinhado
- Dados zerados no heatmap a partir de 17/07
- Insights e previsões de performance inconsistentes
- Overflow na tabela de campanhas em /performance
- Layout de botões e resumo do período desalinhados em /campanhas
- Detalhes do criativo ausentes em /ads
- /leads e /configurações sem implementação

## User Stories
- Como usuário, quero que todos os botões e seletores tenham o mesmo padrão visual e funcional
- Como gestor, quero logs de atividade recentes realmente úteis e auditáveis
- Como analista, quero ver valores financeiros corretamente formatados
- Como usuário, quero que gráficos e tooltips sejam claros e legíveis
- Como gestor, quero que todas as páginas estejam completas e funcionais

## Technical Approach
- Refatorar componentes de layout e UI para uso de design system único
- Implementar componente único de seleção de data
- Corrigir formatação de valores monetários (R$) e casas decimais
- Refatorar logs de atividade para exibir apenas eventos relevantes
- Corrigir tooltip do heatmap para posição fixa
- Investigar queries/dados do heatmap e insights
- Corrigir lógica de previsões para alinhar datas
- Ajustar overflow de tabelas e posicionamento de resumos
- Exibir detalhes do criativo em /ads
- Planejar e implementar páginas /leads e /configurações

## Acceptance Criteria
1. Layout e botões padronizados em todas as páginas
2. Atividade recente exibe apenas logs relevantes, com data/hora
3. Valores de spend exibidos como R$ e com 2 casas decimais
4. Gráfico de tendências de performance removido de /performance
5. Tooltip do heatmap sempre legível e em posição fixa
6. Dados do heatmap não zeram após 17/07
7. Insights e previsões de performance refletem dados reais e corretos
8. Previsões de performance sem defasagem de 1 dia
9. Tabela de campanhas não vaza do layout
10. Layout de botões e resumo do período padronizados em /campanhas
11. Resumo do período no topo da página
12. Detalhes do criativo exibidos em /ads
13. /leads e /configurações implementados ou sinalizados como pendentes

## Dependencies
- Design system
- API de logs de atividade
- API de dados de performance

## Open Questions
- Quais eventos devem ser considerados relevantes para o log de atividade?
- Alguma preferência de framework/componentes para UI?

## Related Tasks
[Link para tasks.md será criado após aprovação do PBI]

[Back to Backlog](../backlog.md) 