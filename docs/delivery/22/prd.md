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