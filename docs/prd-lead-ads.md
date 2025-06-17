
# PRD - Plataforma Inteligente de Lead Ads (Meta) com IA

## 1. Visão Geral do Produto

### 1.1 Resumo Executivo
Plataforma web inteligente para visualização e gerenciamento de performance de campanhas de Lead Ads do Facebook/Meta, com blocos de inteligência artificial integrados para análise preditiva, detecção de anomalias e otimização automática. Foco especial em campanhas de test drive e geração de leads para o setor automotivo.

### 1.2 Problema a Resolver
- Dificuldade em visualizar performance de campanhas de Lead Ads em tempo real
- Falta de centralização de dados de múltiplas campanhas
- Ausência de alertas automáticos para anomalias em campanhas
- Complexidade na exportação e gestão de leads gerados
- **NOVO**: Análise manual demorada para identificar problemas e oportunidades
- **NOVO**: Falta de insights acionáveis em linguagem natural
- **NOVO**: Dificuldade em detectar fraudes e tráfego de baixa qualidade
- **NOVO**: Processo manual para criação de copies otimizadas

### 1.3 Solução Proposta
Dashboard interativo com inteligência artificial que não apenas visualiza dados, mas também:
- Analisa e explica variações de performance em linguagem natural
- Detecta automaticamente anomalias como tráfego incentivado ou conversões suspeitas
- Sugere otimizações baseadas em dados históricos
- Responde perguntas complexas sobre as campanhas via chat
- Gera automaticamente textos otimizados para anúncios

## 2. Objetivos do Produto

### 2.1 Objetivos Primários
- **Centralizar dados**: Unificar informações de todas as campanhas de Lead Ads em um único painel
- **Automatizar coleta**: Sincronização automática de dados a cada 6 horas
- **Facilitar análise**: Visualizações claras de métricas-chave e tendências
- **Agilizar gestão**: Exportação rápida de leads e relatórios
- **NOVO - Inteligência Acionável**: Fornecer insights em linguagem natural sobre performance
- **NOVO - Detecção Proativa**: Identificar automaticamente anomalias e fraudes
- **NOVO - Otimização Assistida**: Sugerir melhorias baseadas em IA
- **NOVO - Automação Criativa**: Gerar copies otimizadas automaticamente

### 2.2 Métricas de Sucesso
- Redução de 80% no tempo gasto para análise de campanhas
- 100% de automação na coleta de dados
- Zero necessidade de acesso direto ao Meta Business Manager para visualizações básicas
- Tempo de carregamento do dashboard < 3 segundos
- **NOVO**: 90% de precisão na detecção de anomalias
- **NOVO**: 70% de adoção das sugestões de otimização da IA
- **NOVO**: Aumento de 30% no CTR com copies geradas por IA
- **NOVO**: Redução de 50% no tempo de investigação de problemas

## 3. Usuários-Alvo

### 3.1 Persona Primária
**Gestor de Marketing Digital**
- Responsável por múltiplas campanhas de lead generation
- Precisa de relatórios rápidos para tomada de decisão
- Não possui conhecimento técnico avançado
- Gerencia campanhas de 5-20 clientes simultâneos

### 3.2 Persona Secundária
**Analista de Performance**
- Foco em otimização de campanhas
- Necessita dados detalhados e históricos
- Exporta dados para análises avançadas
- Monitora anomalias e tendências

## 4. Requisitos Funcionais

### 4.1 Sincronização de Dados
- **RF01**: Sistema deve buscar dados da API Meta a cada 6 horas
- **RF02**: Deve armazenar histórico de até 60 dias
- **RF03**: Sincronização manual deve estar disponível via botão
- **RF04**: Log de sincronizações deve ser visível no painel

### 4.2 Visualização de Campanhas
- **RF05**: Listar todas as campanhas com status visual (ativo/pausado)
- **RF06**: Mostrar métricas principais: gastos, impressões, cliques, leads
- **RF07**: Filtros por: data, status, nome, orçamento
- **RF08**: Ordenação por qualquer coluna de métrica

### 4.3 Gestão de Leads (Baixa Prioridade)
- **RF09**: Visualizar leads gerados por campanha
- **RF10**: Exportar leads em formato CSV/Excel
- **RF11**: Filtrar leads por período e campanha
- **RF12**: Marcar status de leads (novo/contatado/convertido)

