# Dashboard de Lead Ads com Inteligência Artificial

Plataforma web inteligente para visualização e gerenciamento de performance de campanhas de Lead Ads do Facebook/Meta, com blocos de inteligência artificial integrados para análise preditiva, detecção de anomalias e otimização automática.

## 🚀 Funcionalidades

### 📊 Dashboard de Performance
- Visualização em tempo real de métricas de campanhas
- Gráficos interativos e filtros avançados
- Sincronização automática com Meta API (3x por dia)
- Interface ultra-refinada inspirada em Apple Vision Pro

### 🤖 Inteligência Artificial
- **Análise de Performance**: Explicações em linguagem natural sobre variações de métricas
- **Detecção de Anomalias**: Identificação automática de padrões suspeitos e fraudes
- **Sugestões de Otimização**: Recomendações baseadas em dados históricos
- **Assistente Virtual**: Chat para tirar dúvidas sobre campanhas

### 📈 Análise Granular
- Página `/performance`: Listagem de campanhas com métricas detalhadas
- Página `/adsets`: Análise por adsets com filtros por campanha
- Página `/ads`: Visualização de ads individuais com preview de criativos
- Exportação de dados em CSV/Excel

### 🔄 Sincronização Automática
- Integração completa com Meta Graph API
- Atualização automática de dados via GitHub Actions
- Cache inteligente para performance otimizada
- Relacionamentos automáticos entre tabelas

## 🛠️ Stack Tecnológico

- **Frontend**: Next.js 14 + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **IA**: OpenAI GPT-4 via API
- **Hospedagem**: Vercel (frontend) + Supabase (backend)
- **Automação**: GitHub Actions
- **API Externa**: Meta Graph API v18.0

## 📋 Pré-requisitos

### Contas e APIs Necessárias
1. **Meta Business**: Conta com acesso às campanhas
2. **Supabase**: Projeto configurado
3. **OpenAI**: Conta paga com API key (para funcionalidades de IA)
4. **Vercel**: Para deploy (opcional)

### Variáveis de Ambiente
Crie um arquivo `.env.local` na raiz do projeto:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anonima
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role

# Meta API
META_ACCESS_TOKEN=seu-token-meta
META_ACCOUNT_ID=seu-account-id

# OpenAI (para funcionalidades de IA)
OPENAI_API_KEY=sk-proj-sua-chave-openai
```

## 🚀 Instalação e Setup

### 1. Clone o Repositório
```bash
git clone [url-do-repositorio]
cd frontend-leads-main
```

### 2. Instale Dependências
```bash
npm install
```

### 3. Configure Banco de Dados
```bash
# Execute as migrações do Supabase
npx supabase db push
```

### 4. Inicie o Servidor
```bash
npm run dev
```

Acesse: http://localhost:3000

## 🤖 Configuração da IA

### 1. Obter Chave OpenAI
1. Acesse [platform.openai.com](https://platform.openai.com)
2. Crie uma conta e adicione método de pagamento
3. Gere uma API Key em **API Keys**
4. Adicione a chave no `.env.local`

### 2. Custos Estimados
- **Uso Típico**: $200-800/mês (100 análises/dia)
- **Cache implementado**: Reduz custos em ~40%
- **Limites**: 100 requests/hora por usuário

### 3. Verificar Configuração
- Acesse `/performance`
- Clique no painel "Análise Inteligente"
- Se configurado corretamente, verá opções de análise

## 📖 Documentação Completa

### Guias de IA
- **[Guia Completo da OpenAI](./docs/openai-guide.md)**: Manual detalhado de uso
- **[Boas Práticas de IA](./docs/ai-best-practices.md)**: Otimização e qualidade
- **[FAQ da IA](./docs/ai-faq.md)**: Perguntas frequentes e soluções

### Documentação Técnica
- **[PRD Completo](./docs/prd-lead-ads.md)**: Especificação completa do produto
- **[Arquitetura](./docs/architecture.md)**: Visão técnica do sistema
- **[Problemas e Soluções](./docs/PROBLEMS.md)**: Troubleshooting

## 🔧 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev          # Servidor de desenvolvimento
npm run build        # Build de produção
npm run start        # Servidor de produção

# Testes
npm test             # Testes unitários
npm run test:e2e     # Testes end-to-end
npm run test:watch   # Testes em modo watch

# Sincronização de Dados
node scripts/sync-campaigns-once.js    # Sincronizar campanhas
node scripts/sync-adsets-once.js       # Sincronizar adsets
node scripts/sync-recent-insights.js   # Sincronizar insights
```

## 📊 Funcionalidades de IA Disponíveis

### 1. Análise de Performance 📈
```
Exemplo de saída:
"Suas campanhas geraram 368 leads com investimento de R$ 15.309, 
resultando em um CPL médio de R$ 41,60. A campanha 'SUV Premium' 
teve o melhor desempenho com CPL de R$ 35,20..."
```

### 2. Detecção de Anomalias 🔍
- Tráfego incentivado (CTR anormalmente alto + baixa qualidade)
- Conversões manuais (padrões suspeitos de timing)
- Leads duplicados (mesmo telefone/email)
- Picos de custo inexplicados

### 3. Sugestões de Otimização 💡
- Ajustes de segmentação
- Melhorias em criativos
- Redistribuição de orçamento
- Otimização de horários

### 4. Assistente Virtual 🤖
```
Perguntas exemplo:
- "Por que o CPL aumentou esta semana?"
- "Qual campanha teve melhor performance?"
- "Como melhorar a taxa de conversão?"
```

## 🔒 Segurança e Privacidade

### Dados Enviados para IA
✅ **Enviado**: Métricas agregadas (leads, gastos, CTR, CPL)  
❌ **NUNCA enviado**: Dados pessoais, emails, telefones, nomes

### Proteções Implementadas
- Sanitização automática de dados sensíveis
- Logs sem informações pessoais
- Cache local para reduzir chamadas externas
- Rate limiting por usuário

## 📈 Monitoramento e Métricas

### Dashboard de IA
- Custos em tempo real
- Performance das análises
- Cache hit rate
- Feedback dos usuários

### Alertas Automáticos
- 🚨 Custo > $200/dia
- ⚠️ Rate limit atingido
- 📊 Uso elevado detectado

## 🚨 Troubleshooting

### Problemas Comuns
- **"Invalid API Key"**: Verificar chave no `.env.local`
- **"Rate limit exceeded"**: Aguardar 1 minuto, retry automático
- **Timeout**: Reduzir período de análise
- **Análises genéricas**: Usar períodos de 7+ dias

### Logs Úteis
```bash
# Logs do servidor
tail -f .next/server.log

# Logs específicos da IA
grep "AI Service" .next/server.log
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 📞 Suporte

- **Documentação**: Verifique os guias em `/docs`
- **Issues**: Use o sistema de issues do GitHub
- **IA/OpenAI**: Consulte o [FAQ da IA](./docs/ai-faq.md)

---

**Última atualização**: Junho 2025  
**Versão**: 2.0 (com IA)  
**Responsável**: Equipe de Desenvolvimento 