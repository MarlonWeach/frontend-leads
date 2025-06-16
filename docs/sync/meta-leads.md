# Sincronização de Leads do Meta Ads

Este documento descreve o sistema de sincronização de leads do Meta Ads com o Supabase.

## Status Atual

✅ **Funcional**: A sincronização está funcionando e processando dados corretamente  
⚠️ **Pendente**: Filtro de anúncios ativos (problema com parâmetro filtering da Meta API)  
⚠️ **Pendente**: Constraint única para upsert (usando INSERT simples por enquanto)

## Estrutura do Sistema

```
.
├── src/
│   └── services/
│       └── meta/
│           ├── ads.ts           # Serviço base para Meta API
│           └── syncLeads.ts     # Serviço de sincronização de leads
├── scripts/
│   └── sync-meta-leads.ts       # Script de execução
├── supabase/
│   └── migrations/
│       └── 20240516_clean_duplicate_leads.sql  # Função RPC e tabela de logs
└── .github/
    └── workflows/
        └── sync_ads.yml         # Workflow de sincronização automática
```

## Configuração

### Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto com as seguintes variáveis:

```env
SUPABASE_URL=sua_url_do_supabase
SUPABASE_SERVICE_ROLE_KEY=sua_chave_de_serviço
META_ACCESS_TOKEN=seu_token_de_acesso
META_ACCOUNT_ID=seu_id_de_conta
```

### Banco de Dados

Execute a migração do Supabase para criar a função RPC e tabela de logs:

```bash
# No diretório supabase
supabase db push
```

## Uso

### Sincronização Manual

Para executar a sincronização manualmente:

```bash
# Instalar dependências se necessário
npm install ts-node typescript @types/node dotenv

# Executar sincronização
npx ts-node scripts/sync-meta-leads.ts
```

### Sincronização Automática

A sincronização é executada automaticamente a cada hora através do GitHub Actions.

Para acionar manualmente:
1. Acesse a aba "Actions" no GitHub
2. Selecione o workflow "Sync Meta Ads Data"
3. Clique em "Run workflow"

## Funcionalidades

### Serviço de Sincronização (`MetaLeadsSyncService`)

- **Retry com Exponential Backoff**
  - Tenta novamente em caso de falhas temporárias
  - Aumenta o tempo entre tentativas exponencialmente
  - Configurável via `retryAttempts` e `retryDelay`

- **Processamento de Dados**
  - Busca insights de anúncios da Meta API
  - Extrai dados de leads dos resultados
  - Transforma dados para formato do Supabase
  - Insere dados na tabela `meta_leads`

- **Logs Detalhados**
  - Registra início e fim da sincronização
  - Loga erros e tentativas de retry
  - Mantém histórico na tabela `sync_logs`

### Dados Sincronizados

Para cada anúncio com leads, são sincronizados:
- `ad_id`, `ad_name`, `campaign_name`, `adset_name`
- `spend`, `impressions`, `clicks`, `cpc`, `cpm`, `ctr`
- `lead_count` (extraído de `results` com indicador `actions:onsite_conversion.lead_grouped`)
- `raw_data` (dados completos da API)
- `created_time` (data do registro)

### Função RPC no Supabase

- **Limpeza de Duplicatas**
  - Remove registros duplicados mantendo o mais recente
  - Usa índices para melhor performance
  - Registra operações na tabela `sync_logs`

### Monitoramento

1. **Logs do Script**
   - Saída no console durante execução
   - Detalhes de erros e tentativas

2. **Tabela `sync_logs`**
   - Histórico de operações
   - Status e detalhes de cada sincronização

3. **GitHub Actions**
   - Status das execuções automáticas
   - Issues criadas em caso de falha

4. **Dashboard**
   - Métricas atualizadas em tempo real
   - Indicadores de status da sincronização

## Limitações Conhecidas

### 1. Filtro de Anúncios Ativos
**Status**: Pendente  
**Problema**: O parâmetro `filtering` da Meta API está retornando erro "OAuthException"  
**Workaround**: Por enquanto, todos os anúncios são sincronizados (ativos e inativos)  
**Solução Futura**: Implementar filtro em nível de aplicação ou usar endpoint diferente

### 2. Constraint Única
**Status**: Pendente  
**Problema**: Tabela `meta_leads` não possui constraint única para upsert  
**Workaround**: Usando INSERT simples (pode gerar duplicatas)  
**Solução Futura**: Criar constraint única em `(created_time, ad_id)` e usar upsert

## Troubleshooting

### Erros Comuns

1. **Module not found**
   ```bash
   Error: Cannot find module '.../src/services/meta/syncLeads'
   ```
   **Solução**: Verifique se o arquivo está no caminho correto e se o TypeScript está configurado para resolver módulos corretamente.

2. **Erro de Autenticação**
   ```bash
   Meta API Error: Invalid access token
   ```
   **Solução**: Verifique se o `META_ACCESS_TOKEN` está válido e tem as permissões necessárias.

3. **Erro de time_range**
   ```bash
   param time_range must be non-empty
   ```
   **Solução**: Certifique-se de que o parâmetro `time_range` está sendo serializado corretamente com `encodeURIComponent(JSON.stringify(...))`.

4. **Erro de Constraint**
   ```bash
   there is no unique or exclusion constraint matching the ON CONFLICT specification
   ```
   **Solução**: Por enquanto, o sistema usa INSERT simples. Para implementar upsert, é necessário criar uma constraint única na tabela.

### Logs e Debug

Para debug detalhado, adicione a variável de ambiente:
```bash
DEBUG=meta-sync:* npx ts-node scripts/sync-meta-leads.ts
```

## Próximos Passos

1. **Implementar Constraint Única**
   - Criar constraint em `(created_time, ad_id)`
   - Modificar código para usar upsert

2. **Resolver Filtro de Anúncios Ativos**
   - Investigar problema com parâmetro `filtering`
   - Implementar filtro alternativo se necessário

3. **Otimizações**
   - Implementar paginação para grandes volumes
   - Adicionar cache para reduzir chamadas à API
   - Melhorar tratamento de erros

## Manutenção

### Limpeza de Dados

Para limpar dados antigos:
```sql
-- Limpar logs antigos
DELETE FROM sync_logs WHERE created_at < NOW() - INTERVAL '30 days';

-- Limpar leads antigos (opcional)
DELETE FROM meta_leads WHERE created_time < NOW() - INTERVAL '90 days';
```

### Atualização de Token

1. Gere novo token no Meta Business Manager
2. Atualize a variável `META_ACCESS_TOKEN`
3. Teste a sincronização manualmente
4. Verifique os logs para confirmar funcionamento

## Contribuição

1. Crie uma branch para sua feature
2. Implemente as mudanças
3. Adicione testes
4. Atualize a documentação
5. Crie um Pull Request 