### 4.4 Dashboard de Performance
- **RF13**: Gráfico de evolução de gastos diários
- **RF14**: Taxa de conversão por campanha
- **RF15**: Custo por lead (CPL) com tendências
- **RF16**: Comparativo entre campanhas

### 4.5 Sistema de Alertas
- **RF17**: Alertar campanhas com gasto acima do esperado
- **RF18**: Notificar campanhas pausadas inesperadamente
- **RF19**: Avisar sobre queda brusca de performance
- **RF20**: Enviar resumo diário por email

### 4.6 Inteligência Artificial - Análise de Desempenho
- **RF21**: Explicar variações de CPL em linguagem natural
- **RF22**: Analisar flutuações de taxa de conversão com contexto
- **RF23**: Identificar padrões de tráfego anormais
- **RF24**: Gerar relatórios explicativos automáticos
- **RF25**: Comparar performance com benchmarks do setor

### 4.7 Inteligência Artificial - Insights de Otimização
- **RF26**: Sugerir ajustes de segmentação baseados em dados
- **RF27**: Recomendar mudanças em criativos por performance
- **RF28**: Otimizar distribuição de verba entre campanhas
- **RF29**: Identificar melhores horários e dias para veiculação
- **RF30**: Sugerir pausar/reativar campanhas automaticamente

### 4.8 Inteligência Artificial - Detecção de Anomalias
- **RF31**: Detectar conversões manuais suspeitas
- **RF32**: Identificar tráfego incentivado ou bot
- **RF33**: Alertar sobre taxa de conversão anormalmente alta
- **RF34**: Detectar leads duplicados ou fraudulentos
- **RF35**: Monitorar qualidade de leads em tempo real

### 4.9 Assistente Virtual para Operadores
- **RF36**: Interface de chat para perguntas sobre campanhas
- **RF37**: Responder queries como "quais campanhas geraram leads inválidos hoje?"
- **RF38**: Busca semântica em dados históricos
- **RF39**: Geração de insights sob demanda
- **RF40**: Treinamento contextual sobre melhores práticas

### 4.10 Geração Automática de Conteúdo
- **RF41**: Criar títulos otimizados baseados em performance histórica
- **RF42**: Gerar descrições e copies para anúncios
- **RF43**: Sugerir CTAs com base em melhores conversões
- **RF44**: Adaptar tom de voz por segmento de público
- **RF45**: A/B testing automático de copies geradas

## 5. Requisitos Não-Funcionais

### 5.1 Performance
- **RNF01**: Página inicial deve carregar em < 3 segundos
- **RNF02**: Filtros devem responder em < 1 segundo
- **RNF03**: Exportação de até 10.000 leads em < 30 segundos

### 5.2 Segurança
- **RNF04**: Dados sensíveis criptografados no banco
- **RNF05**: Autenticação obrigatória para acesso
- **RNF06**: Log de todas as ações dos usuários
- **RNF07**: Tokens da API Meta armazenados com segurança

### 5.3 Usabilidade
- **RNF08**: Interface responsiva (desktop e mobile)
- **RNF09**: Design intuitivo sem necessidade de treinamento
- **RNF10**: Mensagens de erro claras e acionáveis

### 5.4 Disponibilidade
- **RNF11**: Sistema disponível 99.5% do tempo
- **RNF12**: Backup diário dos dados
- **RNF13**: Recuperação de falhas em < 1 hora

### 5.5 Inteligência Artificial
- **RNF14**: Tempo de resposta da IA < 5 segundos
- **RNF15**: Explicações em português brasileiro natural
- **RNF16**: Contexto de conversação mantido por 30 minutos
- **RNF17**: Limite de 100 requisições de IA por hora por usuário
- **RNF18**: Fallback para análise básica se IA indisponível

## 6. Arquitetura Técnica

### 6.1 Stack Tecnológico
- **Frontend**: Next.js 14 + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **Hospedagem**: Vercel (frontend) + Supabase (backend)
- **Automação**: GitHub Actions
- **API Externa**: Meta Graph API v18.0
- **NOVO - IA**: Vercel AI SDK + OpenAI/Anthropic API
- **NOVO - Vector DB**: Supabase pgvector para embeddings
- **NOVO - Cache IA**: Redis/Upstash para respostas frequentes

