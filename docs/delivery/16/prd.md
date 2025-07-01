# PBI-16: Atualização Automática de Anúncios Ativos

[View in Backlog](../backlog.md#user-content-16)

## Overview

Implementar um sistema automatizado para atualizar periodicamente a lista de anúncios ativos da Meta API, garantindo que o dashboard sempre exiba dados precisos e atualizados sem intervenção manual.

## Problem Statement

Atualmente, o sistema não atualiza automaticamente a lista de anúncios ativos, o que pode resultar em:
- Dados desatualizados no dashboard
- Métricas incorretas baseadas em anúncios pausados ou deletados
- Necessidade de intervenção manual para atualizar dados
- Falta de visibilidade sobre mudanças de status dos anúncios
- Performance impactada por consultas desnecessárias

## User Stories

Como usuário do dashboard, quero que o sistema atualize automaticamente a lista de anúncios ativos para que eu possa ver as métricas corretas sem intervenção manual.

## Technical Approach

### Arquitetura Proposta

1. **GitHub Actions Workflow**
   - Execução periódica (a cada 6 horas)
   - Integração com Meta API
   - Tratamento de erros e retry automático

2. **Sistema de Cache Inteligente**
   - Cache Redis/Upstash para dados frequentes
   - Invalidação automática baseada em mudanças
   - Redução de chamadas à API

3. **Monitoramento e Logs**
   - Logs estruturados com Pino
   - Métricas de performance
   - Alertas automáticos para falhas

4. **Filtro Automático no Dashboard**
   - Queries otimizadas para anúncios ativos
   - Cache de resultados
   - Fallback para dados offline

### Stack Tecnológico

- **Automação**: GitHub Actions
- **Cache**: Redis/Upstash
- **Logging**: Pino
- **Monitoramento**: Sentry + Logs customizados
- **API**: Meta Graph API v18.0
- **Banco**: Supabase (PostgreSQL)

## UX/UI Considerations

- **Indicador de Status**: Mostrar status da última sincronização
- **Notificações**: Alertas visuais para problemas de sincronização
- **Performance**: Carregamento rápido mesmo com dados em cache
- **Transparência**: Logs visíveis para debugging

## Acceptance Criteria

1. ✅ O sistema deve buscar automaticamente anúncios ativos da Meta API
2. ✅ A lista de anúncios ativos deve ser atualizada periodicamente
3. ✅ O dashboard deve usar apenas dados de anúncios ativos
4. ✅ Não deve ser necessária intervenção manual para atualizar a lista de anúncios
5. ✅ O sistema deve lidar adequadamente com mudanças de status (pausa/ativação) dos anúncios
6. ✅ A performance do dashboard não deve ser impactada negativamente
7. ✅ O sistema deve implementar cache inteligente para reduzir chamadas à API
8. ✅ Erros na atualização da lista de anúncios devem ser tratados adequadamente e registrados
9. ✅ O usuário deve ser notificado caso haja problemas na atualização dos dados

## Dependencies

- Meta API access token válido
- GitHub Actions configurado
- Supabase com permissões adequadas
- Sistema de logging implementado

## Open Questions

- Qual a frequência ideal de atualização?
- Como lidar com rate limits da Meta API?
- Qual estratégia de cache usar?
- Como implementar notificações?

## Related Tasks

[View Tasks](./tasks.md) 