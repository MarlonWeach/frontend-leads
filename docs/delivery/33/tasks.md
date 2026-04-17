# Tasks for PBI 33: Página de Metas por Adset

This document lists all tasks associated with PBI 33.

**Parent PBI**: [PBI 33: Página de Metas por Adset](./prd.md)

## Task Summary

| Task ID | Name | Status | Description |
|---------|------|--------|-------------|
| 33-1 | [Diagnosticar e restaurar acesso da página `/metas`](./33-1.md) | Done | Rota `/metas` restaurada com redirecionamento para `/dashboard/metas` e proteção no middleware |
| 33-2 | [Definir modelo de dados de metas por adset/competência](./33-2.md) | Done | Estrutura v2 definida com competência mensal, leads do cliente (D-1), `sales_cpl` manual e fórmulas oficiais de ROI/margem |
| 33-3 | [Implementar cadastro e edição de metas na UI](./33-3.md) | Done | Modal de configuração operacional implementado com persistência via API e atualização imediata do dashboard |
| 33-4 | [Implementar cálculos de entrega, gap e meta diária](./33-4.md) | Done | Cálculos atualizados para referência manual de entrega, gap restante e meta diária até fim da competência mensal |
| 33-5 | [Implementar cálculos de margem e ROI](./33-5.md) | Done | Cálculos oficiais de ROI e margem adicionados no dashboard com fallback seguro para dados de receita |
| 33-6 | [Expor dados de metas para consumo pelo PBI 32](./33-6.md) | Done | Endpoint de contexto de otimização publicado com métricas de elegibilidade dinâmica e fonte de entrega |
| 33-7 | [Testes de consistência de cálculo e integração](./33-7.md) | Done | Testes de integração adicionados para contrato de otimização cobrindo entrega manual e fallback histórico |
| 33-8 | [Volume contratado derivado na API e teste unitário](./33-8.md) | Done | `POST`/`PUT` goals normalizam `volume_contracted` a partir de budget e CPL; teste unitário da função pura |