### 6.2 Estrutura de Dados

#### Tabela: campaigns
```
- id (UUID)
- campaign_id (string)
- name (string)
- status (enum: ACTIVE, PAUSED, DELETED)
- budget_remaining (numeric)
- created_time (timestamp)
- updated_time (timestamp)
```

#### Tabela: adsets
```
- id (UUID)
- adset_id (string)
- campaign_id (string)
- name (string)
- status (enum)
- targeting (jsonb)
- created_time (timestamp)
```

#### Tabela: ads
```
- id (UUID)
- ad_id (string)
- adset_id (string)
- name (string)
- creative (jsonb)
- metrics (jsonb)
- created_time (timestamp)
```

#### Tabela: leads
```
- id (UUID)
- lead_id (string)
- campaign_id (string)
- form_data (jsonb)
- status (enum: NEW, CONTACTED, CONVERTED)
- created_time (timestamp)
```

#### Tabela: ai_insights
```
- id (UUID)
- campaign_id (string)
- insight_type (enum: PERFORMANCE, ANOMALY, OPTIMIZATION)
- content (text)
- confidence_score (float)
- action_taken (boolean)
- created_at (timestamp)
```

#### Tabela: ai_conversations
```
- id (UUID)
- user_id (string)
- messages (jsonb[])
- context (jsonb)
- created_at (timestamp)
- updated_at (timestamp)
```

#### Tabela: generated_content
```
- id (UUID)
- campaign_id (string)
- content_type (enum: TITLE, DESCRIPTION, CTA)
- original_text (text)
- generated_text (text)
- performance_score (float)
- used_in_campaign (boolean)
- created_at (timestamp)
```

## 7. Roadmap de Desenvolvimento

### Fase 1: MVP (Concluído)
- ✅ Setup do banco de dados
- ✅ Integração básica com API Meta
- ✅ Interface de listagem de campanhas
- ✅ Deploy e automação básica

### Fase 2: Funcionalidades Core (Em Andamento)
- 🔄 Filtros avançados no painel
- ⏳ Dashboard de performance com gráficos
- ⏳ Sistema de gestão de leads
- ⏳ Exportação de dados

### Fase 3: Inteligência Artificial (Nova)
- ⏳ Integração Vercel AI SDK
- ⏳ Análise de desempenho em linguagem natural
- ⏳ Sistema de detecção de anomalias
- ⏳ Assistente virtual básico
- ⏳ Geração de insights automáticos

### Fase 4: Features Avançadas com IA
- ⏳ Otimização automática de campanhas
- ⏳ Geração de copies com IA
- ⏳ Predição de performance
- ⏳ Sistema avançado de scoring de leads
- ⏳ Relatórios inteligentes automatizados

### Fase 5: Otimizações e Escala
- ⏳ Cache inteligente com IA
- ⏳ API própria com endpoints de IA
- ⏳ Marketplace de prompts otimizados
- ⏳ App mobile com assistente integrado

## 8. Riscos e Mitigações

### 8.1 Riscos Técnicos
| Risco | Impacto | Probabilidade | Mitigação |
|-------|---------|---------------|-----------|
| Mudanças na API Meta | Alto | Média | Versionamento e testes automatizados |
| Limite de rate da API | Médio | Alta | Sistema de queue e retry |
| Volume de dados | Alto | Média | Paginação e arquivamento |
| Custos de API de IA | Alto | Alta | Cache agressivo e limites por usuário |
| Latência da IA | Médio | Média | Processamento assíncrono |
| Qualidade dos insights IA | Alto | Baixa | Fine-tuning e feedback loop |

### 8.2 Riscos de Negócio
| Risco | Impacto | Probabilidade | Mitigação |
|-------|---------|---------------|-----------|
| Baixa adoção | Alto | Média | MVP com early adopters |
| Concorrência | Médio | Alta | Foco em UX e features únicas |

## 9. Cronograma Estimado

### Sprint 1-2 (Atual)
- Completar filtros interativos
- Implementar gráfico básico de gastos

### Sprint 3-4
- Sistema completo de leads
- Exportação CSV

### Sprint 5-6
- Dashboard de performance completo
- Sistema de alertas básico

### Sprint 7-8
- Multi-tenant (múltiplos clientes)
- Relatórios automatizados

## 10. Critérios de Aceitação

