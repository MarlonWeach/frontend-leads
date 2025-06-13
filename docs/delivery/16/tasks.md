# Tasks for PBI 16: Implementar Filtragem Automática de Anúncios Ativos

This document lists all tasks associated with PBI 16.

**Parent PBI**: [PBI 16: Implementar Filtragem Automática de Anúncios Ativos](./prd.md)

## Task Summary

| Task ID | Name | Status | Description |
| :------ | :--------------------------------------- | :------- | :--------------------------------- |
| 16-1 | [Implementar serviço de integração com a Meta API](./16-1.md) | Done | Criar serviço para buscar anúncios ativos via Meta API |
| 16-2 | [Implementar sincronização de status dos anúncios](./16-2.md) | Done | Desenvolver sistema de sincronização periódica de status com rate limiting e autenticação |
| 16-3 | [Atualizar queries do Supabase](./16-3.md) | Done | Modificar queries para usar dados de status atualizados |
| 16-4 | [Implementar cache de dados](./16-4.md) | Done | Criar sistema de cache para reduzir chamadas à API |
| 16-5 | [Atualizar dashboard para usar novos dados](./16-5.md) | Done | Modificar frontend para exibir dados filtrados corretamente |
| 16-6 | [Implementar testes E2E](./16-6.md) | InProgress | Criar testes end-to-end para validar fluxo completo |

### 16-6.1 Dashboard E2E
- [ ] Exibir métricas de anúncios ativos usando dados reais do Supabase
- [ ] Atualizar dados ao mudar período (filtros de data) com dados reais
- [ ] Exibir mensagem de erro quando a API falhar (simulação e fallback real)
- [ ] Exibir dados corretamente no dashboard (leads, vendas, performance) a partir do Supabase
- [ ] Atualizar dados manualmente e garantir atualização do cache
- [ ] Lidar corretamente com erros de API e Supabase

### 16-6.2 Performance e Cache E2E
- [ ] Carregar dashboard em menos de 2 segundos com dados reais
- [ ] Manter performance com grande volume de anúncios ativos do Supabase
- [ ] Lidar com múltiplas atualizações simultâneas sem inconsistência
- [ ] Otimizar requisições usando cache real (TTL, invalidação)
- [ ] Lidar com concorrência de usuários acessando dados reais
- [ ] Usar cache para requisições subsequentes
- [ ] Invalidar cache após TTL expirar
- [ ] Manter consistência dos dados em cache

### 16-6.3 Resiliência e Recuperação E2E
- [ ] Recuperar após falha temporária da API da Meta (simulação e fallback real)
- [ ] Lidar corretamente com cenário sem anúncios ativos (dados reais)
- [ ] Lidar corretamente com timeout da API da Meta
- [ ] Manter dados em cache durante falha da API
- [ ] Lidar corretamente com falhas do Supabase

### 16-6.4 Sincronização de Anúncios E2E
- [ ] Sincronizar anúncios ativos e atualizar métricas usando dados reais do Supabase
- [ ] Lidar com erros durante a sincronização
- [ ] Atualizar métricas ao mudar período (filtros de data)
- [ ] Sincronizar anúncios ativos corretamente (status dinâmico)
- [ ] Atualizar dados quando um anúncio muda de status 