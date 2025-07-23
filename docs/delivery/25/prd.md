# PBI-25: Otimização Automática de Campanhas

## Overview

Sistema inteligente que otimiza automaticamente a distribuição de orçamento das campanhas de Lead Ads, focando em **gerar o lead mais qualificado possível, com o volume mais próximo do ideal possível e com o custo mais baixo possível**, aplicando sugestões de IA de forma semi-automática respeitando metas contratuais de volume.

## Problem Statement

Atualmente, gestores de marketing precisam:
- Monitorar manualmente se estão atingindo volumes de leads contratados
- Realizar ajustes de orçamento sem considerar metas diárias de volume
- Balancear entre qualidade, volume e custo de forma manual
- Evitar que ajustes de budget coloquem adsets em modo de aprendizado
- Analisar manualmente se adsets estão performando abaixo ou acima do ideal
- Perder oportunidades de otimização por não conseguir monitorar metas 24/7

## User Stories

### Como Gestor de Marketing
- Quero definir metas contratuais (budget, CPL, volume de leads) por adset
- Quero que o sistema calcule automaticamente quantos leads preciso gerar por dia
- Quero receber alertas quando estou abaixo ou acima do volume ideal
- Quero que ajustes de budget respeitem limites para não ativar modo de aprendizado
- Quero ver sugestões de otimização de audiência sem aplicação automática

### Como Analista de Performance
- Quero acompanhar progresso diário vs meta contratada
- Quero ver histórico de ajustes de budget e seus impactos
- Quero analisar sugestões de segmentação antes de aplicar

## Technical Approach

### Arquitetura
- **Goal Management System**: Interface para configurar metas por adset
- **Volume Calculator**: Calcula leads necessários por dia baseado em progresso
- **Budget Optimizer**: Otimiza budget respeitando incrementos de 20%
- **Quality Analyzer**: Analisa qualidade dos leads gerados
- **Audience Analyzer**: Gera sugestões de segmentação (não aplicação automática)

### Algoritmos Principais
1. **Volume-based Budget Allocation**: Ajusta budget baseado em gap de volume vs meta
2. **Quality Score Calculator**: Pontuação de qualidade dos leads por adset
3. **Progressive Budget Increase**: Aumentos graduais de 20% respeitando limites da Meta
4. **Audience Performance Analysis**: Análise de segmentação Advantage+ e sugestões

### Stack Tecnológico
- **Frontend**: React/Next.js para interface de configuração de metas
- **Backend**: Node.js/Supabase Edge Functions para cálculos
- **IA**: OpenAI GPT-4 para análise de qualidade e sugestões
- **Database**: PostgreSQL para metas e histórico
- **Scheduler**: GitHub Actions/Cron Jobs limitado a 4x por hora

## UX/UI Considerations

### Interface de Configuração de Metas
- Formulário por adset: Budget Total, CPL Alvo, Volume Contratado
- Data início/fim do período contratual
- Campo para volume já captado pelo cliente (atualização manual)
- Visualização de leads necessários por dia (calculado automaticamente)

### Dashboard de Acompanhamento
- Progress bar: Volume atual vs meta diária/mensal
- Alertas visuais: "Abaixo da Meta", "No Alvo", "Acima da Meta"
- Histórico de ajustes de budget com timestamps
- Qualidade média dos leads por adset

### Sistema de Sugestões (Não-Automático)
- Sugestões de otimização de audiência com justificativa
- Preview do impacto estimado antes da aplicação
- Botões: "Aplicar na Meta", "Salvar para Depois", "Descartar"
- Histórico de sugestões aceitas/rejeitadas

## Acceptance Criteria

1. **Interface de Configuração de Metas**
   - [ ] Formulário para definir: Budget, CPL alvo, Volume contratado, Datas
   - [ ] Campo para inserir volume já captado pelo cliente
   - [ ] Cálculo automático de leads necessários por dia
   - [ ] Validação de campos obrigatórios e formatos

2. **Sistema de Monitoramento de Volume**
   - [ ] Tracking diário do progresso vs meta
   - [ ] Cálculo de gap diário (leads em falta ou excesso)
   - [ ] Projeção se vai atingir meta no prazo atual
   - [ ] Alertas quando desvio > 15% da meta diária

3. **Otimização de Budget com Regras Específicas**
   - [ ] Incrementos máximos de 20% por ajuste
   - [ ] Limite de 4 ajustes por hora por adset
   - [ ] Cálculo inteligente: se precisa +100%, divide em 5 incrementos de 20%
   - [ ] Log detalhado de todos os ajustes com horários

4. **Análise de Qualidade de Leads**
   - [ ] Score de qualidade baseado em dados históricos de conversão
   - [ ] Comparação de qualidade entre adsets
   - [ ] Alerta quando qualidade cai significativamente
   - [ ] Priorização de volume com qualidade

5. **Sistema de Sugestões de Audiência (Não-Automático)**
   - [ ] Análise de performance de audiências Advantage+
   - [ ] Sugestões de otimização com justificativa detalhada
   - [ ] Interface para revisar e decidir sobre aplicação
   - [ ] Tracking de sugestões aceitas vs impacto real

6. **Dashboard de Controle Executivo**
   - [ ] Visão consolidada: todos os adsets e suas metas
   - [ ] Status visual: verde (no alvo), amarelo (atenção), vermelho (crítico)
   - [ ] Projeções de atingimento de meta
   - [ ] Resumo de ações de otimização sugeridas/aplicadas

7. **Sistema de Alertas Inteligentes**
   - [ ] Alerta quando adset está 20% abaixo da meta diária
   - [ ] Notificação quando CPL ultrapassa meta em 15%
   - [ ] Alerta quando qualidade de leads diminui
   - [ ] Resumo diário de performance vs metas

8. **Integração Meta API com Limitações**
   - [ ] Aplica apenas ajustes de budget (não audiência)
   - [ ] Respeita rate limits e intervalos mínimos
   - [ ] Backup antes de qualquer mudança
   - [ ] Rollback automático se performance piora >30%

9. **Relatórios de Performance**
   - [ ] Relatório diário: progresso vs meta por adset
   - [ ] Análise semanal de qualidade de leads
   - [ ] ROI ajustado considerando volume e qualidade
   - [ ] Comparativo de performance pré/pós otimizações

10. **Sistema de Configuração Flexível**
    - [ ] Margem de tolerância configurável por adset (padrão 15%)
    - [ ] Horários permitidos para ajustes de budget
    - [ ] Limite máximo de budget por adset
    - [ ] Configuração de qualidade mínima aceitável

## Dependencies

### Internas
- Sistema de IA existente (PBI 22/24)
- Meta API integration
- Sistema de alertas e notificações
- Dados históricos de qualidade de leads

### Externas
- OpenAI API para análise de qualidade e sugestões
- Meta Business API para aplicar mudanças de budget
- Sistema de agendamento respeitando limite de 4x/hora

## Open Questions

1. **Qualidade de Leads**: Como definir score de qualidade? Baseado em conversão, engajamento, dados demográficos?
2. **Margem de Tolerância**: 15% é adequado ou deveria ser configurável por cliente?
3. **Horários de Ajuste**: Restringir ajustes de budget a horários comerciais?
4. **Rollback Automático**: Em que condições fazer rollback automático de aumentos de budget?
5. **Advantage+ Analysis**: Como analisar performance de audiências Advantage+ sem acesso a dados detalhados?

## Related Tasks

[Tasks detalhadas em tasks.md]

---

[Back to Backlog](../backlog.md) 