# PBI-22: Integração de Inteligência Artificial (IA) no Dashboard

## Overview
Implementar recursos de inteligência artificial no dashboard para análise automática de performance, detecção de anomalias, sugestões de otimização e assistente virtual, tornando a gestão de campanhas mais inteligente e proativa.

## Problem Statement
Atualmente, a análise de dados e identificação de oportunidades depende de interpretação manual. O uso de IA permitirá análises automáticas, insights em linguagem natural e respostas rápidas a dúvidas, elevando o nível de automação e inteligência do produto.

## User Stories
- Como usuário, quero ver análises automáticas de performance em linguagem natural.
- Como usuário, quero que o sistema detecte anomalias e me alerte automaticamente.
- Como usuário, quero receber sugestões de otimização baseadas em IA.
- Como usuário, quero poder tirar dúvidas sobre campanhas com um assistente virtual.

## Technical Approach
- Integração com a API da OpenAI para análises e geração de insights.
- Criação de painel de IA na página de performance.
- Implementação de endpoints e hooks para análise, detecção de anomalias e sugestões.
- Estrutura modular para expansão futura (ex: geração de copies, benchmarking).

## UX/UI Considerations
- Painel de IA destacado na página de performance.
- Feedback visual de loading, sucesso e erro.
- Resultados apresentados em cards claros, com ícones e cores para cada tipo de insight.

## Acceptance Criteria
- [ ] Painel de IA disponível na página de performance
- [ ] Análise de performance em linguagem natural funcionando
- [ ] Detecção de anomalias automática
- [ ] Sugestões de otimização baseadas em IA
- [ ] Assistente virtual básico disponível
- [ ] Documentação clara sobre configuração da chave da OpenAI

## Dependencies
- Conta na OpenAI e chave de API válida
- Conexão estável com a internet para chamadas à API

## Open Questions
- Quais limites de uso da API OpenAI serão aplicados?
- O assistente virtual responderá apenas sobre dados ou também sobre melhores práticas?

## Related Tasks
[Ver lista de tarefas](./tasks.md)

---

### Observação importante sobre a chave da OpenAI

Para que os recursos de IA funcionem, é necessário obter uma chave de API da OpenAI e adicioná-la ao arquivo `.env.local` na raiz do projeto:

```
OPENAI_API_KEY=sua_chave_aqui
```

**Como obter a chave:**
1. Acesse https://platform.openai.com/api-keys
2. Crie uma conta (ou faça login)
3. Clique em "Create new secret key"
4. Copie a chave gerada e cole no arquivo `.env.local` conforme acima
5. Salve o arquivo e reinicie o servidor

Sem essa chave, os recursos de IA não funcionarão e o painel exibirá mensagens de erro.

[View in Backlog](../backlog.md#user-content-22)

## Status: ✅ CONCLUÍDO

**Data de Conclusão**: 27 de Janeiro de 2025  
**Todas as 11 tarefas foram implementadas com sucesso**

### Funcionalidades Implementadas

✅ **Integração OpenAI**: Configuração completa da API com variáveis de ambiente  
✅ **Painel de IA**: Interface moderna na página de performance com design glassmorphism  
✅ **Análise em Linguagem Natural**: IA gera insights automáticos sobre métricas  
✅ **Detecção de Anomalias**: Sistema inteligente que identifica padrões suspeitos  
✅ **Sugestões de Otimização**: Recomendações baseadas em IA para melhorar performance  
✅ **Assistente Virtual**: Chat interativo para consultas e análises  
✅ **Monitoramento de Custos**: Widget para acompanhar uso da OpenAI  
✅ **Premissas Heurísticas**: Documentação específica do setor automotivo  
✅ **Benchmarks Automotivos**: Métricas de referência por categoria de veículo  
✅ **Indicadores de Qualidade**: Sistema de scoring para leads  
✅ **Melhorias de UI**: Cores padronizadas, filtros avançados e análise individual  

### Melhorias de UI e Funcionalidade (Tarefa 22-11)

✅ **Cores Padronizadas**: Botões de IA seguem o padrão dos cards de métricas  
✅ **Filtros Avançados**: Filtros de campanha e adset no painel de IA  
✅ **Análise Individual**: Botões de análise de IA em cada item das páginas:
- Campanhas: Botão de análise em cada card de campanha
- AdSets: Botão de análise em cada linha da tabela
- Ads: Botão de análise em cada linha da tabela
✅ **Modal de Análise**: Interface dedicada para análise individual de campanhas, adsets e ads

## Critérios de Aceitação

- [x] Sistema de IA integrado e funcional
- [x] Interface intuitiva e responsiva
- [x] Análises em linguagem natural
- [x] Detecção automática de anomalias
- [x] Sugestões de otimização contextualizadas
- [x] Chat assistant interativo
- [x] Monitoramento de custos da OpenAI
- [x] Documentação completa das premissas heurísticas
- [x] Benchmarks específicos do setor automotivo
- [x] Indicadores de qualidade de leads
- [x] Cores padronizadas nos botões de IA
- [x] Filtros de campanha e adset no painel de IA
- [x] Botões de análise individual em todas as páginas

## Arquivos Principais

- `src/components/ai/AIPanel.tsx` - Painel principal de IA
- `src/components/ai/IndividualAnalysis.tsx` - Modal de análise individual
- `src/hooks/useAIAnalysis.ts` - Hook para análises de IA
- `src/hooks/useAnomalyDetection.ts` - Hook para detecção de anomalias
- `src/lib/ai/prompts.ts` - Prompts de IA com contexto automotivo
- `src/lib/ai/anomalyDetection.ts` - Sistema de detecção de anomalias
- `src/lib/ai/optimizationEngine.ts` - Motor de otimização
- `docs/ai/automotive-heuristics.md` - Premissas heurísticas automotivas
- `docs/ai/benchmarks.md` - Benchmarks de performance
- `docs/ai/quality-indicators.md` - Indicadores de qualidade

## Tecnologias Utilizadas

- OpenAI GPT-4 API
- React Hooks para gerenciamento de estado
- Tailwind CSS para estilização
- Framer Motion para animações
- Lucide React para ícones

## Próximos Passos

O PBI 22 está completamente implementado e funcional. Todas as funcionalidades de IA foram integradas com sucesso, incluindo as melhorias de UI e funcionalidade solicitadas pelo usuário.

---

**O PBI 22 foi concluído com sucesso, entregando um dashboard inteligente com capacidades avançadas de IA para análise e otimização de campanhas de marketing digital no setor automotivo.** 