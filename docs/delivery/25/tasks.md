# Tasks for PBI 25: Otimização Automática de Metas por Adset

This document lists all tasks associated with PBI 25.

**Parent PBI**: [PBI 25: Otimização Automática de Metas por Adset](./prd.md)

## Task Summary

| Task ID | Name | Status | Description |
| :------ | :--------------------------------------- | :------- | :--------------------------------- |
| 25-1 | [Criar interface de configuração de metas por adset](./25-1.md) | Done | Interface e API para definir budget, CPL alvo, volume contratado |
| 25-2 | [Desenvolver sistema de cálculo de leads necessários por dia](./25-2.md) | Done | Sistema de cálculo diário baseado em progresso vs meta |
| 25-3 | [Implementar sistema de monitoramento de volume vs meta](./25-3.md) | Done | Tracking diário com alertas de desvio de meta |
| 25-4 | [Criar sistema de otimização de budget com regras de 20%](./25-4.md) | Done | Otimização com limite de 20% e máximo 4 ajustes/hora |
| 25-5 | [Desenvolver sistema de análise de qualidade de leads](./25-5.md) | Done | Análise e scoring baseado em dados históricos |
| 25-6 | [Sistema de Sugestões de Audiência Advantage+](./25-6.md) | Done | Análise e sugestões sem aplicação automática |
| 25-7 | [Dashboard de Acompanhamento de Metas](./25-7.md) | Done | Interface visual para monitorar progresso em tempo real |
| 25-8 | [Sistema de Logs e Controle de Ajustes](./25-8.md) | Done | Logging detalhado de ajustes de budget com limite de 4x por hora |
| 25-9 | [Integração Meta API para Ajustes de Budget](./25-9.md) | Done | Aplicação automática de ajustes de budget via Meta Business API |
| 25-10 | [Sistema de Alertas Inteligentes](./25-10.md) | Done | Notificações para desvios de meta, CPL elevado e queda de qualidade |
| 25-11 | [Melhorar Interface do Dashboard de Metas](./25-11.md) | Done | Usar layout padrão, adicionar menu lateral e implementar botões |
| 25-12   | [Refatorar endpoint /api/adset-goals/dashboard para dados reais](./25-12.md) | Done | Buscar adsets reais do mês vigente com >50 impressões, cruzando com metas |
| 25-13   | [Ajustar frontend para aceitar campos nulos e exibir aviso visual](./25-13.md) | Done | Exibir aviso visual no card quando faltar informação essencial |
| 25-14   | [Atualizar hook useAdsetGoals para nova estrutura da API](./25-14.md) | Done | Remover mocks e consumir apenas dados reais |
| 25-15   | [Remover completamente o uso de dados mock do dashboard de metas](./25-15.md) | Done | Garantir que apenas dados reais sejam exibidos |
| 25-16   | [Adicionar filtro de data (timeframe) no dashboard/metas](./25-16.md) | Done | Permitir seleção de Hoje, Ontem, Últimos 7 dias, etc. |
| 25-17   | [Ajustar cálculo de progresso e status de adsets com meta](./25-17.md) | Done | Corrigir cálculo de progresso, leads/dia, status e exibição de alertas conforme dados reais do período da meta |
| 25-18   | [Adicionar botão 'Configurar Meta' e modal de cadastro/edição](./25-18.md) | Done | Permitir cadastro/edição de meta (budget, cpl_target, volume, datas) | 
| 25-19   | [Corrigir filtro de data/timeframe do dashboard de metas](./25-19.md) | Done | Corrigir para que a seleção do período seja mantida corretamente no estado e refletida no label do botão, mesmo após navegação, reload ou troca de filtros. Garantir comportamento idêntico ao dashboard de /ads. | 