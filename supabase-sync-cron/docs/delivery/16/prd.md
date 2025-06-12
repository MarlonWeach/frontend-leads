# PBI-16: Implementar Filtragem Automática de Anúncios Ativos

[View in Backlog](../backlog.md#user-content-16)

## Overview
Este PBI visa implementar um sistema automático para gerenciar e atualizar a lista de anúncios ativos da Meta, eliminando a necessidade de intervenção manual e garantindo que o dashboard sempre exiba dados precisos e atualizados.

## Problem Statement
Atualmente, o sistema requer intervenção manual para atualizar a lista de anúncios ativos, o que é:
- Insustentável devido à frequência de mudanças de status dos anúncios
- Propenso a erros humanos
- Não escalável
- Prejudicial à experiência do usuário
- Causa dados incorretos no dashboard

## User Stories
1. Como usuário do dashboard, quero que o sistema atualize automaticamente a lista de anúncios ativos para que eu possa ver as métricas corretas sem intervenção manual
2. Como usuário, quero ser notificado caso haja problemas na atualização dos dados para que eu possa tomar ações apropriadas
3. Como usuário, quero que o dashboard continue performando bem mesmo com a atualização automática dos dados

## Technical Approach
1. **Integração com Meta API**:
   - Implementar chamada ao endpoint `/ads` com filtro `effective_status=ACTIVE`
   - Criar serviço dedicado para gerenciar a comunicação com a Meta API
   - Implementar sistema de cache para reduzir chamadas à API

2. **Sistema de Atualização**:
   - Criar job periódico para atualizar a lista de anúncios ativos
   - Implementar mecanismo de cache com TTL apropriado
   - Desenvolver sistema de retry para falhas temporárias

3. **Integração com Dashboard**:
   - Modificar a API de overview para usar a lista atualizada de anúncios ativos
   - Implementar sistema de notificação para erros
   - Otimizar queries para manter performance

4. **Monitoramento e Logging**:
   - Implementar logging estruturado para rastrear atualizações
   - Criar métricas para monitorar o sistema
   - Desenvolver alertas para falhas críticas

## UX/UI Considerations
1. **Feedback Visual**:
   - Indicador de última atualização dos dados
   - Notificações claras para erros
   - Loading states apropriados durante atualizações

2. **Performance**:
   - Manter tempo de resposta do dashboard abaixo de 2 segundos
   - Implementar loading progressivo
   - Otimizar renderização de componentes

## Acceptance Criteria
1. O sistema deve buscar automaticamente anúncios ativos da Meta API
2. A lista de anúncios ativos deve ser atualizada a cada 15 minutos
3. O dashboard deve usar apenas dados de anúncios ativos
4. Não deve ser necessária intervenção manual para atualizar a lista de anúncios
5. O sistema deve lidar adequadamente com mudanças de status (pausa/ativação) dos anúncios
6. A performance do dashboard não deve ser impactada negativamente
7. O sistema deve implementar cache inteligente para reduzir chamadas à API
8. Erros na atualização da lista de anúncios devem ser tratados adequadamente e registrados
9. O usuário deve ser notificado caso haja problemas na atualização dos dados

## Dependencies
1. Acesso à Meta API com permissões adequadas (já confirmado)
2. Sistema de cache existente (React Query)
3. Sistema de logging (já implementado)
4. Sistema de notificação (já implementado)

## Open Questions
1. Qual o intervalo ideal para atualização da lista de anúncios ativos?
2. Como lidar com falhas temporárias da Meta API?
3. Qual a estratégia de cache mais adequada?

## Related Tasks
[Ver Lista de Tasks](./tasks.md) 