# Tasks for PBI 27: Predição de Performance

This document lists all tasks associated with PBI 27.

**Parent PBI**: [PBI 27: Predição de Performance](./prd.md)

## Task Summary

| Task ID | Name | Status | Description |
| :------ | :--- | :------ | :---------- |
| 27-1 | [Criar infraestrutura de dados para ML](./27-1.md) | Done | View `v_ml_adset_daily_series` aplicada, contrato documentado e smoke 90d validado em ambiente com migração aplicada |
| 27-2 | [Desenvolver modelo base de forecasting](./27-2.md) | Done | Baseline v1 validado em execução real com dados da `v_ml_adset_daily_series` e saída estável para evolução |
| 27-3 | [Implementar análise de sazonalidade](./27-3.md) | Done | Sazonalidade semanal e mensal integrada ao pipeline com metadados de força por métrica |
| 27-4 | [Criar sistema de cenários múltiplos](./27-4.md) | Done | Cenários conservador/realista/otimista entregues no payload de forecast com modelo `forecast_scenarios_v1` |
| 27-5 | [Desenvolver modelos específicos por campanha](./27-5.md) | Done | Segmentação por `campaignId`/`adsetId` concluída com fallback e comparativo segmentado vs global no payload |
| 27-6 | [Implementar sistema de validação e accuracy](./27-6.md) | Done | Accuracy com Erro Percentual Absoluto Medio (MAPE) e status implementada e persistida em histórico via `ai_analysis_logs` |
| 27-7 | [Criar interface visual de previsões](./27-7.md) | Done | Interface consolidada com cenários, painel de accuracy e filtros principais de campanha/adset |
| 27-8 | [Implementar sistema de alertas preditivos](./27-8.md) | Done | Alertas preditivos entregues no payload/UI com persistência em `alerts` e cooldown de deduplicação |
| 27-9 | [Desenvolver recomendações de orçamento](./27-9.md) | Done | Recomendações de orçamento entregues no payload/UI com ação sugerida, racional e impacto esperado |
| 27-10 | [Criar sistema de exportação executiva](./27-10.md) | Done | Exportação CSV concluída com métricas, cenários, acurácia e metadados de geração/filtros |
| 27-11 | [Implementar API de integração](./27-11.md) | Done | API de forecast consolidada com filtros e documentação de contrato, erros e uso |
| 27-12 | [Testes E2E e validação do sistema completo](./27-12.md) | Done | Validação técnica consolidada com lint/type-check e execuções reais de endpoint; riscos residuais documentados |