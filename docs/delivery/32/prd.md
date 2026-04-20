# PBI-32: Otimizações Baseadas em Dados Reais da Meta API

## Overview
Criar um PBI dedicado para planejar e implementar otimizações orientadas por evidências reais da Meta API, com critérios técnicos claros antes da fase de desenvolvimento e com rollout controlado para reduzir risco de recomendações incorretas.

## Problem Statement
- A antiga task `22-13` possui escopo amplo e precisa de refinamento estrutural.
- Sem definição clara de fontes, confiança estatística e UX de recomendação, há risco de otimizações incorretas.
- Sem governança de decisão (aplicar/descartar) e sem auditoria de impacto, a equipe perde rastreabilidade.
- Sem baseline e critérios de sucesso, não é possível provar que as recomendações melhoram resultado.

## User Stories
- Como gestor de performance, quero recomendações baseadas em dados reais para reduzir decisões subjetivas.
- Como equipe técnica, quero critérios de evidência e validação claros antes de automatizar otimizações.
- Como produto, quero rollout seguro com rastreabilidade de impacto.
- Como analista, quero visualizar o racional da recomendação (evidência + confiança) para decidir com segurança.

## Technical Approach
1. Definir modelo de evidência:
   - métricas mínimas por entidade (campaign/adset/ad);
   - janela temporal mínima;
   - regra de elegibilidade para recomendações.
2. Definir arquitetura de recomendação:
   - ingestão e agregação;
   - camada de scoring;
   - geração de explicação por recomendação.
3. Definir UX de decisão:
   - estados (ativa, aplicada, descartada, expirada);
   - trilha de decisão por usuário;
   - visual de confiança e impacto esperado.
4. Definir validação técnica:
   - validação offline com histórico;
   - piloto controlado;
   - critérios de promoção para rollout.

## Escopo Funcional (MVP)
- Recomendações assistidas (sem aplicação automática no início).
- Tipos iniciais de recomendação:
  - ajuste de budget por eficiência relativa;
  - ajuste de horário/dia com base em performance histórica;
  - priorização de adsets/campaigns com maior probabilidade de meta.
- Evidência obrigatória em cada recomendação:
  - período analisado;
  - métricas base;
  - comparação versus baseline;
  - nível de confiança.

## Escopo Fora do MVP
- Aplicação automática sem aprovação humana.
- Modelos avançados de ML com treinamento contínuo.
- Recomendações por criativo multimodal (imagem/vídeo) em tempo real.

## UI
- Painel de recomendações com justificativa por métrica.
- Sinalização de confiança da recomendação.
- Ações explícitas de aplicar/descartar com log de decisão.
- Detalhes de evidência expandíveis por item (janela, amostra e variações).
- Filtros por status e prioridade operacional.

## Conditions of Satisfaction (CoS)
1. Escopo técnico fechado em documento antes de codar.
2. Critérios de confiança e elegibilidade definidos.
3. Plano de validação com métricas de sucesso aprovado.
4. Tasks de implementação quebradas em unidades pequenas e testáveis.
5. Definição de guardrails de risco por tipo de recomendação.
6. Estratégia de observabilidade e auditoria definida.

## Dependencies
- Dados consolidados da Meta API em tabelas de performance.
- Padrão de auditoria já existente no sistema.
- Disponibilidade das dimensões analíticas necessárias no pipeline atual.
- Definição de responsáveis de negócio para aprovação de rollout.
- Disponibilidade dos dados de meta contratada por adset (PBI 33).

## Open Questions
- Quais contas entram no piloto inicial?
- Qual regra de fallback quando o adset não possui meta cadastrada?

## Decisões já tomadas
- Janela do MVP: 7 dias.
- Piloto inicial: por conta.
- Objetivo final: operação por adset.
- Cadência de recomendação: diária.
- Prioridade de scoring: CPL > spend efficiency > volume de leads.
- Elegibilidade de volume: dinâmica, baseada em meta contratada (sem limiar fixo global).
- TTL padrão de recomendação ativa: 24h.
- Guardrails de budget:
  - aumento de até 20% por ajuste;
  - máximo de 4 ajustes de +20% em 6 horas;
  - sem limite fixo para redução no MVP.

## Métricas de Sucesso
- Adoção:
  - taxa de recomendações analisadas pelo time;
  - taxa de recomendações aplicadas.
- Qualidade:
  - proporção de recomendações com evidência completa;
  - precisão percebida (aceitação sem override imediato).
- Impacto:
  - variação de CPL, leads e spend efficiency versus baseline do período anterior.

## Riscos e Mitigações
- Risco de falsa causalidade em janelas curtas:
  - mitigar com thresholds mínimos de amostra e estabilidade.
- Risco de recomendação agressiva de budget:
  - mitigar com limites de ajuste por janela e aprovação manual.
- Risco de baixa confiança dos usuários:
  - mitigar com explicabilidade clara e histórico de decisões.

## Related Tasks
- [tasks.md](./tasks.md)
- [32-3 — contrato API e persistência](./32-3.md) (fechado para implementação na 32-6/32-7)
- [32-4 — UX e fluxo de decisão](./32-4.md) (fechado para implementação na 32-7)
- [32-5 — validação offline e piloto](./32-5.md) (fechado; execução na 32-8)
- [32-6 — base técnica MVP](./32-6.md) (migration + agregação 7d; wire nas APIs na 32-7)
- [32-7 — motor assistido + APIs + UI](./32-7.md) (entregue; build global do repo pode falhar por rotas legadas)

[Back to Backlog](../backlog.md)
