# PBI-24: Sistema de Performance Insights e Comparações

[View in Backlog](../backlog.md#user-content-24)

## Overview

O PBI 24 implementa um sistema avançado de insights automáticos que analisa performance de campanhas, detecta mudanças significativas e fornece comentários contextualizados em tempo real. Este sistema permite que gestores de marketing tomem decisões mais informadas baseadas em análises automáticas de dados.

## Problem Statement

Atualmente, os gestores de marketing precisam analisar manualmente os dados de performance, comparar períodos e identificar tendências. Este processo é demorado, propenso a erros e não escala bem. Há necessidade de um sistema que:

- Detecte automaticamente mudanças significativas na performance
- Compare períodos de forma inteligente
- Gere insights contextualizados em linguagem natural
- Visualize tendências e anomalias de forma intuitiva
- Forneça previsões baseadas em dados históricos

## User Stories

### Como Gestor de Marketing, eu quero:
1. **Insights Automáticos**: Receber alertas automáticos sobre mudanças significativas na performance das campanhas
2. **Comparações Inteligentes**: Comparar facilmente períodos diferentes para identificar tendências
3. **Análise Contextualizada**: Receber explicações em linguagem natural sobre o que está acontecendo
4. **Visualização de Tendências**: Ver padrões e anomalias de forma visual e intuitiva
5. **Previsões**: Receber previsões sobre performance futura baseada em dados históricos
6. **Alertas Proativos**: Ser notificado sobre oportunidades e riscos antes que se tornem problemas

## Technical Approach

### Arquitetura do Sistema

1. **Hook de Análise de Mudanças** (`usePerformanceInsights`)
   - Compara métricas do período atual vs anterior
   - Detecta variações significativas (>10%)
   - Gera insights contextualizados

2. **API de Comparações** (`/api/performance/comparisons`)
   - Endpoints para buscar comparações período vs período
   - Queries Supabase para agregações por período
   - Cálculo de variações percentuais

3. **Componentes Visuais**
   - `InsightsPanel`: Cards com insights do dia
   - `PeriodComparison`: Comparação visual lado a lado
   - `PerformanceHeatmap`: Heatmap de performance
   - `PerformanceForecast`: Previsões com IA

4. **Sistema de IA Integrado**
   - Integração com `aiService.ts` existente
   - Geração de insights em linguagem natural
   - Detecção de anomalias avançada

### Tecnologias Utilizadas

- **Frontend**: React, TypeScript, Tailwind CSS
- **Visualização**: Nivo (já instalada), Lucide React (ícones)
- **Backend**: Next.js API Routes, Supabase
- **IA**: OpenAI GPT (integração existente)
- **Cache**: Sistema de cache existente

## UX/UI Considerations

### Design System
- Seguir padrão glassmorphism existente
- Usar cores específicas para tipos de insights:
  - Verde: Sucesso/melhoria
  - Vermelho: Alerta/problema
  - Amarelo: Atenção
  - Azul: Informação

### Componentes Visuais
- **Cards de Insights**: Glassmorphism com ícones Lucide
- **Heatmap**: Cores indicando performance (verde/amarelo/vermelho)
- **Comparações**: Layout lado a lado com setas de variação
- **Previsões**: Gráficos de linha com área de confiança

### Interatividade
- Tooltips detalhados ao passar mouse
- Animações suaves de entrada
- Filtros interativos por período
- Responsividade em todos os dispositivos

## Acceptance Criteria

### Funcionalidades Core
1. **Sistema de Comparações**
   - ✅ Comparar métricas entre períodos (hoje vs ontem, semana atual vs anterior)
   - ✅ Detectar variações significativas (>10%)
   - ✅ Calcular percentuais de mudança

2. **Insights Automáticos**
   - ✅ Gerar insights contextualizados em linguagem natural
   - ✅ Categorizar insights por tipo (sucesso, alerta, atenção, informação)
   - ✅ Priorizar insights por relevância

3. **Visualizações**
   - ✅ Heatmap de performance com cores indicativas
   - ✅ Gráficos de comparação lado a lado
   - ✅ Previsões com intervalo de confiança

4. **Integração**
   - ✅ Integrar com sistema de IA existente
   - ✅ Usar cache existente para otimização
   - ✅ Seguir padrões de loading e error handling

### Performance e Usabilidade
1. **Performance**
   - ✅ Carregar insights em menos de 2 segundos
   - ✅ Usar cache para otimizar queries
   - ✅ Implementar lazy loading para componentes pesados

2. **Responsividade**
   - ✅ Funcionar em desktop, tablet e mobile
   - ✅ Adaptar layout para diferentes tamanhos de tela
   - ✅ Manter usabilidade em dispositivos touch

3. **Acessibilidade**
   - ✅ Suporte a navegação por teclado
   - ✅ ARIA labels apropriados
   - ✅ Contraste adequado para cores

### Qualidade e Testes
1. **Testes**
   - ✅ Testes unitários para hooks de análise
   - ✅ Testes de integração para APIs
   - ✅ Testes E2E para fluxos principais

2. **Documentação**
   - ✅ Documentar algoritmos de detecção
   - ✅ Exemplos de uso e configuração
   - ✅ Guia de manutenção

## Dependencies

### Dependências Externas
- OpenAI API (já configurada)
- Supabase (já configurado)
- Nivo (já instalada)
- Lucide React (já instalado)

### Dependências Internas
- `usePerformanceData.ts` (hook existente)
- `aiService.ts` (serviço de IA existente)
- Sistema de cache existente
- Design system glassmorphism

## Open Questions

1. **Thresholds de Variação**: Qual percentual considerar "significativo"? (proposta: 10%)
2. **Frequência de Análise**: Com que frequência gerar insights? (proposta: diária)
3. **Retenção de Dados**: Por quanto tempo manter dados históricos? (proposta: 90 dias)
4. **Personalização**: Permitir que usuários configurem thresholds? (futuro)

## Related Tasks

- [Task List](./tasks.md)
- Integração com PBI 22 (Sistema de IA existente)
- Reutilização de componentes do PBI 17 (Design system)
- Aproveitamento de hooks do PBI 20 (Performance data)

## Exemplos de Insights

### Tipos de Insights Gerados

```typescript
// Exemplo de insight de sucesso
{
  type: 'success',
  title: 'CPL Reduzido Significativamente',
  description: 'A campanha "Black Friday 2024" teve redução de 23% no CPL ontem vs dia anterior',
  metric: 'cpl',
  variation: -23,
  campaigns: ['Black Friday 2024'],
  suggestedAction: 'Aumentar investimento nesta campanha para aproveitar a eficiência',
  priority: 'high'
}

// Exemplo de alerta
{
  type: 'warning',
  title: 'CTR em Queda',
  description: 'CTR médio caiu 15% na última semana',
  metric: 'ctr',
  variation: -15,
  campaigns: ['Todas as campanhas'],
  suggestedAction: 'Revisar criativos e segmentação',
  priority: 'medium'
}

// Exemplo de oportunidade
{
  type: 'info',
  title: 'Melhor Dia Identificado',
  description: 'Terças-feiras têm CPL 40% menor que a média',
  metric: 'cpl',
  variation: -40,
  campaigns: ['Todas as campanhas'],
  suggestedAction: 'Aumentar investimento às terças-feiras',
  priority: 'low'
}
```

### Métricas Analisadas
- **CPL (Custo por Lead)**: Indicador de eficiência
- **CTR (Click-Through Rate)**: Engajamento
- **Impressões**: Alcance
- **Cliques**: Interação
- **Gastos**: Orçamento
- **Leads**: Conversões

### Algoritmos de Detecção
1. **Variação Percentual**: (atual - anterior) / anterior * 100
2. **Significância**: Variação > 10% (configurável)
3. **Tendências**: Análise de 7 dias consecutivos
4. **Anomalias**: Desvio padrão > 2σ da média
5. **Sazonalidade**: Comparação com mesmo período anterior 