# PBI-18: Corrigir problemas críticos de dados e funcionalidade

## Overview
Este PBI visa resolver problemas críticos que atualmente impedem a análise de dados e o uso funcional da plataforma. O objetivo é garantir que todas as páginas principais exibam dados corretos e atualizados, que os componentes de UI respondam como esperado e que a experiência do usuário seja consistente e confiável.

## Problem Statement
A plataforma sofre com a ausência de dados em páginas essenciais, comportamento incorreto de filtros e componentes de UI, e falta de feedback claro sobre o estado do sistema (ex: status de sincronização). Isso torna o dashboard inutilizável para seu propósito principal: análise de performance de marketing. O problema mais imediato é o gráfico de pizza no dashboard, que não exibe a distribuição de leads por campanha.

## User Stories
- Como usuário, quero que a página de dashboard principal exiba um gráfico de pizza com a distribuição correta de leads por campanha para que eu possa entender rapidamente quais campanhas estão gerando mais resultados.
- Como usuário, quero que a página `/campaigns` mostre uma lista de campanhas reais com dados atualizados da Meta API para que eu possa analisar a performance de cada uma.
- Como usuário, quero que a página `/performance` seja totalmente funcional, com filtros que funcionam e dados corretos.

## Technical Approach
1.  **Diagnóstico e Correção da API (`/api/dashboard/overview`)**:
    - Investigar por que o endpoint não está retornando os dados para o gráfico de pizza (`campaignDistribution`).
    - Depurar a lógica de agregação de dados no backend, garantindo que a consulta ao Supabase e o processamento dos dados estejam corretos.
    - Implementar uma lógica robusta que busque campanhas ativas e agregue os leads correspondentes.
    - Garantir que a estrutura do JSON de resposta corresponda ao que o frontend espera.

2.  **Revisão e Correção do Frontend**:
    - Validar que o componente do gráfico de pizza (`DashboardOverview.jsx`) está consumindo corretamente a propriedade `pieData` (ou `campaignDistribution`).
    - Assegurar que os hooks de dados (`useDashboardData.ts`) manipulam o estado (loading, error, data) de forma apropriada.

3.  **Implementação de Testes**:
    - Criar testes de integração para o endpoint `/api/dashboard/overview` para validar o schema da resposta e a correção dos dados agregados.
    - Criar testes unitários para a lógica de transformação de dados, se aplicável.

## UX/UI Considerations
- O gráfico de pizza deve exibir "carregando" enquanto os dados estão sendo buscados.
- Uma mensagem de erro clara deve ser mostrada se os dados não puderem ser carregados.
- Se não houver dados de campanha para exibir, o gráfico deve mostrar um estado vazio informativo (ex: "Nenhum dado de campanha disponível").

## Acceptance Criteria
- O gráfico de pizza na página do dashboard exibe corretamente a distribuição de leads por campanha, com dados vindos da API.
- O endpoint `/api/dashboard/overview` retorna a propriedade `campaignDistribution` (ou `pieData`) com os dados agregados corretamente.
- A página não apresenta erros no console relacionados ao carregamento ou processamento desses dados.

## Dependencies
- Acesso funcional ao banco de dados Supabase (tabelas `campaigns` e `meta_leads`).

## Open Questions
- A lógica atual para determinar uma "campanha ativa" (`status = 'ACTIVE'`) está correta e alinhada com a necessidade do negócio?

## Related Tasks
- [Ver lista de tarefas](./tasks.md)

---

**Status**: Agreed  
**Priority**: Alta  
**Effort**: 3-5 dias  
**Dependencies**: Meta API, Design System 