### Para o MVP Expandido
1. Usuário consegue ver todas suas campanhas em uma tela
2. Filtros funcionam em tempo real
3. Gráficos mostram tendências dos últimos 30 dias
4. Leads podem ser exportados em CSV
5. Sistema sincroniza automaticamente a cada 6 horas

### Para Versão 1.0
1. Dashboard completo com todas as métricas
2. Sistema de alertas funcionando
3. Suporte a múltiplos clientes
4. Performance dentro dos limites estabelecidos
5. Documentação completa para usuários

## 11. Glossário

- **Lead Ads**: Formato de anúncio do Facebook para captura de leads
- **CPL**: Custo Por Lead
- **CR**: Conversion Rate (Taxa de Conversão)
- **Edge Functions**: Funções serverless do Supabase
- **RLS**: Row Level Security (segurança em nível de linha)
- **Meta Graph API**: API oficial do Facebook/Meta para dados
- **Test Drive**: Formulário específico para agendamento de test drive de veículos
- **Vercel AI SDK**: SDK para integração com modelos de IA
- **Embeddings**: Representação vetorial de textos para busca semântica
- **Tráfego Incentivado**: Visitas/cliques obtidos através de recompensas
- **Fine-tuning**: Ajuste fino de modelos de IA para casos específicos

## 12. Anexos

### A. Fluxo de Sincronização
1. GitHub Actions dispara a cada 6h
2. Chama Edge Function no Supabase
3. Function busca dados na API Meta
4. Dados são processados e salvos
5. Log de execução é registrado

### B. Estrutura de Pastas do Projeto
```
/
├── docs/
│   ├── PRD.md (este documento)
│   ├── architecture.md
│   └── mvp_step_by_step.md
├── frontend/
│   ├── pages/
│   ├── components/
│   │   ├── ai/
│   │   │   ├── InsightCard.tsx
│   │   │   ├── ChatAssistant.tsx
│   │   │   └── AnomalyAlert.tsx
│   │   └── dashboard/
│   ├── lib/
│   │   ├── ai/
│   │   │   ├── prompts.ts
│   │   │   └── analysis.ts
│   │   └── api/
│   └── styles/
├── supabase/
│   ├── functions/
│   │   ├── sync-meta-data/
│   │   ├── analyze-performance/
│   │   └── generate-content/
│   └── migrations/
└── .github/
    └── workflows/
```

### C. Comandos Úteis
- Deploy frontend: `vercel --prod`
- Deploy function: `supabase functions deploy`
- Sincronização manual: Acessar Supabase Dashboard > Functions > Run
- Testar IA local: `npm run dev:ai`
- Gerar embeddings: `supabase functions invoke generate-embeddings`

### D. Exemplos de Uso da IA

#### Análise de Desempenho
**Pergunta**: "Por que o CPL aumentou 40% esta semana?"
**Resposta IA**: "Analisando os dados, identifiquei 3 fatores principais:
1. A segmentação foi expandida para incluir interesses mais amplos na terça
2. O orçamento diário aumentou 60%, causando entrega acelerada
3. Novo criativo tem CTR 30% menor que o anterior"

#### Sugestão de Audiências
**Insight Automático**: "📊 Oportunidade Identificada: Seus leads de alta qualidade compartilham 3 características:
- Idade: 35-45 anos
- Interesse: 'Carros de luxo' + 'Tecnologia automotiva'
- Localização: Raio de 15km do centro

Recomendo criar uma Lookalike Audience 1% baseada nos 500 melhores conversores dos últimos 30 dias."

#### Detecção de Sobreposição
**Alerta**: "⚠️ As campanhas 'SUV Premium' e 'Test Drive Executivo' têm 67% de sobreposição de público. Isso está causando competição interna e aumentando o CPM em 23%. Sugiro excluir a audiência da campanha 'SUV Premium' da outra campanha."

#### Geração de Copy
**Input**: Gerar título para campanha de test drive SUV
**Output IA**: 
- "Experimente a Potência: Test Drive Grátis do Novo SUV"
- "Agende Seu Test Drive e Ganhe Brindes Exclusivos"
- "Conheça o SUV dos Seus Sonhos - Reserve Agora"

---

**Última atualização**: Junho 2025  
**Versão**: 2.0  
**Responsável**: [Seu Nome]