# PBI 21: Padrão Visual de Cards Coloridos

## Overview

Implementar um padrão visual consistente de cards coloridos com efeitos de hover em todas as páginas do projeto, baseado no design já implementado na página `/performance`. Este padrão garantirá uma experiência visual consistente e moderna em todo o dashboard.

## Problem Statement

Atualmente, apenas a página `/performance` possui o padrão visual de cards coloridos com efeitos de hover. As outras páginas do projeto não seguem este padrão, resultando em uma experiência visual inconsistente para o usuário.

## User Stories

Como usuário, quero que todas as páginas do projeto tenham o mesmo padrão visual de cards coloridos com efeitos de hover para ter uma experiência visual consistente e moderna.

## Technical Approach

### Design System
- **Cores específicas por métrica**:
  - Azul (#3B82F6) para leads/conversões - `bg-blue-900/30 border-blue-500/20 text-blue-400`
  - Verde (#10B981) para gastos/investimento - `bg-green-900/30 border-green-500/20 text-green-400`
  - Violeta (#8B5CF6) para impressões - `bg-purple-900/30 border-purple-500/20 text-purple-400`
  - Índigo (#6366F1) para cliques - `bg-indigo-900/30 border-indigo-500/20 text-indigo-400`
  - Ciano (#06B6D4) para CTR - `bg-cyan-900/30 border-cyan-500/20 text-cyan-400`
  - Laranja (#F59E0B) para CPL - `bg-orange-900/30 border-orange-500/20 text-orange-400`

### Implementação
- **Estrutura de Card**:
  ```jsx
  <motion.div 
    whileHover={{ scale: 1.04 }}
    whileTap={{ scale: 0.98 }}
    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    className="bg-[color]-900/30 rounded-lg p-4 border border-[color]-500/20 hover:bg-[color]-900/40 hover:border-[color]-500/40 transition-all duration-300"
  >
    <div className="flex items-center justify-between mb-2">
      <div className="text-[color]-400 text-sm font-medium">Label da Métrica</div>
      <Icon className="w-4 h-4 text-[color]-400" />
    </div>
    <div className="text-2xl font-bold text-white">{formatNumberShort(value)}</div>
  </motion.div>
  ```

- **Grid Layout**: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4`
- **Formatação de Números**: Função `formatNumberShort()` para abreviação (k, M, B)
- **Animações**: Framer Motion com spring animation
- **Ícones**: Lucide React icons para cada métrica

### Dependências
- **Framer Motion**: Para animações de hover e tap
- **Lucide React**: Para ícones das métricas
- **Tailwind CSS**: Para estilos e cores
- **date-fns-tz**: Para formatação de datas

## UX/UI Considerations

### Efeitos Visuais
- **Hover**: Cards se expandem suavemente com sombra aumentada
- **Animações**: Transições suaves de 200ms para todas as interações
- **Tipografia**: Manter hierarquia visual existente
- **Espaçamento**: Usar grid system consistente

### Responsividade
- Cards se adaptam a diferentes tamanhos de tela
- Manter legibilidade em dispositivos móveis
- Preservar funcionalidade em todos os breakpoints

## Acceptance Criteria

1. **Consistência Visual**: Todas as páginas devem usar o mesmo padrão de cards coloridos
2. **Cores Específicas**: Cada tipo de métrica deve ter sua cor específica
3. **Efeitos de Hover**: Cards devem ter animações suaves ao passar o mouse
4. **Formatação de Números**: Números grandes devem ser formatados consistentemente (k, M, B)
5. **Responsividade**: Interface deve funcionar em desktop, tablet e mobile
6. **Funcionalidade Preservada**: Todas as funcionalidades existentes devem continuar funcionando
7. **Performance**: Animações não devem impactar a performance da aplicação

## Dependencies

- Página `/performance` já implementada como referência
- Design system existente
- Componentes de UI já criados

## Open Questions

- Algumas páginas podem precisar de ajustes específicos no layout para acomodar os cards
- Como lidar com páginas que têm muitas métricas diferentes

## Related Tasks

[View task list](./tasks.md)

[View in Backlog](../backlog.md#user-content-21) 