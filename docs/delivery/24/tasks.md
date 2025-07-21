# Tasks for PBI 24: Sistema de Performance Insights e Comparações

This document lists all tasks associated with PBI 24.

**Parent PBI**: [PBI 24: Sistema de Performance Insights e Comparações](./prd.md)

## Progresso do PBI 24

### ✅ Concluído (1/6)
- **24-1**: Hook de Análise de Mudanças - ✅ **CONCLUÍDO**
  - Sistema de insights funcionando com dados reais de 2025
  - Problemas de TypeScript e build resolvidos
  - Deploy funcionando no Vercel

### 🔄 Em Andamento (0/6)
- Nenhuma task em andamento no momento

### ⏳ Pendente (5/6)
- **24-2**: Componente de Insights - Próxima prioridade
- **24-3**: API de Comparações
- **24-4**: Heatmap de Performance  
- **24-5**: Sistema de Previsões
- **24-6**: E2E CoS Test

### 📊 Resumo
- **Progresso**: 16.7% (1 de 6 tasks concluídas)
- **Status**: Base sólida estabelecida com hook funcionando
- **Próximo**: Implementar componente visual para exibir insights

## Task Summary

| Task ID | Name | Status | Description |
| :------ | :--------------------------------------- | :------- | :--------------------------------- |
| 24-1 | [Criar Hook de Análise de Mudanças](./24-1.md) | Review | Hook implementado com sucesso, mas insights não aparecem na UI - precisa investigação |
| 24-2 | [Criar Componente de Insights](./24-2.md) | Done | ✅ Componente visual implementado e funcionando |
| 24-3 | [Implementar API de Comparações](./24-3.md) | Done | ✅ API de comparações implementada e funcional |
| 24-4 | [Criar Heatmap de Performance](./24-4.md) | Done | ✅ Heatmap implementado com visualização de tendências |
| 24-5 | [Implementar Sistema de Previsões](./24-5.md) | Done | ✅ Sistema de previsões implementado, integrado e testado |
| 24-6 | [E2E CoS Test](./24-6.md) | Proposed | Testes end-to-end para validar todas as funcionalidades |
| 24-7 | [Corrigir Problemas Críticos do Sistema de Previsões](./24-7.md) | InProgress | 🔧 Correções críticas implementadas - fórmula linear, validação e bounds aplicados |

## Ordem de Implementação Sugerida

### 🔧 Em Progresso: Task 24-7 
**Correções críticas implementadas**: Fórmula linear, validação de dados, bounds de negócio ✅
**Pendente**: Testes com dados reais e documentação final

### Sequência Recomendada:
1. **24-7** - Finalizar Correções do Sistema de Previsões (30-60 min restantes)
   - Testar com dados reais de 2025
   - Documentar API atualizada
   - Marcar como Done
2. **24-1** - Investigar e corrigir problema dos insights não aparecendo na UI  
3. **24-6** - Testes end-to-end para validar todas as funcionalidades

### Tasks Completas ✅
- **24-2** - Componente de Insights (Done)
- **24-3** - API de Comparações (Done) 
- **24-4** - Heatmap de Performance (Done)
- **24-5** - Sistema de Previsões (Done, correções críticas em progresso)

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