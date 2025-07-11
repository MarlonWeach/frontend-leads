# Tasks for PBI 24: Sistema de Performance Insights e Comparações

This document lists all tasks associated with PBI 24.

**Parent PBI**: [PBI 24: Sistema de Performance Insights e Comparações](./prd.md)

## Task Summary

| Task ID | Name | Status | Description |
| :------ | :--------------------------------------- | :------- | :--------------------------------- |
| 24-1 | [Criar Hook de Análise de Mudanças](./24-1.md) | Done | Implementar hook usePerformanceInsights para comparar métricas e detectar variações significativas |
| 24-2 | [Criar Componente de Insights Automáticos](./24-2.md) | Done | Implementar InsightsPanel para exibir cards com insights do dia e alertas |
| 24-3 | [Implementar API de Comparações](./24-3.md) | Proposed | Criar endpoints para buscar comparações período vs período com agregações Supabase |
| 24-4 | [Criar Componente de Comparação Visual](./24-4.md) | Proposed | Implementar PeriodComparison com seletor de períodos e cards lado a lado |
| 24-5 | [Sistema de Detecção de Anomalias Melhorado](./24-5.md) | Proposed | Implementar algoritmos para detectar mudanças bruscas e padrões sazonais |
| 24-6 | [Criar Heatmap de Performance](./24-6.md) | Proposed | Implementar PerformanceHeatmap usando Nivo para visualizar tendências |
| 24-7 | [Componente de Previsões com IA](./24-7.md) | Proposed | Implementar PerformanceForecast com gráficos de previsão e intervalo de confiança |
| 24-8 | [Sistema de Alertas e Notificações](./24-8.md) | Proposed | Implementar sistema de alertas proativos para oportunidades e riscos |
| 24-9 | [Atualizar Performance Page](./24-9.md) | Proposed | Integrar todos os novos componentes na página de performance existente |
| 24-10 | [Testes e Documentação](./24-10.md) | Proposed | Implementar testes completos e documentar sistema de insights |

## Ordem de Implementação Sugerida

### Fase 1: Backend e Lógica de Comparações
1. **Task 24-1**: Hook de Análise de Mudanças
2. **Task 24-3**: API de Comparações
3. **Task 24-5**: Sistema de Detecção de Anomalias

### Fase 2: Componentes Visuais Básicos
4. **Task 24-2**: Componente de Insights Automáticos
5. **Task 24-4**: Componente de Comparação Visual

### Fase 3: Visualizações Avançadas
6. **Task 24-6**: Heatmap de Performance
7. **Task 24-7**: Componente de Previsões com IA

### Fase 4: Integração e Polish
8. **Task 24-8**: Sistema de Alertas e Notificações
9. **Task 24-9**: Atualizar Performance Page

### Fase 5: Testes e Documentação
10. **Task 24-10**: Testes e Documentação

## Dependências entre Tasks

- **Task 24-1** → **Task 24-2**: Hook necessário para componente de insights
- **Task 24-3** → **Task 24-4**: API necessária para comparações visuais
- **Task 24-1 + 24-3 + 24-5** → **Task 24-9**: Todos os sistemas necessários para integração
- **Task 24-2 + 24-4 + 24-6 + 24-7 + 24-8** → **Task 24-9**: Todos os componentes necessários
- **Todas as tasks** → **Task 24-10**: Testes e documentação após implementação completa

## Arquivos Principais a Serem Criados/Modificados

### Novos Hooks
- `src/hooks/usePerformanceInsights.ts`
- `src/hooks/usePerformanceComparisons.ts`

### Novos Componentes
- `src/components/insights/InsightsPanel.tsx`
- `src/components/insights/PeriodComparison.tsx`
- `src/components/insights/PerformanceHeatmap.tsx`
- `src/components/insights/PerformanceForecast.tsx`
- `src/components/insights/AlertSystem.tsx`

### Novas APIs
- `src/app/api/performance/comparisons/route.ts`
- `src/app/api/performance/insights/route.ts`
- `src/app/api/performance/forecast/route.ts`

### Novos Tipos
- `src/types/insights.ts`
- `src/types/comparisons.ts`

### Páginas Modificadas
- `src/app/performance/page.jsx` (integração dos novos componentes)

## Tecnologias e Bibliotecas Utilizadas

### Já Instaladas
- **Nivo**: Para visualizações avançadas (heatmap, gráficos)
- **Lucide React**: Para ícones dos componentes
- **OpenAI**: Para geração de insights em linguagem natural
- **Supabase**: Para queries de dados históricos

### Padrões do Projeto
- **TypeScript**: Para tipagem forte
- **Tailwind CSS**: Para estilização
- **Glassmorphism**: Design system existente
- **React Query**: Para cache e gerenciamento de estado
- **Jest**: Para testes unitários
- **Playwright**: Para testes E2E

## Exemplos de Insights Gerados

### Tipos de Insights
```typescript
// Sucesso
{
  type: 'success',
  title: 'CPL Reduzido Significativamente',
  description: 'A campanha "Black Friday 2024" teve redução de 23% no CPL ontem vs dia anterior',
  metric: 'cpl',
  variation: -23,
  priority: 'high'
}

// Alerta
{
  type: 'warning',
  title: 'CTR em Queda',
  description: 'CTR médio caiu 15% na última semana',
  metric: 'ctr',
  variation: -15,
  priority: 'medium'
}

// Oportunidade
{
  type: 'info',
  title: 'Melhor Dia Identificado',
  description: 'Terças-feiras têm CPL 40% menor que a média',
  metric: 'cpl',
  variation: -40,
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