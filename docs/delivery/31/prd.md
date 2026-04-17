# PBI-31: Governança de Backlog e Priorização

## Overview
Estabelecer governança explícita do backlog para registrar decisões de prioridade, despriorização e migração de escopo, mantendo rastreabilidade e foco de execução.

## Problem Statement
- Há tarefas abertas sem prioridade imediata que geram ruído de planejamento.
- Alguns escopos exigem PBI dedicado antes de iniciar desenvolvimento.
- Status entre backlog e `tasks.md` pode ficar desalinhado sem rotina de governança.

## User Stories
- Como responsável pelo produto, quero backlog limpo e priorizado para facilitar decisão.
- Como equipe, quero rastrear claramente quando um escopo foi adiado, migrado ou encerrado.
- Como operação, quero previsibilidade do que entra na próxima execução.

## Technical Approach
1. Revisar PBIs e tasks em aberto.
2. Classificar itens: manter, bloquear, despriorizar, migrar para PBI dedicado.
3. Atualizar status de forma consistente entre `backlog.md` e `tasks.md`.
4. Registrar racional das decisões nos documentos de task.

## UI
Sem mudanças de UI de produto (escopo documental/processual).

## Conditions of Satisfaction (CoS)
1. PBIs despriorizados marcados formalmente no backlog.
2. Tasks sem aderência ao estado atual do produto marcadas com status coerente.
3. Escopo da antiga `22-13` migrado para PBI dedicado.
4. Backlog e tarefas sincronizados após revisão.

## Dependencies
- `docs/delivery/backlog.md`
- `docs/delivery/*/tasks.md`

## Open Questions
- Frequência ideal de revisão de backlog (semanal/quinzenal).
- Critério objetivo para migração de task para PBI dedicado.

## Related Tasks
- [tasks.md](./tasks.md)

[Back to Backlog](../backlog.md)
