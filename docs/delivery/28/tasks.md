# Tasks for PBI 28: Padronização de Layout, Dados e Funcionalidades do Dashboard

This document lists all tasks associated with PBI 28.

**Parent PBI**: [PBI 28: Padronização de Layout, Dados e Funcionalidades do Dashboard](./prd.md)

## Task Summary

| Task ID | Name | Status | Description |
|---------|------|--------|-------------|
| 28-1 | Padronizar layout e componentes de UI | InProgress | Estabilização inicial de runtime: corrigir erros de console/API e alinhar componentes críticos de UI |
| 28-2 | Corrigir logs de atividade recente | Done | Corrigir exibição de logs de ALTERAÇÕES relevantes da Meta |
| 28-3 | Corrigir formatação de valores de spend nos gráficos | Done | Padronizar formatação de valores monetários (R$) em todos os gráficos |
| 28-4 | Remover gráfico de tendências de performance | Done | Remover gráfico de tendências de performance de /performance |
| 28-5 | Corrigir tooltip do heatmap de performance | Done | Corrigir tooltip do heatmap de performance |
| 28-6 | Corrigir dados zerados no heatmap após 17/07 | Done | Corrigir problema onde o heatmap de performance não exibe dados após 17/07 |
| 28-7 | Corrigir dados inconsistentes em insights de performance | Done | Corrigir dados inconsistentes em insights de performance que estavam exibindo variações incorretas |
| 28-8 | Corrigir defasagem de 1 dia nas previsões de performance | Done | Corrigir problema onde as previsões de performance tinham defasagem de 1 dia |
| 28-9 | Corrigir overflow da tabela de campanhas em /performance | Done | Corrigir problema de overflow na tabela de campanhas na página de performance |
| 28-10 | Padronizar layout dos botões em /campanhas | Done | Padronizar o layout dos botões na página de campanhas |
| 28-11 | Mover resumo do período para o topo da página | Done | Mover o resumo do período selecionado para o topo da página |
| 28-12 | Exibir detalhes do criativo (imagem, etc) em /ads | Done | Refatorar página /ads para focar apenas em métricas, removendo dependências de criativo/texto/imagem devido a bloqueios da Meta API |
| 28-13 | Apontar ausência de implementação em /leads e /configurações, e planejar desenvolvimento dessas páginas | Done | Apontar ausência de implementação em /leads e /configurações, e planejar desenvolvimento dessas páginas | 
| 28-14 | Fortalecer workflow de sync de leads no GitHub Actions | Done | Job usa sync-meta-leads.js, secrets META_FORM_ID/META_PAGE_ID, pipefail, avisos quando zero leads com fontes consultadas; CI validado em producao |
| 28-15 | Consolidar docs recovery/sync, scripts operacionais e remover cópias locais | Done | docs/operations/ + README; scripts e supabase-recovery.sql versionados; removidos frontend-leads/ e frontend-leads-1/; gitignore |
| 28-16 | Corrigir defasagem e ordenação do heatmap de performance | Done | Ajustar timezone (America/Sao_Paulo) e ordenação diária do heatmap para eliminar deslocamento D-1 observado entre dashboard e Meta |
| 28-17 | Investigar e corrigir divergência de dados históricos vs Meta | Done | Resolver discrepâncias de métricas em datas antigas (ex.: dia 10 para trás) entre Supabase/heatmap e Meta após sync |
| 28-18 | Automatizar reconciliação diária do heatmap vs SQL | Done | Criar auditoria automatizada para comparar totais diários da API `/api/performance/comparisons` com agregação oficial de `adset_insights` e detectar regressões |
| 28-19 | Estabilizar infraestrutura do Playwright no CI | InProgress | Ajustar execução E2E para ambiente determinístico (build/start, artefatos e base URL) e reduzir flakiness estrutural |
| 28-20 | Corrigir suíte de acessibilidade E2E com critérios robustos | InProgress | Reescrever asserts frágeis em `accessibility.spec.ts` para critérios verificáveis e estáveis entre browsers |
| 28-21 | Isolar testes de IA E2E de dependências externas | InProgress | Mockar endpoints de IA no Playwright para evitar falha por quota/rate-limit e validar UX de sucesso/erro de forma determinística |
| 28-22 | Corrigir fallback indevido em Variações e Performance (IA) | InProgress | Investigar e corrigir motivo do aviso de fallback ativo nas análises de IA de `/performance` |
| 28-23 | Tratar 429 em otimização de IA com resiliência e UX | InProgress | Implementar tratamento robusto para `429 Too Many Requests` em `/api/ai/optimization` com feedback claro e comportamento degradado |
| 28-24 | Atualizar modelo Claude e Meta API para versões vigentes | InProgress | Atualizar configuração Anthropic para novo modelo Haiku e padronizar chamadas Meta Graph API para `v25.0` |