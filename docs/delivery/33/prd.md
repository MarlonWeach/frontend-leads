# PBI-33: Página de Metas por Adset

## Overview
Restaurar e implementar a página `/metas` como núcleo operacional para cadastro de metas mensais por adset, acompanhamento de ritmo de entrega e cálculo de indicadores comerciais (margem e ROI), servindo de base para recomendações de otimização.

## Problem Statement
- A página `/metas` aparece no menu, mas atualmente não está acessível para uso.
- Sem meta contratada por adset, o sistema não consegue calcular ritmo esperado real de entrega.
- PBIs de otimização (como o PBI 32) ficam sem referência operacional para priorizar ações.

## User Stories
- Como gestor, quero cadastrar volume de leads contratado por adset para cada mês.
- Como gestor, quero ver quanto falta entregar e quanto precisa ser entregue por dia para cumprir contrato.
- Como operação, quero ver CPL de venda e indicadores de margem/ROI para guiar decisão.
- Como time de otimização, quero consumir dados de metas para priorizar recomendações por impacto comercial.

## Technical Approach
1. Reabilitar rota e acesso da página `/metas`.
2. Definir modelo de dados de metas por adset e competência mensal.
3. Implementar cálculo de:
   - entrega acumulada;
   - gap de entrega;
   - meta diária necessária;
   - indicadores de margem e ROI.
4. Publicar fonte de dados para consumo por outros PBIs (incluindo PBI 32).

## UI
- Tabela/lista de adsets com:
  - meta mensal contratada;
  - realizado no mês;
  - gap de entrega;
  - meta diária restante;
  - CPL de venda;
  - margem e ROI.
- Formulário de cadastro/edição por adset.
- Filtros por conta, campanha, adset e competência.

## Conditions of Satisfaction (CoS)
1. Página `/metas` acessível no fluxo normal do sistema.
2. Cadastro e edição de metas mensais por adset funcionando.
3. Cálculos de ritmo e gap de entrega corretos e reproduzíveis.
4. Cálculo de margem e ROI documentado com fórmula clara.
5. Dados de metas disponíveis para integração com o PBI 32.

## Dependencies
- Dados consolidados de performance por adset.
- Mapeamento confiável entre adset e conta/campanha.
- Regras comerciais para cálculo de margem e ROI.

## Open Questions
- Origem operacional definitiva do dado `client_reported_leads` (manual contínuo na UI vs integração futura com planilha).

## Related Tasks
- [tasks.md](./tasks.md) (inclui [33-8](./33-8.md): volume contratado derivado na API)
- Dependência direta para [PBI 32](../32/prd.md)

## Decisões já tomadas
- Conta inicial do piloto: `META_ACCOUNT_ID=256925527`.
- Sem meta cadastrada para adset: usar baseline histórico.
- Fórmula de ROI oficial:
  - `ROI (%) = ((receita_gerada - investimento) / investimento) * 100`.
- Fórmula de margem oficial:
  - `Margem (%) = ((revenue - custo) / revenue) * 100`.
- Competência mensal armazenada como primeiro dia do mês (`YYYY-MM-01`), com cálculo operacional até o último dia do mês.
- `sales_cpl` definido como input manual.

[Back to Backlog](../backlog.md)
